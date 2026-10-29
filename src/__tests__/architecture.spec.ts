/** Description: Teste de arquitetura: garante a regra de dependência da Clean Architecture (domain <- application <- UI; infrastructure -> domain). */
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

const SRC = path.resolve(__dirname, '..');

function listarArquivos(dir: string): string[] {
  const resultado: string[] = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__tests__') continue;
      resultado.push(...listarArquivos(caminho));
    } else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.d\.ts$/.test(entrada.name)) {
      resultado.push(caminho);
    }
  }
  return resultado;
}

function importsDe(arquivo: string): string[] {
  const conteudo = fs.readFileSync(arquivo, 'utf8');
  const regex = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const lista: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(conteudo))) lista.push(m[1] ?? m[2] ?? m[3]);
  return lista;
}

const relativo = (arquivo: string) => path.relative(SRC, arquivo).replace(/\\/g, '/');

const EXTERNOS_PROIBIDOS = /^(react|react-dom|react-native(\/.*)?|expo(-.*)?(\/.*)?|@expo\/.*)$/;
const toca = (imp: string, camada: string) =>
  new RegExp(`(^@/${camada}/)|((^|/)${camada}/)`).test(imp);

function violacoes(
  pasta: string,
  proibido: (imp: string) => boolean,
  ignorar: (rel: string) => boolean = () => false
): string[] {
  const achadas: string[] = [];
  for (const arquivo of listarArquivos(path.join(SRC, pasta))) {
    if (ignorar(relativo(arquivo))) continue;
    for (const imp of importsDe(arquivo)) {
      if (proibido(imp)) achadas.push(`${relativo(arquivo)} -> ${imp}`);
    }
  }
  return achadas;
}

describe('Arquitetura (Clean Architecture)', () => {
  it('domain não depende de application, infrastructure, UI nem frameworks', () => {
    const achadas = violacoes(
      'domain',
      imp =>
        toca(imp, 'application') ||
        toca(imp, 'infrastructure') ||
        toca(imp, 'app') ||
        toca(imp, 'components') ||
        toca(imp, 'hooks') ||
        toca(imp, 'providers') ||
        EXTERNOS_PROIBIDOS.test(imp)
    );
    expect(achadas).toEqual([]);
  });

  it('application só depende de domain (exceto o container, que é a composition root)', () => {
    const achadas = violacoes(
      'application',
      imp =>
        toca(imp, 'infrastructure') ||
        toca(imp, 'app') ||
        toca(imp, 'components') ||
        toca(imp, 'hooks') ||
        toca(imp, 'providers') ||
        EXTERNOS_PROIBIDOS.test(imp),
      rel => rel === 'application/di/container.ts'
    );
    expect(achadas).toEqual([]);
  });

  it('infrastructure não depende da camada de apresentação', () => {
    const achadas = violacoes(
      'infrastructure',
      imp =>
        toca(imp, 'app') || toca(imp, 'components') || toca(imp, 'hooks') || toca(imp, 'providers')
    );
    expect(achadas).toEqual([]);
  });

  it('Feed (UI) consome apenas casos de uso: sem infrastructure nem DIContainer.repositories/gateways', () => {
    const alvos = [
      ...listarArquivos(path.join(SRC, 'components', 'feed')),
      path.join(SRC, 'hooks', 'useFeed.ts'),
      path.join(SRC, 'app', '(app)', 'feed.tsx'),
    ].filter(f => fs.existsSync(f));

    expect(alvos.length).toBeGreaterThan(0);

    const achadas: string[] = [];
    for (const arquivo of alvos) {
      const conteudo = fs.readFileSync(arquivo, 'utf8');
      if (/DIContainer\.(repositories|gateways)/.test(conteudo)) achadas.push(`${relativo(arquivo)} usa DIContainer.repositories/gateways`);
      for (const imp of importsDe(arquivo)) {
        if (toca(imp, 'infrastructure')) achadas.push(`${relativo(arquivo)} -> ${imp}`);
      }
    }
    expect(achadas).toEqual([]);
  });
});

