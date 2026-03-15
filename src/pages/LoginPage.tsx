import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import {
  BookOpen,
  Trophy,
  Users,
  Shield,
  Sparkles,
  Brain,
  Heart,
  Star,
  Zap,
  Target,
  Award,
  Gamepad2
} from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen parchment-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
          {/* Login Form */}
          <div className="lg:sticky lg:top-8">
            <div className="game-border p-8 bg-card">
              <div className="text-center mb-6">
                <img src={logo} alt="QuestEduca" className="w-32 mx-auto mb-4" />
                <h1 className="font-display text-2xl font-bold">Continuar Aventura</h1>
                <p className="font-body text-sm text-muted-foreground mt-1">
                  Entra na tua conta para continuar a jogar
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="font-body font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="o-teu@email.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-body font-semibold">Palavra-passe</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline font-body">
                      Esqueci-me da palavra-passe
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="mt-1"
                  />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-lg py-5" disabled={loading}>
                  {loading ? "A entrar..." : "⚔️ Entrar"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="font-body text-sm text-muted-foreground mb-2">
                  Ainda não tens conta?
                </p>
                <Link to="/register">
                  <Button variant="link" className="font-body text-primary">
                    Criar nova conta
                  </Button>
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-muted-foreground underline font-body">
                  ← Voltar ao início
                </Link>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">50+</p>
                  <p className="text-xs text-muted-foreground">Conquistas</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">1000+</p>
                  <p className="text-xs text-muted-foreground">Perguntas</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-xs text-muted-foreground">Seguro</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Star className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">4 Anos</p>
                  <p className="text-xs text-muted-foreground">1º ao 4º</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Information Section */}
          <div className="space-y-6">
            {/* Features Cards */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Porque é que vais adorar?
              </h2>
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="w-5 h-5 text-blue-500" />
                      Aprende Jogando
                    </CardTitle>
                    <CardDescription>
                      Transforma o estudo numa aventura emocionante! Constrói a tua vila, completa quizzes e desbloqueia conquistas enquanto aprendes Matemática, Português, Estudo do Meio e muito mais.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="w-5 h-5 text-green-500" />
                      Dificuldade Adaptativa
                    </CardTitle>
                    <CardDescription>
                      O jogo ajusta-se automaticamente ao teu nível! Se acertas muito, as perguntas ficam mais desafiantes. Se erras, o jogo ajuda-te a melhorar com perguntas mais fáceis.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5 text-purple-500" />
                      Joga com Amigos
                    </CardTitle>
                    <CardDescription>
                      Adiciona amigos, desafia-os para duelos de quiz, forma grupos de estudo e sobe nos rankings! A aprendizagem é mais divertida em equipa.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-red-500" />
                      100% Seguro para Crianças
                    </CardTitle>
                    <CardDescription>
                      Chat moderado, controlo parental completo e ambiente seguro. Os pais podem acompanhar todo o progresso e recebem relatórios semanais por email.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-yellow-500" />
                      Recompensas Incríveis
                    </CardTitle>
                    <CardDescription>
                      Ganha moedas, diamantes, badges e títulos especiais! Desbloqueia edifícios únicos para a tua vila e sobe de nível para te tornares um verdadeiro Sabichão.
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Heart className="w-5 h-5 text-pink-500" />
                      Feito para Ti
                    </CardTitle>
                    <CardDescription>
                      Suporte completo para dislexia, TDAH e outras necessidades especiais. Text-to-Speech, lupa virtual, alto contraste e muito mais para todos poderem aprender.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Perguntas Frequentes
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-left">
                        Para que idades é o jogo?
                      </AccordionTrigger>
                      <AccordionContent>
                        A QuestEduca é perfeita para alunos do 1º ao 4º ano do Ensino Básico (6 a 10 anos). O conteúdo está alinhado com o programa do Ministério da Educação português.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-left">
                        É grátis?
                      </AccordionTrigger>
                      <AccordionContent>
                        Sim! Podes jogar gratuitamente com limite de 5 quizzes por dia. O plano Premium (€4.99/mês) dá acesso ilimitado, sem anúncios, relatórios avançados e conteúdo exclusivo. Há também o Plano Familiar (€12.99/mês) para até 5 filhos.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                      <AccordionTrigger className="text-left">
                        É seguro para o meu filho?
                      </AccordionTrigger>
                      <AccordionContent>
                        Absolutamente! Temos chat moderado com filtros automáticos, os pais podem monitorizar todas as mensagens, bloquear o chat se quiserem e recebem relatórios semanais. O ambiente é 100% seguro e educativo.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-left">
                        Como funcionam os rankings?
                      </AccordionTrigger>
                      <AccordionContent>
                        Há rankings globais, por escola, por turma e por disciplina! Podes competir de forma saudável com colegas e amigos. Os rankings renovam-se semanalmente, mensalmente e anualmente.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger className="text-left">
                        Posso jogar no telemóvel?
                      </AccordionTrigger>
                      <AccordionContent>
                        Sim! O jogo funciona perfeitamente em qualquer dispositivo - computador, tablet ou telemóvel. Podes até instalar como uma app no teu dispositivo para jogar offline!
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-6">
                      <AccordionTrigger className="text-left">
                        Que disciplinas posso estudar?
                      </AccordionTrigger>
                      <AccordionContent>
                        Podes estudar Matemática, Português, Estudo do Meio, Inglês e Ciências. Cada disciplina tem centenas de perguntas adaptadas ao teu ano escolar!
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-7">
                      <AccordionTrigger className="text-left">
                        Como funcionam os eventos especiais?
                      </AccordionTrigger>
                      <AccordionContent>
                        Ao longo do ano há eventos especiais no Natal, Páscoa, Carnaval e feriados nacionais portugueses! Cada evento tem desafios exclusivos, recompensas especiais e bónus de XP e moedas.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-8">
                      <AccordionTrigger className="text-left">
                        O que são duelos de quiz?
                      </AccordionTrigger>
                      <AccordionContent>
                        São batalhas 1 contra 1 entre jogadores! Desafias um amigo, ambos respondem a 10 perguntas e quem tiver mais pontos (velocidade + precisão) ganha. É super emocionante!
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-9">
                      <AccordionTrigger className="text-left">
                        Os pais podem ver o meu progresso?
                      </AccordionTrigger>
                      <AccordionContent>
                        Sim, se fores menor de idade. Os teus pais têm um dashboard onde veem tudo: quanto estudaste, em que disciplinas, que conquistas desbloqueaste e até podem definir prioridades para te ajudarem a melhorar nas disciplinas mais difíceis.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-10">
                      <AccordionTrigger className="text-left">
                        Posso jogar sem internet?
                      </AccordionTrigger>
                      <AccordionContent>
                        A vila e os edifícios ficam guardados no teu dispositivo, mas para fazer quizzes novos e competir com amigos precisas de internet. Estamos a trabalhar numa versão totalmente offline!
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Game Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  O Que Oferecemos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>1000+ Perguntas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>5 Disciplinas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>50+ Conquistas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>15+ Edifícios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Vila 3D Isométrica</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Rankings Globais</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Duelos 1v1</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Chat Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Eventos Sazonais</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Controlo Parental</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Links */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
                  <Link to="/terms" className="hover:text-primary underline">
                    Termos de Serviço
                  </Link>
                  <span>•</span>
                  <Link to="/privacy" className="hover:text-primary underline">
                    Política de Privacidade
                  </Link>
                  <span>•</span>
                  <Link to="/cookies" className="hover:text-primary underline">
                    Política de Cookies
                  </Link>
                  <span>•</span>
                  <Link to="/faq" className="hover:text-primary underline">
                    FAQ
                  </Link>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  © 2026 QuestEduca. Todos os direitos reservados.
                </p>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Plataforma educativa portuguesa certificada e segura para crianças.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
