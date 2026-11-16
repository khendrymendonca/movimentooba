"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Shirt,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Settings,
  MessageCircle,
  Copy,
  Check,
  ChevronRight,
  FileSpreadsheet,
  PackageCheck,
  X,
  ArrowLeft,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  fetchShirtConfig,
  saveShirtConfig,
  fetchAllShirtOrders,
  updateShirtOrderStatus,
  ShirtConfig,
  ShirtOrder,
  DEFAULT_SHIRT_CONFIG,
  AVAILABLE_SHIRT_SIZES,
  CampaignPhase,
} from '@/lib/shirtOrders';

interface MemberProfile {
  id: string;
  name: string;
  phone?: string;
  blood_type?: string;
  is_active?: boolean;
  avatar_url?: string;
}

export default function DashboardCamisasPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ShirtConfig>(DEFAULT_SHIRT_CONFIG);
  const [orders, setOrders] = useState<ShirtOrder[]>([]);
  const [allMembers, setAllMembers] = useState<MemberProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'pendente' | 'sinal' | 'pago' | 'nao_solicitaram'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedGrid, setCopiedGrid] = useState(false);

  // Modal de Configuração Geral da Camisa
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editCampaignPhase, setEditCampaignPhase] = useState<CampaignPhase>('pre_save');
  const [editPrice, setEditPrice] = useState<number>(45);
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editPixKey, setEditPixKey] = useState<string>('');
  const [editPixReceiver, setEditPixReceiver] = useState<string>('');
  const [editPixBank, setEditPixBank] = useState<string>('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Modal de Definição de Sinal
  const [signalModalOrder, setSignalModalOrder] = useState<ShirtOrder | null>(null);
  const [signalAmount, setSignalAmount] = useState<string>('20.00');

  const loadData = async () => {
    setLoading(true);
    const [loadedConfig, loadedOrders, { data: membersData }] = await Promise.all([
      fetchShirtConfig(supabase),
      fetchAllShirtOrders(supabase),
      supabase
        .from('profiles')
        .select('id, name, phone, blood_type, is_active, avatar_url')
        .order('name', { ascending: true }),
    ]);

    setConfig(loadedConfig);
    setEditCampaignPhase(loadedConfig.campaignPhase || 'pre_save');
    setEditPrice(loadedConfig.price || 45);
    setEditImageUrl(loadedConfig.imageUrl || '');
    setEditPixKey(loadedConfig.pixKey || '');
    setEditPixReceiver(loadedConfig.pixReceiver || '');
    setEditPixBank(loadedConfig.pixBank || '');

    setOrders(loadedOrders);
    if (membersData) {
      setAllMembers(membersData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [supabase]);

  // Cruzamento: Quem solicitou vs Quem NÃO solicitou
  const orderedUserIds = new Set(orders.map((o) => o.userId));
  const membersWithoutOrder = allMembers.filter(
    (m) => m.is_active !== false && !orderedUserIds.has(m.id)
  );

  const isPreSave = config.campaignPhase === 'pre_save';

  // Cálculos Estatísticos
  const totalShirtsCount = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalExpectedRevenue = orders.reduce((sum, o) => {
    const unitP = o.unitPrice > 0 ? o.unitPrice : config.price;
    return sum + (o.totalPrice > 0 ? o.totalPrice : (o.quantity || 1) * unitP);
  }, 0);
  const totalCollectedRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const totalPendingRevenue = Math.max(0, totalExpectedRevenue - totalCollectedRevenue);

  const countPreSave = orders.filter((o) => o.paymentStatus === 'pre_save').length;
  const countPaid = orders.filter((o) => o.paymentStatus === 'pago').length;
  const countSignal = orders.filter((o) => o.paymentStatus === 'sinal').length;
  const countPending = orders.filter(
    (o) => o.paymentStatus === 'pendente' || (!isPreSave && o.paymentStatus === 'pre_save')
  ).length;
  const countDelivered = orders.filter((o) => o.paymentStatus === 'entregue').length;

  // Grade de tamanhos solicitados
  const sizeBreakdown: Record<string, number> = {};
  for (const o of orders) {
    const sz = o.size || 'M';
    sizeBreakdown[sz] = (sizeBreakdown[sz] || 0) + (o.quantity || 1);
  }

  // Copiar resumo da grade de produção para envio à fábrica
  const handleCopyGrid = () => {
    const lines = [
      `*GRADE DE PRODUÇÃO - CAMISAS OFICIAIS O BOM AMIGO*`,
      `Fase: ${isPreSave ? 'Pré-Save (Levantamento de Demanda)' : 'Campanha Oficial'}`,
      `Total de Camisas: ${totalShirtsCount} unidades (${orders.length} pedidos)`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `---------------------------------`,
      ...Object.entries(sizeBreakdown).map(([sz, qty]) => `• ${sz}: ${qty} unid.`),
      `---------------------------------`,
      ...(isPreSave
        ? [`Observação: Aguardando cotação de melhor preço com a estamparia.`]
        : [
            `Preço Unitário Fechado: R$ ${config.price.toFixed(2)}`,
            `Valor Total do Lote: R$ ${totalExpectedRevenue.toFixed(2)}`,
          ]),
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
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, paymentStatus: status, amountPaid: amount } : o
        )
      );
      setSignalModalOrder(null);
    }
  };

  // Salvar Configuração Geral da Camisa
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    const newPrice = Number(editPrice);
    const ok = await saveShirtConfig(supabase, {
      campaignPhase: editCampaignPhase,
      isPriceDefined: editCampaignPhase === 'oficial' && newPrice > 0,
      price: newPrice,
      imageUrl: editImageUrl,
      pixKey: editPixKey,
      pixReceiver: editPixReceiver,
      pixBank: editPixBank,
    });
    setSavingConfig(false);
    if (ok) {
      setConfig((prev) => ({
        ...prev,
        campaignPhase: editCampaignPhase,
        isPriceDefined: editCampaignPhase === 'oficial' && newPrice > 0,
        price: newPrice,
        imageUrl: editImageUrl,
        pixKey: editPixKey,
        pixReceiver: editPixReceiver,
        pixBank: editPixBank,
      }));
      setIsConfigModalOpen(false);
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
        <p className="text-xs text-slate-400 font-normal">Carregando gestão das camisas...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Sticky Mobile */}
      <div className="px-4 sm:px-6 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Voltar para a Visão Geral"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Shirt className="text-red-600" size={18} />
              Gestão das Camisas Oficiais
            </h1>
            <p className="text-[11px] text-slate-500 font-normal">
              Controle de pedidos, pagamentos e confecção
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyGrid}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            title="Copiar Grade para WhatsApp"
          >
            {copiedGrid ? <Check size={13} /> : <FileSpreadsheet size={13} />}
            <span className="hidden sm:inline">{copiedGrid ? 'Copiado!' : 'Grade'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors shadow-xs"
            title="Configurar Preço, Arte e PIX"
          >
            <Settings size={15} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5">
        {/* BANNER DE CONTROLE DA FASE DA CAMPANHA */}
        {isPreSave ? (
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                <AlertCircle size={14} className="text-amber-600" />
                Fase 1: Pré-Save Aberto (Levantamento de Demanda)
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Cotação de Demanda com a Fábrica
              </h3>
              <p className="text-xs text-slate-600 max-w-xl font-normal leading-relaxed">
                Os membros estão indicando tamanhos e quantidades <strong>sem nenhuma cobrança agora</strong>. Use a Grade de Produção abaixo para negociar o melhor valor de lote com a estamparia. Quando tiver o preço final, clique ao lado para lançar no app e liberar o pagamento de sinal.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditCampaignPhase('oficial');
                setIsConfigModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0"
            >
              <DollarSign size={16} />
              <span>Lançar Preço Final & Cobrar Sinal</span>
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-300/80 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Fase 2: Campanha Oficial Ativa (Com Preço & Cobrança)
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Preço Unitário: R$ {config.price.toFixed(2).replace('.', ',')}
              </h3>
              <p className="text-xs text-slate-600 max-w-xl font-normal leading-relaxed">
                Os doadores já estão visualizando o valor oficial e os dados de PIX no aplicativo para enviar o sinal ou valor total.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Settings size={14} className="text-slate-600" />
                <span>Ajustar Preço / PIX</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Deseja retornar para a Fase 1 (Pré-Save sem cobrança)?')) {
                    await saveShirtConfig(supabase, { campaignPhase: 'pre_save' });
                    setConfig((prev) => ({ ...prev, campaignPhase: 'pre_save' }));
                    setEditCampaignPhase('pre_save');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
                title="Voltar temporariamente para Pré-Save"
              >
                Voltar p/ Pré-Save
              </button>
            </div>
          </div>
        )}

        {/* Cards de Métricas e Totais Financeiros */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isPreSave ? 'Demanda no Pré-Save' : 'Total Encomendado'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {totalShirtsCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">unidades</span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
              {orders.length} membros garantiram
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              {isPreSave ? 'Status da Cotação' : 'Total Arrecadado'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-2xl font-black text-emerald-600 truncate">
                {isPreSave ? 'Pré-Save Aberto' : `R$ ${totalCollectedRevenue.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
              {isPreSave ? 'Sem cobrança inicial' : `${countPaid} quitados • ${countSignal} c/ sinal`}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              {isPreSave ? 'Preço por Unidade' : 'Pendente a Receber'}
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
                ? 'Aguardando cotação de fábrica'
                : `De R$ ${totalExpectedRevenue.toFixed(2).replace('.', ',')} previstos`}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {isPreSave ? 'Ainda Não Indicaram' : 'Não Pediram'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {membersWithoutOrder.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">doadores</span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal mt-0.5 block truncate">
              Toque na aba para convidar
            </span>
          </div>
        </div>

        {/* Grade de Tamanhos para Confecção */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <h2 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-slate-600" />
              Grade de Tamanhos para Produção ({totalShirtsCount} peças)
            </h2>
            <span className="text-slate-500 font-medium">
              {isPreSave
                ? 'Em Cotação'
                : `R$ ${config.price.toFixed(2).replace('.', ',')} / un`}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {AVAILABLE_SHIRT_SIZES.map((sz) => {
              const count = sizeBreakdown[sz] || 0;
              return (
                <div
                  key={sz}
                  className={`px-2.5 py-1 rounded-xl border text-center transition-all ${
                    count > 0
                      ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200/60'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block opacity-75">{sz}</span>
                  <span className="text-xs font-bold block">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barra de Abas e Busca */}
        <div className="space-y-3">
          {/* Seletor de Abas com Rolagem Suave */}
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

            {isPreSave ? (
              <button
                type="button"
                onClick={() => setActiveTab('pendente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'pendente'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                No Pré-Save ({orders.length})
              </button>
            ) : (
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
                  Aguardando Sinal ({countPending})
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
                  Sinal ({countSignal})
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
                  Quitados ({countPaid + countDelivered})
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
              {isPreSave ? 'Não Indicaram' : 'Não Pediram'} ({membersWithoutOrder.length})
            </button>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar doador por nome, telefone ou tamanho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400 bg-white"
            />
          </div>
        </div>

        {/* LISTAGEM DOS PEDIDOS OU DE NÃO SOLICITARAM */}
        {activeTab === 'nao_solicitaram' ? (
          /* LISTAGEM: QUEM NÃO SOLICITOU */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Doadores que ainda não pediram a camisa
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredMembersWithoutOrder.length} doadores
              </span>
            </div>

            {filteredMembersWithoutOrder.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum doador encontrado.
              </div>
            ) : (
              filteredMembersWithoutOrder.map((m) => {
                const cleanPhone = (m.phone || '').replace(/\D/g, '');
                const waUrl = cleanPhone
                  ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                      `Olá, ${
                        m.name ? m.name.split(' ')[0] : 'amigo'
                      }! As encomendas da Camisa Oficial do Movimento O Bom Amigo estão abertas no aplicativo. Acesse para escolher o seu tamanho e garantir a sua!`
                    )}`
                  : null;

                return (
                  <div key={m.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {m.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {m.blood_type ? `Tipo ${m.blood_type}` : 'Doador'} •{' '}
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
                          <span>Convidar</span>
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
          /* LISTAGEM: PEDIDOS DE CAMISA CADASTRADOS */
          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200/80">
                Nenhum pedido encontrado para o filtro ativo.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const cleanPhone = (order.userPhone || '').replace(/\D/g, '');
                const effectiveUnit = order.unitPrice > 0 ? order.unitPrice : config.price;
                const effectiveTotal =
                  order.totalPrice > 0 ? order.totalPrice : (order.quantity || 1) * effectiveUnit;

                const waMessage = isPreSave
                  ? `Olá, ${
                      order.userName.split(' ')[0]
                    }! Tudo bem? Sobre seu Pré-Save da Camisa Oficial O Bom Amigo (Tamanho ${
                      order.size
                    }, ${order.quantity} un.): estamos negociando o lote com a fábrica para garantir o melhor valor. Assim que fecharmos o preço final te avisamos aqui no app!`
                  : `Olá, ${
                      order.userName.split(' ')[0]
                    }! Tudo bem? O valor da Camisa Oficial O Bom Amigo foi fechado em R$ ${effectiveUnit
                      .toFixed(2)
                      .replace('.', ',')} por unidade (Total do seu pedido: R$ ${effectiveTotal
                      .toFixed(2)
                      .replace(
                        '.',
                        ','
                      )}). Para confirmar a confecção da sua peça, envie o comprovante do sinal ou quitação pelo PIX: ${
                      config.pixKey
                    } (${config.pixReceiver}). Qualquer dúvida me avise por aqui!`;

                const waUrl = cleanPhone
                  ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                      waMessage
                    )}`
                  : null;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
                  >
                    {/* Linha 1: Nome, Contato e Valor */}
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
                              title={isPreSave ? 'Avisar no WhatsApp' : 'Enviar Cobrança de Sinal'}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-slate-900 block">
                          {isPreSave
                            ? 'Sem custo agora'
                            : `R$ ${effectiveTotal.toFixed(2).replace('.', ',')}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {order.quantity}x {order.size}
                        </span>
                      </div>
                    </div>

                    {order.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                        Obs: {order.notes}
                      </p>
                    )}

                    {/* Linha 2: Status e Ações Rápidas de Pagamento */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {isPreSave ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <Sparkles size={12} /> Pré-Save Confirmado
                          </span>
                        ) : order.paymentStatus === 'pago' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> Quitado (100%)
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
                            <Clock size={12} /> Aguardando Sinal
                          </span>
                        )}
                      </div>

                      {/* Botões de Ação para o Super Usuário */}
                      <div className="flex items-center gap-1">
                        {isPreSave ? (
                          waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <MessageCircle size={12} />
                              <span>Avisar</span>
                            </a>
                          )
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleMarkPayment(order, 'pago', effectiveTotal)}
                              title="Marcar como 100% Quitado"
                              className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                order.paymentStatus === 'pago'
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              Pago 100%
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
                              title="Registrar Sinal Pago"
                              className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                order.paymentStatus === 'sinal'
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              Sinal
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMarkPayment(order, 'pendente', 0)}
                              title="Marcar Pendente"
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
                              onClick={() => handleMarkPayment(order, 'entregue', effectiveTotal)}
                              title="Marcar como Entregue"
                              className={`p-1 rounded-lg border transition-colors ${
                                order.paymentStatus === 'entregue'
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <PackageCheck size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL DE DEFINIR SINAL */}
      {signalModalOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Registrar Sinal Pago</h3>
              <button
                type="button"
                onClick={() => setSignalModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Doador:</strong> {signalModalOrder.userName}
              </p>
              <p>
                <strong>Total do Pedido:</strong> R${' '}
                {signalModalOrder.totalPrice.toFixed(2).replace('.', ',')} ({signalModalOrder.size} •{' '}
                {signalModalOrder.quantity} un)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor recebido como sinal (R$):
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
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancelar
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
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Salvar Sinal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO DE FASE, PREÇO, ARTE E PIX */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-slate-600" />
                Configurar Camisas Oficiais
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Seletor da Fase da Campanha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Fase Atual da Campanha:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditCampaignPhase('pre_save')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    editCampaignPhase === 'pre_save'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] block uppercase tracking-wider font-extrabold text-amber-600">
                    Fase 1
                  </span>
                  <span className="text-xs block font-bold">Pré-Save</span>
                  <span className="text-[10px] text-slate-500 block font-normal leading-tight mt-0.5">
                    Levantamento sem cobrança
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditCampaignPhase('oficial')}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    editCampaignPhase === 'oficial'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="text-[11px] block uppercase tracking-wider font-extrabold text-emerald-600">
                    Fase 2
                  </span>
                  <span className="text-xs block font-bold">Oficial & Cobrança</span>
                  <span className="text-[10px] text-slate-500 block font-normal leading-tight mt-0.5">
                    Preço fixado & Sinal via PIX
                  </span>
                </button>
              </div>
            </div>

            {/* Preço Unitário */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {editCampaignPhase === 'pre_save'
                  ? 'Preço Unitário Estimado (Opcional - R$):'
                  : 'Preço Unitário Final da Camisa (R$):'}
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                placeholder={editCampaignPhase === 'pre_save' ? '0.00 (A definir)' : '45.00'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-400"
                required={editCampaignPhase === 'oficial'}
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                {editCampaignPhase === 'pre_save'
                  ? 'Pode manter R$ 0,00 enquanto estiver na fase de cotação de demanda.'
                  : 'Este valor será cobrado no app para todos os pedidos do lote.'}
              </span>
            </div>

            {/* URL da Arte da Camisa */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL da Imagem / Arte da Camisa:
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
              {editImageUrl && (
                <div className="mt-2 w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img
                    src={editImageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Chave PIX */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chave PIX para Recebimento:
              </label>
              <input
                type="text"
                placeholder="Ex: CPF, CNPJ, e-mail ou celular"
                value={editPixKey}
                onChange={(e) => setEditPixKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Titular do PIX */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Titular do PIX:
              </label>
              <input
                type="text"
                placeholder="Nome da pessoa ou razão social"
                value={editPixReceiver}
                onChange={(e) => setEditPixReceiver(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Banco do PIX */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Banco (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Inter, NuBank, Caixa"
                value={editPixBank}
                onChange={(e) => setEditPixBank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50"
              >
                {savingConfig
                  ? 'Salvando...'
                  : editCampaignPhase === 'oficial'
                  ? 'Lançar Preço & Abrir Cobranças'
                  : 'Salvar Configuração'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
