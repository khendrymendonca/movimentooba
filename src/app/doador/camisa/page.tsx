"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Flame,
  ShieldCheck,
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
  const [isAdmin, setIsAdmin] = useState(false);

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
          supabase.from('profiles').select('id, name, phone, blood_type, role').eq('id', userId).single(),
          fetchUserShirtOrder(supabase, userId),
        ]);

      setConfig(loadedConfig);
      setProjectConfig(loadedProjConfig);

      if (profileData) {
        if (profileData.role === 'ADM') {
          setIsAdmin(true);
        }
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

  const isPreSave = config.campaignPhase === 'pre_save';
  const unitPrice = config.price || 0;
  const totalPrice = quantity * unitPrice;

  // Copiar chave PIX
  const handleCopyPix = () => {
    if (navigator?.clipboard && config.pixKey) {
      navigator.clipboard.writeText(config.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  // Enviar ou Atualizar Pré-Save / Pedido
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
      paymentStatus: isPreSave ? 'pre_save' : order?.paymentStatus || 'pendente',
      amountPaid: order?.amountPaid || 0,
      notes,
    });

    setSubmitting(false);

    if (saved) {
      setOrder(saved);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: isPreSave
          ? 'Pré-Save garantido com sucesso! Sua intenção foi salva para cotação com a confecção.'
          : 'Solicitação registrada com sucesso! Veja as instruções de pagamento abaixo.',
      });
    } else {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível registrar no momento. Tente novamente.',
      });
    }
  };

  // Cancelar pedido
  const handleCancelOrder = async () => {
    if (!userProfile) return;
    const confirmMsg = isPreSave
      ? 'Deseja realmente remover seu nome do Pré-Save da camisa oficial?'
      : 'Deseja realmente cancelar a sua solicitação da camisa oficial?';

    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    const success = await cancelUserShirtOrder(supabase, userProfile.id);
    setSubmitting(false);

    if (success) {
      setOrder(null);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: isPreSave ? 'Seu Pré-Save foi cancelado.' : 'Sua solicitação foi cancelada.',
      });
    } else {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível cancelar no momento. Tente novamente.',
      });
    }
  };

  // Link para avisar coordenação no WhatsApp
  const getWhatsAppConfirmationUrl = () => {
    const text = encodeURIComponent(
      `Olá! Meu nome é ${userProfile?.name || 'Doador'}. Participei do Pré-Save da Camisa Oficial do Movimento O Bom Amigo (Tamanho: ${selectedSize}, Quantidade: ${quantity}). Gostaria de tirar uma dúvida.`
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
            {isPreSave ? 'Pré-Save: Camisa Oficial' : 'Camisa Oficial do Movimento'}
          </h1>
          <p className="text-[11px] text-slate-500">
            {isPreSave ? 'Indique o seu interesse para cotarmos o lote' : 'Vista a causa nos mutirões de doação'}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto w-full space-y-5">
        {/* Banner para Super Administrador */}
        {isAdmin && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                <Shirt size={16} className="text-white" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white block">Acesso de Gestão Ativo</span>
                <span className="text-[11px] text-slate-300 font-normal block truncate">
                  Gerencie a lista do Pré-Save, a grade por tamanho e lance o preço final.
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/camisas"
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>Painel de Gestão</span>
              <span>→</span>
            </Link>
          </div>
        )}

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
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1">
              <Flame size={12} className="text-amber-400" />
              {isPreSave ? 'Fase: Pré-Save' : 'Edição Oficial 2026'}
            </div>

            <div className="absolute bottom-3 left-3 bg-red-600 text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
              {isPreSave ? (
                <span>Sem cobrança agora</span>
              ) : (
                <>
                  <span>R$ {unitPrice.toFixed(2).replace('.', ',')}</span>
                  <span className="text-[10px] opacity-80 font-normal">/ un</span>
                </>
              )}
            </div>
          </div>

          <div className="p-5 space-y-2">
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">
              Camisa Oficial O Bom Amigo
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {config.description || DEFAULT_SHIRT_CONFIG.description}
            </p>

            {/* Aviso especial do Pré-Save */}
            {isPreSave && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 mt-2 space-y-1">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Flame size={14} className="text-amber-600" /> Como funciona o Pré-Save:
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Você indica abaixo o tamanho e a quantidade desejada. A coordenação vai somar a demanda total do grupo para cotar com a melhor estamparia. <strong>Nenhum valor é cobrado agora!</strong> Quando tivermos o valor final fechado, ele será divulgado aqui para pagamento do sinal e confirmação da sua camisa.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SE O USUÁRIO JÁ TEM PRÉ-SAVE / PEDIDO REGISTRADO E NÃO ESTÁ EDITANDO */}
        {order && !isEditing ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {isPreSave ? 'Seu Pré-Save Garantido' : 'Seu Pedido Registrado'}
              </span>

              {/* Status do Pedido / Pré-Save */}
              {isPreSave ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} />
                  Pré-Save Confirmado
                </span>
              ) : order.paymentStatus === 'pago' ? (
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
                  Aguardando Sinal / Confirmação
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">
                  Tamanho Indicado
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

            {/* Explicação da Fase Atual */}
            {isPreSave ? (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" /> Levantamento de Demanda Ativo
                </p>
                <p className="text-[11px] leading-relaxed text-blue-800/90 font-normal">
                  Sua intenção está registrada com sucesso. A coordenação está negociando o lote com a fábrica. Assim que o preço final for lançado, você poderá confirmar e realizar o PIX do sinal por aqui.
                </p>
              </div>
            ) : (
              /* FASE OFICIAL: EXIBE VALOR FINAL E DADOS PIX PARA SINAL OU QUITAÇÃO */
              <div className="space-y-3">
                {order.paymentStatus === 'pre_save' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" /> Preço Final Lançado!
                    </span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      A cotação foi fechada: o valor é <strong>R$ {config.price.toFixed(2).replace('.', ',')}</strong> por camisa. Para confirmar a confecção da sua peça, envie o comprovante do sinal (mínimo de 50%) ou a quitação total via PIX.
                    </p>
                  </div>
                )}

                {(() => {
                  const effectiveUnit = order.unitPrice > 0 ? order.unitPrice : config.price;
                  const effectiveTotal = order.totalPrice > 0 ? order.totalPrice : order.quantity * effectiveUnit;
                  const signalMin = effectiveTotal / 2;

                  return (
                    <>
                      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-white/70 block">Valor Total do Pedido</span>
                          <span className="text-xl font-black text-white">
                            R$ {effectiveTotal.toFixed(2).replace('.', ',')}
                          </span>
                        </div>

                        {order.amountPaid > 0 ? (
                          <div className="text-right">
                            <span className="text-[11px] text-amber-300 block">Restante a Pagar</span>
                            <span className="text-base font-bold text-amber-300">
                              R$ {Math.max(0, effectiveTotal - order.amountPaid).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[11px] text-emerald-300 block">Sinal Mínimo (50%)</span>
                            <span className="text-base font-bold text-emerald-300">
                              R$ {signalMin.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                          <DollarSign size={16} className="text-amber-600" />
                          Dados para Pagamento via PIX (Sinal ou Quitação)
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
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {order.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                Obs: {order.notes}
              </p>
            )}

            {/* Ações do Pedido: Editar ou Cancelar */}
            <div className="flex items-center gap-2 pt-1">
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
                title="Cancelar Pré-Save"
              >
                <Trash2 size={14} />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE PRÉ-SAVE OU PEDIDO */
          <form
            onSubmit={handleSubmitOrder}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <Shirt size={16} className="text-red-600" />
                {isPreSave
                  ? order
                    ? 'Alterar Meu Pré-Save'
                    : 'Garantir Meu Pré-Save'
                  : order
                  ? 'Alterar Minha Solicitação'
                  : 'Solicitar Minha Camisa'}
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
                Escolha o tamanho que você quer:
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
                Quantidade:
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
                  {isPreSave ? '(Sem custo inicial)' : `(R$ ${unitPrice.toFixed(2).replace('.', ',')} cada)`}
                </span>
              </div>
            </div>

            {/* Campo de Observações Opcionais */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observações (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Prefiro gola redonda, infantil 12 etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-xs text-slate-900"
              />
            </div>

            {/* Aviso de Confirmação */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>
                {isPreSave
                  ? 'Você não pagará nada agora. O valor final será comunicado para confirmação com sinal.'
                  : `Valor Total: R$ ${totalPrice.toFixed(2).replace('.', ',')} (${quantity}x)`}
              </span>
            </div>

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check size={16} />
              <span>
                {isPreSave
                  ? order
                    ? 'Salvar Alteração do Pré-Save'
                    : 'Garantir Meu Pré-Save (Sem Custo Agora)'
                  : order
                  ? 'Salvar Alterações'
                  : 'Confirmar Solicitação da Camisa'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
