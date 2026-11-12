"use client";

import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  MessageCircle,
  Save,
  HeartHandshake,
  ChevronRight,
  Edit2,
  X,
  Heart,
  CheckCircle2,
  Bell,
  Search,
  Award,
  Star,
  Crown,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import {
  fetchGroupCampaigns,
  createGroupCampaign,
  updateGroupCampaign,
  deleteGroupCampaign,
  fetchSupportCampaigns,
  createSupportCampaign,
  updateSupportCampaign,
  deleteSupportCampaign,
  createSystemNotice,
  fetchProjectConfig,
  saveProjectConfig,
  DEFAULT_PROJECT_CONFIG,
  ProjectConfig,
  fetchSpecialBadgesStore,
  toggleUserSpecialBadge,
  toggleUserMutiraoBadge,
  UserSpecialBadges,
  syncGlobalDonationsCount,
} from '@/lib/campaigns';
import {
  GroupCampaign,
  SupportCampaign,
  parseSafeDate,
  canDonateBlood,
  checkEligibilityForDate,
} from '@/utils/donationRules';

export default function Dashboard() {
  const [stats, setStats] = useState({
    doadoresAtivos: 0,
    carteirinhasPendentes: 0,
    novosMembros: 0,
    mutiroesAgendados: 0,
  });
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [supportCampaigns, setSupportCampaigns] = useState<SupportCampaign[]>([]);
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  // Formulário Novo Mutirão
  const [campTitle, setCampTitle] = useState('');
  const [campDate, setCampDate] = useState('');
  const [campTime, setCampTime] = useState('08:00');
  const [campLocation, setCampLocation] = useState('Hemominas - Juiz de Fora');
  const [campDesc, setCampDesc] = useState('');

  // Edição / Reagendamento de Mutirão
  const [editingCampaign, setEditingCampaign] = useState<GroupCampaign | null>(null);

  // Formulário Nova Campanha SOS (Rede de Apoio)
  const [sosPatient, setSosPatient] = useState('');
  const [sosHospital, setSosHospital] = useState('Hemominas - Juiz de Fora');
  const [sosCity, setSosCity] = useState('Juiz de Fora - MG');
  const [sosBloodType, setSosBloodType] = useState('Qualquer Tipo');
  const [sosUrgency, setSosUrgency] = useState<'Normal' | 'Urgente' | 'Crítica'>('Urgente');
  const [sosDesc, setSosDesc] = useState('');
  const [sosContact, setSosContact] = useState('');
  const [savingSos, setSavingSos] = useState(false);

  // Modal de Membros Compatíveis com um Pedido SOS
  const [activeSosMatch, setActiveSosMatch] = useState<SupportCampaign | null>(null);
  const [matchedMembers, setMatchedMembers] = useState<any[]>([]);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Comunicado Geral do App
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [savingNotice, setSavingNotice] = useState(false);

  // Membros & Concessão Individual de Medalhas Especiais
  const [members, setMembers] = useState<any[]>([]);
  const [specialBadgesStore, setSpecialBadgesStore] = useState<Record<string, UserSpecialBadges>>({});
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberForBadges, setSelectedMemberForBadges] = useState<any | null>(null);

  const supabase = createClient();

  async function loadDashboardData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: doadoresCount },
      { count: novosMembrosCount },
      { count: pendentesCount },
      loadedCampaigns,
      loadedSupport,
      loadedConfig,
      membersRes,
      badgesStoreRes,
      donationsTotalRes,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'User')
        .eq('is_active', true),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('cards').select('*', { count: 'exact', head: true }).neq('status', 'Ativa'),
      fetchGroupCampaigns(supabase),
      fetchSupportCampaigns(supabase),
      fetchProjectConfig(supabase),
      supabase
        .from('profiles')
        .select('*, cards(status)')
        .order('name', { ascending: true }),
      fetchSpecialBadgesStore(supabase),
      supabase.from('donations').select('*', { count: 'exact', head: true }),
    ]);

    if (typeof donationsTotalRes.count === 'number') {
      syncGlobalDonationsCount(supabase, donationsTotalRes.count);
    }

    setCampaigns(loadedCampaigns);
    setSupportCampaigns(loadedSupport);
    setConfig(loadedConfig);
    if (membersRes.data) setMembers(membersRes.data);
    if (badgesStoreRes) setSpecialBadgesStore(badgesStoreRes.store);
    setStats({
      doadoresAtivos: doadoresCount || 0,
      carteirinhasPendentes: pendentesCount || 0,
      novosMembros: novosMembrosCount || 0,
      mutiroesAgendados: loadedCampaigns.length,
    });
    setLoading(false);
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 1. Criar Mutirão
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle || !campDate) return;
    setSavingCampaign(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await createGroupCampaign(
      supabase,
      {
        title: campTitle,
        campaign_date: campDate,
        campaign_time: campTime,
        location: campLocation,
        description: campDesc,
      },
      session?.user?.id
    );

    setSavingCampaign(false);
    if (error) {
      alert('Erro ao agendar mutirão: ' + error);
    } else {
      setCampTitle('');
      setCampDate('');
      setCampDesc('');
      await loadDashboardData();
    }
  };

  // 2. Salvar Edição / Reagendamento de Mutirão
  const handleSaveEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setSavingCampaign(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await updateGroupCampaign(
      supabase,
      editingCampaign.id,
      editingCampaign,
      session?.user?.id
    );

    setSavingCampaign(false);
    if (error) {
      alert('Erro ao atualizar: ' + error);
    } else {
      setEditingCampaign(null);
      await loadDashboardData();
      alert('Mutirão atualizado com sucesso! (Se a data mudou, o aviso foi enviado aos doadores)');
    }
  };

  const handleRemoveCampaign = async (id: string) => {
    if (!confirm('Deseja remover esta data de doação em massa?')) return;
    await deleteGroupCampaign(supabase, id);
    await loadDashboardData();
  };

  // 3. Criar Pedido SOS (Rede de Apoio)
  const handleCreateSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosPatient) return;
    setSavingSos(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await createSupportCampaign(
      supabase,
      {
        patient_name: sosPatient,
        hospital: sosHospital,
        city: sosCity,
        blood_type_needed: sosBloodType,
        urgency: sosUrgency,
        description: sosDesc,
        contact_info: sosContact,
        status: 'Ativa',
      },
      session?.user?.id
    );

    setSavingSos(false);
    if (error) {
      alert('Erro ao registrar pedido de apoio: ' + error);
    } else {
      setSosPatient('');
      setSosDesc('');
      setSosContact('');
      await loadDashboardData();
      alert('Pedido da Rede de Apoio publicado com sucesso no app!');
    }
  };

  // 4. Cruzar Membros Aptos e Compatíveis com o Pedido SOS
  const handleOpenSosMatch = async (sos: SupportCampaign) => {
    setActiveSosMatch(sos);
    setLoadingMatch(true);

    const { data: members } = await supabase
      .from('profiles')
      .select('id, name, blood_type, sex, last_donation_date, is_active')
      .eq('is_active', true);

    if (members) {
      const matched = members
        .map((m) => {
          const isCompatible = canDonateBlood(m.blood_type, sos.blood_type_needed);
          const elig = checkEligibilityForDate(m.sex || 'M', m.last_donation_date, new Date());
          return {
            ...m,
            isCompatible,
            canDonateNow: isCompatible && elig.isEligible,
            elig,
          };
        })
        .filter((m) => m.isCompatible);

      matched.sort((a, b) => {
        if (a.canDonateNow && !b.canDonateNow) return -1;
        if (!a.canDonateNow && b.canDonateNow) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });

      setMatchedMembers(matched);
    }

    setLoadingMatch(false);
  };

  // 5. Salvar Comunicado do App
  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMsg) return;
    setSavingNotice(true);

    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await createSystemNotice(supabase, noticeTitle, noticeMsg, session?.user?.id);
    setSavingNotice(false);

    if (error) {
      alert('Erro ao enviar aviso: ' + error);
    } else {
      setNoticeTitle('');
      setNoticeMsg('');
      alert('Aviso enviado para a Central de Notificações de todos os membros!');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await saveProjectConfig(supabase, config, session?.user?.id);
    setSavingConfig(false);
    if (error) alert('Erro ao salvar: ' + error);
    else alert('Links salvos com sucesso!');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full pt-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-3"></div>
        <p className="text-xs text-slate-400 font-normal">Carregando gestão...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Slim Mobile */}
      <div className="px-6 pt-8 pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Gestão do Projeto
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Controle de membros, mutirões e rede de apoio.
          </p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Resumo Compacto 2x2 */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block font-normal">Doadores Ativos</span>
              <span className="text-lg font-semibold text-slate-900">{stats.doadoresAtivos}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block font-normal">Mutirões</span>
              <span className="text-lg font-semibold text-slate-900">{stats.mutiroesAgendados}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos para Membros e Mural */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/dashboard/membros"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-900">Membros</h3>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">Cartões e chamados</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </Link>

          <Link
            href="/dashboard/noticias"
            className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-2"
          >
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-900">Mural</h3>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">Publicar avisos</p>
            </div>
            <ChevronRight size={16} className="text-slate-400 shrink-0" />
          </Link>
        </div>

        {/* SEÇÃO: MEMBROS & LIBERAÇÃO INDIVIDUAL DE MEDALHAS ESPECIAIS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Award size={17} className="text-amber-500" />
                Membros & Concessão de Medalhas Especiais
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Após o encerramento do mutirão ou doação, confirme a presença e libere aqui as medalhas individualmente. O doador recebe uma notificação automática imediata.
              </p>
            </div>
            <Link
              href="/dashboard/membros"
              className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Ver todos os membros <ChevronRight size={13} />
            </Link>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Buscar membro por nome ou tipo sanguíneo..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 font-normal"
            />
          </div>

          {/* Lista de Membros Filtrada */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {members
              .filter((m) => {
                const term = memberSearch.toLowerCase().trim();
                return (
                  !term ||
                  m.name?.toLowerCase().includes(term) ||
                  m.blood_type?.toLowerCase().includes(term)
                );
              })
              .map((member) => {
                const userBadges = specialBadgesStore[member.id] || {};
                const mutiraoCount = userBadges.mutiraoIds?.length || 0;

                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 overflow-hidden flex items-center justify-center font-semibold text-xs shrink-0 border border-slate-200">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                          {member.name || 'Doador'}
                          <span className="text-[10px] font-normal text-red-700 bg-red-50 px-1.5 py-0.2 rounded-md">
                            {member.blood_type || '-'}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-normal truncate mt-0.5">
                          {member.email || (member.is_active ? 'Membro Ativo' : 'Membro Inativo')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedMemberForBadges(member)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shrink-0 inline-flex items-center gap-1"
                    >
                      <Award size={13} /> Liberar Medalhas
                    </button>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 1. REDE DE APOIO SOS (CRUZAMENTO DE SANGUE COM MEMBROS) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Heart size={16} className="text-red-600 fill-red-600" />
              Rede de Apoio: Pedidos de Sangue
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Cadastre quem está precisando de sangue e veja em tempo real quais membros podem doar.
            </p>
          </div>

          <form onSubmit={handleCreateSos} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-normal">
                Nome do Paciente / Beneficiário
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={sosPatient}
                onChange={(e) => setSosPatient(e.target.value)}
                placeholder="Ex: Maria Clara Souza"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-normal"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">
                  Tipo Necessário
                </label>
                <select
                  value={sosBloodType}
                  onChange={(e) => setSosBloodType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 font-normal"
                >
                  <option value="Qualquer Tipo">Qualquer Tipo</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">Urgência</label>
                <select
                  value={sosUrgency}
                  onChange={(e) => setSosUrgency(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 font-normal"
                >
                  <option value="Urgente">Urgente</option>
                  <option value="Crítica">🚨 Crítica</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">
                  Hospital / Local
                </label>
                <input
                  type="text"
                  required
                  value={sosHospital}
                  onChange={(e) => setSosHospital(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">
                  Contato / Protocolo
                </label>
                <input
                  type="text"
                  value={sosContact}
                  onChange={(e) => setSosContact(e.target.value)}
                  placeholder="Ex: Leito 12 / (32) 99999-..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-normal">
                Observações adicionais (opcional)
              </label>
              <input
                type="text"
                value={sosDesc}
                onChange={(e) => setSosDesc(e.target.value)}
                placeholder="Ex: Cirurgia cardíaca marcada para quarta-feira."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={savingSos}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-normal text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Heart size={15} />
              {savingSos ? 'Publicando...' : 'Publicar na Rede de Apoio'}
            </button>
          </form>

          {/* Lista de Pedidos Ativos */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {supportCampaigns.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 font-normal">
                Nenhum pedido de apoio ativo no momento.
              </p>
            ) : (
              supportCampaigns.map((sos) => (
                <div
                  key={sos.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                          {sos.blood_type_needed}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {sos.urgency === 'Crítica' ? '🚨 Crítica' : 'Urgente'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {sos.patient_name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-normal">
                        {sos.hospital} • {sos.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const newStatus = sos.status === 'Ativa' ? 'Concluída' : 'Ativa';
                          await updateSupportCampaign(supabase, sos.id, { status: newStatus });
                          loadDashboardData();
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg border font-normal transition-colors ${
                          sos.status === 'Ativa'
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        {sos.status === 'Ativa' ? 'Concluir' : 'Concluída'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Remover pedido?')) return;
                          await deleteSupportCampaign(supabase, sos.id);
                          loadDashboardData();
                        }}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSosMatch(sos)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-normal flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Search size={13} />
                    Ver Membros Aptos e Convidar (WhatsApp)
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. AGENDA DE MUTIRÕES (COM EDIÇÃO/REAGENDAMENTO E LIMITE DE 20 VAGAS) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <HeartHandshake size={16} className="text-red-600" />
              Agenda de Mutirões (Editar / Reagendar)
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Cadastre, edite datas ou horários e veja a lista de presenças confirmadas.
            </p>
          </div>

          <form onSubmit={handleAddCampaign} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-normal">
                Nome do Mutirão
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={campTitle}
                onChange={(e) => setCampTitle(e.target.value)}
                placeholder="Ex: Mutirão O Bom Amigo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-normal"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">Data</label>
                <input
                  type="date"
                  required
                  value={campDate}
                  onChange={(e) => setCampDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">Horário</label>
                <input
                  type="text"
                  value={campTime}
                  onChange={(e) => setCampTime(e.target.value)}
                  placeholder="08:00"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-normal">Local</label>
              <input
                type="text"
                required
                value={campLocation}
                onChange={(e) => setCampLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={savingCampaign}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-normal text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              {savingCampaign ? 'Publicando...' : 'Adicionar Data de Mutirão'}
            </button>
          </form>

          {/* Lista de Mutirões com Botão de Editar/Reagendar */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {campaigns.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 font-normal">
                Nenhum mutirão agendado.
              </p>
            ) : (
              campaigns.map((camp) => {
                const dObj = parseSafeDate(camp.campaign_date);
                const maxLimit = camp.max_participants || 20;
                const confirmedCount = camp.confirmed_count || 0;
                const isFull = confirmedCount >= maxLimit;

                return (
                  <div
                    key={camp.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {dObj ? dObj.toLocaleDateString('pt-BR') : camp.campaign_date}
                          </span>
                          {camp.campaign_time && (
                            <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                              <Clock size={11} /> {camp.campaign_time}
                            </span>
                          )}
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-normal ${
                              isFull
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {confirmedCount}/{maxLimit} confirmados
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-900 text-xs sm:text-sm">
                          {camp.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-normal">
                          <MapPin size={11} className="text-slate-400" /> {camp.location}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingCampaign(camp)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Editar ou Reagendar"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleRemoveCampaign(camp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {camp.confirmed_users && camp.confirmed_users.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                        {camp.confirmed_users.map((u, idx) => (
                          <span
                            key={u.id || idx}
                            className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-normal"
                          >
                            {idx + 1}. {u.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. DISPARAR AVISO / NOTIFICAÇÃO DO APP */}
        <form
          onSubmit={handleSendNotice}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3"
        >
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Bell size={16} className="text-red-600" />
              Disparar Notificação no App
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Envie um comunicado oficial sobre atualizações ou avisos para todos os membros.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-normal">Título do Aviso</label>
            <input
              type="text"
              required
              maxLength={120}
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="Ex: Novo mutirão agendado para o próximo sábado!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 font-normal"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-normal">Mensagem</label>
            <textarea
              required
              rows={2}
              maxLength={500}
              value={noticeMsg}
              onChange={(e) => setNoticeMsg(e.target.value)}
              placeholder="Escreva a mensagem que aparecerá no sino de notificações..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
            />
          </div>

          <button
            type="submit"
            disabled={savingNotice}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-normal text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Bell size={14} />
            {savingNotice ? 'Enviando...' : 'Enviar Notificação'}
          </button>
        </form>

        {/* 4. CANAL NO WHATSAPP E HEMOCENTRO */}
        <form
          onSubmit={handleSaveConfig}
          className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3.5"
        >
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            <MessageCircle size={16} className="text-emerald-600" />
            Canal no WhatsApp & Hemocentro
          </h2>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-normal">
              Link do Canal no WhatsApp
            </label>
            <input
              type="url"
              required
              value={config.whatsappGroupUrl}
              onChange={(e) => setConfig({ ...config, whatsappGroupUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-normal">
              Link de Agendamento no Site (Quando atingir 20 vagas)
            </label>
            <input
              type="url"
              required
              value={config.hemocenterScheduleUrl}
              onChange={(e) => setConfig({ ...config, hemocenterScheduleUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 font-normal"
            />
          </div>

          <button
            type="submit"
            disabled={savingConfig}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-normal text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {savingConfig ? 'Salvando...' : 'Salvar Links'}
          </button>
        </form>
      </div>

      {/* MODAL: EDITAR / REAGENDAR MUTIRÃO */}
      {editingCampaign && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setEditingCampaign(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Editar / Reagendar Mutirão</h3>
              <button
                onClick={() => setEditingCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditCampaign} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">Título</label>
                <input
                  type="text"
                  required
                  value={editingCampaign.title}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-normal">Data</label>
                  <input
                    type="date"
                    required
                    value={editingCampaign.campaign_date}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, campaign_date: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-normal">Horário</label>
                  <input
                    type="text"
                    value={editingCampaign.campaign_time || '08:00'}
                    onChange={(e) =>
                      setEditingCampaign({ ...editingCampaign, campaign_time: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-normal">Local</label>
                <input
                  type="text"
                  required
                  value={editingCampaign.location}
                  onChange={(e) =>
                    setEditingCampaign({ ...editingCampaign, location: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCampaign(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-normal"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCampaign}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-normal"
                >
                  {savingCampaign ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRUZAMENTO DE MEMBROS APTOS PARA O PEDIDO SOS */}
      {activeSosMatch && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setActiveSosMatch(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <span className="text-[10px] font-semibold text-red-600 uppercase tracking-wider block">
                  Rede de Apoio SOS
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  {activeSosMatch.patient_name} ({activeSosMatch.blood_type_needed})
                </h3>
              </div>
              <button
                onClick={() => setActiveSosMatch(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-1">
              {loadingMatch ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Cruzando tipos sanguíneos e prazos biológicos...
                </div>
              ) : matchedMembers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Nenhum membro com sangue compatível cadastrado ainda.
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 font-normal">
                    Encontrados <strong>{matchedMembers.length} membros</strong> com tipo sanguíneo
                    compatível:
                  </p>

                  {matchedMembers.map((m) => {
                    const message = encodeURIComponent(
                      `Olá ${m.name}, o Movimento O Bom Amigo identificou que seu tipo sanguíneo (${m.blood_type}) é compatível com o pedido urgente de doação para *${activeSosMatch.patient_name}* internado no *${activeSosMatch.hospital}*.\nSe puder ajudar, sua doação fará toda a diferença!`
                    );

                    return (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          m.canDonateNow
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900">{m.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-red-100 text-red-700">
                              {m.blood_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {m.canDonateNow ? (
                              <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Apto para doar agora!
                              </span>
                            ) : (
                              <span className="text-amber-700">
                                Em intervalo biológico ({m.elig.daysRemaining} dias)
                              </span>
                            )}
                          </p>
                        </div>

                        <a
                          href={`https://wa.me/?text=${message}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-normal transition-colors shrink-0 flex items-center gap-1"
                        >
                          <MessageCircle size={13} /> Convidar
                        </a>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONCESSÃO INDIVIDUAL DE MEDALHAS ESPECIAIS COM NOTIFICAÇÃO IMEDIATA */}
      {selectedMemberForBadges && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMemberForBadges(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200 shrink-0">
                  {selectedMemberForBadges.avatar_url ? (
                    <img
                      src={selectedMemberForBadges.avatar_url}
                      alt={selectedMemberForBadges.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedMemberForBadges.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                    {selectedMemberForBadges.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-normal">
                    {selectedMemberForBadges.blood_type || '-'} • Concessão Individual de Medalhas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMemberForBadges(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 leading-relaxed font-normal">
                ℹ️ Após o encerramento da campanha e confirmação presencial de doação, habilite as medalhas abaixo. Cada liberação enviará uma notificação comemorativa automática no app do doador!
              </p>

              {/* 1. Membro Fundador */}
              <div className="p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Star size={18} className="fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Membro Fundador (2026)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Pioneiro inaugural do movimento</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    const { newState, error } = await toggleUserSpecialBadge(
                      supabase,
                      selectedMemberForBadges.id,
                      'isFounder',
                      session?.user?.id
                    );
                    if (error) alert('Erro: ' + error);
                    else {
                      setSpecialBadgesStore((prev) => ({
                        ...prev,
                        [selectedMemberForBadges.id]: {
                          ...prev[selectedMemberForBadges.id],
                          isFounder: newState,
                        },
                      }));
                      if (newState) alert('Medalha de Membro Fundador liberada e notificação enviada!');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    specialBadgesStore[selectedMemberForBadges.id]?.isFounder
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {specialBadgesStore[selectedMemberForBadges.id]?.isFounder ? '⭐ Liberada' : '+ Liberar'}
                </button>
              </div>

              {/* 2. Herói da Rede SOS */}
              <div className="p-3 rounded-2xl border border-red-200/80 bg-rose-50/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Heart size={18} className="fill-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Herói da Rede SOS</p>
                    <p className="text-[10px] text-slate-500 font-normal">Doação direta para quem precisava</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    const { newState, error } = await toggleUserSpecialBadge(
                      supabase,
                      selectedMemberForBadges.id,
                      'isSosHero',
                      session?.user?.id
                    );
                    if (error) alert('Erro: ' + error);
                    else {
                      setSpecialBadgesStore((prev) => ({
                        ...prev,
                        [selectedMemberForBadges.id]: {
                          ...prev[selectedMemberForBadges.id],
                          isSosHero: newState,
                        },
                      }));
                      if (newState) alert('Medalha de Herói da Rede SOS liberada e notificação enviada!');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                    specialBadgesStore[selectedMemberForBadges.id]?.isSosHero
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {specialBadgesStore[selectedMemberForBadges.id]?.isSosHero ? '🩸 Liberada' : '+ Liberar'}
                </button>
              </div>

              {/* 3. Medalhas de Mutirão (1º Mutirão, 2º Mutirão, etc.) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">
                    Medalhas por Mutirão ({campaigns.length}):
                  </p>
                  <span className="text-[10px] text-slate-500 font-normal">Liberar pós-campanha</span>
                </div>

                {campaigns.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhum mutirão cadastrado.</p>
                ) : (
                  <div className="space-y-2">
                    {campaigns.map((camp, idx) => {
                      const hasBadge = specialBadgesStore[selectedMemberForBadges.id]?.mutiraoIds?.includes(camp.id);
                      const mutiraoTitle = `${idx + 1}º Mutirão O Bom Amigo`;
                      return (
                        <div
                          key={camp.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900">{mutiraoTitle}</p>
                            <p className="text-[10px] text-slate-500 font-normal">
                              {new Date(camp.campaign_date).toLocaleDateString('pt-BR')} • {camp.location}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              const {
                                data: { session },
                              } = await supabase.auth.getSession();
                              const { hasBadge: newHasBadge, error } = await toggleUserMutiraoBadge(
                                supabase,
                                selectedMemberForBadges.id,
                                camp.id,
                                mutiraoTitle,
                                session?.user?.id
                              );
                              if (error) alert('Erro: ' + error);
                              else {
                                setSpecialBadgesStore((prev) => {
                                  const currentList = prev[selectedMemberForBadges.id]?.mutiraoIds || [];
                                  const updated = newHasBadge
                                    ? [...currentList, camp.id]
                                    : currentList.filter((id) => id !== camp.id);
                                  return {
                                    ...prev,
                                    [selectedMemberForBadges.id]: {
                                      ...prev[selectedMemberForBadges.id],
                                      mutiraoIds: updated,
                                    },
                                  };
                                });
                                if (newHasBadge) {
                                  alert(`Medalha "${mutiraoTitle}" liberada com sucesso e notificação enviada para o doador!`);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                              hasBadge
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {hasBadge ? '🏅 Liberada' : '+ Liberar Medalha'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMemberForBadges(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
