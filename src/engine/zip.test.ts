import { describe, test, expect } from 'bun:test';
import { createZip } from './zip';

/**
 * Testes deterministicos do escritor de ZIP sem dependencias.
 *
 * As asserções checam a estrutura binaria real do arquivo gerado: assinatura
 * de local file header no offset 0 (PK\x03\x04), presenca do registro de fim do
 * diretorio central (PK\x05\x06) e que a contagem de arquivos no End Of Central
 * Directory bate com o numero de arquivos de entrada. Qualquer regressao no
 * escritor (offsets, assinaturas, contagem) faria estes testes falharem.
 */

async function zipBytes(
  files: { path: string; content: string }[],
): Promise<Uint8Array> {
  const blob = createZip(files);
  return new Uint8Array(await blob.arrayBuffer());
}

/** Le um u16 little-endian em `offset`. */
function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

describe('createZip', () => {
  test('produz um Blob application/zip', () => {
    const blob = createZip([{ path: 'a.txt', content: 'ola' }]);
    expect(blob.type).toBe('application/zip');
  });

  test('escreve a assinatura PK\\x03\\x04 do local file header no offset 0', async () => {
    const bytes = await zipBytes([{ path: 'a.txt', content: 'ola mundo' }]);
    expect(bytes[0]).toBe(0x50); // P
    expect(bytes[1]).toBe(0x4b); // K
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  test('contem o End Of Central Directory (PK\\x05\\x06) e a contagem bate', async () => {
    const files = [
      { path: 'index.html', content: '<!doctype html><title>x</title>' },
      { path: 'src/App.tsx', content: 'export const App = () => null;' },
      { path: 'package.json', content: '{"name":"x"}' },
    ];
    const bytes = await zipBytes(files);

    // O EOCD tem tamanho fixo (22 bytes) quando nao ha comentario.
    const eocdOffset = bytes.length - 22;
    expect(bytes[eocdOffset]).toBe(0x50); // P
    expect(bytes[eocdOffset + 1]).toBe(0x4b); // K
    expect(bytes[eocdOffset + 2]).toBe(0x05);
    expect(bytes[eocdOffset + 3]).toBe(0x06);

    // Total de registros no diretorio central (offset +10 dentro do EOCD).
    const totalEntries = readU16(bytes, eocdOffset + 10);
    expect(totalEntries).toBe(files.length);
  });

  test('honra caminhos com subdiretorios usando separador /', async () => {
    const bytes = await zipBytes([
      { path: 'src/components/Card.tsx', content: 'x' },
    ]);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('src/components/Card.tsx');
  });

  test('e deterministico para a mesma entrada', async () => {
    const files = [{ path: 'a.txt', content: 'conteudo' }];
    const first = await zipBytes(files);
    const second = await zipBytes(files);
    expect(first.length).toBe(second.length);
    expect(Array.from(first)).toEqual(Array.from(second));
  });

  test('inclui uma assinatura de central directory (PK\\x01\\x02) por arquivo', async () => {
    const files = [
      { path: 'a.txt', content: 'a' },
      { path: 'b.txt', content: 'b' },
    ];
    const bytes = await zipBytes(files);
    let count = 0;
    for (let i = 0; i < bytes.length - 3; i++) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x01 &&
        bytes[i + 3] === 0x02
      ) {
        count++;
      }
    }
    expect(count).toBe(files.length);
  });
});
