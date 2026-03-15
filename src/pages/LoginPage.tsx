import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import villageHero from "@/assets/village-hero.png";
import {
  BookOpen,
  Trophy,
  Shield,
  Sparkles,
  Brain,
  Heart,
  Star,
  Zap,
  Target,
  Gamepad2,
  Users,
  ChevronDown,
  Lock,
  Mail,
} from "lucide-react";

const SUBJECTS = [
  { label: "Matemática", icon: "🔢", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Português", icon: "📖", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Estudo do Meio", icon: "🌍", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "Inglês", icon: "🇬🇧", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "Ciências", icon: "🔬", color: "bg-teal-100 text-teal-700 border-teal-200" },
];

const FEATURES = [
  {
    icon: <Brain className="w-7 h-7" />,
    emoji: "🧠",
    title: "Aprende Jogando",
    desc: "Responde a quizzes, constrói a tua vila e sobe de nível enquanto aprendes!",
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: <Trophy className="w-7 h-7" />,
    emoji: "🏆",
    title: "Conquistas e Prémios",
    desc: "Ganha moedas, diamantes, badges e títulos especiais por cada conquista!",
    color: "from-yellow-400 to-orange-500",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  {
    icon: <Users className="w-7 h-7" />,
    emoji: "👫",
    title: "Joga com Amigos",
    desc: "Desafia colegas para duelos de quiz e sobe nos rankings da tua escola!",
    color: "from-green-400 to-emerald-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    icon: <Target className="w-7 h-7" />,
    emoji: "🎯",
    title: "Feito para o Teu Nível",
    desc: "O jogo adapta-se automaticamente — nem muito fácil, nem demasiado difícil!",
    color: "from-orange-400 to-rose-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    emoji: "🛡️",
    title: "100% Seguro",
    desc: "Chat moderado, controlo parental e ambiente completamente seguro para crianças.",
    color: "from-teal-400 to-cyan-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    icon: <Heart className="w-7 h-7" />,
    emoji: "💛",
    title: "Para Todos",
    desc: "Suporte para dislexia, TDAH e necessidades especiais — todos podem aprender!",
    color: "from-pink-400 to-rose-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
  },
];

const FAQS = [
  {
    q: "Para que idades é o jogo?",
    a: "Para alunos do 1.º ao 4.º ano (6 a 10 anos), com conteúdo alinhado ao programa do Ministério da Educação português.",
  },
  {
    q: "É grátis?",
    a: "Sim! Podes jogar gratuitamente com 5 quizzes por dia. O plano Premium (€4.99/mês) dá acesso ilimitado. Há também o Plano Familiar (€12.99/mês) para até 5 filhos.",
  },
  {
    q: "É seguro para o meu filho?",
    a: "Sim! Chat moderado com filtros automáticos, monitorização parental, relatórios semanais e ambiente 100% educativo e seguro.",
  },
  {
    q: "Posso jogar no telemóvel?",
    a: "Sim! Funciona em qualquer dispositivo. Podes instalar como app no telemóvel ou tablet e jogar offline!",
  },
  {
    q: "Que disciplinas posso estudar?",
    a: "Matemática, Português, Estudo do Meio, Inglês e Ciências — com centenas de perguntas por disciplina e por ano escolar!",
  },
  {
    q: "O que são duelos de quiz?",
    a: "Batalhas 1 contra 1! Desafias um amigo, ambos respondem a 10 perguntas e quem tiver mais pontos (velocidade + precisão) ganha. Super emocionante!",
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("Erro ao entrar: " + error.message);
        return;
      }
      if (!data.user) {
        toast.error("Sessão inválida. Tenta novamente.");
        return;
      }
      const targetRoute = await resolvePostLoginRoute(data.user);
      navigate(targetRoute);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-8 w-24 h-24 rounded-full bg-yellow-300/30 blur-2xl" />
          <div className="absolute bottom-12 right-12 w-32 h-32 rounded-full bg-orange-300/25 blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-amber-200/40 blur-xl" />
        </div>

        <div className="container mx-auto px-4 pt-8 pb-0 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

            {/* Left — branding + form */}
            <div className="w-full lg:w-[420px] flex-shrink-0">
              {/* Logo + tagline */}
              <div className="text-center mb-6">
                <img src={logo} alt="QuestEduca" className="w-28 mx-auto mb-3 drop-shadow-md" />
                <h1 className="font-display text-3xl lg:text-4xl font-bold text-amber-900 leading-tight">
                  Aprende.<br />
                  <span className="text-orange-500">Joga.</span>{" "}
                  <span className="text-green-600">Cresce.</span>
                </h1>
                <p className="font-body text-base text-amber-800/70 mt-2 leading-relaxed">
                  A plataforma educativa que transforma o estudo numa aventura!
                </p>
              </div>

              {/* Subject pills */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {SUBJECTS.map((s) => (
                  <span
                    key={s.label}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${s.color}`}
                  >
                    <span>{s.icon}</span> {s.label}
                  </span>
                ))}
              </div>

              {/* Login card */}
              <div className="game-border bg-white/90 backdrop-blur-sm p-7 rounded-2xl shadow-xl">
                <h2 className="font-display text-xl font-bold text-center text-amber-900 mb-5">
                  ⚔️ Entrar na Aventura
                </h2>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="font-body font-semibold text-amber-900 flex items-center gap-1 mb-1">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="o-teu@email.com"
                      required
                      className="border-amber-300 focus:border-amber-500 bg-amber-50/50 text-base"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="password" className="font-body font-semibold text-amber-900 flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Palavra-passe
                      </Label>
                      <Link to="/forgot-password" className="text-xs text-orange-500 hover:underline font-body">
                        Esqueci-me
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="border-amber-300 focus:border-amber-500 bg-amber-50/50 text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    {loading ? "A entrar..." : "⚔️ Entrar"}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="font-body text-sm text-amber-700/70 mb-2">
                    Ainda não tens conta?
                  </p>
                  <Link to="/register">
                    <Button
                      variant="outline"
                      className="w-full border-2 border-green-400 text-green-700 hover:bg-green-50 font-bold text-base py-5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                    >
                      🌟 Criar Conta Grátis
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-4 gap-2 mt-5">
                {[
                  { icon: <Trophy className="w-5 h-5 text-yellow-500" />, value: "50+", label: "Conquistas" },
                  { icon: <BookOpen className="w-5 h-5 text-blue-500" />, value: "1000+", label: "Perguntas" },
                  { icon: <Shield className="w-5 h-5 text-green-500" />, value: "100%", label: "Seguro" },
                  { icon: <Star className="w-5 h-5 text-orange-500" />, value: "1.º-4.º", label: "Ano" },
                ].map((b) => (
                  <div key={b.label} className="bg-white/80 rounded-xl p-3 text-center shadow-sm border border-amber-100">
                    <div className="flex justify-center mb-1">{b.icon}</div>
                    <p className="font-display text-sm font-bold text-amber-900">{b.value}</p>
                    <p className="text-[10px] text-amber-700/60 font-body">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — village hero image */}
            <div className="hidden lg:flex flex-1 justify-center items-end self-end">
              <img
                src={villageHero}
                alt="Vila QuestEduca"
                className="w-full max-w-lg object-contain drop-shadow-2xl"
                style={{ maxHeight: 460 }}
              />
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center py-6 animate-bounce">
          <ChevronDown className="w-6 h-6 text-amber-400" />
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300" />

      {/* ── FEATURES ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block bg-orange-100 text-orange-600 font-body font-semibold px-4 py-1 rounded-full text-sm mb-3">
              Porque é especial?
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-amber-900 flex items-center justify-center gap-2">
              <Sparkles className="w-7 h-7 text-orange-400" />
              O que vais adorar
            </h2>
            <p className="font-body text-amber-700/70 mt-2 text-base">
              Tudo pensado para tornar a aprendizagem divertida, segura e eficaz.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} border ${f.border} rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-amber-900">
                    {f.emoji} {f.title}
                  </h3>
                  <p className="font-body text-sm text-amber-800/70 mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <span className="inline-block bg-green-100 text-green-600 font-body font-semibold px-4 py-1 rounded-full text-sm mb-3">
              Super simples!
            </span>
            <h2 className="font-display text-3xl font-bold text-amber-900 flex items-center justify-center gap-2">
              <Gamepad2 className="w-7 h-7 text-green-500" />
              Como funciona?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                emoji: "📝",
                title: "Cria a tua conta",
                desc: "Regista-te em menos de 1 minuto. Grátis e fácil!",
                color: "bg-blue-500",
              },
              {
                step: "2",
                emoji: "🎮",
                title: "Responde a quizzes",
                desc: "Escolhe a disciplina, responde e ganha recompensas!",
                color: "bg-orange-500",
              },
              {
                step: "3",
                emoji: "🏘️",
                title: "Constrói a tua vila",
                desc: "Usa as moedas ganhas para expandir a tua aldeia!",
                color: "bg-green-500",
              },
            ].map((step) => (
              <div key={step.step} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-amber-100 relative">
                <div className={`w-10 h-10 ${step.color} text-white rounded-full font-display font-bold text-lg flex items-center justify-center mx-auto mb-3 shadow`}>
                  {step.step}
                </div>
                <div className="text-4xl mb-3">{step.emoji}</div>
                <h3 className="font-display text-lg font-bold text-amber-900 mb-1">{step.title}</h3>
                <p className="font-body text-sm text-amber-700/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/register">
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.03]">
                🌟 Começar Agora — É Grátis!
              </Button>
            </Link>
            <p className="text-xs text-amber-600/60 mt-3 font-body">Sem cartão de crédito. Sem compromisso.</p>
          </div>
        </div>
      </section>

      {/* ── DISCIPLINAS ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <span className="inline-block bg-blue-100 text-blue-600 font-body font-semibold px-4 py-1 rounded-full text-sm mb-3">
              Curriculum nacional
            </span>
            <h2 className="font-display text-3xl font-bold text-amber-900 flex items-center justify-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-500" />
              O que podes estudar?
            </h2>
            <p className="font-body text-amber-700/70 mt-2">
              Conteúdo do 1.º ao 4.º ano, alinhado com o programa do Ministério da Educação.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { emoji: "🔢", name: "Matemática", desc: "Números, formas e muito mais", color: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
              { emoji: "📖", name: "Português", desc: "Leitura, escrita e gramática", color: "bg-green-50 border-green-200 hover:bg-green-100" },
              { emoji: "🌍", name: "Estudo do Meio", desc: "Natureza, sociedade e ciência", color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100" },
              { emoji: "🇬🇧", name: "Inglês", desc: "Vocabulário e frases simples", color: "bg-red-50 border-red-200 hover:bg-red-100" },
              { emoji: "🔬", name: "Ciências", desc: "Descobertas e experimentos", color: "bg-teal-50 border-teal-200 hover:bg-teal-100" },
            ].map((s) => (
              <div key={s.name} className={`${s.color} border rounded-2xl p-4 text-center transition-colors duration-200 cursor-default sm:col-span-1 col-span-1`}>
                <div className="text-3xl mb-2">{s.emoji}</div>
                <h3 className="font-display text-sm font-bold text-amber-900">{s.name}</h3>
                <p className="font-body text-[11px] text-amber-700/60 mt-1 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARA PAIS ── */}
      <section className="py-16 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-teal-100 text-teal-700 font-body font-semibold px-4 py-1 rounded-full text-sm mb-3">
                Para pais e educadores
              </span>
              <h2 className="font-display text-3xl font-bold text-amber-900 mb-4">
                Controlo total na palma da mão
              </h2>
              <ul className="space-y-3">
                {[
                  { icon: "📊", text: "Relatórios semanais por email com o progresso do teu filho" },
                  { icon: "💬", text: "Monitorização e controlo do chat — podes bloquear quando quiseres" },
                  { icon: "🎯", text: "Define prioridades por disciplina para ajudar nas áreas mais difíceis" },
                  { icon: "🔔", text: "Notificações em tempo real sobre conquistas e atividade" },
                  { icon: "🛡️", text: "Ambiente 100% seguro, RGPD compliant e certificado" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3 font-body text-sm text-amber-800/80">
                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/register/parent">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-5 rounded-xl shadow-md transition-all hover:scale-[1.02]">
                    Registar como Pai/Encarregado
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-teal-100 text-center max-w-xs mx-auto">
                <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
                <h3 className="font-display text-xl font-bold text-amber-900 mb-1">Plano Familiar</h3>
                <div className="flex items-baseline justify-center gap-1 my-3">
                  <span className="font-display text-4xl font-bold text-teal-600">€12.99</span>
                  <span className="text-sm text-amber-700/60 font-body">/mês</span>
                </div>
                <p className="text-sm text-amber-700/70 font-body mb-4">Até 5 filhos com acesso premium ilimitado</p>
                <div className="space-y-2 text-left">
                  {["Quizzes ilimitados", "Relatórios avançados", "Sem anúncios", "Suporte prioritário"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm font-body text-amber-800">
                      <span className="text-green-500 font-bold">✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-block bg-amber-100 text-amber-700 font-body font-semibold px-4 py-1 rounded-full text-sm mb-3">
              Tens dúvidas?
            </span>
            <h2 className="font-display text-3xl font-bold text-amber-900 flex items-center justify-center gap-2">
              <Zap className="w-7 h-7 text-amber-500" />
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-amber-200 rounded-2xl overflow-hidden bg-amber-50/50">
                <button
                  className="w-full text-left px-6 py-4 font-body font-semibold text-amber-900 flex items-center justify-between gap-4 hover:bg-amber-100/60 transition-colors duration-150"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-amber-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 font-body text-sm text-amber-800/80 leading-relaxed border-t border-amber-200 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="text-5xl mb-4">🏰</div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-3">
            Pronto para a aventura?
          </h2>
          <p className="font-body text-white/80 text-base mb-8 leading-relaxed">
            Junta-te a milhares de alunos que já estão a aprender enquanto constroem as suas vilas e sobem nos rankings!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-lg px-10 py-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03]">
                🌟 Criar Conta Grátis
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-bold text-lg px-10 py-6 rounded-2xl transition-all hover:scale-[1.02]">
                ⚔️ Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-amber-900 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="QuestEduca" className="w-10 opacity-80" />
              <div>
                <p className="font-display text-amber-100 font-bold text-sm">QuestEduca</p>
                <p className="text-amber-400/70 text-xs font-body">Plataforma educativa portuguesa</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-xs text-amber-400/70 font-body">
              <Link to="/terms" className="hover:text-amber-300 transition-colors">Termos de Serviço</Link>
              <Link to="/privacy" className="hover:text-amber-300 transition-colors">Privacidade</Link>
              <Link to="/cookies" className="hover:text-amber-300 transition-colors">Cookies</Link>
              <Link to="/faq" className="hover:text-amber-300 transition-colors">FAQ</Link>
            </div>
          </div>
          <div className="border-t border-amber-800 mt-6 pt-4 text-center">
            <p className="text-xs text-amber-500/60 font-body">
              © 2026 QuestEduca. Todos os direitos reservados. RGPD Compliant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
