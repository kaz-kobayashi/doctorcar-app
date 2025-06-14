import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

// テスト用のコンポーネント
const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement, initialPath = '/') => {
  window.history.pushState({}, 'Test page', initialPath);
  
  return render(
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="*" element={component} />
      </Routes>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Feature (BDD)', () => {
  describe('Scenario: Authenticated user accesses protected content', () => {
    it('Given user is authenticated', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'doctor_car',
            team: 'Test Team',
            email: 'test@example.com'
          },
          loading: false
        })
      }));
    });

    it('When user accesses protected route, then content is displayed', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'doctor_car',
            team: 'Test Team',
            email: 'test@example.com'
          },
          loading: false
        })
      }));

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Scenario: Unauthenticated user accesses protected content', () => {
    it('Given user is not authenticated', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: false,
          userInfo: null,
          loading: false
        })
      }));
    });

    it('When user accesses protected route, then redirected to login', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: false,
          userInfo: null,
          loading: false
        })
      }));

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Scenario: User with wrong role accesses role-specific content', () => {
    it('Given user is doctor car member', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'doctor_car',
            team: 'Test Team',
            email: 'test@example.com'
          },
          loading: false
        })
      }));
    });

    it('When user accesses hospital-only route, then redirected to unauthorized', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'doctor_car',
            team: 'Test Team',
            email: 'test@example.com'
          },
          loading: false
        })
      }));

      renderWithRouter(
        <ProtectedRoute requiredRole="hospital">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Scenario: Authentication is loading', () => {
    it('Given authentication state is loading', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: false,
          userInfo: null,
          loading: true
        })
      }));
    });

    it('When user accesses protected route, then loading spinner is shown', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: false,
          userInfo: null,
          loading: true
        })
      }));

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Scenario: User with correct role accesses role-specific content', () => {
    it('Given user is hospital staff', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'hospital',
            team: 'Test Hospital',
            email: 'test@example.com'
          },
          loading: false
        })
      }));
    });

    it('When user accesses hospital-only route, then content is displayed', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          isAuthenticated: true,
          userInfo: {
            uid: 'test-uid',
            name: 'Test User',
            role: 'hospital',
            team: 'Test Hospital',
            email: 'test@example.com'
          },
          loading: false
        })
      }));

      renderWithRouter(
        <ProtectedRoute requiredRole="hospital">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});