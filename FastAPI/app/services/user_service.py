from typing import Dict, Any, Optional
from firebase_admin import auth, firestore
from app.core.config import db
from app.models.user import UserCreate, UserPreferences
import datetime

# Collection references
users_ref = db.collection('users')
user_preferences_ref = db.collection('user_preferences')

class UserService:
    """Service for managing users in Firebase"""
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> Dict[str, Any]:
        """
        Create a new user in Firebase Authentication and Firestore
        
        Args:
            user_data: User creation data including email and password
            
        Returns:
            Dict with user information
        """
        try:
            # Create user in Firebase Auth
            user_record = auth.create_user(
                email=user_data.email,
                password=user_data.password,
                display_name=user_data.name,
                photo_url=user_data.picture
            )
            
            # Store additional user data in Firestore
            user_id = user_record.uid
            user_doc = {
                "uid": user_id,
                "email": user_data.email,
                "name": user_data.name,
                "picture": user_data.picture,
                "created_at": datetime.datetime.now().isoformat(),
                "updated_at": datetime.datetime.now().isoformat()
            }
            
            # Save user in Firestore
            users_ref.document(user_id).set(user_doc)
            
            # Create default user preferences
            default_preferences = UserPreferences().dict()
            user_preferences_ref.document(user_id).set(default_preferences)
            
            return {**user_doc, "preferences": default_preferences}
        
        except Exception as e:
            # Re-raise the exception with a descriptive message
            raise Exception(f"Failed to create user: {str(e)}")
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID from Firestore
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            User data or None if not found
        """
        try:
            # Get user data from Firestore
            user_doc = users_ref.document(user_id).get()
            
            if not user_doc.exists:
                return None
                
            user_data = user_doc.to_dict()
            
            # Get user preferences
            preferences_doc = user_preferences_ref.document(user_id).get()
            preferences = preferences_doc.to_dict() if preferences_doc.exists else UserPreferences().dict()
            
            return {**user_data, "preferences": preferences}
            
        except Exception as e:
            # Log the error and return None
            print(f"Error getting user: {str(e)}")
            return None
    
    @staticmethod
    async def update_user(user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user data in Firestore and optionally in Firebase Auth
        
        Args:
            user_id: Firebase user ID
            update_data: Data to update
            
        Returns:
            Updated user data or None if failed
        """
        try:
            # Prepare data for Firestore update
            firestore_update = {
                "updated_at": datetime.datetime.now().isoformat()
            }
            
            # Handle fields for both Auth and Firestore
            auth_update = {}
            
            # Update name if provided
            if "name" in update_data:
                firestore_update["name"] = update_data["name"]
                auth_update["display_name"] = update_data["name"]
                
            # Update picture if provided
            if "picture" in update_data:
                firestore_update["picture"] = update_data["picture"]
                auth_update["photo_url"] = update_data["picture"]
                
            # Update email if provided (requires re-authentication)
            if "email" in update_data:
                firestore_update["email"] = update_data["email"]
                auth_update["email"] = update_data["email"]
            
            # Update preferences if provided
            preferences_update = update_data.get("preferences", {})
            
            # Update in Firebase Auth if needed
            if auth_update:
                auth.update_user(user_id, **auth_update)
                
            # Update in Firestore
            if firestore_update:
                users_ref.document(user_id).update(firestore_update)
                
            # Update preferences in Firestore
            if preferences_update:
                user_preferences_ref.document(user_id).update(preferences_update)
                
            # Get updated user
            return await UserService.get_user_by_id(user_id)
            
        except Exception as e:
            # Log the error and return None
            print(f"Error updating user: {str(e)}")
            return None
            
    @staticmethod
    async def delete_user(user_id: str) -> bool:
        """
        Delete user from Firebase Auth and Firestore
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Delete from Auth
            auth.delete_user(user_id)
            
            # Delete from Firestore
            users_ref.document(user_id).delete()
            
            # Delete preferences
            user_preferences_ref.document(user_id).delete()
            
            return True
            
        except Exception as e:
            # Log the error and return False
            print(f"Error deleting user: {str(e)}")
            return False 