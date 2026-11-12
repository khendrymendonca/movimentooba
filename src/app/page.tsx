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
import { fetchGroupCampaigns, fetchPublicDonationStats, DonationStats } from '@/lib/campaigns';
import { GroupCampaign, parseSafeDate } from '@/utils/donationRules';
import { Droplet, Sparkles, Award } from 'lucide-react';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isMobileView, setIsMobileView] = useState(false);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [hasSession, setHasSession] = useState(false);
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalDonations: 0,
    totalMl: 0,
    totalLiters: 0,
    totalLives: 0,
    startDate: '12/09/2026',
  });

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
      const [loadedCampaigns, sessionRes, statsRes] = await Promise.all([
        fetchGroupCampaigns(supabase),
        supabase.auth.getSession(),
        fetchPublicDonationStats(supabase),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = loadedCampaigns.filter((c) => {
        const d = parseSafeDate(c.campaign_date);
        return d && d >= today;
      });

      setCampaigns(upcoming);
      setHasSession(!!sessionRes.data.session);
      if (statsRes) setDonationStats(statsRes);
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

            {/* Card de Impacto: Sangue Doado Acumulado (450 ml por doação) */}
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-md bg-gradient-to-br from-white via-rose-50/30 to-red-50/60 rounded-[2.5rem] p-7 sm:p-9 shadow-xl border border-red-100/80 relative overflow-hidden flex flex-col justify-between">
                {/* Elemento Decorativo Sutil de Fundo */}
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-red-100/40 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-rose-200/30 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Tag Superior */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/80 border border-red-200/60 text-red-700 text-xs font-semibold">
                    <Droplet size={14} className="fill-red-600 text-red-600" />
                    <span>Impacto Coletivo</span>
                  </div>

                  {/* Volume Principal */}
                  <div className="my-6">
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-1">
                      Total de Sangue Doado
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                        {donationStats.totalLiters >= 1
                          ? donationStats.totalLiters.toLocaleString('pt-BR', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })
                          : donationStats.totalMl.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-red-600">
                        {donationStats.totalLiters >= 1 ? 'Litros' : 'ml'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5 leading-relaxed">
                      {donationStats.totalDonations > 0 ? (
                        <span>
                          Equivalente a{' '}
                          <strong className="text-slate-700 font-semibold">
                            {donationStats.totalMl.toLocaleString('pt-BR')} ml
                          </strong>{' '}
                          de esperança compartilhada
                        </span>
                      ) : (
                        <span>Cada registro de doação adiciona 450 ml ao nosso contador coletivo!</span>
                      )}
                    </p>
                  </div>

                  {/* Marco Oficial Exigido pelo Movimento */}
                  <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3 border border-red-100/70 mb-5 text-center">
                    <span className="text-[11px] font-semibold text-slate-600">
                      Cumulativo desde o início do projeto em{' '}
                      <span className="text-red-600 font-bold">12/09/2026</span>
                    </span>
                  </div>

                  {/* Três Métricas em Grade */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                        450 ml
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">por doação</span>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <span className="text-base sm:text-lg font-bold text-slate-900 block leading-tight">
                        {donationStats.totalDonations}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {donationStats.totalDonations === 1 ? 'doação' : 'doações'}
                      </span>
                    </div>

                    <div className="bg-white/90 p-3 rounded-2xl border border-slate-100 shadow-xs">
                      <span className="text-base sm:text-lg font-bold text-emerald-600 block leading-tight">
                        {donationStats.totalLives}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">vidas salvas</span>
                    </div>
                  </div>
                </div>

                {/* Chamada para ação sutil */}
                <div className="mt-6 pt-4 border-t border-red-100/60 relative z-10">
                  <Link
                    href="/cadastro"
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
                  >
                    <Heart size={14} className="fill-white" />
                    Quero Doar e Somar
                  </Link>
                </div>
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

        {/* A Iniciativa */}
        <section className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <span className="text-xs uppercase tracking-widest text-red-500 font-semibold">
              Movimento Solidário
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 mt-1 mb-8">
              A Iniciativa
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-slate-600 leading-relaxed text-left sm:text-center">
              <p>
                A ideia é juntar um grupo de pessoas movidas pela vontade de fazer a diferença e que entendem que 5 minutos de doação podem garantir 50 anos a alguém.
              </p>
              <p>
                Doar sangue é mais do que ajudar, é garantir que uma família tenha a sensação de ver um ente querido e amado sair de uma situação de necessidade e vulnerabilidade.
              </p>
              <p className="font-medium text-slate-800">
                Doar sangue é garantir que alguém consiga continuar construindo a sua história.
              </p>
            </div>

            <div className="mt-10 bg-amber-50/70 p-6 sm:p-7 rounded-3xl border border-amber-100 flex flex-col sm:flex-row gap-4 text-left items-start">
              <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Aviso Importante</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Este portal é um movimento independente criado apenas para reunir pessoas com a vontade de fazer a diferença. Para informações oficiais, requisitos e agendamentos, acesse sempre o site oficial do{' '}
                  <a
                    href="https://www.hemominas.mg.gov.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-700 font-semibold hover:underline"
                  >
                    Hemominas
                  </a>
                  .
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
