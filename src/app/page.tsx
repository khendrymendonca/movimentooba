"use client";

import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  Calendar,
  BookOpen,
  Info,
  MessageCircle,
  LogIn,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { fetchGroupCampaigns } from '@/lib/campaigns';
import { GroupCampaign, parseSafeDate } from '@/utils/donationRules';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isMobileView, setIsMobileView] = useState(false);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        router.push(`/nova-senha?code=${encodeURIComponent(code)}`);
        return;
      }

      const mediaQuery = window.matchMedia('(max-width: 1024px)');
      const updateScreenSize = () => {
        setIsMobileView(mediaQuery.matches || window.innerWidth <= 1024);
      };

      updateScreenSize();
      mediaQuery.addEventListener('change', updateScreenSize);
      window.addEventListener('resize', updateScreenSize);

      return () => {
        mediaQuery.removeEventListener('change', updateScreenSize);
        window.removeEventListener('resize', updateScreenSize);
      };
    }
  }, [router]);

  useEffect(() => {
    async function loadPublicData() {
      const [loadedCampaigns, sessionRes] = await Promise.all([
        fetchGroupCampaigns(supabase),
        supabase.auth.getSession(),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = loadedCampaigns.filter((c) => {
        const d = parseSafeDate(c.campaign_date);
        return d && d >= today;
      });

      setCampaigns(upcoming);
      setHasSession(!!sessionRes.data.session);
    }
    loadPublicData();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navegação Superior */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-sm z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="O Bom Amigo" width={34} height={34} className="object-contain" />
            <span className="font-medium text-base sm:text-lg tracking-tight text-slate-800">
              O Bom Amigo
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/cadastro"
              className="text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full text-xs sm:text-sm font-normal transition-colors"
            >
              Cadastrar
            </Link>

            {/* Botão Área de Membros slim, limpo e sutil - visível apenas em celular/tablet */}
            <Link
              href={hasSession ? '/doador' : '/login'}
              className={`${
                isMobileView ? 'inline-flex' : 'inline-flex lg:hidden'
              } items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-normal transition-colors`}
            >
              <LogIn size={14} className="text-slate-400" />
              <span>Área de Membros</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white py-14 sm:py-24">
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-normal mb-6">
                <BookOpen size={14} /> João 15:13
              </div>
              <h1 className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.15] mb-6">
                <span className="text-red-600">
                  O Bom amigo
                </span>{' '}
                é aquele que dá a vida pelo outro.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-lg font-normal">
                Junte-se ao movimento. Ao doar sangue você impacta uma comunidade e ajuda a transformar a sociedade através da empatia.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                <Link
                  href="/cadastro"
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-normal transition-colors text-center"
                >
                  Cadastrar
                </Link>

                {/* Único lugar com o botão padronizado "Canal no WhatsApp" */}
                <a
                  href={WHATSAPP_CHANNEL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-normal transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} className="text-emerald-600" />
                  Canal no WhatsApp
                </a>

                {/* No celular/tablet, acesso sutil e slim à Área de Membros */}
                <Link
                  href={hasSession ? '/doador' : '/login'}
                  className={`${
                    isMobileView ? 'flex' : 'flex lg:hidden'
                  } bg-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-normal transition-colors items-center justify-center gap-2`}
                >
                  <LogIn size={15} className="text-slate-400" />
                  Área de Membros
                </Link>
              </div>
            </div>

            <div className="relative lg:h-[460px] flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-xl border border-slate-200/50 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-red-50/40"></div>
                <Image src="/logo.png" alt="O Bom Amigo" width={120} height={120} className="opacity-20 z-10" />
                <span className="relative z-10 mt-4 font-medium text-slate-400 tracking-widest uppercase text-xs">
                  [ Espaço para Imagem ]
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Próximas Datas de Doação do Grupo (Sutil e Institucional) */}
        {campaigns.length > 0 && (
          <section className="py-14 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-500 font-medium">
                Agenda do Movimento
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1 mb-8">
                Próximas Doações em Grupo
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                {campaigns.map((camp) => {
                  const dateObj = parseSafeDate(camp.campaign_date);
                  const maxLimit = camp.max_participants || 20;
                  const confirmedCount = camp.confirmed_count || 0;
                  const isFull = confirmedCount >= maxLimit;

                  return (
                    <div
                      key={camp.id}
                      className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-1.5 text-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar size={18} className="text-red-500 shrink-0" />
                        <span className="text-base font-medium text-slate-900">
                          {dateObj
                            ? dateObj.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })
                            : camp.campaign_date}
                        </span>
                      </div>
                      {isFull ? (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-normal">
                          20/20 vagas no mutirão • Necessário agendar pelo site para esta data
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-normal">
                          {confirmedCount}/{maxLimit} presenças confirmadas
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Como Funciona */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-4">
                Como funciona o movimento?
              </h2>
              <p className="text-lg text-slate-600">
                Um processo simples e transparente para você fazer o bem e caminhar junto conosco.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-200 via-red-200 to-slate-200"></div>

              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-semibold text-xl relative z-10 border border-red-100">
                  1
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Cadastro</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Crie sua conta gratuitamente em menos de 2 minutos e acompanhe o Canal no WhatsApp.
                </p>
              </div>

              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4 mt-0 md:mt-12">
                <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center font-semibold text-xl relative z-10 shadow-sm">
                  2
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Ação</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Faça sua doação de sangue no Hemominas e faça parte da nossa corrente do bem.
                </p>
              </div>

              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center font-semibold text-xl relative z-10">
                  3
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Reconhecimento</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Pelo celular, você acessa a Área de Membros com sua carteirinha e acompanha as próximas datas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold mb-4">Por que ser um doador?</h2>
              <p className="text-lg text-slate-400">
                Além de salvar até 4 vidas, doadores regulares possuem diversos benefícios garantidos por lei e vantagens para a própria saúde.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-800/40 border border-white/10 rounded-[2rem] p-8 sm:p-10">
                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-2xl font-semibold mb-6 text-slate-100">
                  Benefícios Legais e Trabalhistas
                </h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Folga no trabalho</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Pela CLT (Art. 473), trabalhadores com carteira assinada têm direito a 1 dia de folga por ano sem desconto no salário, mediante apresentação de comprovante.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Prioridade na votação</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Doadores têm direito à prioridade para votar nas eleições mediante apresentação de comprovante de doação com validade de até 120 dias.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Benefícios estaduais e municipais</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Dependendo do estado ou do município, a lei local pode garantir isenção de taxa em concursos públicos estaduais, meia-entrada cultural e atendimento prioritário.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-800/40 border border-white/10 rounded-[2rem] p-8 sm:p-10">
                <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <Heart size={24} />
                </div>
                <h3 className="text-2xl font-semibold mb-6 text-slate-100">Benefícios para a Saúde</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Check-up gratuito</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Antes de doar, você passa por uma triagem e realiza exames laboratoriais gratuitos para detecção de infecções e doenças.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Controle do ferro e proteção cardíaca</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        A doação regular ajuda a equilibrar os níveis de ferro no sangue, beneficiando a circulação e o sistema cardiovascular.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></div>
                    <div>
                      <span className="text-slate-200 font-medium block mb-1">Estímulo à renovação celular</span>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        O organismo repõe rapidamente o volume e as células do sangue após o procedimento, estimulando a renovação do seu corpo.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Quem Sou Eu & A Iniciativa */}
        <section className="py-24 bg-white">
          <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square md:aspect-[4/5] rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-lg border border-slate-200/50">
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 flex-col gap-4 bg-slate-50">
                <Image src="/logo.png" alt="Logo" width={100} height={100} className="opacity-20" />
                <span className="font-medium text-xs tracking-widest uppercase">
                  [ Espaço para Foto do Idealizador ]
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-6">A Iniciativa</h2>
                <div className="space-y-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                  <p>
                    A ideia é juntar um grupo de pessoas movidas pela vontade de fazer a diferença e que entendem que 5 minutos de doação podem garantir 50 anos a alguém.
                  </p>
                  <p>
                    Doar sangue é mais do que ajudar, é garantir que uma família tenha a sensação de ver um ente querido e amado sair de uma situação de necessidade e vulnerabilidade.
                  </p>
                  <p>
                    Doar sangue é garantir que alguém consiga continuar construindo a sua história.
                  </p>
                </div>

                <div className="mt-8 bg-amber-50/70 p-6 rounded-2xl border border-amber-100 flex gap-4">
                  <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={22} />
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">Aviso Importante</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Este portal é um movimento independente criado apenas para reunir pessoas com a vontade de fazer a diferença. Para informações oficiais, requisitos e agendamentos, acesse sempre o site oficial do{' '}
                      <a
                        href="https://www.hemominas.mg.gov.br/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-700 font-medium hover:underline"
                      >
                        Hemominas
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50/60 p-8 rounded-3xl border border-red-100/80">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Quem sou eu?</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  [ Espaço para colocar informações sobre você, Khendry, e sua motivação pessoal para criar o projeto depois. ]
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200/80 py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 grayscale opacity-60">
          <Image src="/logo.png" alt="O Bom Amigo" width={28} height={28} className="object-contain" />
          <span className="font-medium text-slate-900">O Bom Amigo</span>
        </div>
        <p className="text-slate-500 text-sm">
          © {new Date().getFullYear()} Movimento O Bom Amigo. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
