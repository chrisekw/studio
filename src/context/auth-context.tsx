'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, runTransaction, query, collection, where, getDocs, writeBatch, increment, arrayUnion, type DocumentReference } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { generateReferralCode } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeProfile) unsubscribeProfile();

      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
              setLoading(false);
            } else {
              // New user detected, create their profile
              try {
                const referralCode = sessionStorage.getItem('referralCode');
                sessionStorage.removeItem('referralCode'); // Clean up immediately

                let referrerDocRef: DocumentReference | null = null;
                if (referralCode) {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('referralCode', '==', referralCode));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const referrerDoc = querySnapshot.docs[0];
                        if (referrerDoc.id !== user.uid) { // Ensure user is not referring themselves
                            referrerDocRef = referrerDoc.ref;
                        }
                    }
                }

                const newProfile: Omit<UserProfile, 'referredBy'> & { referredBy?: string } = {
                  email: user.email,
                  plan: 'Free',
                  defaultIncludeAddress: true,
                  defaultIncludeLinkedIn: true,
                  leadsGeneratedToday: 0,
                  lastLeadGenerationDate: '',
                  leadsGeneratedThisMonth: 0,
                  lastLeadGenerationMonth: '',
                  addonCredits: 0,
                  savedLeadsCount: 0,
                  referralCode: generateReferralCode(),
                  referrals: [],
                  leadPoints: 0,
                };
                
                if (referrerDocRef) {
                  // Use transaction to update referrer and create new user atomically
                  newProfile.referredBy = referrerDocRef.id;
                  await runTransaction(db, async (transaction) => {
                    // It's good practice to re-read the doc inside a transaction for safety
                    const referrerDoc = await transaction.get(referrerDocRef!);
                    if (!referrerDoc.exists()) {
                      // Referrer was deleted between the initial query and now.
                      delete newProfile.referredBy;
                      transaction.set(userDocRef, newProfile);
                      return;
                    }
                    
                    transaction.update(referrerDocRef!, {
                      leadPoints: increment(5), // 5 points for a new Free user
                      referrals: arrayUnion(user.uid),
                    });

                    transaction.set(userDocRef, newProfile);
                  });
                } else {
                  // No valid referrer, just create the new user
                  await setDoc(userDocRef, newProfile);
                }
                
              } catch (error) {
                 console.error("Error creating user profile:", error);
                 toast({
                    variant: 'destructive',
                    title: 'Could not create profile',
                    description: 'There was an issue setting up your account. This could be due to a permissions issue. Please try again.',
                  });
                 signOut(auth);
              }
            }
          },
          (error) => {
            console.error('Firebase profile listener error:', error);
            toast({
              variant: 'destructive',
              title: 'Could not load profile',
              description: 'There was a problem loading your user data. Please try logging in again.',
              duration: 5000,
            });
            signOut(auth);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
