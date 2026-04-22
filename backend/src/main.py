from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
from sqlalchemy import text
from src.lifespan import lifespan


app = FastAPI(titel='DocuWeave', lifespan=lifespan, description='Local AI Document Assistant')