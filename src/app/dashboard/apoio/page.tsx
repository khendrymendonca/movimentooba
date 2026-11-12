"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  IdCard,
  Bug,
  Lightbulb,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  SupportTicket,
  TicketCategory,
  TicketStatus,
  CATEGORY_CONFIG,
  fetchSupportTickets,
  updateSupportTicket,
  approveNameChangeTicket,
} from '@/lib/supportTickets';

export default function DashboardApoioPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TicketCategory>('all');

  // Modal de atendimento
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('resolvido');
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const loadTickets = async () => {
    setLoading(true);
    const data = await fetchSupportTickets(supabase);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'ADM') {
        router.push('/doador');
        return;
      }

      setCurrentAdmin(profile);
      await loadTickets();
    }

    init();
  }, [router, supabase]);

  const handleOpenTicket = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setAdminResponse(ticket.adminResponse || '');
    setNewStatus(ticket.status === 'pendente' ? 'em_analise' : ticket.status);
    setActionSuccess(null);
    setActionError(null);
  };

  const handleSaveTicket = async () => {
    if (!activeTicket) return;
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const { error, updatedTicket } = await updateSupportTicket(supabase, activeTicket.id, {
      status: newStatus,
      adminResponse: adminResponse.trim(),
      adminId: currentAdmin?.id,
      adminName: currentAdmin?.name || 'Coordenação O Bom Amigo',
    });

    setProcessing(false);

    if (error) {
      setActionError(error);
      return;
    }

    setActionSuccess('Chamado atualizado e notificação enviada ao membro com sucesso!');
    if (updatedTicket) {
      setActiveTicket(updatedTicket);
      setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
    }
  };

  const handleApproveNameChange = async () => {
    if (!activeTicket || !activeTicket.requestedName) return;
    setProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const { error } = await approveNameChangeTicket(
      supabase,
      activeTicket,
      currentAdmin?.id,
      currentAdmin?.name || 'Coordenação O Bom Amigo'
    );

    setProcessing(false);

    if (error) {
      setActionError(error);
      return;
    }

    setActionSuccess(
      `Nome atualizado para "${activeTicket.requestedName}" com sucesso na Carteirinha e chamado concluído!`
    );
    await loadTickets();
  };

  // Filtragem dos chamados
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.userEmail && ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Métricas
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((t) => t.status === 'pendente').length;
  const nameChangeTickets = tickets.filter((t) => t.category === 'ajuste_nome').length;
  const bugTickets = tickets.filter((t) => t.category === 'relato_bug').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolvido').length;

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      {/* Cabeçalho da Área Administrativa */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="text-red-600" size={26} />
            Central de Apoio & Chamados
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-1">
            Gestão de chamados diretos: Ajustes de Nome na Carteirinha (2 dias úteis), Relatos de Bug
            (5 dias úteis) e Sugestões.
          </p>
        </div>

        <button
          onClick={loadTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar Lista
        </button>
      </div>

      {/* CARDS DE MÉTRICAS / KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total de Chamados</span>
            <LifeBuoy size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalTickets}</p>
          <span className="text-[10px] text-slate-400">Registrados no sistema</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">Pendentes</span>
            <Clock size={16} />
          </div>
          <p className="text-2xl font-bold text-amber-700">{pendingTickets}</p>
          <span className="text-[10px] text-amber-600 font-medium">Aguardando atendimento</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Ajustes no Nome</span>
            <IdCard size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{nameChangeTickets}</p>
          <span className="text-[10px] font-semibold text-amber-600">SLA: até 2 dias úteis</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Relatos de Bug</span>
            <Bug size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{bugTickets}</p>
          <span className="text-[10px] font-semibold text-red-600">SLA: até 5 dias úteis</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Resolvidos</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{resolvedTickets}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Chamados concluídos</span>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por protocolo (#APO-2026-...), nome do membro ou mensagem..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_analise">Em Análise</option>
              <option value="resolvido">Resolvidos</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="ajuste_nome">Ajuste de Nome (2 dias úteis)</option>
              <option value="relato_bug">Relato de Bug (5 dias úteis)</option>
              <option value="sugestao">Sugestão (5 dias úteis)</option>
              <option value="outro">Outro Assunto</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA / LISTA DE CHAMADOS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3" />
            <p className="text-xs">Carregando chamados de apoio...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <CheckCircle2 size={32} className="text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700">Nenhum chamado encontrado</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Tudo em ordem! Não há chamados correspondentes aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Protocolo / Data</th>
                  <th className="py-3 px-4">Membro Solicitante</th>
                  <th className="py-3 px-4">Tipo & SLA</th>
                  <th className="py-3 px-4">Descrição da Solicitação</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTickets.map((ticket) => {
                  const isResolved = ticket.status === 'resolvido';
                  const isInAnalysis = ticket.status === 'em_analise';
                  const isPending = ticket.status === 'pendente';

                  const isNameChange = ticket.category === 'ajuste_nome';
                  const isBug = ticket.category === 'relato_bug';

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenTicket(ticket)}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] block w-fit">
                          {ticket.protocol}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{ticket.userName}</div>
                        {ticket.userEmail && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                            {ticket.userEmail}
                          </span>
                        )}
                        {ticket.userPhone && (
                          <span className="text-[10px] text-emerald-600 font-medium block">
                            WhatsApp: {ticket.userPhone}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          {isNameChange ? (
                            <IdCard size={14} className="text-amber-500" />
                          ) : isBug ? (
                            <Bug size={14} className="text-red-500" />
                          ) : (
                            <Lightbulb size={14} className="text-emerald-500" />
                          )}
                          <span>{ticket.categoryLabel}</span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                            isNameChange
                              ? 'bg-amber-100 text-amber-800'
                              : isBug
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          ⏱️ {ticket.slaBusinessDaysText}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <span className="font-semibold text-slate-800 block truncate">
                          {ticket.title}
                        </span>
                        <span className="text-slate-500 text-[11px] block truncate">
                          {ticket.description}
                        </span>
                        {ticket.requestedName && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-1">
                            Novo nome: &quot;{ticket.requestedName}&quot;
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isInAnalysis
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                          }`}
                        >
                          {isResolved ? 'Resolvido' : isInAnalysis ? 'Em Análise' : 'Pendente'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenTicket(ticket)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                        >
                          Atender
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE ATENDIMENTO DE CHAMADO PELO GESTOR */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    {activeTicket.protocol}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeTicket.status === 'resolvido'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeTicket.status === 'em_analise'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeTicket.status === 'resolvido'
                      ? 'Resolvido'
                      : activeTicket.status === 'em_analise'
                      ? 'Em Análise'
                      : 'Pendente'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1.5">{activeTicket.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mensagens de Sucesso e Erro */}
            {actionSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Cartão do Solicitante com atalhos de contato */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">{activeTicket.userName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Aberto em: {new Date(activeTicket.createdAt).toLocaleString('pt-BR')} • SLA:{' '}
                  <strong className="text-red-700">{activeTicket.slaBusinessDaysText}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeTicket.userPhone && (
                  <a
                    href={`https://wa.me/55${activeTicket.userPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                  >
                    <Phone size={12} /> WhatsApp
                  </a>
                )}
                {activeTicket.userEmail && (
                  <a
                    href={`mailto:${activeTicket.userEmail}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    <Mail size={12} /> E-mail
                  </a>
                )}
              </div>
            </div>

            {/* DESTAQUE DE AJUSTE DE NOME NA CARTEIRINHA COM BOTÃO DE 1 CLIQUE */}
            {activeTicket.category === 'ajuste_nome' && activeTicket.requestedName && (
              <div className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <IdCard size={16} className="text-amber-700" />
                  Solicitação de Alteração de Nome na Carteirinha Digital
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-slate-400 block font-medium">Nome Atual no Perfil:</span>
                    <strong className="text-slate-700 block truncate">
                      {activeTicket.currentName || activeTicket.userName}
                    </strong>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-300 ring-2 ring-amber-200/50">
                    <span className="text-[10px] text-amber-700 block font-bold">Novo Nome Solicitado:</span>
                    <strong className="text-amber-950 block truncate text-sm">
                      {activeTicket.requestedName}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={processing}
                  onClick={handleApproveNameChange}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <UserCheck size={16} />
                  Aprovar & Atualizar Nome na Carteirinha com 1 Clique
                </button>
                <p className="text-[10px] text-amber-800 text-center font-normal">
                  Atualiza automaticamente o cadastro do membro, conclui o chamado e envia notificação no app.
                </p>
              </div>
            )}

            {/* Conteúdo Detalhado da Solicitação */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Relato do Membro
              </label>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {activeTicket.description}
              </div>
            </div>

            {/* FORMULÁRIO DE RESPOSTA DO GESTOR */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Parecer / Resposta da Coordenação
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Alterar Status:</span>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="resolvido">Resolvido</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={3}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Escreva sua resposta ou orientação para o membro..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="flex-1 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={handleSaveTicket}
                  className="flex-1 py-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <MessageSquare size={14} />
                  {processing ? 'Salvando...' : 'Salvar & Notificar Membro'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
