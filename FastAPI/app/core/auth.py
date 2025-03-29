import firebase_admin
from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

# Initialize HTTP Bearer scheme for token authentication
security = HTTPBearer()

class AuthService:
    """Service for handling authentication via Firebase"""
    
    @staticmethod
    async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """
        Verify Firebase JWT token and extract user information
        
        Args:
            credentials: HTTP Authorization header containing the Firebase JWT token
            
        Returns:
            dict: User claims from the verified token
            
        Raises:
            HTTPException: If token is invalid, expired, or missing
        """
        token = credentials.credentials
        
        try:
            # Verify the token with Firebase Admin SDK
            decoded_token = auth.verify_id_token(token)
            
            # Return the user claims
            return {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "email_verified": decoded_token.get("email_verified", False),
                "name": decoded_token.get("name"),
                "picture": decoded_token.get("picture")
            }
        except Exception as e:
            # Raise 401 Unauthorized for any auth-related error
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication credentials: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

# Dependency to get current authenticated user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency for getting the current authenticated user
    
    Args:
        credentials: HTTP Authorization header containing the Firebase JWT token
        
    Returns:
        dict: User claims from the verified token
    """
    return await AuthService.verify_token(credentials)

# Dependency for optional authentication (endpoints that work with or without auth)
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    """
    Dependency for optional authentication - returns user if authenticated, else None
    
    Args:
        credentials: HTTP Authorization header containing the Firebase JWT token, if any
        
    Returns:
        Optional[dict]: User claims if authenticated, None otherwise
    """
    if not credentials:
        return None
        
    try:
        return await AuthService.verify_token(credentials)
    except HTTPException:
        return None 