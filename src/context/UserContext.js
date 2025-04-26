import React, { createContext, useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, onSnapshot,
  query, where, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [currentFighterIndex, setCurrentFighterIndex] = useState(0);
  const [fighters, setFighters] = useState([]);
  const [likedFighters, setLikedFighters] = useState({});
  const [matches, setMatches] = useState([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileRequired, setProfileRequired] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState({});

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUserId(user.uid);
      } else {
        // User is signed out
        setUserId(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
      setIsInitialized(true);
    });
    
    // Cleanup subscription
    return unsubscribe;
  }, []);
  
  // Load user profile from Firestore when userId is available
  useEffect(() => {
    if (!userId) return;
    
    // Load user profile
    const loadUserProfile = async () => {
      const userProfilesCollection = collection(db, 'userProfiles');
      const q = query(userProfilesCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setUserProfile({
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        });
        setProfileRequired(false);
      } else {
        setUserProfile(null);
        setProfileRequired(true);
      }
    };
    
    // Load other users' profiles to swipe through
    const loadFighters = async () => {
      const userProfilesCollection = collection(db, 'userProfiles');
      const unsubscribe = onSnapshot(userProfilesCollection, (snapshot) => {
        // Filter out the current user's profile and already liked users
        const fightersList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(profile => profile.userId !== userId && !likedFighters[profile.id]);
        
        setFighters(fightersList);
      });
      
      return unsubscribe;
    };
    
    // Load user's liked fighters
    const loadLikedFighters = async () => {
      const likedCollection = collection(db, 'likes');
      const q = query(likedCollection, where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const likes = {};
        snapshot.docs.forEach(doc => {
          likes[doc.data().fighterId] = true;
        });
        setLikedFighters(likes);
      });
      
      return unsubscribe;
    };
    
    // Load user's matches
    const loadMatches = async () => {
      const matchesCollection = collection(db, 'matches');
      const q = query(
        matchesCollection, 
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const matchesList = [];
        
        for (const docSnapshot of snapshot.docs) {
          const matchData = docSnapshot.data();
          // Get fighter profile for each match
          const fighterRef = doc(db, 'userProfiles', matchData.fighterId);
          
          try {
            // Use getDoc instead of getDocs for a single document
            const fighterSnap = await getDoc(fighterRef);
            
            if (fighterSnap.exists()) {
              const fighter = { 
                id: fighterSnap.id, 
                ...fighterSnap.data() 
              };
              
              matchesList.push({
                id: docSnapshot.id,
                fighter: fighter,
                date: matchData.date,
                arranged: matchData.arranged || false
              });
            } else {
              console.warn(`Fighter profile not found for match ${docSnapshot.id}`);
            }
          } catch (err) {
            console.error(`Error loading fighter for match ${docSnapshot.id}:`, err.message);
          }
        }
        
        // Remove duplicates based on fighterId and date
        const uniqueMatches = [];
        const matchKeys = new Set();
        
        matchesList.forEach(match => {
          const key = `${match.fighter.id}_${match.date}`;
          if (!matchKeys.has(key)) {
            matchKeys.add(key);
            uniqueMatches.push(match);
          }
        });
        
        setMatches(uniqueMatches);
      });
      
      return unsubscribe;
    };

    // Load messages for all matches
    const loadMessages = async () => {
      const messagesCollection = collection(db, 'messages');
      const q = query(
        messagesCollection,
        where('participants', 'array-contains', userId),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageData = {};
        
        snapshot.docs.forEach(doc => {
          const message = doc.data();
          const otherUserId = message.senderId === userId ? 
            message.receiverId : message.senderId;
          
          if (!messageData[otherUserId]) {
            messageData[otherUserId] = [];
          }
          
          messageData[otherUserId].push({
            id: doc.id,
            ...message
          });
        });
        
        // Sort messages by timestamp
        Object.keys(messageData).forEach(userId => {
          messageData[userId].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        });
        
        setMessages(messageData);
      });
      
      return unsubscribe;
    };
    
    const unsubscribePromises = [
      loadUserProfile(),
      loadFighters(),
      loadLikedFighters(),
      loadMatches(),
      loadMessages()
    ];
    
    return () => {
      unsubscribePromises.forEach(promise => 
        promise.then(unsubscribe => unsubscribe && unsubscribe())
      );
    };
  }, [userId, likedFighters]);

  // Update user profile
  const updateUserProfile = async (profile) => {
    if (!userId) return;
    
    try {
      let imageUrl = profile.image;
      
      // If image is a File object (new upload), store it in Firebase Storage
      if (profile.image && profile.image instanceof File) {
        const storageRef = ref(storage, `profile_images/${userId}`);
        const uploadResult = await uploadBytes(storageRef, profile.image);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // Convert age to number type explicitly
      const ageValue = profile.age ? Number(profile.age) : null;
      
      const profileData = {
        userId,
        name: profile.name || '',
        age: ageValue,
        contact: profile.contact || '',
        image: imageUrl || '',
        email: auth.currentUser?.email || '',
        // New Tinder-like fields
        height: profile.height || '',
        weight: profile.weight || '',
        training: profile.training || '',
        bio: profile.bio || '',
        // Use an ISO string timestamp instead of a Date object
        updatedAt: new Date().toISOString()
      };
      
      // Check if profile already exists
      const userProfilesCollection = collection(db, 'userProfiles');
      const q = query(userProfilesCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new profile
        profileData.createdAt = new Date().toISOString(); // Also ISO string format
        
        const docRef = await addDoc(userProfilesCollection, profileData);
        const newProfile = {
          id: docRef.id,
          ...profileData
        };
        
        setUserProfile(newProfile);
        setProfileRequired(false);
      } else {
        // Update existing profile
        const docRef = doc(db, 'userProfiles', querySnapshot.docs[0].id);
        await updateDoc(docRef, profileData);
        
        const updatedProfile = {
          id: querySnapshot.docs[0].id,
          ...profileData
        };
        
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw to allow component to handle
    }
  };

  // Handle rejecting a fighter (swipe left)
  const rejectFighter = () => {
    if (profileRequired || currentFighterIndex >= fighters.length) return;
    setCurrentFighterIndex(currentFighterIndex + 1);
  };

  // Handle accepting a fighter (swipe right)
  const acceptFighter = async () => {
    if (profileRequired || !userId || currentFighterIndex >= fighters.length) return;
    
    const fighter = fighters[currentFighterIndex];
    
    try {
      // Add to likes collection
      await addDoc(collection(db, 'likes'), {
        userId: userId,
        fighterId: fighter.id,
        timestamp: new Date().toISOString()
      });
      
      // Update local state
      const newLikedFighters = { ...likedFighters };
      newLikedFighters[fighter.id] = true;
      setLikedFighters(newLikedFighters);
      
      // Check if this fighter has already liked the current user
      const otherUserLikes = collection(db, 'likes');
      const q = query(
        otherUserLikes, 
        where('userId', '==', fighter.userId),
        where('fighterId', '==', userProfile.id)
      );
      const likeQuerySnapshot = await getDocs(q);
      
      // If mutual match, create a match
      if (!likeQuerySnapshot.empty) {
        createMatch(fighter);
      }
      
      setCurrentFighterIndex(currentFighterIndex + 1);
    } catch (error) {
      console.error("Error accepting fighter:", error);
    }
  };

  // Create a new match
  const createMatch = async (fighter) => {
    if (!userId || !userProfile) return;
    
    try {
      // Create timestamp to use consistently for both match records
      const matchTimestamp = new Date().toISOString();
      
      // 1. Create match record for the current user
      const currentUserMatchData = {
        userId: userId,
        fighterId: fighter.id,
        date: matchTimestamp,
        arranged: false,
        matchedWith: fighter.userId // Store the opponent's userId for reference
      };
      
      const currentUserDocRef = await addDoc(collection(db, 'matches'), currentUserMatchData);
      
      // 2. Create a corresponding match record for the opponent
      const opponentMatchData = {
        userId: fighter.userId, // The opponent's userId
        fighterId: userProfile.id, // Current user is the fighter for opponent
        date: matchTimestamp,
        arranged: false,
        matchedWith: userId // Store the current user's userId for reference
      };
      
      await addDoc(collection(db, 'matches'), opponentMatchData);
      
      console.log('Created bidirectional match between users:', userId, 'and', fighter.userId);
      
      // 3. Update local state for current user's UI
      const match = {
        id: currentUserDocRef.id,
        fighter: fighter,
        date: matchTimestamp,
        arranged: false
      };
      
      setMatches(prevMatches => [match, ...prevMatches]);
      setCurrentMatch(match);
      setShowMatchModal(true);
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  // Arrange fight with a matched fighter
  const arrangeFight = async (matchId) => {
    try {
      // 1. Get the current match document
      const matchRef = doc(db, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (!matchSnap.exists()) {
        console.error("Match not found:", matchId);
        return;
      }
      
      const matchData = matchSnap.data();
      const opponentUserId = matchData.matchedWith;
      
      if (!opponentUserId) {
        console.warn("Match does not have opponent user ID reference");
      }
      
      // 2. Update current user's match
      await updateDoc(matchRef, {
        arranged: true,
        arrangedAt: new Date().toISOString()
      });
      
      // 3. Find and update the opponent's corresponding match
      if (opponentUserId) {
        const matchesCollection = collection(db, 'matches');
        const q = query(
          matchesCollection, 
          where('userId', '==', opponentUserId),
          where('matchedWith', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const opponentMatchRef = doc(db, 'matches', querySnapshot.docs[0].id);
          await updateDoc(opponentMatchRef, {
            arranged: true,
            arrangedAt: new Date().toISOString()
          });
          console.log("Updated both sides of the match arrangement");
        } else {
          console.warn("Could not find corresponding match for opponent");
        }
      }
      
      // 4. Update local state
      const updatedMatches = matches.map(match => 
        match.id === matchId ? { ...match, arranged: true } : match
      );
      
      setMatches(updatedMatches);
      setShowMatchModal(false);
    } catch (error) {
      console.error("Error arranging fight:", error);
    }
  };

  // Send message to another user
  const sendMessage = async (receiverId, content) => {
    if (!userId || !userProfile) return;
    
    try {
      const messageData = {
        senderId: userId,
        senderName: userProfile.name,
        senderImage: userProfile.image,
        receiverId: receiverId,
        content: content,
        timestamp: new Date().toISOString(),
        read: false,
        participants: [userId, receiverId]
      };
      
      await addDoc(collection(db, 'messages'), messageData);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (otherUserId) => {
    if (!userId || !messages[otherUserId]) return;
    
    try {
      const updates = messages[otherUserId]
        .filter(msg => msg.receiverId === userId && !msg.read)
        .map(msg => {
          const messageRef = doc(db, 'messages', msg.id);
          return updateDoc(messageRef, { read: true });
        });
        
      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error("Error signing out:", error);
      return false;
    }
  };

  // Close the match modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
  };

  // Set search query for filtering matches
  const updateSearchQuery = (query) => {
    setSearchQuery(query);
  };

  // Get filtered matches based on search query
  const getFilteredMatches = () => {
    if (!searchQuery.trim()) return matches;
    
    const lowerQuery = searchQuery.toLowerCase();
    return matches.filter(match => 
      match.fighter.name.toLowerCase().includes(lowerQuery) ||
      (match.fighter.bio && match.fighter.bio.toLowerCase().includes(lowerQuery)) ||
      (match.fighter.training && match.fighter.training.toLowerCase().includes(lowerQuery))
    );
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <UserContext.Provider
      value={{
        userProfile,
        updateUserProfile,
        fighters,
        currentFighterIndex,
        rejectFighter,
        acceptFighter,
        likedFighters,
        matches,
        getFilteredMatches,
        updateSearchQuery,
        searchQuery,
        showMatchModal,
        currentMatch,
        arrangeFight,
        closeMatchModal,
        userId,
        authLoading,
        profileRequired,
        messages,
        sendMessage,
        markMessagesAsRead,
        logout
      }}
    >
      {children}
    </UserContext.Provider>
  );
};