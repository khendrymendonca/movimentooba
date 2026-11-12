"use client";

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  X,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Filter,
  MessageSquareWarning,
  Check,
  ArrowLeft,
  Award,
  Sparkles,
  Heart,
  Star,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import QRCode from "react-qr-code";
import { createClient } from '@/lib/supabase';
import {
  checkEligibilityForDate,
  calculateNextDonationDate,
  parseSafeDate,
  validateNewDonation,
  getMaxDonationsPerYear,
  GroupCampaign,
} from '@/utils/donationRules';
import {
  fetchProjectConfig,
  DEFAULT_PROJECT_CONFIG,
  ProjectConfig,
  fetchGroupCampaigns,
  fetchSpecialBadgesStore,
  toggleUserSpecialBadge,
  toggleUserMutiraoBadge,
  grantBatchFounderBadges,
  grantBatchMutiraoBadges,
  UserSpecialBadges,
} from '@/lib/campaigns';
import { DonorCard } from '@/components/DonorCard';

type FilterType = 'todos' | 'aptos' | 'intervalo' | 'pendentes' | 'chamados';

function parseTicket(themePref?: string | null) {
  if (!themePref || !themePref.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(themePref);
    if (parsed && parsed.message && parsed.status === 'Pendente') {
      return parsed as { type: string; message: string; createdAt: string; status: string };
    }
  } catch {
    return null;
  }
  return null;
}

