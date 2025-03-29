import firebase_admin
from firebase_admin import credentials, firestore
import os

# Get the absolute path to the service account key
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
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1",
    "*"
] 