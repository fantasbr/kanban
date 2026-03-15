# Branca SGI - Sistema de Gestão Integrada

Sistema completo de gestão integrada com funcionalidades de CRM e ERP.

## 🚀 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **UI**: Tailwind CSS + Shadcn UI
- **Estado**: React Query
- **Autenticação**: Supabase Auth

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev

# Verificar erros de lint (agora com suporte a globais)
npm run lint

# Build de produção (TypeScript + Vite)
npm run build
```

## 🔧 Configuração

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente no arquivo `.env`:
   - `VITE_SUPABASE_URL`: URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase

3. Execute as migrations do banco de dados (pasta `supabase_migrations/`)

## 📚 Documentação

Consulte a pasta `documentacao/` para guias detalhados:

- [QUICKSTART.md](documentacao/QUICKSTART.md) - Início rápido
- [SETUP_CONFIGURACOES.md](documentacao/SETUP_CONFIGURACOES.md) - Configuração inicial
- [API_DOCUMENTATION.md](documentacao/API_DOCUMENTATION.md) - Documentação da API

## 🐳 Deploy com Docker

### Build e Push para DockerHub

```powershell
# Script automatizado (Windows)
.\docker-build-push.ps1
```

Ou manualmente:

```bash
# Build da imagem
docker build -t seu-usuario/kanban-crm:latest .

# Push para DockerHub
docker push seu-usuario/kanban-crm:latest
```

### Deploy no Servidor

```bash
# Pull da imagem
docker-compose pull

# Subir a stack
docker-compose up -d
```

📖 **Documentação completa**: [DOCKER_DEPLOY.md](documentacao/tecnica/DOCKER_DEPLOY.md)

## 📄 Licença

Propriedade privada - Todos os direitos reservados
