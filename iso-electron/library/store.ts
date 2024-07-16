import { create, StateCreator } from 'zustand';

interface StoreState {
  accessToken: string;
  refreshToken?: string;
  currentTime: number;
  setAccessToken: (access_token: string) => void;
  setRefreshToken: (refresh_token: string) => void;
  setCurrentTime: (currentTime: number) => void;
}

// Enhanced Middleware to log state changes
const logger =
  <T extends object>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (args) => {
        console.log('Applying:', args);
        set(args);
        console.log('New state:', get());
      },
      get,
      api
    );

const useStore = create<StoreState>(
  logger<StoreState>((set) => ({
    accessToken: '',
    refreshToken: '', // Initialize refreshToken if it should not be optional
    currentTime: 0,
    setAccessToken: (access_token: string) => {
      console.log('Setting access token');
      set({ accessToken: access_token });
    },
    setRefreshToken: (refresh_token: string) => {
      console.log('Setting refresh token');
      set({ refreshToken: refresh_token });
    },
    setCurrentTime: (currentTime: number) => {
      set({ currentTime });
    },
  }))
);

export default useStore;
