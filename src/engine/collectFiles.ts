import type { GeneratedFile, PipelineState, ProjectArtifact } from './types';

/**
 * Achata todos os {@link GeneratedFile} dos artefatos da pipeline em uma unica
 * lista pronta para o escritor de ZIP (ou para uma acao de "copiar").
 *
 * REGRA DE COLISAO DE CAMINHOS (deterministica e documentada):
 *   Os artefatos sao percorridos na ordem em que foram produzidos (CEO ->
 *   arquiteto -> front-end -> back-end -> integrador). Se dois papeis emitirem
 *   um arquivo com o MESMO caminho, o primeiro mantem o caminho original e os
 *   seguintes recebem um prefixo com o papel que os produziu, no formato
 *   "<papel>/<caminho>" (ex.: "backend/README.md"). Se, ainda assim, houver
 *   choque, acrescenta-se um sufixo numerico antes da extensao
 *   ("<papel>/README-2.md"). Assim nenhum arquivo e silenciosamente
 *   sobrescrito e a saida continua reproduzivel.
 */
export function collectGeneratedFiles(state: PipelineState): GeneratedFile[] {
  const result: GeneratedFile[] = [];
  const used = new Set<string>();

  for (const artifact of state.artifacts) {
    for (const file of artifact.files) {
      const path = resolveUniquePath(file.path, artifact, used);
      used.add(path);
      result.push({ ...file, path });
    }
  }

  return result;
}

/** Resolve um caminho unico aplicando a regra de colisao documentada acima. */
function resolveUniquePath(
  path: string,
  artifact: ProjectArtifact,
  used: Set<string>,
): string {
  if (!used.has(path)) return path;

  // Primeira colisao: prefixa com o papel que produziu o arquivo.
  const namespaced = `${artifact.producedByRole}/${path}`;
  if (!used.has(namespaced)) return namespaced;

  // Colisao persistente: adiciona sufixo numerico antes da extensao.
  const dot = namespaced.lastIndexOf('.');
  const base = dot > 0 ? namespaced.slice(0, dot) : namespaced;
  const ext = dot > 0 ? namespaced.slice(dot) : '';
  let n = 2;
  let candidate = `${base}-${n}${ext}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}${ext}`;
  }
  return candidate;
}

/** Quantidade total de arquivos gerados (util para habilitar o download). */
export function countGeneratedFiles(state: PipelineState): number {
  return state.artifacts.reduce((sum, a) => sum + a.files.length, 0);
}
