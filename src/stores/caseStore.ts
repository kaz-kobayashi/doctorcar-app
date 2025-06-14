import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Case } from '@/types';
import {
  getAllCases,
  getCaseById,
  observeCase,
  updateCaseStatus as serviceUpdateCaseStatus,
  createCase as serviceCreateCase
} from '@/services/caseService';

interface CaseState {
  // State
  cases: Case[];
  currentCase: Case | null;
  loading: boolean;
  error: string | null;
  
  // Internal state
  caseObserver: (() => void) | null;
  
  // Actions
  setCases: (cases: Case[]) => void;
  setCurrentCase: (caseData: Case | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async Actions
  loadCases: () => Promise<void>;
  loadCurrentCase: (caseId: string) => Promise<void>;
  updateStatus: (caseId: string, status: Case['status']) => Promise<void>;
  createCase: (caseData: Omit<Case, 'id'>) => Promise<string>;
  
  // Real-time subscription
  startObservingCase: (caseId: string) => void;
  stopObservingCase: () => void;
  
  // Cleanup
  reset: () => void;
}

/**
 * 事案状態管理ストア
 * 
 * 責務:
 * - 事案一覧の管理
 * - 現在の事案の管理
 * - 事案ステータスの更新
 * - リアルタイム事案監視
 */
export const useCaseStore = create<CaseState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    cases: [],
    currentCase: null,
    loading: false,
    error: null,
    caseObserver: null,
    
    // Sync Actions
    setCases: (cases) => set({ cases }),
    
    setCurrentCase: (caseData) => set({ currentCase: caseData }),
    
    setLoading: (loading) => set({ loading }),
    
    setError: (error) => set({ error }),
    
    // Async Actions
    loadCases: async () => {
      try {
        set({ loading: true, error: null });
        const cases = await getAllCases();
        set({ cases, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '事案の取得に失敗しました',
          loading: false
        });
      }
    },
    
    loadCurrentCase: async (caseId: string) => {
      try {
        set({ loading: true, error: null });
        const currentCase = await getCaseById(caseId);
        
        // 非同期処理中にストアがリセットされていないかチェック
        const currentState = get();
        if (currentState.loading) {
          set({ currentCase, loading: false });
        }
      } catch (error) {
        // エラー時もストアがまだ有効かチェック
        const currentState = get();
        if (currentState.loading) {
          set({
            error: error instanceof Error ? error.message : '事案の取得に失敗しました',
            loading: false
          });
        }
      }
    },
    
    updateStatus: async (caseId: string, status: Case['status']) => {
      try {
        set({ error: null });
        await serviceUpdateCaseStatus(caseId, status);
        
        // ローカル状態も更新
        const { currentCase, cases } = get();
        if (currentCase && currentCase.id === caseId) {
          set({
            currentCase: { ...currentCase, status }
          });
        }
        
        // 事案一覧も更新
        const updatedCases = cases.map(caseItem => 
          caseItem.id === caseId ? { ...caseItem, status } : caseItem
        );
        set({ cases: updatedCases });
        
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'ステータス更新に失敗しました'
        });
      }
    },
    
    createCase: async (caseData: Omit<Case, 'id'>) => {
      try {
        set({ loading: true, error: null });
        const caseId = await serviceCreateCase(caseData);
        
        // 事案一覧を再読み込み
        await get().loadCases();
        
        return caseId;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '事案の作成に失敗しました',
          loading: false
        });
        throw error;
      }
    },
    
    // Real-time subscription
    startObservingCase: (caseId: string) => {
      try {
        // 既存の監視を停止
        get().stopObservingCase();
        
        const unsubscribe = observeCase(caseId, (caseData) => {
          // ストアがまだ有効かチェック
          const currentState = get();
          if (currentState.caseObserver) {
            set({ currentCase: caseData });
          }
        });
        
        set({ caseObserver: unsubscribe });
      } catch (error) {
        console.error('Failed to start observing case:', error);
        set({
          error: error instanceof Error ? error.message : '事案の監視に失敗しました'
        });
      }
    },
    
    stopObservingCase: () => {
      try {
        const { caseObserver } = get();
        if (caseObserver) {
          caseObserver();
          set({ caseObserver: null });
        }
      } catch (error) {
        console.error('Failed to stop observing case:', error);
        // エラーでも observer をクリアする
        set({ caseObserver: null });
      }
    },
    
    // Cleanup
    reset: () => {
      get().stopObservingCase();
      set({
        cases: [],
        currentCase: null,
        loading: false,
        error: null,
        caseObserver: null
      });
    }
  }))
);