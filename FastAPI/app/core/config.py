import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# For secure deployment, we should use either environment variables
# or a secure method to store and access service account credentials
service_account_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../serviceAccountKey.json'))

# Check if Firebase app is already initialized
def initialize_firebase():
    try:
        # Try to get default app
        default_app = firebase_admin.get_app()
        return default_app
    except ValueError:
        # Initialize if not already done
        cred = credentials.Certificate(service_account_path)
        default_app = firebase_admin.initialize_app(cred)
        return default_app

# Initialize Firebase
app = initialize_firebase()

# Get Firestore client
db = firestore.client()

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# App Settings
PORT = int(os.getenv("PORT", 8000))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t") 