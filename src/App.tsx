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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
