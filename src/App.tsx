/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthProvider';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { Difficulty, GameMode } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeGame, setActiveGame] = useState<{ mode: GameMode, difficulty: Difficulty } | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">VocabMaster Initializing</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Dashboard 
        onStartGame={(mode, difficulty) => setActiveGame({ mode, difficulty })}
        onViewLeaderboard={() => setShowLeaderboard(true)}
      />

      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50"
          >
            <Game 
              mode={activeGame.mode}
              difficulty={activeGame.difficulty}
              onClose={() => setActiveGame(null)}
            />
          </motion.div>
        )}

        {showLeaderboard && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <Leaderboard onClose={() => setShowLeaderboard(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
