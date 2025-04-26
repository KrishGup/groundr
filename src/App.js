import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MatchCard from './components/MatchCard';
import Profile from './components/Profile';
import Matches from './components/Matches';
import Messages from './components/Messages';
import MatchModal from './components/MatchModal';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import { UserContext, UserProvider } from './context/UserContext';
import './App.css';

// Layout component with navigation
const Layout = ({ children }) => {
  const { userId, profileRequired } = React.useContext(UserContext);
  
  // If user needs to create a profile and isn't on the profile page,
  // redirect them to the profile page
  const redirectToProfile = profileRequired && 
    window.location.hash !== '#/profile' &&
    window.location.hash !== '#/';
  
  React.useEffect(() => {
    if (redirectToProfile) {
      window.location.hash = '#/profile';
    }
  }, [redirectToProfile]);
  
  return (
    <div className="container">
      <header>
        <h1>GROUNDR</h1>
        <p>Find your next boxing opponent</p>
      </header>
      
      {userId ? (
        <>
          <Navigation />
          {children}
        </>
      ) : (
        <div className="auth-wrapper">
          <Auth />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <Layout>
              <MatchCard />
              <MatchModal />
            </Layout>
          } />
          <Route path="/matches" element={
            <Layout>
              <Matches />
              <MatchModal />
            </Layout>
          } />
          <Route path="/profile" element={
            <Layout>
              <Profile />
              <MatchModal />
            </Layout>
          } />
          <Route path="/messages/:opponentId" element={
            <Layout>
              <Messages />
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
