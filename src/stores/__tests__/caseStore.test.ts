import { renderHook, act } from '@testing-library/react';
import { useCaseStore } from '../caseStore';
import { Case } from '@/types';

// Services のモック
jest.mock('@/services/caseService', () => ({
  getAllCases: jest.fn(),
  getCaseById: jest.fn(),
  observeCase: jest.fn(),
  updateCaseStatus: jest.fn(),
  createCase: jest.fn()
}));

describe('CaseStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCaseStore.getState().reset();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useCaseStore());
    
    expect(result.current.cases).toEqual([]);
    expect(result.current.currentCase).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load cases successfully', async () => {
    const { getAllCases } = require('@/services/caseService');
    const mockCases: Partial<Case>[] = [
      {
        id: 'case-1',
        caseName: 'テストケース1',
        status: 'on_scene'
      },
      {
        id: 'case-2',
        caseName: 'テストケース2',
        status: 'completed'
      }
    ];

    getAllCases.mockResolvedValue(mockCases);

    const { result } = renderHook(() => useCaseStore());

    await act(async () => {
      await result.current.loadCases();
    });

    expect(getAllCases).toHaveBeenCalled();
    expect(result.current.cases).toEqual(mockCases);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle load cases error', async () => {
    const { getAllCases } = require('@/services/caseService');
    getAllCases.mockRejectedValue(new Error('Failed to load cases'));

    const { result } = renderHook(() => useCaseStore());

    await act(async () => {
      await result.current.loadCases();
    });

    expect(result.current.error).toBe('Failed to load cases');
    expect(result.current.loading).toBe(false);
  });

  it('should load current case successfully', async () => {
    const { getCaseById } = require('@/services/caseService');
    const mockCase: Partial<Case> = {
      id: 'case-1',
      caseName: 'テストケース1',
      status: 'on_scene'
    };

    getCaseById.mockResolvedValue(mockCase);

    const { result } = renderHook(() => useCaseStore());

    await act(async () => {
      await result.current.loadCurrentCase('case-1');
    });

    expect(getCaseById).toHaveBeenCalledWith('case-1');
    expect(result.current.currentCase).toEqual(mockCase);
    expect(result.current.loading).toBe(false);
  });

  it('should update case status successfully', async () => {
    const { updateCaseStatus } = require('@/services/caseService');
    updateCaseStatus.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCaseStore());

    // 初期状態で事案を設定
    act(() => {
      result.current.setCurrentCase({
        id: 'case-1',
        status: 'on_scene'
      } as Case);
    });

    await act(async () => {
      await result.current.updateStatus('case-1', 'transporting');
    });

    expect(updateCaseStatus).toHaveBeenCalledWith('case-1', 'transporting');
    expect(result.current.currentCase?.status).toBe('transporting');
  });

  it('should start observing case', () => {
    const { observeCase } = require('@/services/caseService');
    const mockUnsubscribe = jest.fn();
    observeCase.mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useCaseStore());

    act(() => {
      result.current.startObservingCase('case-1');
    });

    expect(observeCase).toHaveBeenCalledWith('case-1', expect.any(Function));
  });

  it('should stop observing case', () => {
    const { observeCase } = require('@/services/caseService');
    const mockUnsubscribe = jest.fn();
    observeCase.mockReturnValue(mockUnsubscribe);

    const { result } = renderHook(() => useCaseStore());

    // まず監視を開始
    act(() => {
      result.current.startObservingCase('case-1');
    });

    // 監視を停止
    act(() => {
      result.current.stopObservingCase();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});