# Finance Application

## Project Overview

A personal finance management application that allows users to track expenses, manage budgets, set financial goals, and visualize spending patterns. The application follows a full-stack architecture with a React frontend and FastAPI backend.

## Backend

- Built with FastAPI, a modern Python web framework
- RESTful API design with endpoints for transactions, budgets, goals, and user data
- Authentication system integrated with Firebase Auth
- Data validation using Pydantic models
- Runs on Uvicorn ASGI server

## Frontend

- Built with React.js for a responsive single-page application
- Firebase Authentication for user login/registration
- Chart.js for financial data visualization
- React Router for client-side routing
- Bootstrap for responsive UI components
- Dark mode support

## Database

- Firebase Firestore for data storage
- Real-time data updates
- NoSQL document-based structure
- Collections for users, transactions, categories, budgets, and goals

## Deployment Instructions

### Environment Setup

1. **Frontend Configuration**: For deployment, we're using a direct configuration file:

   - The Firebase configuration is in `React/finance-app/src/config.js`
   - **Important**: For actual production deployment, consider using:
     - Environment variables in your hosting platform
     - Runtime configuration injection
     - Or keep the config file approach but use a deployment process that replaces values

2. **Backend (.env file)**: In the `FastAPI` directory, create a `.env` file with:

   ```
   # Firebase Admin SDK Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   FIREBASE_CLIENT_CERT_URL=your-client-cert-url

   # CORS Settings
   CORS_ORIGINS=http://your-frontend-domain.com,http://localhost:3000

   # App Settings
   PORT=8000
   DEBUG=False
   ```

3. **Service Account Key**: For production, securely manage the Firebase service account key.

### Frontend Deployment (Firebase Hosting)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Navigate to React app: `cd React/finance-app`
4. Build the React app: `npm run build`
5. Initialize Firebase Hosting: `firebase init hosting`
   - Select your Firebase project
   - Specify `build` as your public directory
   - Configure as a single-page app
   - Don't overwrite `index.html`
6. Deploy to Firebase: `firebase deploy --only hosting`

### Backend Deployment Options

1. **Heroku**:

   - Install Heroku CLI and login
   - Create a `Procfile` in the root with: `web: cd FastAPI && uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}`
   - Deploy with: `git push heroku main`

2. **Google Cloud Run**:

   - Create a `Dockerfile` in the FastAPI directory
   - Build and push the Docker image
   - Deploy to Cloud Run, ensuring it has access to Firebase services

3. **AWS Elastic Beanstalk**:
   - Configure the `.ebextensions` directory
   - Deploy with the EB CLI

### Important Security Notes

- Never commit `.env` files or service account keys to version control
- Use environment variables in deployment platforms
- For the Firebase service account key, use secure storage options provided by your hosting platform
- Update CORS settings in production to only allow your specific domain
- The Firebase client configuration is generally considered public information, but using environment variables or platform configuration is still a good practice
