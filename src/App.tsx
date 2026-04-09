import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Home, GitMerge, FileSearch, XCircle, ListTree, CheckSquare, X, MousePointerClick, Plus, Minus } from "lucide-react";

// --- INLINE UI COMPONENTS (High Contrast Dark Theme) ---

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-lg ${className || ""}`} {...props} />
));

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 p-6 border-b border-zinc-800/50 bg-zinc-900/50 rounded-t-2xl ${className || ""}`} {...props} />
));

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`font-semibold leading-none tracking-tight text-zinc-50 ${className || ""}`} {...props} />
));

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={`p-6 ${className || ""}`} {...props} />
));

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "outline" | "destructive", size?: "default" | "sm" | "lg" | "icon" | "glass" }>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/40 disabled:bg-red-900/50 disabled:text-white/60 disabled:shadow-none border-none",
      secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 shadow-sm disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800",
      outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-200 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-800",
      destructive: "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-900/40 disabled:bg-red-900/50 disabled:text-white/60 disabled:shadow-none",
      glass: "bg-zinc-900/80 backdrop-blur-md text-zinc-100 hover:bg-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-zinc-700 disabled:opacity-0"
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-14 w-14 rounded-full flex items-center justify-center",
      glass: "h-14 w-14 rounded-full flex items-center justify-center"
    };
    return (
      <button ref={ref} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className || ""}`} {...props} />
    );
  }
);

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" | "destructive" | "success" }>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border-zinc-700 bg-zinc-800 text-zinc-200",
      secondary: "border-red-900/50 bg-red-950/40 text-red-400",
      destructive: "border-red-900/50 bg-red-950/40 text-red-400",
      success: "border-emerald-900/50 bg-emerald-950/40 text-emerald-400",
      outline: "border-zinc-700 text-zinc-400 bg-transparent"
    };
    return (
      <div ref={ref} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none ${variants[variant]} ${className || ""}`} {...props} />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => (
  <input type={type} ref={ref} className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`} {...props} />
));

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={`flex min-h-[80px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`} {...props} />
));

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={`flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className || ""}`} {...props}>
    {children}
  </select>
));

// --- LOGIC AND TYPES ---

type DFA = {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<string, Record<string, string>>;
};

type PairTableEntry = {
  pair: [string, string];
  mark: "marked" | "unmarked" | "newly-marked";
  reason: string;
};

type SymbolCheck = {
  symbol: string;
  nextPair: [string, string] | null;
  nextStates: [string, string];
  status: "same" | "depends" | "distinguishable";
  reason: string;
};

type StepGraph = {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<string, Record<string, string>>;
};

type PairEvaluation = {
  pair: [string, string];
  isMarked: boolean;
  reason: string;
  symbolChecks: SymbolCheck[];
};

type AlgorithmStep = {
  phase: "base-mark" | "iterative-mark" | "merge-overview" | "merge-check" | "merge-execute" | "final";
  title: string;
  description: string;
  tableSnapshot: PairTableEntry[];
  
  evaluations?: PairEvaluation[];
  passNumber?: number;

  pair?: [string, string]; 
  mergingNodes?: [string, string];
  mergedGroups?: string[][];
  preMergeGraph?: StepGraph; 
  graph?: StepGraph; 
  reason?: string;
};

type MinimizedDFA = {
  states: string[];
  alphabet: string[];
  startState: string;
  finalStates: string[];
  transitions: Record<string, Record<string, string>>;
  mapping: Record<string, string>;
};

type MinimizationResult = {
  markingSteps: AlgorithmStep[];
  mergingSteps: AlgorithmStep[];
  pairTable: PairTableEntry[];
  equivalentGroups: string[][];
  minimized: MinimizedDFA;
};

type DFAFormState = {
  statesText: string;
  alphabetText: string;
  startState: string;
  finalStatesText: string;
  transitions: Record<string, Record<string, string>>;
};

const sampleDFA: DFA = {
  states: ["A", "B", "C", "D", "E", "F"],
  alphabet: ["0", "1"],
  startState: "A",
  finalStates: ["C", "D", "F"],
  transitions: {
    A: { "0": "B", "1": "C" },
    B: { "0": "A", "1": "D" },
    C: { "0": "E", "1": "F" },
    D: { "0": "E", "1": "F" },
    E: { "0": "E", "1": "F" },
    F: { "0": "F", "1": "F" }
  }
};

function normalizeList(text: string) {
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function buildEmptyTransitions(states: string[], alphabet: string[], previous?: Record<string, Record<string, string>>) {
  const transitions: Record<string, Record<string, string>> = {};
  states.forEach((state) => {
    transitions[state] = {};
    alphabet.forEach((symbol) => {
      transitions[state][symbol] = previous?.[state]?.[symbol] ?? states[0] ?? "";
    });
  });
  return transitions;
}

function dfaToFormState(dfa: DFA): DFAFormState {
  return {
    statesText: dfa.states.join(", "),
    alphabetText: dfa.alphabet.join(", "),
    startState: dfa.startState,
    finalStatesText: dfa.finalStates.join(", "),
    transitions: dfa.transitions
  };
}

function parseDFA(text: string): { dfa?: DFA; error?: string } {
  try {
    const obj = JSON.parse(text);
    if (!obj.states || !obj.alphabet || !obj.startState || !obj.finalStates || !obj.transitions) {
      return { error: "Missing required DFA fields." };
    }
    const states = obj.states as string[];
    const alphabet = obj.alphabet as string[];
    for (const state of states) {
      if (!obj.transitions[state]) return { error: `Missing transitions for state ${state}.` };
      for (const symbol of alphabet) {
        const target = obj.transitions[state][symbol];
        if (!target) return { error: `Missing transition for state ${state} on input ${symbol}.` };
        if (!states.includes(target)) return { error: `Transition from ${state} on ${symbol} points to unknown state ${target}.` };
      }
    }
    return { dfa: obj as DFA };
  } catch {
    return { error: "Invalid JSON format." };
  }
}

function formStateToDFA(form: DFAFormState): { dfa?: DFA; error?: string } {
  const states = normalizeList(form.statesText);
  const alphabet = normalizeList(form.alphabetText);
  const finalStates = normalizeList(form.finalStatesText);
  const startState = form.startState.trim();

  if (!states.length) return { error: "Please enter at least one state." };
  if (!alphabet.length) return { error: "Please enter at least one input symbol." };
  if (!startState) return { error: "Please enter a start state." };
  if (!states.includes(startState)) return { error: "Start state must exist in the state list." };
  for (const finalState of finalStates) {
    if (!states.includes(finalState)) return { error: `Final state ${finalState} is not present in the state list.` };
  }

  const transitions = buildEmptyTransitions(states, alphabet, form.transitions);
  for (const state of states) {
    for (const symbol of alphabet) {
      const target = transitions[state]?.[symbol]?.trim();
      if (!target) return { error: `Missing transition for state ${state} on input ${symbol}.` };
      if (!states.includes(target)) return { error: `Transition from ${state} on ${symbol} points to unknown state ${target}.` };
      transitions[state][symbol] = target;
    }
  }

  return { dfa: { states, alphabet, startState, finalStates, transitions } };
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function pairKey(a: string, b: string) {
  const [x, y] = normalizePair(a, b);
  return `${x}|${y}`;
}

function buildAllPairs(states: string[]) {
  const pairs: [string, string][] = [];
  for (let i = 0; i < states.length; i += 1) {
    for (let j = i + 1; j < states.length; j += 1) {
      pairs.push([states[i], states[j]]);
    }
  }
  return pairs;
}

function partitionsToGraph(dfa: DFA, partitions: string[][]): StepGraph {
  const stateNames = partitions.map((group) => `{${group.join(",")}}`);
  const mapping: Record<string, string> = {};

  partitions.forEach((group, idx) => {
    group.forEach((state) => {
      mapping[state] = stateNames[idx];
    });
  });

  const transitions: Record<string, Record<string, string>> = {};
  partitions.forEach((group, idx) => {
    const representative = group[0];
    const newState = stateNames[idx];
    transitions[newState] = {};
    dfa.alphabet.forEach((symbol) => {
      transitions[newState][symbol] = mapping[dfa.transitions[representative][symbol]];
    });
  });

  return {
    states: stateNames,
    alphabet: dfa.alphabet,
    startState: mapping[dfa.startState],
    finalStates: [...new Set(dfa.finalStates.map((state) => mapping[state]))],
    transitions
  };
}

function minimizeDFA(dfa: DFA): MinimizationResult {
  const allPairs = buildAllPairs(dfa.states).sort((p1, p2) => p1[0].localeCompare(p2[0]) || p1[1].localeCompare(p2[1]));
  const marked = new Set<string>();
  const reasons: Record<string, string> = {};
  const markingSteps: AlgorithmStep[] = [];
  const mergingSteps: AlgorithmStep[] = [];

  const getTableSnapshot = (newMarks: Set<string> = new Set()): PairTableEntry[] => allPairs.map(([x, y]) => {
    const key = pairKey(x, y);
    let markStat: "marked" | "unmarked" | "newly-marked" = "unmarked";
    if (newMarks.has(key)) markStat = "newly-marked";
    else if (marked.has(key)) markStat = "marked";

    return {
      pair: [x, y],
      mark: markStat,
      reason: reasons[key] || "Pending confirmation (unmarked)"
    };
  });

  // Phase 1: Base Cases (Batched instantly)
  let baseMarksCount = 0;
  const baseEvaluations: PairEvaluation[] = [];
  const baseNewMarks = new Set<string>();
  
  allPairs.forEach(([a, b]) => {
    const key = pairKey(a, b);
    const aFinal = dfa.finalStates.includes(a);
    const bFinal = dfa.finalStates.includes(b);
    let isMarked = false;
    let reason = "Both states share the same finality. Leave unmarked initially.";

    if (aFinal !== bFinal) {
      marked.add(key);
      baseNewMarks.add(key);
      isMarked = true;
      baseMarksCount++;
      reason = "One state is final and the other is non-final. Distinguishable immediately.";
      reasons[key] = reason;
    }
    baseEvaluations.push({ pair: [a, b], isMarked, reason, symbolChecks: [] });
  });

  markingSteps.push({
    phase: "base-mark",
    title: `Base Cases Marked`,
    description: "The DFA and Myhill-Nerode table are prepared. We begin by evaluating combinations of final and non-final states. All pairs where one state is an accepting (final) state and the other is not are immediately marked as distinguishable.",
    reason: `Identified and marked ${baseMarksCount} pair(s) instantly because they have different finality.`,
    evaluations: baseEvaluations,
    tableSnapshot: getTableSnapshot(baseNewMarks)
  });

  // Phase 2: Iterative Marking passes
  let changed = true;
  let pass = 1;
  while (changed) {
    changed = false;
    const passEvaluations: PairEvaluation[] = [];
    let newMarksInPass = 0;
    const passNewMarks = new Set<string>();

    allPairs.forEach(([a, b]) => {
      const key = pairKey(a, b);
      if (marked.has(key)) return; 

      const symbolChecks: SymbolCheck[] = [];
      let newlyMarked = false;
      let currentReason = `After Pass ${pass}, transitions only led to unmarked pairs or the same state. Leaving unmarked.`;

      for (const symbol of dfa.alphabet) {
        const nextA = dfa.transitions[a][symbol];
        const nextB = dfa.transitions[b][symbol];

        if (nextA === nextB) {
          symbolChecks.push({
            symbol,
            nextPair: null,
            nextStates: [nextA, nextB],
            status: "same",
            reason: `Transitions to the exact same state ${nextA}.`
          });
          continue;
        }

        const depPair = normalizePair(nextA, nextB);
        const depKey = pairKey(nextA, nextB);
        const depMarked = marked.has(depKey);

        symbolChecks.push({
          symbol,
          nextPair: depPair,
          nextStates: [nextA, nextB],
          status: depMarked ? "distinguishable" : "depends",
          reason: depMarked 
            ? `Leads to pair (${depPair.join(", ")}), which is ALREADY marked.` 
            : `Leads to pair (${depPair.join(", ")}), which is currently unmarked.`
        });

        if (depMarked && !newlyMarked) {
          marked.add(key);
          passNewMarks.add(key);
          newlyMarked = true;
          changed = true;
          newMarksInPass++;
          currentReason = `Marked because input '${symbol}' leads to a distinguishable pair (${depPair.join(", ")}).`;
          reasons[key] = currentReason;
        }
      }

      passEvaluations.push({
        pair: [a, b],
        symbolChecks,
        isMarked: newlyMarked,
        reason: currentReason
      });
    });

    if (passEvaluations.length > 0) {
      markingSteps.push({
        phase: "iterative-mark",
        title: `Iteration Pass ${pass}`,
        description: `Checked ${passEvaluations.length} unmarked pairs. ${newMarksInPass} newly marked in this pass.`,
        passNumber: pass,
        evaluations: passEvaluations,
        tableSnapshot: getTableSnapshot(passNewMarks)
      });
    }
    pass++;
  }

  // Phase 3: Merging equivalent states dynamically
  const equivalentPairs = allPairs.filter(([a, b]) => !marked.has(pairKey(a, b)));
  let currentGroups = dfa.states.map(s => [s]);

  if (equivalentPairs.length === 0) {
    mergingSteps.push({
      phase: "merge-overview",
      title: "No Merges Needed",
      description: "The table-filling algorithm completed and all pairs were marked. The DFA is already minimal.",
      pair: ["", ""],
      mergedGroups: currentGroups,
      graph: partitionsToGraph(dfa, currentGroups),
      tableSnapshot: getTableSnapshot()
    });
  } else {
    // Add an initial overview step for merging
    mergingSteps.push({
      phase: "merge-overview",
      title: "Begin State Conversion & Merging",
      description: "All iterations are complete. Pairs left unmarked in the Myhill-Nerode table are proven equivalent and will now be physically merged.",
      pair: ["", ""],
      mergedGroups: [...currentGroups],
      graph: partitionsToGraph(dfa, currentGroups),
      tableSnapshot: getTableSnapshot()
    });

    equivalentPairs.forEach(([a, b]) => {
      const groupAIndex = currentGroups.findIndex(g => g.includes(a));
      const groupBIndex = currentGroups.findIndex(g => g.includes(b));
      
      if (groupAIndex !== groupBIndex) {
        const preMergeGraph = partitionsToGraph(dfa, currentGroups);
        
        // Exact names of the nodes to animate based on current partition state
        const mergingNodes: [string, string] = [
          `{${currentGroups[groupAIndex].join(",")}}`,
          `{${currentGroups[groupBIndex].join(",")}}`
        ];

        // 1. Explicit Checking Step
        mergingSteps.push({
          phase: "merge-check",
          title: `Verify Equivalence: (${a}, ${b})`,
          description: `Before modifying the topology, we verify in the Myhill-Nerode table that the pair (${a}, ${b}) remained unmarked, proving they act identically on all inputs.`,
          pair: [a, b],
          mergingNodes,
          mergedGroups: [...currentGroups],
          graph: preMergeGraph,
          tableSnapshot: getTableSnapshot()
        });

        // Mutate groups
        const mergedGroup = [...currentGroups[groupAIndex], ...currentGroups[groupBIndex]].sort();
        currentGroups = currentGroups.filter((_, idx) => idx !== groupAIndex && idx !== groupBIndex);
        currentGroups.push(mergedGroup);
        currentGroups.sort((g1, g2) => g1[0].localeCompare(g2[0]));

        const postMergeGraph = partitionsToGraph(dfa, currentGroups);

        // 2. Explicit Execute Step
        mergingSteps.push({
          phase: "merge-execute",
          title: `Combine States: (${a}, ${b})`,
          description: `The redundant states are now fused together. Watch the topological graph and transition table absorb the equivalence into a single state.`,
          pair: [a, b],
          mergingNodes,
          mergedGroups: [...currentGroups],
          preMergeGraph: preMergeGraph, // Keep track of the un-merged graph for the animation
          graph: postMergeGraph,
          tableSnapshot: getTableSnapshot()
        });
      }
    });
  }

  // Final Result Assembly
  const stateNames = currentGroups.map((group) => `{${group.join(",")}}`);
  const mapping: Record<string, string> = {};
  currentGroups.forEach((group, idx) => {
    group.forEach((state) => {
      mapping[state] = stateNames[idx];
    });
  });

  const minimizedTransitions: Record<string, Record<string, string>> = {};
  currentGroups.forEach((group, idx) => {
    const representative = group[0];
    const newState = stateNames[idx];
    minimizedTransitions[newState] = {};
    dfa.alphabet.forEach((symbol) => {
      minimizedTransitions[newState][symbol] = mapping[dfa.transitions[representative][symbol]];
    });
  });

  const minimizedDfaData = {
    states: stateNames,
    alphabet: dfa.alphabet,
    startState: mapping[dfa.startState],
    finalStates: [...new Set(dfa.finalStates.map((state) => mapping[state]))],
    transitions: minimizedTransitions,
    mapping
  };

  const finalAllPairs = buildAllPairs(minimizedDfaData.states);
  
  const finalEvaluations: PairEvaluation[] = finalAllPairs.map(([x,y]) => {
    const repX = x.replace(/[{}]/g, '').split(',')[0];
    const repY = y.replace(/[{}]/g, '').split(',')[0];
    const xFinal = minimizedDfaData.finalStates.includes(x);
    const yFinal = minimizedDfaData.finalStates.includes(y);
    let reason = "";
    if (xFinal !== yFinal) {
       reason = `Group ${x} ${xFinal ? "is" : "is not"} an accepting state, while group ${y} ${yFinal ? "is" : "is not"}. Thus, they are distinguishable immediately.`;
    } else {
       reason = `These merged groups remain distinguishable because their constituent states (e.g., ${repX} and ${repY}) were previously proven distinguishable during the table-filling phase.`;
    }
    return {
      pair: [x,y],
      isMarked: true,
      reason: reason,
      symbolChecks: []
    };
  });

  const finalTableSnapshot: PairTableEntry[] = finalAllPairs.map(([x,y]) => ({
    pair: [x,y],
    mark: "marked",
    reason: "These states belong to different equivalence classes and are strictly distinguishable."
  }));

  mergingSteps.push({
    phase: "final",
    title: "Final Minimized DFA",
    description: "All equivalent pairs have been merged. This is the finalized, minimal deterministic finite automaton. The table below verifies all remaining state pairs are strictly distinguishable.",
    evaluations: finalEvaluations,
    tableSnapshot: finalTableSnapshot,
    graph: minimizedDfaData as unknown as StepGraph
  });

  return {
    markingSteps,
    mergingSteps,
    pairTable: getTableSnapshot(),
    equivalentGroups: currentGroups,
    minimized: minimizedDfaData
  };
}

// --- VISUALIZATION COMPONENTS ---

function TransitionTable({ dfa, title, highlightedStates = [], activeSymbol = null }: { dfa: DFA | MinimizedDFA | StepGraph; title?: string; highlightedStates?: string[]; activeSymbol?: string | null; }) {
  return (
    <Card className="h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      {title ? <CardHeader><CardTitle>{title}</CardTitle></CardHeader> : null}
      <CardContent className="flex-1 overflow-auto pt-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800 text-zinc-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-bold border-b border-zinc-700">State</th>
                {dfa.alphabet.map((symbol) => (
                  <th key={symbol} className={`px-4 py-3 text-left font-bold border-b border-zinc-700 transition-colors ${activeSymbol === symbol ? "bg-red-900/50 text-red-300" : ""}`}>
                    Input {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dfa.states.map((state) => {
                const isHighlighted = highlightedStates.some(h => state === h || state.includes(h));
                return (
                  <tr key={state} className={`border-b border-zinc-800/50 last:border-0 transition-colors ${isHighlighted ? "bg-zinc-800/50" : ""}`}>
                    <td className={`px-4 py-3 font-medium ${isHighlighted ? "text-zinc-50 font-bold" : "text-zinc-300"}`}>
                      {state}
                      {dfa.startState === state && <Badge variant="outline" className="ml-2 text-[10px] scale-90 border-zinc-700 text-zinc-400">Start</Badge>}
                      {dfa.finalStates.includes(state) && <Badge variant="outline" className="ml-2 text-[10px] scale-90 border-zinc-700 text-zinc-400">Final</Badge>}
                    </td>
                    {dfa.alphabet.map((symbol) => {
                      const activeCell = isHighlighted && activeSymbol === symbol;
                      const activeColumn = activeSymbol === symbol;
                      return (
                        <td key={`${state}-${symbol}`} className={`px-4 py-3 transition-colors ${activeCell ? "bg-red-900/60 font-bold text-red-300 border border-red-800 shadow-[inset_0_0_12px_rgba(220,38,38,0.3)]" : activeColumn ? "bg-red-950/30 text-zinc-200" : "text-zinc-400"}`}>
                          {dfa.transitions[state][symbol]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TriangularTableSnapshot({ 
  dfa, 
  rows, 
  activePair,
  title,
  onCellClick,
  onNext,
  onPrev,
  onReplay,
  isNextDisabled,
  isPrevDisabled,
  isReplayDisabled
}: { 
  dfa: DFA | StepGraph, 
  rows: PairTableEntry[], 
  activePair: [string, string] | null,
  title: string,
  onCellClick?: (pair: [string, string]) => void,
  onNext?: () => void,
  onPrev?: () => void,
  onReplay?: () => void,
  isNextDisabled?: boolean,
  isPrevDisabled?: boolean,
  isReplayDisabled?: boolean
}) {
  const states = dfa.states;
  if (states.length < 2) return null;

  const colStates = states.slice(0, -1);
  const rowStates = states.slice(1);

  return (
    <Card className="h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <CardHeader className="bg-zinc-900/80 border-b border-zinc-800 p-4 sm:p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg shrink-0">
            <CheckSquare className="h-5 w-5 text-red-500" /> {title}
          </CardTitle>
          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 shadow-inner w-fit self-end xl:self-auto">
            {onPrev && <Button variant="secondary" size="sm" onClick={onPrev} disabled={isPrevDisabled} className="h-8 rounded-lg px-3 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 shadow-sm"><ArrowLeft className="w-4 h-4" /></Button>}
            {onReplay && <Button variant="secondary" size="sm" onClick={onReplay} disabled={isReplayDisabled} className="h-8 rounded-lg px-3 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 shadow-sm"><RotateCcw className="w-4 h-4 mr-1.5" /> Replay</Button>}
            {onNext && <Button variant="default" size="sm" onClick={onNext} disabled={isNextDisabled} className="h-8 rounded-lg px-4 shadow-sm bg-red-900/40 text-red-400 hover:bg-red-800/60 border-none"><ArrowRight className="w-4 h-4" /></Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto relative bg-zinc-950/50">
         {onCellClick && (
           <Badge variant="outline" className="absolute top-4 left-4 text-[10px] text-zinc-500 bg-zinc-900 border-zinc-800 hidden md:flex">
             <MousePointerClick className="w-3 h-3 mr-1" /> Click cell to inspect logic
           </Badge>
         )}
         <div className="flex flex-col gap-1.5 mt-6">
            {/* Header row */}
            <div className="flex gap-1.5 pl-10">
               {colStates.map(c => (
                 <div key={`header-${c}`} className="w-12 h-8 flex items-center justify-center font-bold text-zinc-500">{c}</div>
               ))}
            </div>
            {/* Rows */}
            {rowStates.map((r, rIdx) => (
              <div key={`row-${r}`} className="flex gap-1.5">
                {/* Row header */}
                <div className="w-10 h-12 flex items-center justify-end pr-3 font-bold text-zinc-500">{r}</div>
                {/* Cells */}
                {colStates.map((c, cIdx) => {
                  if (cIdx > rIdx) return <div key={`empty-${c}`} className="w-12 h-12 shrink-0" />;

                  const pairKey = normalizePair(c, r);
                  const entry = rows.find(row => row.pair[0] === pairKey[0] && row.pair[1] === pairKey[1]);
                  const isNewlyMarked = entry?.mark === "newly-marked";
                  const isMarked = entry?.mark === "marked" || isNewlyMarked;
                  const isActive = activePair && activePair[0] === pairKey[0] && activePair[1] === pairKey[1];

                  let cellClasses = "border-zinc-700 bg-zinc-900 shadow-sm hover:bg-zinc-800";
                  let xColor = "text-zinc-600";

                  if (isActive) {
                     cellClasses = "border-red-500 bg-red-900/40 shadow-[0_0_15px_rgba(220,38,38,0.4)] z-20 ring-2 ring-red-500/50";
                     xColor = "text-red-400";
                  } else if (isNewlyMarked) {
                     cellClasses = "border-red-800 bg-red-950/50 shadow-sm ring-1 ring-red-900/50"; 
                     xColor = "text-red-500";
                  } else if (isMarked) {
                     cellClasses = "border-zinc-800 bg-zinc-900/50";
                     xColor = "text-zinc-600";
                  }

                  return (
                    <motion.div 
                      key={`cell-${c}`} 
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
                      onClick={() => onCellClick?.(pairKey)}
                      className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-300 ${onCellClick ? "cursor-pointer active:scale-95" : ""} ${cellClasses}`}>
                       {isMarked && <X className={`w-8 h-8 stroke-[3] ${xColor} ${isNewlyMarked && !isActive ? "animate-pulse" : ""}`} />}
                    </motion.div>
                  );
                })}
              </div>
            ))}
         </div>
      </CardContent>
    </Card>
  );
}

