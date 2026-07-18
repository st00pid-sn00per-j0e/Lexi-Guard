import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings
from app.routes import auth
from app.routes.contracts import router as contracts_router
from app.routes.company import router as company_router
from app.routes.users import router as users_router



from app.middleware.rate_limit import AuthRateLimitMiddleware
from app.services.contracts_store import ensure_contract_indexes
from app.services.otp import create_ttl_index


logger = logging.getLogger("lexiguard")

app = FastAPI(title="LexiGuard API", version="1.0.0")

# CORS – add production origin via env if needed
origins = [
    "http://localhost:9002",
    "http://localhost:3000",
]
if getattr(settings, "CORS_ORIGINS", None):
    origins.extend(settings.CORS_ORIGINS.split(","))
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthRateLimitMiddleware)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return clean, user-friendly 422 validation errors."""
    errors = exc.errors()
    if errors:
        msg = errors[0].get("msg", "Invalid input data")
        if isinstance(msg, str) and "valid email" in msg.lower():
            msg = "Please enter a valid email address."
        return JSONResponse(status_code=422, content={"detail": msg})

    return JSONResponse(status_code=422, content={"detail": "Invalid request data."})



@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
async def startup_db_client():
    try:
        settings.validate_secret_key()
    except ValueError as e:
        logger.warning("Config: %s", e)
    app.mongodb_client = AsyncIOMotorClient(settings.MONGO_URI)
    app.db = app.mongodb_client[settings.MONGO_DB_NAME]
    await ensure_contract_indexes(app.db)
    await create_ttl_index(app.db)



@app.on_event("shutdown")
async def shutdown_db_client():
    app.mongodb_client.close()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(contracts_router, prefix="/api/contracts", tags=["contracts"])
app.include_router(company_router, prefix="/api/company", tags=["company"])
app.include_router(users_router, prefix="/api/users", tags=["users"])




@app.get("/")
async def root():
    return {"message": "Welcome to LexiGuard API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

