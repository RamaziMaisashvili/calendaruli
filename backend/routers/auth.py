from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

try:
    from auth import authenticate_user, get_current_user, logout_user, security
except Exception:
    import sys
    import os
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    from auth import authenticate_user, get_current_user, logout_user, security

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    result = authenticate_user(req.username.strip(), req.password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="მომხმარებლის სახელი ან პაროლი არასწორია"
        )
    return {
        "success": True,
        "token": result["token"],
        "user": result["user"],
        "message": "ავტორიზაცია წარმატებით დასრულდა"
    }

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": user
    }

@router.post("/logout")
def logout(credentials = Depends(security)):
    if credentials:
        logout_user(credentials.credentials)
    return {"success": True, "message": "წარმატებით გამოხვედით სისტემიდან"}

