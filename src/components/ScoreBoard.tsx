import React from 'react';
import { Award, Zap, Timer, Infinity, LogOut } from 'lucide-react';
import { GameMode } from '../types';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  timeLeft: number;
  combo: number;
  totalTime?: number;
  mode: GameMode;
  onExit?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  timeLeft,
  combo,
  totalTime = 60,
  mode,
  onExit
}) => {
  const isPractice = mode === 'practice';

  // Circular progress SVG constants
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = isPractice 
    ? 0 
    : circumference - (Math.max(0, timeLeft) / totalTime) * circumference;

  // Determine timer color theme based on urgency
  let timerColorClass = 'text-teal-500 dark:text-teal-400';
  let timerBgCircle = 'stroke-slate-200 dark:stroke-slate-800';
  let pulseClass = '';

  if (!isPractice) {
    if (timeLeft <= 10) {
      timerColorClass = 'text-rose-500 dark:text-rose-400';
      pulseClass = 'animate-pulse';
    } else if (timeLeft <= 25) {
      timerColorClass = 'text-amber-500 dark:text-amber-400';
    }
  } else {
    timerColorClass = 'text-indigo-500 dark:text-indigo-400';
  }

  return (
    <div className="w-full max-w-lg grid grid-cols-3 gap-3 mb-6" id="make_ten_scoreboard">
      
      {/* Timer Display Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 shadow-sm relative overflow-hidden">
        <div className={`relative w-12 h-12 flex-shrink-0 flex items-center justify-center ${pulseClass}`}>
          {/* Circular Countdown Tracker */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r={radius}
              className={`${timerBgCircle} fill-transparent`}
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              className={`${timerColorClass} fill-transparent transition-all duration-1000 ease-linear`}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isPractice ? (
              <Infinity className="w-5 h-5 text-indigo-500" />
            ) : (
              <span className={`text-[15px] font-extrabold font-mono tracking-tighter ${timeLeft <= 10 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                {Math.ceil(timeLeft)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Timer className="w-3 h-3" />
            制限時間
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {isPractice ? '無制限 (練習中)' : (timeLeft <= 10 ? '時間切れ間近！' : '正解で+5秒')}
          </span>
        </div>
      </div>

      {/* Score Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            スコア
          </span>
          {combo > 1 && !isPractice && (
            <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-bounce">
              <Zap className="w-2.5 h-2.5 fill-white" />
              {combo}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          {isPractice ? (
            <span className="text-sm font-bold text-slate-400 leading-none">
              練習中
            </span>
          ) : (
            <>
              <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400" id="current-score-val">
                {score}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">問正解</span>
            </>
          )}
        </div>
      </div>

      {/* High Score / Exit Practice Widget */}
      {isPractice && onExit ? (
        <button
          onClick={onExit}
          id="btn-exit-practice"
          className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-900/30 flex flex-col justify-between items-start shadow-sm cursor-pointer transition text-left"
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" />
            退出
          </span>
          <span className="text-xs font-bold mt-1 text-amber-800 dark:text-amber-200">
            練習を終了
          </span>
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              ハイスコア
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black font-mono text-slate-800 dark:text-slate-100" id="high-score-val">
              {highScore}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">問</span>
          </div>
        </div>
      )}

    </div>
  );
};
