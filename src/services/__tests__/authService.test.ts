import { loginUser, logoutUser, loginAsDoctorCarMember } from '../authService';

// Firebase Auth のモック
jest.mock('@/config/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
  }
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      const mockUserCredential = {
        user: mockUser
      };

      const { auth } = require('@/config/firebase');
      auth.signInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);

      const result = await loginUser('test@example.com', 'password');

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password'
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid credentials', async () => {
      const { auth } = require('@/config/firebase');
      auth.signInWithEmailAndPassword.mockRejectedValueOnce(
        new Error('Invalid credentials')
      );

      await expect(
        loginUser('invalid@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logoutUser', () => {
    it('should logout successfully', async () => {
      const { auth } = require('@/config/firebase');
      auth.signOut.mockResolvedValueOnce(undefined);

      await logoutUser();

      expect(auth.signOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('loginAsDoctorCarMember', () => {
    it('should login with demo doctor car credentials', async () => {
      const mockUser = {
        uid: 'doctor-001',
        email: 'doctor@demo.com'
      };

      const mockUserCredential = {
        user: mockUser
      };

      const { auth } = require('@/config/firebase');
      auth.signInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);

      const result = await loginAsDoctorCarMember();

      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'doctor@demo.com',
        'demo123456'
      );
      expect(result).toEqual(mockUser);
    });
  });
});