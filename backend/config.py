import os
from dotenv import load_dotenv

# Load .env file from root or backend directory
load_dotenv()
load_dotenv(dotenv_path="../.env")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Settings:
    PROJECT_NAME: str = "Gen AI Intern Radar & Resume Tailor API"
    VERSION: str = "1.0.0"
    
    # API Keys
    GROQ_API_KEY: str = os.getenv("VITE_GROQ_API_KEY") or os.getenv("GROQ_API_KEY") or ""
    GEMINI_API_KEY: str = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or ""
    FIRECRAWL_API_KEY: str = os.getenv("VITE_FIRECRAWL_API_KEY") or os.getenv("FIRECRAWL_API_KEY") or ""
    
    # Database (always points to backend/jobs_radar.db)
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", os.path.join(BASE_DIR, "jobs_radar.db"))

settings = Settings()

