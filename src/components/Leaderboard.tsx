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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      {/* Header */}
      <nav className="h-16 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight italic">Hall of Fame</h1>
        <div className="w-10" />
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Difficulty Tabs */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
          {Object.values(Difficulty).map((val) => (
            <button
              key={val}
              onClick={() => setDifficulty(val)}
              className={`
                px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all flex-1
                ${difficulty === val ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300'}
              `}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Backdrop Card */}
        <div className="bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-slate-200 border border-slate-200 min-h-[500px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-6">
              <div className="relative">
                 <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                 <Trophy className="w-6 h-6 text-indigo-600/30 absolute inset-0 m-auto" />
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Synchronizing ranks</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-32 gap-6 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200">
                <Sparkles className="w-10 h-10" />
              </div>
              <div>
                <p className="text-slate-900 font-bold text-lg italic mb-1">Untapped Territory</p>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Be the first to claim your throne</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 px-4 py-4">
              {scores.map((score, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={score.userId}
                  className="flex items-center justify-between p-6 group hover:bg-slate-50 rounded-3xl transition-colors cursor-default"
                >
                  <div className="flex items-center gap-6">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg italic
                      ${index === 0 ? 'bg-amber-100 text-amber-700 shadow-lg shadow-amber-100' : 
                        index === 1 ? 'bg-slate-100 text-slate-600' : 
                        index === 2 ? 'bg-orange-50 text-orange-700' : 'text-slate-300'}
                    `}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {score.displayName}
                        {index === 0 && <Sparkles className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Linguistic Scholar</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-black text-slate-900 tracking-tight italic">{score.score.toLocaleString()}</div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Global XP</div>
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
