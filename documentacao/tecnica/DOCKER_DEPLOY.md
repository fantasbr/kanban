# Guia de Deploy Docker - DockerHub

Este guia explica como fazer o build e publicar a imagem Docker do projeto no DockerHub.

## Pré-requisitos

1. **Docker Desktop instalado** (Windows)
2. **Conta no DockerHub** - [hub.docker.com](https://hub.docker.com)
3. **Docker CLI configurado**

## Configuração Inicial

### 1. Login no DockerHub

```bash
docker login
```

Digite seu username e password do DockerHub quando solicitado.

### 2. Verificar Variáveis de Ambiente

Antes de fazer o build, certifique-se de que as variáveis de ambiente estão configuradas corretamente:

- Copie `.env.production.example` para `.env.production`
- Configure as variáveis do Supabase e outras integrações

> [!IMPORTANT]
> As variáveis de ambiente devem ser configuradas no servidor de produção, não são incluídas na imagem Docker.

## Build e Push da Imagem

### Opção 1: Script Automatizado (Recomendado)

Execute o script PowerShell:

```powershell
.\docker-build-push.ps1
```

O script irá:

1. Solicitar seu username do DockerHub
2. Fazer o build da imagem
3. Criar tags (latest e com versão)
4. Fazer push para o DockerHub

### Opção 2: Comandos Manuais

#### 1. Build da Imagem

```bash
# Substitua 'seu-usuario' pelo seu username do DockerHub
docker build -t seu-usuario/kanban-crm:latest .
```

#### 2. Criar Tag com Versão

```bash
# Exemplo com versão 1.0.0
docker tag seu-usuario/kanban-crm:latest seu-usuario/kanban-crm:1.0.0
```

#### 3. Push para DockerHub

```bash
# Push da tag latest
docker push seu-usuario/kanban-crm:latest

# Push da tag com versão
docker push seu-usuario/kanban-crm:1.0.0
```

## Testar a Imagem Localmente

Antes de fazer o push, teste a imagem localmente:

```bash
# Rodar o container
docker run -d -p 8080:80 --name kanban-test seu-usuario/kanban-crm:latest

# Acessar no navegador
# http://localhost:8080

# Parar e remover o container de teste
docker stop kanban-test
docker rm kanban-test
```

## Deploy no Servidor

### 1. Preparar o Servidor

No seu servidor, certifique-se de ter:

- Docker e Docker Compose instalados
- Rede Traefik configurada (se usar o docker-compose.yml fornecido)

### 2. Criar docker-compose.yml no Servidor

Copie o arquivo `docker-compose.yml` para o servidor e ajuste:

```yaml
version: "3.8"

services:
  kanban-frontend:
    image: seu-usuario/kanban-crm:latest # Usar imagem do DockerHub
    container_name: kanban-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      # Adicione variáveis de ambiente aqui ou use .env
    networks:
      - traefik-public
    labels:
      # Ajuste o domínio
      - "traefik.http.routers.kanban.rule=Host(`seu-dominio.com`)"
      - "traefik.http.routers.kanban-secure.rule=Host(`seu-dominio.com`)"
      # ... outras labels do Traefik

networks:
  traefik-public:
    external: true
```

### 3. Subir a Stack

```bash
# Pull da imagem mais recente
docker-compose pull

# Subir os containers
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## Atualizações

Para atualizar a aplicação no servidor:

```bash
# No servidor
docker-compose pull
docker-compose up -d
```

## Estrutura da Imagem

A imagem Docker usa multi-stage build:

1. **Stage 1 (Builder)**: Node.js 20 Alpine
   - Instala dependências
   - Faz build da aplicação React/Vite
2. **Stage 2 (Production)**: Nginx Alpine
   - Copia arquivos buildados
   - Serve aplicação estática
   - Configuração otimizada de cache e compressão

## Variáveis de Ambiente

As variáveis de ambiente devem ser configuradas no servidor através de:

1. **Arquivo .env** no mesmo diretório do docker-compose.yml
2. **Variáveis de ambiente** direto no docker-compose.yml
3. **Secrets** do Docker (para dados sensíveis)

Exemplo de `.env` no servidor:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
```

## Troubleshooting

### Erro de autenticação no DockerHub

```bash
docker logout
docker login
```

### Imagem muito grande

Verifique o `.dockerignore` para garantir que node_modules e outros arquivos desnecessários não estão sendo incluídos.

### Erro de build

```bash
# Limpar cache do Docker
docker builder prune

# Build sem cache
docker build --no-cache -t seu-usuario/kanban-crm:latest .
```

### Container não inicia

```bash
# Verificar logs
docker logs kanban-frontend

# Verificar health check
docker inspect kanban-frontend
```

## Boas Práticas

1. **Versionamento**: Sempre crie tags com versão além da tag `latest`
2. **Testes**: Teste a imagem localmente antes do push
3. **Segurança**: Nunca inclua secrets na imagem Docker
4. **Documentação**: Mantenha este guia atualizado
5. **Backup**: Faça backup do banco de dados antes de atualizações

## Links Úteis

- [Docker Hub](https://hub.docker.com)
- [Docker Documentation](https://docs.docker.com)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
