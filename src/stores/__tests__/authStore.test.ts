import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

// Firebase services のモック
jest.mock('@/services/authService', () => ({
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  observeAuthState: jest.fn(),
  loginAsDoctorCarMember: jest.fn(),
  loginAsHospitalStaff: jest.fn()
}));

jest.mock('@/services/userService', () => ({
  getUserInfo: jest.fn()
}));

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ストアの初期状態にリセット
    useAuthStore.getState().reset();
  });

  it('should have initial state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.currentUser).toBeNull();
    expect(result.current.userInfo).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set user correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    } as any;

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should set user info correctly', () => {
    const { result } = renderHook(() => useAuthStore());
    const mockUserInfo = {
      uid: 'test-uid',
      name: 'テストユーザー',
      role: 'doctor_car' as const,
      team: 'テストチーム',
      email: 'test@example.com'
    };

    act(() => {
      result.current.setUserInfo(mockUserInfo);
    });

    expect(result.current.userInfo).toEqual(mockUserInfo);
  });

  it('should handle login successfully', async () => {
    const { loginUser } = require('@/services/authService');
    const { getUserInfo } = require('@/services/userService');
    
    const mockUser = { uid: 'test-uid', email: 'test@example.com' } as any;
    const mockUserInfo = {
      uid: 'test-uid',
      name: 'テストユーザー',
      role: 'doctor_car' as const,
      team: 'テストチーム',
      email: 'test@example.com'
    };

    loginUser.mockResolvedValue(mockUser);
    getUserInfo.mockResolvedValue(mockUserInfo);

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(loginUser).toHaveBeenCalledWith('test@example.com', 'password');
    expect(getUserInfo).toHaveBeenCalledWith('test-uid');
    expect(result.current.currentUser).toEqual(mockUser);
    expect(result.current.userInfo).toEqual(mockUserInfo);
    expect(result.current.error).toBeNull();
  });

  it('should handle login error', async () => {
    const { loginUser } = require('@/services/authService');
    loginUser.mockRejectedValue(new Error('Login failed'));

    const { result } = renderHook(() => useAuthStore());

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.error).toBe('Login failed');
    expect(result.current.currentUser).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle logout successfully', async () => {
    const { logoutUser } = require('@/services/authService');
    logoutUser.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthStore());

    // まずログイン状態にする
    act(() => {
      result.current.setUser({ uid: 'test-uid' } as any);
      result.current.setUserInfo({
        uid: 'test-uid',
        name: 'テストユーザー',
        role: 'doctor_car',
        team: 'テストチーム',
        email: 'test@example.com'
      });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutUser).toHaveBeenCalled();
    expect(result.current.currentUser).toBeNull();
    expect(result.current.userInfo).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});