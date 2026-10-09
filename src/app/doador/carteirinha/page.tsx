"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { getBadgeColors, calculateBadge, BadgeType } from '@/utils/donationRules';
import Image from 'next/image';
import { Maximize, Minimize } from 'lucide-react';

export default function CarteirinhaDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, cards(valid_until)')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mb-4"></div>
      </div>
    );
  }

  if (!userProfile) return null;

  return (
    <div className={`flex flex-col min-h-full items-center justify-center transition-colors duration-500 ${isFullscreen ? 'bg-black fixed inset-0 z-[100] px-4' : 'bg-[#f8f9fa] px-6 pt-6 pb-24'}`}>
      
      {/* Botão de Tela Cheia */}
      <button 
        onClick={toggleFullscreen}
        className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-xs transition-colors ${isFullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
      >
        {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        {isFullscreen ? 'Sair da Tela Cheia' : 'Ver em Tela Cheia'}
      </button>

      {/* Container com perspectiva para o efeito 3D */}
      <div 
        className={`relative w-full cursor-pointer perspective-1000 transition-all duration-500 ${isFullscreen ? 'max-w-[90vh] aspect-[1.586/1] landscape:rotate-0 portrait:rotate-90 scale-125' : 'max-w-sm aspect-[1.586/1]'}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        
        {/* Envoltório da animação de giro */}
        <div 
          className="w-full h-full relative transition-transform duration-700 preserve-3d shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2rem]"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
        >
          
          {/* FRENTE DO CARTÃO */}
          <div 
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#E63946] to-[#b91c28] rounded-[2rem] p-6 flex flex-col justify-between text-white border border-white/20 overflow-hidden backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Efeito de Reflexo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform -skew-x-12 translate-x-[-100%] animate-[shimmer_4s_infinite]"></div>
            
            {/* Topo do Cartão */}
            <div className="flex justify-between items-start relative z-10">
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.2em] text-white uppercase drop-shadow-sm">O Bom Amigo</span>
                <span className="text-[8px] text-slate-200/80 uppercase tracking-widest font-medium">Carteirinha do Doador</span>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-red-200/50 flex items-center justify-center p-1.5 overflow-hidden">
                <img src="/logo.png" alt="O Bom Amigo" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
            </div>
            
            {/* Meio do Cartão */}
            <div className="flex justify-between items-end relative z-10">
              <div className="flex gap-4 items-end">
                {userProfile.avatar_url ? (
                  <div className="w-16 h-20 bg-white rounded-md overflow-hidden border-2 border-white/50 shadow-lg">
                    <Image src={userProfile.avatar_url} alt="Foto" width={64} height={80} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-16 h-20 bg-white/10 rounded-md flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shadow-inner">
                    <span className="font-medium text-white/80 text-xl">{userProfile.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex flex-col pb-1">
                  <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Nome</span>
                  <span className="text-lg font-medium leading-tight tracking-tight line-clamp-2">{userProfile.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end pb-1">
                <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Sangue</span>
                <span className="text-3xl font-light tracking-tighter text-white drop-shadow-sm">{userProfile.blood_type || '-'}</span>
              </div>
            </div>
            
            {/* Rodapé */}
            <div className="relative z-10 pt-3 flex justify-end items-end border-t border-white/20 mt-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-slate-200/80 uppercase tracking-widest mb-0.5">Válidade</span>
                <span className="text-[10px] font-mono tracking-widest text-slate-100">
                  {userProfile.cards && (Array.isArray(userProfile.cards) ? userProfile.cards[0]?.valid_until : userProfile.cards.valid_until)
                    ? new Date(Array.isArray(userProfile.cards) ? userProfile.cards[0].valid_until : userProfile.cards.valid_until).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
                    : 'Pendente'}
                </span>
              </div>
            </div>
          </div>

          {/* VERSO DO CARTÃO */}
          <div 
            className="absolute inset-0 w-full h-full bg-slate-50 rounded-[2rem] p-6 flex flex-col items-center justify-center text-slate-800 border border-slate-200 overflow-hidden backface-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center p-2 mb-3">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-[10px] sm:text-xs leading-relaxed text-slate-500 font-medium text-center px-4">
              Esta carteirinha é somente para identificação de participante. Não serve de comprovação nem como documento oficial para nada.
            </p>
          </div>

        </div>
      </div>

      {!isFullscreen && (
        <p className="mt-6 text-sm text-slate-400 font-medium animate-pulse">
          Toque na carteirinha para girar
        </p>
      )}

    </div>
  );
}
