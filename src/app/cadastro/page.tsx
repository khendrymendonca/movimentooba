"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { sanitizeText } from '@/utils/donationRules';
import {
  User,
  Lock,
  Mail,
  Calendar,
  Droplet,
  ArrowRight,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState('M');
  const [bloodType, setBloodType] = useState('O+');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const validateAge = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 16 && age <= 69;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = sanitizeText(name, 100);
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 3) {
      setError('Por favor, informe seu nome completo.');
      return;
    }

    if (!validateAge(birthDate)) {
      setError('Para doar sangue, é necessário ter entre 16 e 69 anos de idade.');
      return;
    }

    const hasLettersAndNumbers = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
    if (!hasLettersAndNumbers) {
      setError('A senha deve ter no mínimo 8 caracteres, contendo letras e números.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não conferem.');
      return;
    }

    if (!lgpdConsent) {
      setError('É necessário aceitar o Termo de Consentimento para prosseguir.');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (authError) {
      setError(
        authError.message.includes('already registered')
          ? 'Este e-mail já está cadastrado.'
          : 'Não foi possível concluir o cadastro. Verifique os dados informados.'
      );
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          name: cleanName,
          birth_date: birthDate,
          sex,
          blood_type: bloodType,
          role: 'User',
          is_active: true,
        },
      ]);

      setRegisteredSuccess(true);
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 1024;

    return (
      <div className="flex min-h-screen bg-red-50/30 items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl border border-red-100 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={34} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-3">
            Cadastro concluído com sucesso!
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            Seja muito bem-vindo ao movimento O Bom Amigo. Acompanhe o nosso Canal no WhatsApp para ficar por dentro das novidades e das próximas campanhas.
          </p>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 mb-6 flex items-start gap-3.5 text-left">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 mb-1">
                Área de Membros disponível no celular
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A Área de Membros (com sua Carteirinha Digital e acompanhamento de datas de doação) fica disponível exclusivamente quando você acessa o site pelo celular.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-normal flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <MessageCircle size={16} />
              Canal no WhatsApp
            </a>

            {isMobileOrTablet ? (
              <button
                onClick={() => router.push('/doador')}
                className="w-full py-2.5 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-normal transition-colors text-sm"
              >
                Área de Membros
              </button>
            ) : (
              <Link
                href="/"
                className="block w-full py-2.5 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full font-normal transition-colors text-sm"
              >
                Voltar para a Página Inicial
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center mb-8">
          <Link
            href="/"
            className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 hover:scale-105 transition-transform"
          >
            <Image src="/logo.png" alt="Logo O Bom Amigo" width={48} height={48} className="object-contain" />
          </Link>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight text-center">
            Junte-se a nós
          </h1>
          <p className="text-slate-500 text-sm mt-2 text-center">
            Cadastre-se e faça parte do movimento O Bom Amigo.
          </p>
        </div>

        <form onSubmit={handleRegister} className="relative z-10 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 text-center">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 text-sm"
                  placeholder="Mín. 8 (letras e nº)"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 p-2 text-slate-400 hover:text-slate-700 z-10 cursor-pointer rounded-lg hover:bg-slate-200/50 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar Senha</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-slate-400 pointer-events-none" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 text-sm"
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 p-2 text-slate-400 hover:text-slate-700 z-10 cursor-pointer rounded-lg hover:bg-slate-200/50 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sexo</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700 text-sm"
              >
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo Sanguíneo</label>
              <div className="relative">
                <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={20} />
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-slate-700"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="Não sei">Não sei ainda</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informações claras de LGPD concentradas apenas no Cadastro */}
          <div className="mt-4 flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <input
              type="checkbox"
              required
              id="consentimento"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="mt-1 w-5 h-5 text-red-600 bg-white border-slate-300 rounded focus:ring-red-500 focus:ring-2 shrink-0"
            />
            <label htmlFor="consentimento" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
              De acordo com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>, autorizo o Movimento O Bom Amigo a utilizar meus dados informados acima exclusivamente para emissão da Carteirinha Digital, cálculo dos meus prazos de doação e organização das campanhas do projeto. Estou ciente de que meus dados não serão compartilhados com terceiros e que posso solicitar sua exclusão a qualquer momento.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-4 rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Criando conta...'
            ) : (
              <>
                Criar minha conta <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-xs">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
