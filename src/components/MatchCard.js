import React, { useContext, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { UserContext } from '../context/UserContext';

const MatchCard = () => {
  const { 
    userProfile, 
    fighters, 
    currentFighterIndex, 
    rejectFighter, 
    acceptFighter 
  } = useContext(UserContext);
  
  const [animationClass, setAnimationClass] = useState('');
  const cardRef = useRef(null);

  // Configure swipeable handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleSwipe = (direction) => {
    if (!cardRef.current) return;
    
    if (direction === 'left') {
      setAnimationClass('swipe-left');
      setTimeout(() => {
        setAnimationClass('');
        rejectFighter();
      }, 300);
    } else if (direction === 'right') {
      setAnimationClass('swipe-right');
      setTimeout(() => {
        setAnimationClass('');
        acceptFighter();
      }, 300);
    }
  };

  // If there's no user profile, prompt to create one
  if (!userProfile) {
    return (
      <div className="card-container">
        <div className="card">
          <div className="card-info" style={{ height: '100%', background: '#333' }}>
            <h3>Create your profile first!</h3>
            <p>Go to the Profile tab to upload your photo and information</p>
          </div>
        </div>
      </div>
    );
  }

  // If no fighters are available at all
  if (fighters.length === 0) {
    return (
      <div className="card-container">
        <div className="no-more-cards">
          <h3>No other fighters available yet</h3>
          <p>You're one of the first users! Share with friends to find matches.</p>
        </div>
      </div>
    );
  }

  // If we've gone through all fighters
  if (currentFighterIndex >= fighters.length) {
    return (
      <div className="card-container">
        <div className="no-more-cards">
          <h3>No more fighters to match with!</h3>
          <p>Check back later for more opponents</p>
        </div>
      </div>
    );
  }

  const currentFighter = fighters[currentFighterIndex];

  return (
    <>
      <div className="card-container" {...handlers}>
        <div ref={cardRef} className={`card ${animationClass}`}>
          <img src={currentFighter.image} alt={currentFighter.name} />
          <div className="card-info">
            <h3>{currentFighter.name}, {currentFighter.age}</h3>
            <p>Swipe right if you think you'd win the fight!</p>
          </div>
        </div>
      </div>
      
      <div className="buttons">
        <button 
          className="btn" 
          id="reject-btn" 
          onClick={() => handleSwipe('left')}
        >
          ❌
        </button>
        <button 
          className="btn" 
          id="accept-btn" 
          onClick={() => handleSwipe('right')}
        >
          👊
        </button>
      </div>
    </>
  );
};

export default MatchCard;