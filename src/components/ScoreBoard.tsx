import React from 'react';
import { Award, Zap, Timer } from 'lucide-react';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  timeLeft: number;
  combo: number;
  totalTime?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  timeLeft,
  combo,
  totalTime = 60
}) => {
  // Circular progress SVG constants
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (Math.max(0, timeLeft) / totalTime) * circumference;

  // Determine timer color theme based on urgency
  let timerColorClass = 'text-teal-500 dark:text-teal-400';
  let timerBgCircle = 'stroke-slate-200 dark:stroke-slate-800';
  let pulseClass = '';

  if (timeLeft <= 10) {
    timerColorClass = 'text-rose-500 dark:text-rose-400';
    pulseClass = 'animate-pulse';
  } else if (timeLeft <= 25) {
    timerColorClass = 'text-amber-500 dark:text-amber-400';
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
            <span className={`text-[15px] font-extrabold font-mono tracking-tighter ${timeLeft <= 10 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Timer className="w-3 h-3" />
            制限時間
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
            {timeLeft <= 10 ? '時間切れ間近！' : '正解で+5秒'}
          </span>
        </div>
      </div>

      {/* Score Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            スコア
          </span>
          {combo > 1 && (
            <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-bounce">
              <Zap className="w-2.5 h-2.5 fill-white" />
              {combo}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400" id="current-score-val">
            {score}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">問正解</span>
        </div>
      </div>

      {/* High Score Widget */}
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

    </div>
  );
};
