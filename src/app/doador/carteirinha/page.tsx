"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Maximize, Camera } from 'lucide-react';
import { DonorCard } from '@/components/DonorCard';
import Link from 'next/link';

export default function CarteirinhaDoador() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, cards(valid_until, status)')
        .eq('id', session.user.id)
        .single();

      setUserProfile(profile);
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  const openFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setIsFullscreen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
      </div>
    );
  }

  if (!userProfile) return null;

  const cardData = userProfile.cards
    ? Array.isArray(userProfile.cards)
      ? userProfile.cards[0]
      : userProfile.cards
    : null;

  const cardStatus = cardData?.status || 'Ativa';

  return (
    <div
      onClick={() => {
        if (isFullscreen) closeFullscreen();
      }}
      className={`flex flex-col min-h-full items-center justify-center transition-colors duration-300 ${
        isFullscreen
          ? 'bg-slate-950/95 backdrop-blur-sm fixed inset-0 z-[100] px-4 cursor-pointer'
          : 'bg-[#f8f9fa] px-6 pt-8 pb-24'
      }`}
    >
      {!isFullscreen && (
        <div className="w-full max-w-sm flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Carteirinha Digital
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Identificação oficial de membro do movimento.
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFullscreen();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-normal transition-colors shrink-0"
          >
            <Maximize size={13} />
            Tela Cheia
          </button>
        </div>
      )}

      <DonorCard
        id={userProfile.id}
        name={userProfile.name}
        bloodType={userProfile.blood_type}
        avatarUrl={userProfile.avatar_url}
        status={cardStatus}
        interactive={true}
        isFullscreen={isFullscreen}
        showFlipHint={!isFullscreen}
      />

      {isFullscreen && (
        <p className="fixed bottom-6 left-0 right-0 text-center text-xs text-white/60 font-normal pointer-events-none">
          Toque na carteirinha para girar • Toque fora da carteirinha para sair da tela cheia
        </p>
      )}

      {!isFullscreen && !userProfile.avatar_url && (
        <Link
          href="/doador/perfil"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-normal transition-colors"
        >
          <Camera size={14} className="text-red-500" />
          Adicionar foto 3x4 na carteirinha
        </Link>
      )}
    </div>
  );
}
