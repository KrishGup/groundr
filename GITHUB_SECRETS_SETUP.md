# Setting Up GitHub Secrets for Groundr

To safely deploy your Groundr app to GitHub Pages without exposing your Firebase API keys, follow these steps to set up GitHub Secrets:

## 1. Push your code to GitHub

Make sure your code is pushed to a GitHub repository. The GitHub Actions workflow will only work with a repository on GitHub.

## 2. Set up GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" → "Actions"
4. Click on the "New repository secret" button

## 3. Add the following secrets

Add each of these secrets individually (click "New repository secret" for each one):

| Secret Name | Value |
|-------------|-------|
| REACT_APP_FIREBASE_API_KEY | Your Firebase API key |
| REACT_APP_FIREBASE_AUTH_DOMAIN | Your Firebase auth domain (e.g., your-app.firebaseapp.com) |
| REACT_APP_FIREBASE_PROJECT_ID | Your Firebase project ID |
| REACT_APP_FIREBASE_STORAGE_BUCKET | Your Firebase storage bucket URL |
| REACT_APP_FIREBASE_MESSAGING_SENDER_ID | Your Firebase messaging sender ID |
| REACT_APP_FIREBASE_APP_ID | Your Firebase app ID |
| REACT_APP_FIREBASE_MEASUREMENT_ID | Your Firebase measurement ID (if you have Google Analytics enabled) |

## 4. Get your Firebase configuration values

If you need to find your Firebase configuration:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) near "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. Under "SDK setup and configuration", select "Config" to view your Firebase configuration object

## 5. Trigger a deployment

After setting up your secrets:

1. Push a commit to your `main` branch, which will automatically trigger the GitHub Actions workflow
2. Alternatively, go to the "Actions" tab in your repository and manually trigger the workflow

The deployment will use the secrets you configured without exposing them in your code.

## 6. For local development

For local development, create a real `.env` file based on the `.env.example` template:

1. Copy the `.env.example` file to a new file named `.env`
2. Fill in your actual Firebase configuration values
3. This file is in `.gitignore` so it won't be committed to GitHub

Now you can develop locally with `npm start` while keeping your API keys secure.