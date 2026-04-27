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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header Navigation */}
      <nav className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="text-xl font-semibold tracking-tight italic">VocabMaster</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Global XP</p>
            <p className="text-sm font-semibold">{totalScore.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden shadow-sm">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                   {(user?.displayName || 'S')[0]}
                 </div>
               )}
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column: Daily & Personal Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Daily Challenge Card */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className={`rounded-[2.5rem] p-8 text-white shadow-2xl flex flex-col justify-between h-72 transition-all ${isDailyDone ? 'bg-emerald-600 shadow-emerald-100' : 'bg-indigo-600 shadow-indigo-100'}`}
          >
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                {isDailyDone ? 'Daily Complete' : 'Daily Challenge'}
              </span>
              <h2 className="text-4xl font-bold italic leading-tight mb-2">
                {isDailyDone ? 'Mastery Achieved' : '5 Words to Mastery'}
              </h2>
              <p className="opacity-80 text-sm font-medium">
                {isDailyDone ? 'Review your new words tomorrow!' : "Complete today's curation to earn 50 bonus XP."}
              </p>
            </div>
            {!isDailyDone && (
              <button 
                onClick={() => onStartGame(GameMode.DAILY, Difficulty.MIXED)}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all shadow-lg shadow-black/5"
              >
                Start Challenge
              </button>
            )}
            {isDailyDone && (
              <div className="flex items-center gap-3 bg-white/20 p-4 rounded-2xl text-emerald-50">
                <CheckCircle2 className="w-6 h-6" />
                <span className="font-bold text-sm">Challenge Synced</span>
              </div>
            )}
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Best Streak</p>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <p className="text-2xl font-black italic">{user?.stats.dailyStreak || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Accuracy</p>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <p className="text-2xl font-black italic">88%</p>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm col-span-2">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center">Scholar Projection</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalScore / 500) * 100, 100)}%` }}
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-slate-400">Level 1</span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">{totalScore} / 500 XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Primary Modes */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-lg font-bold tracking-tight">Choose Your Path</h3>
               <button 
                 onClick={onViewLeaderboard}
                 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 group"
               >
                 Hall of Fame <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
            
            <div className="flex-1 space-y-6">
              {/* Infinite Streak Mode */}
              <motion.div 
                whileHover={{ y: -4 }}
                onClick={() => onStartGame(GameMode.STREAK, Difficulty.MIXED)}
                className="group cursor-pointer p-8 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:border-indigo-600 hover:bg-white transition-all shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                       <h4 className="text-2xl font-bold tracking-tight">Infinite Streak</h4>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Endless linguistic challenge. Build your streak.</p>
                  </div>
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-lg">
                    <Target className="w-7 h-7" />
                  </div>
                </div>
              </motion.div>

              {/* Practice Sessions */}
              <div className="pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 px-1">Curated Sessions</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {categories.map((cat) => (
                    <button 
                      key={cat.id}
                      onClick={() => onStartGame(GameMode.PRACTICE, cat.id)}
                      className={`h-24 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2 transition-all group
                        ${cat.id === Difficulty.MIXED ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-700 hover:border-indigo-600 hover:shadow-lg'}
                      `}
                    >
                      <div className={`w-3 h-1 rounded-full ${cat.color} mb-1 opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <span className="text-sm font-bold tracking-tight">{cat.label}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${cat.id === Difficulty.MIXED ? 'text-slate-500' : 'text-slate-300'}`}>
                        {user?.stats[cat.id] || 0} XP
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <footer className="mt-auto py-8">
               <div className="w-full h-px bg-slate-50 mb-8" />
               <p className="text-center text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">Creator Hasan Abbas</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
