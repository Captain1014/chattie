import React, { useEffect, useState } from 'react';
import { 
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  AuthError,
  User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 변경 감지
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      if (user) {
        // 사용자가 로그인하면 Firestore에 사용자 정보 저장
        try {
          const userData = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date()
          };
          console.log('Saving user data to Firestore:', userData);
          await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
          console.log('User data saved successfully');
        } catch (error) {
          console.error('사용자 정보 저장 에러:', error);
        }
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign in...');
      const provider = new GoogleAuthProvider();
      
      console.log('Provider created:', provider);
      console.log('Current auth state:', auth.currentUser?.email);
      
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Attempting to sign in with popup...');
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in result:', result.user.email);
      setUser(result.user);
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Google 로그인 에러 상세:', {
        code: authError.code,
        message: authError.message,
        stack: authError.stack
      });
      
      if (authError.code === 'auth/popup-closed-by-user') {
        alert('로그인이 취소되었습니다. 다시 시도해주세요.');
      } else {
        alert(`로그인 중 오류가 발생했습니다: ${authError.message}`);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 에러:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 