from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.auth import router as auth_router
from app.core.config import settings
from app.api.v1.complaints import router as complaints_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.hostels import router as hostels_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboard import router as dashboard_router

app = FastAPI(title="HostelHub API")


app.add_middleware(
    SessionMiddleware,
    secret_key=settings.AUTH_SESSION_SECRET,
)


app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(rooms_router)
app.include_router(hostels_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)

@app.get("/")
def root():
    return {"message": "Welcome to HostelHub API 🚀"}