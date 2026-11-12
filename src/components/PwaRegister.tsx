"use client";

import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Registra o Service Worker para habilitar o modo Standalone nativo
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Atualiza o SW se houver nova versão
          reg.update();
        })
        .catch((err) => {
          console.warn('Registro do Service Worker:', err);
        });
    }

    // 2. Detecta se o aplicativo já está rodando em modo Standalone (sem barra de URL do navegador)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Se já estiver rodando em tela cheia como app, não precisa do aviso
    if (isStandaloneMode) return;

    // Detecta iOS (Safari)
    const ua = window.navigator.userAgent;
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(isAppleDevice);

    const dismissed = sessionStorage.getItem('oba_install_dismissed');
    if (!dismissed) {
      // No Android/Chrome, escuta o evento nativo
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      // No iOS, se for Safari e não standalone, mostra opção após 3s
      if (isAppleDevice) {
        const timer = setTimeout(() => {
          setShowInstallBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }

      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      // Se o evento nativo não estiver disponível (ex: Chrome em modo de teste), instrui
      alert('Para instalar sem a barra do navegador, toque nos 3 pontinhos do Chrome (⋮) e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('oba_install_dismissed', 'true');
  };

  // Se já está no modo standalone (sem a barra do navegador), não renderiza nada
  if (isStandalone || !showInstallBanner) return null;

  return (
    <>
      <div className="fixed top-2 left-3 right-3 z-50 animate-in slide-in-from-top-3 duration-300 max-w-md mx-auto print:hidden">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Usar como Aplicativo</h4>
              <p className="text-[10px] text-slate-300 leading-tight">
                Instale para sumir a barra do site e abrir em tela cheia!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
            >
              <Download size={13} /> Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal explicativo para iOS / iPhone */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-900 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Como instalar no iPhone</h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para abrir em tela cheia como aplicativo e <strong>remover a barra de endereço</strong> do Safari:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <Share size={18} className="text-blue-600 shrink-0" />
                <span>1. Toque no botão de <strong>Compartilhar</strong> na barra do Safari.</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <PlusSquare size={18} className="text-slate-700 shrink-0" />
                <span>2. Role para baixo e selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong>.</span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosGuide(false);
                setShowInstallBanner(false);
              }}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
