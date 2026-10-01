import type { AgentRoleId, GeneratedFile } from '../types';
import type { LLMCompletionRequest, LLMProvider } from './LLMProvider';
import { serializeGeneratedFiles } from './fileFormat';

/**
 * Deterministic, fully offline implementation of {@link LLMProvider}.
 *
 * Cada papel retorna ARQUIVOS reais, pequenos e validos (nao prosa),
 * serializados no mesmo formato delimitado que o provider real deve produzir
 * (ver {@link serializeGeneratedFiles}). A saida e derivada puramente do papel
 * + prompt do usuario, SEM rede e SEM aleatoriedade: a mesma entrada sempre
 * gera a mesma saida, o que torna os testes do engine reproduziveis.
 *
 * Este mock substitui um modelo real enquanto o sandbox nao tem acesso a APIs
 * externas de LLM. Veja {@link LLMProvider} para trocar por um backend real.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';

  async complete(req: LLMCompletionRequest): Promise<string> {
    const prompt = req.prompt.trim();
    const builder = FILE_BUILDERS[req.role];
    return serializeGeneratedFiles(builder(prompt));
  }
}

/** Normalize a prompt into a short, slug-ish project label. */
function projectLabel(prompt: string): string {
  const firstLine = prompt.split('\n')[0]?.trim() ?? '';
  if (firstLine.length === 0) return 'Projeto Web';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}

/** Deriva um slug seguro (ascii, minusculo, com hifens) a partir do prompt. */
function projectSlug(prompt: string): string {
  const base = projectLabel(prompt)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base.length > 0 ? base : 'projeto-web';
}

/**
 * Um construtor deterministico de ARQUIVOS por papel. Cada arquivo e valido
 * para seu tipo (JSON parseavel, HTML valido, componente .tsx, etc.), embute o
 * prompt do usuario (para provar que a saida deriva do pedido) e inclui um
 * marcador unico do papel para que os testes verifiquem conteudo especifico.
 */
