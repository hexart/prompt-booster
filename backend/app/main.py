# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Prompt Booster API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,  # 中间件类名保持不变
    allow_origins=["http://localhost:5173"],  # 生产环境中应指定具体来源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Prompt Booster API"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}