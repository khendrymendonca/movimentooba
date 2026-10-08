"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { User, Lock, Mail, Calendar, Droplet, ArrowRight } from 'lucide-react';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('M');
  const [bloodType, setBloodType] = useState('A+');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Criar o usuário na Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Criar o profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          name,
          birth_date: birthDate,
          sex,
          blood_type: bloodType,
          role: 'User'
        }
      ]);

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
        // Mesmo com erro no perfil, podemos tentar mandar para o doador
      }
      
      // 3. Redirecionar para o painel de doador
      router.push('/doador');
    }
  };

  return (
    <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl border border-red-100 p-8 sm:p-12 relative overflow-hidden">
        
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <Link href="/" className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 hover:scale-105 transition-transform">
            <Image src="/logo.png" alt="Logo O Bom Amigo" width={48} height={48} className="object-contain" />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight text-center">Junte-se a nós</h1>
          <p className="text-slate-500 text-sm mt-2 text-center">Cadastre-se e comece a salvar vidas hoje mesmo.</p>
        </div>

        <form onSubmit={handleRegister} className="relative z-10 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" required
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
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

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="date" required
                  value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sexo</label>
              <select 
                value={sex} onChange={(e) => setSex(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo Sanguíneo</label>
              <div className="relative">
                <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={20} />
                <select 
                  value={bloodType} onChange={(e) => setBloodType(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 font-medium"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Não sei">Não sei ainda</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <input 
              type="checkbox" required id="consentimento"
              className="mt-1 w-5 h-5 text-red-600 bg-white border-slate-300 rounded focus:ring-red-500 focus:ring-2"
            />
            <label htmlFor="consentimento" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              Autorizo compartilhar meus dados pessoais com o Movimento O Bom Amigo, e entendo que esses dados serão usados <strong>apenas para agendar novas campanhas</strong> e contabilizar os resultados do projeto.
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? 'Criando conta...' : (
              <>Criar minha conta <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-slate-500 text-sm">
            Já faz parte do movimento?{' '}
            <Link href="/login" className="text-red-600 font-bold hover:underline">
              Entrar agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
