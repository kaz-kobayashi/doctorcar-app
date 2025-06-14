// ストアの統合エクスポート
export { useAuthStore } from './authStore';
export { useCaseStore } from './caseStore';

// ストアの初期化フック
import { useAuthStore } from './authStore';

export const useStoreInitialization = () => {
  const { initialize } = useAuthStore();
  
  return {
    initialize: () => {
      const authCleanup = initialize();
      
      // 他のストアの初期化もここに追加
      
      return () => {
        authCleanup();
        // 他のクリーンアップもここに追加
      };
    }
  };
};