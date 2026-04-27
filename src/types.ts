import { auth } from './lib/firebase';
import { 
  OperationType, 
  handleFirestoreError 
} from './utils/firestoreErrorHandler';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  MIXED = 'mixed'
}

export enum GameMode {
  PRACTICE = 'practice',
  DAILY = 'daily',
  STREAK = 'streak'
}

export interface UserStats {
  easy: number;
  medium: number;
  hard: number;
  mixed: number;
  dailyStreak: number;
  lastDailyChallenge: string | null;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  stats: UserStats;
}

export interface VocabQuestion {
  word: string;
  definition: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
}
