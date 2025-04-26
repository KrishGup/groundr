import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Messages = () => {
  const { userId, userProfile, profileRequired, messages, sendMessage, markMessagesAsRead } = useContext(UserContext);
  const { opponentId } = useParams();
  const [messageText, setMessageText] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const conversationMessages = messages[opponentId] || [];

  // Load opponent details and mark messages as read
  useEffect(() => {
    const loadOpponentDetails = async () => {
      if (!userId || !opponentId) return;
      
      try {
        // Import these directly from firebase.js instead of dynamic import
        const { db } = await import('../firebase');
        const { doc, getDoc, collection, query, where, getDocs } = await import('firebase/firestore');
        
        // Query user profiles by userId (not document ID)
        const userProfilesCollection = collection(db, 'userProfiles');
        const q = query(userProfilesCollection, where('userId', '==', opponentId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setOpponent({
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          });
        }
        
        // Mark received messages as read
        await markMessagesAsRead(opponentId);
      } catch (error) {
        console.error("Error loading opponent details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadOpponentDetails();
    
    // Set up interval to mark messages as read periodically
    const readInterval = setInterval(() => {
      if (userId && opponentId) {
        markMessagesAsRead(opponentId);
      }
    }, 5000);
    
    return () => clearInterval(readInterval);
  }, [userId, opponentId, markMessagesAsRead]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !userId || !opponentId) return;
    
    const success = await sendMessage(opponentId, messageText.trim());
    if (success) {
      setMessageText('');
    }
  };
  
  // Format timestamp in a user-friendly way
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If message is from today, show only time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // If message is from this week, show day and time
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (now - date < 7 * 24 * 60 * 60 * 1000) {
      return `${dayNames[date.getDay()]}, ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    
    // Otherwise show date and time
    return `${date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    })}, ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };
  
  // Redirect to profile creation if needed
  if (profileRequired) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <button className="back-button" onClick={() => navigate('/matches')}>
            <span>&larr;</span> Back
          </button>
          <h2>Messages</h2>
        </div>
        <div className="profile-required-message">
          <p>Please create your profile before messaging other fighters.</p>
          <button onClick={() => navigate('/profile')} className="create-profile-btn">
            Create Profile
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <button className="back-button" onClick={() => navigate('/matches')}>
            <span>&larr;</span> Back
          </button>
          <h2>Loading...</h2>
        </div>
        <div className="loading-messages">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }
  
  if (!opponent) {
    return (
      <div className="messages-container">
        <div className="messages-header">
          <button className="back-button" onClick={() => navigate('/matches')}>
            <span>&larr;</span> Back
          </button>
          <h2>User not found</h2>
        </div>
        <div className="no-user-message">
          <p>This user doesn't exist or has deleted their account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <button className="back-button" onClick={() => navigate('/matches')}>
          <span>&larr;</span> Back
        </button>
        
        <div className="opponent-info">
          <div className="opponent-avatar">
            {opponent.image ? (
              <img src={opponent.image} alt={opponent.name} />
            ) : (
              <div className="avatar-placeholder">{opponent.name ? opponent.name.charAt(0).toUpperCase() : 'F'}</div>
            )}
          </div>
          <div className="opponent-details">
            <h3>{opponent.name}</h3>
            <p className="opponent-subtitle">
              {opponent.training || ''}
              {opponent.training && (opponent.height || opponent.weight) ? ' • ' : ''}
              {opponent.height && opponent.weight ? `${opponent.height}, ${opponent.weight}` : 
               opponent.height || opponent.weight || ''}
            </p>
          </div>
        </div>
      </div>
      
      <div className="chat-container">
        <div className="messages-list">
          {conversationMessages.length === 0 ? (
            <div className="no-messages">
              <div className="no-messages-icon">💬</div>
              <p>No messages yet</p>
              <p className="no-messages-subtitle">Start the conversation with {opponent.name}!</p>
            </div>
          ) : (
            <>
              <div className="messages-date-separator">
                <span>Conversation with {opponent.name}</span>
              </div>
              {conversationMessages.map((message, index) => {
                // Check if we should show timestamp (first message or more than 5 min from previous)
                const showTimestamp = index === 0 || 
                  (new Date(message.timestamp) - new Date(conversationMessages[index-1].timestamp)) > 5 * 60 * 1000;
                
                return (
                  <React.Fragment key={message.id}>
                    {showTimestamp && (
                      <div className="message-timestamp-separator">
                        {formatMessageTime(message.timestamp)}
                      </div>
                    )}
                    <div className={`message-wrapper ${message.senderId === userId ? 'sent' : 'received'}`}>
                      <div className="message-bubble">
                        {message.content}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="message-form" onSubmit={handleSendMessage}>
          <div className="message-input-container">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="message-input"
            />
            <button 
              type="submit" 
              className="send-button"
              disabled={!messageText.trim()}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Messages;