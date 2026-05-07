from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import expenses, import_lab, bank_connections, plaid_connections

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React app's address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Include routers
app.include_router(expenses.router)
app.include_router(import_lab.router)
app.include_router(bank_connections.router)
app.include_router(plaid_connections.router)

@app.get("/")
async def root():
    return {"message": "Budget Visualizer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 