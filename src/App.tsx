/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameStatus, HistoryItem, GameMode, Difficulty } from './types';
import { generateMake10Puzzle } from './utils/solver';
import { sound } from './utils/sound';
import { GameBoard } from './components/GameBoard';
import { ScoreBoard } from './components/ScoreBoard';
import { HistoryPanel } from './components/HistoryPanel';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Info,
  Clock,
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

export default function App() {
  // Game states
  const [status, setStatus] = useState<GameStatus>('idle');
  const [gameMode, setGameMode] = useState<GameMode>('challenge');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default: 60s (1 min)
  const [timeLeft, setTimeLeft] = useState(60);
  const [combo, setCombo] = useState(0);

  // Active puzzle states
  const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
  const [currentSolutions, setCurrentSolutions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(0);

  // Sessions log
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // UI state managers
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [confetti, setConfetti] = useState<{ id: string; x: number; y: number; color: string; size: number }[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // Load high score from localStroage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('make10_high_score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Timer interval hook
  useEffect(() => {
    if (status !== 'playing' || gameMode === 'practice') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTriggerGameOver();
          return 0;
        }
        // Play ticking cue in the last 10 seconds of game
        if (prev <= 10.5) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, gameMode]);

  // Handle game termination
  const handleTriggerGameOver = () => {
    sound.playFail();
    setStatus('gameover');
    
    // Check and save high score
    const currentHighScore = parseInt(localStorage.getItem('make10_high_score') || '0', 10);
    if (score > currentHighScore) {
      localStorage.setItem('make10_high_score', score.toString());
      setHighScore(score);
      setIsNewHighScore(true);
    } else {
      setIsNewHighScore(false);
    }
  };

  // Start new game
  const handleStartGame = (mode: GameMode = 'challenge') => {
    sound.playSelect();
    setGameMode(mode);
    setScore(0);
    setCombo(0);
    setTimeLeft(mode === 'challenge' ? selectedDuration : 9999);
    setHistory([]);
    setIsNewHighScore(false);
    setAlertMsg(null);
    
    // Generate first puzzle
    const puzzle = generateMake10Puzzle(difficulty);
    setCurrentNumbers(puzzle.numbers);
    setCurrentSolutions(puzzle.solutions);
    
    setStartTime(Date.now());
    setStatus('playing');
  };

  // Handle puzzle completion (Solved successfully!)
  const handleSolve = (userExpr: string) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Add puzzle to session history log
    const resolvedItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      numbers: [...currentNumbers],
      solution: currentSolutions[0] || '',
      userExpression: userExpr,
      isSolved: true,
      timeTaken: timeSpent,
      passed: false
    };

    setHistory((prev) => [resolvedItem, ...prev]);
    
    // Generate visual floating confetti burst
    triggerBurst();

    if (gameMode === 'challenge') {
      // Adjust gameplay parameters
      setScore((prev) => {
        const nextScore = prev + 1;
        // Real-time update high score visual feedback
        if (nextScore > highScore) {
          setHighScore(nextScore);
        }
        return nextScore;
      });
      setCombo((prev) => prev + 1);

      // Apply Time Bonus! +5 seconds, capped at selectedDuration maximum total
      setTimeLeft((prev) => Math.min(selectedDuration, prev + 5));
    }

    // Wait a brief moment before transition so the user can cherish the victory feel
    setTimeout(() => {
      loadNextPuzzle();
    }, 700);
  };

  // Handle puzzle skip/pass
  const handlePass = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    
    // Add to logs as passed
    const passedItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      numbers: [...currentNumbers],
      solution: currentSolutions[0] || '',
      userExpression: '',
      isSolved: false,
      timeTaken: timeSpent,
      passed: true
    };

    setHistory((prev) => [passedItem, ...prev]);

    // Break combo streak
    setCombo(0);

    // Bring next question
    loadNextPuzzle();
  };

  const handleExitPractice = () => {
    sound.playSelect();
    setStatus('idle');
  };

  const loadNextPuzzle = () => {
    const nextPuzzle = generateMake10Puzzle(difficulty);
    setCurrentNumbers(nextPuzzle.numbers);
    setCurrentSolutions(nextPuzzle.solutions);
    setStartTime(Date.now());
    setAlertMsg(null);
  };

  const triggerBurst = () => {
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#eab308'];
    const particles = Array.from({ length: 30 }, (_, index) => ({
      id: `conf-${Date.now()}-${index}`,
      x: 30 + Math.random() * 40, // Central range 30% to 70%
      y: 20 + Math.random() * 30, // Upper central zone
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10
    }));

    setConfetti(particles);
    // Clear out after animation ends
    setTimeout(() => {
      setConfetti([]);
    }, 1800);
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans transition-colors duration-200" id="main_app_root">
      
      {/* Floating Confetti Layer */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ x: `${particle.x}vw`, y: `${particle.y}vh`, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            y: '105vh',
            x: `${particle.x + (Math.random() * 24 - 12)}vw`,
            rotate: Math.random() * 720 - 360,
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.4]
          }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          className="absolute rounded-full pointer-events-none z-50 shadow"
        />
      ))}

      {/* Top Navigation Global Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => {
            sound.playSelect();
            setStatus('idle');
          }}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold transition text-sm cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="font-extrabold tracking-tight font-sans text-slate-800">メイクテン パズル</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mute Toggle Button */}
          <button
            onClick={handleToggleMute}
            id="toggle-mute-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={isMuted ? 'ミュート解除' : 'ミュートする'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Quick Help Toggle */}
          <button
            onClick={() => {
              sound.playSelect();
              setShowInstructions(true);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="遊び方"
          >
            <BookOpen className="w-5 h-5" />
            <span className="hidden sm:inline">遊び方</span>
          </button>
        </div>
      </header>

      {/* Primary Container Viewport */}
      <main className="flex-grow flex items-center justify-center p-4">
        
        {/* State 1: IDLE / STARTING SCREEN */}
        {status === 'idle' && (
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/50 shadow-xl flex flex-col items-center transition relative overflow-hidden" id="idle_container">
            {/* Background design accents */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
            
            <div className="mb-6 w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm">
              <span className="text-4xl font-extrabold text-indigo-600 font-mono select-none">10</span>
            </div>

            <h1 className="text-3xl font-black text-slate-900 text-center tracking-tight mb-2">
              メイクテン パズル
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm leading-relaxed mb-6 max-w-sm">
              ランダムに表示される4つの数字を、四則演算（+、-、*、/）とカッコ（組み合わせ順）を使って <span className="font-bold text-slate-800">ぴったり10にする</span> 計算ゲームです。
            </p>

            {/* Quick stats board */}
            {highScore > 0 && (
              <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  あなたの現在の最高記録
                </span>
                <span className="text-2xl font-black font-mono text-slate-800">{highScore}問クリア</span>
              </div>
            )}

            {/* Custom Duration Selector Panel */}
            <div className="w-full mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Clock className="w-4 h-4 text-indigo-500" />
                チャレンジモードの制限時間
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[60, 120, 180, 240, 300].map((dur) => {
                  const isDurSelected = selectedDuration === dur;
                  return (
                    <button
                      key={dur}
                      onClick={() => {
                        sound.playSelect();
                        setSelectedDuration(dur);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer
                        ${isDurSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-102 font-extrabold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:text-slate-800'
                        }`}
                    >
                      {dur / 60}分
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Difficulty Selector Panel */}
            <div className="w-full mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                ゲームの難易度
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['easy', 'normal', 'hard', 'veryhard'] as Difficulty[]).map((diff) => {
                  const isDiffSelected = difficulty === diff;
                  const labelMap: Record<Difficulty, string> = {
                    easy: 'Easy',
                    normal: 'Normal',
                    hard: 'Hard',
                    veryhard: 'VeryHard'
                  };
                  return (
                    <button
                      key={diff}
                      onClick={() => {
                        sound.playSelect();
                        setDifficulty(diff);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer
                        ${isDiffSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm scale-102 font-extrabold' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:text-slate-800'
                        }`}
                    >
                      {labelMap[diff]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pl-1 transition-all">
                {difficulty === 'easy' && '🟢 Easy: 足し算・引き算のみで10にできます。'}
                {difficulty === 'normal' && '🟡 Normal: 足し算・引き算・掛け算のみで10にできます。'}
                {difficulty === 'hard' && '🟠 Hard: 四則演算すべて、途中で分数が発生せず解けます。'}
                {difficulty === 'veryhard' && '🔴 VeryHard: 割り切れない割り算、計算途中で分数（分母が1以外）が発生することがあります。'}
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-3">
              <button
                onClick={() => handleStartGame('challenge')}
                id="btn-start-game"
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-extrabold shadow-lg hover:bg-indigo-700 transition duration-150 flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>チャレンジ開始 ({selectedDuration / 60}分制限)</span>
              </button>

              <button
                onClick={() => handleStartGame('practice')}
                id="btn-start-practice"
                className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-md hover:bg-emerald-700 transition duration-150 flex items-center justify-center gap-2 group cursor-pointer"
              >
                🧘
                <span>練習モードで遊ぶ (時間無制限・退出可)</span>
              </button>

              <button
                onClick={() => {
                  sound.playSelect();
                  setShowInstructions(true);
                }}
                className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer text-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>詳しい遊び方のルール</span>
              </button>
            </div>
            
            <div className="mt-8 text-center text-[11px] text-slate-400 flex items-center gap-1 font-mono justify-center">
              <Clock className="w-3 h-3" />
              チャレンジモードでは、1正解ごとに+5秒のボーナス（最大設定時間まで）
            </div>
          </div>
        )}

        {/* State 2: PLAYING ACTIVE SCRUM */}
        {status === 'playing' && (
          <div className="w-full max-w-lg flex flex-col items-center" id="playing_container">
            
            {/* Score and Timer board */}
            <ScoreBoard
              score={score}
              highScore={highScore}
              timeLeft={timeLeft}
              combo={combo}
              totalTime={selectedDuration}
              mode={gameMode}
              onExit={handleExitPractice}
            />

            {/* Alert Message Box */}
            <div className="h-6 mb-2 flex items-center justify-center">
              <AnimatePresence>
                {alertMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="bg-amber-50 border border-amber-200/50 text-amber-800 font-medium rounded-xl p-1 px-4 text-xs shadow-sm"
                    id="toast-alert"
                  >
                    ⚠️ {alertMsg}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center interactive game canvas */}
            <GameBoard
              initialNumbers={currentNumbers}
              solutions={currentSolutions}
              onSolved={handleSolve}
              onPassed={handlePass}
              onAlert={setAlertMsg}
              isTimeUp={timeLeft <= 0}
            />
          </div>
        )}

        {/* State 3: GAMEOVER SUMMARY SCREEN */}
        {status === 'gameover' && (
          <div className="w-full max-w-lg bg-white rounded-3xl p-8 border border-slate-200/50 shadow-xl flex flex-col items-center transition relative overflow-hidden" id="gameover_container">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />

            <div className="mb-4 w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
              <Clock className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1">
              タイムアップ！
            </h2>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-6">
              制限時間1分が経過しました
            </p>

            {/* High score celebrate or general statistics showcase */}
            <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center mb-6">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                今回の正解数
              </span>
              <div className="text-5xl font-black font-mono text-indigo-600 mb-4">
                {score} <span className="text-base font-bold text-slate-500">問</span>
              </div>

              {isNewHighScore ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 animate-bounce shadow-sm">
                  <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
                  自己ベスト更新！
                </div>
              ) : (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-slate-300" />
                  これまでの自己ベスト: {highScore}問
                </div>
              )}
            </div>

            {/* Quick Action buttons */}
            <div className="w-full grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={handleStartGame}
                id="btn-replay"
                className="col-span-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition-all shadow duration-150 flex items-center justify-center gap-1.5 text-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                もう一度挑戦
              </button>

              <button
                onClick={() => {
                  sound.playSelect();
                  setStatus('idle');
                }}
                className="col-span-1 py-3.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all duration-150 text-sm cursor-pointer"
              >
                タイトルに戻る
              </button>
            </div>

            {/* Dynamic visual log of solved/passed cards */}
            <HistoryPanel history={history} />
          </div>
        )}

      </main>

      {/* Global Bottom Footer Brand */}
      <footer className="py-4 text-center text-slate-400 dark:text-slate-500 text-[11px] font-mono border-t border-slate-100/50 flex-shrink-0">
        <div>Make 10 Puzzle - © 4 Numbers Calculator Fight</div>
      </footer>

      {/* Rules overlay instructions modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="instructions_modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => {
                  sound.playSelect();
                  setShowInstructions(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">メイクテンのルール・遊び方</h2>
              </div>

              <div className="space-y-4 text-slate-600 dark:text-slate-400 text-xs leading-relaxed max-h-[400px] overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                    メイクテンとは？
                  </h4>
                  <p>
                    「メイクテン」（テンパズル）は、表示される4つの数字すべてを使って10を作るパズルゲームです。
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                    操作のながれ
                  </h4>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 text-[11px]">
                    <li>
                      <span className="font-bold text-slate-700">1枚目の数字</span>をタップして選択します。
                    </li>
                    <li>
                      画面下部の四則演算ボタン <span className="font-bold text-indigo-600">（＋、－、×、÷）</span> からオペレータを1つ選択します。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">2枚目の数字</span>をタップすると、2つのカードが合体して計算結果になります。
                      <br />
                      <span className="text-slate-400">※（例： 8 ➔ / ➔ 4 で 2になり、(8 / 4)の数式カードへ合体）</span>
                    </li>
                    <li>
                      合体を繰り返し、最後にカードが1枚かつ数値がぴったり「10」になれば正解です！
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                    特別な機能・ルール
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>
                      <span className="font-bold text-slate-700">タイムアタック制：</span> 正解するごとに、タイムリミットに <span className="text-emerald-500 font-bold">+5秒</span> のボーナスが加算されます（最大60秒まで）。速く解けば解くほどスコアを伸ばせます！
                    </li>
                    <li>
                      <span className="font-bold text-slate-705">分数（割り算）：</span> 割り切れない数（例： 8 ÷ 3）を計算すると、カードは自動的に <span className="font-bold text-slate-800">分数 8/3</span> として保持されます。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">パスとヒント：</span> 解き方がわからない場合はいつでも「パス」して次の問題へいけます。また、「ヒント」をクリックすると作れる解の数式をいつでも1例表示できます。
                    </li>
                    <li>
                      <span className="font-bold text-slate-700">戻す＆リセット：</span> 間違えたときは、「戻す」ボタンで1ステップ戻ったり、「リセット」で初期配置からやり直せます。
                    </li>
                  </ul>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playSelect();
                  setShowInstructions(false);
                }}
                className="w-full mt-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold transition-all text-sm cursor-pointer"
              >
                閉じる
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
