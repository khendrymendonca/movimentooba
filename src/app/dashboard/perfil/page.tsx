"use client";

import { useEffect, useState } from 'react';
import { User, LogOut, Settings, Palette, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Perfil() {
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      setEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setProfile(data);
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ 
        name: profile.name,
        sex: profile.sex,
        theme_preference: profile.theme_preference
      })
      .eq('id', profile.id);
    setSaving(false);
    alert('Perfil atualizado com sucesso!');
  };

  const [uploading, setUploading] = useState(false);

  // Integração real de upload no bucket
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file || !profile) return;
      
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      // Salva na pasta com o ID do usuário para respeitar a regra do Storage: userId/timestamp.ext
      const filePath = `${profile.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload para o bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pega a URL pública da imagem recém salva
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Salva a URL no perfil do banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Atualiza a tela
      setProfile({ ...profile, avatar_url: publicUrl });
      alert('Foto de perfil atualizada!');
    } catch (error: any) {
      alert('Erro ao enviar foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Carregando seu perfil...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie suas informações e preferências do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda - Info Principal */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-red-50 shadow-sm text-center flex flex-col items-center">
            
            {/* Foto de Perfil */}
            <label className={`relative group cursor-pointer mb-4 block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white shadow-md">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="Avatar" width={112} height={112} className="object-cover w-full h-full" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white mb-1" size={24} />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">{uploading ? 'Enviando...' : 'Alterar'}</span>
              </div>
            </label>

            <h2 className="text-xl font-bold text-slate-900">{profile?.name}</h2>
            <p className="text-sm text-slate-500 mb-6">{email}</p>
            
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-medium transition-colors">
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>
        </div>

        {/* Coluna da Direita - Configurações */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-red-50 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="text-red-500" size={20} />
              Dados da Conta
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={profile?.name || ''} 
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 text-slate-900" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sexo Biológico</label>
                  <select
                    value={profile?.sex || ''}
                    onChange={(e) => setProfile({...profile, sex: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 text-slate-900"
                  >
                    <option value="">Não informado</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Importante para regras de intervalo de doação.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" 
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors disabled:opacity-70 shadow-md"
              >
                {saving ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-red-50 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Palette className="text-red-500" size={20} />
              Preferências Visuais
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">Tema do App</p>
                  <p className="text-sm text-slate-500">
                    {profile?.theme_preference === 'dark' ? 'Modo Escuro (Dark)' : 'Acolhedor (Claro)'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setProfile({...profile, theme_preference: 'light'})}
                    className={`w-8 h-8 rounded-full bg-slate-100 border-2 ${profile?.theme_preference === 'light' || !profile?.theme_preference ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300'}`}
                  ></button>
                  <button 
                    onClick={() => setProfile({...profile, theme_preference: 'dark'})}
                    className={`w-8 h-8 rounded-full bg-slate-900 border-2 ${profile?.theme_preference === 'dark' ? 'border-red-500 ring-2 ring-red-100' : 'border-transparent'}`}
                  ></button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
