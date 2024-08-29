import { create, StateCreator } from 'zustand';

interface StoreState {
  currentTime: number;

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
    currentTime: 0,

    setCurrentTime: (currentTime: number) => {
      set({ currentTime });
    },
  }))
);

export default useStore;
