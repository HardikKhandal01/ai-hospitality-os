import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv

# Add the 'app' directory to Python path so it can find your models
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Load variables from root .env file
load_dotenv(dotenv_path="../../../.env")

# Import your database Base and Models here
from app.db.database import Base
from app.models.business import Business
from app.models.user import User

config = context.config

# Read URL from environment variable or use the fallback
database_url = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:admin123@localhost:5432/hospitality_db")
config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the metadata for autogenerate
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()