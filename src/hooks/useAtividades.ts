import { useState } from 'react';
import { DIContainer } from '../application/di/container';
import { Disciplina } from '../domain/entities/Disciplina';
import { Topico } from '../domain/entities/Topico';

export function useAtividades(usuarioId: string) {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarDisciplinas = async () => {
    setCarregando(true);
    const result = await DIContainer.repositories.disciplina.listarPorUsuario(usuarioId);
    setDisciplinas(result);
    setCarregando(false);
  };

  const cadastrarDisciplina = async (nome: string, cor: string) => {
    setCarregando(true);
    const res = await DIContainer.cadastrarDisciplina.execute({ usuarioId, nome, cor });
    if (res.isSuccess) {
      await carregarDisciplinas();
    }
    setCarregando(false);
    return res;
  };

  const cadastrarTopico = async (disciplinaId: string, nome: string) => {
    setCarregando(true);
    const res = await DIContainer.cadastrarTopico.execute({ disciplinaId, nome });
    if (res.isSuccess) {
      await carregarDisciplinas(); // Atualiza a árvore
    }
    setCarregando(false);
    return res;
  };

  const registrarSessao = async (disciplinaId: string, topicoId: string, duracaoMinutos: number, comFoto: boolean) => {
    setCarregando(true);
    const res = await DIContainer.registrarSessao.execute({
      usuarioId,
      disciplinaId,
      topicoId,
      duracaoMinutos,
      comFoto
    });
    setCarregando(false);
    return res;
  };

  return {
    disciplinas,
    carregando,
    carregarDisciplinas,
    cadastrarDisciplina,
    cadastrarTopico,
    registrarSessao
  };
}
