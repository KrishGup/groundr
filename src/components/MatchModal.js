import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

const MatchModal = () => {
  const { 
    userProfile, 
    showMatchModal, 
    currentMatch, 
    arrangeFight, 
    closeMatchModal 
  } = useContext(UserContext);

  if (!showMatchModal || !currentMatch) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close" onClick={closeMatchModal}>&times;</span>
        <h2>IT'S A FIGHT MATCH!</h2>
        <div className="match-profiles">
          <div className="match-profile-img">
            <img src={userProfile.image} alt="You" />
          </div>
          <div className="match-profile-img">
            <img src={currentMatch.fighter.image} alt={currentMatch.fighter.name} />
          </div>
        </div>
        <p><strong>Both of you think you can take each other on!</strong></p>
        <p>Fighter: {currentMatch.fighter.name}, {currentMatch.fighter.age}</p>
        <p>Contact: {currentMatch.fighter.contact}</p>
        <button 
          className="arrange-fight-btn"
          onClick={() => arrangeFight(currentMatch.id)}
        >
          Arrange Fight
        </button>
      </div>
    </div>
  );
};

export default MatchModal;