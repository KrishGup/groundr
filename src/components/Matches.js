import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { Link } from 'react-router-dom';

const Matches = () => {
  const { 
    userProfile, 
    getFilteredMatches, 
    updateSearchQuery, 
    searchQuery, 
    arrangeFight,
    profileRequired
  } = useContext(UserContext);
  
  const matches = getFilteredMatches();

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // If profile is required, prompt to create one
  if (profileRequired) {
    return (
      <div className="matches-container">
        <h2>Your Matches</h2>
        <p>Please create your profile first to see your matches!</p>
        <Link to="/profile" className="create-profile-btn">Create Profile</Link>
      </div>
    );
  }

  // If there's no user profile, show loading
  if (!userProfile) {
    return (
      <div className="matches-container">
        <h2>Your Matches</h2>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="matches-container">
      <h2>Your Matches</h2>
      
      {/* Search bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search matches by name, training style, etc."
          value={searchQuery}
          onChange={(e) => updateSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => updateSearchQuery('')}
          >
            ×
          </button>
        )}
      </div>
      
      {matches.length === 0 ? (
        <p className="no-matches-message">
          {searchQuery 
            ? "No matches match your search criteria." 
            : "No matches yet. Start swiping to find opponents!"}
        </p>
      ) : (
        <div className="matches-list">
          {matches.map((match) => (
            <div key={match.id} className="match-item">
              <div className="match-profile-img">
                <img src={match.fighter.image} alt={match.fighter.name} />
              </div>
              <div className="match-details">
                <h3>{match.fighter.name}, {match.fighter.age}</h3>
                
                {/* Display fighter bio details if available */}
                {match.fighter.height && <p>Height: {match.fighter.height}</p>}
                {match.fighter.weight && <p>Weight: {match.fighter.weight}</p>}
                {match.fighter.training && <p>Experience: {match.fighter.training}</p>}
                
                <p>Matched on: {formatDate(match.date)}</p>
                <p>Contact: {match.fighter.contact}</p>
                
                <div className="match-actions">
                  <Link 
                    to={`/messages/${match.fighter.userId}`}
                    className="message-btn"
                  >
                    Message
                  </Link>
                  
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matches;