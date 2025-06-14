import { getUserInfo, updateUserInfo } from '../userService';
import { AppUser } from '@/types';

// Firestore のモック
jest.mock('@/config/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn()
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserInfo', () => {
    it('should return user info when document exists', async () => {
      const mockUserData: AppUser = {
        uid: 'test-uid',
        name: 'テストユーザー',
        role: 'doctor_car',
        team: 'テストチーム',
        email: 'test@example.com'
      };

      const mockDocSnap = {
        exists: () => true,
        data: () => mockUserData
      };

      const { getDoc, doc } = require('firebase/firestore');
      const { db } = require('@/config/firebase');
      
      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getUserInfo('test-uid');

      expect(doc).toHaveBeenCalledWith(db, 'users', 'test-uid');
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(result).toEqual(mockUserData);
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      const { getDoc, doc } = require('firebase/firestore');
      const { db } = require('@/config/firebase');
      
      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getUserInfo('nonexistent-uid');

      expect(result).toBeNull();
    });
  });

  describe('updateUserInfo', () => {
    it('should update user info successfully', async () => {
      const mockUser: AppUser = {
        uid: 'test-uid',
        name: 'テストユーザー',
        role: 'doctor_car',
        team: 'テストチーム',
        email: 'test@example.com'
      };

      const { setDoc, doc } = require('firebase/firestore');
      const { db } = require('@/config/firebase');
      
      doc.mockReturnValue('mock-doc-ref');
      setDoc.mockResolvedValue(undefined);

      await updateUserInfo(mockUser);

      expect(doc).toHaveBeenCalledWith(db, 'users', mockUser.uid);
      expect(setDoc).toHaveBeenCalledWith('mock-doc-ref', mockUser, { merge: true });
    });
  });
});