"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Mail, ArrowLeft } from 'lucide-react';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // O redirectTo aponta para a página de redefinição real.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-red-100 p-8 sm:p-10 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl opacity-60 -mr-10 -mt-10"></div>

        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600 transition-colors mb-6">
          <ArrowLeft size={16} /> Voltar para login
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Recuperar Senha</h1>
          <p className="text-slate-500 text-sm">Digite o e-mail associado à sua conta e enviaremos um link para criar uma nova senha.</p>
        </div>

        {success ? (
          <div className="p-6 bg-green-50 rounded-2xl border border-green-100 text-center">
            <h3 className="font-bold text-green-800 mb-2">E-mail enviado!</h3>
            <p className="text-green-700 text-sm">Verifique sua caixa de entrada (e a pasta de spam) para redefinir sua senha.</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 relative z-10">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
