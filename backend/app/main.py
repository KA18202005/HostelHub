from fastapi import FastAPI

app = FastAPI(title="HostelHub API")

@app.get("/")
def root():
    return {
        "message": "Welcome to HostelHub API 🚀"
    }