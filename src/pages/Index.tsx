import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import villageHero from "@/assets/village-hero.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { sendEmail } from "@/lib/email";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Trophy, Shield, Sparkles, Brain, Heart, Target, Users, ChevronDown, MessageSquare, FileText, Cookie, Mail, Check, X, Zap, Star, Gamepad2, ChartBar as BarChart3, Lock, Smartphone, Menu } from "lucide-react";

const FAQS = [
  {
    q: "Para que idades é o jogo?",
    a: "Para alunos do 1.º ao 4.º ano (6 a 10 anos), com conteúdo alinhado ao programa do Ministério da Educação português.",
  },
  {
    q: "É grátis?",
    a: "Sim! Podes jogar gratuitamente com 5 quizzes por dia. O plano Premium (€1,99/mês) dá acesso ilimitado. O Plano Familiar (€4,99/mês) cobre até 3 filhos. Ambos os planos têm opção anual com 10% de desconto.",
  },
  {
    q: "É seguro para o meu filho?",
    a: "Sim! Chat moderado com filtros automáticos, monitorização parental, relatórios semanais e ambiente 100% educativo e seguro, RGPD compliant.",
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
    q: "Posso cancelar a subscrição?",
    a: "Sim, podes cancelar a qualquer momento sem penalizações. O acesso premium mantém-se até ao fim do período pago.",
  },
  {
    q: "Os meus dados estão protegidos?",
    a: "Todos os dados são tratados em conformidade com o RGPD. Tens direito a aceder, retificar ou eliminar os teus dados a qualquer momento contactando dpo@questeduca.pt.",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Aprendizagem Adaptativa",
    desc: "O jogo ajusta automaticamente a dificuldade ao nível do aluno — nem fácil de mais, nem impossível.",
    color: "bg-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: Trophy,
    title: "Conquistas e Prémios",
    desc: "Badges, títulos exclusivos e moedas virtuais recompensam cada progresso e incentivam a continuar.",
    color: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    icon: Users,
    title: "Duelos entre Amigos",
    desc: "Quiz battles 1 vs 1 em tempo real. Quem responder mais rápido e melhor ganha pontos extra.",
    color: "bg-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    icon: Shield,
    title: "Ambiente 100% Seguro",
    desc: "Chat moderado com IA, aprovação parental de amizades e conteúdo auditado por pedagogos.",
    color: "bg-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    icon: Heart,
    title: "Inclusão e Acessibilidade",
    desc: "Suporte para dislexia, TDAH e NEE. Fonte especial, leitura de texto em voz alta e interface simplificada.",
    color: "bg-rose-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    desc: "Pais e professores recebem relatórios semanais por email com análise de desempenho por disciplina.",
    color: "bg-sky-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [cookiesAccepted, setCookiesAccepted] = useState(
    localStorage.getItem("cookiesAccepted") === "true"
  );
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    type: "informacao",
    message: "",
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [giftCardModalOpen, setGiftCardModalOpen] = useState(false);
  const [giftCardPlan, setGiftCardPlan] = useState("individual_monthly");
  const [giftCardQty, setGiftCardQty] = useState(1);
  const [giftCardBuyerEmail, setGiftCardBuyerEmail] = useState("");
  const [giftCardBuyerName, setGiftCardBuyerName] = useState("");
  const [sendingGiftCard, setSendingGiftCard] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setCookiesAccepted(true);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookiesAccepted", "false");
    setCookiesAccepted(true);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingContact(true);
    try {
      const typeLabels: Record<string, string> = {
        informacao: "Pedido de Informação",
        sugestao: "Sugestão",
        reclamacao: "Reclamação",
        outro: "Outro",
      };
      await sendEmail({
        to: "suporte@questeduca.pt",
        subject: `[Questeduca] ${typeLabels[contactForm.type]} - ${contactForm.name}`,
        html: `
          <h2>${typeLabels[contactForm.type]}</h2>
          <p><strong>Nome:</strong> ${contactForm.name}</p>
          <p><strong>Email:</strong> ${contactForm.email}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${contactForm.message.replace(/\n/g, "<br>")}</p>
        `,
      });
      toast.success("Mensagem enviada com sucesso!");
      setContactOpen(false);
      setContactForm({ name: "", email: "", type: "informacao", message: "" });
    } catch {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
    setSendingContact(false);
  };

  const handleGiftCardCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardBuyerEmail) return;
    setSendingGiftCard(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-gift-card-checkout", {
        body: {
          planType: giftCardPlan,
          buyerEmail: giftCardBuyerEmail,
          buyerName: giftCardBuyerName,
          quantity: giftCardQty,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        setGiftCardModalOpen(false);
        setGiftCardBuyerEmail("");
        setGiftCardBuyerName("");
        setGiftCardQty(1);
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    }
    setSendingGiftCard(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-body overflow-x-hidden">

      {/* ── STICKY NAV ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logo} alt="QuestEduca" className="w-12 h-12 object-contain" />
            <span
              className={`font-display font-bold text-xl tracking-wide transition-colors ${
                scrolled ? "text-amber-900" : "text-amber-900"
              }`}
            >
              QuestEduca
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <a href="#features" className="text-slate-600 hover:text-amber-700 transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-slate-600 hover:text-amber-700 transition-colors">
              Preços
            </a>
            <a href="#gift-cards" className="text-slate-600 hover:text-amber-700 transition-colors">
              Gift Cards
            </a>
            <a href="#parents" className="text-slate-600 hover:text-amber-700 transition-colors">
              Para Pais
            </a>
            <a href="#faq" className="text-slate-600 hover:text-amber-700 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="font-semibold text-slate-700 hover:text-amber-800 hover:bg-amber-50"
              >
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 rounded-xl shadow-sm"
              >
                Comecar Gratis
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 shadow-md">
            <a
              href="#features"
              className="block text-sm font-semibold text-slate-700 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </a>
            <a
              href="#pricing"
              className="block text-sm font-semibold text-slate-700 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Precos
            </a>
            <a
              href="#parents"
              className="block text-sm font-semibold text-slate-700 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Para Pais
            </a>
            <a
              href="#faq"
              className="block text-sm font-semibold text-slate-700 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full font-semibold">
                  Entrar
                </Button>
              </Link>
              <Link to="/register" className="flex-1">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold">
                  Comecar Gratis
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pt-16 pb-20">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-orange-200/25 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-yellow-100/40 blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none">
              <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                1.º ao 4.º ano — Alinhado ao Ministerio da Educacao
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-amber-950 leading-[1.1] mb-5">
                Aprende.{" "}
                <span className="text-orange-500">Joga.</span>{" "}
                <span className="text-green-600">Cresce.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-lg lg:max-w-none">
                A plataforma educativa portuguesa que transforma o estudo numa aventura epica.
                Quizzes, construcao de aldeias e duelos em tempo real.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <Link to="/register">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Comecar Gratis
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="border-2 border-amber-300 text-amber-900 hover:bg-amber-50 font-bold text-lg px-8 py-6 rounded-2xl transition-all hover:scale-[1.02]"
                  >
                    Ja tenho conta
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {[
                  { emoji: "🔢", label: "Matematica" },
                  { emoji: "📖", label: "Portugues" },
                  { emoji: "🌍", label: "Estudo do Meio" },
                  { emoji: "🇬🇧", label: "Ingles" },
                  { emoji: "🔬", label: "Ciencias" },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="inline-flex items-center gap-1.5 bg-white/80 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm"
                  >
                    {s.emoji} {s.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — hero image */}
            <div className="flex-shrink-0 lg:flex-1 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-amber-200/40 to-orange-200/30 rounded-3xl blur-2xl" />
                <img
                  src={villageHero}
                  alt="Vila QuestEduca"
                  className="relative w-full max-w-sm lg:max-w-lg drop-shadow-2xl"
                />

                {/* Floating cards */}
                <div className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg border border-amber-100 px-4 py-3 flex items-center gap-2.5 animate-bounce" style={{ animationDuration: "3s" }}>
                  <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">🏆</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Nova Conquista!</p>
                    <p className="text-[10px] text-slate-500">Estudante Dedicado</p>
                  </div>
                </div>

                <div className="absolute -bottom-2 -right-4 bg-white rounded-2xl shadow-lg border border-green-100 px-4 py-3 flex items-center gap-2.5" style={{ animation: "bounce 4s ease-in-out infinite", animationDelay: "1.5s" }}>
                  <div className="w-9 h-9 bg-green-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">+</div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">+250 moedas</p>
                    <p className="text-[10px] text-slate-500">Resposta correta!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-white/80 backdrop-blur-md border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { value: "1000+", label: "Perguntas", icon: BookOpen },
              { value: "50+", label: "Conquistas", icon: Trophy },
              { value: "5", label: "Disciplinas", icon: Sparkles },
              { value: "100%", label: "Seguro e RGPD", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-xl sm:text-2xl font-bold text-amber-700">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-orange-100 text-orange-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Porque o QuestEduca?
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Tudo o que precisas numa so plataforma
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Pensado por pedagogos, desenhado por especialistas em UX para criancas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`${f.bg} border ${f.border} rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-green-100 text-green-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Super simples!
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3 flex items-center justify-center gap-3">
              <Gamepad2 className="w-8 h-8 text-green-500" />
              Como funciona?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-300 via-orange-300 to-green-300" />

            {[
              {
                step: "1",
                emoji: "👨‍👩‍👧",
                title: "Pai regista-se primeiro",
                desc: "O encarregado de educacao cria a conta e autoriza o filho a jogar. Controlo total desde o inicio.",
                color: "bg-blue-500",
              },
              {
                step: "2",
                emoji: "🎮",
                title: "Aluno cria o seu heroi",
                desc: "O aluno escolhe o nome, faz um teste de nivelamento e comeca a construir a sua aldeia.",
                color: "bg-amber-500",
              },
              {
                step: "3",
                emoji: "🏆",
                title: "Aprende e sobe de nivel",
                desc: "Quizzes diarios, duelos com amigos e eventos sazonais mantem a motivacao sempre alta!",
                color: "bg-green-500",
              },
            ].map((step) => (
              <div key={step.step} className="bg-white rounded-2xl p-7 text-center shadow-sm border border-slate-100 relative">
                <div className={`w-11 h-11 ${step.color} text-white rounded-full font-display font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-md`}>
                  {step.step}
                </div>
                <div className="text-5xl mb-4">{step.emoji}</div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button className="bg-green-500 hover:bg-green-600 text-white font-bold text-lg px-10 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                Comecar Agora — E Gratis!
              </Button>
            </Link>
            <p className="text-xs text-slate-400 mt-3">Sem cartao de credito. Sem compromisso.</p>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-100 text-amber-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Planos e Precos
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Simples e transparente
            </h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto mb-8">
              Comeca gratis, faz upgrade quando quiseres. Cancela a qualquer momento.
            </p>
            <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full p-1.5">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  !billingAnnual ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                  billingAnnual ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Anual
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-10%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-7 flex flex-col gap-5">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Gratis</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-slate-900">€0</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">Para sempre</p>
              </div>
              <Link to="/register">
                <Button variant="outline" className="w-full border-2 border-slate-300 font-bold rounded-xl py-5">
                  Criar Conta Gratis
                </Button>
              </Link>
              <ul className="space-y-2.5 text-sm">
                {[
                  { text: "5 quizzes por dia", ok: true },
                  { text: "1 disciplina a escolha", ok: true },
                  { text: "Construcao basica da aldeia", ok: true },
                  { text: "Chat seguro com colegas", ok: true },
                  { text: "Quizzes ilimitados", ok: false },
                  { text: "Duelos e torneios", ok: false },
                  { text: "Relatorios para pais", ok: false },
                  { text: "Eventos sazonais exclusivos", ok: false },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5">
                    {item.ok ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={item.ok ? "text-slate-700" : "text-slate-400"}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium — highlighted */}
            <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-white p-7 flex flex-col gap-5 relative shadow-lg shadow-amber-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                Mais Popular
              </div>
              <div>
                <p className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-1">Premium</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-slate-900">
                    {billingAnnual ? "€1,79" : "€1,99"}
                  </span>
                  <span className="text-slate-500 text-sm">/mes</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {billingAnnual ? "€21,49/ano — poupa €2,39" : "ou €21,49/ano (poupa 10%)"}
                </p>
              </div>
              <Link to="/register">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-5 shadow">
                  Experimentar 7 Dias Gratis
                </Button>
              </Link>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Quizzes ilimitados",
                  "Todas as 5 disciplinas",
                  "Duelos e batalhas de quiz",
                  "Torneios e eventos sazonais",
                  "Relatorios semanais por email",
                  "Sem anuncios",
                  "Suporte prioritario",
                  "1 aluno incluido",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Family */}
            <div className="rounded-2xl border-2 border-teal-300 bg-gradient-to-b from-teal-50 to-white p-7 flex flex-col gap-5 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow">
                Melhor Valor
              </div>
              <div>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-1">Familiar</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-slate-900">
                    {billingAnnual ? "€4,49" : "€4,99"}
                  </span>
                  <span className="text-slate-500 text-sm">/mes</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {billingAnnual ? "€53,88/ano — poupa €5,99" : "ou €53,88/ano (poupa 10%)"}
                </p>
                <p className="text-xs font-semibold text-teal-700 mt-1">Ate 3 filhos incluidos</p>
              </div>
              <Link to="/register/parent">
                <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl py-5">
                  Experimentar 7 Dias Gratis
                </Button>
              </Link>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Tudo do Premium",
                  "Ate 3 perfis de alunos",
                  "Dashboard unificado para pais",
                  "Comparativo de progresso",
                  "Controlo individual por filho",
                  "Relatorios por aluno",
                  "Suporte prioritario",
                  "Fatura mensal unica",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            Precos em euros (EUR). IVA incluido. Cancela a qualquer momento.
            <br />
            O periodo de trial gratuito e valido para novas contas. Sem cartao de credito necessario para o trial.
          </p>
        </div>
      </section>

      {/* ── GIFT CARDS ── */}
      <section id="gift-cards" className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-rose-100 text-rose-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Oferece Premium
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              O presente perfeito para um aluno
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Oferece meses ou um ano de acesso Premium a um familiar ou amigo. O codigo chega por email e pode ser resgatado a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              { planType: "individual_monthly", label: "Individual", period: "1 Mes", price: "€1,99", days: 30, color: "border-blue-300 bg-blue-50", badge: "bg-blue-500", accent: "text-blue-700", btnClass: "bg-blue-600 hover:bg-blue-700" },
              { planType: "family_monthly", label: "Familiar", period: "1 Mes", price: "€4,99", days: 30, color: "border-teal-300 bg-teal-50", badge: "bg-teal-500", accent: "text-teal-700", btnClass: "bg-teal-600 hover:bg-teal-700" },
              { planType: "individual_annual", label: "Individual", period: "1 Ano", price: "€21,49", days: 365, color: "border-amber-300 bg-amber-50", badge: "bg-amber-500", accent: "text-amber-700", btnClass: "bg-amber-500 hover:bg-amber-600" },
              { planType: "family_annual", label: "Familiar", period: "1 Ano", price: "€53,88", days: 365, color: "border-orange-300 bg-orange-50", badge: "bg-orange-500", accent: "text-orange-700", btnClass: "bg-orange-500 hover:bg-orange-600" },
            ].map((card) => (
              <div key={card.planType} className={`rounded-2xl border-2 ${card.color} p-6 flex flex-col gap-4`}>
                <div>
                  <span className={`inline-block ${card.badge} text-white text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                    {card.label}
                  </span>
                  <p className={`font-display text-2xl font-bold text-slate-900`}>{card.price}</p>
                  <p className={`text-sm font-semibold ${card.accent} mt-0.5`}>{card.period} de Premium</p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Valido 1 ano apos compra</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Codigo enviado por email</li>
                  <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Facil de resgatar no jogo</li>
                  {card.label === "Familiar" && (
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> Ate 3 filhos incluidos</li>
                  )}
                </ul>
                <Button
                  className={`w-full ${card.btnClass} text-white font-bold rounded-xl py-4 text-sm`}
                  onClick={() => {
                    setGiftCardPlan(card.planType);
                    setGiftCardModalOpen(true);
                  }}
                >
                  Oferecer por {card.price}
                </Button>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Precisa de mais de 5 gift cards?{" "}
              <button
                onClick={() => setContactOpen(true)}
                className="text-slate-700 font-semibold underline underline-offset-2 hover:text-slate-900 transition-colors"
              >
                Entre em contacto connosco
              </button>{" "}
              e diga-nos o que precisa para podermos ajudar.
            </p>
          </div>
        </div>
      </section>

      {/* Gift Card Purchase Modal */}
      <Dialog open={giftCardModalOpen} onOpenChange={setGiftCardModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Comprar Gift Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGiftCardCheckout} className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">Tipo de Gift Card</Label>
              <Select value={giftCardPlan} onValueChange={setGiftCardPlan}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual_monthly">Individual — 1 Mes (€1,99)</SelectItem>
                  <SelectItem value="family_monthly">Familiar — 1 Mes (€4,99)</SelectItem>
                  <SelectItem value="individual_annual">Individual — 1 Ano (€21,49)</SelectItem>
                  <SelectItem value="family_annual">Familiar — 1 Ano (€53,88)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-sm">Quantidade (max. 5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={giftCardQty}
                onChange={(e) => setGiftCardQty(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold text-sm">O teu Nome</Label>
              <Input
                value={giftCardBuyerName}
                onChange={(e) => setGiftCardBuyerName(e.target.value)}
                placeholder="Para personalizarmos o email"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold text-sm">O teu Email</Label>
              <Input
                type="email"
                required
                value={giftCardBuyerEmail}
                onChange={(e) => setGiftCardBuyerEmail(e.target.value)}
                placeholder="Enviaremos o(s) codigo(s) aqui"
                className="mt-1"
              />
            </div>
            <p className="text-xs text-slate-500">
              Apos o pagamento, os codigos chegam por email. Cada codigo e valido durante 1 ano.
              {giftCardQty > 1 && " Precisas de mais de 5? Contacta-nos."}
            </p>
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-5"
              disabled={sendingGiftCard}
            >
              {sendingGiftCard ? "A processar..." : `Pagar e Receber Codigo${giftCardQty > 1 ? "s" : ""}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PARENTS ── */}
      <section id="parents" className="py-24 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            <div className="flex-1 max-w-xl">
              <span className="inline-block bg-teal-100 text-teal-700 text-sm font-bold px-4 py-1.5 rounded-full mb-5">
                Para Pais e Encarregados
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-5">
                Controlo total na palma da mao
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: BarChart3, text: "Relatorios semanais por email com o progresso detalhado por disciplina" },
                  { icon: MessageSquare, text: "Monitorizacao do chat — ve e bloqueia conversas a qualquer momento" },
                  { icon: Target, text: "Define prioridades por disciplina para reforcar as areas mais fracas" },
                  { icon: Users, text: "Aprova ou recusa pedidos de amizade do teu filho" },
                  { icon: Lock, text: "Redefine a password do filho diretamente no teu painel" },
                  { icon: Shield, text: "RGPD compliant — os teus dados nunca sao vendidos a terceiros" },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-3.5">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-teal-600" />
                    </div>
                    <span className="text-slate-600 text-sm leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link to="/register/parent">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-5 rounded-xl shadow-md transition-all hover:scale-[1.01]">
                    Registar como Encarregado de Educacao
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex-shrink-0 w-full max-w-sm mx-auto lg:mx-0">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-teal-600 px-6 py-5">
                  <p className="font-display font-bold text-white text-lg">Painel de Controlo Parental</p>
                  <p className="text-teal-200 text-xs mt-0.5">Acesso 24/7 ao progresso do teu filho</p>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { label: "Matematica", pct: 82, color: "bg-blue-400" },
                    { label: "Portugues", pct: 67, color: "bg-green-400" },
                    { label: "Estudo do Meio", pct: 91, color: "bg-amber-400" },
                    { label: "Ingles", pct: 54, color: "bg-red-400" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                        <span>{s.label}</span>
                        <span>{s.pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Sequencia atual</div>
                    <div className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                      <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                      12 dias
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCIPLINAS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Curriculum Nacional
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3 flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              O que podes estudar?
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Conteudo do 1.º ao 4.º ano, alinhado com o programa 2024/2025 do Ministerio da Educacao.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { emoji: "🔢", name: "Matematica", desc: "Numeros, formas, problemas", color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50" },
              { emoji: "📖", name: "Portugues", desc: "Leitura, escrita, gramatica", color: "border-green-200 hover:border-green-400 hover:bg-green-50" },
              { emoji: "🌍", name: "Estudo do Meio", desc: "Natureza, sociedade, ciencia", color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50" },
              { emoji: "🇬🇧", name: "Ingles", desc: "Vocabulario e frases", color: "border-red-200 hover:border-red-400 hover:bg-red-50" },
              { emoji: "🔬", name: "Ciencias", desc: "Descobertas e experiencias", color: "border-teal-200 hover:border-teal-400 hover:bg-teal-50" },
            ].map((s) => (
              <div
                key={s.name}
                className={`border-2 rounded-2xl p-5 text-center transition-all duration-200 cursor-default bg-white ${s.color}`}
              >
                <div className="text-4xl mb-3">{s.emoji}</div>
                <h3 className="font-display text-sm font-bold text-slate-900 mb-1">{s.name}</h3>
                <p className="text-[11px] text-slate-500 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block bg-amber-100 text-amber-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Tens duvidas?
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 flex items-center justify-center gap-3">
              <Zap className="w-7 h-7 text-amber-500" />
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full text-left px-6 py-5 font-semibold text-slate-800 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-amber-900/20 blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-6xl mb-5">🏰</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Pronto para a aventura?
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Junta-te a milhares de alunos que ja estao a aprender enquanto constroem as suas vilas e sobem nos rankings!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-lg px-10 py-6 rounded-2xl shadow-lg transition-all hover:scale-[1.03]">
                <Sparkles className="w-5 h-5 mr-2" />
                Criar Conta Gratis
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white font-bold text-lg px-10 py-6 rounded-2xl transition-all hover:scale-[1.02] bg-transparent"
              >
                Ja tenho conta
              </Button>
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-6">
            Disponivel em iOS, Android, Windows, Mac e Linux
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <img src={logo} alt="QuestEduca" className="w-9 h-9 object-contain opacity-90" />
                <span className="font-display font-bold text-white text-lg">QuestEduca</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Plataforma educativa gamificada para o 1.º ciclo do ensino basico portugues. Aprender pode ser uma aventura.
              </p>
              <p className="text-xs text-slate-600 mt-4">
                Responsavel: Hugo Alberto da Silva Martins<br />
                NIF: 218246587<br />
                <a href="mailto:legal@questeduca.pt" className="hover:text-slate-400 transition-colors">
                  legal@questeduca.pt
                </a>
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/register" className="hover:text-white transition-colors">Criar Conta</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Entrar</Link></li>
                <li><Link to="/install" className="hover:text-white transition-colors">Instalar App</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/register/association" className="hover:text-white transition-colors">Associacoes de Pais</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold text-white text-sm mb-4">Legal e Privacidade</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Termos de Utilizacao</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Politica de Privacidade</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors flex items-center gap-1.5"><Cookie className="w-3.5 h-3.5" />Politica de Cookies</Link></li>
                <li>
                  <a href="mailto:dpo@questeduca.pt" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />Exercer Direitos RGPD
                  </a>
                </li>
                <li>
                  <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    CNPD — cnpd.pt
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              © 2026 QuestEduca. Todos os direitos reservados. RGPD Compliant.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Smartphone className="w-3.5 h-3.5" />
              <span>iOS · Android · Web</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── COOKIE BANNER ── */}
      {!cookiesAccepted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/97 backdrop-blur-md border-t border-slate-700 px-4 py-4 sm:py-5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <Cookie className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-semibold mb-0.5">Utilizamos cookies</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Usamos cookies essenciais para autenticacao e seguranca.{" "}
                  <Link to="/cookies" className="text-amber-400 hover:text-amber-300 underline">
                    Saber mais
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={rejectCookies}
                className="text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-xs"
              >
                Apenas essenciais
              </Button>
              <Button
                size="sm"
                onClick={acceptCookies}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg px-5"
              >
                Aceitar todos
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CONTACT ── */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-6 right-6 z-40 w-13 h-13 w-[52px] h-[52px] bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 hover:bg-slate-800 transition-all border border-slate-700">
            <MessageSquare className="w-5 h-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Contacte-nos</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label className="font-semibold text-sm">Nome</Label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold text-sm">Email</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold text-sm">Tipo de Contacto</Label>
              <Select
                value={contactForm.type}
                onValueChange={(v) => setContactForm({ ...contactForm, type: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informacao">Pedido de Informacao</SelectItem>
                  <SelectItem value="sugestao">Sugestao</SelectItem>
                  <SelectItem value="reclamacao">Reclamacao</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-semibold text-sm">Mensagem</Label>
              <Textarea
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                rows={4}
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
              disabled={sendingContact}
            >
              {sendingContact ? "A enviar..." : "Enviar Mensagem"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
