"use client";

import { Bell, Newspaper } from "lucide-react";
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import Image from 'next/image';

export default function DoadorHome() {
  const [userName, setUserName] = useState<string>('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('name, avatar_url').eq('id', session.user.id).single();
        if (data) {
          setUserName(data.name.split(' ')[0]);
          setAvatar(data.avatar_url);
        }
      }
    }
    
    async function loadFeed() {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (data) setFeed(data);
    }
    
    loadUser();
    loadFeed();
  }, [supabase]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header com Saudação */}
      <div className="px-6 pt-10 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {avatar ? (
             <Image src={avatar} alt="Foto" width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-red-100 shadow-sm" />
          ) : (
             <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg border-2 border-red-200 shadow-sm">
               {userName.charAt(0) || '?'}
             </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none mb-0.5">Olá, {userName}</h1>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 relative cursor-pointer shadow-sm">
          <Bell size={20} />
          {feed.length > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
        </div>
      </div>

      <div className="px-6 py-4 flex-1">
        
        {/* Banner de Agendamento */}
        <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-red-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay opacity-10 -mr-10 -mt-10 blur-xl"></div>
          <h2 className="text-xl font-bold mb-2 relative z-10">Agendar Doação</h2>
          <p className="text-red-50 text-sm mb-4 relative z-10 leading-relaxed">
            Hemocentro de Juiz de Fora-MG (Polo Principal).
          </p>
          
          <div className="bg-red-900/20 rounded-xl p-4 mb-4 relative z-10 backdrop-blur-sm border border-red-400/30 text-xs text-red-50 space-y-2">
            <p><strong>Segunda a Sexta:</strong> 07:00 às 18:00</p>
            <p><strong>Sábado:</strong> 07:00 às 12:00</p>
            <p className="pt-2 border-t border-red-400/30">
              <strong>Telefone:</strong> (31) 4042-7157
            </p>
            <p className="text-[10px] text-red-200 mt-1">(Agendamento por telefone ou Aplicativo MGApp - Cidadão)</p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 mb-4 relative z-10 border border-white/20">
            <p className="text-xs font-semibold text-white leading-relaxed">
              ⚠️ ATENÇÃO: Se for doar durante a campanha, é obrigatório apresentar sua carteirinha digital na recepção para contabilizar para o movimento.
            </p>
          </div>

          <a 
            href="https://www.mg.gov.br/agendamento_servico/doacao-de-sangue" 
            target="_blank" rel="noreferrer"
            className="block w-full py-3.5 bg-white text-red-600 font-bold rounded-xl text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative z-10"
          >
            Agendar Online
          </a>
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Feed de Notícias</h2>
        
        {feed.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/50 border border-slate-100 border-dashed rounded-3xl mt-4">
            <Newspaper size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400 font-medium">Nenhuma novidade no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((item) => (
              <article key={item.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col gap-3">
                <div className="flex gap-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt="Capa" className="w-20 h-20 rounded-2xl flex-shrink-0 object-cover border border-slate-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center bg-slate-50 text-slate-300 border border-slate-100">
                      <Newspaper size={28} />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
                {item.attachment_url && (
                  <a href={item.attachment_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors self-start">
                    Ver Anexo / Documento
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
