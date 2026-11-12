"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  IdCard,
  Bug,
  Lightbulb,
  ArrowLeft,
  X,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  SupportTicket,
  TicketCategory,
  CATEGORY_CONFIG,
  fetchSupportTickets,
  createSupportTicket,
} from '@/lib/supportTickets';

export default function DoadorApoioPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Modal de abertura de chamado
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState<SupportTicket | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos do formulário
  const [category, setCategory] = useState<TicketCategory>('ajuste_nome');
  const [requestedName, setRequestedName] = useState('');
  const [nameJustification, setNameJustification] = useState('');
  const [affectedScreen, setAffectedScreen] = useState('Carteirinha');
  const [bugDescription, setBugDescription] = useState('');
  const [suggestionTitle, setSuggestionTitle] = useState('');
  const [suggestionDescription, setSuggestionDescription] = useState('');
  const [generalMessage, setGeneralMessage] = useState('');

  // Modal de visualização de detalhes do chamado
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
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

      setUserProfile(profile || { id: session.user.id, name: 'Doador' });

      const userTickets = await fetchSupportTickets(supabase, session.user.id);
      setTickets(userTickets);
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  const handleOpenCreateModal = (initialCategory: TicketCategory = 'ajuste_nome') => {
    setCategory(initialCategory);
    setRequestedName('');
    setNameJustification('');
    setAffectedScreen('Carteirinha');
    setBugDescription('');
    setSuggestionTitle('');
    setSuggestionDescription('');
    setGeneralMessage('');
    setErrorMsg(null);
    setSuccessTicket(null);
    setShowCreateModal(true);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setErrorMsg(null);
    setSubmitting(true);

    let title = '';
    let description = '';

    if (category === 'ajuste_nome') {
      if (!requestedName.trim()) {
        setErrorMsg('Por favor, informe o novo nome completo desejado para a carteirinha.');
        setSubmitting(false);
        return;
      }
      title = 'Ajuste de nome na Carteirinha Digital';
      description = `Solicitação de alteração do nome exibido na carteirinha de "${userProfile.name}" para "${requestedName.trim()}". Motivo: ${
        nameJustification.trim() || 'Ajuste cadastral'
      }`;
    } else if (category === 'relato_bug') {
      if (!bugDescription.trim()) {
        setErrorMsg('Por favor, descreva detalhadamente o erro ou comportamento inesperado.');
        setSubmitting(false);
        return;
      }
      title = `Relato de bug na tela: ${affectedScreen}`;
      description = `Tela afetada: ${affectedScreen}\n\nDescrição do ocorrido:\n${bugDescription.trim()}`;
    } else if (category === 'sugestao') {
      if (!suggestionDescription.trim()) {
        setErrorMsg('Por favor, descreva sua ideia ou sugestão.');
        setSubmitting(false);
        return;
      }
      title = suggestionTitle.trim() || 'Sugestão de melhoria para o projeto';
      description = suggestionDescription.trim();
    } else {
      if (!generalMessage.trim()) {
        setErrorMsg('Por favor, escreva sua mensagem ou dúvida.');
        setSubmitting(false);
        return;
      }
      title = 'Dúvida ou solicitação geral';
      description = generalMessage.trim();
    }

    const { ticket, error } = await createSupportTicket(supabase, {
      userId: userProfile.id,
      userName: userProfile.name || 'Doador',
      userEmail: userProfile.email || undefined,
      userPhone: userProfile.phone || undefined,
      category,
      title,
      description,
      currentName: userProfile.name,
      requestedName: category === 'ajuste_nome' ? requestedName.trim() : undefined,
      affectedScreen: category === 'relato_bug' ? affectedScreen : undefined,
    });

    setSubmitting(false);

    if (error || !ticket) {
      setErrorMsg(error || 'Ocorreu um erro ao registrar seu chamado. Tente novamente.');
      return;
    }

    setSuccessTicket(ticket);
    setTickets((prev) => [ticket, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3" />
        <p className="text-xs text-slate-400 font-normal">Carregando área de Apoio...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fa] max-w-2xl mx-auto w-full pb-16">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4 bg-[#f8f9fa] sticky top-0 z-20 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <Link
            href="/doador"
            className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <LifeBuoy size={20} className="text-red-600" />
              Central de Apoio
            </h1>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Canal direto com a coordenação para ajustes e melhorias.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenCreateModal('ajuste_nome')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus size={15} />
          Novo Chamado
        </button>
      </div>

      <div className="px-6 space-y-6 mt-4">
        {/* Banner Informativo de Prazos (SLAs Oficiais) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">
            <Clock size={14} /> Prazos de Atendimento (Dias Úteis)
          </div>
          <p className="text-xs text-slate-300 font-normal leading-relaxed">
            Seus chamados são encaminhados diretamente para o gestor do Movimento O Bom Amigo.
            Acompanhe os prazos oficiais de atendimento:
          </p>

          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              onClick={() => handleOpenCreateModal('ajuste_nome')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/10 text-left transition-colors group"
            >
              <div className="flex items-center justify-between">
                <IdCard size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full">
                  2 dias úteis
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white mt-1.5">Ajuste no Nome</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Correção na carteirinha digital</p>
            </button>

            <button
              onClick={() => handleOpenCreateModal('relato_bug')}
              className="bg-white/10 hover:bg-white/15 p-3 rounded-xl border border-white/10 text-left transition-colors group"
            >
              <div className="flex items-center justify-between">
                <Bug size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold bg-red-400/20 text-red-300 px-2 py-0.5 rounded-full">
                  5 dias úteis
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white mt-1.5">Relatar Bug</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Erros ou falhas no aplicativo</p>
            </button>
          </div>

          <div className="mt-2.5">
            <button
              onClick={() => handleOpenCreateModal('sugestao')}
              className="w-full bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/5 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb size={14} className="text-emerald-400" />
                <span className="text-xs text-slate-200 font-medium">Tem uma ideia ou sugestão?</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400">Até 5 dias úteis →</span>
            </button>
          </div>
        </div>

        {/* Lista de Chamados Abertos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Meus Chamados</h2>
            <span className="text-xs text-slate-500 font-normal">
              {tickets.length} {tickets.length === 1 ? 'chamado' : 'chamados'}
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-sm font-medium text-slate-800">Nenhum chamado aberto</h3>
              <p className="text-xs text-slate-500 font-normal mt-1 max-w-sm mx-auto">
                Precisa de ajuste no nome da carteirinha ou encontrou alguma falha no aplicativo?
                Abra um chamado direto com a coordenação.
              </p>
              <button
                onClick={() => handleOpenCreateModal('ajuste_nome')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <Plus size={14} /> Abrir Meu Primeiro Chamado
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const isPending = t.status === 'pendente';
                const isInAnalysis = t.status === 'em_analise';
                const isResolved = t.status === 'resolvido';

                const statusBg = isResolved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : isInAnalysis
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200';

                const statusLabel = isResolved
                  ? 'Resolvido'
                  : isInAnalysis
                  ? 'Em Análise'
                  : 'Pendente';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {t.protocol}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-600 font-normal mt-1 line-clamp-2">
                      {t.description}
                    </p>

                    {/* Resposta do Gestor se houver */}
                    {t.adminResponse && (
                      <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px] mb-0.5">
                          <CheckCircle2 size={13} className="text-emerald-600" /> Parecer da Coordenação:
                        </div>
                        <p className="text-emerald-900 font-normal text-xs">{t.adminResponse}</p>
                      </div>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        Prazo estimado: <strong className="text-slate-700">{t.slaBusinessDaysText}</strong>
                      </span>
                      <span className="text-red-600 font-medium hover:underline">Ver detalhes →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ABERTURA DE NOVO CHAMADO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {successTicket ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Chamado Registrado!</h3>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1">
                  <p className="text-xs text-slate-500">
                    Protocolo: <strong className="font-mono text-slate-900">{successTicket.protocol}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Categoria: <strong className="text-slate-900">{successTicket.categoryLabel}</strong>
                  </p>
                  <p className="text-xs text-slate-500">
                    Prazo de atendimento: <strong className="text-red-600 font-semibold">{successTicket.slaBusinessDaysText}</strong>
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  Sua solicitação foi encaminhada diretamente para a coordenação. Você receberá uma notificação assim que for avaliada.
                </p>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Concluir e Voltar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <LifeBuoy size={18} className="text-red-600" />
                    <h3 className="text-sm font-bold text-slate-900">Abrir Chamado com o Gestor</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Seleção de Categoria */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Selecione o tipo de solicitação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory('ajuste_nome')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === 'ajuste_nome'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <IdCard size={15} />
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            category === 'ajuste_nome' ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          2 dias
                        </span>
                      </div>
                      <div className="text-xs font-semibold leading-tight">Ajuste no Nome</div>
                      <div
                        className={`text-[10px] mt-0.5 leading-tight ${
                          category === 'ajuste_nome' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        Carteirinha Digital
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('relato_bug')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === 'relato_bug'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Bug size={15} />
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            category === 'relato_bug' ? 'bg-red-400 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          5 dias
                        </span>
                      </div>
                      <div className="text-xs font-semibold leading-tight">Relatar Bug</div>
                      <div
                        className={`text-[10px] mt-0.5 leading-tight ${
                          category === 'relato_bug' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        Erro no sistema
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('sugestao')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === 'sugestao'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Lightbulb size={15} />
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            category === 'sugestao' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          5 dias
                        </span>
                      </div>
                      <div className="text-xs font-semibold leading-tight">Sugestão</div>
                      <div
                        className={`text-[10px] mt-0.5 leading-tight ${
                          category === 'sugestao' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        Ideia de melhoria
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('outro')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        category === 'outro'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <HelpCircle size={15} />
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            category === 'outro' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Geral
                        </span>
                      </div>
                      <div className="text-xs font-semibold leading-tight">Outro Assunto</div>
                      <div
                        className={`text-[10px] mt-0.5 leading-tight ${
                          category === 'outro' ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        Dúvidas gerais
                      </div>
                    </button>
                  </div>
                </div>

                {/* Badge de Prazo de Atendimento do Tipo Escolhido */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">Prazo máximo de atendimento:</span>
                  <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                    ⏱️ {CATEGORY_CONFIG[category].slaText}
                  </span>
                </div>

                {/* CAMPOS ESPECÍFICOS: AJUSTE DE NOME */}
                {category === 'ajuste_nome' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                      <strong>Atenção:</strong> Conforme solicitado, a carteirinha exibe exclusivamente o seu nome oficial. Use este canal para corrigir grafia, acentuação ou registrar seu nome civil correto.
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Nome atual no cadastro
                      </label>
                      <input
                        type="text"
                        disabled
                        value={userProfile.name || ''}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-500 font-medium cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Novo Nome Completo para constar na Carteirinha *
                      </label>
                      <input
                        type="text"
                        required
                        value={requestedName}
                        onChange={(e) => setRequestedName(e.target.value)}
                        placeholder="Ex: João Pedro da Silva Santos"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Motivo do ajuste (opcional)
                      </label>
                      <input
                        type="text"
                        value={nameJustification}
                        onChange={(e) => setNameJustification(e.target.value)}
                        placeholder="Ex: Correção de sobrenome digitado errado"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS: RELATO DE BUG */}
                {category === 'relato_bug' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Em qual tela ou área o erro aconteceu?
                      </label>
                      <select
                        value={affectedScreen}
                        onChange={(e) => setAffectedScreen(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                      >
                        <option value="Carteirinha">Minha Carteirinha</option>
                        <option value="Minhas Medalhas">Minhas Medalhas</option>
                        <option value="Minhas Doações">Minhas Doações / Registro de Doação</option>
                        <option value="Login / Senha">Login, Olho da Senha ou Cadastro</option>
                        <option value="Meu Perfil">Meu Perfil / Foto 3x4</option>
                        <option value="Outro">Outra tela do sistema</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Descreva o que aconteceu de errado *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={bugDescription}
                        onChange={(e) => setBugDescription(e.target.value)}
                        placeholder="Ex: Ao tocar no botão de olho para ver a senha, nada acontecia... ou: Não consegui registrar a doação mesmo estando dentro do prazo..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS: SUGESTÃO */}
                {category === 'sugestao' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Título da ideia ou melhoria
                      </label>
                      <input
                        type="text"
                        value={suggestionTitle}
                        onChange={(e) => setSuggestionTitle(e.target.value)}
                        placeholder="Ex: Notificação de lembrete 3 dias antes do mutirão"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">
                        Descreva sua sugestão detalhadamente *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={suggestionDescription}
                        onChange={(e) => setSuggestionDescription(e.target.value)}
                        placeholder="Compartilhe como podemos tornar o Movimento O Bom Amigo ainda melhor..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS: OUTRO */}
                {category === 'outro' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Mensagem / Dúvida *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={generalMessage}
                      onChange={(e) => setGeneralMessage(e.target.value)}
                      placeholder="Escreva sua mensagem diretamente para a coordenação..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Enviando chamado...' : 'Enviar Chamado'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO CHAMADO */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {selectedTicket.protocol}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedTicket.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Categoria:</span>
                <strong className="text-slate-800">{selectedTicket.categoryLabel}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Prazo SLA Oficial:</span>
                <strong className="text-red-700 font-semibold">{selectedTicket.slaBusinessDaysText}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Data de Abertura:</span>
                <strong className="text-slate-800">
                  {new Date(selectedTicket.createdAt).toLocaleString('pt-BR')}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-slate-500">
                <span>Status Atual:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                    selectedTicket.status === 'resolvido'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedTicket.status === 'em_analise'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedTicket.status === 'resolvido'
                    ? 'Resolvido'
                    : selectedTicket.status === 'em_analise'
                    ? 'Em Análise'
                    : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Conteúdo da solicitação */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Descrição da Solicitação
              </p>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-normal">
                {selectedTicket.description}
              </p>
            </div>

            {/* Parecer do Gestor */}
            {selectedTicket.adminResponse ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  Parecer Oficial da Coordenação
                </div>
                <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed font-normal">
                  {selectedTicket.adminResponse}
                </p>
                {selectedTicket.resolvedAt && (
                  <p className="text-[10px] text-emerald-700 mt-2">
                    Concluído em: {new Date(selectedTicket.resolvedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-center gap-2 text-xs text-amber-800">
                <Clock size={15} className="shrink-0 text-amber-600" />
                <span>Seu chamado está na fila do gestor e será respondido dentro do prazo estipulado.</span>
              </div>
            )}

            <button
              onClick={() => setSelectedTicket(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
