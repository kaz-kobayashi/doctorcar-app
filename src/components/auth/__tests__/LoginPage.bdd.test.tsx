import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../../pages/LoginPage';

// モック
jest.mock('@/stores', () => ({
  useAuthStore: () => ({
    login: jest.fn(),
    loginDemo: jest.fn(),
    loading: false,
    error: null,
    isAuthenticated: false
  })
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Feature (BDD)', () => {
  describe('Scenario: User logs in with valid credentials', () => {
    it('Given a login form is displayed', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
    });

    it('When user enters valid credentials and clicks login', async () => {
      const mockLogin = jest.fn().mockResolvedValue(undefined);
      
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          login: mockLogin,
          loginDemo: jest.fn(),
          loading: false,
          error: null,
          isAuthenticated: false
        })
      }));

      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);
      const loginButton = screen.getByRole('button', { name: /ログイン/i });

      fireEvent.change(emailInput, { target: { value: 'doctor@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'testpass123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('doctor@test.com', 'testpass123');
      });
    });
  });

  describe('Scenario: User uses demo login', () => {
    it('Given demo login buttons are displayed', () => {
      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText(/デモ用: ドクターカー隊員でログイン/i)).toBeInTheDocument();
      expect(screen.getByText(/デモ用: 病院スタッフでログイン/i)).toBeInTheDocument();
    });

    it('When user clicks doctor car demo login', async () => {
      const mockLoginDemo = jest.fn().mockResolvedValue(undefined);
      
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          login: jest.fn(),
          loginDemo: mockLoginDemo,
          loading: false,
          error: null,
          isAuthenticated: false
        })
      }));

      renderWithRouter(<LoginPage />);
      
      const demoButton = screen.getByText(/デモ用: ドクターカー隊員でログイン/i);
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockLoginDemo).toHaveBeenCalledWith('doctor_car');
      });
    });

    it('When user clicks hospital staff demo login', async () => {
      const mockLoginDemo = jest.fn().mockResolvedValue(undefined);
      
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          login: jest.fn(),
          loginDemo: mockLoginDemo,
          loading: false,
          error: null,
          isAuthenticated: false
        })
      }));

      renderWithRouter(<LoginPage />);
      
      const demoButton = screen.getByText(/デモ用: 病院スタッフでログイン/i);
      fireEvent.click(demoButton);

      await waitFor(() => {
        expect(mockLoginDemo).toHaveBeenCalledWith('hospital');
      });
    });
  });

  describe('Scenario: User enters invalid credentials', () => {
    it('Given user has entered invalid credentials', () => {
      renderWithRouter(<LoginPage />);
      
      const emailInput = screen.getByLabelText(/メールアドレス/i);
      const passwordInput = screen.getByLabelText(/パスワード/i);

      fireEvent.change(emailInput, { target: { value: 'invalid@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      expect(emailInput).toHaveValue('invalid@test.com');
      expect(passwordInput).toHaveValue('wrongpassword');
    });

    it('When login fails, then error message is displayed', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          login: jest.fn(),
          loginDemo: jest.fn(),
          loading: false,
          error: 'ログインに失敗しました',
          isAuthenticated: false
        })
      }));

      renderWithRouter(<LoginPage />);
      
      expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument();
    });
  });

  describe('Scenario: Login is in progress', () => {
    it('When login is loading, then loading state is shown', () => {
      jest.doMock('@/stores', () => ({
        useAuthStore: () => ({
          login: jest.fn(),
          loginDemo: jest.fn(),
          loading: true,
          error: null,
          isAuthenticated: false
        })
      }));

      renderWithRouter(<LoginPage />);
      
      const loginButton = screen.getByRole('button', { name: /ログイン/i });
      expect(loginButton).toBeDisabled();
    });
  });
});