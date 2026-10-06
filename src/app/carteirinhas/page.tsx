import { CreditCard, Search, Filter } from 'lucide-react';

export default function Carteirinhas() {
  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Carteirinhas</h1>
          <p className="text-slate-500 mt-1">Gerencie, aprove e revogue o acesso dos doadores.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-red-200">
          <CreditCard size={18} />
          Nova Carteirinha
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-50 shadow-sm shadow-slate-100/50 overflow-hidden">
        <div className="p-4 border-b border-red-50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-red-50/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white"
            />
          </div>
          <button className="flex items-center gap-2 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl border border-slate-200 hover:border-red-200 bg-white transition-colors w-full sm:w-auto justify-center">
            <Filter size={18} />
            Filtros
          </button>
        </div>
        
        <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <CreditCard size={32} className="text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhuma carteirinha encontrada</h3>
          <p className="text-sm max-w-sm">
            Esta tela está pronta estruturalmente. Quando conectarmos ao banco de dados, a lista de carteirinhas aparecerá aqui.
          </p>
        </div>
      </div>
    </div>
  );
}
