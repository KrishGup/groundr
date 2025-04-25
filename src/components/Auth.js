import React, { useState, useContext } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { UserContext } from '../context/UserContext';

const Auth = () => {
  const { userId } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoggingIn) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setError(
        error.code === 'auth/user-not-found' ? 'User not found. Try signing up instead.' :
        error.code === 'auth/wrong-password' ? 'Incorrect password.' :
        error.code === 'auth/email-already-in-use' ? 'Email already in use. Try logging in.' :
        error.code === 'auth/weak-password' ? 'Password should be at least 6 characters.' :
        'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (userId) {
    return (
      <div className="auth-container">
        <h3>Logged In</h3>
        <button onClick={handleLogout} className="auth-button logout-button">
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h3>{isLoggingIn ? 'Login' : 'Sign Up'}</h3>
      <form onSubmit={handleAuth} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button 
          type="submit" 
          className="auth-button" 
          disabled={loading}
        >
          {loading ? 'Processing...' : isLoggingIn ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <p className="auth-toggle">
        {isLoggingIn ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLoggingIn(!isLoggingIn)}
          className="toggle-button"
        >
          {isLoggingIn ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
};

export default Auth;