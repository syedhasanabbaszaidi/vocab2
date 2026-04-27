import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Difficulty } from '../types';
import { Trophy, ArrowLeft, Loader2, Sparkles, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { OperationType, handleFirestoreError } from '../utils/firestoreErrorHandler';

interface LeaderboardProps {
  onClose: () => void;
}

interface ScoreEntry {
  userId: string;
  displayName: string;
  score: number;
}

export default function Leaderboard({ onClose }: LeaderboardProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'leaderboards', difficulty, 'scores'),
      orderBy('score', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        userId: doc.id,
        ...(doc.data() as Omit<ScoreEntry, 'userId'>)
      }));
      setScores(results);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `leaderboards/${difficulty}/scores`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [difficulty]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-10">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between bg-white border-b border-gray-100">
        <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black tracking-tight uppercase">Leaderboard</h1>
        <div className="w-11" />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Difficulty Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {Object.values(Difficulty).map((val) => (
            <button
              key={val}
              onClick={() => setDifficulty(val)}
              className={`
                px-6 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all flex-1
                ${difficulty === val ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white text-gray-400 border border-transparent'}
              `}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Podium / Top Rank */}
        <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-gray-200/50 border border-gray-100 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Loading ranks...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">No scores for this level yet.<br/>Be the first to rank!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {scores.map((score, index) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={score.userId}
                  className="flex items-center justify-between p-5 group"
                >
                  <div className="flex items-center gap-5">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 text-gray-600' : 
                        index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{score.displayName}</div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scholar</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xl font-black text-gray-900 tracking-tight">{score.score.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total XP</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
