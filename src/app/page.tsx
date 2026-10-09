"use client";

import Link from 'next/link';
import { Heart, ShieldCheck, CreditCard, ChevronRight, Users, Activity, Sparkles, BookOpen, Info } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        router.push(`/nova-senha?code=${code}`);
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navegação */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-red-50/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="O Bom Amigo" width={40} height={40} className="object-contain" />
            <span className="font-bold text-xl tracking-tight text-slate-900">O Bom Amigo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Área de Membros
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white py-24 sm:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-50 via-white to-white -z-10"></div>
          <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">O Bom amigo</span> é aquele que dá a vida pelo outro.
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-semibold mb-6">
                <BookOpen size={16} /> João 15:13
              </div>
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                Junte-se ao movimento, ao doar sangue você impacta uma comunidade e ajuda a transformar a sociedade através da empatia.
              </p>
            </div>
            
            <div className="relative lg:h-[500px] flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 shadow-2xl border border-slate-200/50 flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-red-50/50"></div>
                {/* Espaço reservado para a "fotinha" da Hero Section */}
                <Image src="/logo.png" alt="O Bom Amigo" width={120} height={120} className="opacity-20 z-10" />
                <span className="relative z-10 mt-4 font-semibold text-slate-400 tracking-widest uppercase text-sm">[ Espaço para Imagem ]</span>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Como funciona o movimento?</h2>
              <p className="text-lg text-slate-600">Um processo simples e transparente para você fazer o bem e ser reconhecido por isso.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Linha conectora (oculta no mobile) */}
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-slate-200 via-red-200 to-slate-200"></div>
              
              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-2xl relative z-10 shadow-sm border border-red-100">1</div>
                <h3 className="text-xl font-bold text-slate-900">Cadastro</h3>
                <p className="text-slate-600">Crie sua conta gratuitamente em menos de 2 minutos pelo nosso aplicativo web.</p>
              </div>

              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4 mt-0 md:mt-12">
                <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl relative z-10 shadow-md shadow-red-200">2</div>
                <h3 className="text-xl font-bold text-slate-900">Ação</h3>
                <p className="text-slate-600">Faça sua doação de sangue no <strong>Hemominas</strong> e faça parte da nossa corrente do bem.</p>
              </div>

              <div className="relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl relative z-10 shadow-sm">3</div>
                <h3 className="text-xl font-bold text-slate-900">Reconhecimento</h3>
                <p className="text-slate-600">Há benefícios disponíveis para quem faz o bem.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefícios */}
        <section className="py-24 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Por que ser um doador?</h2>
              <p className="text-lg text-slate-400">Além de salvar até 4 vidas, doadores regulares possuem diversos benefícios garantidos por lei e vantagens para a própria saúde.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Benefícios Legais e Trabalhistas */}
              <div className="bg-slate-800/50 border border-white/10 rounded-[2rem] p-8 sm:p-10">
                <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-slate-100">Benefícios Legais e Trabalhistas</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Folga no trabalho</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">Pela Consolidação das Leis do Trabalho (CLT) (Art. 473), trabalhadores com carteira assinada têm direito a 1 dia de folga por ano (a cada 12 meses) sem desconto no salário, mediante apresentação de comprovante ou atestado.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Prioridade na votação</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">Doadores têm direito à prioridade para votar nas eleições (conforme normas da Justiça Eleitoral) mediante apresentação de comprovante de doação com validade de até 120 dias.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Benefícios estaduais e municipais</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">Dependendo do estado ou do município, a lei local pode garantir isenção de taxa em concursos públicos e vestibulares estaduais; direito a meia-entrada em cinemas, teatros e shows; e atendimento prioritário em determinados serviços locais.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Benefícios para a Saúde */}
              <div className="bg-slate-800/50 border border-white/10 rounded-[2rem] p-8 sm:p-10">
                <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                  <Heart size={28} />
                </div>
                <h3 className="text-2xl font-bold mb-6 text-slate-100">Benefícios para a Saúde</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Check-up gratuito</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">Antes de doar, você passa por uma triagem e realiza exames laboratoriais gratuitos para detecção de infecções e doenças (como HIV, hepatites B e C, sífilis, entre outros).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Controle do ferro e proteção cardíaca</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">A doação regular ajuda a reduzir o excesso de ferro no sangue e a viscosidade sanguínea, o que pode beneficiar a circulação e o sistema cardiovascular.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-slate-200 block mb-1">Estímulo à renovação celular</strong>
                      <p className="text-sm text-slate-400 leading-relaxed">O organismo repõe rapidamente o volume e as células do sangue após o procedimento, estimulando a renovação do seu corpo.</p>
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
            <div className="relative aspect-square md:aspect-[4/5] rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-xl border border-slate-200/50">
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 flex-col gap-4 bg-slate-50">
                <Image src="/logo.png" alt="Logo" width={100} height={100} className="opacity-20" />
                <span className="font-semibold text-sm tracking-widest uppercase">[ Espaço para Foto do Idealizador ]</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-6">A Iniciativa</h2>
                <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
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
                
                <div className="mt-8 bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                  <Info className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Aviso Importante</h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      Este portal é um movimento independente criado apenas para reunir pessoas com a vontade de fazer a diferença. Para informações oficiais, requisitos e agendamentos, acesse sempre o site oficial do <a href="https://www.hemominas.mg.gov.br/" target="_blank" rel="noreferrer" className="text-amber-700 font-bold hover:underline">Hemominas</a>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Quem sou eu?</h3>
                <p className="text-slate-700 leading-relaxed">
                  [ Espaço para colocar informações sobre você, Khendry, e sua motivação pessoal para criar o projeto depois. ]
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 grayscale opacity-60">
          <Image src="/logo.png" alt="O Bom Amigo" width={32} height={32} className="object-contain" />
          <span className="font-bold text-slate-900">O Bom Amigo</span>
        </div>
        <p className="text-slate-500 text-sm font-medium">
          © {new Date().getFullYear()} Movimento O Bom Amigo. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
