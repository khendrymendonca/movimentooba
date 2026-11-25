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
  Newspaper,
  ExternalLink,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { fetchGroupCampaigns, fetchPublicDonationStats, DonationStats } from '@/lib/campaigns';
import { GroupCampaign, parseSafeDate, parseNewsRow } from '@/utils/donationRules';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z';

function renderContentWithLinks(text?: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (/^(https?:\/\/|www\.)/i.test(part)) {
      const cleanUrl = part.replace(/[.,;!?)]+$/, '');
      const trailing = part.slice(cleanUrl.length);
      const href = cleanUrl.toLowerCase().startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      return (
        <span key={idx}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-600 hover:text-red-700 underline break-all font-medium"
          >
            {cleanUrl}
          </a>
          {trailing}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isMobileView, setIsMobileView] = useState(false);
  const [campaigns, setCampaigns] = useState<GroupCampaign[]>([]);
  const [newsFeed, setNewsFeed] = useState<any[]>([]);
  const [selectedNewsModal, setSelectedNewsModal] = useState<any | null>(null);
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
      const [loadedCampaigns, sessionRes, statsRes, newsRes] = await Promise.all([
        fetchGroupCampaigns(supabase).catch(() => []),
        supabase.auth.getSession().catch(() => ({ data: { session: null } })),
        fetchPublicDonationStats(supabase).catch(() => null),
        supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = loadedCampaigns.filter((c) => {
        const d = parseSafeDate(c.campaign_date);
        return d && d >= today;
      });

      setCampaigns(upcoming.length > 0 ? upcoming : loadedCampaigns);
      setHasSession(!!sessionRes?.data?.session);
      if (statsRes) setDonationStats(statsRes);
      if (newsRes?.data) {
        const parsedNews = newsRes.data.map(parseNewsRow);
        setNewsFeed(parsedNews);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const targetNewsId = params.get('noticia');
          if (targetNewsId) {
            const found = parsedNews.find((n: any) => String(n.id) === String(targetNewsId));
            if (found) setSelectedNewsModal(found);
          }
        }
      }
    }
    loadPublicData();
  }, []);

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

            {/* Total de Sangue Doado */}
            <div className="relative flex items-center justify-center">
              <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-lg border border-slate-100 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase font-semibold tracking-widest text-slate-400 mb-2">
                  Total de Sangue Doado
                </span>

                <div className="flex items-baseline gap-2 my-2">
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

                <p className="text-xs text-slate-400 font-normal mt-3">
                  Cumulativo desde o início do projeto em{' '}
                  <span className="text-slate-600 font-medium">12/09/2026</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Próxima Data de Doação do Grupo (Apenas o próximo mutirão na tela inicial) */}
        {campaigns.length > 0 && (
          <section className="py-14 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6 text-center">
              <span className="text-xs uppercase tracking-widest text-red-500 font-medium">
                Agenda do Movimento
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1 mb-8">
                Próximo Mutirão de Doação
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                {campaigns.slice(0, 1).map((camp) => {
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

        {/* Notícias e Comunicados do Movimento */}
        {newsFeed.length > 0 && (
          <section id="noticias" className="py-16 bg-white border-t border-slate-100">
            <div className="max-w-6xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs uppercase tracking-widest text-red-500 font-medium">
                  Mural do Movimento
                </span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">
                  Notícias e Novidades
                </h2>
                <p className="text-sm sm:text-base text-slate-600 mt-2 font-normal">
                  Acompanhe as ações, mutirões e comunicados recentes da nossa comunidade.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsFeed.map((item) => (
                  <article
                    key={item.id}
                    onClick={() => setSelectedNewsModal(item)}
                    className="bg-slate-50/70 hover:bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {item.image_url ? (
                        <div className="w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-100">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-slate-100/80 border-b border-slate-100 flex items-center justify-center text-slate-300">
                          <Newspaper size={28} />
                        </div>
                      )}

                      <div className="p-5">
                        <span className="text-[11px] text-slate-400 font-normal block mb-1">
                          {new Date(item.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        {item.subtitle && (
                          <p className="text-xs text-red-600 font-medium mt-1 line-clamp-1">
                            {item.subtitle}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 font-normal line-clamp-3 mt-2 leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-2 flex items-center justify-between text-xs text-red-600 font-medium">
                      <span>Ler notícia completa</span>
                      <span>→</span>
                    </div>
                  </article>
                ))}
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

      {/* Modal de Leitura Completa da Notícia na Página do Projeto */}
      {selectedNewsModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedNewsModal(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs font-semibold text-slate-500">
                {new Date(selectedNewsModal.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
                {selectedNewsModal.author_name ? ` • Por ${selectedNewsModal.author_name}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedNewsModal.image_url && (
                <div className="w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 max-h-64 flex items-center justify-center">
                  <img
                    src={selectedNewsModal.image_url}
                    alt={selectedNewsModal.title}
                    className="w-full max-h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {selectedNewsModal.title}
                </h2>
                {selectedNewsModal.subtitle && (
                  <p className="text-xs sm:text-sm text-red-600 font-medium mt-1">
                    {selectedNewsModal.subtitle}
                  </p>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 font-normal whitespace-pre-line leading-relaxed">
                {renderContentWithLinks(selectedNewsModal.content)}
              </div>

              {selectedNewsModal.attachment_url && (
                <a
                  href={selectedNewsModal.attachment_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Abrir Documento Anexo (PDF)</span>
                </a>
              )}
            </div>

            <div className="shrink-0 px-5 py-3.5 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNewsModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
