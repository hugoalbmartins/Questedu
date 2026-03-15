# Como Ligar ao GitHub

Este guia explica como conectar o projeto QuestEduca ao GitHub.

## Passo 1: Criar Repositório no GitHub

1. Aceda a [github.com](https://github.com)
2. Faça login na sua conta
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Configure o repositório:
   - **Nome**: `questeduca` (ou outro nome à sua escolha)
   - **Descrição**: "Plataforma educativa gamificada para alunos do 1º ao 4º ano"
   - **Visibilidade**: Escolha entre **Public** ou **Private**
   - **NÃO** marque "Initialize this repository with a README" (já temos um)
6. Clique em **"Create repository"**

## Passo 2: Conectar o Repositório Local

Após criar o repositório no GitHub, você verá uma página com instruções. Use os comandos abaixo:

### Se o repositório está vazio (recomendado):

```bash
# Adicionar o remote do GitHub (substitua YOUR_USERNAME e YOUR_REPO pelo seu)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Verificar se o remote foi adicionado corretamente
git remote -v

# Fazer push do código para o GitHub
git push -u origin main
```

### Exemplo prático:

Se o seu username for `joaosilva` e o repositório `questeduca`:

```bash
git remote add origin https://github.com/joaosilva/questeduca.git
git push -u origin main
```

## Passo 3: Autenticação

Quando fizer o primeiro push, o GitHub pedirá autenticação:

### Opção 1: Personal Access Token (Recomendado)

1. Vá a GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Dê um nome descritivo: "QuestEduca Deploy"
4. Selecione os seguintes scopes:
   - ✅ `repo` (acesso completo a repositórios)
   - ✅ `workflow` (se usar GitHub Actions)
5. Clique em "Generate token"
6. **IMPORTANTE**: Copie o token imediatamente (não poderá vê-lo novamente!)
7. Use o token como password quando o Git pedir credenciais

### Opção 2: SSH (Mais seguro)

```bash
# Gerar chave SSH (se não tiver uma)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Adicionar a chave ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar a chave pública
cat ~/.ssh/id_ed25519.pub
```

Depois:
1. Vá a GitHub Settings → SSH and GPG keys
2. Clique em "New SSH key"
3. Cole a chave pública
4. Use URL SSH: `git remote set-url origin git@github.com:YOUR_USERNAME/YOUR_REPO.git`

## Passo 4: Verificar a Conexão

```bash
# Ver o status do repositório
git status

# Ver os remotes configurados
git remote -v

# Ver o histórico de commits
git log --oneline

# Ver informações do último push
git branch -vv
```

## Comandos Úteis Após Conexão

```bash
# Verificar alterações
git status

# Adicionar alterações
git add .

# Fazer commit
git commit -m "descrição das alterações"

# Enviar para GitHub
git push

# Baixar alterações do GitHub
git pull

# Ver diferenças
git diff

# Ver histórico
git log --oneline --graph --all
```

## Troubleshooting

### Erro: "remote origin already exists"

```bash
# Remover o remote existente
git remote remove origin

# Adicionar novamente com o URL correto
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

### Erro: "failed to push some refs"

```bash
# Fazer pull primeiro (se o repositório remoto tiver commits)
git pull origin main --allow-unrelated-histories

# Depois fazer push
git push -u origin main
```

### Erro de autenticação

```bash
# Usar HTTPS com token
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git

# OU configurar credenciais
git config --global credential.helper store
```

## Estado Atual do Repositório

O repositório local está configurado com:
- ✅ Branch principal: `main`
- ✅ 2 commits iniciais
- ✅ 291 ficheiros rastreados
- ✅ .gitignore configurado (exclui node_modules, .env, dist, etc)
- ✅ README completo
- ✅ Histórico limpo

## Próximos Passos

Após conectar ao GitHub:

1. **Configurar GitHub Actions** (opcional):
   - Deploy automático
   - Testes automáticos
   - Linting

2. **Proteger a branch main**:
   - Settings → Branches → Add rule
   - Require pull request reviews
   - Require status checks

3. **Configurar Secrets**:
   - Settings → Secrets and variables → Actions
   - Adicionar `SUPABASE_URL` e `SUPABASE_ANON_KEY`
   - Adicionar `STRIPE_SECRET_KEY` (se aplicável)

4. **Adicionar badges ao README** (opcional):
   - Build status
   - Code coverage
   - License

## Recursos

- [Documentação Git](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Nota**: Nunca faça commit do ficheiro `.env` com credenciais reais! O `.gitignore` está configurado para excluí-lo automaticamente.
