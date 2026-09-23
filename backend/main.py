import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import init_db
from routes.jobs import router as jobs_router
from routes.evaluate import router as evaluate_router
from routes.tailor import router as tailor_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="LangGraph & LangChain Powered Gen AI Intern Radar and Resume Tailor API"
)

# Enable CORS for Frontend (Local development & Vercel production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(jobs_router)
app.include_router(evaluate_router)
app.include_router(tailor_router)

@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "langgraph_status": "ready"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
