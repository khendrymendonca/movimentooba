"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NovaSenha() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Verificar se o usuário realmente tem uma sessão ativa (chegou pelo link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Link de recuperação inválido ou expirado. Por favor, solicite um novo.");
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [supabase.auth]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // Fazer logout por segurança ou apenas redirecionar para login
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50/30">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-red-100 p-8 sm:p-10 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-32 h-32 bg-red-50 rounded-full blur-2xl opacity-60 -ml-10 -mt-10"></div>

        <div className="mb-8 text-center relative z-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Nova Senha</h1>
          <p className="text-slate-500 text-sm">Crie uma nova senha segura para sua conta.</p>
        </div>

        {success ? (
          <div className="text-center relative z-10">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 mb-6">
              <h3 className="font-bold text-green-800 mb-1">Senha atualizada!</h3>
              <p className="text-green-700 text-sm">Sua senha foi redefinida com sucesso.</p>
            </div>
            <Link href="/login" className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md">
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5 relative z-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
                {error}
                <div className="mt-3">
                  <Link href="/esqueci-senha" className="text-red-700 underline font-bold">Solicitar novo link</Link>
                </div>
              </div>
            )}

            {!error && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="password" required minLength={6}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
