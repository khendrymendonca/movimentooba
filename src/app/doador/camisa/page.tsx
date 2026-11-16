"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
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
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  fetchOfficialProducts,
  fetchUserProductOrders,
  saveUserShirtOrder,
  cancelUserShirtOrder,
  isProductVisibleToMembers,
  formatDeadlineBR,
  OfficialProduct,
  ShirtOrder,
  AVAILABLE_SHIRT_SIZES,
} from '@/lib/shirtOrders';
import { fetchProjectConfig, ProjectConfig, DEFAULT_PROJECT_CONFIG } from '@/lib/campaigns';

export default function DoadorProdutoOficialPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [visibleProducts, setVisibleProducts] = useState<OfficialProduct[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<ShirtOrder[]>([]);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);

  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    blood_type?: string;
  } | null>(null);

  // Estados do formulário de solicitação
  const [isEditing, setIsEditing] = useState(false);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);
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
      const urlParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramProdId = urlParams?.get('produto');

      const [loadedProducts, loadedProjConfig, { data: profileData }, loadedOrders] =
        await Promise.all([
          fetchOfficialProducts(supabase),
          fetchProjectConfig(supabase),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          fetchUserProductOrders(supabase, userId),
        ]);

      const activeProds = loadedProducts.filter(isProductVisibleToMembers);
      setVisibleProducts(activeProds);
      setProjectConfig(loadedProjConfig);
      setUserOrders(loadedOrders);

      const initialProd =
        activeProds.find((p) => p.id === paramProdId) || activeProds[0] || null;
      if (initialProd) {
        setSelectedProdId(initialProd.id);
        const existing = loadedOrders.find(
          (o) => o.productId === initialProd.id || (!o.productId && initialProd.id === activeProds[0]?.id)
        );
        if (existing) {
          setSelectedSize(existing.size || (initialProd.hasSizes ? 'M' : 'Único'));
          setQuantity(existing.quantity || 1);
          setNotes(existing.notes || '');
        } else {
          setSelectedSize(initialProd.hasSizes ? 'M' : 'Único');
          setQuantity(1);
          setNotes('');
        }
      }

      setUserProfile({
        id: profileData?.id || userId,
        name: profileData?.name || session.user.user_metadata?.name || session.user.email || 'Membro',
        phone: profileData?.phone || profileData?.whatsapp || '',
        email: session.user.email || '',
        blood_type: profileData?.blood_type,
      });

      setLoading(false);
    }

    loadData();
  }, []);

  const activeProduct =
    visibleProducts.find((p) => p.id === selectedProdId) || visibleProducts[0] || null;

  const order = activeProduct
    ? userOrders.find(
        (o) =>
          o.productId === activeProduct.id ||
          (!o.productId && activeProduct.id === visibleProducts[0]?.id)
      ) || null
    : null;

  const handleSelectProductTab = (prod: OfficialProduct) => {
    setSelectedProdId(prod.id);
    setFeedback(null);
    setIsEditing(false);
    const existing = userOrders.find(
      (o) => o.productId === prod.id || (!o.productId && prod.id === visibleProducts[0]?.id)
    );
    if (existing) {
      setSelectedSize(existing.size || (prod.hasSizes ? 'M' : 'Único'));
      setQuantity(existing.quantity || 1);
      setNotes(existing.notes || '');
    } else {
      setSelectedSize(prod.hasSizes ? 'M' : 'Único');
      setQuantity(1);
      setNotes('');
    }
  };

  const isPreSave = activeProduct?.phase === 'pre_save';
  const unitPrice = activeProduct?.price || 0;
  const totalPrice = quantity * unitPrice;

  const handleCopyPix = () => {
    if (navigator?.clipboard && activeProduct?.pixKey) {
      navigator.clipboard.writeText(activeProduct.pixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !activeProduct) return;

    setSubmitting(true);
    setFeedback(null);

    const saved = await saveUserShirtOrder(supabase, {
      productId: activeProduct.id,
      productName: activeProduct.name,
      userId: userProfile.id,
      userName: userProfile.name || 'Membro Voluntário',
      userPhone: userProfile.phone || '',
      userEmail: userProfile.email || '',
      userBloodType: userProfile.blood_type,
      size: activeProduct.hasSizes ? selectedSize : 'Único',
      quantity,
      unitPrice,
      totalPrice,
      paymentStatus: isPreSave ? 'pre_save' : order?.paymentStatus || 'pendente',
      amountPaid: order?.amountPaid || 0,
      notes,
    });

    setSubmitting(false);

    if (saved) {
      setUserOrders((prev) => {
        const others = prev.filter((o) => o.productId !== activeProduct.id);
        return [saved, ...others];
      });
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: isPreSave
          ? 'Pré-Save registrado! Assim que o valor estiver disponível será informado, e a encomenda só estará efetivamente realizada após o pagamento do sinal.'
          : 'Solicitação registrada! A encomenda só estará efetivamente realizada após o pagamento do sinal.',
      });
    } else {
      setFeedback({
        type: 'error',
        msg: 'Não foi possível salvar sua solicitação. Tente novamente.',
      });
    }
  };

  const handleCancelOrder = async () => {
    if (!userProfile || !activeProduct) return;
    if (!confirm('Deseja realmente cancelar sua solicitação deste produto?')) return;

    setSubmitting(true);
    const ok = await cancelUserShirtOrder(supabase, userProfile.id, activeProduct.id);
    setSubmitting(false);

    if (ok) {
      setUserOrders((prev) => prev.filter((o) => o.productId !== activeProduct.id));
      setIsEditing(false);
      setFeedback({
        type: 'success',
        msg: 'Sua solicitação foi cancelada.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
        <p className="text-xs text-slate-400">Carregando produto oficial...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col pb-24">
      {/* Cabeçalho */}
      <div className="bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <Link
          href="/doador"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
          <ShoppingBag size={16} className="text-red-600" />
          Produtos Oficiais
        </h1>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto w-full space-y-5">
        {visibleProducts.length === 0 || !activeProduct ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShoppingBag size={22} />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Nenhum produto disponível no momento
            </h2>
            <Link
              href="/doador"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium"
            >
              Voltar ao Início
            </Link>
          </div>
        ) : (
          <>
            {visibleProducts.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {visibleProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProductTab(p)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                      activeProduct.id === p.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200/80'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {feedback && (
              <div
                className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
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

            {/* Card do Produto Oficial */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
              {activeProduct.imageUrl && (
                <button
                  type="button"
                  onClick={() => setIsArtworkOpen(true)}
                  title="Clique para abrir a arte"
                  className="relative w-full h-56 sm:h-64 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100 cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <img
                    src={activeProduct.imageUrl}
                    alt={activeProduct.name}
                    className="w-full h-full object-contain"
                  />
                </button>
              )}

              <div className="p-4 sm:p-5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    {activeProduct.name}
                  </h2>
                  <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                    {isPreSave
                      ? `Pré-Save${
                          activeProduct.preSaveDeadline
                            ? ` até ${formatDeadlineBR(activeProduct.preSaveDeadline)}`
                            : ''
                        }`
                      : `R$ ${unitPrice.toFixed(2).replace('.', ',')} / un.`}
                  </span>
                </div>

                {activeProduct.description && (
                  <p className="text-xs text-slate-500 font-normal">
                    {activeProduct.description}
                  </p>
                )}

                <p className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 font-normal leading-relaxed mt-2">
                  Assim que o valor estiver disponível será informado, e a encomenda só estará efetivamente realizada após o pagamento do sinal.
                </p>
              </div>
            </div>

            {/* SE O USUÁRIO JÁ SOLICITOU E NÃO ESTÁ EDITANDO */}
            {order && !isEditing ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {isPreSave ? 'Seu Pré-Save' : 'Sua Solicitação'}
                  </span>

                  {isPreSave ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={13} />
                      Pré-Save Confirmado
                    </span>
                  ) : order.paymentStatus === 'pago' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={13} />
                      100% Pago
                    </span>
                  ) : order.paymentStatus === 'sinal' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Clock size={13} />
                      Sinal Pago (R$ {order.amountPaid?.toFixed(2).replace('.', ',')})
                    </span>
                  ) : order.paymentStatus === 'entregue' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 text-white">
                      <Check size={13} />
                      Entregue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock size={13} />
                      Aguardando Sinal / Pagamento
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {activeProduct.hasSizes && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Tamanho
                      </span>
                      <span className="text-base font-bold text-slate-900 block mt-0.5">
                        {order.size}
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Quantidade
                    </span>
                    <span className="text-base font-bold text-slate-900 block mt-0.5">
                      {order.quantity} {order.quantity > 1 ? 'unidades' : 'unidade'}
                    </span>
                  </div>
                </div>

                {!isPreSave && (
                  <div className="space-y-3">
                    {(() => {
                      const effectiveUnit =
                        order.unitPrice > 0 ? order.unitPrice : activeProduct.price;
                      const effectiveTotal =
                        order.totalPrice > 0
                          ? order.totalPrice
                          : order.quantity * effectiveUnit;
                      const signalMin = effectiveTotal / 2;

                      return (
                        <>
                          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                            <div>
                              <span className="text-xs text-white/70 block">Valor Total</span>
                              <span className="text-xl font-black text-white">
                                R$ {effectiveTotal.toFixed(2).replace('.', ',')}
                              </span>
                            </div>

                            {order.amountPaid > 0 ? (
                              <div className="text-right">
                                <span className="text-[11px] text-amber-300 block">
                                  Restante a Pagar
                                </span>
                                <span className="text-base font-bold text-amber-300">
                                  R${' '}
                                  {Math.max(0, effectiveTotal - order.amountPaid)
                                    .toFixed(2)
                                    .replace('.', ',')}
                                </span>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-[11px] text-emerald-300 block">
                                  Sinal (50%)
                                </span>
                                <span className="text-base font-bold text-emerald-300">
                                  R$ {signalMin.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            )}
                          </div>

                          {activeProduct.pixKey && (
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
                              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                                <DollarSign size={15} className="text-amber-600" />
                                Chave PIX para Sinal ou Pagamento Total
                              </div>

                              <div className="space-y-1 text-xs text-slate-700">
                                {activeProduct.pixReceiver && (
                                  <p>
                                    <strong>Titular:</strong> {activeProduct.pixReceiver}
                                  </p>
                                )}
                                <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-amber-200/80 mt-1">
                                  <span className="font-mono text-xs text-slate-800 break-all select-all">
                                    {activeProduct.pixKey}
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
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} />
                    Alterar
                  </button>

                  {(!order.amountPaid || order.amountPaid === 0) && (
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={submitting}
                      className="py-2.5 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={14} />
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* FORMULÁRIO DE SOLICITAÇÃO / PRÉ-SAVE */
              <form
                onSubmit={handleSubmitOrder}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5"
              >
                {activeProduct.hasSizes && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Escolha o Tamanho:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {AVAILABLE_SHIRT_SIZES.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            selectedSize === sz
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Quantidade:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-base"
                    >
                      -
                    </button>
                    <span className="text-lg font-bold text-slate-900 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-base"
                    >
                      +
                    </button>
                    {!isPreSave && unitPrice > 0 && (
                      <span className="ml-auto text-sm font-bold text-slate-900">
                        Total: R$ {totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observação (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Algum detalhe adicional..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Voltar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting
                      ? 'Salvando...'
                      : isPreSave
                      ? 'Confirmar Meu Pré-Save'
                      : 'Confirmar Solicitação'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Modal de Visualização da Arte do Produto */}
      {isArtworkOpen && activeProduct?.imageUrl && (
        <div
          className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          onClick={() => setIsArtworkOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {activeProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsArtworkOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 flex items-center justify-center p-3 overflow-hidden">
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.name}
                className="max-w-full max-h-[65dvh] object-contain rounded-xl"
              />
            </div>

            <div className="shrink-0 px-4 py-3 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsArtworkOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
