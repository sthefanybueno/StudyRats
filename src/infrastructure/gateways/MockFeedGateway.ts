/** Description: Adaptador Mock do feed da comunidade (substituível por Supabase sem alterar domínio/aplicação). */
import { FotoSessao } from '../../domain/entities/FotoSessao';
import { SessaoEstudo } from '../../domain/entities/SessaoEstudo';
import { Usuario } from '../../domain/entities/Usuario';
import { IFeedGateway, PaginaFeed, SessaoComunidade } from '../../domain/gateways/IFeedGateway';
import { Coordenada } from '../../domain/value-objects/Coordenada';

const AUTORES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena'];
const MATERIAS: [string, string][] = [
  ['Cálculo I', 'Derivadas'],
  ['Física', 'Cinemática'],
  ['Algoritmos', 'Recursão'],
  ['Banco de Dados', 'Normalização'],
  ['Inglês', 'Vocabulário'],
  ['Química', 'Estequiometria'],
];
const LOCAIS: [number, number][] = [
  [-19.9191, -43.9386],
  [-23.5505, -46.6333],
  [-22.9068, -43.1729],
  [-15.7939, -47.8828],
  [-30.0346, -51.2177],
];

export class MockFeedGateway implements IFeedGateway {
  private readonly base: SessaoComunidade[];

  constructor(total = 120, agora: Date = new Date()) {
    this.base = Array.from({ length: total }, (_, i) => this.criarItem(i, agora));
  }

  async obterFeed(cursor?: string, limite = 50): Promise<PaginaFeed> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const inicio = cursor ? Math.max(0, parseInt(cursor, 10) || 0) : 0;
    const fim = inicio + limite;

    return {
      itens: this.base.slice(inicio, fim),
      proximoCursor: fim < this.base.length ? String(fim) : undefined,
    };
  }

  /** Índice 0 = mais recente; cada sessão seguinte é ~37 min mais antiga. */
  private criarItem(i: number, agora: Date): SessaoComunidade {
    const id = `feed-${i}`;
    const [disciplinaNome, topicoNome] = MATERIAS[i % MATERIAS.length];
    const [latitude, longitude] = LOCAIS[i % LOCAIS.length];
    const nome = AUTORES[i % AUTORES.length];

    const sessao = SessaoEstudo.create({
      id,
      usuarioId: `autor-${i % AUTORES.length}`,
      disciplinaId: `disc-${i % MATERIAS.length}`,
      topicoId: `top-${i % MATERIAS.length}`,
      duracaoMinutos: 15 + ((i * 7) % 70),
      createdAt: new Date(agora.getTime() - i * 37 * 60 * 1000),
      coordenada: i % 4 === 3 ? undefined : Coordenada.create({ latitude, longitude }),
    });

    if (i % 3 === 0) {
      sessao.anexarFoto(
        FotoSessao.create({
          sessaoId: id,
          uriLocal: `file://mock/${id}.jpg`,
          urlRemota: `https://picsum.photos/seed/${id}/600/400`,
          uploadStatus: 'completed',
        })
      );
    }

    const autor = Usuario.create({
      id: `autor-${i % AUTORES.length}`,
      email: `${nome.toLowerCase()}@studyrats.app`,
      nomeExibicao: nome,
      xpTotal: 150 + (i % AUTORES.length) * 220,
    });

    return { sessao, autor, disciplinaNome, topicoNome };
  }
}

