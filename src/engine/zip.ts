/**
 * Gerador de arquivos ZIP sem dependencias e sem compressao (metodo "store",
 * method 0).
 *
 * POR QUE EXISTE: o app roda em um site estatico (GitHub Pages) e, no sandbox,
 * sob INTEGRATIONS_ONLY (sem rede). Por isso NAO podemos depender de uma lib de
 * zip via CDN nem de pacotes npm. Este modulo implementa, do zero e so com
 * tipos do DOM (Blob, Uint8Array, TextEncoder), um escritor de ZIP suficiente
 * para empacotar os arquivos gerados pela equipe de agentes e disponibiliza-los
 * para download no navegador.
 *
 * Formato implementado (PKZIP, armazenamento sem compressao):
 *   - Local File Header   (assinatura PK\x03\x04) + nome + dados crus por arquivo
 *   - Central Directory   (assinatura PK\x01\x02) um registro por arquivo
 *   - End Of Central Dir  (assinatura PK\x05\x06) fechando o arquivo
 *
 * Framework-agnostico: nao importa React. Pode ser testado isoladamente.
 */

/** Um arquivo a ser incluido no zip (caminho relativo + conteudo textual). */
export interface ZipInputFile {
  path: string;
  content: string;
}

/* ------------------------------------------------------------------ */
/* CRC32                                                               */
/* ------------------------------------------------------------------ */

/** Tabela de CRC32 computada uma unica vez (polinomio 0xEDB88320). */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/** Calcula o CRC32 de uma sequencia de bytes. */
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------------ */
/* Helpers de escrita little-endian                                    */
/* ------------------------------------------------------------------ */

/** Acumulador simples de bytes com escritas little-endian. */
class ByteWriter {
  private chunks: Uint8Array[] = [];
  private _length = 0;

  get length(): number {
    return this._length;
  }

  pushBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this._length += bytes.length;
  }

  pushU16(value: number): void {
    const b = new Uint8Array(2);
    b[0] = value & 0xff;
    b[1] = (value >>> 8) & 0xff;
    this.pushBytes(b);
  }

  pushU32(value: number): void {
    const b = new Uint8Array(4);
    b[0] = value & 0xff;
    b[1] = (value >>> 8) & 0xff;
    b[2] = (value >>> 16) & 0xff;
    b[3] = (value >>> 24) & 0xff;
    this.pushBytes(b);
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this._length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/* ------------------------------------------------------------------ */
/* Escritor de ZIP                                                     */
/* ------------------------------------------------------------------ */

const SIG_LOCAL = 0x04034b50; // "PK\x03\x04"
const SIG_CENTRAL = 0x02014b50; // "PK\x01\x02"
const SIG_END = 0x06054b50; // "PK\x05\x06"

interface CentralEntry {
  nameBytes: Uint8Array;
  crc: number;
  size: number;
  localHeaderOffset: number;
}

/**
 * Constroi um {@link Blob} ZIP (application/zip) sem compressao a partir de uma
 * lista de arquivos. Cada caminho e preservado (incluindo subdiretorios, ex.:
 * "src/App.tsx"), usando "/" como separador conforme o formato ZIP exige.
 * Nomes de arquivo e conteudo sao codificados em UTF-8.
 */
export function createZip(files: ZipInputFile[]): Blob {
  const encoder = new TextEncoder();
  const local = new ByteWriter();
  const central: CentralEntry[] = [];

  for (const file of files) {
    // ZIP usa sempre "/" como separador de diretorios.
    const normalizedPath = file.path.replace(/\\/g, '/').replace(/^\/+/, '');
    const nameBytes = encoder.encode(normalizedPath);
    const dataBytes = encoder.encode(file.content);
    const crc = crc32(dataBytes);
    const localHeaderOffset = local.length;

    // ---- Local File Header ----
    local.pushU32(SIG_LOCAL);
    local.pushU16(20); // versao minima necessaria (2.0)
    local.pushU16(0); // flags
    local.pushU16(0); // metodo de compressao: 0 = store
    local.pushU16(0); // hora de modificacao (fixo p/ saida deterministica)
    local.pushU16(0); // data de modificacao (fixo p/ saida deterministica)
    local.pushU32(crc); // CRC-32
    local.pushU32(dataBytes.length); // tamanho comprimido (== cru em store)
    local.pushU32(dataBytes.length); // tamanho descomprimido
    local.pushU16(nameBytes.length); // tamanho do nome
    local.pushU16(0); // tamanho do campo extra
    local.pushBytes(nameBytes);
    local.pushBytes(dataBytes);

    central.push({
      nameBytes,
      crc,
      size: dataBytes.length,
      localHeaderOffset,
    });
  }

  // ---- Central Directory ----
  const centralStart = local.length;
  const centralWriter = new ByteWriter();
  for (const entry of central) {
    centralWriter.pushU32(SIG_CENTRAL);
    centralWriter.pushU16(20); // versao que criou
    centralWriter.pushU16(20); // versao minima necessaria
    centralWriter.pushU16(0); // flags
    centralWriter.pushU16(0); // metodo de compressao: store
    centralWriter.pushU16(0); // hora de modificacao
    centralWriter.pushU16(0); // data de modificacao
    centralWriter.pushU32(entry.crc); // CRC-32
    centralWriter.pushU32(entry.size); // tamanho comprimido
    centralWriter.pushU32(entry.size); // tamanho descomprimido
    centralWriter.pushU16(entry.nameBytes.length); // tamanho do nome
    centralWriter.pushU16(0); // tamanho do campo extra
    centralWriter.pushU16(0); // tamanho do comentario
    centralWriter.pushU16(0); // numero do disco inicial
    centralWriter.pushU16(0); // atributos internos
    centralWriter.pushU32(0); // atributos externos
    centralWriter.pushU32(entry.localHeaderOffset); // deslocamento do header local
    centralWriter.pushBytes(entry.nameBytes);
  }
  const centralBytes = centralWriter.toUint8Array();

  // ---- End Of Central Directory ----
  const end = new ByteWriter();
  end.pushU32(SIG_END);
  end.pushU16(0); // numero deste disco
  end.pushU16(0); // disco onde comeca o diretorio central
  end.pushU16(central.length); // registros do diretorio central neste disco
  end.pushU16(central.length); // registros totais do diretorio central
  end.pushU32(centralBytes.length); // tamanho do diretorio central
  end.pushU32(centralStart); // deslocamento do inicio do diretorio central
  end.pushU16(0); // tamanho do comentario

  const parts: Uint8Array[] = [
    local.toUint8Array(),
    centralBytes,
    end.toUint8Array(),
  ];
  // Blob aceita BlobPart[]; Uint8Array e um BufferSource valido.
  return new Blob(parts as BlobPart[], { type: 'application/zip' });
}
