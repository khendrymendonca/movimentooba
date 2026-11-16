"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  Settings,
  MessageCircle,
  Check,
  FileSpreadsheet,
  PackageCheck,
  X,
  ArrowLeft,
  Sparkles,
  Upload,
  RotateCcw,
  EyeOff,
  Calendar,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  fetchOfficialProducts,
  saveOfficialProducts,
  fetchAllShirtOrders,
  updateShirtOrderStatus,
  clearProductOrders,
  OfficialProduct,
  ShirtOrder,
  AVAILABLE_SHIRT_SIZES,
  CampaignPhase,
  formatDeadlineBR,
} from '@/lib/shirtOrders';

interface MemberProfile {
  id: string;
  name: string;
  phone?: string;
  blood_type?: string;
  is_active?: boolean;
  avatar_url?: string;
}

export default function DashboardProdutosOficiaisPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<OfficialProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [allOrders, setAllOrders] = useState<ShirtOrder[]>([]);
  const [allMembers, setAllMembers] = useState<MemberProfile[]>([]);

  const [activeTab, setActiveTab] = useState<'todos' | 'pendente' | 'sinal' | 'pago' | 'nao_solicitaram'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedGrid, setCopiedGrid] = useState(false);

  // Modal de Cadastrar / Editar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<OfficialProduct | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodHasSizes, setProdHasSizes] = useState(false);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodPhase, setProdPhase] = useState<CampaignPhase>('pre_save');
  const [prodDeadline, setProdDeadline] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodPixKey, setProdPixKey] = useState('');
  const [prodPixReceiver, setProdPixReceiver] = useState('');
  const [prodPixBank, setProdPixBank] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Modal rápido para Lançar Preço Oficial
  const [isLaunchPriceModalOpen, setIsLaunchPriceModalOpen] = useState(false);

  // Modal rápido para Reabilitar Pré-Save
  const [isReenableModalOpen, setIsReenableModalOpen] = useState(false);
  const [reenableDeadline, setReenableDeadline] = useState('');
  const [clearOldOrdersOnReenable, setClearOldOrdersOnReenable] = useState(false);

  // Modal de Definição de Sinal
  const [signalModalOrder, setSignalModalOrder] = useState<ShirtOrder | null>(null);
  const [signalAmount, setSignalAmount] = useState<string>('20.00');

  const loadData = async () => {
    setLoading(true);
    const [loadedProducts, loadedOrders, { data: membersData }] = await Promise.all([
      fetchOfficialProducts(supabase),
      fetchAllShirtOrders(supabase),
      supabase
        .from('profiles')
        .select('id, name, phone, blood_type, is_active, avatar_url')
        .order('name', { ascending: true }),
    ]);

    setProducts(loadedProducts);
    if (loadedProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(loadedProducts[0].id);
    }
    setAllOrders(loadedOrders);
    if (membersData) {
      setAllMembers(membersData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0] || null;

  // Filtra os pedidos do produto selecionado (ou pedidos legados se for o primeiro produto)
  const orders = allOrders.filter((o) => {
    if (!activeProduct) return false;
    if (o.productId) return o.productId === activeProduct.id;
    return activeProduct.id === products[0]?.id;
  });

  // Upload e compressão da arte para base64 otimizado
  const handleArtworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setProdImageUrl(dataUrl);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Abrir modal para Cadastrar Novo Produto
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdHasSizes(false);
    setProdImageUrl('');
    setProdPhase('pre_save');
    setProdDeadline('');
    setProdPrice(0);
    setProdPixKey(activeProduct?.pixKey || 'contato@movimentooba.com.br');
    setProdPixReceiver(activeProduct?.pixReceiver || 'Movimento O Bom Amigo');
    setProdPixBank(activeProduct?.pixBank || '');
    setIsProductModalOpen(true);
  };

  // Abrir modal para Editar Produto Atual
  const handleOpenEditProduct = (prod: OfficialProduct) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || '');
    setProdHasSizes(prod.hasSizes);
    setProdImageUrl(prod.imageUrl || '');
    setProdPhase(prod.phase);
    setProdDeadline(prod.preSaveDeadline || '');
    setProdPrice(prod.price || 0);
    setProdPixKey(prod.pixKey || '');
    setProdPixReceiver(prod.pixReceiver || '');
    setProdPixBank(prod.pixBank || '');
    setIsProductModalOpen(true);
  };

  // Salvar Produto (Novo ou Editado)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;
    setSavingProduct(true);

    const now = new Date().toISOString();
    let updatedList: OfficialProduct[];
    let targetId: string;

    if (editingProduct) {
      targetId = editingProduct.id;
      updatedList = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: prodName.trim(),
              description: prodDesc.trim(),
              hasSizes: prodHasSizes,
              imageUrl: prodImageUrl,
              phase: prodPhase,
              preSaveDeadline: prodDeadline,
              price: Number(prodPrice) || 0,
              pixKey: prodPixKey.trim(),
              pixReceiver: prodPixReceiver.trim(),
              pixBank: prodPixBank.trim(),
              updatedAt: now,
            }
          : p
      );
    } else {
      targetId = `prod_${Date.now()}`;
      const newProd: OfficialProduct = {
        id: targetId,
        name: prodName.trim(),
        description: prodDesc.trim(),
        hasSizes: prodHasSizes,
        imageUrl: prodImageUrl,
        phase: prodPhase,
        preSaveDeadline: prodDeadline,
        price: Number(prodPrice) || 0,
        pixKey: prodPixKey.trim(),
        pixReceiver: prodPixReceiver.trim(),
        pixBank: prodPixBank.trim(),
        createdAt: now,
        updatedAt: now,
      };
      updatedList = [newProd, ...products];
    }

    const ok = await saveOfficialProducts(supabase, updatedList);
    setSavingProduct(false);

    if (ok) {
      setProducts(updatedList);
      setSelectedProductId(targetId);
      setIsProductModalOpen(false);
      setIsLaunchPriceModalOpen(false);
    }
  };

  // Mudar fase rapidamente (ex: Dar como Encomendado, Desabilitar, Reabilitar)
  const handleQuickPhaseChange = async (
    prod: OfficialProduct,
    newPhase: CampaignPhase,
    extra?: Partial<OfficialProduct>
  ) => {
    const updatedList = products.map((p) =>
      p.id === prod.id
        ? {
            ...p,
            phase: newPhase,
            ...extra,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    const ok = await saveOfficialProducts(supabase, updatedList);
    if (ok) {
      setProducts(updatedList);
    }
  };

  // Confirmar Reabilitação para Pré-Save
  const handleConfirmReenable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setSavingProduct(true);

    if (clearOldOrdersOnReenable) {
      await clearProductOrders(supabase, activeProduct.id);
      setAllOrders((prev) => prev.filter((o) => o.productId !== activeProduct.id));
    }

    await handleQuickPhaseChange(activeProduct, 'pre_save', {
      preSaveDeadline: reenableDeadline,
    });

    setSavingProduct(false);
    setIsReenableModalOpen(false);
  };

  // Excluir um produto cadastrado
  const handleDeleteProduct = async (prod: OfficialProduct) => {
    if (!confirm(`Deseja realmente excluir o produto "${prod.name}"?`)) return;
    const updatedList = products.filter((p) => p.id !== prod.id);
    const ok = await saveOfficialProducts(supabase, updatedList);
    if (ok) {
      setProducts(updatedList);
      setSelectedProductId(updatedList[0]?.id || null);
    }
  };

  // Cruzamento: Quem solicitou vs Quem NÃO solicitou o produto atual
  const orderedUserIds = new Set(orders.map((o) => o.userId));
  const membersWithoutOrder = allMembers.filter(
    (m) => m.is_active !== false && !orderedUserIds.has(m.id)
  );

  const isPreSave = activeProduct?.phase === 'pre_save';

  // Cálculos Estatísticos do Produto Selecionado
  const totalUnitsCount = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalExpectedRevenue = orders.reduce((sum, o) => {
    const unitP = o.unitPrice > 0 ? o.unitPrice : activeProduct?.price || 0;
    return sum + (o.totalPrice > 0 ? o.totalPrice : (o.quantity || 1) * unitP);
  }, 0);
  const totalCollectedRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const totalPendingRevenue = Math.max(0, totalExpectedRevenue - totalCollectedRevenue);

  const countPaid = orders.filter((o) => o.paymentStatus === 'pago').length;
  const countSignal = orders.filter((o) => o.paymentStatus === 'sinal').length;
  const countPending = orders.filter(
    (o) => o.paymentStatus === 'pendente' || (!isPreSave && o.paymentStatus === 'pre_save')
  ).length;
  const countDelivered = orders.filter((o) => o.paymentStatus === 'entregue').length;

  // Grade de tamanhos (caso o produto tenha tamanhos)
  const sizeBreakdown: Record<string, number> = {};
  for (const o of orders) {
    const sz = o.size || 'Único';
    sizeBreakdown[sz] = (sizeBreakdown[sz] || 0) + (o.quantity || 1);
  }

  // Copiar resumo do pedido para envio ao fornecedor
  const handleCopyGrid = () => {
    if (!activeProduct) return;
    const lines = [
      `*RELATÓRIO DE PEDIDOS - ${activeProduct.name.toUpperCase()}*`,
      `Status: ${
        activeProduct.phase === 'pre_save'
          ? 'Pré-Save (Levantamento)'
          : activeProduct.phase === 'oficial'
          ? 'Solicitações Abertas'
          : 'Encomendado'
      }`,
      `Total de Unidades: ${totalUnitsCount} (${orders.length} pessoas)`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `---------------------------------`,
      ...(activeProduct.hasSizes
        ? Object.entries(sizeBreakdown).map(([sz, qty]) => `• Tamanho ${sz}: ${qty} unid.`)
        : orders.map((o) => `• ${o.userName}: ${o.quantity} unid.`)),
      `---------------------------------`,
      ...(activeProduct.price > 0
        ? [
            `Preço Unitário: R$ ${activeProduct.price.toFixed(2).replace('.', ',')}`,
            `Total Previsto: R$ ${totalExpectedRevenue.toFixed(2).replace('.', ',')}`,
          ]
        : []),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedGrid(true);
    setTimeout(() => setCopiedGrid(false), 2500);
  };

  // Ações de Atualização de Pagamento
  const handleMarkPayment = async (
    order: ShirtOrder,
    status: ShirtOrder['paymentStatus'],
    amount: number
  ) => {
    if (!order.id) return;
    const ok = await updateShirtOrderStatus(supabase, order.id, status, amount);
    if (ok) {
      setAllOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, paymentStatus: status, amountPaid: amount } : o
        )
      );
      setSignalModalOrder(null);
    }
  };

  // Filtragem dos pedidos
  const filteredOrders = orders.filter((o) => {
    const matchesTab =
      activeTab === 'todos'
        ? true
        : activeTab === 'pendente'
        ? o.paymentStatus === 'pendente' || (!isPreSave && o.paymentStatus === 'pre_save')
        : activeTab === 'sinal'
        ? o.paymentStatus === 'sinal'
        : activeTab === 'pago'
        ? o.paymentStatus === 'pago' || o.paymentStatus === 'entregue'
        : true;

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      o.userName.toLowerCase().includes(term) ||
      (o.size && o.size.toLowerCase().includes(term)) ||
      (o.userPhone && o.userPhone.includes(term));

    return matchesTab && matchesSearch;
  });

  const filteredMembersWithoutOrder = membersWithoutOrder.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(term) ||
      (m.phone && m.phone.includes(term)) ||
      (m.blood_type && m.blood_type.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
        <p className="text-xs text-slate-400 font-normal">Carregando produtos oficiais...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Limpo Padrão do App */}
      <div className="px-4 sm:px-6 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-red-600" size={18} />
            Produtos Oficiais
          </h1>
        </div>

        <button
          type="button"
          onClick={handleOpenNewProduct}
          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <Plus size={14} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5">
        {/* SE AINDA NÃO HÁ NENHUM PRODUTO CADASTRADO */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">
              Nenhum produto oficial cadastrado
            </h2>
          </div>
        ) : (
          <>
            {/* SELETOR DE PRODUTOS CADASTRADOS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {products.map((p) => {
                const isSelected = activeProduct?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        p.phase === 'pre_save'
                          ? 'bg-amber-100 text-amber-800'
                          : p.phase === 'oficial'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.phase === 'encomendado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.phase === 'pre_save'
                        ? 'Pré-Save'
                        : p.phase === 'oficial'
                        ? 'Aberto'
                        : p.phase === 'encomendado'
                        ? 'Encomendado'
                        : 'Oculto'}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeProduct && (
              <>
                {/* CARD DE CONTROLE DO PRODUTO SELECIONADO */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                        {activeProduct.imageUrl ? (
                          <img
                            src={activeProduct.imageUrl}
                            alt={activeProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon size={20} className="text-slate-300" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900">
                            {activeProduct.name}
                          </h2>
                          {activeProduct.phase === 'pre_save' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              Pré-Save
                              {activeProduct.preSaveDeadline
                                ? ` até ${formatDeadlineBR(activeProduct.preSaveDeadline)}`
                                : ''}
                            </span>
                          )}
                          {activeProduct.phase === 'oficial' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                              R$ {activeProduct.price.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          {activeProduct.phase === 'encomendado' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                              Encomendado
                            </span>
                          )}
                          {activeProduct.phase === 'inativo' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              Oculto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {activeProduct.phase === 'inativo' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReenableDeadline(activeProduct.preSaveDeadline || '');
                            setClearOldOrdersOnReenable(false);
                            setIsReenableModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles size={13} />
                          <span>Habilitar Pré-Save</span>
                        </button>
                      )}

                      {activeProduct.phase === 'pre_save' && (
                        <button
                          type="button"
                          onClick={() => {
                            handleOpenEditProduct(activeProduct);
                            setProdPhase('oficial');
                            setIsProductModalOpen(false);
                            setIsLaunchPriceModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <DollarSign size={13} />
                          <span>Definir Preço</span>
                        </button>
                      )}

                      {activeProduct.phase === 'oficial' && (
                        <button
                          type="button"
                          onClick={() => handleQuickPhaseChange(activeProduct, 'encomendado')}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <PackageCheck size={13} />
                          <span>Dar como Encomendado</span>
                        </button>
                      )}

                      {activeProduct.phase === 'encomendado' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReenableDeadline('');
                            setClearOldOrdersOnReenable(false);
                            setIsReenableModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw size={13} />
                          <span>Reabilitar (Pré-Save)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleCopyGrid}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Copiar Lista"
                      >
                        {copiedGrid ? <Check size={13} /> : <FileSpreadsheet size={13} />}
                        <span>{copiedGrid ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(activeProduct)}
                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Settings size={13} />
                        <span>Editar / Arte</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(activeProduct)}
                        className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cards de Métricas do Produto */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isPreSave ? 'Interessados (Pré-Save)' : 'Total Solicitado'}
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {totalUnitsCount}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">unidades</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
                      {orders.length} membros na lista
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Total Pago
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-2xl font-black text-emerald-600 truncate">
                        {isPreSave
                          ? 'Fase Pré-Save'
                          : `R$ ${totalCollectedRevenue.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
                      {isPreSave
                        ? 'Sem cobrança ainda'
                        : `${countPaid + countDelivered} quitados • ${countSignal} c/ sinal`}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                      Falta Receber
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base sm:text-2xl font-black text-amber-600 truncate">
                        {isPreSave
                          ? 'A Definir'
                          : `R$ ${totalPendingRevenue.toFixed(2).replace('.', ',')}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
                      {isPreSave
                        ? 'Aguardando preço final'
                        : `De R$ ${totalExpectedRevenue.toFixed(2).replace('.', ',')} previstos`}
                    </span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Não Solicitaram
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {membersWithoutOrder.length}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">membros</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
                      Veja na aba Não Pediram
                    </span>
                  </div>
                </div>

                {/* Grade de Tamanhos (Exibe apenas se o produto tiver tamanhos, ex: Camisa) */}
                {activeProduct.hasSizes && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-slate-600" />
                        Grade por Tamanho ({totalUnitsCount} un.)
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {AVAILABLE_SHIRT_SIZES.map((sz) => {
                        const count = sizeBreakdown[sz] || 0;
                        return (
                          <div
                            key={sz}
                            className={`px-2.5 py-1 rounded-xl border text-center transition-all ${
                              count > 0
                                ? 'bg-slate-900 text-white border-slate-800'
                                : 'bg-slate-50 text-slate-400 border-slate-200/60'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-bold block opacity-75">
                              {sz}
                            </span>
                            <span className="text-xs font-bold block">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Barra de Abas e Busca da Lista */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-white p-1 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setActiveTab('todos')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'todos'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Todos ({orders.length})
                    </button>

                    {!isPreSave && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('pendente')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'pendente'
                              ? 'bg-amber-600 text-white'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          Não Pagos ({countPending})
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('sinal')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'sinal'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          Deu Sinal ({countSignal})
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTab('pago')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                            activeTab === 'pago'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          Pagou Tudo ({countPaid + countDelivered})
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('nao_solicitaram')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'nao_solicitaram'
                          ? 'bg-red-600 text-white'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Não Solicitaram ({membersWithoutOrder.length})
                    </button>
                  </div>

                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar membro por nome ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400 bg-white"
                    />
                  </div>
                </div>

                {/* LISTAGEM DOS MEMBROS QUE SOLICITARAM OU NÃO SOLICITARAM */}
                {activeTab === 'nao_solicitaram' ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                    <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        Membros que ainda não solicitaram ({activeProduct.name})
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {filteredMembersWithoutOrder.length} membros
                      </span>
                    </div>

                    {filteredMembersWithoutOrder.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        Nenhum membro encontrado.
                      </div>
                    ) : (
                      filteredMembersWithoutOrder.map((m) => {
                        const cleanPhone = (m.phone || '').replace(/\D/g, '');
                        const waUrl = cleanPhone
                          ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                              `Olá, ${
                                m.name ? m.name.split(' ')[0] : 'amigo'
                              }! Estamos organizando os pedidos de "${
                                activeProduct.name
                              }" do Movimento O Bom Amigo no aplicativo. Acesse lá para garantir o seu!`
                            )}`
                          : null;

                        return (
                          <div
                            key={m.id}
                            className="p-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {m.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {m.blood_type ? `Tipo ${m.blood_type}` : 'Membro'} •{' '}
                                {m.phone || 'Sem telefone'}
                              </p>
                            </div>

                            <div>
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <MessageCircle size={14} />
                                  <span>Avisar</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400">Sem WhatsApp</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredOrders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                        Nenhuma solicitação registrada para este filtro.
                      </div>
                    ) : (
                      filteredOrders.map((order) => {
                        const cleanPhone = (order.userPhone || '').replace(/\D/g, '');
                        const effectiveUnit =
                          order.unitPrice > 0 ? order.unitPrice : activeProduct.price;
                        const effectiveTotal =
                          order.totalPrice > 0
                            ? order.totalPrice
                            : (order.quantity || 1) * effectiveUnit;

                        const waMessage = isPreSave
                          ? `Olá, ${
                              order.userName.split(' ')[0]
                            }! Tudo bem? Seu Pré-Save de "${activeProduct.name}" (${
                              order.quantity
                            } un.) está registrado. Assim que fecharmos o preço final te avisamos!`
                          : `Olá, ${
                              order.userName.split(' ')[0]
                            }! Tudo bem? O valor oficial de "${
                              activeProduct.name
                            }" ficou em R$ ${effectiveUnit
                              .toFixed(2)
                              .replace('.', ',')} por unidade (Total: R$ ${effectiveTotal
                              .toFixed(2)
                              .replace('.', ',')}). Chave PIX para sinal ou quitação: ${
                              activeProduct.pixKey
                            } (${activeProduct.pixReceiver}).`;

                        const waUrl = cleanPhone
                          ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                              waMessage
                            )}`
                          : null;

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                    {order.userName}
                                  </h3>
                                  {order.userBloodType && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 font-bold text-[10px]">
                                      {order.userBloodType}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>{order.userPhone || 'Sem telefone'}</span>
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-0.5"
                                    >
                                      <MessageCircle size={12} /> WhatsApp
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-slate-900 block">
                                  {isPreSave
                                    ? 'Pré-Save'
                                    : `R$ ${effectiveTotal.toFixed(2).replace('.', ',')}`}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {order.quantity} un.
                                  {activeProduct.hasSizes && order.size ? ` • Tam. ${order.size}` : ''}
                                </span>
                              </div>
                            </div>

                            {order.notes && (
                              <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                                Obs: {order.notes}
                              </p>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                {isPreSave ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Sparkles size={12} /> No Pré-Save
                                  </span>
                                ) : order.paymentStatus === 'pago' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 size={12} /> Pagou Tudo
                                  </span>
                                ) : order.paymentStatus === 'sinal' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <Clock size={12} /> Sinal: R${' '}
                                    {(order.amountPaid || 0).toFixed(2).replace('.', ',')}
                                  </span>
                                ) : order.paymentStatus === 'entregue' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                                    <PackageCheck size={12} /> Entregue
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock size={12} /> Não Pagou Ainda
                                  </span>
                                )}
                              </div>

                              {!isPreSave && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkPayment(order, 'pago', effectiveTotal)
                                    }
                                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                      order.paymentStatus === 'pago'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    Pagou Tudo
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSignalModalOrder({
                                        ...order,
                                        totalPrice: effectiveTotal,
                                      });
                                      setSignalAmount(
                                        order.amountPaid > 0
                                          ? String(order.amountPaid)
                                          : String((effectiveTotal / 2).toFixed(2))
                                      );
                                    }}
                                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                      order.paymentStatus === 'sinal'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    Deu Sinal
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkPayment(order, 'pendente', 0)}
                                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                      order.paymentStatus === 'pendente' ||
                                      order.paymentStatus === 'pre_save'
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    Pendente
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkPayment(order, 'entregue', effectiveTotal)
                                    }
                                    title="Marcar como Entregue"
                                    className={`p-1 rounded-lg border transition-colors ${
                                      order.paymentStatus === 'entregue'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <PackageCheck size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* MODAL DE CADASTRAR / EDITAR PRODUTO OFICIAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col max-h-[82dvh] overflow-hidden"
          >
            {/* Topo Fixo do Modal */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {editingProduct ? 'Editar Produto Oficial' : 'Cadastrar Produto Oficial'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo Rolável do Formulário */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Produto:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caneca Oficial, Camisa Oficial..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                  required
                />
              </div>

              {/* Possui Grade de Tamanhos? */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Precisa informar tamanho?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProdHasSizes(false)}
                    className={`p-2 rounded-xl border text-xs font-medium text-center transition-all ${
                      !prodHasSizes
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Não (Ex: Caneca)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProdHasSizes(true)}
                    className={`p-2 rounded-xl border text-xs font-medium text-center transition-all ${
                      prodHasSizes
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Sim (Vestuário)
                  </button>
                </div>
              </div>

              {/* Subir Arte do Produto */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Arte do Produto (Opcional):
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 text-xs text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors">
                    <Upload size={14} />
                    <span>{prodImageUrl ? 'Trocar Arte' : 'Subir Arte'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArtworkFileChange}
                      className="hidden"
                    />
                  </label>
                  {prodImageUrl && (
                    <button
                      type="button"
                      onClick={() => setProdImageUrl('')}
                      className="px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-red-600 hover:bg-red-50"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {prodImageUrl && (
                  <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img
                      src={prodImageUrl}
                      alt="Preview da Arte"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Status do Produto */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Etapa do Produto:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProdPhase('pre_save')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      prodPhase === 'pre_save'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Pré-Save</span>
                    <span className="text-[10px] text-slate-500 block">Sem preço ainda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProdPhase('oficial')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      prodPhase === 'oficial'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Com Preço</span>
                    <span className="text-[10px] text-slate-500 block">Abrir pedidos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProdPhase('encomendado')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      prodPhase === 'encomendado'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Encomendado</span>
                    <span className="text-[10px] text-slate-500 block">Ocultar dos membros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProdPhase('inativo')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      prodPhase === 'inativo'
                        ? 'bg-slate-200 border-slate-400 text-slate-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">Desabilitado</span>
                    <span className="text-[10px] text-slate-500 block">Rascunho</span>
                  </button>
                </div>
              </div>

              {prodPhase === 'pre_save' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pré-Save até qual dia? (Opcional):
                  </label>
                  <input
                    type="date"
                    value={prodDeadline}
                    onChange={(e) => setProdDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                  />
                </div>
              )}

              {prodPhase === 'oficial' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Preço Unitário (R$):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chave PIX:
                    </label>
                    <input
                      type="text"
                      value={prodPixKey}
                      onChange={(e) => setProdPixKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Titular do PIX:
                    </label>
                    <input
                      type="text"
                      value={prodPixReceiver}
                      onChange={(e) => setProdPixReceiver(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Fixo (Sempre Visível!) */}
            <div className="shrink-0 px-5 py-3.5 bg-white border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {savingProduct ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RÁPIDO: DEFINIR PREÇO & ABRIR SOLICITAÇÕES */}
      {isLaunchPriceModalOpen && activeProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Definir Preço ({activeProduct.name})
              </h3>
              <button
                type="button"
                onClick={() => setIsLaunchPriceModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Unitário Final (R$):
              </label>
              <input
                type="number"
                step="0.50"
                min="1"
                value={prodPrice || ''}
                onChange={(e) => setProdPrice(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 35.00"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chave PIX:
              </label>
              <input
                type="text"
                value={prodPixKey}
                onChange={(e) => setProdPixKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titular do PIX:
              </label>
              <input
                type="text"
                value={prodPixReceiver}
                onChange={(e) => setProdPixReceiver(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLaunchPriceModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                {savingProduct ? 'Salvando...' : 'Salvar Preço'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RÁPIDO: REABILITAR PRODUTO PARA PRÉ-SAVE */}
      {isReenableModalOpen && activeProduct && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <form
            onSubmit={handleConfirmReenable}
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Habilitar Pré-Save ({activeProduct.name})
              </h3>
              <button
                type="button"
                onClick={() => setIsReenableModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pré-Save até qual data? (Opcional):
              </label>
              <input
                type="date"
                value={reenableDeadline}
                onChange={(e) => setReenableDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
            </div>

            {orders.length > 0 && (
              <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearOldOrdersOnReenable}
                  onChange={(e) => setClearOldOrdersOnReenable(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Limpar a lista anterior ({orders.length} registros)</span>
              </label>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReenableModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={savingProduct}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {savingProduct ? 'Ativando...' : 'Ativar Pré-Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE DEFINIR SINAL */}
      {signalModalOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Registrar Sinal Pago</h3>
              <button
                type="button"
                onClick={() => setSignalModalOrder(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Membro:</strong> {signalModalOrder.userName}
              </p>
              <p>
                <strong>Total do Pedido:</strong> R${' '}
                {signalModalOrder.totalPrice.toFixed(2).replace('.', ',')} ({signalModalOrder.quantity} un.)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor recebido de sinal (R$):
              </label>
              <input
                type="number"
                step="0.50"
                min="1"
                max={signalModalOrder.totalPrice}
                value={signalAmount}
                onChange={(e) => setSignalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSignalModalOrder(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleMarkPayment(
                    signalModalOrder,
                    'sinal',
                    parseFloat(signalAmount) || signalModalOrder.totalPrice / 2
                  )
                }
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Salvar Sinal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
