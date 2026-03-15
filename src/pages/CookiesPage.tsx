import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cookie } from "lucide-react";
import logo from "@/assets/logo.png";

const CookiesPage = () => {
  return (
    <div className="min-h-screen parchment-bg">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/login">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <img src={logo} alt="Vila dos Sabichões" className="w-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold flex items-center justify-center gap-2">
            <Cookie className="w-8 h-8" />
            Política de Cookies
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: 15 de Março de 2026
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="font-display text-xl font-bold mb-3">1. O Que São Cookies?</h2>
              <p className="text-muted-foreground">
                Cookies são pequenos ficheiros de texto armazenados no seu dispositivo (computador, tablet ou telemóvel) quando visita a Vila dos Sabichões. Estes ficheiros permitem que a plataforma reconheça o seu dispositivo e melhore a sua experiência.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">2. Tipos de Cookies que Utilizamos</h2>

              <div className="space-y-4">
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Cookies Estritamente Necessários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2"><strong>Finalidade:</strong> Essenciais para o funcionamento básico da plataforma.</p>
                    <p className="mb-2"><strong>Podem ser desativados?</strong> Não. Sem estes cookies, a plataforma não funciona corretamente.</p>
                    <p><strong>Exemplos:</strong></p>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><code className="bg-muted px-1 rounded">sb-auth-token</code> - Token de autenticação Supabase</li>
                      <li><code className="bg-muted px-1 rounded">sb-refresh-token</code> - Token de renovação de sessão</li>
                      <li><code className="bg-muted px-1 rounded">session-id</code> - Identificador de sessão</li>
                    </ul>
                    <p className="mt-2"><strong>Duração:</strong> Sessão ou até 30 dias</p>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-blue-500">◐</span>
                      Cookies Funcionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2"><strong>Finalidade:</strong> Guardar preferências e configurações do utilizador.</p>
                    <p className="mb-2"><strong>Podem ser desativados?</strong> Sim, mas perderá certas funcionalidades.</p>
                    <p><strong>Exemplos:</strong></p>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><code className="bg-muted px-1 rounded">theme</code> - Tema escolhido (claro/escuro)</li>
                      <li><code className="bg-muted px-1 rounded">language</code> - Idioma preferido</li>
                      <li><code className="bg-muted px-1 rounded">accessibility-settings</code> - Preferências de acessibilidade</li>
                      <li><code className="bg-muted px-1 rounded">sound-enabled</code> - Som ativado/desativado</li>
                      <li><code className="bg-muted px-1 rounded">tutorial-completed</code> - Estado do tutorial</li>
                    </ul>
                    <p className="mt-2"><strong>Duração:</strong> Até 1 ano</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-purple-500">◑</span>
                      Cookies de Desempenho
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2"><strong>Finalidade:</strong> Recolher informações sobre como os utilizadores interagem com a plataforma.</p>
                    <p className="mb-2"><strong>Podem ser desativados?</strong> Sim. Dados recolhidos são anónimos.</p>
                    <p><strong>Exemplos:</strong></p>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li><code className="bg-muted px-1 rounded">_ga</code> - Google Analytics (se implementado)</li>
                      <li><code className="bg-muted px-1 rounded">performance-metrics</code> - Métricas de performance</li>
                    </ul>
                    <p className="mt-2"><strong>Duração:</strong> Até 2 anos</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Cookies de Marketing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-2"><strong>Status:</strong> NÃO UTILIZAMOS cookies de marketing ou publicidade.</p>
                    <p>A Vila dos Sabichões não rastreia utilizadores para fins publicitários nem partilha dados com redes de publicidade.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">3. Cookies de Terceiros</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Utilizamos serviços de terceiros que podem definir os seus próprios cookies:</p>

                <div className="space-y-3 mt-3">
                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold text-foreground">Supabase (Backend)</p>
                    <p className="text-sm">Cookies de autenticação e sessão. Essenciais para login e segurança.</p>
                    <p className="text-xs mt-1">Privacidade: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com/privacy</a></p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold text-foreground">Stripe (Pagamentos)</p>
                    <p className="text-sm">Cookies para processar pagamentos de forma segura.</p>
                    <p className="text-xs mt-1">Privacidade: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com/privacy</a></p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-semibold text-foreground">Vercel (Hospedagem)</p>
                    <p className="text-sm">Cookies técnicos para entrega de conteúdo.</p>
                    <p className="text-xs mt-1">Privacidade: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">vercel.com/legal/privacy-policy</a></p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">4. Como Gerir Cookies</h2>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Através do Navegador</h3>
                  <p className="mb-2">Pode controlar e/ou eliminar cookies através das definições do seu navegador:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Google Chrome:</strong> Definições → Privacidade e segurança → Cookies</li>
                    <li><strong>Firefox:</strong> Opções → Privacidade e segurança → Cookies</li>
                    <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
                    <li><strong>Edge:</strong> Definições → Cookies e permissões do site</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm">
                    <strong>⚠️ Aviso:</strong> Se bloquear ou eliminar cookies essenciais, não poderá fazer login nem utilizar funcionalidades principais da plataforma.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">Através da Plataforma</h3>
                  <p>Após fazer login, pode gerir algumas preferências de cookies em:</p>
                  <p className="mt-1"><strong>Definições → Privacidade → Gestão de Cookies</strong></p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">5. Local Storage e Session Storage</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Além de cookies, também utilizamos Local Storage e Session Storage do navegador para:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Guardar estado da vila e edifícios construídos</li>
                  <li>Cache de perguntas de quiz para melhor performance</li>
                  <li>Preferências de interface (zoom, posição do mapa)</li>
                  <li>Dados temporários de jogabilidade</li>
                </ul>
                <p className="mt-2">Estes dados são armazenados apenas no seu dispositivo e não são enviados para os nossos servidores.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">6. PWA (Progressive Web App)</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>A Vila dos Sabichões é uma PWA, o que significa que pode:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Instalar a aplicação no seu dispositivo</li>
                  <li>Utilizar algumas funcionalidades offline</li>
                  <li>Receber notificações push (com permissão)</li>
                </ul>
                <p className="mt-2">Quando instalada como PWA, a aplicação armazena dados localmente através de:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Service Worker:</strong> Para cache e funcionamento offline</li>
                  <li><strong>IndexedDB:</strong> Para armazenamento estruturado de dados</li>
                  <li><strong>Cache Storage:</strong> Para assets estáticos</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">7. Cookies e Menores</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Proteção Especial para Crianças:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>NÃO utilizamos cookies de tracking ou publicidade</li>
                  <li>NÃO criamos perfis comportamentais de crianças</li>
                  <li>Cookies essenciais são apenas para segurança e funcionalidade</li>
                  <li>Pais podem eliminar cookies das contas dos filhos</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">8. Consentimento</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Ao utilizar a Vila dos Sabichões, você consente com:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Utilização de cookies estritamente necessários</li>
                  <li>Utilização de cookies funcionais (pode desativar)</li>
                  <li>Armazenamento local de dados de jogo</li>
                </ul>
                <p className="mt-2">Para cookies opcionais, pediremos o seu consentimento explícito através de um banner quando aceder à plataforma pela primeira vez.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">9. Atualizações</h2>
              <p className="text-muted-foreground">
                Esta Política de Cookies pode ser atualizada ocasionalmente para refletir alterações nos nossos cookies ou por motivos legais. A data de "Última atualização" indica a versão mais recente.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">10. Mais Informações</h2>
              <div className="text-muted-foreground">
                <p>Para saber mais sobre cookies em geral, visite:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li><a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">AllAboutCookies.org</a></li>
                  <li><a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-primary underline">YourOnlineChoices.eu</a></li>
                </ul>
                <p className="mt-3">Para questões sobre a nossa utilização de cookies:</p>
                <p className="mt-1"><strong>Email:</strong> privacidade@viladossabichoes.pt</p>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-muted-foreground italic">
                A Vila dos Sabichões utiliza cookies de forma responsável e transparente, priorizando sempre a privacidade e segurança das crianças.
              </p>
            </section>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Documentos Relacionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link to="/terms">
                <Button variant="outline">Termos de Serviço</Button>
              </Link>
              <Link to="/privacy">
                <Button variant="outline">Política de Privacidade</Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline">Perguntas Frequentes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2026 Vila dos Sabichões. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;
