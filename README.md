# Projeto DAI — Sistema de Bilhética TUB

Plataforma de gestão e monitorização de transportes urbanos de Braga.

## Como Arrancar

### 1. Copiar o ficheiro de configuração
```bash
cp backend/.env.example backend/.env
```

### 2. Arrancar com Docker
```bash
docker-compose up --build
```

### 3. Criar dados de demonstração (só na primeira vez)

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/v1/seed/" -Method POST
```

**Mac/Linux:**
```bash
curl -X POST http://localhost:8000/api/v1/seed/
```

Ou abre o browser em: http://localhost:8000/docs → `/api/v1/seed/` → Execute

### 4. Abrir no browser
👉 http://localhost:5173

## Credenciais de Acesso

| Papel | Email | Password |
|-------|-------|----------|
| Administrador | admin@tub.pt | admin123 |
| Utilizador | user@tub.pt | user123 |

## Funcionalidades

| Página | Descrição |
|--------|-----------|
| Dashboard | KPIs, gráficos de ocupação e bilhetes, alertas dinâmicos |
| Bilhetes | Comprar, consultar e validar bilhetes |
| Transportes | Ver veículos, filtrar, adicionar (admin) |
| Mapa | Localização em tempo real dos autocarros |
| Perfil | Editar nome e password |
| Utilizadores | Gerir contas e permissões (só admin) |

## Parar o projeto
```bash
docker-compose down
```
