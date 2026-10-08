import { Info, Edit3, Save } from 'lucide-react';

export default function GuiaDoacao() {
  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guia para Doação</h1>
          <p className="text-slate-500 mt-1">Gerencie as informações públicas que os doadores visualizam.</p>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-red-200">
          <Save size={18} />
          Salvar Alterações
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-50 shadow-sm shadow-slate-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Edit3 size={20} className="text-red-500" />
            Editar Conteúdo do Guia
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Título Principal</label>
            <input 
              type="text" 
              defaultValue="O que você precisa saber antes de doar"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Conteúdo do Guia</label>
            <textarea 
              rows={10}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-slate-50 text-slate-900 resize-y"
              defaultValue={`Requisitos Básicos:
- Ter entre 16 e 69 anos de idade.
- Pesar no mínimo 50 kg.
- Estar alimentado (evitar alimentação gordurosa nas 4 horas que antecedem a doação).
- Ter dormido pelo menos 6 horas nas últimas 24 horas.

Restrições Temporárias:
- Gripe, resfriado ou febre: aguardar 7 dias após o desaparecimento dos sintomas.
- Gravidez, 90 dias após parto normal ou 180 após cesariana.
- Tatuagem ou maquiagem definitiva: aguardar 12 meses.`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