const FILE_BUILDERS: Record<AgentRoleId, (prompt: string) => GeneratedFile[]> = {
  ceo: (prompt) => {
    const label = projectLabel(prompt);
    const slug = projectSlug(prompt);
    const pkg = {
      name: slug,
      version: '0.1.0',
      private: true,
      description: `Plano de projeto gerado pela IA CEO para: ${label}`,
      scripts: {
        dev: 'vite',
        build: 'vite build',
        start: 'node server/index.js',
      },
    };
    return [
      {
        path: 'package.json',
        content: JSON.stringify(pkg, null, 2),
      },
      {
        path: 'PLAN.md',
        content: [
          `# Plano de Projeto (CEO)`,
          ``,
          `Objetivo: ${label}`,
          ``,
          `Divisao de tarefas por equipe:`,
          `1. [architect] Definir arquitetura e modelo de banco de dados.`,
          `2. [frontend] Construir a interface web e os componentes.`,
          `3. [backend] Implementar a API e a logica de servidor.`,
          `4. [integrator] Integrar front-end e back-end e validar o sistema.`,
        ].join('\n'),
      },
    ];
  },

  architect: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: 'db/schema.sql',
        content: [
          `-- Arquitetura & Banco de Dados`,
          `-- Projeto: ${label}`,
          `CREATE TABLE users (`,
          `  id INTEGER PRIMARY KEY AUTOINCREMENT,`,
          `  name TEXT NOT NULL,`,
          `  email TEXT NOT NULL UNIQUE,`,
          `  created_at TEXT NOT NULL DEFAULT (datetime('now'))`,
          `);`,
          ``,
          `CREATE TABLE items (`,
          `  id INTEGER PRIMARY KEY AUTOINCREMENT,`,
          `  title TEXT NOT NULL,`,
          `  description TEXT,`,
          `  owner_id INTEGER NOT NULL REFERENCES users(id),`,
          `  created_at TEXT NOT NULL DEFAULT (datetime('now'))`,
          `);`,
        ].join('\n'),
      },
      {
        path: 'ARCHITECTURE.md',
        content: [
          `# Arquitetura & Banco de Dados`,
          ``,
          `Projeto: ${label}`,
          ``,
          `Estrutura de pastas sugerida:`,
          `- /src/components  (UI)`,
          `- /src/pages       (rotas)`,
          `- /server/api      (endpoints)`,
          `- /server/db       (acesso a dados)`,
        ].join('\n'),
      },
    ];
  },

  frontend: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: 'index.html',
        content: [
          `<!doctype html>`,
          `<html lang="pt-BR">`,
          `  <head>`,
          `    <meta charset="utf-8" />`,
          `    <meta name="viewport" content="width=device-width, initial-scale=1" />`,
          `    <title>${label}</title>`,
          `  </head>`,
          `  <body>`,
          `    <div id="root"></div>`,
          `    <script type="module" src="/src/main.tsx"></script>`,
          `  </body>`,
          `</html>`,
        ].join('\n'),
      },
      {
        path: 'src/components/ItemList.tsx',
        content: [
          `// Front-end: componente de listagem`,
          `// Projeto: ${label}`,
          `import { useEffect, useState } from 'react';`,
          ``,
          `interface Item {`,
          `  id: number;`,
          `  title: string;`,
          `}`,
          ``,
          `export function ItemList() {`,
          `  const [items, setItems] = useState<Item[]>([]);`,
          `  useEffect(() => {`,
          `    fetch('/api/items')`,
          `      .then((res) => res.json())`,
          `      .then((data: Item[]) => setItems(data));`,
          `  }, []);`,
          `  return (`,
          `    <ul>`,
          `      {items.map((item) => (`,
          `        <li key={item.id}>{item.title}</li>`,
          `      ))}`,
          `    </ul>`,
          `  );`,
          `}`,
        ].join('\n'),
      },
    ];
  },

  backend: (prompt) => {
    const label = projectLabel(prompt);
    return [
      {
        path: 'server/index.ts',
        content: [
          `// Back-end / API`,
          `// Projeto: ${label}`,
          `import { createServer } from 'node:http';`,
          `import { items } from './routes/items';`,
          ``,
          `const server = createServer((req, res) => {`,
          `  if (req.url === '/api/items' && req.method === 'GET') {`,
          `    res.setHeader('Content-Type', 'application/json');`,
          `    res.end(JSON.stringify(items));`,
          `    return;`,
          `  }`,
          `  res.statusCode = 404;`,
          `  res.end(JSON.stringify({ error: 'not found' }));`,
          `});`,
          ``,
          `server.listen(3000, () => console.log('API on :3000'));`,
        ].join('\n'),
      },
      {
        path: 'server/routes/items.ts',
        content: [
          `// Rotas de itens (API)`,
          `// Projeto: ${label}`,
          `export interface Item {`,
          `  id: number;`,
          `  title: string;`,
          `}`,
          ``,
          `export const items: Item[] = [`,
          `  { id: 1, title: 'Primeiro item' },`,
          `];`,
        ].join('\n'),
      },
    ];
  },

  integrator: (prompt) => {
    const label = projectLabel(prompt);
    const slug = projectSlug(prompt);
    return [
      {
        path: 'README.md',
        content: [
          `# Integracao & Verificacao`,
          ``,
          `Projeto: ${label}`,
          ``,
          `## Como rodar`,
          '```bash',
          `npm install`,
          `npm run build`,
          `npm start`,
          '```',
          ``,
          `## Relatorio de verificacao`,
          `- [ok] Rotas da API respondem conforme especificado.`,
          `- [ok] Interface renderiza e consome dados reais.`,
          `- [ok] Fluxo de autenticacao validado ponta a ponta.`,
          `- [ok] Build de producao concluido sem erros.`,
          ``,
          `Status final: TUDO FUNCIONANDO.`,
        ].join('\n'),
      },
      {
        path: '.env.example',
        content: [
          `# Variaveis de ambiente para ${slug}`,
          `PORT=3000`,
          `DATABASE_URL=sqlite://./db/${slug}.sqlite`,
        ].join('\n'),
      },
    ];
  },
};
