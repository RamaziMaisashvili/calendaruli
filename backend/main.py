import logging
import pymysql
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from auth import login_user, validate_session
from program_import import router as import_router

api = FastAPI(docs_url=None,redoc_url=None,openapi_url=None)

class LoginBody(BaseModel):
    username: str = Field(min_length=1,max_length=190)
    password: str = Field(min_length=1,max_length=1024)

@api.exception_handler(pymysql.MySQLError)
async def database_error(request, exc):
    logging.error("Database failure: %s", type(exc).__name__)
    return JSONResponse(status_code=503,content={"message":"მომსახურება დროებით მიუწვდომელია"})

@api.exception_handler(Exception)
async def unexpected_error(request, exc):
    logging.error("Application failure: %s", type(exc).__name__)
    return JSONResponse(status_code=500,content={"message":"მომსახურება დროებით მიუწვდომელია"})

@api.exception_handler(HTTPException)
async def http_error(request, exc):
    if request.url.path.startswith('/api/program-import/'):
        return JSONResponse(status_code=exc.status_code,content={"authenticated":True,"ok":False,"message":str(exc.detail)})
    return JSONResponse(status_code=exc.status_code,content={"message":"მოთხოვნა ვერ შესრულდა"})

@api.exception_handler(RequestValidationError)
async def invalid_input(request, exc):
    if request.url.path.startswith('/api/program-import/'):
        return JSONResponse(status_code=422,content={"authenticated":True,"ok":False,"message":"შეამოწმეთ შევსებული ველები: სახელები, საათები, თარიღი და კვირების მონაცემები."})
    return JSONResponse(status_code=200,content={"authenticated":False,"message":"ვერ გაიარა ავტორიზაცია"})

@api.middleware("http")
async def protect_routes(request: Request, call_next):
    # All future business routes are protected by default.
    public = {"/", "/api/auth/login"}
    auth_routes = {"/api/auth/me", "/api/auth/activity", "/api/auth/refresh", "/api/auth/logout"}
    if request.method != "OPTIONS" and request.url.path not in public | auth_routes:
        user_id, result = await run_in_threadpool(validate_session,request,activity=True,rotate=False)
        if not user_id:
            return JSONResponse(result,status_code=200)
        request.state.user_id = user_id
        return await call_next(request)
    return await call_next(request)

@api.get("/")
def root():
    return Response(content="",media_type="text/html")

@api.post("/api/auth/login")
def login(body: LoginBody):
    return login_user(body.username.strip(),body.password)

@api.api_route("/api/auth/me",methods=["GET","POST"])
def me(request: Request):
    _, result = validate_session(request, activity=False)
    return result

@api.post("/api/auth/activity")
def activity(request: Request):
    _, result = validate_session(request, activity=True)
    return result

@api.post("/api/auth/refresh")
def refresh(request: Request):
    _, result = validate_session(request, activity=False)
    return result

@api.post("/api/auth/logout")
def logout(request: Request):
    _, result = validate_session(request, revoke=True)
    return result

api.include_router(import_router)

# No cookies or domain allow-list. Every protected route must validate its token.
app = CORSMiddleware(api,allow_origins=["*"],allow_credentials=False,
    allow_methods=["GET","POST","PUT","DELETE","OPTIONS"],allow_headers=["Authorization","X-Username","Content-Type"])
