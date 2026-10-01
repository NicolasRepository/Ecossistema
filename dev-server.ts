/**
 * Servidor de desenvolvimento offline para o Ecossistema.
 *
 * Usa Bun.serve para servir os arquivos estaticos do projeto:
 *   - index.html (com o import map que carrega o React via CDN no navegador)
 *   - /dist/main.js (o bundle gerado por `NODE_OPTIONS= bun run build`)
 *   - /src/styles.css (o CSS do painel)
 *
 * Caminho mais simples e robusto: servir o dist/main.js ja construido + os
 * arquivos estaticos. Rode `NODE_OPTIONS= bun run build` antes para gerar o
 * dist/main.js, depois `NODE_OPTIONS= bun run dev`.
 *
 * NAO depende de rede: o unico recurso externo e o React, que o NAVEGADOR
 * busca no CDN via import map (ver index.html).
 */

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = import.meta.dir;

/** Content-type por extensao de arquivo. */
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function contentTypeFor(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot >= 0 ? path.slice(dot) : '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/** Resolve a URL para um caminho de arquivo seguro dentro do projeto. */
function resolvePath(pathname: string): string {
  // Rota raiz serve o index.html.
  let rel = pathname === '/' ? '/index.html' : pathname;
  // Normaliza e previne path traversal.
  rel = rel.replace(/\.{2,}/g, '');
  return `${ROOT}${rel}`;
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const url = new URL(request.url);
    const filePath = resolvePath(url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file, {
        headers: { 'content-type': contentTypeFor(filePath) },
      });
    }

    // Fallback para index.html (SPA): qualquer rota desconhecida renderiza o app.
    const index = Bun.file(`${ROOT}/index.html`);
    if (await index.exists()) {
      return new Response(index, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Nao encontrado', { status: 404 });
  },
});

console.log(`\nEcossistema rodando em: http://localhost:${server.port}`);
console.log('Dica: rode `NODE_OPTIONS= bun run build` antes para gerar dist/main.js.\n');
