import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { User } from 'firebase/auth';
import { AppUser } from '@/types';
import { 
  loginUser as serviceLoginUser, 
  logoutUser as serviceLogoutUser, 
  observeAuthState,
  loginAsDoctorCarMember as serviceLoginAsDoctorCarMember,
  loginAsHospitalStaff as serviceLoginAsHospitalStaff
} from '@/services/authService';
import { getUserInfo } from '@/services/userService';
import { config } from '@/config/environment';
import { demoStorage } from '@/services/mockService';

interface AuthState {
  // State
  currentUser: User | null;
  userInfo: AppUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setUserInfo: (userInfo: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role: 'doctor_car' | 'hospital') => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => (() => void);
  reset: () => void;
}

/**
 * 認証状態管理ストア
 * 
 * 責務:
 * - Firebase Authentication状態の管理
 * - ユーザー情報の管理
 * - ログイン・ログアウト処理
 * - 認証状態の監視
 */
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    // Initial State
    currentUser: null,
    userInfo: null,
    isAuthenticated: false,
    loading: true,
    error: null,
    
    // Actions
    setUser: (user) => {
      set({
        currentUser: user,
        isAuthenticated: !!user,
        loading: false
      });
    },
    
    setUserInfo: (userInfo) => {
      set({ userInfo });
    },
    
    setLoading: (loading) => {
      set({ loading });
    },
    
    setError: (error) => {
      set({ error });
    },
    
    login: async (email, password) => {
      try {
        set({ loading: true, error: null });
        
        const user = await serviceLoginUser(email, password);
        const userInfo = await getUserInfo(user.uid);
        
        set({
          currentUser: user,
          userInfo,
          isAuthenticated: true,
          loading: false,
          error: null
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'ログインに失敗しました',
          loading: false,
          currentUser: null,
          userInfo: null,
          isAuthenticated: false
        });
      }
    },
    
    loginDemo: async (role) => {
      try {
        set({ loading: true, error: null });
        
        const user = role === 'doctor_car' 
          ? await serviceLoginAsDoctorCarMember()
          : await serviceLoginAsHospitalStaff();
          
        const userInfo = await getUserInfo(user.uid);
        
        set({
          currentUser: user,
          userInfo,
          isAuthenticated: true,
          loading: false,
          error: null
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'デモログインに失敗しました',
          loading: false
        });
      }
    },
    
    logout: async () => {
      try {
        await serviceLogoutUser();
        set({
          currentUser: null,
          userInfo: null,
          isAuthenticated: false,
          loading: false,
          error: null
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'ログアウトに失敗しました'
        });
      }
    },
    
    initialize: () => {
      // デモモードの場合はローカルストレージから認証状態を復元
      if (config.demoMode) {
        console.log('Initializing demo mode authentication');
        
        // 即座にloading状態を解除
        setTimeout(() => {
          try {
            const storedUser = demoStorage.getCurrentUser();
            console.log('Stored user:', storedUser);
            if (storedUser) {
              set({
                currentUser: storedUser as any,
                userInfo: storedUser,
                isAuthenticated: true,
                loading: false,
                error: null
              });
            } else {
              // デモモードでは未認証状態に設定
              set({
                currentUser: null,
                userInfo: null,
                isAuthenticated: false,
                loading: false,
                error: null
              });
            }
          } catch (error) {
            console.error('Demo mode initialization error:', error);
            set({
              currentUser: null,
              userInfo: null,
              isAuthenticated: false,
              loading: false,
              error: null
            });
          }
        }, 0);
        
        // デモモードでは何もクリーンアップする必要がない
        return () => {};
      }
      
      // 通常モードではFirebaseの認証状態を監視
      const unsubscribe = observeAuthState(async (user) => {
        if (user) {
          try {
            const userInfo = await getUserInfo(user.uid);
            set({
              currentUser: user,
              userInfo,
              isAuthenticated: true,
              loading: false,
              error: null
            });
          } catch (error) {
            set({
              error: 'ユーザー情報の取得に失敗しました',
              loading: false
            });
          }
        } else {
          set({
            currentUser: null,
            userInfo: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
        }
      });
      
      return unsubscribe;
    },
    
    reset: () => {
      set({
        currentUser: null,
        userInfo: null,
        isAuthenticated: false,
        loading: true,
        error: null
      });
    }
  }))
);