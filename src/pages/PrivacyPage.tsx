import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import logo from "@/assets/logo.png";

const PrivacyPage = () => {
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
            <Shield className="w-8 h-8" />
            Política de Privacidade
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Última atualização: 15 de Março de 2026
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm">
                <strong>Compromisso de Privacidade:</strong> A QuestEduca está comprometida em proteger a privacidade das crianças e das suas famílias. Esta política explica como recolhemos, utilizamos e protegemos os dados pessoais em conformidade com o RGPD (Regulamento Geral de Proteção de Dados) e legislação portuguesa aplicável.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="font-display text-xl font-bold mb-3">1. Entidade Responsável</h2>
              <div className="text-muted-foreground">
                <p><strong>Responsável pelo Tratamento de Dados:</strong></p>
                <p className="mt-2">QuestEduca, Lda.</p>
                <p>Email: privacidade@questeduca.pt</p>
                <p>DPO (Data Protection Officer): dpo@questeduca.pt</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">2. Dados que Recolhemos</h2>

              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.1 Dados de Alunos (Crianças)</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Nome completo</li>
                    <li>Data de nascimento</li>
                    <li>Ano escolar</li>
                    <li>Email do encarregado de educação</li>
                    <li>Escola e turma (opcional)</li>
                    <li>Nickname/nome de utilizador (escolhido pela criança)</li>
                    <li>Dados de progresso académico (respostas a quizzes, XP, níveis)</li>
                    <li>Mensagens de chat (moderadas)</li>
                    <li>Lista de amigos</li>
                    <li>Preferências de acessibilidade</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.2 Dados de Pais/Encarregados</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Nome completo</li>
                    <li>Email (para login e comunicações)</li>
                    <li>Palavra-passe (encriptada)</li>
                    <li>Informações de pagamento (processadas pela Stripe)</li>
                    <li>Preferências de notificação</li>
                    <li>Controlos parentais definidos</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2.3 Dados Técnicos</h3>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Endereço IP</li>
                    <li>Tipo de browser e dispositivo</li>
                    <li>Timestamps de acesso</li>
                    <li>Cookies (ver Política de Cookies)</li>
                    <li>Logs de sistema</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">3. Como Utilizamos os Dados</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Utilizamos os dados recolhidos para:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Fornecer e melhorar os serviços educativos</li>
                  <li>Personalizar a experiência de aprendizagem</li>
                  <li>Adaptar a dificuldade dos quizzes ao nível do aluno</li>
                  <li>Gerar relatórios de progresso para pais</li>
                  <li>Processar pagamentos de subscrições</li>
                  <li>Enviar notificações e relatórios por email</li>
                  <li>Moderar conteúdo e garantir segurança</li>
                  <li>Prevenir fraude e abuso</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Realizar análises agregadas e anónimas</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">4. Base Legal para Tratamento</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Tratamos dados pessoais com base em:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Consentimento:</strong> Consentimento parental explícito para menores de 13 anos</li>
                  <li><strong>Execução de Contrato:</strong> Fornecer os serviços contratados</li>
                  <li><strong>Interesse Legítimo:</strong> Melhorar a plataforma e prevenir fraude</li>
                  <li><strong>Obrigação Legal:</strong> Cumprir leis e regulamentos aplicáveis</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">5. Partilha de Dados</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>NÃO vendemos dados pessoais a terceiros.</strong></p>
                <p className="mt-2">Partilhamos dados apenas com:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Supabase:</strong> Hospedagem de base de dados (servidores na UE)</li>
                  <li><strong>Stripe:</strong> Processamento de pagamentos (PCI-DSS compliant)</li>
                  <li><strong>Resend:</strong> Envio de emails transacionais</li>
                  <li><strong>Vercel:</strong> Hospedagem da aplicação</li>
                  <li><strong>Autoridades:</strong> Quando legalmente obrigados</li>
                </ul>
                <p className="mt-2">Todos os fornecedores são RGPD-compliant e têm acordos de proteção de dados.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">6. Segurança dos Dados</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Implementamos medidas técnicas e organizacionais robustas:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Encriptação:</strong> HTTPS/TLS para transmissão, encriptação em repouso</li>
                  <li><strong>Autenticação:</strong> Passwords hasheadas com bcrypt</li>
                  <li><strong>Row Level Security:</strong> Isolamento de dados ao nível da base de dados</li>
                  <li><strong>Backups:</strong> Backups regulares e seguros</li>
                  <li><strong>Monitorização:</strong> Deteção de atividades suspeitas</li>
                  <li><strong>Acesso Restrito:</strong> Apenas pessoal autorizado acede a dados sensíveis</li>
                  <li><strong>Auditorias:</strong> Revisões de segurança regulares</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">7. Retenção de Dados</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Retemos dados pessoais apenas pelo tempo necessário:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Contas Ativas:</strong> Enquanto a conta estiver ativa</li>
                  <li><strong>Contas Inativas:</strong> 3 anos após última atividade</li>
                  <li><strong>Dados de Pagamento:</strong> Conforme exigido por lei (geralmente 10 anos)</li>
                  <li><strong>Logs de Sistema:</strong> 90 dias</li>
                  <li><strong>Chat Moderado:</strong> 1 ano para revisão de segurança</li>
                </ul>
                <p className="mt-2">Após estes períodos, os dados são anonimizados ou eliminados de forma segura.</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">8. Direitos dos Titulares de Dados (RGPD)</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Você tem direito a:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Acesso:</strong> Solicitar cópia dos seus dados</li>
                  <li><strong>Retificação:</strong> Corrigir dados incorretos ou incompletos</li>
                  <li><strong>Eliminação:</strong> Direito ao esquecimento (com exceções legais)</li>
                  <li><strong>Portabilidade:</strong> Receber dados em formato estruturado</li>
                  <li><strong>Oposição:</strong> Opor-se a certos tratamentos</li>
                  <li><strong>Limitação:</strong> Restringir processamento em certas situações</li>
                  <li><strong>Retirar Consentimento:</strong> A qualquer momento</li>
                  <li><strong>Reclamar:</strong> Junto da CNPD (Comissão Nacional de Proteção de Dados)</li>
                </ul>
                <p className="mt-2">Para exercer estes direitos, contacte: privacidade@questeduca.pt</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">9. Proteção de Menores</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Compromisso Especial com Crianças:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Requeremos consentimento parental explícito para menores de 13 anos</li>
                  <li>Não recolhemos dados desnecessários de crianças</li>
                  <li>Chat moderado automaticamente e manualmente</li>
                  <li>Pais têm acesso total aos dados dos filhos</li>
                  <li>Pais podem eliminar contas de filhos a qualquer momento</li>
                  <li>Não partilhamos dados de crianças para marketing</li>
                  <li>Rankings usam nicknames, não nomes reais</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">10. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies essenciais para o funcionamento da plataforma. Para mais informações, consulte a nossa <Link to="/cookies" className="text-primary underline">Política de Cookies</Link>.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">11. Transferências Internacionais</h2>
              <div className="space-y-2 text-muted-foreground">
                <p>Os seus dados são armazenados e processados na União Europeia. Quando utilizamos fornecedores fora da UE (como Stripe nos EUA), garantimos:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Cláusulas contratuais padrão aprovadas pela UE</li>
                  <li>Certificação Privacy Shield (quando aplicável)</li>
                  <li>Medidas de segurança adequadas</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">12. Alterações a Esta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta Política de Privacidade ocasionalmente. Notificaremos alterações significativas por email e através da plataforma. A data de "Última atualização" no topo reflete a versão mais recente.
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl font-bold mb-3">13. Contacto</h2>
              <div className="text-muted-foreground">
                <p>Para questões sobre privacidade e proteção de dados:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li><strong>Email Privacidade:</strong> privacidade@questeduca.pt</li>
                  <li><strong>DPO:</strong> dpo@questeduca.pt</li>
                  <li><strong>Email Geral:</strong> suporte@questeduca.pt</li>
                  <li><strong>CNPD:</strong> <a href="https://www.cnpd.pt" target={\"_blank"} rel="noopener noreferrer\" className="text-primary underline">www.cnpd.pt</a></li>
                </ul>
              </div>
            </section>

            <section className="border-t pt-6">
              <p className="text-sm text-muted-foreground italic">
                A QuestEduca está comprometida com a proteção da privacidade das crianças e o cumprimento do RGPD. A confiança das famílias é a nossa prioridade.
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
          <p className="mt-1">RGPD Compliant • CNPD Registered</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
