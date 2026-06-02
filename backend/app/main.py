from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes.chart import router as chart_router
from app.routes.match import router as match_router
from app.routes.history import router as history_router
from app.database import get_db

load_dotenv()

app = FastAPI(
    title="Astrology API",
    description="Birth chart & 12-house calculator using Swiss Ephemeris",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kundli.astrogyan.org",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3014",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chart_router, prefix="/api")
app.include_router(match_router, prefix="/api/match")
app.include_router(history_router, prefix="/api/history")


@app.on_event("startup")
def startup_db_check():
    """Log MongoDB connectivity at startup for easier debugging."""
    db = get_db()
    if db is None:
        print("[MongoDB] Not connected. Check MONGODB_URI in backend/.env")
    else:
        print(f"[MongoDB] Startup OK. Using database: {db.name}")


@app.get("/")
def root():
    return {"status": "ok", "message": "Astrology API is running"}
