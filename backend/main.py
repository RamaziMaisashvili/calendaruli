import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pymysql

from database import get_connection, DB_HOST, DB_PORT, DB_NAME, DB_USER
from routers.auth import router as auth_router
from routers.files import router as files_router
from routers.teachers import router as teachers_router
from routers.students import router as students_router
from routers.calendar import router as calendar_router

# აპლიკაციის ინიციალიზაცია (მხოლოდ შესვლის წერტილი)
app = FastAPI(
    title="Calendar Learn API",
    description="სასწავლო რესურსების მართვისა და ფაილების დამუშავების API (api.learn.net.ge)",
    version="1.0.0"
)

# CORS პარამეტრები
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# მონაცემთა ბაზის შეცდომების დამმუშავებელი
@app.exception_handler(pymysql.MySQLError)
async def mysql_error_handler(request, exc):
    logging.error(f"MySQL შეცდომა: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "მონაცემთა ბაზასთან დაკავშირება ვერ მოხერხდა",
            "detail": str(exc),
            "db_info": f"Host: {DB_HOST}:{DB_PORT}, DB: {DB_NAME}, User: {DB_USER}"
        }
    )

# როუტერების მიერთება
app.include_router(auth_router)
app.include_router(files_router)
app.include_router(teachers_router)
app.include_router(students_router)
app.include_router(calendar_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Calendar Learn API (api.learn.net.ge)"
    }

@app.get("/api/health")
def health_check():
    checks = {
        "database": "disconnected",
        "docx_installed": False,
        "openpyxl_installed": False
    }
    try:
        conn = get_connection()
        conn.close()
        checks["database"] = "connected"
    except Exception as e:
        checks["database_error"] = str(e)

    try:
        import docx
        checks["docx_installed"] = True
    except ImportError as e:
        checks["docx_error"] = str(e)

    try:
        import openpyxl
        checks["openpyxl_installed"] = True
    except ImportError as e:
        checks["openpyxl_error"] = str(e)

    is_ok = (checks["database"] == "connected" and checks["docx_installed"])
    return {
        "status": "ok" if is_ok else "warning",
        "checks": checks
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
