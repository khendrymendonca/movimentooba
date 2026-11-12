"use client";

import { useState } from 'react';
import QRCode from 'react-qr-code';
import { RotateCw, ShieldAlert } from 'lucide-react';
import { parseSafeDate } from '@/utils/donationRules';

export interface DonorCardProps {
  id?: string | null;
  name: string;
  bloodType?: string | null;
  avatarUrl?: string | null;
  status?: string | null;
  interactive?: boolean;
  isFullscreen?: boolean;
  showFlipHint?: boolean;
  compact?: boolean;
}

export function DonorCard({
  id,
  name,
  bloodType,
  avatarUrl,
  status = 'Ativa',
  interactive = true,
  isFullscreen = false,
  showFlipHint = true,
  compact = false,
}: DonorCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const isRevoked = status === 'Revogada' || status === 'Inativa';

  return (
    <div className="w-full flex flex-col items-center select-none">
      <div
        className={`relative w-full transition-all duration-500 ${
          interactive ? 'cursor-pointer' : ''
        } ${
          isFullscreen
            ? 'max-w-[76vh] aspect-[1.586/1] landscape:rotate-0 portrait:rotate-90 scale-105'
            : compact
            ? 'max-w-xs aspect-[1.586/1]'
            : 'max-w-sm aspect-[1.586/1]'
        }`}
        style={{ perspective: '1200px' }}
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) setIsFlipped((prev) => !prev);
        }}
      >
        <div
          className="w-full h-full relative transition-transform duration-700 rounded-[1.75rem] shadow-[0_18px_40px_-12px_rgba(15,23,42,0.28)]"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRENTE DA CARTEIRINHA (Identidade Oficial O Bom Amigo) */}
          <div
            className="absolute inset-0 w-full h-full rounded-[1.75rem] p-5 sm:p-6 flex flex-col justify-between text-white border border-white/25 overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Plano de Fundo Oficial com Gradiente Vermelho Elegante */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E63946] via-[#d62828] to-[#9e1922] z-0" />

            {/* Brilho Sutil de Profundidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none z-[1]" />

            {/* Estado Desativada / Revogada */}
            {isRevoked && (
              <div className="absolute inset-0 z-30 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-300 flex items-center justify-center mb-2.5">
                  <ShieldAlert size={22} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-red-300">
                  Carteirinha Desativada
                </span>
                <p className="text-[11px] text-slate-300 mt-1 max-w-[220px] leading-relaxed font-normal">
                  Esta carteirinha encontra-se temporariamente inativa. Procure a coordenação para regularização.
                </p>
              </div>
            )}

            {/* Topo Oficial da Carteirinha */}
            <div className="flex justify-between items-center relative z-10 min-h-[2.5rem]">
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-white uppercase drop-shadow-xs">
                  O Bom Amigo
                </span>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/95 rounded-xl shadow-sm border border-white/40 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                <img
                  src="/logo.png"
                  alt="O Bom Amigo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Centro/Base: Foto 3x4 + Nome Completo + Tipo Sanguíneo */}
            <div className="flex justify-between items-end relative z-10 gap-3 mt-auto">
              <div className="flex gap-3 items-end flex-1 min-w-0">
                {avatarUrl ? (
                  <div className="w-16 h-20 sm:w-[4.25rem] sm:h-[5.25rem] bg-white rounded-xl overflow-hidden border-2 border-white/80 shadow-md shrink-0">
                    <img
                      src={avatarUrl}
                      alt={name || 'Doador'}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-20 sm:w-[4.25rem] sm:h-[5.25rem] bg-white/15 rounded-xl flex items-center justify-center border-2 border-white/50 backdrop-blur-xs shadow-inner shrink-0">
                    <span className="font-semibold text-white text-xl">
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}

                <div className="flex flex-col pb-1 flex-1 min-w-0">
                  <span className="text-sm sm:text-base font-semibold leading-snug tracking-tight text-white break-words line-clamp-2 drop-shadow-xs">
                    {name || 'Nome do Doador'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end pb-1 shrink-0">
                <span className="text-[9px] text-white/80 uppercase tracking-widest mb-0.5 font-normal">
                  Sangue
                </span>
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-white drop-shadow-xs leading-none">
                  {bloodType || '-'}
                </span>
              </div>
            </div>

            {/* Rodapé: Apenas Status do Membro e ID (Sem Validade) */}
            <div className="relative z-10 pt-2.5 mt-2.5 flex justify-between items-center border-t border-white/25 text-[10px]">
              <span className="inline-flex items-center gap-1.5 text-white/95 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRevoked ? 'bg-red-400' : 'bg-emerald-300'
                  }`}
                />
                {isRevoked ? 'Desativado' : 'Membro Ativo'}
              </span>

              {id && (
                <span className="text-[9px] text-white/80 font-mono tracking-wider">
                  ID #{id.substring(0, 6).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* VERSO DA CARTEIRINHA */}
          <div
            className="absolute inset-0 w-full h-full bg-white rounded-[1.75rem] p-5 flex flex-col items-center justify-between text-slate-800 border border-slate-200 overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center p-1.5 mb-2">
                <img src="/logo.png" alt="Logo O Bom Amigo" className="w-full h-full object-contain" />
              </div>
              <p className="text-[9px] sm:text-[10px] leading-relaxed text-slate-600 font-normal px-2">
                Esta carteirinha é somente para identificação de participante do movimento{' '}
                <strong className="font-medium text-slate-800">O Bom Amigo</strong>. Não substitui
                documento oficial com foto no hemocentro.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 w-full justify-center">
              <QRCode
                value="https://movimentooba.vercel.app/"
                size={46}
                fgColor="#0f172a"
                bgColor="transparent"
              />
              <div className="text-left">
                <p className="text-[8px] uppercase tracking-widest text-slate-400 font-medium">
                  Movimento O Bom Amigo
                </p>
                <p className="text-[11px] font-medium text-slate-800">movimentooba.vercel.app</p>
                <p className="text-[9px] text-slate-500 font-normal">
                  Titular: {name ? name.split(' ')[0] : 'Doador'} ({bloodType || '-'})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {interactive && showFlipHint && !isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-normal transition-colors"
        >
          <RotateCw size={13} />
          Toque na carteirinha para ver o {isFlipped ? 'frente' : 'verso'}
        </button>
      )}
    </div>
  );
}
