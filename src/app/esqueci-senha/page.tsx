"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Informe um endereço de e-mail válido.');
      setLoading(false);
      return;
    }

    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8">
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
          <Image src="/logo.png" alt="Logo O Bom Amigo" width={56} height={56} className="object-contain" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Recuperar Senha</h1>
          <p className="text-slate-500 text-sm">
            Informe seu e-mail cadastrado para receber o link de redefinição.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-5">
            <div className="p-5 bg-emerald-50 text-emerald-800 text-sm rounded-2xl border border-emerald-100 flex flex-col items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={28} />
              <p className="font-medium">Verifique seu e-mail</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Enviamos um link para redefinição de senha (confira também a caixa de Spam).
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-red-600 font-medium hover:underline text-sm"
            >
              <ArrowLeft size={16} /> Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Seu E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </button>

            <div className="text-center mt-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-slate-500 font-medium hover:text-slate-700 text-sm transition-colors"
              >
                <ArrowLeft size={16} /> Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
