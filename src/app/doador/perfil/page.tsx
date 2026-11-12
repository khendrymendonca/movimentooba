"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Camera,
  LogOut,
  LifeBuoy,
  Check,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  IdCard,
  Bug,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { sanitizeText, validateSafeUpload } from '@/utils/donationRules';

export default function PerfilDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Alteração de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const currentEmail = session.user.email || '';
      setEmail(currentEmail);
      setOriginalEmail(currentEmail);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setFeedback(null);
      const file = e.target.files?.[0];
      if (!file || !userProfile) return;

      const validation = validateSafeUpload(file, {
        maxSizeMB: 3,
        allowedTypes: ['image'],
      });

      if (!validation.valid) {
        setFeedback({ type: 'error', msg: validation.error || 'Arquivo inválido.' });
        return;
      }

      setUploading(true);
      const filePath = `${userProfile.id}/avatar-${Date.now()}.${validation.safeExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      setUserProfile({ ...userProfile, avatar_url: urlWithCacheBust });
      setFeedback({ type: 'success', msg: 'Foto 3x4 atualizada! Ela já está ativa na sua Carteirinha Digital.' });
    } catch {
      setFeedback({ type: 'error', msg: 'Não foi possível enviar a foto. Tente outra imagem.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setFeedback(null);
    const cleanName = sanitizeText(userProfile.name, 100);
    if (cleanName.length < 3) {
      setFeedback({ type: 'error', msg: 'Informe seu nome completo válido.' });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: cleanName,
        birth_date: userProfile.birth_date || null,
        sex: userProfile.sex || 'M',
        blood_type: userProfile.blood_type || 'Não sei',
      })
      .eq('id', userProfile.id);

    setSaving(false);
    if (error) {
      setFeedback({ type: 'error', msg: 'Erro ao atualizar seus dados pessoais.' });
    } else {
      setUserProfile({ ...userProfile, name: cleanName });
      setFeedback({ type: 'success', msg: 'Dados pessoais atualizados com sucesso!' });
    }
  };

  const handleUpdateEmail = async () => {
    setFeedback(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', msg: 'Informe um endereço de e-mail válido.' });
      return;
    }
    if (cleanEmail === originalEmail) {
      setFeedback({ type: 'error', msg: 'O e-mail informado já é o seu e-mail atual.' });
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: cleanEmail });
    setSavingEmail(false);

    if (error) {
      setFeedback({ type: 'error', msg: error.message || 'Não foi possível alterar o e-mail.' });
    } else {
      setOriginalEmail(cleanEmail);
      setFeedback({
        type: 'success',
        msg: 'Solicitação de troca de e-mail enviada! Verifique a caixa de entrada do novo e-mail para confirmar.',
      });
    }
  };

  const handleUpdatePassword = async () => {
    setFeedback(null);
    const hasLettersAndNumbers = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword);
    if (!hasLettersAndNumbers) {
      setFeedback({
        type: 'error',
        msg: 'A nova senha deve ter no mínimo 8 caracteres, contendo letras e números.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', msg: 'A confirmação de senha não confere.' });
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setFeedback({ type: 'error', msg: error.message || 'Não foi possível atualizar a senha.' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setFeedback({ type: 'success', msg: 'Sua senha foi alterada com sucesso!' });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fa] max-w-2xl mx-auto w-full pb-12">
      {/* Cabeçalho Unificado (Igual para todos os usuários) */}
      <div className="flex justify-between items-center px-6 pt-8 pb-4 bg-[#f8f9fa] sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Meu Perfil</h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Foto da carteirinha, dados pessoais, segurança e suporte.
          </p>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-normal border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* Foto de Perfil (Usada na Carteirinha Digital) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-center gap-4">
          <label
            className={`relative group/avatar cursor-pointer shrink-0 ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            {userProfile.avatar_url ? (
              <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden border-2 border-slate-200 shadow-xs">
                <img
                  src={userProfile.avatar_url}
                  alt="Foto 3x4"
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-20 h-24 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                <Camera size={24} className="text-slate-400" />
              </div>
            )}
            <div className="absolute -bottom-1.5 -right-1.5 bg-slate-900 rounded-full p-1.5 border-2 border-white shadow-xs">
              <Camera size={12} className="text-white" />
            </div>
          </label>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-slate-900 truncate">
              {userProfile.name || 'Doador'}
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
              Toque na foto ao lado para enviar ou atualizar sua foto 3x4 da Carteirinha Digital.
            </p>
            {uploading && (
              <span className="inline-block mt-1.5 text-[11px] text-red-600 font-normal">
                Enviando nova foto...
              </span>
            )}
          </div>
        </div>

        {/* 1. Dados Pessoais */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User size={15} className="text-slate-500" />
            <h3 className="text-xs font-medium text-slate-800 uppercase tracking-wider">
              Dados Pessoais
            </h3>
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-600 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              maxLength={100}
              value={userProfile.name || ''}
              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-sm font-normal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-normal text-slate-600 mb-1">
                Nascimento
              </label>
              <input
                type="date"
                value={userProfile.birth_date || ''}
                onChange={(e) => setUserProfile({ ...userProfile, birth_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
              />
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-600 mb-1">
                Sexo Biológico
              </label>
              <select
                value={userProfile.sex || 'M'}
                onChange={(e) => setUserProfile({ ...userProfile, sex: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
              >
                <option value="M">Masculino (60d)</option>
                <option value="F">Feminino (120d)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-normal text-slate-600 mb-1">
                Tipo Sanguíneo
              </label>
              <select
                value={userProfile.blood_type || 'Não sei'}
                onChange={(e) => setUserProfile({ ...userProfile, blood_type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
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

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-normal transition-colors disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar Dados Pessoais'}
          </button>
        </div>

        {/* 2. Alterar E-mail e Senha */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock size={15} className="text-slate-500" />
            <h3 className="text-xs font-medium text-slate-800 uppercase tracking-wider">
              E-mail e Senha
            </h3>
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <label className="block text-xs font-normal text-slate-600">
              Endereço de E-mail
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
                />
              </div>
              <button
                type="button"
                onClick={handleUpdateEmail}
                disabled={savingEmail || email.trim().toLowerCase() === originalEmail}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-normal transition-colors disabled:opacity-40 shrink-0"
              >
                {savingEmail ? 'Enviando...' : 'Alterar E-mail'}
              </button>
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-normal text-slate-600">
              Alterar Senha de Acesso
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mín. 8)"
                  className="w-full px-3.5 py-2 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 p-1.5 text-slate-400 hover:text-slate-700 z-10 cursor-pointer rounded-lg hover:bg-slate-200/50 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 text-xs font-normal"
              />
            </div>

            <button
              type="button"
              onClick={handleUpdatePassword}
              disabled={savingPassword || !newPassword}
              className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-normal transition-colors disabled:opacity-40"
            >
              {savingPassword ? 'Atualizando senha...' : 'Atualizar Senha'}
            </button>
          </div>
        </div>

        {/* 3. Central de Apoio & Chamados com o Gestor */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <LifeBuoy size={16} className="text-red-600" />
              Central de Apoio & Chamados
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Canal Direto
            </span>
          </div>

          <p className="text-xs text-slate-600 font-normal leading-relaxed">
            Abra um chamado diretamente com a coordenação para ajustes na carteirinha ou relatos técnicos:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md block w-fit mb-1">
                2 dias úteis
              </span>
              <span className="font-semibold text-slate-800 block">Ajuste no Nome</span>
              <span className="text-[10px] text-slate-400">Carteirinha digital</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-red-700 bg-red-100/80 px-1.5 py-0.2 rounded-md block w-fit mb-1">
                5 dias úteis
              </span>
              <span className="font-semibold text-slate-800 block">Relato de Bug</span>
              <span className="text-[10px] text-slate-400">Erros ou melhorias</span>
            </div>
          </div>

          <Link
            href="/doador/apoio"
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
          >
            Acessar Central de Apoio & Meus Chamados
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-white border border-slate-200 text-red-600 hover:bg-red-50/40 rounded-2xl font-normal text-xs transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={15} />
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
}
