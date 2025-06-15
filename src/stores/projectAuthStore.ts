import { create } from 'zustand';

interface ProjectAuthState {
  isAuthenticated: boolean;
  checkAuth: () => boolean;
  authenticate: () => void;
  logout: () => void;
}

export const useProjectAuthStore = create<ProjectAuthState>((set) => ({
  isAuthenticated: false,

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
    set({ isAuthenticated: false });
  },
}));