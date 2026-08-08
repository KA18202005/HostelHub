from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.auth import router as auth_router
from app.core.config import settings


app = FastAPI(title="HostelHub API")


app.add_middleware(
    SessionMiddleware,
    secret_key=settings.AUTH_SESSION_SECRET,
)


app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "Welcome to HostelHub API 🚀"}