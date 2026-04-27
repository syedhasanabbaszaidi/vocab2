import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Trophy,
  Brain
} from 'lucide-react';
import { generateVocabQuestions, VocabQuestion } from '../services/geminiService';
import { Difficulty, GameMode } from '../types';
import { db } from '../lib/firebase';
import { 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  setDoc,
  collection,
  addDoc
} from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import { OperationType, handleFirestoreError } from '../utils/firestoreErrorHandler';

interface GameProps {
  difficulty: Difficulty;
  mode: GameMode;
  onClose: () => void;
}

export default function Game({ difficulty, mode, onClose }: GameProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<VocabQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [difficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    const newQuestions = await generateVocabQuestions(difficulty, mode === GameMode.STREAK ? 10 : 5);
    setQuestions(newQuestions);
    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    if (answered !== null) return;
    setAnswered(index);
    const isCorrect = index === questions[currentIndex].correctIndex;
    
    if (isCorrect) {
      setScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      if (mode === GameMode.STREAK) {
        // In streak mode, one wrong answer ends the game if we want it hard, 
        // but let's just make it finish current set.
      }
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setAnswered(null);
    } else {
      if (mode === GameMode.STREAK && streak === questions.length) {
        // Load more questions for streak mode
        setLoading(true);
        const moreQuestions = await generateVocabQuestions(difficulty, 5);
        setQuestions([...questions, ...moreQuestions]);
        setLoading(false);
        setCurrentIndex(currentIndex + 1);
        setAnswered(null);
      } else {
        finishGame();
      }
    }
  };

  const finishGame = async () => {
    setGameComplete(true);
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData: any = {
        [`stats.${difficulty}`]: increment(score)
      };

      if (mode === GameMode.DAILY) {
        updateData['stats.lastDailyChallenge'] = new Date().toISOString();
        updateData['stats.dailyStreak'] = increment(1);
      }

      await updateDoc(userRef, updateData);

      // Log game
      await addDoc(collection(db, 'games'), {
        userId: user.uid,
        score,
        difficulty,
        mode,
        createdAt: serverTimestamp()
      });

      // Update leaderboard
      const lbRef = doc(db, 'leaderboards', difficulty, 'scores', user.uid);
      await setDoc(lbRef, {
        userId: user.uid,
        displayName: user.displayName || 'Scholar',
        score: increment(score),
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'game_results');
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100">
            <Brain className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2 italic">VocabMaster</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Curating your challenges...</p>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-8 text-center font-sans">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-indigo-200"
        >
          <Trophy className="w-16 h-16 text-white" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight italic">VocabMaster Mastered</h2>
        <p className="text-slate-500 mb-8 max-w-xs">You've successfully expanded your mental lexicon.</p>
        
        <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm mb-12 flex justify-around border border-slate-200 shadow-xl shadow-slate-200/50">
          <div>
            <div className="text-3xl font-black text-slate-900">{score.toLocaleString()}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">XP Gained</div>
          </div>
          <div className="w-px bg-slate-100" />
          <div>
            <div className="text-3xl font-black text-slate-900">{currentIndex + 1}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Word count</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full max-w-sm py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans">
      {/* Progress Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-200 h-16">
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              className="h-full bg-indigo-600"
            />
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-right">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full py-8 md:py-16 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs italic">Q</div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Contextual Definition</h2>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-12 italic">
               "{currentQ.definition}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  disabled={answered !== null}
                  onClick={() => handleAnswer(idx)}
                  className={`
                    w-full p-6 text-left rounded-3xl border border-slate-200 transition-all flex items-center justify-between font-bold text-lg shadow-sm
                    ${answered === null ? 'bg-white hover:border-indigo-600 hover:bg-indigo-50/30' : ''}
                    ${answered === idx && idx === currentQ.correctIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-emerald-50' : ''}
                    ${answered === idx && idx !== currentQ.correctIndex ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-rose-50' : ''}
                    ${answered !== null && idx === currentQ.correctIndex ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-emerald-50' : ''}
                  `}
                >
                  {option}
                  {answered !== null && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {answered === idx && idx !== currentQ.correctIndex && (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {answered !== null && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="mt-12"
              >
                <div className={`p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl ${answered === currentQ.correctIndex ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-900 shadow-slate-200'}`}>
                  <div className="text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">
                      {answered === currentQ.correctIndex ? 'Precision Achieved' : 'Vocabulary Expanded'}
                    </p>
                    <div className="text-2xl font-bold italic">
                       {currentQ.word}
                    </div>
                  </div>
                  <button 
                    onClick={nextQuestion}
                    className="p-4 bg-white rounded-2xl text-slate-900 shadow-xl active:scale-95 transition-transform"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
