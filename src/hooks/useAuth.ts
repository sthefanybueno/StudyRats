import { useState, useEffect } from 'react';
import { Usuario } from '../domain/entities/Usuario';
import { DIContainer } from '../application/di/container';

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // Tenta restaurar sessão ao montar
    DIContainer.autenticarUsuario.execute({ email: '', isLogin: false })
      .then(res => {
        if (res.isSuccess && res.value) setUsuario(res.value);
      })
      .finally(() => setCarregando(false));
  }, []);

  const loginGoogle = async (emailFalso: string = 'aluno@study.com') => {
    setCarregando(true);
    setErro(null);
    try {
      const result = await DIContainer.autenticarUsuario.execute({
        email: emailFalso,
        isLogin: true
      });

      console.log('Login result:', result);
      if (result.isSuccess) {
        setUsuario(result.value);
      } else {
        setErro(result.error);
      }
    } catch (e: any) {
      console.log('Login error:', e);
      setErro(e.message);
    } finally {
      console.log('Login finished');
      setCarregando(false);
    }
  };

  return { usuario, carregando, erro, loginGoogle };
}
