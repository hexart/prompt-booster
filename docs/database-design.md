# Prompt Booster - 数据库设计

## 1. 概述

本文档详细描述了Prompt Booster后端系统的数据库设计。数据库采用PostgreSQL作为主要存储系统，使用SQLAlchemy作为ORM工具进行数据交互。设计目标是支持用户认证、用户设置管理、提示词增强模板存储以及提示词历史记录的核心功能。

## 2. 数据库引擎与配置

- **数据库引擎**: PostgreSQL 14+
- **字符集**: UTF-8
- **排序规则**: UTF8_GENERAL_CI
- **ORM**: SQLAlchemy 2.0
- **迁移工具**: Alembic

## 3. 表结构设计

### 3.1 用户表 (users)

存储用户基本信息及认证数据。

| 字段名          | 数据类型     | 约束                    | 描述           |
| --------------- | ------------ | ----------------------- | -------------- |
| id              | UUID         | PRIMARY KEY             | 用户唯一标识符 |
| email           | VARCHAR(255) | UNIQUE, NOT NULL        | 用户邮箱       |
| username        | VARCHAR(100) | UNIQUE, NOT NULL        | 用户名         |
| hashed_password | VARCHAR(255) | NOT NULL                | 哈希后的密码   |
| is_active       | BOOLEAN      | NOT NULL, DEFAULT TRUE  | 账户是否激活   |
| created_at      | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 创建时间       |
| updated_at      | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 更新时间       |

索引：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_users_email (email)
- UNIQUE INDEX idx_users_username (username)

### 3.2 用户设置表 (user_settings)

存储用户个性化设置和偏好。

| 字段名        | 数据类型     | 约束                    | 描述               |
| ------------- | ------------ | ----------------------- | ------------------ |
| id            | UUID         | PRIMARY KEY             | 设置唯一标识符     |
| user_id       | UUID         | FOREIGN KEY, NOT NULL   | 关联用户ID         |
| theme         | VARCHAR(50)  | DEFAULT 'light'         | 界面主题           |
| language      | VARCHAR(10)  | DEFAULT 'en'            | 界面语言           |
| default_model | VARCHAR(100) | NULL                    | 默认AI模型         |
| settings_data | JSONB        | NULL                    | 其他设置(JSON格式) |
| created_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 创建时间           |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 更新时间           |

索引：

- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX idx_user_settings_user_id (user_id)

### 3.3 模板表 (templates)

存储提示词增强模板。

| 字段名      | 数据类型     | 约束                    | 描述           |
| ----------- | ------------ | ----------------------- | -------------- |
| id          | UUID         | PRIMARY KEY             | 模板唯一标识符 |
| user_id     | UUID         | FOREIGN KEY, NOT NULL   | 创建者用户ID   |
| name        | VARCHAR(255) | NOT NULL                | 模板名称       |
| content     | TEXT         | NOT NULL                | 模板内容       |
| description | TEXT         | NULL                    | 模板描述       |
| is_public   | BOOLEAN      | NOT NULL, DEFAULT FALSE | 是否公开       |
| tags        | VARCHAR[]    | DEFAULT '{}'            | 标签数组       |
| created_at  | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 创建时间       |
| updated_at  | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 更新时间       |

索引：

- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX idx_templates_user_id (user_id)
- INDEX idx_templates_is_public (is_public)
- GIN INDEX idx_templates_tags (tags) (用于数组搜索)

### 3.4 提示词组表 (prompt_groups)

存储提示词组的基本信息。

| 字段名                 | 数据类型    | 约束                    | 描述                                           |
| ---------------------- | ----------- | ----------------------- | ---------------------------------------------- |
| id                     | UUID        | PRIMARY KEY             | 提示词组唯一标识符                             |
| user_id                | UUID        | FOREIGN KEY, NOT NULL   | 用户ID                                         |
| original_prompt        | TEXT        | NOT NULL                | 原始提示词                                     |
| current_version_number | INTEGER     | NOT NULL, DEFAULT 1     | 当前版本号                                     |
| status                 | VARCHAR(50) | NOT NULL                | 状态(idle/enhancing/iterating/completed/error) |
| created_at             | TIMESTAMP   | NOT NULL, DEFAULT NOW() | 创建时间                                       |
| updated_at             | TIMESTAMP   | NOT NULL, DEFAULT NOW() | 更新时间                                       |

索引：

- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX idx_prompt_groups_user_id (user_id)
- INDEX idx_prompt_groups_created_at (created_at) (用于时间排序)

### 3.5 提示词版本表 (prompt_versions)

