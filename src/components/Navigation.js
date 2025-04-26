import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Navigation = () => {
  const { userId, logout, profileRequired } = useContext(UserContext);
  const location = useLocation();
  
  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      console.log('Successfully logged out');
    }
  };
  
  // Only show nav if logged in
  if (!userId) return null;
  
  return (
    <nav className="navigation">
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Find Fighters
        </Link>
        <Link 
          to="/matches" 
          className={`nav-link ${location.pathname === '/matches' ? 'active' : ''}`}
        >
          Matches
        </Link>
        <Link 
          to="/profile" 
          className={`nav-link ${location.pathname === '/profile' ? 'active' : ''} ${profileRequired ? 'required' : ''}`}
        >
          {profileRequired ? '⚠️ Profile' : 'Profile'}
        </Link>
      </div>
      <div className="nav-actions">
        <button onClick={handleLogout} className="logout-btn" aria-label="Log out">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;