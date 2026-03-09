# 🚌 Sistema de Bilhética e Contagem de Transportes Urbanos

Sistema completo para gestão de bilhetes e monitorização de transportes urbanos.

## 🛠️ Stack Tecnológica

| Camada     | Tecnologia              |
|------------|-------------------------|
| Backend    | FastAPI (Python)         |
| Base de Dados | PostgreSQL            |
| Frontend   | React + Vite            |
| Containers | Docker + Docker Compose |

## 🚀 Iniciar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados

### Passos

```bash
# 1. Clonar o repositório
git clone https://github.com/Mourexx/Projeto_DAI.git
cd Projeto_DAI

# 2. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Edita o ficheiro .env com as tuas configurações

# 3. Arrancar todos os serviços
docker compose up --build
```

### URLs
- **Frontend:** http://localhost:5173
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Redoc:** http://localhost:8000/redoc

## 📁 Estrutura do Projeto

```
Projeto_DAI/
├── backend/          # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/      # Rotas da API
│   │   ├── core/     # Configurações e segurança
│   │   ├── db/       # Modelos e schemas
│   │   └── services/ # Lógica de negócio
│   └── tests/
└── frontend/         # React + Vite
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/ # Chamadas à API
```

## 👥 Equipa

Projeto desenvolvido no âmbito da disciplina DAI - Universidade do Minho
