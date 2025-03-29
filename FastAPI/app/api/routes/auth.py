from fastapi import APIRouter, Depends, HTTPException
from app.models.user import UserCreate, UserLogin, User
from app.services.user_service import UserService
from app.core.auth import get_current_user
from firebase_admin import auth
from typing import Dict, Any

# Initialize router
auth_router = APIRouter(prefix="/auth", tags=["authentication"])

@auth_router.post("/register", response_model=Dict[str, Any])
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        user = await UserService.create_user(user_data)
        return {
            "message": "User registered successfully",
            "user": user
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/login")
async def login(login_data: UserLogin):
    """
    Login endpoint to get Firebase custom token
    Note: In a real app, this would be done client-side with Firebase SDK
    """
    try:
        # Create a custom token for the user (demonstration only)
        # In real apps, login is handled directly by Firebase client SDK
        return {
            "message": "Login successful",
            "note": "This endpoint is for demonstration. In production, use Firebase Authentication directly from the client."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")

@auth_router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    try:
        user = await UserService.get_user_by_id(current_user["uid"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.put("/me", response_model=Dict[str, Any])
async def update_current_user(update_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Update current user information"""
    try:
        updated_user = await UserService.update_user(current_user["uid"], update_data)
        if not updated_user:
            raise HTTPException(status_code=404, detail="Failed to update user")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auth_router.delete("/me")
async def delete_current_user(current_user: dict = Depends(get_current_user)):
    """Delete current user account"""
    try:
        success = await UserService.delete_user(current_user["uid"])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete user")
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 