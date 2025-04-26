import React, { createContext, useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, getDocs, getDoc, doc, updateDoc, onSnapshot,
  query, where, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

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
        
        setMatches(matchesList);
      });
      
      return unsubscribe;
    };
    
    const unsubscribePromises = [
      loadUserProfile(),
      loadFighters(),
      loadLikedFighters(),
      loadMatches()
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
        setUserProfile({
          id: docRef.id,
          ...profileData
        });
      } else {
        // Update existing profile
        const docRef = doc(db, 'userProfiles', querySnapshot.docs[0].id);
        await updateDoc(docRef, profileData);
        setUserProfile({
          id: querySnapshot.docs[0].id,
          ...profileData
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error; // Re-throw to allow component to handle
    }
  };

  // Handle rejecting a fighter (swipe left)
  const rejectFighter = () => {
    if (currentFighterIndex >= fighters.length) return;
    setCurrentFighterIndex(currentFighterIndex + 1);
  };

  // Handle accepting a fighter (swipe right)
  const acceptFighter = async () => {
    if (!userId || currentFighterIndex >= fighters.length) return;
    
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
      const matchData = {
        userId: userId,
        fighterId: fighter.id,
        date: new Date().toISOString(),
        arranged: false
      };
      
      const docRef = await addDoc(collection(db, 'matches'), matchData);
      
      const match = {
        id: docRef.id,
        fighter: fighter,
        date: matchData.date,
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
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        arranged: true
      });
      
      const updatedMatches = matches.map(match => 
        match.id === matchId ? { ...match, arranged: true } : match
      );
      
      setMatches(updatedMatches);
      setShowMatchModal(false);
    } catch (error) {
      console.error("Error arranging fight:", error);
    }
  };

  // Close the match modal
  const closeMatchModal = () => {
    setShowMatchModal(false);
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
        showMatchModal,
        currentMatch,
        arrangeFight,
        closeMatchModal,
        userId,
        authLoading
      }}
    >
      {children}
    </UserContext.Provider>
  );
};