function GraphView({ dfa, title, graphKey, activeStates = [], mergeMode = false, mergingPair = null }: { dfa: DFA | MinimizedDFA | StepGraph; title: string; graphKey: string; activeStates?: string[]; mergeMode?: boolean; mergingPair?: [string, string] | null }) {
  const nodes = dfa.states;
  const svgRef = useRef<SVGSVGElement>(null);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [canvasWidth, setCanvasWidth] = useState(1120);
  const [isDragging, setIsDragging] = useState(false);

  const SVG_HEIGHT = 440;
  const CENTER_Y = 220;
  const nodeRadius = 25;
  const arrowPadding = 27; // 25 radius + 2 for stroke to perfectly touch the border

  const animTransition = { duration: isDragging ? 0 : 0.8, ease: "easeInOut" as const };

  useEffect(() => {
    const paddingX = 95;
    const spacing = 170;
    const computedWidth = Math.max(1120, paddingX * 2 + Math.max(0, nodes.length - 1) * spacing);

    setCanvasWidth(computedWidth);

    setPositions((prev) => {
      const next: Record<string, { x: number; y: number }> = {};
      let changed = false;

      nodes.forEach((state, idx) => {
        if (prev[state]) {
          next[state] = prev[state];
          return;
        }

        changed = true;

        let x = nodes.length === 1 ? computedWidth / 2 : paddingX + idx * spacing;
        let y = CENTER_Y;

        if (state.startsWith("{") && state.endsWith("}")) {
          const rawConstituents = state.replace(/[{}]/g, "").split(",");
          let sumX = 0;
          let sumY = 0;
          let count = 0;

          rawConstituents.forEach((c) => {
            const match = prev[c] ? c : Object.keys(prev).find((pk) => pk.includes(c));
            if (match && prev[match]) {
              sumX += prev[match].x;
              sumY += prev[match].y;
              count++;
            }
          });

          if (count > 0) {
            x = sumX / count;
            y = CENTER_Y;
          }
        }

        next[state] = { x, y };
      });

      if (mergingPair && mergingPair.length === 2) {
        const p1 = next[mergingPair[0]];
        const p2 = next[mergingPair[1]];
        if (p1 && p2) {
          changed = true;
          const mx = (p1.x + p2.x) / 2;
          const my = (p1.y + p2.y) / 2;
          next[mergingPair[0]] = { ...p1, x: mx, y: my };
          next[mergingPair[1]] = { ...p2, x: mx, y: my };
        }
      }

      return changed ? next : prev;
    });
  }, [nodes.join(","), mergingPair]);

  const edges = useMemo(() => {
    const grouped: Record<string, { from: string; to: string; symbols: string[] }> = {};
    dfa.states.forEach((from) => {
      dfa.alphabet.forEach((symbol) => {
        const to = dfa.transitions[from]?.[symbol];
        if (!to) return;
        const key = `${from}->${to}`;
        if (!grouped[key]) grouped[key] = { from, to, symbols: [] };
        grouped[key].symbols.push(symbol);
      });
    });
    return Object.values(grouped);
  }, [dfa]);

  const hasReverseEdge = (from: string, to: string) => {
    return edges.some((e) => e.from === to && e.to === from);
  };

  const quadraticPoint = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number
  ) => {
    const mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    };
  };

  const getBestSelfLoopSide = (state: string) => {
    const p = positions[state];
    const candidates = [
      { dx: 0, dy: -1, penalty: 8 },
      { dx: 1, dy: 0, penalty: 0 },
      { dx: 0, dy: 1, penalty: 2 },
      { dx: -1, dy: 0, penalty: 0 }
    ];

    let best = candidates[0];
    let bestScore = -Infinity;

    candidates.forEach((cand) => {
      const probeX = p.x + cand.dx * 100;
      const probeY = p.y + cand.dy * 100;

      let minDist = Infinity;
      nodes.forEach((other) => {
        if (other === state) return;
        const q = positions[other];
        const d = Math.hypot(probeX - q.x, probeY - q.y);
        minDist = Math.min(minDist, d);
      });

      const score = minDist - cand.penalty;
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    });

    return best;
  };

  const getCurveMagnitude = (absDist: number) => {
    if (absDist <= 1) return 56;
    if (absDist === 2) return 92;
    if (absDist === 3) return 126;
    return 126 + (absDist - 3) * 26;
  };

  const getCurveDirection = (fromIdx: number, toIdx: number, reverseExists: boolean) => {
    const isForward = toIdx > fromIdx;

    if (reverseExists) {
      return isForward ? -1 : 1;
    }

    const span = Math.abs(toIdx - fromIdx);

    if (span === 1) {
      return 0;
    }

    return ((fromIdx + toIdx) % 2 === 0) ? -1 : 1;
  };

  if (Object.keys(positions).length === 0 || !nodes.every((n) => positions[n])) {
    return null;
  }

  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <CardHeader className="py-4 border-zinc-800">
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <Badge variant="outline" className="text-[10px] text-zinc-400 font-normal shadow-sm border-zinc-700">
            Drag states to reposition
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex items-center justify-center relative min-h-[350px]">
        <AnimatePresence mode="wait">
          <motion.svg
            ref={svgRef}
            key={graphKey}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            viewBox={`0 0 ${canvasWidth} ${SVG_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full bg-zinc-950 rounded-b-xl cursor-grab active:cursor-grabbing"
          >
            <defs>
              <marker id={`arrow-${graphKey}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-zinc-500" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const { from, to, symbols } = edge;
              const symbolText = symbols.join(", ");
              const p1 = positions[from];
              const p2 = positions[to];
              const selfLoop = from === to;

              if (selfLoop) {
                const side = getBestSelfLoopSide(from);
                const dirX = side.dx;
                const dirY = side.dy;
                
                const baseAngle = Math.atan2(dirY, dirX);
                const spread = Math.PI / 5.5;
                const startAngle = baseAngle + spread;
                const endAngle = baseAngle - spread;

                const startX = p1.x + nodeRadius * Math.cos(startAngle);
                const startY = p1.y + nodeRadius * Math.sin(startAngle);
                const endX = p1.x + arrowPadding * Math.cos(endAngle);
                const endY = p1.y + arrowPadding * Math.sin(endAngle);

                const cpDist = 70;
                const cp1X = p1.x + cpDist * Math.cos(startAngle);
                const cp1Y = p1.y + cpDist * Math.sin(startAngle);
                const cp2X = p1.x + cpDist * Math.cos(endAngle);
                const cp2Y = p1.y + cpDist * Math.sin(endAngle);

                const textDist = 85;
                const textX = p1.x + textDist * Math.cos(baseAngle);
                const textY = p1.y + textDist * Math.sin(baseAngle) + 4;

                return (
                  <motion.g key={`${from}-${to}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                    <motion.path
                      animate={{ d: `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}` }}
                      transition={animTransition}
                      fill="none"
                      strokeWidth="2"
                      markerEnd={`url(#arrow-${graphKey})`}
                      className="stroke-zinc-600"
                    />
                    <motion.text
                      animate={{ x: textX, y: textY }}
                      transition={animTransition}
                      textAnchor="middle"
                      className="stroke-zinc-950 stroke-[5px] fill-transparent text-sm font-bold"
                      strokeLinejoin="round"
                    >
                      {symbolText}
                    </motion.text>
                    <motion.text
                      animate={{ x: textX, y: textY }}
                      transition={animTransition}
                      textAnchor="middle"
                      className="fill-red-400 text-sm font-bold"
                    >
                      {symbolText}
                    </motion.text>
                  </motion.g>
                );
              }

              const fromIdx = nodes.indexOf(from);
              const toIdx = nodes.indexOf(to);
              const absDist = Math.abs(toIdx - fromIdx);
              const reverseExists = hasReverseEdge(from, to);

              let startX = 0;
              let startY = 0;
              let endX = 0;
              let endY = 0;
              let cpX = 0;
              let cpY = 0;
              let textX = 0;
              let textY = 0;

              const dir = getCurveDirection(fromIdx, toIdx, reverseExists);

              if (absDist === 1 && dir === 0) {
                startX = p1.x + nodeRadius;
                startY = p1.y;
                endX = p2.x - arrowPadding;
                endY = p2.y;

                const tinyCurve = ((fromIdx + toIdx) % 2 === 0) ? -10 : 10;
                cpX = (startX + endX) / 2;
                cpY = CENTER_Y + tinyCurve;

                textX = cpX;
                textY = cpY + (tinyCurve < 0 ? -8 : 16);
              } else {
                const curveHeight = dir * getCurveMagnitude(absDist || 1);

                const midX = (p1.x + p2.x) / 2;
                const midY = CENTER_Y;

                cpX = midX;
                cpY = midY + curveHeight;

                const angle1 = Math.atan2(cpY - p1.y, cpX - p1.x);
                const angle2 = Math.atan2(p2.y - cpY, p2.x - cpX);

                startX = p1.x + nodeRadius * Math.cos(angle1);
                startY = p1.y + nodeRadius * Math.sin(angle1);
                endX = p2.x - arrowPadding * Math.cos(angle2);
                endY = p2.y - arrowPadding * Math.sin(angle2);

                const labelPoint = quadraticPoint(
                  { x: startX, y: startY },
                  { x: cpX, y: cpY },
                  { x: endX, y: endY },
                  0.5
                );

                textX = labelPoint.x;
                textY = labelPoint.y + (curveHeight < 0 ? -16 : 24);
              }

              return (
                <motion.g key={`${from}-${to}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                  <motion.path
                    animate={{ d: `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}` }}
                    transition={animTransition}
                    fill="none"
                    strokeWidth="2"
                    markerEnd={`url(#arrow-${graphKey})`}
                    className="stroke-zinc-600"
                  />
                  <motion.text
                    animate={{ x: textX, y: textY }}
                    transition={animTransition}
                    textAnchor="middle"
                    className="stroke-zinc-950 stroke-[5px] fill-transparent text-sm font-bold"
                    strokeLinejoin="round"
                  >
                    {symbolText}
                  </motion.text>
                  <motion.text
                    animate={{ x: textX, y: textY }}
                    transition={animTransition}
                    textAnchor="middle"
                    className="fill-red-400 text-sm font-bold"
                  >
                    {symbolText}
                  </motion.text>
                </motion.g>
              );
            })}

            {positions[dfa.startState] && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.line
                  animate={{
                    x1: positions[dfa.startState].x - 82,
                    y1: positions[dfa.startState].y,
                    x2: positions[dfa.startState].x - arrowPadding,
                    y2: positions[dfa.startState].y
                  }}
                  transition={animTransition}
                  strokeWidth="2.5"
                  markerEnd={`url(#arrow-${graphKey})`}
                  className="stroke-zinc-500"
                />
                <motion.text
                  animate={{ x: positions[dfa.startState].x - 92, y: positions[dfa.startState].y + 4 }}
                  transition={animTransition}
                  className="fill-zinc-300 text-sm font-bold text-center"
                >
                  Start
                </motion.text>
              </motion.g>
            )}

            {dfa.states.map((state) => {
              const position = positions[state];
              const isFinal = dfa.finalStates.includes(state);
              const isActive = activeStates.some((a) => state === a || state.includes(a));

              return (
                <motion.g
                  key={state}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: isActive && mergeMode ? 1.15 : isActive ? 1.08 : 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ cursor: "grab" }}
                  whileTap={{ cursor: "grabbing" }}
                  onPanStart={() => setIsDragging(true)}
                  onPanEnd={() => setIsDragging(false)}
                  onPan={(e, info) => {
                    let scaleX = 1;
                    let scaleY = 1;

                    if (svgRef.current) {
                      const rect = svgRef.current.getBoundingClientRect();
                      scaleX = canvasWidth / rect.width;
                      scaleY = SVG_HEIGHT / rect.height;
                    }

                    setPositions((prev) => ({
                      ...prev,
                      [state]: {
                        x: prev[state].x + info.delta.x * scaleX,
                        y: prev[state].y + info.delta.y * scaleY
                      }
                    }));
                  }}
                >
                  <motion.circle
                    animate={{ cx: position.x, cy: position.y }}
                    transition={animTransition}
                    r="25"
                    className={`${isActive ? "fill-red-950/80 stroke-red-500 stroke-[3px]" : "fill-zinc-800 stroke-zinc-500"}`}
                    strokeWidth="2"
                  />
                  {isFinal && (
                    <motion.circle
                      animate={{ cx: position.x, cy: position.y }}
                      transition={animTransition}
                      r="20"
                      className={`fill-none ${isActive ? "stroke-red-400" : "stroke-zinc-500"}`}
                      strokeWidth="1.5"
                    />
                  )}
                  <motion.text
                    animate={{ x: position.x, y: position.y + 4 }}
                    transition={animTransition}
                    textAnchor="middle"
                    className="fill-zinc-100 text-[13px] font-bold pointer-events-none select-none"
                  >
                    {state}
                  </motion.text>
                </motion.g>
              );
            })}
          </motion.svg>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function PartitionTable({ partitions }: { partitions: string[][] }) {
  return (
    <Card className="h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <CardHeader>
        <CardTitle>Current Partitions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {partitions.map((group, idx) => (
            <motion.div key={idx} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-300">Group {idx + 1}</div>
                <Badge variant="outline" className="bg-zinc-900 border-zinc-700">{group.length}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.map((state) => (
                  <motion.div layout key={state}><Badge variant="default" className="rounded-md px-2 py-1 text-xs bg-zinc-800 border-zinc-700 text-zinc-200">{state}</Badge></motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- MAIN APPLICATION INTERFACE ---

export default function App() {
  const sampleText = JSON.stringify(sampleDFA, null, 2);
  const [view, setView] = useState<"input" | "walkthrough">("input");
  const [inputMode, setInputMode] = useState<"table" | "json">("table");
  const [input, setInput] = useState(sampleText);
  const [submitted, setSubmitted] = useState(sampleText);
  const [formError, setFormError] = useState("");
  const [formState, setFormState] = useState<DFAFormState>(dfaToFormState(sampleDFA));

  // Walkthrough State
  const [activeTab, setActiveTab] = useState<"marking" | "merging">("marking");
  const [markStep, setMarkStep] = useState(0);
  const [mergeStep, setMergeStep] = useState(0);
  
  // Animation states
  const [animIndex, setAnimIndex] = useState(0);
  const [animSymbolIndex, setAnimSymbolIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  const [replayTrigger, setReplayTrigger] = useState(0);
  const [mergePhase, setMergePhase] = useState<"idle" | "checking" | "merging" | "merged">("idle");

  const parsed = useMemo(() => parseDFA(submitted), [submitted]);
  const result = useMemo(() => {
    if (!parsed.dfa) return null;
    return minimizeDFA(parsed.dfa);
  }, [parsed]);

  const formStates = useMemo(() => normalizeList(formState.statesText), [formState.statesText]);
  const formAlphabet = useMemo(() => normalizeList(formState.alphabetText), [formState.alphabetText]);

  // Derive current step
  const activeStep = result ? (activeTab === "marking" ? result.markingSteps[markStep] : result.mergingSteps[mergeStep]) : null;

  // The Graph needs to know exactly which set of nodes to render depending on the merge state
  const currentGraphState = useMemo(() => {
    if (activeTab === "merging" && activeStep?.phase === "merge-execute" && mergePhase === "merging") {
      return activeStep.preMergeGraph;
    }
    return activeStep?.graph || parsed.dfa;
  }, [activeTab, activeStep, mergePhase, parsed.dfa]);

  // Derive evaluation for display based on animation phase or selected history
  const getEvaluationForPair = (pair: [string, string]) => {
    if (!result) return null;
    if (activeTab === "merging" && activeStep?.phase === "final") {
       const found = activeStep.evaluations?.find(e => e.pair[0] === pair[0] && e.pair[1] === pair[1]);
       if (found) return { passTitle: "Minimized States Verification", evalData: found };
    }
    
    for (let i = markStep; i >= 0; i--) {
      const evals = result.markingSteps[i].evaluations;
      if (evals) {
        const found = evals.find(e => e.pair[0] === pair[0] && e.pair[1] === pair[1]);
        if (found) return { passTitle: result.markingSteps[i].title, evalData: found };
      }
    }
    return null;
  };

  const activeEval = isPlaying && activeStep?.evaluations ? activeStep.evaluations[animIndex] : null;
  const historyEval = !isPlaying && selectedPair ? getEvaluationForPair(selectedPair) : null;
  const highlightedPair = isPlaying && activeEval ? activeEval.pair : selectedPair;

  const checkCountBeforeDecision = activeStep?.phase === "iterative-mark" && activeEval
    ? activeEval.isMarked ? activeEval.symbolChecks.findIndex((c) => c.status === "distinguishable") + 1 : activeEval.symbolChecks.length
    : 0;

  const activeSymbol = isPlaying && activeEval && animSymbolIndex < checkCountBeforeDecision 
    ? activeEval.symbolChecks[animSymbolIndex]?.symbol : null;

  // Derive the table snapshot so we can unmark things during live animation
  const currentTableRows = useMemo(() => {
    if (!activeStep?.tableSnapshot) return [];
    let rows = [...activeStep.tableSnapshot];
    if (isPlaying && activeStep.evaluations) {
      rows = rows.map(r => {
        const idx = activeStep.evaluations ? activeStep.evaluations.findIndex(e => e.pair[0] === r.pair[0] && e.pair[1] === r.pair[1]) : -1;
        if (idx !== -1) {
          const evalObj = activeStep.evaluations![idx];
          const isCurrentAnimating = idx === animIndex;
          const isFuture = idx > animIndex;
          
          if (evalObj.isMarked) {
            if (isFuture) {
               return { ...r, mark: "unmarked" };
            }
            if (isCurrentAnimating) {
               const decisiveIndex = evalObj.symbolChecks.findIndex(c => c.status === "distinguishable");
               if (animSymbolIndex <= decisiveIndex) {
                  return { ...r, mark: "unmarked" };
               }
            }
          }
        }
        return r;
      });
    }
    return rows;
  }, [activeStep, isPlaying, animIndex, animSymbolIndex]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      transitions: buildEmptyTransitions(formStates, formAlphabet, prev.transitions),
      startState: formStates.includes(prev.startState) ? prev.startState : formStates[0] ?? ""
    }));
  }, [formState.statesText, formState.alphabetText, formStates, formAlphabet]);

  // When step changes, setup animation
  useEffect(() => {
    if (activeTab === "marking" && activeStep?.phase === "iterative-mark") {
      setAnimIndex(0);
      setAnimSymbolIndex(0);
      setIsPlaying(true);
      setSelectedPair(null);
    } else {
      setIsPlaying(false);
      setSelectedPair(null);
    }

    if (activeTab === "merging" && activeStep?.phase === "merge-execute") {
      // Very short explicit animation loop for gliding nodes together
      setMergePhase("merging");
      const t = setTimeout(() => setMergePhase("merged"), 800);
      return () => clearTimeout(t);
    } else {
      setMergePhase("idle");
    }
  }, [markStep, mergeStep, activeTab, activeStep, replayTrigger]);

  // Main animation loop for Iterative Marking
  useEffect(() => {
    if (!isPlaying || activeTab !== "marking" || activeStep?.phase !== "iterative-mark") return;
    if (!activeStep.evaluations) return;

    const evalObj = activeStep.evaluations[animIndex];
    if (!evalObj) return;

    const maxSymbolIndex = evalObj.isMarked 
      ? evalObj.symbolChecks.findIndex(c => c.status === "distinguishable") + 1
      : evalObj.symbolChecks.length;

    if (animSymbolIndex < maxSymbolIndex) {
      const timer = setTimeout(() => setAnimSymbolIndex(s => s + 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (activeStep.evaluations && animIndex < activeStep.evaluations.length - 1) {
          setAnimIndex(i => i + 1);
          setAnimSymbolIndex(0);
        } else {
          setIsPlaying(false);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, activeTab, activeStep, animIndex, animSymbolIndex]);

  const handleReplay = () => {
    setSelectedPair(null);
    setIsPlaying(true);
    setReplayTrigger(r => r + 1);
  };

  const handleCellClick = (pair: [string, string]) => {
    if (!result) return;
    
    if (activeTab === "merging" && activeStep?.phase === "final") {
      setSelectedPair(pair);
      return;
    }
    
    let foundIndex = -1;
    for (let i = markStep; i >= 0; i--) {
       const evals = result.markingSteps[i].evaluations;
       if (evals && evals.some(e => e.pair[0] === pair[0] && e.pair[1] === pair[1])) {
           foundIndex = i;
           break;
       }
    }
    
    if (foundIndex !== -1) {
      setIsPlaying(false); 
      setMarkStep(foundIndex); 
      setSelectedPair(pair);
    } else {
      const baseIndex = result.markingSteps.findIndex(s => s.phase === "base-mark" && (s.evaluations && s.evaluations.length > 0));
      if (baseIndex !== -1) {
        setIsPlaying(false);
        setMarkStep(baseIndex);
        setSelectedPair(pair);
      }
    }
  };

  const handleAddState = () => {
    const currentStates = normalizeList(formState.statesText);
    setFormError("");
    
    let nextState = "A";
    if (currentStates.length > 0) {
      const last = currentStates[currentStates.length - 1];
      const matchInt = last.match(/^(.*?)(\d+)$/);
      if (matchInt) {
        nextState = matchInt[1] + (parseInt(matchInt[2], 10) + 1);
      } else if (last.length === 1 && last >= 'A' && last < 'Z') {
        nextState = String.fromCharCode(last.charCodeAt(0) + 1);
      } else if (last.length === 1 && last >= 'a' && last < 'z') {
        nextState = String.fromCharCode(last.charCodeAt(0) + 1);
      } else {
        nextState = last + "_new";
      }
    }
    
    let counter = 1;
    let candidate = nextState;
    while (currentStates.includes(candidate)) {
       candidate = nextState + counter;
       counter++;
    }
    setFormState(p => ({...p, statesText: p.statesText ? p.statesText + ", " + candidate : candidate}));
  };

  const handleAddSymbol = () => {
    const currentAlphabet = normalizeList(formState.alphabetText);
    let nextSym = "0";
    
    if (currentAlphabet.length > 0) {
      const last = currentAlphabet[currentAlphabet.length - 1];
      if (last === "0") nextSym = "1";
      else if (last === "1") nextSym = "2";
      else if (last === "a") nextSym = "b";
      else if (last.length === 1 && last >= 'A' && last < 'Z') nextSym = String.fromCharCode(last.charCodeAt(0) + 1);
      else if (last.length === 1 && last >= 'a' && last < 'z') nextSym = String.fromCharCode(last.charCodeAt(0) + 1);
      else nextSym = "x";
    }
    
    let counter = 1;
    let candidate = nextSym;
    while (currentAlphabet.includes(candidate)) {
       candidate = nextSym + counter;
       counter++;
    }
    setFormState(p => ({...p, alphabetText: p.alphabetText ? p.alphabetText + ", " + candidate : candidate}));
  };

  const handleRemoveState = (stateToRemove: string) => {
    const currentStates = normalizeList(formState.statesText);
    if (currentStates.length <= 1) {
      setFormError("You must have at least one state.");
      return;
    }
    setFormError("");
    const newStates = currentStates.filter(s => s !== stateToRemove);
    setFormState(p => ({ ...p, statesText: newStates.join(", ") }));
  };

  function loadSample() {
    setInput(sampleText);
    setSubmitted(sampleText);
    setFormState(dfaToFormState(sampleDFA));
    setFormError("");
    setMarkStep(0);
    setMergeStep(0);
    setActiveTab("marking");
  }

  function startWalkthrough(dfaString: string) {
    setInput(dfaString);
    setSubmitted(dfaString);
    setFormError("");
    setMarkStep(0);
    setMergeStep(0);
    setActiveTab("marking");
    setView("walkthrough");
  }

  function buildAndRunFromTable() {
    const built = formStateToDFA(formState);
    if (!built.dfa) return setFormError(built.error ?? "Invalid Structural Data.");
    startWalkthrough(JSON.stringify(built.dfa, null, 2));
  }

  const handleNext = () => {
    setSelectedPair(null);
    if (activeTab === "marking") {
      if (result && markStep < result.markingSteps.length - 1) {
         const nextIdx = markStep + 1;
         setMarkStep(nextIdx);
         setIsPlaying(result.markingSteps[nextIdx].phase === "iterative-mark");
      } else {
         setActiveTab("merging"); 
         setIsPlaying(false);
      }
    } else {
      if (result && mergeStep < result.mergingSteps.length - 1) setMergeStep(m => m + 1);
    }
  };

  const handlePrev = () => {
    setSelectedPair(null);
    setIsPlaying(false);
    if (activeTab === "merging") {
      if (mergeStep > 0) setMergeStep(m => m - 1);
      else {
         setActiveTab("marking"); 
      }
    } else {
      if (markStep > 0) {
         setMarkStep(m => m - 1);
      }
    }
  };

  useEffect(() => {
    if (view !== "walkthrough") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        if (mergePhase !== "merging") {
          handleNext();
        }
      } else if (e.key === "ArrowLeft") {
        if (!(activeTab === "marking" && markStep === 0)) {
          handlePrev();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const shellClass = "min-h-screen w-full bg-zinc-950 p-4 md:p-8 text-zinc-100 flex flex-col font-sans selection:bg-red-500/30";

  const renderPairEvaluation = (evalData: PairEvaluation, visibleSymbolsCount?: number, customTitle?: string) => {
    const symbolsToShow = visibleSymbolsCount !== undefined ? evalData.symbolChecks.slice(0, visibleSymbolsCount) : evalData.symbolChecks;
    const showFinalDecision = visibleSymbolsCount === undefined || visibleSymbolsCount > evalData.symbolChecks.length || (evalData.isMarked && visibleSymbolsCount >= evalData.symbolChecks.findIndex((c) => c.status === "distinguishable") + 1);

    return (
      <div className="space-y-4">
        {customTitle && <div className="text-xs font-bold tracking-wider text-red-500 uppercase mb-2">{customTitle}</div>}
        <div className="flex items-center gap-3 text-lg font-bold mb-6 text-zinc-100">
          Checking Pair: <Badge variant="outline" className="text-sm px-3 py-1 shadow-sm border-zinc-700 bg-zinc-800">({evalData.pair[0]}, {evalData.pair[1]})</Badge>
        </div>

        <div className="flex flex-col gap-4">
          {symbolsToShow.map((row, index) => {
            const isDist = row.status === "distinguishable";
            return (
              <motion.div 
                key={row.symbol} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-2xl border transition-all shadow-sm ${isDist ? "bg-red-950/40 border-red-900" : "bg-zinc-900 border-zinc-800"}`}
              >
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  
                  {/* Input Block */}
                  <div className="flex flex-col items-center justify-center bg-zinc-950 rounded-xl w-16 h-16 border border-zinc-800 shrink-0 shadow-inner">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Input</span>
                    <span className="text-xl font-black text-red-500">{row.symbol}</span>
                  </div>

                  {/* Transitions Block */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-zinc-200 shadow-sm">{evalData.pair[0]}</div>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                      <div className={`w-8 h-8 rounded-full border-2 ${isDist ? 'border-red-800 bg-red-900/50 text-red-300' : 'border-zinc-700 bg-zinc-800 text-zinc-200'} flex items-center justify-center font-bold shadow-sm`}>{row.nextStates[0]}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-zinc-200 shadow-sm">{evalData.pair[1]}</div>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                      <div className={`w-8 h-8 rounded-full border-2 ${isDist ? 'border-red-800 bg-red-900/50 text-red-300' : 'border-zinc-700 bg-zinc-800 text-zinc-200'} flex items-center justify-center font-bold shadow-sm`}>{row.nextStates[1]}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-zinc-600 hidden md:block shrink-0" />

                  {/* Target Pair Block */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Leads To</span>
                    {row.nextPair ? (
                       <Badge variant="outline" className="text-sm px-4 py-1.5 border-zinc-700 bg-zinc-800 shadow-sm font-semibold rounded-full text-zinc-200">Pair ({row.nextPair.join(", ")})</Badge>
                    ) : (
                       <Badge variant="outline" className="text-sm px-4 py-1.5 border-zinc-700 bg-zinc-950 text-zinc-400 shadow-sm font-semibold rounded-full">Same State ({row.nextStates[0]})</Badge>
                    )}
                  </div>

                  {/* Result Badge */}
                  <div className="sm:ml-auto w-full sm:w-auto flex justify-start sm:justify-end border-t border-zinc-800 sm:border-0 pt-4 sm:pt-0">
                     <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl border ${isDist ? 'bg-red-900/40 border-red-800 text-red-400' : 'bg-emerald-950/40 border-emerald-900 text-emerald-400'}`}>
                       <span className="font-bold text-sm">{isDist ? "Distinguishable" : "Equivalent"}</span>
                       <span className="text-xs opacity-80">{isDist ? "(Marked)" : "(Unmarked so far)"}</span>
                     </div>
                  </div>
                </div>
                
                {/* Explanation Footer */}
                <div className="mt-4 text-sm text-zinc-300 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
                   {row.reason}
                </div>
              </motion.div>
            );
          })}
        </div>

        {showFinalDecision && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex items-start gap-4 rounded-2xl p-5 border shadow-sm mt-6 ${evalData.isMarked ? "border-red-900 bg-red-950/50 text-red-300" : "border-zinc-800 bg-zinc-900 text-zinc-200"}`}>
            {evalData.isMarked ? <XCircle className="h-8 w-8 shrink-0 text-red-500" /> : <CheckCircle2 className="h-8 w-8 shrink-0 text-zinc-500" />}
            <div>
              <div className="font-bold text-lg mb-1">{evalData.isMarked ? "Decision: Marked (Distinguishable)" : "Decision: Left Unmarked"}</div>
              <div className="leading-relaxed opacity-90">{evalData.reason}</div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  if (view === "walkthrough" && result && parsed.dfa && activeStep) {
    const isFirstStep = activeTab === "marking" && markStep === 0;
    const isLastStep = activeTab === "merging" && mergeStep === result.mergingSteps.length - 1;

    return (
      <div className={shellClass}>
        
        {/* Floating Controls with Frosted Glass */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md p-2 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-zinc-700">
           <Button variant="glass" size="icon" onClick={handlePrev} disabled={isFirstStep} title="Previous Step (Left Arrow)">
             <ArrowLeft className="w-6 h-6 stroke-[2.5] text-zinc-100" />
           </Button>
           <Button variant="glass" size="icon" onClick={() => setView("input")} title="Home">
             <Home className="w-5 h-5 stroke-[2.5] text-zinc-100" />
           </Button>
           <Button variant="default" size="icon" onClick={handleNext} disabled={isLastStep || mergePhase === "merging"} title="Next Step (Right Arrow)" className="rounded-full h-14 w-14">
             <ArrowRight className="w-6 h-6 stroke-[2.5]" />
           </Button>
        </div>

        <div className="mx-auto max-w-[1400px] w-full flex-1 flex flex-col gap-6 pb-20">
          
          {/* HEADER AND CONTROLS */}
          <Card className="border-0 bg-zinc-900 shadow-sm shrink-0">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between pt-5">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-950/50 text-red-400 border border-red-900 px-3 py-1 text-xs font-bold">
                  <Sparkles className="h-3 w-3" /> Teacher's Myhill-Nerode Visualizer
                </div>
                <h2 className="text-xl font-bold text-zinc-50 flex items-center gap-2">
                  Interactive DFA Minimization
                  <span className="text-xs font-normal text-zinc-500 ml-2">(Use ⬅️ ➡️ arrow keys)</span>
                </h2>
              </div>
              
              {/* TABS */}
              <div className="flex bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl w-fit">
                <button 
                  onClick={() => { setActiveTab("marking"); setSelectedPair(null); }} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "marking" ? "bg-red-600 text-white shadow-sm shadow-red-900/40" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                >
                  <FileSearch className="w-4 h-4" /> 1. Table Filling (Marking)
                </button>
                <button 
                  onClick={() => { setActiveTab("merging"); setSelectedPair(null); }} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "merging" ? "bg-red-600 text-white shadow-sm shadow-red-900/40" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"}`}
                >
                  <ListTree className="w-4 h-4" /> 2. Conversion (Merging)
                </button>
              </div>

            </CardContent>
          </Card>

          {/* MAIN VISUALIZATION AREA */}
          <div className="flex-1 flex flex-col gap-6 min-h-0">
            
            {/* TOP ROW: GRAPH (Full Width) */}
            <div className="shrink-0 h-[45vh] min-h-[350px]">
              <GraphView 
                dfa={currentGraphState || parsed.dfa!} 
                title={activeTab === "merging" ? "Dynamic Minimized Graph" : "Original DFA Graph"}
                graphKey={`graph-${activeTab}-${activeTab === "marking" ? markStep : mergeStep}`} 
                activeStates={highlightedPair || (activeStep.pair ? activeStep.pair : [])} 
                mergeMode={activeTab === "merging"}
                mergingPair={activeTab === "merging" && activeStep.phase === "merge-execute" && mergePhase === "merging" ? activeStep.mergingNodes : null}
              />
            </div>

            {/* BOTTOM ROW: Tables & Logic */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
              
              {/* BOTTOM LEFT: Tables */}
              <div className="h-full flex flex-col gap-6">
                {activeTab === "marking" ? (
                  <TriangularTableSnapshot 
                    dfa={parsed.dfa!} 
                    rows={currentTableRows} 
                    activePair={highlightedPair || null}
                    title="Myhill-Nerode Markings"
                    onCellClick={handleCellClick}
                  />
                ) : (
                  <>
                    <div className="min-h-[250px] flex-1">
                      {(activeStep.phase === "merge-check" || activeStep.phase === "merge-execute" || activeStep.phase === "final") ? (
                        <TriangularTableSnapshot 
                          dfa={activeStep.phase === "final" ? currentGraphState! : parsed.dfa!} 
                          rows={activeStep.tableSnapshot} 
                          activePair={highlightedPair || (activeStep.pair ? activeStep.pair : null)} 
                          title="Myhill-Nerode Matrix"
                          onCellClick={activeStep.phase === "final" ? handleCellClick : undefined}
                        />
                      ) : (
                        <PartitionTable partitions={activeStep.mergedGroups || []} />
                      )}
                    </div>
                  </>
                )}
                
                <div className="min-h-[250px] flex-1">
                  <TransitionTable 
                    dfa={currentGraphState!} 
                    title="Transition Table" 
                    highlightedStates={activeStep.pair && activeStep.pair[0] ? activeStep.pair : []}
                    activeSymbol={activeSymbol}
                  />
                </div>
              </div>

              {/* BOTTOM RIGHT: STEP EXPLANATION PANEL */}
              <div className="h-full">
                <Card className="h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                  <CardHeader className="bg-zinc-900/80 flex flex-row items-start justify-between">
                    <div>
                      <div className="text-xs font-bold tracking-wider text-red-500 uppercase mb-1">{activeTab === "marking" ? "Step Logic: Table Filling" : "Step Logic: Merging"}</div>
                      <CardTitle className="text-xl text-zinc-50">{activeStep.title}</CardTitle>
                      <p className="text-sm text-zinc-400 mt-2">{activeStep.description}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto pt-6">

                    {/* MARKING PHASE RENDERING */}
                    {activeTab === "marking" && activeStep.phase === "base-mark" && (
                      historyEval && historyEval.evalData ? (
                        renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                      ) : (
                        <div className={`flex flex-col gap-3 p-5 border rounded-2xl shadow-sm ${activeStep.evaluations && activeStep.evaluations.length > 0 ? 'border-emerald-900 bg-emerald-950/40 text-emerald-300' : 'border-zinc-800 bg-zinc-900 text-zinc-200'}`}>
                          <div className="flex items-center gap-4">
                             {activeStep.evaluations && activeStep.evaluations.length > 0 ? <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" /> : <CheckSquare className="h-8 w-8 shrink-0 text-zinc-500" />}
                             <div className="font-bold text-xl text-zinc-100">{activeStep.title}</div>
                          </div>
                          <div className="leading-relaxed mt-2">{activeStep.reason || activeStep.description}</div>
                          {activeStep.evaluations && activeStep.evaluations.length > 0 && (
                            <div className="mt-2 text-sm font-semibold flex items-center gap-2">
                              <MousePointerClick className="w-4 h-4 text-zinc-500" /> Tap any cell in the matrix to inspect its logic.
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {activeTab === "marking" && activeStep.phase === "iterative-mark" && (
                      isPlaying && activeEval ? (
                        renderPairEvaluation(activeEval, animSymbolIndex + 1)
                      ) : (
                        historyEval && historyEval.evalData ? (
                           renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                        ) : (
                           <div className="flex items-center gap-4 rounded-2xl p-5 border border-emerald-900 bg-emerald-950/40 text-emerald-300 shadow-sm">
                             <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                             <div>
                               <div className="font-bold text-lg mb-1 text-zinc-100">Iteration Complete</div>
                               <div className="leading-relaxed opacity-90">This pass evaluated {activeStep.evaluations?.length} unmarked pairs.</div>
                               <div className="mt-3 text-sm font-semibold text-emerald-400">Click any cell in the table to inspect its specific evaluation.</div>
                             </div>
                           </div>
                        )
                      )
                    )}

                    {/* MERGING PHASE RENDERING */}
                    {activeTab === "merging" && (activeStep.phase === "merge-check" || activeStep.phase === "merge-execute") && activeStep.pair && (
                       <div className="space-y-6">
                         {/* Step 1: Check Myhill Table */}
                         <motion.div animate={{ opacity: activeStep.phase === "merge-check" ? 1 : 0.4 }} className={`flex items-center gap-4 rounded-2xl p-4 border shadow-sm transition-opacity duration-500 ${activeStep.phase === "merge-check" ? 'border-zinc-600 bg-zinc-800' : 'border-zinc-800 bg-zinc-900/50'}`}>
                           <CheckSquare className="h-6 w-6 text-zinc-400 shrink-0" />
                           <div>
                             <div className="font-bold text-zinc-100">1. Verify Myhill-Nerode Table</div>
                             <div className="text-sm text-zinc-400 mt-1">Pair <Badge variant="outline" className="bg-zinc-950 border-zinc-700">({activeStep.pair[0]}, {activeStep.pair[1]})</Badge> remains <strong className="text-zinc-200">UNMARKED</strong>. They are strictly equivalent.</div>
                           </div>
                         </motion.div>
                         
                         {/* Step 2: Merge Visualization */}
                         {activeStep.phase === "merge-execute" && (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 rounded-2xl p-5 border border-red-900 bg-red-950/40 text-red-300 shadow-sm">
                             <GitMerge className="h-8 w-8 shrink-0 text-red-500" />
                             <div className="flex-1">
                               <div className="font-bold text-lg mb-3 text-zinc-100">2. Combine States</div>
                               <div className="flex items-center gap-2 flex-wrap">
                                 <div className="flex items-center justify-center min-w-[40px] h-10 px-2 rounded-full border-2 border-red-800 bg-zinc-900 text-red-400 font-bold shadow-sm">{activeStep.pair[0]}</div>
                                 <span className="text-red-500 font-bold text-lg">+</span>
                                 <div className="flex items-center justify-center min-w-[40px] h-10 px-2 rounded-full border-2 border-red-800 bg-zinc-900 text-red-400 font-bold shadow-sm">{activeStep.pair[1]}</div>
                                 <ArrowRight className="w-5 h-5 mx-1 text-red-600" />
                                 <motion.div 
                                   initial={{ scale: 0.8, opacity: 0 }}
                                   animate={{ scale: [1.2, 1], opacity: 1 }}
                                   transition={{ duration: 0.5 }}
                                   className="flex items-center justify-center px-4 h-10 rounded-full border-2 border-red-500 bg-red-600 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                                 >
                                   {(() => {
                                      const currentPair = activeStep.pair || ["", ""];
                                      const group = activeStep.mergedGroups?.find(g => g.includes(currentPair[0]) && g.includes(currentPair[1]));
                                      return `{${group ? group.join(",") : `${currentPair[0]},${currentPair[1]}`}}`;
                                   })()}
                                 </motion.div>
                               </div>
                               {mergePhase === "merged" && <div className="text-xs text-red-400/80 font-semibold mt-3 italic">The transition table and graph have been successfully merged.</div>}
                             </div>
                           </motion.div>
                         )}
                       </div>
                    )}

                    {activeTab === "merging" && activeStep.phase === "final" && (
                       historyEval && historyEval.evalData ? (
                          renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                       ) : (
                         <div className="flex items-center gap-4 rounded-2xl p-5 border border-emerald-900 bg-emerald-950/40 text-emerald-300 shadow-sm">
                           <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                           <div>
                             <div className="font-bold text-lg mb-1 text-zinc-100">Minimization Complete</div>
                             <div className="leading-relaxed opacity-90">The DFA is now fully optimized with no redundant states remaining.</div>
                             <div className="mt-3 text-sm font-semibold text-emerald-400">Click any cell in the table to see why these specific minimized states are distinguishable.</div>
                           </div>
                         </div>
                       )
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="mx-auto max-w-7xl space-y-6 w-full">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-zinc-900 border border-zinc-800 p-8 text-zinc-100 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-950/50 border border-red-900 text-red-400 px-4 py-1 text-sm font-bold">
                <Sparkles className="h-4 w-4" /> Myhill-Nerode Visualizer for Educators
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-zinc-50">Interactive DFA Minimization</h1>
              <p className="mt-3 max-w-3xl text-zinc-400">
                Configure your DFA below. The walkthrough rigidly follows the iterative table-filling theorem, providing a locked side-by-side layout optimized for classroom presentations.
              </p>
            </div>
          </div>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle>DFA Input Builder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <div className="inline-flex rounded-2xl bg-zinc-950 border border-zinc-800 p-1">
                <button
                  onClick={() => setInputMode("table")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                    inputMode === "table"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                  }`}
                >
                  Table Input
                </button>
                <button
                  onClick={() => setInputMode("json")}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition-all ${
                    inputMode === "json"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                  }`}
                >
                  JSON Input
                </button>
              </div>

            {inputMode === "table" ? (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">Q</span> (Finite set of states) <span className="font-normal text-zinc-500 text-xs ml-1">comma separated</span>
                    </label>
                    <Input value={formState.statesText} onChange={(e) => setFormState(p => ({ ...p, statesText: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">Σ</span> (Alphabet / Set of symbols) <span className="font-normal text-zinc-500 text-xs ml-1">comma separated</span>
                    </label>
                    <Input value={formState.alphabetText} onChange={(e) => setFormState(p => ({ ...p, alphabetText: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">q<sub>0</sub></span> (Initial state)
                    </label>
                    <Input value={formState.startState} onChange={(e) => setFormState(p => ({ ...p, startState: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">F</span> (Set of final states) <span className="font-normal text-zinc-500 text-xs ml-1">comma separated</span>
                    </label>
                    <Input value={formState.finalStatesText} onChange={(e) => setFormState(p => ({ ...p, finalStatesText: e.target.value }))} className="rounded-xl" />
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">δ</span> (Transition Function: Q × Σ → Q)
                    </label>
                    <button onClick={handleAddState} className="inline-flex items-center text-sm font-bold text-zinc-400 hover:text-red-400 transition-colors py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-600 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                      <Plus className="w-4 h-4 mr-1.5" /> Add State
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-950 text-zinc-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold border-b border-zinc-800">Current State</th>
                          {formAlphabet.map((symbol) => (
                            <th key={symbol} className="px-4 py-3 text-left font-bold border-b border-zinc-800">Next on {symbol}</th>
                          ))}
                          <th className="px-4 py-3 text-center font-bold border-b border-zinc-800 w-12">
                            <button onClick={handleAddSymbol} title="Add Input Symbol" className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/50 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence initial={false}>
                          {formStates.map((state) => (
                            <motion.tr 
                              key={state} 
                              initial={{ opacity: 0, y: -10, backgroundColor: "#450a0a" }} 
                              animate={{ opacity: 1, y: 0, backgroundColor: "#18181b" }} 
                              exit={{ opacity: 0, backgroundColor: "#450a0a" }}
                              transition={{ duration: 0.3 }}
                              className="border-b border-zinc-800 last:border-0"
                            >
                              <td className="px-4 py-4 font-bold text-zinc-100">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleRemoveState(state)} title={`Remove State ${state}`} className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 hover:bg-red-600 hover:text-white transition-colors flex-shrink-0 shadow-sm">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span>{state}</span>
                                </div>
                              </td>
                              {formAlphabet.map((symbol) => (
                                <td key={`${state}-${symbol}`} className="px-4 py-4">
                                  <Select
                                    value={formState.transitions[state]?.[symbol] ?? ""}
                                    onChange={(e) => setFormState(p => ({ ...p, transitions: { ...p.transitions, [state]: { ...p.transitions[state], [symbol]: e.target.value } } }))}
                                    className="min-w-[110px] rounded-xl"
                                  >
                                    <option value="" disabled className="text-zinc-600">Select...</option>
                                    {formStates.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </Select>
                                </td>
                              ))}
                              <td className="px-4 py-4"></td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button className="rounded-xl px-6" onClick={buildAndRunFromTable}><Play className="mr-2 h-4 w-4" /> Start Visualizer</Button>
                  <Button variant="secondary" className="rounded-xl px-6" onClick={loadSample}><RotateCcw className="mr-2 h-4 w-4" /> Load Sample</Button>
                </div>
                
                {formError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-900 bg-red-950/40 p-5 text-red-300 mt-4"><AlertCircle className="mt-0.5 h-5 w-5 text-red-500" /><div><div className="font-bold text-zinc-100 mb-1">Form Error</div><div className="text-sm">{formError}</div></div></div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[420px] rounded-2xl font-mono text-sm bg-zinc-950 text-zinc-300 border-zinc-800" />
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button className="rounded-xl px-6" onClick={() => startWalkthrough(input)}><Play className="mr-2 h-4 w-4" /> Start Visualizer</Button>
                  <Button variant="secondary" className="rounded-xl px-6" onClick={loadSample}><RotateCcw className="mr-2 h-4 w-4" /> Load Sample</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}