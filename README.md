# FightR - Tinder for Fighting

A simple web application that mimics the Tinder swipe experience but for finding fighting opponents. Users can upload their photos, swipe through potential opponents, and arrange meetups for fistfights when there's a mutual match.

## Features

- Upload your fighter photo
- Swipe left on fighters you think would win against you
- Swipe right on fighters you think you could beat
- Get notified when there's a mutual match (both fighters think they can win)
- Arrange fights with your matches

## How to Use

1. Open the application in your browser
2. Upload your photo by clicking the "Upload Your Fighter Photo" button
3. Browse potential opponents by swiping left (reject) or right (accept)
4. When you get a match, you can arrange a fight

## Local Development

To run this project locally:

1. Clone the repository
2. Open the `index.html` file in your browser
3. No build tools or server required, it's pure HTML/CSS/JavaScript

## Deployment to GitHub Pages

To deploy this application to GitHub Pages:

1. Create a GitHub repository
2. Push your code to the main/master branch
3. Go to the repository settings
4. Scroll down to the GitHub Pages section
5. Select the main/master branch as the source
6. Click Save

Your site will be published at `https://[your-username].github.io/[repository-name]/`

### Quick Deployment Steps:

```bash
# Create a new repository on GitHub first

# Initialize git in the project folder
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote repository
git remote add origin https://github.com/[your-username]/[repository-name].git

# Push to GitHub
git push -u origin main
```

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Local Storage API for data persistence
- GitHub Pages for hosting

## Note

This is a simple demonstration app and doesn't include real user authentication or backend server functionality. In a real application, you would need to implement:

- User authentication
- Database storage
- Real-time matching
- Location services
- Safety features and moderation

## Disclaimer

This application is created for demonstration purposes only. Always follow local laws and regulations regarding fighting, and remember that arranging fights in this manner may be illegal in many jurisdictions.