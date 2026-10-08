import { Palette, Save, LayoutTemplate } from 'lucide-react';

export default function DesignCarteirinha() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Design da Carteirinha</h1>
          <p className="text-slate-500 mt-1">Gerencie a versão oficial do design da Carteirinha Digital para todos os membros.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-red-200">
          <Save size={18} />
          Ativar Versão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Configuração */}
        <div className="bg-white rounded-2xl border border-red-50 shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <LayoutTemplate size={20} className="text-red-500" />
            Versão do Design Oficial
          </h2>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Versão Ativa</label>
            <select className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white font-medium text-slate-900">
              <option value="1.0">Carteirinha 1.0 (Vermelho Premium / Padrão)</option>
            </select>
            <p className="text-xs text-slate-500 mt-3">
              Novas versões desenvolvidas via código aparecerão aqui. O design selecionado é aplicado globalmente para todos os doadores.
            </p>
          </div>
        </div>

        {/* Preview da Carteirinha */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Preview: Versão 1.0</p>
          
          <div className="w-full bg-gradient-to-br from-[#E63946] to-[#b91c28] rounded-[2rem] p-6 shadow-[0_20px_50px_-12px_rgba(230,57,70,0.5)] relative overflow-hidden flex flex-col justify-between text-white border border-white/20 aspect-[1.586/1] max-w-sm mb-6">
            
            {/* Efeito de Reflexo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 transform -skew-x-12 translate-x-[-100%] animate-[shimmer_4s_infinite]"></div>
            
            {/* Topo do Cartão */}
            <div className="flex justify-between items-start relative z-10">
              <div className="flex flex-col">
                <span className="text-[12px] font-black tracking-[0.2em] text-white uppercase drop-shadow-sm">O Bom Amigo</span>
                <span className="text-[8px] text-slate-200/80 uppercase tracking-widest font-medium">Carteirinha do Doador</span>
              </div>
              
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-red-200/50 flex items-center justify-center p-1.5 overflow-hidden">
                <img src="/logo.png" alt="O Bom Amigo" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
            </div>
            
            {/* Meio do Cartão (Foto 3x4 e Dados) */}
            <div className="flex justify-between items-end relative z-10">
              <div className="flex gap-4 items-end">
                {/* Foto mockada */}
                <div className="w-16 h-20 bg-white/10 rounded-md flex items-center justify-center border-2 border-white/30 backdrop-blur-sm shadow-inner">
                  <span className="font-medium text-white/80 text-xl">M</span>
                </div>

                <div className="flex flex-col pb-1">
                  <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Nome</span>
                  <span className="text-xl font-medium leading-none tracking-tight">Membro Mockado</span>
                </div>
              </div>

              <div className="flex flex-col items-end pb-1">
                <span className="text-[8px] text-slate-200/80 uppercase tracking-widest mb-0.5">Sangue</span>
                <span className="text-3xl font-light tracking-tighter text-white drop-shadow-sm">O+</span>
              </div>
            </div>
            
            {/* Rodapé */}
            <div className="relative z-10 pt-3 flex justify-end items-end border-t border-white/20 mt-2">
              <div className="flex flex-col items-end">
                <span className="text-[7px] text-slate-200/80 uppercase tracking-widest mb-0.5">Válidade</span>
                <span className="text-[10px] font-mono tracking-widest text-slate-100">
                  31/12/2026
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
