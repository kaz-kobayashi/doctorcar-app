import { config } from '@/config/environment';
import { demoAuthService } from './mockService';

/**
 * ユーザーログイン
 * @param email - ユーザーのメールアドレス
 * @param password - パスワード
 * @returns Promise<User>
 */
export const loginUser = async (
  email: string, 
  password: string
): Promise<any> => {
  // デモモードの場合はモックサービスを使用
  if (config.demoMode) {
    return await demoAuthService.login(email, password);
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const { auth } = await import('@/config/firebase');
  
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * ユーザーログアウト
 * @returns Promise<void>
 */
export const logoutUser = async (): Promise<void> => {
  if (config.demoMode) {
    return await demoAuthService.logout();
  }
  
  // 通常モードでのFirebase操作（動的インポート）
  const { signOut } = await import('firebase/auth');
  const { auth } = await import('@/config/firebase');
  
  await signOut(auth);
};

/**
 * 認証状態の監視
 * @param callback - 認証状態変更時のコールバック関数
 * @returns Unsubscribe function
 */
export const observeAuthState = (
  callback: (user: any) => void
): (() => void) => {
  if (config.demoMode) {
    // デモモードでは何もしない
    return () => {};
  }
  
  // 通常モードでのFirebase操作は遅延ロード
  import('firebase/auth').then(({ onAuthStateChanged }) => {
    import('@/config/firebase').then(({ auth }) => {
      return onAuthStateChanged(auth, callback);
    });
  });
  
  return () => {}; // 簡易実装
};

/**
 * デモ用ログイン - ドクターカー隊員
 * @returns Promise<User>
 */
export const loginAsDoctorCarMember = async (): Promise<any> => {
  if (config.demoMode) {
    return await demoAuthService.loginAsDoctorCarMember();
  }
  return loginUser('doctor@demo.com', 'demo123456');
};

/**
 * デモ用ログイン - 病院スタッフ
 * @returns Promise<User>
 */
export const loginAsHospitalStaff = async (): Promise<any> => {
  if (config.demoMode) {
    return await demoAuthService.loginAsHospitalStaff();
  }
  return loginUser('hospital@demo.com', 'demo123456');
};