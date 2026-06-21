"""
FastAPI 后端应用
提供 RESTful API，连接 PostgreSQL 数据库
"""

import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, DateTime, Text, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase


# ============================================================
# 配置
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://appuser:change_me@db:5432/fullstack_db"
)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost").split(",")

# ============================================================
# 数据库设置
# ============================================================

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ============================================================
# 数据模型（ORM）
# ============================================================

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# ============================================================
# Pydantic 请求/响应模型
# ============================================================

class ItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="条目标题")
    description: Optional[str] = Field(None, description="条目描述")


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None


class ItemResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: datetime


# ============================================================
# FastAPI 应用
# ============================================================

app = FastAPI(
    title="全栈应用 - 后端 API",
    description="基于 FastAPI + PostgreSQL 的示例后端服务",
    version="1.0.0",
)

# CORS 中间件（允许前端跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 依赖注入
# ============================================================

async def get_db():
    """获取数据库会话"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


# ============================================================
# 启动/关闭事件
# ============================================================

@app.on_event("startup")
async def startup():
    """应用启动时创建数据表（生产环境应使用 Alembic 迁移）"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("数据库表已就绪")


@app.on_event("shutdown")
async def shutdown():
    """应用关闭时释放数据库连接"""
    await engine.dispose()
    print("数据库连接已释放")


# ============================================================
# API 路由
# ============================================================

@app.get("/health", response_model=HealthResponse, tags=["系统"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    健康检查接口
    用于 Docker healthcheck 和负载均衡器探活
    """
    db_status = "connected"
    try:
        await db.execute(select(1))
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="healthy",
        database=db_status,
        timestamp=datetime.utcnow(),
    )


@app.get("/", tags=["系统"])
async def root():
    """根路由，返回 API 基本信息"""
    return {
        "message": "欢迎使用 FastAPI 后端服务",
        "docs": "/docs",
        "health": "/health",
    }


# ----------- 条目 CRUD -----------

@app.post("/api/items", response_model=ItemResponse, status_code=201, tags=["条目管理"])
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    """创建新条目"""
    db_item = Item(title=item.title, description=item.description)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


@app.get("/api/items", response_model=list[ItemResponse], tags=["条目管理"])
async def list_items(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    """获取条目列表（分页）"""
    result = await db.execute(
        select(Item).order_by(Item.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@app.get("/api/items/{item_id}", response_model=ItemResponse, tags=["条目管理"])
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """获取单个条目详情"""
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"条目 {item_id} 不存在")
    return item


@app.patch("/api/items/{item_id}", response_model=ItemResponse, tags=["条目管理"])
async def update_item(item_id: int, item_update: ItemUpdate, db: AsyncSession = Depends(get_db)):
    """更新条目（部分更新）"""
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"条目 {item_id} 不存在")

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)
    return item


@app.delete("/api/items/{item_id}", status_code=204, tags=["条目管理"])
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """删除条目"""
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail=f"条目 {item_id} 不存在")

    await db.delete(item)
    await db.commit()
    return None
