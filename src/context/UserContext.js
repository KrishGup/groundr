import React, { createContext, useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { 
  collection, addDoc, getDocs, doc, updateDoc, onSnapshot,
  query, where, orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';

// Initial fighter data (will be stored in Firebase)
const initialFighters = [
  { id: 1, name: "Mike", age: 28, contact: "mike@fighter.com", image: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, name: "Dave", age: 31, contact: "dave@fighter.com", image: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: 3, name: "John", age: 25, contact: "john@fighter.com", image: "https://randomuser.me/api/portraits/men/62.jpg" },
  { id: 4, name: "Steve", age: 29, contact: "steve@fighter.com", image: "https://randomuser.me/api/portraits/men/91.jpg" },
  { id: 5, name: "Alex", age: 27, contact: "alex@fighter.com", image: "https://randomuser.me/api/portraits/men/45.jpg" }
];

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

  // Initialize Firebase auth and check for a user session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // For a weekend project, we can use anonymous auth for simplicity
        const userCredential = await signInAnonymously(auth);
        setUserId(userCredential.user.uid);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Load user profile from Firestore when userId is available
  useEffect(() => {
    if (!userId) return;
    
    // Setup fighters collection if it's empty
    const setupInitialData = async () => {
      const fightersCollection = collection(db, 'fighters');
      const fightersSnapshot = await getDocs(fightersCollection);
      
      if (fightersSnapshot.empty) {
        // Add initial fighters if none exist
        console.log('Adding initial fighters to Firestore...');
        for (const fighter of initialFighters) {
          await addDoc(fightersCollection, fighter);
        }
      }
    };
    
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
    
    // Load fighters
    const loadFighters = async () => {
      const fightersCollection = collection(db, 'fighters');
      const unsubscribe = onSnapshot(fightersCollection, (snapshot) => {
        const fightersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
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
          // Get fighter data for each match
          const fighterDoc = await getDocs(doc(db, 'fighters', matchData.fighterId));
          const fighter = fighterDoc ? fighterDoc.data() : null;
          
          if (fighter) {
            matchesList.push({
              id: docSnapshot.id,
              fighter: {
                id: matchData.fighterId,
                ...fighter
              },
              date: matchData.date,
              arranged: matchData.arranged || false
            });
          }
        }
        
        setMatches(matchesList);
      });
      
      return unsubscribe;
    };
    
    setupInitialData();
    
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
  }, [userId]);

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
      
      const profileData = {
        userId,
        name: profile.name,
        age: profile.age,
        contact: profile.contact,
        image: imageUrl,
        updatedAt: new Date().toISOString()
      };
      
      // Check if profile already exists
      const userProfilesCollection = collection(db, 'userProfiles');
      const q = query(userProfilesCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create new profile
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
      
      // Simulate whether the fighter also liked the user (50% chance)
      const fighterLikesUser = Math.random() > 0.5;
      
      if (fighterLikesUser) {
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
        closeMatchModal
      }}
    >
      {children}
    </UserContext.Provider>
  );
};