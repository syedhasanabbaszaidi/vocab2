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
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="mb-6"
        >
          <Brain className="w-16 h-16 text-blue-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Challenges</h2>
        <p className="text-gray-500">Sharpening the words for your level...</p>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mb-8"
        >
          <Trophy className="w-16 h-16 text-yellow-600" />
        </motion.div>
        <h2 className="text-4xl font-black text-gray-900 mb-2">Well Done!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">You mastered the vocabulary set and earned XP.</p>
        
        <div className="bg-gray-50 rounded-3xl p-8 w-full max-w-sm mb-12 flex justify-around border border-gray-100">
          <div>
            <div className="text-3xl font-black text-gray-900">{score}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-3xl font-black text-gray-900">{currentIndex + 1}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Words</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full max-w-sm py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col font-sans">
      {/* Progress Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-400 hover:text-gray-900">
          <X className="w-6 h-6" />
        </button>
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              className="h-full bg-blue-600"
            />
          </div>
        </div>
        <div className="text-sm font-bold text-gray-400 tracking-tighter">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <main className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full py-12 flex-1 flex flex-col">
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-6">Definition</h2>
            <p className="text-2xl md:text-3xl font-medium text-gray-900 leading-tight mb-12">
               "{currentQ.definition}"
            </p>

            <div className="space-y-4">
              {currentQ.options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  disabled={answered !== null}
                  onClick={() => handleAnswer(idx)}
                  className={`
                    w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center justify-between font-bold text-lg
                    ${answered === null ? 'border-gray-100 hover:border-gray-200 hover:bg-gray-50' : ''}
                    ${answered === idx && idx === currentQ.correctIndex ? 'border-green-500 bg-green-50 text-green-900' : ''}
                    ${answered === idx && idx !== currentQ.correctIndex ? 'border-red-500 bg-red-50 text-red-900' : ''}
                    ${answered !== null && idx === currentQ.correctIndex ? 'border-green-500 bg-green-50 text-green-900' : ''}
                  `}
                >
                  {option}
                  {answered !== null && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                  )}
                  {answered === idx && idx !== currentQ.correctIndex && (
                    <XCircle className="w-6 h-6 text-red-600 shrink-0" />
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
                className="mt-8"
              >
                <div className={`p-6 rounded-[2rem] flex items-center justify-between shadow-2xl ${answered === currentQ.correctIndex ? 'bg-green-600' : 'bg-red-600'}`}>
                  <div className="text-white">
                    <div className="text-sm font-bold uppercase tracking-widest opacity-80">
                      {answered === currentQ.correctIndex ? 'Amazing!' : 'Not quite'}
                    </div>
                    <div className="text-xl font-bold">
                      The word is <span className="underlineDecoration-white">{currentQ.word}</span>
                    </div>
                  </div>
                  <button 
                    onClick={nextQuestion}
                    className="p-4 bg-white rounded-2xl text-gray-900 shadow-md active:scale-95 transition-transform"
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
