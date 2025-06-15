import { create } from 'zustand';

interface ProjectAuthState {
  isAuthenticated: boolean;
  redirectUrl: string | null;
  checkAuth: () => boolean;
  authenticate: () => void;
  logout: () => void;
  setRedirectUrl: (url: string | null) => void;
}

export const useProjectAuthStore = create<ProjectAuthState>((set) => ({
  isAuthenticated: false,
  redirectUrl: null,

  checkAuth: () => {
    const isAuthed = localStorage.getItem('doctorcar_project_auth') === 'true';
    set({ isAuthenticated: isAuthed });
    return isAuthed;
  },

  authenticate: () => {
    localStorage.setItem('doctorcar_project_auth', 'true');
    set({ isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('doctorcar_project_auth');
    set({ isAuthenticated: false, redirectUrl: null });
  },

  setRedirectUrl: (url: string | null) => {
    set({ redirectUrl: url });
  },
}));