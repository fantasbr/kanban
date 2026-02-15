# Script para build e push da imagem Docker para o DockerHub
# Uso: .\docker-build-push.ps1

Write-Host "=== Docker Build and Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar username do DockerHub
$dockerUsername = Read-Host "Digite seu username do DockerHub"

if ([string]::IsNullOrWhiteSpace($dockerUsername)) {
    Write-Host "Erro: Username não pode ser vazio!" -ForegroundColor Red
    exit 1
}

# Nome da imagem
$imageName = "$dockerUsername/kanban-crm"

# Solicitar versão (opcional)
$version = Read-Host "Digite a versão (ex: 1.0.0) ou pressione Enter para usar apenas 'latest'"

Write-Host ""
Write-Host "Configuração:" -ForegroundColor Yellow
Write-Host "  Imagem: $imageName" -ForegroundColor White
Write-Host "  Tags: latest" -ForegroundColor White
if (![string]::IsNullOrWhiteSpace($version)) {
    Write-Host "        $version" -ForegroundColor White
}
Write-Host ""

# Confirmar
$confirm = Read-Host "Deseja continuar? (s/n)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Iniciando Build ===" -ForegroundColor Cyan

# Build da imagem
Write-Host "Building image: ${imageName}:latest" -ForegroundColor Green
docker build -t "${imageName}:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build da imagem!" -ForegroundColor Red
    exit 1
}

Write-Host "Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# Criar tag com versão se fornecida
if (![string]::IsNullOrWhiteSpace($version)) {
    Write-Host "Criando tag: ${imageName}:${version}" -ForegroundColor Green
    docker tag "${imageName}:latest" "${imageName}:${version}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao criar tag!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Iniciando Push para DockerHub ===" -ForegroundColor Cyan

# Push da tag latest
Write-Host "Pushing ${imageName}:latest" -ForegroundColor Green
docker push "${imageName}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao fazer push da tag latest!" -ForegroundColor Red
    exit 1
}

# Push da tag com versão se fornecida
if (![string]::IsNullOrWhiteSpace($version)) {
    Write-Host "Pushing ${imageName}:${version}" -ForegroundColor Green
    docker push "${imageName}:${version}"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao fazer push da tag ${version}!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Concluído com Sucesso! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Imagem publicada no DockerHub:" -ForegroundColor Cyan
Write-Host "  ${imageName}:latest" -ForegroundColor White
if (![string]::IsNullOrWhiteSpace($version)) {
    Write-Host "  ${imageName}:${version}" -ForegroundColor White
}
Write-Host ""
Write-Host "Para usar no servidor:" -ForegroundColor Yellow
Write-Host "  docker pull ${imageName}:latest" -ForegroundColor White
Write-Host "  docker-compose up -d" -ForegroundColor White
Write-Host ""
