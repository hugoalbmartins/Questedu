import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import logo from "@/assets/logo.png";

const TermsPage = () => {
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
          <img src={logo} alt="QuestEduca" className="w-24 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold flex items-center justify-center gap-2">
            <FileText className="w-8 h-8" />
            Termos de Serviço
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: 15 de Março de 2026
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="font-display text-xl font-bold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao aceder e utilizar a plataforma QuestEduca ("Plataforma"), você aceita estar vinculado por estes Termos de Serviço. Se não concordar com qualquer parte destes termos, não deve utilizar a Plataforma.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground mb-2">
                A QuestEduca é uma plataforma educativa gamificada destinada a alunos do 1º ao 4º ano do Ensino Básico em Portugal. A Plataforma oferece:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Quizzes educativos adaptados ao currículo português</li>
                <li>Sistema de gamificação com conquistas e recompensas</li>
                <li>Vila virtual personalizável</li>
                <li>Funcionalidades sociais seguras (amizades, chat moderado)</li>
                <li>Dashboard de acompanhamento parental</li>
                <li>Relatórios de progresso académico</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">3. Elegibilidade e Contas</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>3.1 Idade Mínima:</strong> A Plataforma destina-se a crianças entre 6 e 10 anos. Menores de 13 anos devem ter autorização parental explícita para criar uma conta.</p>
                <p><strong>3.2 Tipos de Conta:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Conta de Aluno: Para crianças estudarem e jogarem</li>
                  <li>Conta de Pai/Encarregado: Para monitorização e controlo parental</li>
                  <li>Conta de Professor: Para gestão de turmas (se aplicável)</li>
                  <li>Conta de Administrador: Para gestão da plataforma</li>
                </ul>
                <p><strong>3.3 Responsabilidade:</strong> Os pais/encarregados são responsáveis por todas as atividades realizadas nas contas dos seus educandos.</p>
                <p><strong>3.4 Segurança:</strong> Você é responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades que ocorram na sua conta.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">4. Planos e Pagamentos</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>4.1 Plano Gratuito:</strong> Acesso limitado a 5 quizzes por dia com funcionalidades básicas.</p>
                <p><strong>4.2 Plano Premium Individual:</strong> €4.99/mês - Acesso ilimitado para 1 filho.</p>
                <p><strong>4.3 Plano Familiar:</strong> €12.99/mês - Acesso ilimitado para até 5 filhos.</p>
                <p><strong>4.4 Trial Gratuito:</strong> 7 dias de acesso premium gratuito para novos utilizadores.</p>
                <p><strong>4.5 Faturação:</strong> As assinaturas são cobradas mensalmente e renovam automaticamente até cancelamento.</p>
                <p><strong>4.6 Cancelamento:</strong> Pode cancelar a qualquer momento através do Customer Portal. O acesso premium mantém-se até ao final do período pago.</p>
                <p><strong>4.7 Reembolsos:</strong> Não oferecemos reembolsos para períodos parcialmente utilizados, exceto conforme exigido por lei.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">5. Uso Aceitável</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Ao utilizar a Plataforma, você concorda em NÃO:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Utilizar linguagem ofensiva, discriminatória ou inapropriada</li>
                  <li>Fazer bullying, assediar ou intimidar outros utilizadores</li>
                  <li>Partilhar informações pessoais sensíveis (moradas, números de telefone, etc.)</li>
                  <li>Tentar burlar o sistema de moderação ou segurança</li>
                  <li>Criar múltiplas contas para ganhar vantagens injustas</li>
                  <li>Usar bots, scripts ou ferramentas automatizadas</li>
                  <li>Copiar, modificar ou distribuir conteúdo da Plataforma sem autorização</li>
                  <li>Tentar aceder a contas de outros utilizadores</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">6. Funcionalidades Sociais e Chat</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>6.1 Moderação:</strong> Todo o chat é moderado automaticamente e pode ser revisto manualmente.</p>
                <p><strong>6.2 Filtros:</strong> Utilizamos filtros automáticos para bloquear conteúdo inapropriado.</p>
                <p><strong>6.3 Denúncias:</strong> Os utilizadores podem denunciar mensagens ou comportamentos inapropriados.</p>
                <p><strong>6.4 Controlo Parental:</strong> Os pais podem monitorizar todas as conversas e bloquear o chat a qualquer momento.</p>
                <p><strong>6.5 Penalidades:</strong> Violações das regras podem resultar em suspensão temporária ou banimento permanente.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">7. Propriedade Intelectual</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>7.1 Conteúdo da Plataforma:</strong> Todo o conteúdo (textos, gráficos, logos, imagens, código) é propriedade da QuestEduca e está protegido por direitos de autor.</p>
                <p><strong>7.2 Conteúdo do Utilizador:</strong> Ao criar conteúdo na Plataforma (mensagens, respostas), você concede-nos uma licença mundial, não exclusiva e livre de royalties para usar esse conteúdo.</p>
                <p><strong>7.3 Marcas Registadas:</strong> "QuestEduca" e logos relacionados são marcas registadas. Não podem ser utilizados sem autorização.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">8. Privacidade e Dados</h2>
              <p className="text-muted-foreground">
                A recolha e utilização de dados pessoais é regida pela nossa <Link to="/privacy" className="text-primary underline">Política de Privacidade</Link>. Ao utilizar a Plataforma, você concorda com essas práticas.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">9. Limitação de Responsabilidade</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>9.1 Serviço "Como Está":</strong> A Plataforma é fornecida "como está" sem garantias de qualquer tipo.</p>
                <p><strong>9.2 Disponibilidade:</strong> Não garantimos que a Plataforma estará sempre disponível ou livre de erros.</p>
                <p><strong>9.3 Conteúdo Educativo:</strong> Embora nos esforcemos por oferecer conteúdo de qualidade, não garantimos resultados académicos específicos.</p>
                <p><strong>9.4 Danos:</strong> Não somos responsáveis por quaisquer danos diretos, indiretos, incidentais ou consequenciais resultantes do uso da Plataforma.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">10. Modificações dos Termos</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. Notificaremos os utilizadores sobre alterações significativas por email ou através da Plataforma. O uso continuado da Plataforma após alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">11. Rescisão</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>11.1 Por Si:</strong> Pode encerrar a sua conta a qualquer momento através das definições ou contactando-nos.</p>
                <p><strong>11.2 Por Nós:</strong> Podemos suspender ou encerrar contas que violem estes Termos sem aviso prévio.</p>
                <p><strong>11.3 Efeitos:</strong> Após rescisão, você perde acesso ao conteúdo e dados da conta. Podemos reter certos dados conforme exigido por lei.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">12. Lei Aplicável e Jurisdição</h2>
              <p className="text-muted-foreground">
                Estes Termos são regidos pelas leis de Portugal. Quaisquer disputas serão resolvidas nos tribunais portugueses competentes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">13. Contacto</h2>
              <div className="text-muted-foreground">
                <p>Para questões sobre estes Termos, contacte-nos:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li><strong>Email:</strong> legal@questeduca.pt</li>
                  <li><strong>Email Suporte:</strong> suporte@questeduca.pt</li>
                  <li><strong>Morada:</strong> QuestEduca, Lda.</li>
                </ul>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-muted-foreground italic">
                Ao criar uma conta e utilizar a QuestEduca, você confirma que leu, compreendeu e aceita estes Termos de Serviço na sua totalidade.
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
              <Link to="/privacy">
                <Button variant="outline">Política de Privacidade</Button>
              </Link>
              <Link to="/cookies">
                <Button variant="outline">Política de Cookies</Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline">Perguntas Frequentes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2026 QuestEduca. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
