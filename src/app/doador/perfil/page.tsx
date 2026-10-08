"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, Settings, Shield, UserCog, CreditCard, Award } from 'lucide-react';
import { getBadgeColors, calculateBadge, BadgeType } from '@/utils/donationRules';
import Image from 'next/image';
import Link from 'next/link';

export default function PerfilDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      setEmail(session.user.email || '');

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
      const file = e.target.files?.[0];
      if (!file || !userProfile) return;
      
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `${userProfile.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userProfile.id);
      if (updateError) throw updateError;

      setUserProfile({ ...userProfile, avatar_url: publicUrl });
    } catch (error: any) {
      alert('Erro ao enviar foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
        <p className="text-slate-500 font-medium">Carregando perfil...</p>
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="flex justify-between items-center px-6 pt-10 pb-4 bg-slate-50 sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meu Perfil</h1>
        {userProfile.role === 'ADM' && (
          <Link href="/dashboard" className="bg-red-100 text-red-600 p-2 rounded-xl">
            <UserCog size={20} />
          </Link>
        )}
      </div>

      <div className="px-6 pb-6 space-y-6">
        
        {/* Foto de Perfil Centralizada */}
        <div className="flex flex-col items-center justify-center pt-4 pb-6">
          <label className={`relative group/avatar cursor-pointer block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            {userProfile.avatar_url ? (
              <div className="w-28 h-28 bg-white rounded-full overflow-hidden border-4 border-white shadow-xl">
                <Image src={userProfile.avatar_url} alt="Foto" width={112} height={112} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-28 h-28 bg-slate-200 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                <Camera size={32} className="text-slate-400" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-2 border-2 border-white shadow-lg">
              <Camera size={16} className="text-white" />
            </div>
          </label>
        </div>

        {/* Informações da Conta (Editável) */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">Dados da Conta</h3>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-4">
            
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Nome Completo</label>
              <input 
                type="text" 
                value={userProfile.name || ''} 
                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-slate-50/50 text-slate-900 font-medium" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Sexo Biológico</label>
                <select
                  value={userProfile.sex || ''}
                  onChange={(e) => setUserProfile({...userProfile, sex: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-slate-50/50 text-slate-900 font-medium"
                >
                  <option value="">Não informado</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Tipo Sanguíneo</label>
                <select
                  value={userProfile.blood_type || ''}
                  onChange={(e) => setUserProfile({...userProfile, blood_type: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-slate-50/50 text-slate-900 font-medium font-mono"
                >
                  <option value="">--</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">E-mail</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-100/50 text-slate-500 cursor-not-allowed" 
              />
            </div>

            <button 
              onClick={async () => {
                const { error } = await supabase.from('profiles').update({ 
                  name: userProfile.name, sex: userProfile.sex, blood_type: userProfile.blood_type 
                }).eq('id', userProfile.id);
                if (error) alert('Erro ao salvar.');
                else alert('Dados atualizados com sucesso!');
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-colors shadow-md mt-2"
            >
              Salvar Alterações
            </button>
          </div>
        </div>

        {/* Privacidade e Termos */}
        <div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Shield size={20} />
                </div>
                <span className="font-medium text-slate-700">Privacidade e Termos</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full mt-4 py-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut size={20} />
          Encerrar Sessão
        </button>
      </div>

    </div>
  );
}
