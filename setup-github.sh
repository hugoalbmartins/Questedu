#!/bin/bash

# Script para configurar conexão com GitHub
# Uso: ./setup-github.sh YOUR_USERNAME YOUR_REPO

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  QuestEduca - GitHub Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Verificar argumentos
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Uso: ./setup-github.sh YOUR_USERNAME YOUR_REPO${NC}"
    echo -e "${YELLOW}Exemplo: ./setup-github.sh joaosilva questeduca${NC}\n"
    read -p "Digite seu username do GitHub: " USERNAME
    read -p "Digite o nome do repositório: " REPO
else
    USERNAME=$1
    REPO=${2:-questeduca}
fi

echo -e "\n${BLUE}Configurando conexão com GitHub...${NC}"
echo -e "Username: ${GREEN}${USERNAME}${NC}"
echo -e "Repositório: ${GREEN}${REPO}${NC}\n"

# Verificar se já existe remote
if git remote | grep -q "origin"; then
    echo -e "${YELLOW}⚠ Remote 'origin' já existe. Removendo...${NC}"
    git remote remove origin
fi

# Adicionar remote
REPO_URL="https://github.com/${USERNAME}/${REPO}.git"
echo -e "${BLUE}Adicionando remote: ${REPO_URL}${NC}"
git remote add origin $REPO_URL

# Verificar remote
echo -e "\n${GREEN}✓ Remote configurado com sucesso!${NC}"
git remote -v

# Perguntar se deseja fazer push
echo -e "\n${YELLOW}Deseja fazer push para o GitHub agora? (s/n)${NC}"
read -p "> " PUSH_NOW

if [ "$PUSH_NOW" = "s" ] || [ "$PUSH_NOW" = "S" ]; then
    echo -e "\n${BLUE}Fazendo push para GitHub...${NC}"
    echo -e "${YELLOW}Nota: Você precisará autenticar com seu token ou senha${NC}\n"

    if git push -u origin main; then
        echo -e "\n${GREEN}✓ Push realizado com sucesso!${NC}"
        echo -e "${GREEN}✓ Repositório disponível em: https://github.com/${USERNAME}/${REPO}${NC}"
    else
        echo -e "\n${RED}✗ Erro ao fazer push${NC}"
        echo -e "${YELLOW}Dicas:${NC}"
        echo -e "  1. Certifique-se que o repositório existe no GitHub"
        echo -e "  2. Verifique suas credenciais"
        echo -e "  3. Use um Personal Access Token como senha"
        echo -e "  4. Consulte GITHUB_SETUP.md para mais detalhes"
        exit 1
    fi
else
    echo -e "\n${YELLOW}Push não realizado. Para fazer push manualmente:${NC}"
    echo -e "  ${BLUE}git push -u origin main${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Configuração concluída!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "Comandos úteis:"
echo -e "  ${BLUE}git status${NC}        - Ver status do repositório"
echo -e "  ${BLUE}git add .${NC}         - Adicionar alterações"
echo -e "  ${BLUE}git commit -m \"...\"${NC} - Criar commit"
echo -e "  ${BLUE}git push${NC}          - Enviar para GitHub"
echo -e "  ${BLUE}git pull${NC}          - Baixar do GitHub"
echo -e "\nConsulte ${BLUE}GITHUB_SETUP.md${NC} para mais informações.\n"
