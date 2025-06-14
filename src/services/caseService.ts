import { config } from '@/config/environment';
import { demoCaseService } from './mockService';
import { Case } from '@/types';

/**
 * 全事案取得
 * @returns Promise<Case[]>
 */
export const getAllCases = async (): Promise<Case[]> => {
  if (config.demoMode) {
    return await demoCaseService.getAllCases();
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const casesRef = collection(db, 'cases');
  const q = query(casesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Case));
};

/**
 * 特定事案取得
 * @param caseId - 事案ID
 * @returns Promise<Case | null>
 */
export const getCaseById = async (caseId: string): Promise<Case | null> => {
  if (config.demoMode) {
    return await demoCaseService.getCaseById(caseId);
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const docRef = doc(db, 'cases', caseId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Case;
  }
  return null;
};

/**
 * 事案リアルタイム監視
 * @param caseId - 事案ID
 * @param callback - データ変更時のコールバック
 * @returns Unsubscribe function
 */
export const observeCase = (
  caseId: string,
  callback: (caseData: Case | null) => void
): (() => void) => {
  if (config.demoMode) {
    // デモモードでは一度だけコールバックを呼ぶ
    let isCancelled = false;
    demoCaseService.getCaseById(caseId).then(caseData => {
      if (!isCancelled) {
        callback(caseData);
      }
    }).catch(error => {
      if (!isCancelled) {
        console.error('Demo observeCase error:', error);
        callback(null);
      }
    });
    
    return () => {
      isCancelled = true;
    };
  }
  
  // 通常モードでのFirebase操作は遅延ロード
  let unsubscribe: (() => void) | null = null;
  
  import('firebase/firestore').then(({ doc, onSnapshot }) => {
    import('@/config/firebase').then(({ db }) => {
      const docRef = doc(db, 'cases', caseId);
      unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({
            id: doc.id,
            ...doc.data()
          } as Case);
        } else {
          callback(null);
        }
      });
    });
  }).catch(error => {
    console.error('Firebase observeCase error:', error);
    callback(null);
  });
  
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

/**
 * 事案ステータス更新
 * @param caseId - 事案ID
 * @param status - 新しいステータス
 * @returns Promise<void>
 */
export const updateCaseStatus = async (
  caseId: string, 
  status: Case['status']
): Promise<void> => {
  if (config.demoMode) {
    return await demoCaseService.updateCaseStatus(caseId, status);
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const docRef = doc(db, 'cases', caseId);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now()
  });
};

/**
 * 新規事案作成
 * @param caseData - 事案データ
 * @returns Promise<string> - 作成された事案ID
 */
export const createCase = async (caseData: Omit<Case, 'id'>): Promise<string> => {
  if (config.demoMode) {
    // デモモードでは新しいIDを生成してローカルストレージに保存
    const newId = `demo-case-${Date.now()}`;
    const newCase: Case = {
      ...caseData,
      id: newId
    };
    
    // 既存の事案を取得して新しい事案を追加
    const { demoStorage } = await import('./mockService');
    const existingCases = demoStorage.getCases();
    const updatedCases = [newCase, ...existingCases];
    demoStorage.setCases(updatedCases);
    
    return newId;
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { collection, addDoc, Timestamp } = await import('firebase/firestore');
  const { db } = await import('@/config/firebase');
  
  const casesRef = collection(db, 'cases');
  const docRef = await addDoc(casesRef, {
    ...caseData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};