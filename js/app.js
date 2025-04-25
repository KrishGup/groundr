// Mock fighter data (in a real app, this would come from a server)
const mockFighters = [
    { id: 1, name: "Mike", age: 28, image: "https://randomuser.me/api/portraits/men/32.jpg" },
    { id: 2, name: "Dave", age: 31, image: "https://randomuser.me/api/portraits/men/22.jpg" },
    { id: 3, name: "John", age: 25, image: "https://randomuser.me/api/portraits/men/62.jpg" },
    { id: 4, name: "Steve", age: 29, image: "https://randomuser.me/api/portraits/men/91.jpg" },
    { id: 5, name: "Alex", age: 27, image: "https://randomuser.me/api/portraits/men/45.jpg" }
];

// App state
const state = {
    currentFighterIndex: 0,
    fighters: [...mockFighters],
    userProfile: null,
    likedFighters: {},  // Fighters the user thinks they could beat
    matches: []         // Mutual matches (both think they could win)
};

// DOM elements
const cardContainer = document.getElementById('card-container');
const rejectBtn = document.getElementById('reject-btn');
const acceptBtn = document.getElementById('accept-btn');
const uploadBtn = document.getElementById('upload-photo-btn');
const photoUpload = document.getElementById('photo-upload');
const userProfile = document.getElementById('user-profile');
const matchModal = document.getElementById('match-modal');
const closeModal = document.querySelector('.close');
const arrangeFightBtn = document.getElementById('arrange-fight-btn');
const noMoreCards = document.getElementById('no-more-cards');
const userMatchImg = document.getElementById('user-match-img');
const opponentMatchImg = document.getElementById('opponent-match-img');

// Initialize the app
function init() {
    // Check if user has uploaded a profile photo
    const savedUserProfile = localStorage.getItem('fightrUserProfile');
    if (savedUserProfile) {
        state.userProfile = savedUserProfile;
        userProfile.innerHTML = `<img src="${savedUserProfile}" alt="Your profile">`;
    }
    
    // Load any saved matches
    const savedMatches = localStorage.getItem('fightrMatches');
    if (savedMatches) {
        state.matches = JSON.parse(savedMatches);
    }
    
    // Load any saved likes
    const savedLikes = localStorage.getItem('fightrLikes');
    if (savedLikes) {
        state.likedFighters = JSON.parse(savedLikes);
    }
    
    renderCurrentFighter();
}

// Render current fighter card
function renderCurrentFighter() {
    // Clear previous cards
    const existingCards = document.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    if (state.currentFighterIndex >= state.fighters.length) {
        // No more fighters to show
        noMoreCards.classList.remove('hidden');
        return;
    }
    
    noMoreCards.classList.add('hidden');
    
    const fighter = state.fighters[state.currentFighterIndex];
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
        <img src="${fighter.image}" alt="${fighter.name}">
        <div class="card-info">
            <h3>${fighter.name}, ${fighter.age}</h3>
            <p>Tap right if you think you'd win the fight!</p>
        </div>
    `;
    
    cardContainer.appendChild(card);
}

// Handle swipe left (reject)
function handleReject() {
    if (state.currentFighterIndex >= state.fighters.length) return;
    
    const card = document.querySelector('.card');
    card.classList.add('swipe-left');
    
    setTimeout(() => {
        state.currentFighterIndex++;
        renderCurrentFighter();
    }, 300);
}

// Handle swipe right (accept)
function handleAccept() {
    if (state.currentFighterIndex >= state.fighters.length) return;
    
    const fighter = state.fighters[state.currentFighterIndex];
    state.likedFighters[fighter.id] = true;
    
    // Save likes to localStorage
    localStorage.setItem('fightrLikes', JSON.stringify(state.likedFighters));
    
    // Simulate whether the fighter also liked the user (50% chance)
    const fighterLikesUser = Math.random() > 0.5;
    
    const card = document.querySelector('.card');
    card.classList.add('swipe-right');
    
    setTimeout(() => {
        // If mutual like, create a match
        if (fighterLikesUser) {
            createMatch(fighter);
        }
        
        state.currentFighterIndex++;
        renderCurrentFighter();
    }, 300);
}

// Create a new match
function createMatch(fighter) {
    if (!state.userProfile) return;
    
    const match = {
        id: Date.now(),
        fighter: fighter,
        date: new Date().toISOString()
    };
    
    state.matches.push(match);
    
    // Save matches to localStorage
    localStorage.setItem('fightrMatches', JSON.stringify(state.matches));
    
    // Show match modal
    userMatchImg.innerHTML = `<img src="${state.userProfile}" alt="You">`;
    opponentMatchImg.innerHTML = `<img src="${fighter.image}" alt="${fighter.name}">`;
    matchModal.style.display = 'block';
}

// Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imgUrl = e.target.result;
        state.userProfile = imgUrl;
        
        // Save to localStorage
        localStorage.setItem('fightrUserProfile', imgUrl);
        
        // Update UI
        userProfile.innerHTML = `<img src="${imgUrl}" alt="Your profile">`;
    };
    reader.readAsDataURL(file);
}

// Handle arrange fight button
function handleArrangeFight() {
    alert('Fight details have been sent! Get ready to rumble!');
    matchModal.style.display = 'none';
}

// Event listeners
rejectBtn.addEventListener('click', handleReject);
acceptBtn.addEventListener('click', handleAccept);

uploadBtn.addEventListener('click', () => {
    photoUpload.click();
});

photoUpload.addEventListener('change', handlePhotoUpload);

closeModal.addEventListener('click', () => {
    matchModal.style.display = 'none';
});

arrangeFightBtn.addEventListener('click', handleArrangeFight);

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    if (event.target === matchModal) {
        matchModal.style.display = 'none';
    }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', init);