存储提示词的不同版本。

| 字段名              | 数据类型     | 约束                    | 描述                          |
| ------------------- | ------------ | ----------------------- | ----------------------------- |
| id                  | UUID         | PRIMARY KEY             | 版本唯一标识符                |
| group_id            | UUID         | FOREIGN KEY, NOT NULL   | 关联的提示词组ID              |
| number              | INTEGER      | NOT NULL                | 版本号                        |
| original_prompt     | TEXT         | NOT NULL                | 原始提示词                    |
| optimized_prompt    | TEXT         | NOT NULL                | 优化后的提示词                |
| reasoning           | TEXT         | NULL                    | 优化理由                      |
| iteration_direction | TEXT         | NULL                    | 迭代方向(v2+)                 |
| model_id            | VARCHAR(100) | NOT NULL                | 使用的模型ID                  |
| provider            | VARCHAR(100) | NOT NULL                | 提供商名称                    |
| model_name          | VARCHAR(100) | NOT NULL                | 模型名称                      |
| status              | VARCHAR(50)  | NOT NULL                | 状态(pending/completed/error) |
| timestamp           | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 创建时间戳                    |

索引：

- PRIMARY KEY (id)
- FOREIGN KEY (group_id) REFERENCES prompt_groups(id) ON DELETE CASCADE
- UNIQUE INDEX idx_prompt_versions_group_number (group_id, number) (确保版本号在组内唯一)
- INDEX idx_prompt_versions_timestamp (timestamp) (用于时间排序)

### 3.6 刷新令牌表 (refresh_tokens)

存储用户的刷新令牌信息。

| 字段名     | 数据类型     | 约束                    | 描述           |
| ---------- | ------------ | ----------------------- | -------------- |
| id         | UUID         | PRIMARY KEY             | 令牌唯一标识符 |
| user_id    | UUID         | FOREIGN KEY, NOT NULL   | 用户ID         |
| token      | VARCHAR(255) | NOT NULL, UNIQUE        | 刷新令牌值     |
| expires_at | TIMESTAMP    | NOT NULL                | 过期时间       |
| created_at | TIMESTAMP    | NOT NULL, DEFAULT NOW() | 创建时间       |

索引：

- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- UNIQUE INDEX idx_refresh_tokens_token (token)
- INDEX idx_refresh_tokens_user_id (user_id)
- INDEX idx_refresh_tokens_expires_at (expires_at) (用于清理过期令牌)

## 4. 实体关系图 (ERD)

```
┌─────────────┐       ┌───────────────┐       ┌─────────────┐
│   users     │       │ user_settings │       │  templates  │
├─────────────┤       ├───────────────┤       ├─────────────┤
│ id          │       │ id            │       │ id          │
│ email       │       │ user_id       │───────│ user_id     │
│ username    │       │ theme         │       │ name        │
│ hashed_pwd  │       │ language      │       │ content     │
│ is_active   │       │ default_model │       │ description │
│ created_at  │       │ settings_data │       │ is_public   │
│ updated_at  │       │ created_at    │       │ tags        │
└──────┬──────┘       │ updated_at    │       │ created_at  │
       │              └───────────────┘       │ updated_at  │
       │                                      └─────────────┘
       │
       │              ┌─────────────────┐
       │              │  prompt_groups  │
       └──────────────┤ id              │
       │              │ user_id         │
       │              │ original_prompt │
       │              │ current_version │
       │              │ status          │
       │              │ created_at      │
       │              │ updated_at      │
       │              └────────┬────────┘
       │                       │
       │                       │
       │                       │
       │              ┌────────┴────────┐
       │              │ prompt_versions │
       │              ├─────────────────┤
       │              │ id              │
       │              │ group_id        │
       │              │ number          │
       │              │ original_prompt │
       │              │ optimized_prompt│
       │              │ reasoning       │
       │              │ iteration_dir   │
       │              │ model_id        │
       │              │ provider        │
       │              │ model_name      │
       │              │ status          │
       │              │ timestamp       │
       │              └─────────────────┘
       │
       │              ┌─────────────────┐
       └──────────────┤ refresh_tokens  │
                      ├─────────────────┤
                      │ id              │
                      │ user_id         │
                      │ token           │
                      │ expires_at      │
                      │ created_at      │
                      └─────────────────┘
```

## 5. 数据库迁移策略

使用Alembic作为数据库迁移工具，遵循以下原则：

