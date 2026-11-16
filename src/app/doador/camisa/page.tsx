"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Shirt,
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Info,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  fetchShirtConfig,
  fetchUserShirtOrder,
  saveUserShirtOrder,
  cancelUserShirtOrder,
  ShirtConfig,
  ShirtOrder,
  AVAILABLE_SHIRT_SIZES,
  DEFAULT_SHIRT_CONFIG,
} from '@/lib/shirtOrders';
import { fetchProjectConfig, ProjectConfig, DEFAULT_PROJECT_CONFIG } from '@/lib/campaigns';

export default function DoadorCamisaPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [config, setConfig] = useState<ShirtConfig>(DEFAULT_SHIRT_CONFIG);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [order, setOrder] = useState<ShirtOrder | null>(null);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    blood_type?: string;
  } | null>(null);

  // Estados do formulário de solicitação
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      const [loadedConfig, loadedProjConfig, { data: profileData }, existingOrder] =
        await Promise.all([
          fetchShirtConfig(supabase),
          fetchProjectConfig(supabase),
          supabase.from('profiles').select('id, name, phone, blood_type').eq('id', userId).single(),
          fetchUserShirtOrder(supabase, userId),
        ]);

      setConfig(loadedConfig);
      setProjectConfig(loadedProjConfig);

      if (profileData) {
        setUserProfile({
          id: profileData.id,
          name: profileData.name || '',
          phone: profileData.phone || '',
          email: session.user.email || '',
          blood_type: profileData.blood_type,
        });
      }

      if (existingOrder) {
        setOrder(existingOrder);
        setSelectedSize(existingOrder.size);
        setQuantity(existingOrder.quantity);
        setNotes(existingOrder.notes || '');
      }

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const unitPrice = config.price || 45.0;
  const totalPrice = quantity * unitPrice;

  // Copiar chave PIX
  const handleCopyPix = () => {
    if (navigator?.clipboard && config.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  // Enviar ou Atualizar Pedido
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setSubmitting(true);
    setFeedback(null);

    const saved = await saveUserShirtOrder(supabase, {
      userId: userProfile.id,
      userName: userProfile.name || 'Doador Voluntário',
      userPhone: userProfile.phone || '',
      userEmail: userProfile.email || '',
      userBloodType: userProfile.blood_type,
      size: selectedSize,
      quantity,
      unitPrice,
      totalPrice,
      paymentStatus: order?.paymentStatus || 'pendente',
      amountPaid: order?.amountPaid || 0,
      notes,
    });

    setSubmitting(false);

    if (saved) {
      setOrder(saved);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: 'Solicitação registrada com sucesso! Veja as informações de pagamento abaixo.',
      });
    } else {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível registrar o pedido no momento. Tente novamente.',
      });
    }
  };

  // Cancelar pedido
  const handleCancelOrder = async () => {
    if (!userProfile) return;
    if (!confirm('Deseja realmente cancelar a sua solicitação da camisa oficial?')) return;

    setSubmitting(true);
    const success = await cancelUserShirtOrder(supabase, userProfile.id);
    setSubmitting(false);

    if (success) {
      setOrder(null);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: 'Sua solicitação foi cancelada.',
      });
    } else {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível cancelar no momento. Tente novamente.',
      });
    }
  };

  // Link para avisar coordenação no WhatsApp com mensagem personalizada
  const getWhatsAppConfirmationUrl = () => {
    const phone = projectConfig.hemocenterPhone ? '5532999999999' : ''; // número de contato da coordenação
    const text = encodeURIComponent(
      `Olá! Meu nome é ${userProfile?.name || 'Doador'}. Solicitei ${quantity} Camisa(s) Oficial(is) do Movimento O Bom Amigo (Tamanho: ${selectedSize}) no valor de R$ ${totalPrice.toFixed(
        2
      )}. Gostaria de confirmar o pagamento e envio do comprovante.`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 flex flex-col pb-20">
      {/* Header Sticky com Botão Voltar */}
      <div className="px-4 sm:px-6 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center gap-3">
        <Link
          href="/doador"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Shirt size={18} className="text-red-600" />
            Camisa Oficial do Movimento
          </h1>
          <p className="text-[11px] text-slate-500">
            Vista a causa e identifique-se nas doações
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto w-full space-y-5">
        {/* Feedback de sucesso ou erro */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span className="flex-1">{feedback.msg}</span>
          </div>
        )}

        {/* Card de Apresentação e Arte da Camisa */}
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="relative w-full h-56 sm:h-72 bg-slate-900 flex items-center justify-center overflow-hidden">
            <img
              src={config.imageUrl || DEFAULT_SHIRT_CONFIG.imageUrl}
              alt="Arte da Camisa Oficial O Bom Amigo"
              className="w-full h-full object-cover sm:object-contain transition-transform hover:scale-105 duration-300"
            />
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20">
              Edição Oficial 2026
            </div>
            <div className="absolute bottom-3 left-3 bg-red-600 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              <span>R$ {unitPrice.toFixed(2).replace('.', ',')}</span>
              <span className="text-[10px] opacity-80 font-normal">/ unidade</span>
            </div>
          </div>

          <div className="p-5 space-y-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Camisa Oficial O Bom Amigo
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {config.description || DEFAULT_SHIRT_CONFIG.description}
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Info size={12} /> {config.deliveryInfo || DEFAULT_SHIRT_CONFIG.deliveryInfo}
              </span>
            </div>
          </div>
        </div>

        {/* SE O USUÁRIO JÁ TEM PEDIDO E NÃO ESTÁ EDITANDO */}
        {order && !isEditing ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Seu Pedido Registrado
              </span>

              {/* Status do Pagamento */}
              {order.paymentStatus === 'pago' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} />
                  100% Pago (Quitado)
                </span>
              ) : order.paymentStatus === 'sinal' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock size={13} />
                  Sinal Pago (R$ {order.amountPaid?.toFixed(2).replace('.', ',')})
                </span>
              ) : order.paymentStatus === 'entregue' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">
                  <Check size={13} />
                  Camisa Entregue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock size={13} />
                  Aguardando Pagamento
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Tamanho Escolhido
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {order.size}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Quantidade
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {order.quantity} {order.quantity > 1 ? 'camisas' : 'camisa'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-white/70 block">Valor Total do Pedido</span>
                <span className="text-xl font-black text-white">
                  R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {order.amountPaid > 0 && order.amountPaid < order.totalPrice && (
                <div className="text-right">
                  <span className="text-[11px] text-amber-300 block">Restante a Pagar</span>
                  <span className="text-base font-bold text-amber-300">
                    R$ {(order.totalPrice - order.amountPaid).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>

            {order.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Obs: {order.notes}
              </p>
            )}

            {/* Chave PIX e Instruções de Pagamento */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <DollarSign size={16} className="text-amber-600" />
                Dados para Pagamento via PIX
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <p>
                  <strong>Titular:</strong> {config.pixReceiver || DEFAULT_SHIRT_CONFIG.pixReceiver}
                </p>
                {config.pixBank && (
                  <p>
                    <strong>Banco:</strong> {config.pixBank}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-amber-200/80 mt-2">
                  <span className="font-mono text-xs text-slate-800 break-all select-all">
                    {config.pixKey || DEFAULT_SHIRT_CONFIG.pixKey}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="shrink-0 inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedPix ? <Check size={13} /> : <Copy size={13} />}
                    {copiedPix ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                Você pode efetuar o pagamento integral ou pagar o sinal de 50% para garantir a sua confecção.
              </p>
            </div>

            {/* Ações do Pedido: WhatsApp e Editar/Cancelar */}
            <div className="flex flex-col gap-2 pt-1">
              <a
                href={getWhatsAppConfirmationUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle size={16} />
                Enviar Comprovante no WhatsApp da Coordenação
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit3 size={14} />
                  Alterar Tamanho / Qtd
                </button>

                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={submitting}
                  className="py-2.5 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Cancelar Solicitação"
                >
                  <Trash2 size={14} />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE SOLICITAÇÃO (NOVO PEDIDO OU EDITANDO) */
          <form
            onSubmit={handleSubmitOrder}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                {order ? 'Alterar Minha Solicitação' : 'Solicitar Minha Camisa'}
              </h3>
              {order && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Voltar
                </button>
              )}
            </div>

            {/* Seletor de Tamanho */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Escolha o seu tamanho:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {AVAILABLE_SHIRT_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                      selectedSize === sz
                        ? 'bg-red-600 text-white shadow-xs font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Contador de Quantidade */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Quantidade de camisas:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-base transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-base font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-base transition-colors"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">
                  (R$ {unitPrice.toFixed(2).replace('.', ',')} cada)
                </span>
              </div>
            </div>

            {/* Campo de Observações Opcionais */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações ou Detalhes (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Prefiro estampa nas costas, tamanho específico etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-xs text-slate-900"
              />
            </div>

            {/* Resumo do Valor Total */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Total Previsto:</span>
                <span className="text-xl font-black text-slate-900">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {quantity}x R$ {unitPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>{order ? 'Salvar Alterações' : 'Confirmar Solicitação da Camisa'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
