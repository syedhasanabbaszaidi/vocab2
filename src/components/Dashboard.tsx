import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Trophy, 
  Flame, 
  BookOpen, 
  Calendar, 
  Settings, 
  ChevronRight,
  LogOut,
  Target,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Difficulty, GameMode } from '../types';

interface DashboardProps {
  onStartGame: (mode: GameMode, difficulty: Difficulty) => void;
  onViewLeaderboard: () => void;
}

export default function Dashboard({ onStartGame, onViewLeaderboard }: DashboardProps) {
  const { user } = useAuth();
  
  const categories = [
    { id: Difficulty.EASY, label: 'Easy', color: 'bg-green-500', text: 'Common everyday words' },
    { id: Difficulty.MEDIUM, label: 'Medium', color: 'bg-blue-500', text: 'Academic & business vocabulary' },
    { id: Difficulty.HARD, label: 'Hard', color: 'bg-purple-500', text: 'Rare literary & complex words' },
    { id: Difficulty.MIXED, label: 'Mixed', color: 'bg-orange-500', text: 'A random blend of all levels' },
  ];

  const totalScore = user ? (user.stats.easy + user.stats.medium + user.stats.hard + user.stats.mixed) : 0;
  
  const isDailyDone = user?.stats.lastDailyChallenge ? 
    new Date(user.stats.lastDailyChallenge).toDateString() === new Date().toDateString() : 
    false;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="px-6 py-8 flex justify-between items-start border-b border-gray-100">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Welcome back</h2>
          <h1 className="text-3xl font-extrabold tracking-tight">{(user?.displayName || 'Scholar').split(' ')[0]}</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => signOut(auth)}
            className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl shadow-gray-200"
          >
            <div className="p-3 bg-white/10 rounded-xl w-fit mb-4">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold">{totalScore}</div>
            <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Score</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -4 }}
            className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100"
          >
            <div className="p-3 bg-white/10 rounded-xl w-fit mb-4">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-2xl font-bold">{user?.stats.dailyStreak || 0}</div>
            <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">Day Streak</div>
          </motion.div>
        </div>

        {/* Daily Challenge */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Special Challenge</h3>
          <motion.button
            whileTap={{ scale: isDailyDone ? 1 : 0.98 }}
            onClick={() => !isDailyDone && onStartGame(GameMode.DAILY, Difficulty.MIXED)}
            className={`w-full relative overflow-hidden bg-white border-2 border-gray-900 rounded-[2rem] p-8 flex items-center justify-between group shadow-[8px_8px_0px_0px_rgba(17,24,39,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${isDailyDone ? 'opacity-50 grayscale cursor-not-allowed shadow-none translate-x-1 translate-y-1' : ''}`}
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-white">
                {isDailyDone ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <Calendar className="w-8 h-8" />}
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold text-gray-900">{isDailyDone ? 'Daily Complete' : 'Daily Challenge'}</h4>
                <p className="text-gray-500 text-sm">{isDailyDone ? 'Come back tomorrow!' : '5 words chosen for today'}</p>
              </div>
            </div>
            {!isDailyDone && <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-gray-900 transition-colors" />}
          </motion.button>
        </section>

        {/* Streak / New Words */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Endless Mode</h3>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onStartGame(GameMode.STREAK, Difficulty.MIXED)}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-xl shadow-blue-100"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h4 className="text-xl font-bold">New Streak</h4>
                <p className="text-blue-100 text-sm">Keep answering to set a record</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-blue-200" />
          </motion.button>
        </section>

        {/* Practice Modes */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Practice Mode</h3>
            <button 
              onClick={onViewLeaderboard}
              className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline"
            >
              Leaderboards
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStartGame(GameMode.PRACTICE, cat.id)}
                className="w-full bg-gray-50 rounded-3xl p-6 flex items-center justify-between hover:bg-gray-100 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-3 h-12 rounded-full ${cat.color}`} />
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-gray-900">{cat.label}</h4>
                    <p className="text-gray-500 text-xs font-medium">{cat.text}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score: {user?.stats[cat.id] || 0}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
