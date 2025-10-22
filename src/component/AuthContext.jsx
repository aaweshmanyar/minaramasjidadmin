import React, { createContext, useContext, useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import firebaseConfig from '../pages/firebase/firebaseConfig';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [fname, setFname] = useState(null); // ✅ Add this
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await firestore.collection('admins').doc(user.uid).get();
          if (userDoc.exists) {
            const data = userDoc.data();
            setUserRole(data.role || null);
            setFname(data.fname || null); // ✅ Store fname
          } else {
            setUserRole(null);
            setFname(null);
          }
          setCurrentUser(user);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setFname(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const logout = () => {
    auth.signOut();
    setCurrentUser(null);
    setUserRole(null);
    setFname(null); // ✅ Clear fname
  };

  const value = { currentUser, userRole, fname, login, logout, loading }; // ✅ Add fname and loading

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
