import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AuthContext = createContext();

// Known admin emails - add more if needed
const ADMIN_EMAILS = ['admin@macrofast.com'];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Check if user is a known admin by email first (instant, no DB needed)
        const userEmail = user.email ? user.email.toLowerCase() : '';
        if (ADMIN_EMAILS.includes(userEmail) || userEmail === 'admin@macrofast.com') {
          setUserRole('admin');
          setLoading(false);
          return;
        }

        // Otherwise fetch role from DB
        get(ref(db, `users/${user.uid}/role`)).then(snapshot => {
          if (snapshot.exists()) {
            setUserRole(snapshot.val());
          } else {
            setUserRole('field');
          }
        }).catch(err => {
          console.error("Error fetching user role", err);
          setUserRole('field');
        }).finally(() => {
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
