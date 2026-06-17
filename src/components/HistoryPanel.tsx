import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { solveMake10 } from '../utils/solver';
import { CheckCircle2, AlertTriangle, Eye, EyeOff, Search, HelpCircle, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryPanelProps {
  history: HistoryItem[];
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history }) => {
  // Store which item IDs have their solution list visible
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  if (history.length === 0) {
    return (
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 text-center text-slate-400 dark:text-slate-500 font-medium text-sm">
        <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-500" />
        ここにプレイした問題の履歴が表示されます。
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm" id="make_ten_history_panel">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">今回のプレイ履歴・解説</h3>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
        {history.map((item, index) => {
          const isExpanded = expandedItemId === item.id;
          const allSolutions = solveMake10(item.numbers);

          return (
            <div
              key={item.id}
              className={`border rounded-xl transition duration-150 overflow-hidden ${
                item.isSolved
                  ? 'bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-100 darK:border-emerald-900/30'
                  : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              {/* Header block */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/40 dark:hover:bg-slate-700/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                    Q{index + 1}
                  </span>
                  
                  {/* Initial numbers bubble list */}
                  <div className="flex gap-1" id={`nums-bubble-${item.id}`}>
                    {item.numbers.map((n, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-mono text-xs font-extrabold text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  <span className="text-slate-300 dark:text-slate-600 font-light mx-1">|</span>
                  
                  {item.isSolved ? (
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[120px] sm:max-w-[180px]">
                      {item.userExpression}
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      パスしました
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    {item.timeTaken}秒
                  </span>
                  
                  {item.isSolved ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}

                  {isExpanded ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Collapsed solutions section */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-bold text-indigo-500 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        作れる解の例（全 {allSolutions.length} 通り）：
                      </div>
                      
                      {allSolutions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono max-h-[140px] overflow-y-auto mt-1 bg-white dark:bg-slate-850 p-2.5 rounded-lg border border-slate-150 dark:border-slate-750">
                          {allSolutions.slice(0, 10).map((sol, sIdx) => (
                            <div
                              key={sIdx}
                              className="bg-slate-50 dark:bg-slate-800 p-1 px-2 rounded col-span-1 text-slate-700 dark:text-slate-200 border-l-2 border-indigo-500 text-[11px]"
                            >
                              {sol}
                            </div>
                          ))}
                          {allSolutions.length > 10 && (
                            <div className="col-span-full text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1 italic">
                              ほか {allSolutions.length - 10} 通りの解があります
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                          数式がありません（通常、ゲーム内では解が存在する問題のみ出現します）
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
