import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MatchCard from './components/MatchCard';
import Profile from './components/Profile';
import Matches from './components/Matches';
import MatchModal from './components/MatchModal';
import Auth from './components/Auth';
import { UserContext, UserProvider } from './context/UserContext';
import './App.css';

// Layout component with navigation
const Layout = ({ children }) => {
  const { userId } = useContext(UserContext);
  
  return (
    <div className="container">
      <header>
        <h1>GROUNDR</h1>
        <p>Find your next opponent</p>
      </header>
      
      {userId ? (
        <>
          <nav className="nav">
            <Link to="/" className="nav-link">Fighters</Link>
            <Link to="/matches" className="nav-link">Matches</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </nav>
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
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
