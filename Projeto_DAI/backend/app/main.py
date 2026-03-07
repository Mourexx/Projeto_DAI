from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import tickets, transports, stats, users
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Bilhética - API",
    description="API para gestão de bilhetes e transportes urbanos",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1/users", tags=["Utilizadores"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["Bilhetes"])
app.include_router(transports.router, prefix="/api/v1/transports", tags=["Transportes"])
app.include_router(stats.router, prefix="/api/v1/stats", tags=["Estatísticas"])

@app.get("/")
def root():
    return {"message": "API do Sistema de Bilhética a funcionar!"}
