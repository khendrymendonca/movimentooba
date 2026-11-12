"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function NovaSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function initSession() {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            setInitializing(false);
            return;
          }
        }

        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          setInitializing(false);
          return;
        }
      }

      await supabase.auth.getSession();
      setInitializing(false);
    }

    initSession();
  }, [supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const hasLettersAndNumbers = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
    if (!hasLettersAndNumbers) {
      setError('A nova senha deve ter no mínimo 8 caracteres, contendo letras e números.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError('O link de recuperação expirou ou já foi utilizado. Solicite um novo link.');
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8">
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
          <Image src="/logo.png" alt="Logo O Bom Amigo" width={56} height={56} className="object-contain" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Criar Nova Senha</h1>
          <p className="text-slate-500 text-sm">Digite sua nova senha abaixo.</p>
        </div>

        {initializing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-500">Validando acesso...</p>
          </div>
        ) : success ? (
          <div className="p-6 bg-emerald-50 text-emerald-800 text-sm rounded-2xl border border-emerald-100 text-center space-y-2">
            <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
            <p className="text-base font-medium">Senha atualizada com sucesso!</p>
            <p className="text-xs text-emerald-700">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres (letras e nº)"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 transition-all text-slate-900"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 transition-all text-slate-900"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Salvando...' : 'Atualizar Minha Senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
