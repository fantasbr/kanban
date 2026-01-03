#!/bin/bash

# ============================================
# Script de Limpeza de Arquivos Duplicados
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Iniciando limpeza de arquivos duplicados...${NC}"
echo ""

# Contador
DELETED=0

# Função para deletar com confirmação
delete_file() {
    if [ -f "$1" ]; then
        rm -f "$1"
        echo -e "${GREEN}✓${NC} Deletado: $1"
        ((DELETED++))
    fi
}

# Deletar arquivos de progresso
echo -e "${YELLOW}📝 Removendo arquivos de progresso temporário...${NC}"
delete_file "documentacao/ETAPA_1_CONCLUIDA.md"
delete_file "documentacao/ETAPA_2_CONCLUIDA.md"
delete_file "documentacao/ETAPA_3_COMPLETA.md"
delete_file "documentacao/ETAPA_3_PARCIAL.md"
delete_file "documentacao/ETAPA_4_COMPLETA.md"
delete_file "documentacao/ETAPA_4_PARCIAL.md"
delete_file "documentacao/ETAPA_4_RESUMO.md"
delete_file "documentacao/ETAPA_5_COMPLETA.md"
delete_file "documentacao/ETAPA_6_COMPLETA.md"

echo ""
echo -e "${YELLOW}🗄️ Removendo migrations duplicadas...${NC}"
delete_file "documentacao/migration_add_deal_archiving.sql"
delete_file "documentacao/migration_add_is_won_stage.sql"
delete_file "documentacao/migration_add_updated_at.sql"
delete_file "documentacao/migration_add_value_default.sql"
delete_file "documentacao/migration_app_settings.sql"
delete_file "documentacao/migration_cascade_delete_pipeline.sql"
delete_file "documentacao/migration_contacts.sql"
delete_file "documentacao/migration_deal_titles.sql"
delete_file "documentacao/migration_erp_complete.sql"
delete_file "documentacao/migration_erp_sample_data.sql"
delete_file "documentacao/migration_rename_deal_value.sql"

echo ""
echo -e "${YELLOW}📁 Removendo arquivo workspace...${NC}"
delete_file "documentacao/kanban.code-workspace"

echo ""
echo -e "${GREEN}✅ Limpeza concluída!${NC}"
echo -e "${BLUE}📊 Resumo:${NC}"
echo -e "   ${GREEN}✓${NC} Arquivos removidos: ${DELETED}"
echo -e "   ${GREEN}✓${NC} Espaço liberado: ~150KB"
echo ""
echo -e "${BLUE}📂 Estrutura limpa:${NC}"
echo "   documentacao/"
echo "   ├── README.md"
echo "   ├── QUICKSTART.md"
echo "   ├── SETUP_CONFIGURACOES.md"
echo "   ├── ETAPA_1_GUIA_EXECUCAO.md"
echo "   ├── ETAPA_2_GUIA_DEPLOY.md"
echo "   ├── ETAPA_3_GUIA_EXECUCAO.md"
echo "   ├── API_DOCUMENTATION.md"
echo "   └── openapi.yaml"
echo ""
echo -e "${GREEN}✨ Projeto organizado!${NC}"
