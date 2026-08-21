from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.core.config import settings
from app.api.v1.complaints import router as complaints_router
from app.api.v1.rooms import router as rooms_router
from app.api.v1.hostels import router as hostels_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.attachments import router as attachments_router
from app.api.v1.admin import router as admin_router
from app.api.v1.announcements import router as announcements_router
from app.api.v1.announcement_attachments import (
    router as announcement_attachments_router,
)
app = FastAPI(title="HostelHub API")


app.add_middleware(
    SessionMiddleware,
    secret_key=settings.AUTH_SESSION_SECRET,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(rooms_router)
app.include_router(hostels_router)
app.include_router(notifications_router)
app.include_router(attachments_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(announcements_router)
app.include_router(
    announcement_attachments_router
)

@app.get("/")
def root():
    return {"message": "Welcome to HostelHub API 🚀"}