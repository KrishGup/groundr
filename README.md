# Groundr - Tinder for Fighting

A React-based web application that mimics the Tinder swipe experience but for finding fighting opponents. Users can upload their photos and information, swipe through potential opponents, and arrange meetups for fistfights when there's a mutual match.

## Features

- Upload your fighter photo, name, age, and contact information
- Swipe left on fighters you think would win against you
- Swipe right on fighters you think you could beat
- Get notified when there's a mutual match (both fighters think they can win)
- Arrange fights with your matches
- Responsive design for both mobile and desktop

## Installation

To run this project locally:

```bash
# Clone the repository
git clone https://github.com/yourusername/groundr.git

# Navigate to the project directory
cd groundr

# Install dependencies
npm install

# Start the development server
npm start
```

The application will open in your browser at http://localhost:3000

## How to Use

1. First, navigate to the "Profile" tab and create your fighter profile
2. Upload your photo and enter your name, age, and contact information
3. Go to the "Fighters" tab to browse potential opponents
4. Swipe left (or click X) to reject a fighter you think would beat you
5. Swipe right (or click the fist icon) to accept a fighter you think you could beat
6. When you get a match, you'll see a notification and can arrange a fight
7. View all your matches in the "Matches" tab

## Deployment to GitHub Pages

This project is already configured for GitHub Pages deployment. Follow these steps:

1. Create a GitHub repository for your project
2. Update the "homepage" field in package.json to match your GitHub username and repository name:
   ```
   "homepage": "https://yourusername.github.io/groundr"
   ```
3. Initialize Git and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/groundr.git
   git push -u origin main
   ```
4. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

Your application will be available at `https://yourusername.github.io/groundr`

## Technologies Used

- React 18
- React Router DOM
- React Swipeable
- LocalStorage for data persistence
- CSS3 for styling
- GitHub Pages for hosting

## Disclaimer

This application is created for demonstration purposes only. Always follow local laws and regulations regarding fighting, and remember that arranging fights in this manner may be illegal in many jurisdictions.

## License

MIT