1. **增量迁移**：每次数据库结构变更创建新的迁移脚本
2. **版本控制**：迁移脚本纳入版本控制系统
3. **双向迁移**：每个迁移脚本包含升级(upgrade)和降级(downgrade)操作
4. **测试**：每个迁移脚本在应用前进行测试

### 5.1 初始迁移脚本

初始迁移脚本将创建上述所有表结构，包括索引和约束。示例Alembic脚本结构：

```python
"""Initial database schema

Revision ID: 001_initial_schema
Create Date: 2023-06-15 10:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 创建用户表
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        # 其他字段...
    )
    
    # 创建其他表...
    
def downgrade():
    # 按照依赖关系逆序删除表
    op.drop_table('refresh_tokens')
    op.drop_table('prompt_versions')
    op.drop_table('prompt_groups')
    op.drop_table('templates')
    op.drop_table('user_settings')
    op.drop_table('users')
```

## 6. 数据安全与优化

### 6.1 数据安全措施

1. **密码哈希**：使用bcrypt算法对密码进行哈希存储
2. **敏感数据加密**：API密钥等敏感信息采用加密存储
3. **行级权限**：确保用户只能访问自己的数据

### 6.2 性能优化

1. **合适的索引**：为常用查询创建索引
2. **分页查询**：大数据集查询实现分页
3. **延迟加载**：使用SQLAlchemy的延迟加载减少不必要的数据获取
4. **连接池**：配置适当的数据库连接池大小

### 6.3 数据备份策略

1. **定时备份**：每日全量备份
2. **增量备份**：每小时增量备份
3. **备份验证**：定期验证备份的完整性和可用性

## 7. SQLAlchemy模型定义

根据表结构，以下是对应的SQLAlchemy模型定义示例：

```python
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text, TIMESTAMP, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关系
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="user", cascade="all, delete-orphan")
    prompt_groups = relationship("PromptGroup", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = "user_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    theme = Column(String(50), default="light")
    language = Column(String(10), default="en")
    default_model = Column(String(100))
    settings_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="settings")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    description = Column(Text)
    is_public = Column(Boolean, default=False, nullable=False, index=True)
    tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="templates")

class PromptGroup(Base):
    __tablename__ = "prompt_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_prompt = Column(Text, nullable=False)
    current_version_number = Column(Integer, default=1, nullable=False)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="prompt_groups")
    versions = relationship("PromptVersion", back_populates="group", cascade="all, delete-orphan")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id = Column(UUID(as_uuid=True), ForeignKey("prompt_groups.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    original_prompt = Column(Text, nullable=False)
    optimized_prompt = Column(Text, nullable=False)
    reasoning = Column(Text)
    iteration_direction = Column(Text)
    model_id = Column(String(100), nullable=False)
    provider = Column(String(100), nullable=False)
    model_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # 关系
    group = relationship("PromptGroup", back_populates="versions")
    
    # 唯一约束
    __table_args__ = (
        sa.UniqueConstraint('group_id', 'number', name='uq_prompt_versions_group_number'),
    )

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 关系
    user = relationship("User", back_populates="refresh_tokens")
```

## 8. 数据库连接配置

### 8.1 生产环境配置

```python
# app/core/config.py

from pydantic import BaseSettings, PostgresDsn

class Settings(BaseSettings):
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 8.2 数据库会话管理

```python
# app/db/session.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## 9. 开发与测试环境

### 9.1 开发环境使用Docker Compose

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_USER=postgres
      - POSTGRES_DB=promptbooster_dev
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 9.2 测试环境使用临时数据库

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic.command import upgrade

from app.db.base import Base
from app.core.config import settings

@pytest.fixture(scope="session")
def engine():
    # 为测试创建临时数据库连接
    test_db_url = settings.SQLALCHEMY_DATABASE_URI + "_test"
    engine = create_engine(test_db_url)
    
    # 运行迁移
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)
    upgrade(alembic_cfg, "head")
    
    yield engine
    
    # 测试结束后删除所有表
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(engine):
    # 每个测试函数使用单独的会话
    connection = engine.connect()
    transaction = connection.begin()
    
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestSessionLocal()
    
    yield session
    
    # 测试结束后回滚事务
    session.close()
    transaction.rollback()
    connection.close()
```

## 10. 总结

本数据库设计文档详细描述了Prompt Booster应用后端的数据库结构，包括表设计、关系、索引、安全策略和性能优化考虑。设计专注于满足用户认证、设置管理、提示词模板存储和提示词历史记录的核心需求，并为未来的功能扩展提供灵活性。

实施过程将分阶段进行，从基础结构开始，到完整功能实现，确保稳步推进并保持数据完整性和安全性。