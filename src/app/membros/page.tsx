import { Users, Search, UserPlus } from 'lucide-react';

export default function Membros() {
  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Membros e Doadores</h1>
          <p className="text-slate-500 mt-1">Acompanhe os doadores, altere dados de idosos e ative acessos.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-red-200">
          <UserPlus size={18} />
          Adicionar Membro
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-50 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="p-4 border-b border-red-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-red-50/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, sangue..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
            />
          </div>
        </div>
        
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Users size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum membro listado</h3>
          <p className="text-sm max-w-sm">
            Estrutura da tela concluída. Aguardando dados reais do Supabase para exibir os membros cadastrados.
          </p>
        </div>
      </div>
    </div>
  );
}