export default function Membros() {
  const [membros, setMembros] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [loading, setLoading] = useState(true);
  const [editingMembro, setEditingMembro] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMembros, setSelectedMembros] = useState<string[]>([]);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>(DEFAULT_PROJECT_CONFIG);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [specialBadgesStore, setSpecialBadgesStore] = useState<Record<string, UserSpecialBadges>>({});
  const supabase = createClient();

  async function fetchMembros() {
    const [membrosRes, cfg, loadedCampaigns, badgesStoreRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, cards(status)')
        .order('name', { ascending: true }),
      fetchProjectConfig(supabase),
      fetchGroupCampaigns(supabase),
      fetchSpecialBadgesStore(supabase),
    ]);

    if (membrosRes.data) setMembros(membrosRes.data);
    if (cfg) setProjectConfig(cfg);
    if (loadedCampaigns) setCampaigns(loadedCampaigns);
    if (badgesStoreRes) setSpecialBadgesStore(badgesStoreRes.store);
    setLoading(false);
  }

  useEffect(() => {
    fetchMembros();
  }, []);

  const handleSaveMembro = async () => {
    if (!editingMembro) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        is_active: editingMembro.is_active,
        donations_this_year: editingMembro.donations_this_year || 0,
      })
      .eq('id', editingMembro.id);

    await fetchMembros();
    setEditingMembro(null);
    setSaving(false);
  };

  const handleResolveTicket = async (membroId: string) => {
    await supabase
      .from('profiles')
      .update({ theme_preference: 'light' })
      .eq('id', membroId);
    await fetchMembros();
    if (editingMembro && editingMembro.id === membroId) {
      setEditingMembro({ ...editingMembro, theme_preference: 'light' });
    }
  };

  const filteredMembros = membros.filter((m) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.blood_type && m.blood_type.toLowerCase().includes(term)) ||
      (m.role && m.role.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    const elig = checkEligibilityForDate(m.sex || 'M', m.last_donation_date, new Date());
    const cardStatus = Array.isArray(m.cards) ? m.cards[0]?.status : m.cards?.status;
    const ticket = parseTicket(m.theme_preference);

    if (activeFilter === 'aptos') return elig.isEligible;
    if (activeFilter === 'intervalo') return !elig.isEligible;
    if (activeFilter === 'pendentes') return cardStatus !== 'Ativa';
    if (activeFilter === 'chamados') return Boolean(ticket);

    return true;
  });

  const editingCardObj = editingMembro
    ? Array.isArray(editingMembro.cards)
      ? editingMembro.cards[0]
      : editingMembro.cards
    : null;
  const editingCardStatus = editingCardObj?.status === 'Revogada' ? 'Revogada' : 'Ativa';
  const editingTicket = editingMembro ? parseTicket(editingMembro.theme_preference) : null;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Slim Mobile (Idêntico ao restante do App) */}
      <div className="px-6 pt-8 pb-4 bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-1 font-normal"
          >
            <ArrowLeft size={13} /> Voltar para Gestão
          </Link>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Membros
            <span className="text-xs font-normal text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {filteredMembros.length}
            </span>
          </h1>
        </div>

        {selectedMembros.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const updates = selectedMembros.map((id) => ({
                  profile_id: id,
                  status: 'Ativa',
                }));
                await supabase.from('cards').upsert(updates, { onConflict: 'profile_id' });
                await supabase
                  .from('profiles')
                  .update({ is_active: true })
                  .in('id', selectedMembros);
                alert(`${selectedMembros.length} membros ativados com sucesso!`);
                setSelectedMembros([]);
                fetchMembros();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-normal transition-colors shrink-0"
            >
              Ativar ({selectedMembros.length})
            </button>
            <button
              onClick={async () => {
                const { error } = await grantBatchFounderBadges(supabase, selectedMembros, true);
                if (error) alert('Erro ao conceder medalha de Fundador: ' + error);
                else {
                  alert(`Medalha de Membro Fundador concedida para ${selectedMembros.length} membros!`);
                  setSelectedMembros([]);
                  fetchMembros();
                }
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-normal transition-colors shrink-0 inline-flex items-center gap-1"
            >
              <Award size={13} /> Fundador ({selectedMembros.length})
            </button>
            <button
              onClick={async () => {
                const updates = selectedMembros.map((id) => ({
                  profile_id: id,
                  status: 'Revogada',
                }));
                await supabase.from('cards').upsert(updates, { onConflict: 'profile_id' });
                await supabase
                  .from('profiles')
                  .update({ is_active: false })
                  .in('id', selectedMembros);
                alert(`${selectedMembros.length} membros desativados.`);
                setSelectedMembros([]);
                fetchMembros();
              }}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-xs font-normal transition-colors shrink-0"
            >
              Desativar ({selectedMembros.length})
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-5 space-y-4">

      {/* Barra de Busca e Menu Suspenso de Filtro */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou tipo sanguíneo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-slate-50/50 text-slate-800 text-sm font-normal"
            />
          </div>

          {/* Menu Suspenso de Filtro (Melhores Práticas UX/UI Mobile) */}
          <div className="relative shrink-0 sm:w-64">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as FilterType)}
              className="w-full appearance-none pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 bg-white text-slate-700 text-xs sm:text-sm font-normal cursor-pointer transition-colors hover:border-slate-300"
            >
              <option value="todos">Todos os membros</option>
              <option value="aptos">Aptos para doar (60d/120d)</option>
              <option value="intervalo">Em intervalo biológico</option>
              <option value="pendentes">Carteirinha pendente/revogada</option>
              <option value="chamados">Com Solicitação / Bug</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo: Lista Organizada */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm font-normal">Carregando membros...</div>
      ) : filteredMembros.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200/80">
          <Users size={32} className="text-slate-300 mb-2" />
          <p className="text-sm font-normal text-slate-600">Nenhum membro encontrado com este filtro.</p>
        </div>
      ) : (
        <>
          {/* VISÃO MOBILE: Cards Limpos e Espaçados */}
          <div className="block md:hidden space-y-3">
            {filteredMembros.map((membro) => {
              const elig = checkEligibilityForDate(
                membro.sex || 'M',
                membro.last_donation_date,
                new Date()
              );
              const ticket = parseTicket(membro.theme_preference);

              return (
                <div
                  key={membro.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-none hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 overflow-hidden flex items-center justify-center font-medium text-sm shrink-0 border border-slate-200">
                        {membro.avatar_url ? (
                          <img src={membro.avatar_url} alt={membro.name} className="w-full h-full object-cover" />
                        ) : membro.name ? (
                          membro.name.charAt(0).toUpperCase()
                        ) : (
                          '?'
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-900 leading-tight flex items-center gap-1.5">
                          {membro.name}
                          {ticket && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-normal">
                              <MessageSquareWarning size={10} /> {ticket.type}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5 font-normal">
                          {membro.sex === 'F' ? 'Feminino (120d)' : 'Masculino (60d)'} •{' '}
                          {membro.is_active ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold shrink-0">
                      {membro.blood_type || '-'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      {elig.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-normal">
                          <CheckCircle2 size={12} /> Apto para doar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-normal">
                          <Clock size={12} /> Apto em{' '}
                          {elig.nextEligibleDate?.toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingMembro(membro)}
                        className="text-slate-700 hover:text-slate-900 font-medium inline-flex items-center gap-0.5 text-xs py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Gerenciar <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISÃO DESKTOP: Tabela Limpa e Elegante */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-xs text-slate-600 font-medium">
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-slate-300 text-red-600 cursor-pointer"
                      checked={
                        filteredMembros.length > 0 &&
                        selectedMembros.length === filteredMembros.length
                      }
                      onChange={(e) =>
                        setSelectedMembros(
                          e.target.checked ? filteredMembros.map((m) => m.id) : []
                        )
                      }
                    />
                  </th>
                  <th className="p-3.5 font-medium">Membro</th>
                  <th className="p-3.5 font-medium">Sangue</th>
                  <th className="p-3.5 font-medium">Situação</th>
                  <th className="p-3.5 font-medium">Carteirinha</th>
                  <th className="p-3.5 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembros.map((membro) => {
                  const elig = checkEligibilityForDate(
                    membro.sex || 'M',
                    membro.last_donation_date,
                    new Date()
                  );
                  const cardStatus = Array.isArray(membro.cards)
                    ? membro.cards[0]?.status
                    : membro.cards?.status;
                  const ticket = parseTicket(membro.theme_preference);

                  return (
                    <tr key={membro.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-slate-300 text-red-600 cursor-pointer"
                          checked={selectedMembros.includes(membro.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedMembros([...selectedMembros, membro.id]);
                            else
                              setSelectedMembros(
                                selectedMembros.filter((id) => id !== membro.id)
                              );
                          }}
                        />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 overflow-hidden flex items-center justify-center font-medium text-xs shrink-0 border border-slate-200">
                            {membro.avatar_url ? (
                              <img src={membro.avatar_url} alt={membro.name} className="w-full h-full object-cover" />
                            ) : membro.name ? (
                              membro.name.charAt(0).toUpperCase()
                            ) : (
                              '?'
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5">
                              {membro.name}
                              {ticket && (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-normal">
                                  <MessageSquareWarning size={10} /> {ticket.type}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 font-normal">
                              {membro.sex === 'F' ? 'Feminino (120d)' : 'Masculino (60d)'} •{' '}
                              {membro.is_active ? 'Ativo' : 'Inativo'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs">
                          {membro.blood_type || '-'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {elig.isEligible ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-normal">
                            <CheckCircle2 size={12} /> Apto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-normal">
                            <Clock size={12} /> {elig.nextEligibleDate?.toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                            cardStatus === 'Ativa'
                              ? 'text-slate-600 bg-slate-100'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {cardStatus || 'Pendente'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setEditingMembro(membro)}
                          className="text-xs font-normal text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL DE GERENCIAMENTO E CARTEIRINHA */}
      {editingMembro && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-lg shadow-xl border border-slate-200 relative my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {editingMembro.name}
                </h2>
                <p className="text-xs text-slate-600 font-normal">
                  {editingMembro.blood_type || 'Sangue não inf.'} •{' '}
                  {editingMembro.sex === 'F' ? 'Feminino (120d)' : 'Masculino (60d)'}
                </p>
              </div>
              <button
                onClick={() => setEditingMembro(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Prévia Interativa da Carteirinha do Membro (Com Arte do Canva e 3x4) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <p className="text-[11px] text-slate-500 mb-2 font-normal text-center">
                  Prévia da Carteirinha do Membro (Toque para virar frente/verso)
                </p>
                <DonorCard
                  id={editingMembro.id}
                  name={editingMembro.name || 'Doador'}
                  bloodType={editingMembro.blood_type || '-'}
                  avatarUrl={editingMembro.avatar_url}
                  status={editingCardStatus}
                  compact
                />
              </div>

              {/* Solicitação / Bug Reportado pelo Membro */}
              {editingTicket && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-amber-900 flex items-center gap-1.5 text-xs">
                      <MessageSquareWarning size={14} /> Chamado Aberto: {editingTicket.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResolveTicket(editingMembro.id)}
                      className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Check size={12} /> Marcar Resolvido
                    </button>
                  </div>
                  <p className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                    {editingTicket.message}
                  </p>
                </div>
              )}

              {/* Registrar Nova Doação */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800">Registrar Doação</span>
                  <span className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-normal">
                    {editingMembro.donations_this_year || 0} nos últimos 12 meses
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    id="modalDoacaoDate"
                    max={new Date().toISOString().split('T')[0]}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const input = document.getElementById('modalDoacaoDate') as HTMLInputElement;
                      if (!input || !input.value) return;
                      setSaving(true);

                      const { data: memberDonations } = await supabase
                        .from('donations')
                        .select('*')
                        .eq('profile_id', editingMembro.id);

                      const validation = validateNewDonation(
                        editingMembro.sex,
                        memberDonations || [],
                        input.value
                      );

                      if (!validation.allowed) {
                        alert(validation.reason || 'Data de doação não permitida conforme limites biológicos/anuais.');
                        setSaving(false);
                        return;
                      }

                      await supabase.from('donations').insert({
                        profile_id: editingMembro.id,
                        donation_date: input.value,
                      });

                      const nextDate = calculateNextDonationDate(editingMembro.sex || 'M', input.value);
                      const oneYearAgo = new Date(input.value);
                      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                      oneYearAgo.setHours(0, 0, 0, 0);

                      const allDonations = [...(memberDonations || []), { donation_date: input.value }];
                      const rollingCount = allDonations.filter((d) => {
                        const p = parseSafeDate(d.donation_date);
                        return p && p > oneYearAgo;
                      }).length;

                      await supabase
                        .from('profiles')
                        .update({
                          last_donation_date: input.value,
                          next_donation_date: nextDate ? nextDate.toISOString().split('T')[0] : null,
                          donations_this_year: rollingCount,
                        })
                        .eq('id', editingMembro.id);

                      input.value = '';
                      await fetchMembros();
                      const { data: updated } = await supabase
                        .from('profiles')
                        .select('*, cards(status)')
                        .eq('id', editingMembro.id)
                        .single();
                      setEditingMembro(updated);
                      setSaving(false);
                      alert('Doação registrada com sucesso!');
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-normal transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {/* Status da Carteirinha (Ativar / Desativar) */}
              <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 block text-xs sm:text-sm">Carteirinha do Membro</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {editingCardStatus === 'Ativa' ? 'Carteirinha Ativa' : 'Carteirinha Desativada'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const currentStatus = Array.isArray(editingMembro.cards)
                      ? editingMembro.cards[0]?.status
                      : editingMembro.cards?.status;
                    const newStatus = currentStatus === 'Ativa' ? 'Revogada' : 'Ativa';
                    await supabase.from('cards').upsert(
                      { profile_id: editingMembro.id, status: newStatus },
                      { onConflict: 'profile_id' }
                    );
                    await fetchMembros();
                    setEditingMembro({
                      ...editingMembro,
                      cards: Array.isArray(editingMembro.cards)
                        ? [{ ...editingMembro.cards[0], status: newStatus }]
                        : { ...editingMembro.cards, status: newStatus },
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    editingCardStatus === 'Ativa'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {editingCardStatus === 'Ativa' ? 'Ativa (Toque p/ desativar)' : 'Desativada (Toque p/ ativar)'}
                </button>
              </div>

              {/* Status da Conta */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <span className="font-medium text-slate-800">Acesso à Conta</span>
                <select
                  value={editingMembro.is_active ? 'true' : 'false'}
                  onChange={(e) =>
                    setEditingMembro({
                      ...editingMembro,
                      is_active: e.target.value === 'true',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                >
                  <option value="true">Ativo</option>
                  <option value="false">Bloqueado</option>
                </select>
              </div>

              {/* Gerenciamento de Medalhas Especiais do Membro (Fundador, Mutirões, SOS) */}
              <div className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Award size={16} className="text-amber-600" /> Medalhas Especiais do Membro
                  </span>
                  <span className="text-[10px] text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full font-medium">
                    Exclusivo ADM
                  </span>
                </div>

                {/* 1. Medalha de Membro Fundador (2026) */}
                <div className="bg-white p-3 rounded-xl border border-amber-200/70 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Star size={16} className="fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Membro Fundador (2026)</p>
                      <p className="text-[10px] text-slate-500 font-normal">Homenagem aos pioneiros do movimento</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const { newState, error } = await toggleUserSpecialBadge(supabase, editingMembro.id, 'isFounder');
                      if (error) alert('Erro ao atualizar: ' + error);
                      else {
                        setSpecialBadgesStore((prev) => ({
                          ...prev,
                          [editingMembro.id]: {
                            ...prev[editingMembro.id],
                            isFounder: newState,
                          },
                        }));
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors shrink-0 ${
                      specialBadgesStore[editingMembro.id]?.isFounder
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {specialBadgesStore[editingMembro.id]?.isFounder ? '⭐ Concedida' : '+ Conceder'}
                  </button>
                </div>

                {/* 2. Medalha Herói da Rede SOS (Doação de Pessoas que Precisam) */}
                <div className="bg-white p-3 rounded-xl border border-red-200/70 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Heart size={16} className="fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Herói da Rede SOS</p>
                      <p className="text-[10px] text-slate-500 font-normal">Doação direta para quem precisava</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const { newState, error } = await toggleUserSpecialBadge(supabase, editingMembro.id, 'isSosHero');
                      if (error) alert('Erro ao atualizar: ' + error);
                      else {
                        setSpecialBadgesStore((prev) => ({
                          ...prev,
                          [editingMembro.id]: {
                            ...prev[editingMembro.id],
                            isSosHero: newState,
                          },
                        }));
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors shrink-0 ${
                      specialBadgesStore[editingMembro.id]?.isSosHero
                        ? 'bg-rose-100 text-rose-900 border border-rose-300'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {specialBadgesStore[editingMembro.id]?.isSosHero ? '🩸 Concedida' : '+ Conceder'}
                  </button>
                </div>

                {/* 3. Medalhas por Mutirão Cadastrado */}
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-semibold text-slate-700">
                    Medalhas por Mutirão ({campaigns.length} cadastrados):
                  </p>
                  {campaigns.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-normal italic">
                      Nenhum mutirão cadastrado no momento.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {campaigns.map((camp, idx) => {
                        const hasBadge = specialBadgesStore[editingMembro.id]?.mutiraoIds?.includes(camp.id);
                        const mutiraoTitle = `${idx + 1}º Mutirão O Bom Amigo`;
                        return (
                          <div
                            key={camp.id}
                            className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-800">{mutiraoTitle}</p>
                              <p className="text-[10px] text-slate-500 font-normal">
                                {new Date(camp.campaign_date).toLocaleDateString('pt-BR')} • {camp.location}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                const { hasBadge: newHasBadge, error } = await toggleUserMutiraoBadge(
                                  supabase,
                                  editingMembro.id,
                                  camp.id,
                                  mutiraoTitle
                                );
                                if (error) alert('Erro: ' + error);
                                else {
                                  setSpecialBadgesStore((prev) => {
                                    const currentList = prev[editingMembro.id]?.mutiraoIds || [];
                                    const updated = newHasBadge
                                      ? [...currentList, camp.id]
                                      : currentList.filter((id) => id !== camp.id);
                                    return {
                                      ...prev,
                                      [editingMembro.id]: {
                                        ...prev[editingMembro.id],
                                        mutiraoIds: updated,
                                      },
                                    };
                                  });
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors shrink-0 ${
                                hasBadge
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {hasBadge ? '🏅 Medalha Ativa' : '+ Liberar Medalha'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Impressão A4 Completa (Frente com Identidade Oficial + Foto 3x4 e Verso com QR Code) */}
              <div id="carteirinha-print" className="hidden print:!flex flex-col gap-6 items-center">
                {/* FRENTE IMPRESSÃO */}
                <div
                  className="carteirinha-lado print:!w-[3.375in] print:!h-[2.125in] print:!p-4 text-white rounded-xl relative overflow-hidden flex flex-col justify-between"
                  style={{ background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)' }}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <span className="text-xs font-semibold uppercase tracking-wider">O Bom Amigo</span>
                    <span className="text-sm font-bold bg-black/25 px-2.5 py-0.5 rounded-lg">
                      {editingMembro.blood_type || '-'}
                    </span>
                  </div>
                  <div className="flex items-end gap-3 relative z-10 mt-auto">
                    <div className="w-12 h-15 rounded-lg bg-white p-0.5 overflow-hidden shrink-0">
                      {editingMembro.avatar_url ? (
                        <img
                          src={editingMembro.avatar_url}
                          alt={editingMembro.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                          {editingMembro.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{editingMembro.name}</p>
                      <p className="text-[10px] opacity-90 font-mono">
                        ID #{editingMembro.id?.substring(0, 6).toUpperCase()} • Membro Oficial
                      </p>
                    </div>
                  </div>
                </div>

                {/* VERSO IMPRESSÃO COM QR CODE */}
                <div className="carteirinha-lado print:!w-[3.375in] print:!h-[2.125in] print:!p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-4">
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCode
                      value={`https://movimentooba.vercel.app/validar/${editingMembro.id}`}
                      size={76}
                      fgColor="#0f172a"
                    />
                  </div>
                  <div className="text-[10px] space-y-1 text-slate-200">
                    <p className="font-semibold text-white text-xs">Validação Oficial</p>
                    <p>Escaneie o QR Code para verificar a autenticidade do membro.</p>
                    <p className="text-slate-400">ID #{editingMembro.id?.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-normal flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Imprimir (A4)
                </button>
                <button
                  type="button"
                  onClick={handleSaveMembro}
                  disabled={saving}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-normal transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Concluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
