import type { GeneratedFile } from '../types';

/**
 * Formato delimitado compartilhado entre o provider real e o mock.
 *
 * Cada arquivo e introduzido por uma linha de cabecalho no formato:
 *
 *   === FILE: caminho/do/arquivo.ext ===
 *
 * seguida pelo conteudo do arquivo ate o proximo cabecalho (ou o fim do
 * texto). Esse formato e simples o suficiente para um modelo real seguir e
 * deterministico o suficiente para o mock reproduzir, de modo que UM unico
 * parser ({@link parseGeneratedFiles}) transforma a saida bruta de qualquer
 * provider em {@link GeneratedFile}[].
 */

/** Expressao que casa uma linha de cabecalho de arquivo e captura o caminho. */
const FILE_HEADER = /^\s*===\s*FILE:\s*(.+?)\s*===\s*$/;

/** Constroi uma linha de cabecalho delimitadora para um dado caminho. */
export function fileHeader(path: string): string {
  return `=== FILE: ${path} ===`;
}

/**
 * Serializa uma lista de arquivos no formato delimitado. Usado pelo mock (e
 * util para testes/documentacao do provider real).
 */
export function serializeGeneratedFiles(files: GeneratedFile[]): string {
  return files
    .map((f) => `${fileHeader(f.path)}\n${f.content}`)
    .join('\n\n');
}

/** Infere uma linguagem simples a partir da extensao do caminho. */
export function inferLanguage(path: string): string | undefined {
  const match = /\.([a-z0-9]+)$/i.exec(path.trim());
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Converte a saida bruta de um provider em {@link GeneratedFile}[].
 *
 * Deterministico. Se nenhum cabecalho de arquivo for encontrado, faz fallback
 * gracioso para um unico arquivo (`fallbackPath`), de modo que a saida
 * arbitraria de um modelo real nunca quebre o pipeline.
 */
export function parseGeneratedFiles(
  raw: string,
  fallbackPath = 'output.txt',
): GeneratedFile[] {
  const lines = raw.split('\n');
  const files: GeneratedFile[] = [];
  let current: { path: string; body: string[] } | null = null;

  for (const line of lines) {
    const header = FILE_HEADER.exec(line);
    if (header) {
      if (current) {
        files.push(finalizeFile(current));
      }
      current = { path: header[1].trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) {
    files.push(finalizeFile(current));
  }

  if (files.length === 0) {
    const content = raw.trim();
    return [
      {
        path: fallbackPath,
        content,
        language: inferLanguage(fallbackPath),
      },
    ];
  }

  return files;
}

/** Fecha um arquivo em construcao, aparando linhas em branco nas bordas. */
function finalizeFile(current: { path: string; body: string[] }): GeneratedFile {
  // Remove linhas em branco iniciais/finais mantendo a indentacao interna.
  const body = [...current.body];
  while (body.length > 0 && body[0].trim() === '') body.shift();
  while (body.length > 0 && body[body.length - 1].trim() === '') body.pop();
  return {
    path: current.path,
    content: body.join('\n'),
    language: inferLanguage(current.path),
  };
}
