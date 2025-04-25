import React, { useState, useContext, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { UserContext } from '../context/UserContext';

const Auth = () => {
  const { userId } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authState, setAuthState] = useState('unknown');

  // Debug: Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthState('signed-in');
        console.log('Auth component: Signed in as:', user.uid);
      } else {
        setAuthState('signed-out');
        console.log('Auth component: Signed out');
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoggingIn) {
        // Login
        console.log('Attempting to sign in with:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful:', userCredential.user.uid);
      } else {
        // Sign up
        console.log('Attempting to create account with:', email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Account creation successful:', userCredential.user.uid);
      }
    } catch (error) {
      console.error('Auth error:', error.code, error.message);
      setError(
        error.code === 'auth/user-not-found' ? 'User not found. Try signing up instead.' :
        error.code === 'auth/wrong-password' ? 'Incorrect password.' :
        error.code === 'auth/email-already-in-use' ? 'Email already in use. Try logging in.' :
        error.code === 'auth/weak-password' ? 'Password should be at least 6 characters.' :
        error.code === 'auth/invalid-email' ? 'Invalid email format.' :
        'An error occurred: ' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Sign out successful');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Auth debug info
  const showDebugInfo = () => {
    return (
      <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', fontSize: '14px', textAlign: 'left'}}>
        <h4>Auth Debug Info</h4>
        <p>Auth State: {authState}</p>
        <p>User ID from Context: {userId ? userId : 'null'}</p>
        <p>User ID from Auth: {auth.currentUser?.uid || 'null'}</p>
      </div>
    );
  };

  if (userId) {
    return (
      <div className="auth-container">
        <h3>Logged In</h3>
        <p>You are now logged in and can use the app</p>
        <button onClick={handleLogout} className="auth-button logout-button">
          Log Out
        </button>
        {showDebugInfo()}
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h2>{isLoggingIn ? 'Log In to Groundr' : 'Sign Up for Groundr'}</h2>
      <p>Find boxing opponents in your area</p>
      
      <form onSubmit={handleAuth} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
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
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button 
          type="submit" 
          className="auth-button" 
          disabled={loading}
          style={{fontSize: '1.1rem', padding: '12px 20px', marginTop: '20px'}}
        >
          {loading ? 'Processing...' : isLoggingIn ? 'Log In' : 'Create Account'}
        </button>
      </form>
      
      <p className="auth-toggle">
        {isLoggingIn ? "New to Groundr? " : "Already have an account? "}
        <button 
          onClick={() => setIsLoggingIn(!isLoggingIn)}
          className="toggle-button"
        >
          {isLoggingIn ? 'Sign Up Instead' : 'Log In Instead'}
        </button>
      </p>
      
      {showDebugInfo()}
    </div>
  );
};

export default Auth;