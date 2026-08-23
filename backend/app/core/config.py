from pydantic_settings import BaseSettings



class Settings(BaseSettings):
    DATABASE_URL: str

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    GOOGLE_ALLOWED_DOMAIN: str
    
    GEMINI_API_KEY: str

    AUTH_SESSION_SECRET: str

    OAUTHLIB_INSECURE_TRANSPORT: str = "0"
    OAUTHLIB_RELAX_TOKEN_SCOPE: str = "0"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    class Config:
        env_file = ".env"


settings = Settings()
