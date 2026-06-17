import React, { useState, useEffect } from 'react';
import { CardItem, Fraction } from '../types';
import {
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  formatFraction,
  fractionEquals
} from '../utils/solver';
import { sound } from '../utils/sound';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, X, Percent, RotateCcw, HelpCircle, ArrowRight, CornerUpLeft } from 'lucide-react';

interface GameBoardProps {
  initialNumbers: number[];
  solutions: string[];
  onSolved: (userExpression: string) => void;
  onPassed: () => void;
  onAlert: (msg: string | null) => void;
  isTimeUp: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  initialNumbers,
  solutions,
  onSolved,
  onPassed,
  onAlert,
  isTimeUp
}) => {
  // Active cards on board
  const [cards, setCards] = useState<CardItem[]>([]);
  // Selected card IDs
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // Selected operator
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  // Undo history stack
  const [historyStack, setHistoryStack] = useState<CardItem[][]>([]);
  // Help hint state
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  // Initialize board for new numbers
  useEffect(() => {
    initializeBoard();
  }, [initialNumbers]);

  const initializeBoard = () => {
    const freshCards: CardItem[] = initialNumbers.map((num, index) => ({
      id: `card-init-${index}-${num}-${Math.random().toString(36).substr(2, 4)}`,
      value: { num, den: 1 },
      expression: num.toString(),
      originalNumbers: [index],
    }));
    setCards(freshCards);
    setSelectedCardId(null);
    setSelectedOp(null);
    setHistoryStack([]);
    setShowHint(false);
    setHintIndex(0);
    onAlert(null);
  };

  // Selection Handler
  const handleCardClick = (cardId: string) => {
    if (isTimeUp) return;
    sound.playSelect();

    // If no card is selected, select this one
    if (!selectedCardId) {
      setSelectedCardId(cardId);
      onAlert(null);
      return;
    }

    // Tapping the same card deselects it
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
      setSelectedOp(null);
      return;
    }

    // If card selected and operator is selected, perform combine
    if (selectedCardId && selectedOp) {
      const card1 = cards.find(c => c.id === selectedCardId);
      const card2 = cards.find(c => c.id === cardId);

      if (card1 && card2) {
        combineCards(card1, card2, selectedOp);
      }
    } else {
      // If a different card is clicked but no operator is selected, change active selection
      setSelectedCardId(cardId);
    }
  };

  const handleOpClick = (op: string) => {
    if (isTimeUp) return;
    if (!selectedCardId) {
      onAlert("先にカードを1つ選んでください。");
      return;
    }
    sound.playSelect();
    setSelectedOp(selectedOp === op ? null : op);
  };

  const combineCards = (c1: CardItem, c2: CardItem, op: string) => {
    let resultVal: Fraction | null = null;
    let textExpr = '';

    // Guard division by zero
    if (op === '/' && c2.value.num === 0) {
      sound.playFail();
      onAlert("0で割ることはできません！");
      setSelectedOp(null);
      return;
    }

    // Perform calculation based on the exact click order
    switch (op) {
      case '+':
        resultVal = addFractions(c1.value, c2.value);
        textExpr = `(${c1.expression} + ${c2.expression})`;
        break;
      case '-':
        resultVal = subtractFractions(c1.value, c2.value);
        textExpr = `(${c1.expression} - ${c2.expression})`;
        break;
      case '*':
        resultVal = multiplyFractions(c1.value, c2.value);
        textExpr = `(${c1.expression} * ${c2.expression})`;
        break;
      case '/':
        resultVal = divideFractions(c1.value, c2.value);
        textExpr = `(${c1.expression} / ${c2.expression})`;
        break;
      default:
        return;
    }

    if (!resultVal) return;

    // Push current card state onto the history stack
    setHistoryStack([...historyStack, [...cards]]);

    // Sound cue
    sound.playCombine();

    // Create the merged card
    const mergedCard: CardItem = {
      id: `card-merge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      value: resultVal,
      expression: textExpr,
      originalNumbers: [...c1.originalNumbers, ...c2.originalNumbers],
    };

    // Filter out used cards and add the merged card
    const nextCards = cards.filter(c => c.id !== c1.id && c.id !== c2.id);
    const updatedCards = [...nextCards, mergedCard];
    
    setCards(updatedCards);

    // Reset interaction selectors
    setSelectedCardId(null);
    setSelectedOp(null);
    onAlert(null);

    // Check for win conditions
    if (updatedCards.length === 1) {
      const finalCard = updatedCards[0];
      if (fractionEquals(finalCard.value, 10)) {
        // Solved successfully!
        sound.playSuccess();
        onSolved(finalCard.expression);
      } else {
        // Not 10
        onAlert(`10になりませんでした（現在：${formatFraction(finalCard.value)}）。「戻す」か「リセット」してください。`);
      }
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    sound.playSelect();
    const previousState = historyStack[historyStack.length - 1];
    setCards(previousState);
    setHistoryStack(historyStack.slice(0, -1));
    setSelectedCardId(null);
    setSelectedOp(null);
    onAlert(null);
  };

  const handleReset = () => {
    sound.playSelect();
    initializeBoard();
  };

  const handleCycleHint = () => {
    sound.playSelect();
    if (!showHint) {
      setShowHint(true);
      setHintIndex(0);
    } else {
      setHintIndex((prev) => (prev + 1) % solutions.length);
    }
  };

  // Render elegant fraction on cards
  const renderFractionDisplay = (f: Fraction) => {
    if (f.den === 1) {
      return <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{f.num}</span>;
    }
    return (
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b-2 border-slate-700 dark:border-slate-300 px-2 leading-none pb-1">{f.num}</span>
        <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none pt-1">{f.den}</span>
      </div>
    );
  };

  const operatorsList = [
    { op: '+', icon: <Plus className="w-6 h-6" />, label: '足す' },
    { op: '-', icon: <Minus className="w-6 h-6" />, label: '引く' },
    { op: '*', icon: <X className="w-5 h-5" />, label: 'かける' },
    { op: '/', icon: <div className="font-extrabold text-xl font-sans" style={{ lineHeight: 1 }}>÷</div>, label: '割る' },
  ];

  return (
    <div className="w-full flex flex-col items-center select-none" id="make_ten_gameboard">
      
      {/* Visual Workspace Cards */}
      <div className="w-full max-w-lg bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl p-6 mb-6 border border-slate-200/50 dark:border-slate-800/40 shadow-inner">
        <div className="text-center mb-3 text-slate-400 dark:text-slate-500 font-mono text-xs uppercase tracking-wider">
          残りカード: {cards.length}枚
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 min-h-[160px] items-center justify-items-center">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => {
              const isSelected = selectedCardId === card.id;
              return (
                <motion.button
                  key={card.id}
                  id={`card-btn-${card.id}`}
                  onClick={() => handleCardClick(card.id)}
                  disabled={isTimeUp}
                  layoutId={card.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isSelected ? 1.05 : 1, 
                    opacity: 1,
                    y: isSelected ? -4 : 0
                  }}
                  exit={{ scale: 0.6, opacity: 0, y: 15 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-28 h-32 rounded-2xl flex flex-col items-center justify-between p-4 cursor-pointer transition-all duration-200 outline-none relative shadow-md
                    ${isSelected 
                      ? 'bg-amber-100 dark:bg-amber-950/40 border-4 border-amber-500 ring-4 ring-amber-300/30' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:shadow-lg hover:scale-102 dark:hover:border-slate-600'
                    }`}
                >
                  <div className="w-full text-right text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={card.expression}>
                    {card.expression.includes(' ') ? card.expression : ''}
                  </div>
                  
                  <div className="flex-grow flex items-center justify-center">
                    {renderFractionDisplay(card.value)}
                  </div>

                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    {card.originalNumbers.length > 1 ? '合成' : '初期'}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Operator Selection Dashboard */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex justify-between gap-2.5">
          {operatorsList.map((item) => {
            const isOpSelected = selectedOp === item.op;
            return (
              <button
                key={item.op}
                id={`op-btn-${item.op}`}
                disabled={isTimeUp}
                onClick={() => handleOpClick(item.op)}
                className={`flex-1 aspect-square sm:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-150 outline-none shadow-sm cursor-pointer
                  ${isOpSelected
                    ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-300/40 scale-95 dark:ring-indigo-800/40'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                title={item.label}
              >
                {item.icon}
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-500">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action / Auxiliary Toolbar */}
      <div className="w-full max-w-lg flex items-center justify-between gap-3 mb-6">
        <button
          onClick={handleUndo}
          id="btn-undo"
          disabled={historyStack.length === 0 || isTimeUp}
          className="flex-1 max-w-[124px] py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 flex items-center justify-center gap-1.5 font-semibold text-sm disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <CornerUpLeft className="w-4 h-4" />
          <span>戻す</span>
        </button>

        <button
          onClick={handleReset}
          id="btn-reset"
          disabled={isTimeUp}
          className="flex-1 max-w-[124px] py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition duration-150 flex items-center justify-center gap-1.5 font-semibold text-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>リセット</span>
        </button>

        <button
          onClick={handleCycleHint}
          id="btn-hint"
          disabled={isTimeUp}
          className="flex-1 max-w-[124px] py-3 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20 transition duration-150 flex items-center justify-center gap-1.5 font-semibold text-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>ヒント</span>
        </button>

        <button
          onClick={() => {
            sound.playPass();
            onPassed();
          }}
          id="btn-pass"
          disabled={isTimeUp}
          className="flex-grow py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 dark:hover:bg-white transition duration-150 flex items-center justify-center gap-1.5 font-semibold text-sm shadow cursor-pointer"
        >
          <span>パスする</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hints Display Box */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-lg mb-4 text-sm bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 text-emerald-800 dark:text-emerald-300 relative overflow-hidden"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                💡 解の一例 ({hintIndex + 1}/{solutions.length})
              </span>
              <button 
                onClick={handleCycleHint}
                className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded font-semibold transition"
              >
                別の解を見せる
              </button>
            </div>
            <div className="font-mono text-lg font-semibold select-all bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg text-center tracking-wide shadow-inner">
              {solutions[hintIndex]}
            </div>
            <div className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1.5 leading-relaxed text-center">
              ※ 掛け算・足し算を並び替えた類似の手順が含まれる場合があります
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
