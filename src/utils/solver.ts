import { Fraction, Difficulty } from '../types';

// Helper to find Greatest Common Divisor
function gcd(x: number, y: number): number {
  return y === 0 ? Math.abs(x) : gcd(y, x % y);
}

// Simplify fraction
export function simplifyFraction(f: Fraction): Fraction {
  if (f.den === 0) return f;
  const common = gcd(f.num, f.den);
  let num = f.num / common;
  let den = f.den / common;
  if (den < 0) {
    num = -num;
    den = -den;
  }
  return { num, den };
}

// Fraction comparisons
export function addFractions(f1: Fraction, f2: Fraction): Fraction {
  return simplifyFraction({
    num: f1.num * f2.den + f2.num * f1.den,
    den: f1.den * f2.den
  });
}

export function subtractFractions(f1: Fraction, f2: Fraction): Fraction {
  return simplifyFraction({
    num: f1.num * f2.den - f2.num * f1.den,
    den: f1.den * f2.den
  });
}

export function multiplyFractions(f1: Fraction, f2: Fraction): Fraction {
  return simplifyFraction({
    num: f1.num * f2.num,
    den: f1.den * f2.den
  });
}

export function divideFractions(f1: Fraction, f2: Fraction): Fraction | null {
  if (f2.num === 0) return null;
  return simplifyFraction({
    num: f1.num * f2.den,
    den: f1.den * f2.num
  });
}

export function fractionEquals(f: Fraction, value: number): boolean {
  if (f.den === 0) return false;
  const simplified = simplifyFraction(f);
  return simplified.den === 1 && simplified.num === value;
}

export function fractionToDecimal(f: Fraction): number {
  return f.num / f.den;
}

export function formatFraction(f: Fraction): string {
  const simplified = simplifyFraction(f);
  if (simplified.den === 1) {
    return simplified.num.toString();
  }
  return `${simplified.num}/${simplified.den}`;
}

interface CalcNode {
  value: Fraction;
  expr: string;
  hasFractionalStep: boolean;
  hasMul: boolean;
  hasDiv: boolean;
}

/**
 * Evaluates the 4 numbers and classifies their make-10 solutions by difficulty.
 */
export function evaluatePuzzleDifficulty(numbers: number[]): {
  solutions: string[];
  difficulty: Difficulty | null;
  solutionsByDifficulty: Record<Difficulty, string[]>;
} {
  const solutionsByDifficulty: Record<Difficulty, string[]> = {
    easy: [],
    normal: [],
    hard: [],
    veryhard: []
  };

  const seenExpressions = new Set<string>();

  function normalizeExpression(expr: string): string {
    return expr.replace(/\s+/g, '');
  }

  function runSolve(nodes: CalcNode[]) {
    if (nodes.length === 1) {
      const node = nodes[0];
      if (fractionEquals(node.value, 10)) {
        const norm = normalizeExpression(node.expr);
        if (!seenExpressions.has(norm)) {
          seenExpressions.add(norm);
          
          // Categorize based on calculation metadata
          if (node.hasFractionalStep) {
            solutionsByDifficulty.veryhard.push(node.expr);
          } else if (node.hasDiv) {
            solutionsByDifficulty.hard.push(node.expr);
          } else if (node.hasMul) {
            solutionsByDifficulty.normal.push(node.expr);
          } else {
            solutionsByDifficulty.easy.push(node.expr);
          }
        }
      }
      return;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;

        const n1 = nodes[i];
        const n2 = nodes[j];
        const remaining = nodes.filter((_n, idx) => idx !== i && idx !== j);

        // Operation: + (Commutative)
        if (i < j) {
          const sum = addFractions(n1.value, n2.value);
          const hasFrac = n1.hasFractionalStep || n2.hasFractionalStep || (sum.den !== 1);
          runSolve([
            ...remaining,
            {
              value: sum,
              expr: `(${n1.expr} + ${n2.expr})`,
              hasFractionalStep: hasFrac,
              hasMul: n1.hasMul || n2.hasMul,
              hasDiv: n1.hasDiv || n2.hasDiv
            }
          ]);
        }

        // Operation: -
        const diff = subtractFractions(n1.value, n2.value);
        const hasFracDiff = n1.hasFractionalStep || n2.hasFractionalStep || (diff.den !== 1);
        runSolve([
          ...remaining,
          {
            value: diff,
            expr: `(${n1.expr} - ${n2.expr})`,
            hasFractionalStep: hasFracDiff,
            hasMul: n1.hasMul || n2.hasMul,
            hasDiv: n1.hasDiv || n2.hasDiv
          }
        ]);

        // Operation: * (Commutative)
        if (i < j) {
          const prod = multiplyFractions(n1.value, n2.value);
          const hasFracProd = n1.hasFractionalStep || n2.hasFractionalStep || (prod.den !== 1);
          runSolve([
            ...remaining,
            {
              value: prod,
              expr: `(${n1.expr} * ${n2.expr})`,
              hasFractionalStep: hasFracProd,
              hasMul: true,
              hasDiv: n1.hasDiv || n2.hasDiv
            }
          ]);
        }

        // Operation: /
        const divVal = divideFractions(n1.value, n2.value);
        if (divVal !== null) {
          const hasFracDiv = n1.hasFractionalStep || n2.hasFractionalStep || (divVal.den !== 1);
          runSolve([
            ...remaining,
            {
              value: divVal,
              expr: `(${n1.expr} / ${n2.expr})`,
              hasFractionalStep: hasFracDiv,
              hasMul: n1.hasMul || n2.hasMul,
              hasDiv: true
            }
          ]);
        }
      }
    }
  }

  const initialNodes: CalcNode[] = numbers.map(val => ({
    value: { num: val, den: 1 },
    expr: val.toString(),
    hasFractionalStep: false,
    hasMul: false,
    hasDiv: false
  }));

  runSolve(initialNodes);

  // Classify overall minimum difficulty to solve this puzzle
  let puzzleDiff: Difficulty | null = null;
  if (solutionsByDifficulty.easy.length > 0) {
    puzzleDiff = 'easy';
  } else if (solutionsByDifficulty.normal.length > 0) {
    puzzleDiff = 'normal';
  } else if (solutionsByDifficulty.hard.length > 0) {
    puzzleDiff = 'hard';
  } else if (solutionsByDifficulty.veryhard.length > 0) {
    puzzleDiff = 'veryhard';
  }

  const allSolutions = [
    ...solutionsByDifficulty.easy,
    ...solutionsByDifficulty.normal,
    ...solutionsByDifficulty.hard,
    ...solutionsByDifficulty.veryhard
  ];

  return {
    solutions: allSolutions,
    difficulty: puzzleDiff,
    solutionsByDifficulty
  };
}

