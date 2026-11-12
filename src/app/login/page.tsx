"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Lock, Mail, Smartphone, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(true);
  const [adminModeOnDesktop, setAdminModeOnDesktop] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1') {
        setAdminModeOnDesktop(true);
      }
      const checkViewport = () => {
        setIsMobileOrTablet(window.innerWidth <= 1024);
      };
      checkViewport();
      window.addEventListener('resize', checkViewport);
      return () => window.removeEventListener('resize', checkViewport);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      setError('Muitas tentativas seguidas. Aguarde alguns segundos antes de tentar novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !data.user) {
      console.error('Erro de login no Supabase:', authError);
      setFailedAttempts((prev) => prev + 1);
      if (authError?.message?.includes('Email not confirmed')) {
        setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.');
      } else if (authError?.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(authError?.message || 'Erro ao realizar login. Verifique sua conexão.');
      }
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

    if (profile && profile.is_active === false) {
      await supabase.auth.signOut();
      setError('Sua conta está inativa no momento.');
      setLoading(false);
      return;
    }

    if (profile?.role === 'ADM') {
      router.push('/doador');
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      await supabase.auth.signOut();
      setAdminModeOnDesktop(false);
      setError('A Área de Membros está disponível apenas pelo celular.');
      setLoading(false);
      return;
    }

    router.push('/doador');
  };

  if (!isMobileOrTablet && !adminModeOnDesktop) {
    return (
      <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center">
          <div className="mx-auto w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5">
            <Smartphone size={28} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Disponível no Celular
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            A Área de Membros fica disponível quando você acessa o site pelo celular.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={16} /> Voltar ao início
            </Link>
            <button
              onClick={() => setAdminModeOnDesktop(true)}
              className="text-xs text-slate-400 hover:text-slate-600 mt-2"
            >
              Acesso da Coordenação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8">
        <div className="mb-4">
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Início
          </Link>
        </div>

        <div className="mx-auto w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
          <Image src="/logo.png" alt="Logo O Bom Amigo" width={56} height={56} className="object-contain" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Bem-vindo de volta</h1>
          <p className="text-slate-500 text-sm">Faça login para acessar sua conta.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Senha</label>
              <Link href="/esqueci-senha" className="text-xs text-red-600 font-medium hover:underline">
                Esqueci a senha
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 transition-all text-slate-900"
                required
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 p-2 text-slate-400 hover:text-slate-700 z-10 cursor-pointer rounded-lg hover:bg-slate-200/50 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Acessando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Ainda não faz parte?{' '}
            <Link href="/cadastro" className="text-red-600 font-medium hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
