import { config } from '@/config/environment';
import { DEMO_USERS } from './mockService';
import { AppUser } from '@/types';

/**
 * ユーザー情報取得
 * @param uid - ユーザーID
 * @returns Promise<AppUser | null>
 */
export const getUserInfo = async (uid: string): Promise<AppUser | null> => {
  if (config.demoMode) {
    return DEMO_USERS[uid] || null;
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as AppUser;
  }
  return null;
};

/**
 * ユーザー情報更新
 * @param user - ユーザー情報
 * @returns Promise<void>
 */
export const updateUserInfo = async (user: AppUser): Promise<void> => {
  if (config.demoMode) {
    // デモモードでは何もしない
    return;
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { doc, setDoc } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const docRef = doc(db, 'users', user.uid);
  await setDoc(docRef, user, { merge: true });
};