/**
 * Legacy compatible helper
 */
export function solveMake10(numbers: number[]): string[] {
  return evaluatePuzzleDifficulty(numbers).solutions;
}

/**
 * Generates a puzzle ensuring it is solvable under the target difficulty.
 */
export function generateMake10Puzzle(difficulty: Difficulty): { numbers: number[]; solutions: string[] } {
  let attempts = 0;
  // Increase max attempts to find specific rare difficulties (like veryhard)
  while (attempts < 3000) {
    attempts++;
    // Generate 4 numbers from 0 to 9
    const numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    
    // Dry and boring zero configurations filter
    const zeros = numbers.filter(n => n === 0).length;
    if (zeros > 2) continue;
    if (difficulty === 'easy' && zeros > 1) continue;

    const evaluation = evaluatePuzzleDifficulty(numbers);
    
    if (difficulty === 'veryhard') {
      const validSols = evaluation.solutionsByDifficulty.veryhard;
      if (validSols.length > 0) {
        return { numbers, solutions: validSols };
      }
    } else if (evaluation.difficulty === difficulty) {
      const validSols = evaluation.solutionsByDifficulty[difficulty];
      if (validSols.length > 0) {
        return { numbers, solutions: validSols };
      }
    }
  }
  
  // High quality guaranteed static fallbacks for extreme cases
  if (difficulty === 'easy') {
    return {
      numbers: [1, 2, 3, 4],
      solutions: ['(((1 + 2) + 3) + 4)', '(1 + 2 + 3 + 4)']
    };
  } else if (difficulty === 'normal') {
    return {
      numbers: [1, 2, 3, 5], // 2*3 + 5 - 1 = 10
      solutions: ['(((2 * 3) + 5) - 1)']
    };
  } else if (difficulty === 'hard') {
    return {
      numbers: [2, 4, 8, 9], // 4 / 2 + 8 = 10 (no fraction intermediate)
      solutions: ['((4 / 2) + 8)']
    };
  } else {
    // veryhard fallbacks
    // 3, 3, 8, 8 -> 8 / (3 - 8/3) = 10
    // 1, 5, 5, 5 -> 5 * (5 - 1 / 5) = 10  (5 * 24/5 = 24, not 10. wait: (5 - 1 / 5) * 5? No, (5 * (1 / 5)) is 1. Wait, 5 * (5 - 1/5) = 5 * (24/5) = 24? Wait, 5 * (2 - 1/5) = 9? No: (5 - 1/5)*5? no, 1/5 is 0.2, 5-0.2 is 4.8, 4.8 * 5 is 24.
    // 1, 1, 5, 8 => 8 / (1 - 1/5) = 8 / (4/5) = 10! 这是veryhard!
    return {
      numbers: [1, 1, 5, 8],
      solutions: ['(8 / (1 - (1 / 5)))']
    };
  }
}
