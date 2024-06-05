// lib/store.ts
import { create, StateCreator, StoreApi } from 'zustand';

interface StoreState {
  accessToken: string;
  setAccessToken: (token: string) => void;
}

// Middleware to log state changes
const logger =
  <T extends object>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (args) => {
        console.log('  applying', args);
        set(args);
        console.log('  new state', get());
      },
      get,
      api
    );

const useStore = create<StoreState>(
  logger<StoreState>((set) => ({
    accessToken: '',
    setAccessToken: (token: string) => set({ accessToken: token }),
  }))
);

export default useStore;
