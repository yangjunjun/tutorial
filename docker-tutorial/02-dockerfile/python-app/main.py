from fastapi import FastAPI
from datetime import datetime

app = FastAPI(
    title="Docker Demo API",
    description="Docker 教程示例 - FastAPI 应用",
    version="1.0.0",
)


@app.get("/")
async def root():
    """根路由 — 返回服务基本信息"""
    return {
        "message": "Hello from Docker!",
        "service": "Python FastAPI Demo",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health")
async def health():
    """健康检查路由 — 返回服务运行状态"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }
