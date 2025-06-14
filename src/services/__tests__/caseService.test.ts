import { getAllCases, getCaseById, updateCaseStatus, createCase } from '../caseService';
import { Case } from '@/types';
import { Timestamp, GeoPoint } from 'firebase/firestore';

// Firestore のモック
jest.mock('@/config/firebase', () => ({
  db: {
    collection: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

describe('CaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCases', () => {
    it('should return all cases ordered by creation date', async () => {
      const mockCases = [
        {
          id: 'case-1',
          caseName: '2024-01-15 テストケース1',
          status: 'on_scene',
          teamId: 'team-1'
        },
        {
          id: 'case-2',
          caseName: '2024-01-14 テストケース2',
          status: 'completed',
          teamId: 'team-1'
        }
      ];

      const mockQuerySnapshot = {
        docs: mockCases.map(caseData => ({
          id: caseData.id,
          data: () => caseData
        }))
      };

      const { collection, getDocs, query, orderBy } = require('firebase/firestore');
      const { db } = require('@/config/firebase');

      collection.mockReturnValue('mock-collection');
      query.mockReturnValue('mock-query');
      orderBy.mockReturnValue('mock-order');
      getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await getAllCases();

      expect(collection).toHaveBeenCalledWith(db, 'cases');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('case-1');
    });
  });

  describe('getCaseById', () => {
    it('should return case when it exists', async () => {
      const mockCase = {
        caseName: 'テストケース',
        status: 'on_scene',
        teamId: 'team-1'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'case-1',
        data: () => mockCase
      };

      const { doc, getDoc } = require('firebase/firestore');
      const { db } = require('@/config/firebase');

      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getCaseById('case-1');

      expect(doc).toHaveBeenCalledWith(db, 'cases', 'case-1');
      expect(result).toEqual({
        id: 'case-1',
        ...mockCase
      });
    });

    it('should return null when case does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      const { doc, getDoc } = require('firebase/firestore');
      doc.mockReturnValue('mock-doc-ref');
      getDoc.mockResolvedValue(mockDocSnap);

      const result = await getCaseById('nonexistent-case');

      expect(result).toBeNull();
    });
  });

  describe('updateCaseStatus', () => {
    it('should update case status successfully', async () => {
      const { doc, updateDoc, Timestamp } = require('firebase/firestore');
      const { db } = require('@/config/firebase');

      doc.mockReturnValue('mock-doc-ref');
      updateDoc.mockResolvedValue(undefined);
      Timestamp.now.mockReturnValue('mock-timestamp');

      await updateCaseStatus('case-1', 'transporting');

      expect(doc).toHaveBeenCalledWith(db, 'cases', 'case-1');
      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        status: 'transporting',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('createCase', () => {
    it('should create new case successfully', async () => {
      const mockCaseData = {
        caseName: 'New Test Case',
        status: 'dispatched' as const,
        teamId: 'team-1',
        patientInfo: {},
        sceneLocation: new GeoPoint(35.658584, 139.701442),
        hospitalLocation: new GeoPoint(35.665498, 139.686567)
      };

      const { collection, addDoc, Timestamp } = require('firebase/firestore');
      const { db } = require('@/config/firebase');

      collection.mockReturnValue('mock-collection');
      addDoc.mockResolvedValue({ id: 'new-case-id' });
      Timestamp.now.mockReturnValue('mock-timestamp');

      const result = await createCase(mockCaseData);

      expect(collection).toHaveBeenCalledWith(db, 'cases');
      expect(addDoc).toHaveBeenCalledWith('mock-collection', {
        ...mockCaseData,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('new-case-id');
    });
  });
});