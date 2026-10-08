"use client";

import { useState, useEffect } from 'react';
import { Users, Search, Award, X, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
import { createClient } from '@/lib/supabase';
import { calculateBadge, getBadgeColors, BadgeType } from '@/utils/donationRules';

export default function Membros() {
  const [membros, setMembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMembro, setEditingMembro] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [selectedMembros, setSelectedMembros] = useState<string[]>([]);
  const supabase = createClient();

  async function fetchMembros() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, cards(valid_until, status)')
      .order('name', { ascending: true });
      
    if (data) setMembros(data);
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
        donationsThisYear: editingMembro.donationsThisYear
      })
      .eq('id', editingMembro.id);
    
    await fetchMembros();
    setEditingMembro(null);
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Membros e Doadores</h1>
          <p className="text-slate-500 mt-1">Gerencie status, aprove carteirinhas e acompanhe o rankeamento dos doadores.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-50 shadow-sm overflow-hidden relative">
        <div className="p-4 border-b border-red-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-red-50/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, sangue ou status..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
            />
          </div>
          {selectedMembros.length > 0 && (
            <button
              onClick={async () => {
                const validUntil = new Date();
                validUntil.setFullYear(validUntil.getFullYear() + 1);
                const updates = selectedMembros.map(id => ({ profile_id: id, status: 'Ativa', valid_until: validUntil.toISOString().split('T')[0] }));
                const { error } = await supabase.from('cards').upsert(updates, { onConflict: 'profile_id' });
                if (error) alert('Erro: ' + error.message);
                else { alert(`${selectedMembros.length} carteirinhas renovadas por 1 ano!`); setSelectedMembros([]); fetchMembros(); }
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap shadow-sm shadow-slate-300"
            >
              Renovar Selecionados ({selectedMembros.length})
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Carregando membros...
          </div>
        ) : membros.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Users size={36} className="text-red-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">Nenhum membro listado</h3>
            <p className="text-sm">Os doadores cadastrados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 w-12">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                      checked={membros.length > 0 && selectedMembros.length === membros.length}
                      onChange={(e) => setSelectedMembros(e.target.checked ? membros.map(m => m.id) : [])}
                    />
                  </th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Membro</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Sangue</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Role</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Selo</th>
                  <th className="p-4 text-sm font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {membros.map((membro) => {
                  const badge: BadgeType = calculateBadge(membro.sex || 'Outro', membro.donations_this_year || 0);
                  const theme = getBadgeColors(badge);
                  
                  return (
                    <tr key={membro.id} className="border-b border-slate-50 hover:bg-red-50/20 transition-colors">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" 
                          checked={selectedMembros.includes(membro.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedMembros([...selectedMembros, membro.id]);
                            else setSelectedMembros(selectedMembros.filter(id => id !== membro.id));
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{membro.name}</div>
                        <div className="text-xs text-slate-500">{membro.is_active ? 'Ativo' : 'Inativo'}</div>
                      </td>
                      <td className="p-4 font-bold text-red-600">{membro.blood_type || '-'}</td>
                      <td className="p-4 text-sm text-slate-600">{membro.role}</td>
                      <td className="p-4">
                        {badge !== 'Nenhum' ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${theme.bg} ${theme.text}`}>
                            <Award size={12} /> {badge}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Sem selo</span>
                        )}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => setEditingMembro(membro)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de Edição */}
        {editingMembro && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200">
              <button 
                onClick={() => setEditingMembro(null)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-xl font-bold text-slate-900 mb-1">Gerenciar Membro</h2>
              <p className="text-sm text-slate-500 mb-6">Atualize os dados de {editingMembro.name}</p>

              <div className="space-y-4">
                
                {/* Status da Conta */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Status da Conta</label>
                  <select 
                    value={editingMembro.is_active ? 'true' : 'false'}
                    onChange={(e) => setEditingMembro({...editingMembro, is_active: e.target.value === 'true'})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="true">Ativo (Permitir acesso)</option>
                    <option value="false">Inativo (Bloquear acesso)</option>
                  </select>
                </div>

                {/* Nova Doação */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="block text-sm font-semibold text-slate-900 mb-2 flex justify-between">
                    <span>Nova Doação</span>
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-bold">
                      {editingMembro.donations_this_year || 0} no ano
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      id="novaDoacaoDate"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 bg-white"
                    />
                    <button 
                      type="button"
                      onClick={async () => {
                        const dateInput = document.getElementById('novaDoacaoDate') as HTMLInputElement;
                        if (!dateInput || !dateInput.value) {
                          alert('Por favor, selecione uma data.');
                          return;
                        }
                        
                        setSaving(true);
                        const { error } = await supabase.from('donations').insert({
                          profile_id: editingMembro.id,
                          donation_date: dateInput.value
                        });
                        
                        if (error) {
                          alert('Erro ao registrar: ' + error.message);
                        } else {
                          dateInput.value = '';
                          await fetchMembros();
                          const { data: updatedMembro } = await supabase.from('profiles').select('*').eq('id', editingMembro.id).single();
                          setEditingMembro(updatedMembro);
                        }
                        setSaving(false);
                      }}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-200/50 whitespace-nowrap"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                {/* Preview Carteirinha 1.0 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <label className="block text-sm font-semibold text-slate-900 mb-4 self-start">Gerenciar Carteirinha</label>
                  
                  <div id="carteirinha-print" className="hidden print:!flex w-full flex-col sm:flex-row gap-4 mb-6">
                    {/* Frente */}
                    <div className="carteirinha-lado w-full bg-gradient-to-br from-[#E63946] to-[#b91c28] rounded-[2rem] p-6 shadow-[0_20px_50px_-12px_rgba(230,57,70,0.5)] relative overflow-hidden flex flex-col justify-between text-white border border-white/20 aspect-[1.586/1] max-w-sm print:!w-[3.375in] print:!h-[2.125in] print:!p-4 print:!m-0 print:!shadow-none print:!rounded-[1.5rem] print:![color-adjust:exact]">
                      
                      {/* Efeito de Reflexo (Oculto na impressão) */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform -skew-x-12 translate-x-[-100%] animate-[shimmer_4s_infinite] print:hidden"></div>
                      
                      {/* Topo do Cartão */}
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black tracking-[0.2em] text-white uppercase drop-shadow-sm">O Bom Amigo</span>
                          <span className="text-[8px] text-slate-200/80 uppercase tracking-widest font-medium">Carteirinha do Doador</span>
                        </div>
                        
                        <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-red-200/50 flex items-center justify-center p-1.5 overflow-hidden print:shadow-none print:border-slate-200">
                          <img src="/logo.png" alt="O Bom Amigo" className="w-full h-full object-contain drop-shadow-sm print:drop-shadow-none" />
                        </div>
                      </div>
                      
                      {/* Meio do Cartão (Foto 3x4 e Dados) */}
                      <div className="flex justify-between items-end relative z-10">
                        <div className="flex gap-4 items-end">
                          {/* Foto 3x4 */}
                          {editingMembro.avatar_url ? (
                            <div className="w-16 h-20 bg-white rounded-md overflow-hidden border-2 border-white/50 shadow-lg print:shadow-none">
                              <img src={editingMembro.avatar_url} alt="Foto" className="object-cover w-full h-full" />
                            </div>
                          ) : (
                            <div className="w-16 h-20 bg-white/10 rounded-md flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shadow-inner print:bg-white/30">
                              <span className="font-medium text-white/80 text-xl print:text-white">{editingMembro.name.charAt(0)}</span>
                            </div>
                          )}

                          <div className="flex flex-col pb-1">
                            <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Nome</span>
                            <span className="text-xl font-medium leading-none tracking-tight">{editingMembro.name}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end pb-1">
                          <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Sangue</span>
                          <span className="text-3xl font-light tracking-tighter text-white drop-shadow-sm print:drop-shadow-none">{editingMembro.blood_type || '-'}</span>
                        </div>
                      </div>
                      
                      {/* Rodapé */}
                      <div className="relative z-10 pt-3 flex justify-end items-end border-t border-white/20 mt-2">
                        <div className="flex flex-col items-end">
                          <span className="text-[7px] text-slate-200/80 uppercase tracking-widest mb-0.5">Válidade</span>
                          <span className="text-[10px] font-mono tracking-widest text-slate-100">
                            {editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.valid_until : editingMembro.cards.valid_until)
                              ? new Date(Array.isArray(editingMembro.cards) ? editingMembro.cards[0].valid_until : editingMembro.cards.valid_until).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
                              : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Verso */}
                    <div className="carteirinha-lado w-full bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col justify-between text-slate-800 border border-slate-200 aspect-[1.586/1] max-w-sm print:!w-[3.375in] print:!h-[2.125in] print:!p-4 print:!m-0 print:!shadow-none print:!rounded-[1.5rem] print:![color-adjust:exact]">
                      <div className="flex flex-col items-center text-center space-y-2 relative z-10 h-full justify-center">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center p-1.5 mb-1">
                          <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[8px] leading-tight text-slate-500 font-medium px-4">
                          Esta carteirinha é somente para identificação de participante. Não serve de comprovação nem como documento oficial para nada.
                        </p>
                        
                        <div className="flex items-center gap-3 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 w-full justify-center">
                          <QRCode value="https://movimentooba.vercel.app/" size={48} fgColor="#334155" bgColor="transparent" />
                          <div className="text-left">
                            <p className="text-[7px] uppercase tracking-widest text-slate-400 font-bold">Acesse sua conta</p>
                            <p className="text-[9px] font-bold text-slate-700">movimentooba.vercel.app</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 mt-2 print:hidden">
                    
                    {/* Switch de Status */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <span className="font-semibold text-slate-700 text-sm">Status da Carteirinha</span>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" 
                            checked={(editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.status : editingMembro.cards.status)) === 'Ativa'}
                            onChange={async (e) => {
                              const newStatus = e.target.checked ? 'Ativa' : 'Revogada';
                              const { error } = await supabase.from('cards').upsert({ profile_id: editingMembro.id, status: newStatus }, { onConflict: 'profile_id' });
                              if (!error) { 
                                fetchMembros(); 
                                setEditingMembro({...editingMembro, cards: Array.isArray(editingMembro.cards) ? [{...editingMembro.cards[0], status: newStatus}] : {...editingMembro.cards, status: newStatus}}); 
                              }
                            }}
                          />
                          <div className={`block w-12 h-7 rounded-full transition-colors ${(editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.status : editingMembro.cards.status) === 'Ativa') ? 'bg-red-600' : 'bg-slate-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${(editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.status : editingMembro.cards.status) === 'Ativa') ? 'transform translate-x-5' : ''}`}></div>
                        </div>
                        <span className="ml-3 text-sm font-bold text-slate-600 min-w-[5rem]">
                          {(editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.status : editingMembro.cards.status) === 'Ativa') ? 'Ativa' : 'Revogada'}
                        </span>
                      </label>
                    </div>

                    {/* Controle de Renovação */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select id={`renovar-${editingMembro.id}`} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-semibold focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none flex-1 shadow-sm">
                        <option value="1">Renovar por 1 Ano</option>
                        <option value="2">Renovar por 2 Anos</option>
                        <option value="5">Renovar por 5 Anos</option>
                      </select>
                      <button 
                        onClick={async () => {
                          const anos = parseInt((document.getElementById(`renovar-${editingMembro.id}`) as HTMLSelectElement).value);
                          const validUntil = new Date();
                          validUntil.setFullYear(validUntil.getFullYear() + anos);
                          const { error } = await supabase.from('cards').upsert({ profile_id: editingMembro.id, status: 'Ativa', valid_until: validUntil.toISOString().split('T')[0] }, { onConflict: 'profile_id' });
                          if (!error) { 
                            alert(`Carteirinha renovada por ${anos} ano(s)!`); 
                            fetchMembros();
                            const newDate = validUntil.toISOString().split('T')[0];
                            setEditingMembro({...editingMembro, cards: Array.isArray(editingMembro.cards) ? [{...editingMembro.cards[0], valid_until: newDate}] : {...editingMembro.cards, valid_until: newDate}}); 
                          }
                        }}
                        className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors shadow-sm whitespace-nowrap"
                      >
                        Aplicar Renovação
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors print:hidden"
                  >
                    Imprimir Carteirinha
                  </button>

                  {/* Informações da Carteirinha */}
                  <div className="grid grid-cols-3 items-center mt-2 w-full px-2">
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cadastro</span>
                      <span className="text-sm font-medium text-slate-800">
                        {editingMembro.created_at ? new Date(editingMembro.created_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '--/--/----'}
                      </span>
                    </div>
                    <div className="flex flex-col text-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ID Interno</span>
                      <span className="text-sm font-medium text-slate-800 font-mono">
                        {editingMembro.id.split('-')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Validade</span>
                      <span className="text-sm font-medium text-slate-800">
                        {editingMembro.cards && (Array.isArray(editingMembro.cards) ? editingMembro.cards[0]?.valid_until : editingMembro.cards.valid_until)
                          ? new Date(Array.isArray(editingMembro.cards) ? editingMembro.cards[0].valid_until : editingMembro.cards.valid_until).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) 
                          : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveMembro}
                  disabled={saving}
                  className="w-full mt-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors disabled:opacity-70"
                >
                  {saving ? 'Processando...' : 'Fechar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
