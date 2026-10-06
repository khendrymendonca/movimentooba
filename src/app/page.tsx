import { Users, CreditCard, AlertCircle, FileText } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Acompanhe as métricas principais e atividades recentes do projeto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-600">Doadores Ativos</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">1,248</div>
          <div className="text-xs text-emerald-600 font-medium mt-2">+12% este mês</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-600">Carteirinhas Pendentes</h3>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">34</div>
          <div className="text-xs text-amber-600 font-medium mt-2">Aguardando renovação</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-600">Novos Membros</h3>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">142</div>
          <div className="text-xs text-emerald-600 font-medium mt-2">Nos últimos 30 dias</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-600">Guias Acessados</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">856</div>
          <div className="text-xs text-slate-500 font-medium mt-2">Nesta semana</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
            <div className="bg-slate-100 p-2 rounded-md text-slate-600">
              <Users size={20} />
            </div>
            <div>
              <div className="font-medium text-slate-900">Gerenciar Membros</div>
              <div className="text-sm text-slate-500">Desabilitar ou editar dados cadastrais de idosos</div>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
            <div className="bg-slate-100 p-2 rounded-md text-slate-600">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="font-medium text-slate-900">Gerenciar Carteirinhas</div>
              <div className="text-sm text-slate-500">Alterar, renovar ou revogar acessos</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
