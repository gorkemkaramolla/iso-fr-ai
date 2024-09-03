import { Transcript } from '@/types';
import { create, StateCreator } from 'zustand';

interface StoreState {
  currentTime: number;
  transcriptions: Transcript[];
  setCurrentTime: (currentTime: number) => void;
  setTranscriptions: (transcriptions: Transcript[]) => void;
  addTranscription: (newTranscription: Transcript) => void;
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
    transcriptions: [],

    setCurrentTime: (currentTime: number) => {
      set({ currentTime });
    },
    setTranscriptions: (transcriptions: Transcript[]) => {
      set({ transcriptions });
    },
    addTranscription: (newTranscription: Transcript) => {
      set((state) => ({
        transcriptions: [newTranscription, ...state.transcriptions],
      }));
    },
  }))
);

export default useStore;
