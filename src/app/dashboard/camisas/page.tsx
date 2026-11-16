"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  FileSpreadsheet,
  PackageCheck,
  Send,
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
} from '@/lib/shirtOrders';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [config, setConfig] = useState<ShirtConfig>(DEFAULT_SHIRT_CONFIG);
  const [orders, setOrders] = useState<ShirtOrder[]>([]);
  const [allMembers, setAllMembers] = useState<MemberProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'pendente' | 'sinal' | 'pago' | 'nao_solicitaram'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedGrid, setCopiedGrid] = useState(false);

  // Modal de Configuração Geral da Camisa
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
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

  // Cálculos Estatísticos
  const totalShirtsCount = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalExpectedRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalCollectedRevenue = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const totalPendingRevenue = Math.max(0, totalExpectedRevenue - totalCollectedRevenue);

  const countPaid = orders.filter((o) => o.paymentStatus === 'pago').length;
  const countSignal = orders.filter((o) => o.paymentStatus === 'sinal').length;
  const countPending = orders.filter((o) => o.paymentStatus === 'pendente').length;
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
      `Total Geral: ${totalShirtsCount} unidades`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `---------------------------------`,
      ...Object.entries(sizeBreakdown).map(([sz, qty]) => `• ${sz}: ${qty} unid.`),
      `---------------------------------`,
      `Preço Unitário: R$ ${config.price.toFixed(2)}`,
      `Valor Previsto: R$ ${totalExpectedRevenue.toFixed(2)}`,
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
    const ok = await saveShirtConfig(supabase, {
      price: Number(editPrice),
      imageUrl: editImageUrl,
      pixKey: editPixKey,
      pixReceiver: editPixReceiver,
      pixBank: editPixBank,
    });
    setSavingConfig(false);
    if (ok) {
      setConfig((prev) => ({
        ...prev,
        price: Number(editPrice),
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
        ? o.paymentStatus === 'pendente'
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Topo: Título e Ações */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Shirt className="text-red-600" size={24} />
                Gestão das Camisas Oficiais
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Controle de pedidos, pagamentos, sinal, grade de produção e membros pendentes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyGrid}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-xs"
              >
                {copiedGrid ? <Check size={14} /> : <FileSpreadsheet size={14} />}
                <span>{copiedGrid ? 'Grade Copiada!' : 'Copiar Grade de Produção'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-2 transition-colors shadow-xs"
              >
                <Settings size={14} className="text-slate-500" />
                <span>Preço & Arte</span>
              </button>
            </div>
          </div>

          {/* Cards de Métricas e Totais Financeiros */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total de Camisas
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {totalShirtsCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">unidades</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal mt-1 block">
                {orders.length} membros solicitaram
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Total Já Arrecadado
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                  R$ {totalCollectedRevenue.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal mt-1 block">
                {countPaid} 100% quitados • {countSignal} c/ sinal
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Total Pendente
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-600">
                  R$ {totalPendingRevenue.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal mt-1 block">
                De R$ {totalExpectedRevenue.toFixed(2).replace('.', ',')} previstos
              </span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Não Solicitaram
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {membersWithoutOrder.length}
                </span>
                <span className="text-xs text-slate-500 font-medium">membros</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal mt-1 block">
                Disponíveis para convite
              </span>
            </div>
          </div>

          {/* Grade de Tamanhos para Confecção */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-slate-600" />
                Grade de Tamanhos (Para a Confecção)
              </h2>
              <span className="text-xs text-slate-500">
                Preço configurado: <strong>R$ {config.price.toFixed(2).replace('.', ',')}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_SHIRT_SIZES.map((sz) => {
                const count = sizeBreakdown[sz] || 0;
                return (
                  <div
                    key={sz}
                    className={`px-3 py-2 rounded-xl border text-center transition-all ${
                      count > 0
                        ? 'bg-slate-900 text-white border-slate-800 shadow-xs'
                        : 'bg-slate-50 text-slate-400 border-slate-200/60'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold block opacity-75">{sz}</span>
                    <span className="text-sm font-bold block">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Abas e Filtros */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Abas de visualização */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('todos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'todos'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Todos ({orders.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pendente')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'sinal'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Sinal Pago ({countSignal})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pago')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'pago'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Quitados ({countPaid + countDelivered})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('nao_solicitaram')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === 'nao_solicitaram'
                      ? 'bg-red-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Não Solicitaram ({membersWithoutOrder.length})
                </button>
              </div>

              {/* Barra de Busca */}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar doador, tamanho..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-400 bg-white"
                />
              </div>
            </div>

            {/* TABELA DE PEDIDOS OU LISTA DE NÃO SOLICITARAM */}
            {activeTab === 'nao_solicitaram' ? (
              /* LISTAGEM DE DOADORES QUE NÃO SOLICITARAM */
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Doadores Cadastrados que Ainda Não Solicitaram a Camisa
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Envie uma mensagem direta no WhatsApp convidando o doador para garantir a camisa oficial.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {filteredMembersWithoutOrder.length} doadores
                  </span>
                </div>

                {filteredMembersWithoutOrder.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhum doador encontrado nesta lista.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredMembersWithoutOrder.map((m) => {
                      const cleanPhone = (m.phone || '').replace(/\D/g, '');
                      const waUrl = cleanPhone
                        ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                            `Olá, ${
                              m.name ? m.name.split(' ')[0] : 'amigo'
                            }! As encomendas da Camisa Oficial do Movimento O Bom Amigo estão abertas no aplicativo. Acesse para escolher o seu tamanho e garantir a sua!`
                          )}`
                        : null;

                      return (
                        <div
                          key={m.id}
                          className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {m.avatar_url ? (
                              <img
                                src={m.avatar_url}
                                alt="Foto"
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200">
                                {m.name ? m.name.charAt(0) : '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {m.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {m.blood_type ? `Tipo ${m.blood_type}` : 'Doador'} •{' '}
                                {m.phone || 'Sem telefone'}
                              </p>
                            </div>
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
                                <span>Convidar no WhatsApp</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sem WhatsApp</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* TABELA DE PEDIDOS CADASTRADOS */
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhum pedido encontrado para o filtro selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-3.5">Doador</th>
                          <th className="p-3.5">Tamanho / Qtd</th>
                          <th className="p-3.5">Valor Total</th>
                          <th className="p-3.5">Status Pagamento</th>
                          <th className="p-3.5">Valor Pago</th>
                          <th className="p-3.5 text-right">Ações de Gestão</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order) => {
                          const cleanPhone = (order.userPhone || '').replace(/\D/g, '');
                          const waUrl = cleanPhone
                            ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
                                `Olá, ${order.userName.split(' ')[0]}! Tudo bem? Sobre o seu pedido da camisa oficial O Bom Amigo (Tamanho ${order.size}):`
                              )}`
                            : null;

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-3.5">
                                <div className="font-semibold text-slate-900">{order.userName}</div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  {order.userBloodType && (
                                    <span className="text-red-600 font-semibold">
                                      {order.userBloodType}
                                    </span>
                                  )}
                                  <span>{order.userPhone || 'Sem telefone'}</span>
                                  {waUrl && (
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-0.5"
                                      title="Conversar no WhatsApp"
                                    >
                                      <MessageCircle size={12} />
                                    </a>
                                  )}
                                </div>
                                {order.notes && (
                                  <div className="text-[10px] text-slate-400 italic mt-0.5">
                                    Obs: {order.notes}
                                  </div>
                                )}
                              </td>

                              <td className="p-3.5">
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                                  {order.size}
                                </span>
                                <span className="text-slate-500 ml-2">
                                  {order.quantity} {order.quantity > 1 ? 'unids' : 'unid'}
                                </span>
                              </td>

                              <td className="p-3.5 font-bold text-slate-900">
                                R$ {order.totalPrice.toFixed(2).replace('.', ',')}
                              </td>

                              <td className="p-3.5">
                                {order.paymentStatus === 'pago' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 size={12} /> Quitado (100%)
                                  </span>
                                ) : order.paymentStatus === 'sinal' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    <Clock size={12} /> Sinal Pago
                                  </span>
                                ) : order.paymentStatus === 'entregue' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                                    <PackageCheck size={12} /> Entregue
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock size={12} /> Não Pago
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5">
                                <span className="font-semibold text-slate-800">
                                  R$ {(order.amountPaid || 0).toFixed(2).replace('.', ',')}
                                </span>
                                {order.amountPaid > 0 && order.amountPaid < order.totalPrice && (
                                  <span className="text-[10px] text-amber-600 block">
                                    Falta: R$ {(order.totalPrice - order.amountPaid).toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {/* Botão Marcar Quitado (100%) */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPayment(order, 'pago', order.totalPrice)}
                                    title="Marcar como 100% Pago"
                                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                      order.paymentStatus === 'pago'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>

                                  {/* Botão Marcar Sinal */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSignalModalOrder(order);
                                      setSignalAmount(
                                        order.amountPaid > 0
                                          ? String(order.amountPaid)
                                          : String((order.totalPrice / 2).toFixed(2))
                                      );
                                    }}
                                    title="Marcar Sinal Pago"
                                    className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                                      order.paymentStatus === 'sinal'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    Sinal
                                  </button>

                                  {/* Botão Marcar Pendente (Não Pago) */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPayment(order, 'pendente', 0)}
                                    title="Marcar como Não Pago (Pendente)"
                                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                      order.paymentStatus === 'pendente'
                                        ? 'bg-amber-600 text-white border-amber-600'
                                        : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                                    }`}
                                  >
                                    <Clock size={15} />
                                  </button>

                                  {/* Botão Marcar Entregue */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPayment(order, 'entregue', order.totalPrice)}
                                    title="Marcar como Camisa Entregue"
                                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                      order.paymentStatus === 'entregue'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <PackageCheck size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
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
                Valor pago como sinal (R$):
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

      {/* MODAL DE CONFIGURAÇÃO DE PREÇO E ARTE DA CAMISA */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-slate-600" />
                Configurar Preço, Arte e PIX
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preço Unitário */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Unitário da Camisa (R$):
              </label>
              <input
                type="number"
                step="0.50"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-slate-400"
                required
              />
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
                {savingConfig ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
