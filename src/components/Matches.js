import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

const Matches = () => {
  const { userProfile, matches, arrangeFight } = useContext(UserContext);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // If there's no user profile, prompt to create one
  if (!userProfile) {
    return (
      <div className="matches-container">
        <h2>Your Matches</h2>
        <p>Create your profile first to see your matches!</p>
      </div>
    );
  }

  // If there are no matches yet
  if (matches.length === 0) {
    return (
      <div className="matches-container">
        <h2>Your Matches</h2>
        <p>No matches yet. Start swiping to find opponents!</p>
      </div>
    );
  }

  return (
    <div className="matches-container">
      <h2>Your Matches</h2>
      <p>These fighters think they can take you on!</p>
      
      <div className="matches-list">
        {matches.map((match) => (
          <div key={match.id} className="match-item">
            <div className="match-profile-img">
              <img src={match.fighter.image} alt={match.fighter.name} />
            </div>
            <div className="match-details">
              <h3>{match.fighter.name}, {match.fighter.age}</h3>
              <p>Matched on: {formatDate(match.date)}</p>
              <p>Contact: {match.fighter.contact}</p>
              {!match.arranged ? (
                <button 
                  className="arrange-fight-btn" 
                  onClick={() => arrangeFight(match.id)}
                >
                  Arrange Fight
                </button>
              ) : (
                <p className="fight-arranged">Fight arranged!</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Matches;