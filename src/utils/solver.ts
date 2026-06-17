import { Fraction } from '../types';

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
}

/**
 * Searches for all unique formulas that evaluate to 10 using the four numbers.
 */
export function solveMake10(numbers: number[]): string[] {
  const results: string[] = [];
  const seenExpressions = new Set<string>();

  // Helper to normalize expressions by removing extra brackets or sorting commutative parts
  // for unique matches
  function normalizeExpression(expr: string): string {
    // Basic formatting cleanups
    return expr.replace(/\s+/g, '');
  }

  function runSolve(nodes: CalcNode[]) {
    if (nodes.length === 1) {
      const node = nodes[0];
      if (fractionEquals(node.value, 10)) {
        const norm = normalizeExpression(node.expr);
        if (!seenExpressions.has(norm)) {
          seenExpressions.add(norm);
          // Let's store the readable version
          results.push(node.expr);
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
          runSolve([
            ...remaining,
            {
              value: addFractions(n1.value, n2.value),
              expr: `(${n1.expr} + ${n2.expr})`
            }
          ]);
        }

        // Operation: -
        runSolve([
          ...remaining,
          {
            value: subtractFractions(n1.value, n2.value),
            expr: `(${n1.expr} - ${n2.expr})`
          }
        ]);

        // Operation: * (Commutative)
        if (i < j) {
          runSolve([
            ...remaining,
            {
              value: multiplyFractions(n1.value, n2.value),
              expr: `(${n1.expr} * ${n2.expr})`
            }
          ]);
        }

        // Operation: /
        const divVal = divideFractions(n1.value, n2.value);
        if (divVal !== null) {
          runSolve([
            ...remaining,
            {
              value: divVal,
              expr: `(${n1.expr} / ${n2.expr})`
            }
          ]);
        }
      }
    }
  }

  const initialNodes: CalcNode[] = numbers.map(val => ({
    value: { num: val, den: 1 },
    expr: val.toString()
  }));

  runSolve(initialNodes);
  return results;
}

/**
 * Generates a puzzle ensuring it is solvable.
 * Avoids boring trivial puzzles (like having double zeros or duplicate formulas) if possible.
 */
export function generateMake10Puzzle(): { numbers: number[]; solutions: string[] } {
  let attempts = 0;
  while (attempts < 1000) {
    attempts++;
    // Generate 4 numbers from 0 to 9
    const numbers = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    
    // Let's filter out dry cases like having more than two 0s
    const zeros = numbers.filter(n => n === 0).length;
    if (zeros > 1) continue;

    const solutions = solveMake10(numbers);
    if (solutions.length > 0) {
      return { numbers, solutions };
    }
  }
  
  // Fallback guaranteed puzzle (1, 2, 3, 4) -> (1 + 2 + 3 + 4) = 10
  return {
    numbers: [1, 2, 3, 4],
    solutions: ['(1 + 2 + 3 + 4)', '((1 + 2) + 3) + 4', '(1 + 2) + (3 + 4)']
  };
}
