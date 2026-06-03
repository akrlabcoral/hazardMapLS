from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import simulate
from app.api import export

app = FastAPI(title="HazardMap Scientific Earthquake Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(simulate.router, prefix="/api")
app.include_router(export.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
