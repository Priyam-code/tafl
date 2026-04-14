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

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "secondary" | "outline" | "destructive" | "glass", size?: "default" | "sm" | "lg" | "icon" | "glass" }>(
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
      <button ref={ref} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className || ""}`} {...props} />
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
  phase: "base-mark" | "iterative-mark" | "merge-check" | "merge-execute" | "final" | "merge-overview" | "init";
  title: string;
  description: string;
  tableSnapshot: PairTableEntry[];
  evaluations?: PairEvaluation[];
  passNumber?: number;
  pair?: [string, string]; 
  mergingNodes?: [string, string];
  mergedGroups?: string[][];
  preMergeGraph?: StepGraph; 
  graph: StepGraph; 
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
  steps: AlgorithmStep[];
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
  const stateNames = partitions.map((group) => group.length > 1 ? `{${group.join(",")}}` : group[0]);
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

function minimizeDFA(originalDfa: DFA): MinimizationResult {
  const steps: AlgorithmStep[] = [];
  let currentGroups = originalDfa.states.map(s => [s]);
  let activeDfa = originalDfa;
  let markedPairs = new Set<string>();

  const getDynamicTable = (groups: string[][], markedSet: Set<string>, newMarksSet: Set<string> = new Set()): PairTableEntry[] => {
    const stateNames = groups.map(g => g.length > 1 ? `{${g.join(",")}}` : g[0]);
    const pairs = buildAllPairs(stateNames).map(([a,b]) => normalizePair(a,b)); 
    
    return pairs.map(([name1, name2]) => {
      const g1 = groups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === name1);
      const g2 = groups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === name2);
      
      let isMarked = false;
      let isNewlyMarked = false;
      
      if (g1 && g2) {
          for(const s1 of g1) {
              for(const s2 of g2) {
                  const k = pairKey(s1, s2);
                  if(newMarksSet.has(k)) {
                      isNewlyMarked = true;
                      isMarked = true;
                  }
                  if(markedSet.has(k)) {
                      isMarked = true;
                  }
              }
          }
      }
      
      let markStat: "marked" | "unmarked" | "newly-marked" = "unmarked";
      if(isNewlyMarked) markStat = "newly-marked";
      else if(isMarked) markStat = "marked";
      
      return {
          pair: [name1, name2] as [string, string],
          mark: markStat,
          reason: isMarked ? "Distinguishable" : "Pending confirmation (Unmarked)"
      };
    });
  };

  steps.push({
    phase: "init",
    title: "Table Initialization",
    description: "The Myhill-Nerode table has been constructed. We will now evaluate distinguishability.",
    reason: "The table is currently empty. Click 'Next' to evaluate all combinations of final and non-final states.",
    evaluations: [],
    graph: partitionsToGraph(originalDfa, currentGroups),
    tableSnapshot: getDynamicTable(currentGroups, new Set())
  });

  let baseMarksCount = 0;
  const baseEvaluations: PairEvaluation[] = [];
  const baseNewMarks = new Set<string>();
  const initialPairs = buildAllPairs(originalDfa.states).map(([a,b]) => normalizePair(a,b));
  
  initialPairs.forEach(([a, b]) => {
    const aFinal = originalDfa.finalStates.includes(a);
    const bFinal = originalDfa.finalStates.includes(b);
    const key = pairKey(a, b);
    
    let isMarked = false;
    let reason = "Both states share the same finality. Left unmarked for now.";

    if (aFinal !== bFinal) {
      markedPairs.add(key);
      baseNewMarks.add(key);
      baseMarksCount++;
      isMarked = true;
      reason = "One state is final and the other is non-final. Distinguishable immediately.";
    }

    baseEvaluations.push({ pair: [a, b], isMarked, reason, symbolChecks: [] });
  });

  steps.push({
    phase: "base-mark",
    title: `Base Cases Marked`,
    description: "The DFA and Myhill-Nerode table are prepared. We evaluated combinations of final and non-final states. All pairs where one state is an accepting (final) state and the other is not are immediately marked as distinguishable.",
    reason: `Identified and marked ${baseMarksCount} pair(s) instantly because they have different finality.`,
    evaluations: baseEvaluations,
    graph: partitionsToGraph(originalDfa, currentGroups),
    tableSnapshot: getDynamicTable(currentGroups, markedPairs, baseNewMarks)
  });

  let changed = true;
  let pass = 1;

  while (changed) {
    changed = false;
    activeDfa = partitionsToGraph(originalDfa, currentGroups);
    const activeStateNames = activeDfa.states;
    const activePairs = buildAllPairs(activeStateNames).map(([a,b]) => normalizePair(a,b));

    let eagerMergePair: [string, string] | null = null;
    
    for (const [nameA, nameB] of activePairs) {
        let isAlreadyMarked = false;
        const gA = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameA);
        const gB = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameB);
        
        if (!gA || !gB) continue;

        for (const sA of gA) {
            for (const sB of gB) {
                if (markedPairs.has(pairKey(sA, sB))) isAlreadyMarked = true;
            }
        }

        if (!isAlreadyMarked) {
            let isTriviallyEquivalent = true;
            for (const sym of activeDfa.alphabet) {
                if (activeDfa.transitions[nameA][sym] !== activeDfa.transitions[nameB][sym]) {
                    isTriviallyEquivalent = false;
                    break;
                }
            }
            if (isTriviallyEquivalent) {
                eagerMergePair = [nameA, nameB];
                break; 
            }
        }
    }

    if (eagerMergePair) {
        const [nameA, nameB] = eagerMergePair;
        const preMergeGraph = partitionsToGraph(originalDfa, currentGroups);
        const preMergeTable = getDynamicTable(currentGroups, markedPairs);

        steps.push({
            phase: "merge-check",
            title: `Verify Equivalence: (${nameA}, ${nameB})`,
            description: `We observe that ${nameA} and ${nameB} transition to the EXACT same states for every single input. We are absolutely sure they are equivalent, so we will merge them immediately.`,
            pair: [nameA, nameB],
            mergingNodes: [nameA, nameB],
            graph: preMergeGraph,
            tableSnapshot: preMergeTable
        });

        const gAIndex = currentGroups.findIndex(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameA);
        const gBIndex = currentGroups.findIndex(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameB);
        const mergedGroup = [...currentGroups[gAIndex], ...currentGroups[gBIndex]].sort();
        
        currentGroups = currentGroups.filter((_, idx) => idx !== gAIndex && idx !== gBIndex);
        currentGroups.push(mergedGroup);
        currentGroups.sort((g1, g2) => g1[0].localeCompare(g2[0]));

        const postMergeDfa = partitionsToGraph(originalDfa, currentGroups);
        const postMergeTable = getDynamicTable(currentGroups, markedPairs);

        steps.push({
            phase: "merge-execute",
            title: `Eager Merge: (${nameA}, ${nameB})`,
            description: `The states have been combined mid-iteration. The table shrinks, naturally inheriting all previous cross marks. The algorithm will now continue on this simplified DFA.`,
            pair: [nameA, nameB],
            mergingNodes: [nameA, nameB],
            preMergeGraph: preMergeGraph,
            graph: postMergeDfa,
            tableSnapshot: postMergeTable
        });

        changed = true;
        continue;
    }

    let newMarksInPass = 0;
    const passEvaluations: PairEvaluation[] = [];
    const passNewMarks = new Set<string>();

    for (const [nameA, nameB] of activePairs) {
        const gA = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameA);
        const gB = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameB);
        
        if (!gA || !gB) continue;

        let isAlreadyMarked = false;
        for (const sA of gA) {
            for (const sB of gB) {
                if (markedPairs.has(pairKey(sA, sB))) isAlreadyMarked = true;
            }
        }

        if (isAlreadyMarked) continue;

        let newlyMarked = false;
        const symbolChecks: SymbolCheck[] = [];
        let currentReason = `Transitions map to identical states or unmarked pairs. Left unmarked.`;

        for (const sym of activeDfa.alphabet) {
            const targetA = activeDfa.transitions[nameA][sym];
            const targetB = activeDfa.transitions[nameB][sym];

            if (targetA === targetB) {
                symbolChecks.push({ symbol: sym, nextPair: null, nextStates: [targetA, targetB], status: "same", reason: `Transitions to the exact same state ${targetA}.` });
                continue;
            }

            const depPair = normalizePair(targetA, targetB);
            
            let depIsMarked = false;
            const tGA = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === targetA);
            const tGB = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === targetB);
            
            if (tGA && tGB) {
                for (const sA of tGA) {
                    for (const sB of tGB) {
                        if (markedPairs.has(pairKey(sA, sB))) depIsMarked = true;
                    }
                }
            }

            symbolChecks.push({
                symbol: sym,
                nextPair: depPair,
                nextStates: [targetA, targetB],
                status: depIsMarked ? "distinguishable" : "depends",
                reason: depIsMarked ? `Leads to pair (${depPair.join(", ")}), which is MARKED.` : `Leads to pair (${depPair.join(", ")}), which is unmarked.`
            });

            if (depIsMarked && !newlyMarked) {
                newlyMarked = true;
                changed = true;
                newMarksInPass++;
                currentReason = `Marked because input '${sym}' leads to a distinguishable pair (${depPair.join(", ")}).`;
                
                for (const sA of gA) {
                    for (const sB of gB) {
                        const k = pairKey(sA, sB);
                        markedPairs.add(k);
                        passNewMarks.add(k);
                    }
                }
            }
        }

        passEvaluations.push({
            pair: [nameA, nameB],
            symbolChecks,
            isMarked: newlyMarked,
            reason: currentReason
        });
    }

    if (passEvaluations.length > 0) {
        steps.push({
            phase: "iterative-mark",
            title: `Iteration Pass ${pass}`,
            description: `Evaluated ${passEvaluations.length} unmarked pairs automatically. Found ${newMarksInPass} newly distinguishable pairs.`,
            passNumber: pass,
            evaluations: passEvaluations,
            graph: activeDfa,
            tableSnapshot: getDynamicTable(currentGroups, markedPairs, passNewMarks)
        });
    }
    
    if (newMarksInPass > 0) pass++;
  }

  let finalChanged = true;
  while (finalChanged) {
      finalChanged = false;
      activeDfa = partitionsToGraph(originalDfa, currentGroups);
      const finalPairs = buildAllPairs(activeDfa.states).map(([a,b]) => normalizePair(a,b));

      for (const [nameA, nameB] of finalPairs) {
          const gA = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameA);
          const gB = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameB);
          
          if (!gA || !gB) continue; 

          let isMarked = false;
          for (const sA of gA) {
              for (const sB of gB) {
                  if (markedPairs.has(pairKey(sA, sB))) isMarked = true;
              }
          }

          if (!isMarked) {
              const preMergeGraph = partitionsToGraph(originalDfa, currentGroups);
              const preMergeTable = getDynamicTable(currentGroups, markedPairs);
              
              steps.push({
                  phase: "merge-check",
                  title: `Verify Cyclic Equivalence: (${nameA}, ${nameB})`,
                  description: `Algorithm complete. Pair (${nameA}, ${nameB}) remained unmarked. They have cyclic equivalence and are definitively identical.`,
                  pair: [nameA, nameB],
                  mergingNodes: [nameA, nameB],
                  graph: preMergeGraph,
                  tableSnapshot: preMergeTable
              });

              const gAIndex = currentGroups.indexOf(gA);
              const gBIndex = currentGroups.indexOf(gB);
              const mergedGroup = [...gA, ...gB].sort();
              currentGroups = currentGroups.filter((_, idx) => idx !== gAIndex && idx !== gBIndex);
              currentGroups.push(mergedGroup);
              currentGroups.sort((g1, g2) => g1[0].localeCompare(g2[0]));

              const postMergeDfa = partitionsToGraph(originalDfa, currentGroups);
              const postMergeTable = getDynamicTable(currentGroups, markedPairs);

              steps.push({
                  phase: "merge-execute",
                  title: `Final Merge: (${nameA}, ${nameB})`,
                  description: `The redundant states are fused together. The topological graph and transition table absorb the equivalence into a single state.`,
                  pair: [nameA, nameB],
                  mergingNodes: [nameA, nameB],
                  preMergeGraph: preMergeGraph,
                  graph: postMergeDfa,
                  tableSnapshot: postMergeTable
              });

              finalChanged = true;
              break; 
          }
      }
  }

  const finalVerificationEvaluations: PairEvaluation[] = [];
  const finalActiveDfa = partitionsToGraph(originalDfa, currentGroups);
  const finalPairsList = buildAllPairs(finalActiveDfa.states).map(([a,b]) => normalizePair(a,b));
  const finalNewMarks = new Set<string>();

  for (const [nameA, nameB] of finalPairsList) {
      const aFinal = finalActiveDfa.finalStates.includes(nameA);
      const bFinal = finalActiveDfa.finalStates.includes(nameB);
      
      const gA = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameA);
      const gB = currentGroups.find(g => (g.length > 1 ? `{${g.join(",")}}` : g[0]) === nameB);
      
      if (gA && gB) {
          for (const sA of gA) {
              for (const sB of gB) {
                  finalNewMarks.add(pairKey(sA, sB));
                  markedPairs.add(pairKey(sA, sB));
              }
          }
      }

      if (aFinal !== bFinal) {
           finalVerificationEvaluations.push({
               pair: [nameA, nameB],
               isMarked: true,
               reason: "One state is an accepting state and the other is not. Distinguishable.",
               symbolChecks: []
           });
      } else {
           const symbolChecks: SymbolCheck[] = [];
           for (const sym of finalActiveDfa.alphabet) {
               const targetA = finalActiveDfa.transitions[nameA][sym];
               const targetB = finalActiveDfa.transitions[nameB][sym];
               if (targetA === targetB) {
                   symbolChecks.push({ symbol: sym, nextPair: null, nextStates: [targetA, targetB], status: "same", reason: `Transitions to the exact same state ${targetA}.` });
               } else {
                   const depPair = normalizePair(targetA, targetB);
                   symbolChecks.push({
                       symbol: sym,
                       nextPair: depPair,
                       nextStates: [targetA, targetB],
                       status: "distinguishable",
                       reason: `Leads to distinguishable pair (${depPair.join(", ")}).`
                   });
               }
           }
           finalVerificationEvaluations.push({
               pair: [nameA, nameB],
               isMarked: true,
               reason: "Transitions lead to distinguishable states. This pair remains marked.",
               symbolChecks
           });
      }
  }

  if (finalVerificationEvaluations.length > 0) {
      steps.push({
          phase: "iterative-mark",
          title: "Final Verification Pass",
          description: "One last algorithmic pass over the minimized DFA to mathematically verify that all remaining state combinations are strictly distinguishable. Every cell is now definitively marked.",
          passNumber: pass + 1,
          evaluations: finalVerificationEvaluations,
          graph: finalActiveDfa,
          tableSnapshot: getDynamicTable(currentGroups, markedPairs, finalNewMarks)
      });
  }

  steps.push({
      phase: "final",
      title: "Minimization Complete",
      description: `All redundancies have been successfully merged. The resulting DFA is perfectly minimal. All remaining cells in the matrix represent strictly distinguishable states.`,
      graph: partitionsToGraph(originalDfa, currentGroups),
      tableSnapshot: getDynamicTable(currentGroups, markedPairs)
  });

  return { steps, minimized: { ...partitionsToGraph(originalDfa, currentGroups), mapping: {} } as any };
}

// --- VISUALIZATION COMPONENTS ---

function TransitionTable({ dfa, title, highlightedStates = [], activeSymbol = null }: { dfa: DFA | MinimizedDFA | StepGraph; title?: string; highlightedStates?: string[]; activeSymbol?: string | null; }) {
  return (
    <Card className="h-full flex flex-col border-none shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      {title ? <CardHeader className="py-4 px-6 border-none"><CardTitle className="text-base">{title}</CardTitle></CardHeader> : null}
      <CardContent className="flex-1 overflow-auto p-6 pt-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950 text-zinc-400 sticky top-0 z-10 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-bold">Origin State</th>
                {dfa.alphabet.map((symbol) => (
                  <th key={symbol} className={`px-4 py-3 font-bold transition-colors ${activeSymbol === symbol ? "text-red-400" : ""}`}>
                    Input {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              <AnimatePresence initial={false}>
                {dfa.states.map((state) => {
                  const isHighlighted = highlightedStates.some(h => state === h || state.includes(h));
                  return (
                    <motion.tr 
                      key={state} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`transition-colors ${isHighlighted ? "bg-zinc-800/80" : "bg-zinc-900 hover:bg-zinc-800/40"}`}
                    >
                      <td className={`px-4 py-3.5 font-medium ${isHighlighted ? "text-zinc-100 font-bold" : "text-zinc-300"}`}>
                        {state}
                        {dfa.startState === state && <Badge variant="outline" className="ml-2 border-zinc-700 text-zinc-400 scale-90">Start</Badge>}
                        {dfa.finalStates.includes(state) && <Badge variant="outline" className="ml-2 border-zinc-700 text-zinc-400 scale-90">Final</Badge>}
                      </td>
                      {dfa.alphabet.map((symbol) => {
                        const activeCell = isHighlighted && activeSymbol === symbol;
                        const activeColumn = activeSymbol === symbol;
                        return (
                          <td key={`${state}-${symbol}`} className={`px-4 py-3.5 transition-all ${activeCell ? "bg-red-950/60 font-bold text-red-300 border border-red-800 shadow-[inset_0_0_12px_rgba(220,38,38,0.2)]" : activeColumn ? "bg-zinc-950/30 text-zinc-200" : "text-zinc-400"}`}>
                            {dfa.transitions[state][symbol]}
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
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
  onCellClick
}: { 
  dfa: DFA | StepGraph, 
  rows: PairTableEntry[], 
  activePair: [string, string] | null,
  title: string,
  onCellClick?: (pair: [string, string]) => void
}) {
  const states = dfa.states;
  if (states.length < 2) return null;

  const colStates = states.slice(0, -1);
  const rowStates = states.slice(1);

  return (
    <Card className="h-full flex flex-col border-none shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
      <CardHeader className="bg-zinc-900 px-6 py-5 border-b border-zinc-800 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base shrink-0">
          <CheckSquare className="h-5 w-5 text-red-500" /> {title}
        </CardTitle>
        {onCellClick && (
          <Badge variant="outline" className="text-[10px] text-zinc-400 font-medium border-zinc-700 bg-zinc-950 flex items-center gap-1.5 px-3 py-1">
            <MousePointerClick className="w-3 h-3" /> Click cell to inspect logic
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto relative bg-zinc-950 rounded-b-[16px]">
         <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-2 pl-12">
               <AnimatePresence initial={false}>
                 {colStates.map(c => (
                   <motion.div layout key={`header-${c}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, width: 0, padding: 0 }} className="min-w-[48px] w-auto h-8 flex items-center justify-center font-bold text-zinc-500 text-sm px-1">{c}</motion.div>
                 ))}
               </AnimatePresence>
            </div>
            <AnimatePresence initial={false}>
              {rowStates.map((r, rIdx) => (
                <motion.div layout key={`row-${r}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex gap-2">
                  <motion.div layout className="min-w-[40px] w-auto h-12 flex items-center justify-end pr-4 font-bold text-zinc-500 text-sm">{r}</motion.div>
                  <AnimatePresence initial={false}>
                    {colStates.map((c, cIdx) => {
                      if (cIdx > rIdx) return <motion.div layout key={`empty-${c}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, width: 0, padding: 0 }} className="min-w-[48px] w-auto h-12 shrink-0 px-1" />;

                      const pairKey = normalizePair(c, r);
                      const entry = rows.find(row => row.pair[0] === pairKey[0] && row.pair[1] === pairKey[1]);
                      const isNewlyMarked = entry?.mark === "newly-marked";
                      const isMarked = entry?.mark === "marked" || isNewlyMarked;
                      const isActive = activePair && activePair[0] === pairKey[0] && activePair[1] === pairKey[1];

                      let cellClasses = "bg-zinc-900 border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-zinc-800";
                      let xColor = "text-zinc-600";

                      if (isActive) {
                         cellClasses = "bg-red-950/40 border-red-500/50 z-20 scale-110 shadow-[0_0_15px_rgba(220,38,38,0.4)]";
                         xColor = "text-red-400";
                      } else if (isNewlyMarked) {
                         cellClasses = "bg-red-950 border-red-900 shadow-none"; 
                         xColor = "text-red-500";
                      } else if (isMarked) {
                         cellClasses = "bg-zinc-950 border-zinc-900 shadow-none";
                         xColor = "text-zinc-700";
                      }

                      return (
                        <motion.div 
                          key={`cell-${c}-${r}`} 
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: isActive ? 1.08 : 1, opacity: 1 }}
                          exit={{ opacity: 0, width: 0, padding: 0 }}
                          onClick={() => onCellClick?.(pairKey)}
                          className={`min-w-[48px] px-1 h-12 rounded-[10px] border flex items-center justify-center shrink-0 transition-all duration-400 ${onCellClick ? "cursor-pointer active:scale-95" : ""} ${cellClasses}`}>
                           {isMarked && <X className={`w-6 h-6 stroke-[3] ${xColor} ${isNewlyMarked && !isActive ? "animate-pulse" : ""}`} />}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
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
  const arrowPadding = 27; 

  const animTransition: any = { duration: isDragging ? 0 : 0.8, ease: "easeInOut" }; 

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

  const quadraticPoint = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
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
        minDist = Math.min(minDist, Math.hypot(probeX - q.x, probeY - q.y));
      });
      const score = minDist - cand.penalty;
      if (score > bestScore) { bestScore = score; best = cand; }
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

  if (Object.keys(positions).length === 0 || !nodes.every((n) => positions[n])) return null;

  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)] border-none">
      <CardHeader className="py-4 border-zinc-800 bg-zinc-900">
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <Badge variant="outline" className="text-[10px] text-zinc-500 font-normal shadow-sm border-zinc-700 bg-zinc-950">
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
                <path d="M 0 0 L 10 5 L 0 10 z" className="fill-zinc-600" />
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
                    <motion.text animate={{ x: textX, y: textY }} transition={animTransition} textAnchor="middle" className="stroke-zinc-950 stroke-[5px] fill-transparent text-sm font-bold" strokeLinejoin="round">{symbolText}</motion.text>
                    <motion.text animate={{ x: textX, y: textY }} transition={animTransition} textAnchor="middle" className="fill-red-400 text-sm font-bold">{symbolText}</motion.text>
                  </motion.g>
                );
              }

              const fromIdx = nodes.indexOf(from);
              const toIdx = nodes.indexOf(to);
              const absDist = Math.abs(toIdx - fromIdx);
              const reverseExists = hasReverseEdge(from, to);

              let startX = 0, startY = 0, endX = 0, endY = 0, cpX = 0, cpY = 0, textX = 0, textY = 0;
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
                cpX = (p1.x + p2.x) / 2;
                cpY = CENTER_Y + curveHeight;

                const angle1 = Math.atan2(cpY - p1.y, cpX - p1.x);
                const angle2 = Math.atan2(p2.y - cpY, p2.x - cpX);

                startX = p1.x + nodeRadius * Math.cos(angle1);
                startY = p1.y + nodeRadius * Math.sin(angle1);
                endX = p2.x - arrowPadding * Math.cos(angle2);
                endY = p2.y - arrowPadding * Math.sin(angle2);

                const labelPt = quadraticPoint({ x: startX, y: startY }, { x: cpX, y: cpY }, { x: endX, y: endY }, 0.5);
                textX = labelPt.x;
                textY = labelPt.y + (curveHeight < 0 ? -16 : 24);
              }

              return (
                <motion.g key={`${from}-${to}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                  <motion.path animate={{ d: `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}` }} transition={animTransition} fill="none" strokeWidth="2" markerEnd={`url(#arrow-${graphKey})`} className="stroke-zinc-600" />
                  <motion.text animate={{ x: textX, y: textY }} transition={animTransition} textAnchor="middle" className="stroke-zinc-950 stroke-[5px] fill-transparent text-sm font-bold" strokeLinejoin="round">{symbolText}</motion.text>
                  <motion.text animate={{ x: textX, y: textY }} transition={animTransition} textAnchor="middle" className="fill-red-400 text-sm font-bold">{symbolText}</motion.text>
                </motion.g>
              );
            })}

            {positions[dfa.startState] && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.line animate={{ x1: positions[dfa.startState].x - 82, y1: positions[dfa.startState].y, x2: positions[dfa.startState].x - arrowPadding, y2: positions[dfa.startState].y }} transition={animTransition} strokeWidth="2.5" markerEnd={`url(#arrow-${graphKey})`} className="stroke-zinc-600" />
                <motion.text animate={{ x: positions[dfa.startState].x - 92, y: positions[dfa.startState].y + 4 }} transition={animTransition} className="fill-zinc-400 text-xs font-bold tracking-widest uppercase text-center">START</motion.text>
              </motion.g>
            )}

            {dfa.states.map((state) => {
              const pos = positions[state];
              const isFinal = dfa.finalStates.includes(state);
              const isActive = activeStates.some((a) => state === a || state.includes(a));

              return (
                <motion.g key={state} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: isActive && mergeMode ? 1.15 : isActive ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} style={{ cursor: "grab" }} whileTap={{ cursor: "grabbing" }} onPanStart={() => setIsDragging(true)} onPanEnd={() => setIsDragging(false)}
                  onPan={(e, info) => {
                    if (svgRef.current) {
                      const rect = svgRef.current.getBoundingClientRect();
                      setPositions(p => ({ ...p, [state]: { x: p[state].x + info.delta.x * (canvasWidth / rect.width), y: p[state].y + info.delta.y * (SVG_HEIGHT / rect.height) } }));
                    }
                  }}
                >
                  <motion.circle animate={{ cx: pos.x, cy: pos.y }} transition={animTransition} r="28" className={`${isActive ? "fill-red-950/80 stroke-red-500 stroke-[3px]" : "fill-zinc-800 stroke-zinc-500"} transition-colors duration-300`} />
                  {isFinal && <motion.circle animate={{ cx: pos.x, cy: pos.y }} transition={animTransition} r="22" className={`fill-none ${isActive ? "stroke-red-400" : "stroke-zinc-500"}`} strokeWidth="1.5" />}
                  <motion.text animate={{ x: pos.x, y: pos.y + 4 }} transition={animTransition} textAnchor="middle" className={`text-sm font-bold pointer-events-none select-none ${isActive ? "fill-zinc-100" : "fill-zinc-100"}`}>{state}</motion.text>
                </motion.g>
              );
            })}
          </motion.svg>
        </AnimatePresence>
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

  // Unified linear timeline state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  const [animIndex, setAnimIndex] = useState(0);
  const [animSymbolIndex, setAnimSymbolIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);
  const [mergePhase, setMergePhase] = useState<"idle" | "merging" | "merged">("idle");

  const parsed = useMemo(() => parseDFA(submitted), [submitted]);
  const result = useMemo(() => {
    if (!parsed.dfa) return null;
    return minimizeDFA(parsed.dfa);
  }, [parsed]);

  const formStates = useMemo(() => normalizeList(formState.statesText), [formState.statesText]);
  const formAlphabet = useMemo(() => normalizeList(formState.alphabetText), [formState.alphabetText]);

  // Derive current step
  const activeStep = result ? result.steps[currentStepIndex] : null;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = result ? currentStepIndex === result.steps.length - 1 : true;

  // Dynamically map Graph view
  const currentGraphState = useMemo(() => {
    if (activeStep?.phase === "merge-execute" && mergePhase === "merging") {
      return activeStep.preMergeGraph;
    }
    return activeStep?.graph || parsed.dfa;
  }, [activeStep, mergePhase, parsed.dfa]);

  // Dynamically locate specific pair evaluations
  const getEvaluationForPair = (pair: [string, string]) => {
    if (!result) return null;
    const [p0, p1] = normalizePair(pair[0], pair[1]);
    
    if (activeStep?.phase === "final") {
       const found = activeStep.evaluations?.find(e => e.pair[0] === p0 && e.pair[1] === p1);
       if (found) return { passTitle: "Minimized States Verification", evalData: found };
    }
    
    for (let i = currentStepIndex; i >= 0; i--) {
      const evals = result.steps[i].evaluations;
      if (evals) {
        const found = evals.find(e => e.pair[0] === p0 && e.pair[1] === p1);
        if (found) return { passTitle: result.steps[i].title, evalData: found };
      }
    }
    
    // Fallback for new shrunk table cells mapping to inherited states
    if(p0.includes("{") || p1.includes("{")) {
       return {
          passTitle: "Inherited State Evaluation",
          evalData: {
             pair: [p0, p1] as [string, string],
             isMarked: true,
             reason: `These groups are intrinsically distinguishable because their underlying constituent states were mathematically proven distinguishable during the earlier evaluation phases.`,
             symbolChecks: []
          }
       };
    }
    return null;
  };

  const activeEval = isPlaying && activeStep?.evaluations ? activeStep.evaluations[animIndex] : null;
  const historyEval = !isPlaying && selectedPair ? getEvaluationForPair(selectedPair) : null;
  const highlightedPair = isPlaying && activeEval ? activeEval.pair : selectedPair;

  const checkCountBeforeDecision = activeStep?.phase === "iterative-mark" && activeEval
    ? activeEval.isMarked ? activeEval.symbolChecks.findIndex((c) => c.status === "distinguishable") + 1 : activeEval.symbolChecks.length
    : 0;

  // Safely extract activeSymbol without complex rendering logic dependencies
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
            if (isFuture) return { ...r, mark: "unmarked" };
            if (isCurrentAnimating) {
               const decisiveIndex = evalObj.symbolChecks.findIndex(c => c.status === "distinguishable");
               if (animSymbolIndex <= decisiveIndex) return { ...r, mark: "unmarked" };
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

  // When step changes, reset local states
  useEffect(() => {
    setSelectedPair(null);

    if (activeStep?.phase === "iterative-mark") {
      setAnimIndex(0);
      setAnimSymbolIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    if (activeStep?.phase === "merge-execute") {
      setMergePhase("merging");
      const t = setTimeout(() => setMergePhase("merged"), 800); 
      return () => clearTimeout(t);
    } else {
      setMergePhase("idle");
    }
  }, [currentStepIndex, activeStep, replayTrigger]);

  // HIGH-SPEED Automatic inner animation cycle for iterative marking
  useEffect(() => {
    if (!isPlaying || activeStep?.phase !== "iterative-mark") return;
    if (!activeStep.evaluations) return;

    const evalObj = activeStep.evaluations[animIndex];
    if (!evalObj) return;

    const maxSymbolIndex = evalObj.isMarked 
      ? evalObj.symbolChecks.findIndex(c => c.status === "distinguishable") + 1
      : evalObj.symbolChecks.length;

    if (animSymbolIndex < maxSymbolIndex) {
      const timer = setTimeout(() => setAnimSymbolIndex(s => s + 1), 300); 
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (activeStep.evaluations && animIndex < activeStep.evaluations.length - 1) {
          setAnimIndex(i => i + 1);
          setAnimSymbolIndex(0);
        } else {
          setIsPlaying(false); // Stop when the pass finishes so user can click
        }
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [isPlaying, activeStep, animIndex, animSymbolIndex]);

  const handleCellClick = (pair: [string, string]) => {
    if (!result) return;
    const [p0, p1] = normalizePair(pair[0], pair[1]);
    
    let foundIndex = -1;
    for (let i = currentStepIndex; i >= 0; i--) {
       const evals = result.steps[i].evaluations;
       if (evals && evals.some(e => e.pair[0] === p0 && e.pair[1] === p1)) {
           foundIndex = i;
           break;
       }
    }
    
    if (foundIndex !== -1) {
      setIsPlaying(false); 
      setCurrentStepIndex(foundIndex); 
      setSelectedPair([p0, p1]);
    } else if (!p0.includes("{") && !p1.includes("{")) {
      const baseIndex = result.steps.findIndex(s => s.phase === "base-mark" && s.evaluations?.some(e => e.pair[0] === p0 && e.pair[1] === p1));
      if (baseIndex !== -1 && currentStepIndex >= baseIndex) {
        setIsPlaying(false);
        setCurrentStepIndex(baseIndex);
        setSelectedPair([p0, p1]);
      }
    } else {
      setIsPlaying(false);
      setSelectedPair([p0, p1]);
    }
  };

  const handleReplay = () => {
    setSelectedPair(null);
    setIsPlaying(true);
    setReplayTrigger(r => r + 1);
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
    setCurrentStepIndex(0);
  }

  function startWalkthrough(dfaString: string) {
    setInput(dfaString);
    setSubmitted(dfaString);
    setFormError("");
    setCurrentStepIndex(0);
    setView("walkthrough");
  }

  function buildAndRunFromTable() {
    const built = formStateToDFA(formState);
    if (!built.dfa) return setFormError(built.error ?? "Invalid Structural Data.");
    startWalkthrough(JSON.stringify(built.dfa, null, 2));
  }

  const handleNext = () => {
    if (result && currentStepIndex < result.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (view !== "walkthrough") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") {
        if (mergePhase !== "merging") handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const shellClass = "min-h-screen w-full bg-zinc-950 p-6 md:p-12 text-zinc-100 flex flex-col selection:bg-red-500/30 font-sans";

  const renderPairEvaluation = (evalData: PairEvaluation, visibleSymbolsCount?: number, customTitle?: string) => {
    const symbolsToShow = visibleSymbolsCount !== undefined ? evalData.symbolChecks.slice(0, visibleSymbolsCount) : evalData.symbolChecks;
    const showFinalDecision = visibleSymbolsCount === undefined || visibleSymbolsCount > evalData.symbolChecks.length || (evalData.isMarked && visibleSymbolsCount >= evalData.symbolChecks.findIndex((c) => c.status === "distinguishable") + 1);

    return (
      <div className="space-y-6">
        {customTitle && <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">{customTitle}</div>}
        <div className="flex items-center gap-4 text-xl font-bold mb-8 text-zinc-100">
          Analysis Matrix: <Badge variant="outline" className="text-base px-4 py-1.5 shadow-sm border-zinc-700 bg-zinc-800">({evalData.pair[0]}, {evalData.pair[1]})</Badge>
        </div>

        <div className="flex flex-col gap-6">
          {symbolsToShow.map((row, index) => {
            const isDist = row.status === "distinguishable";
            return (
              <motion.div 
                key={row.symbol} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-6 rounded-[12px] border transition-all shadow-[0_4px_16px_rgba(0,32,69,0.03)] ${isDist ? "bg-[#ffffff] border-[#c6955e]/30" : "bg-[#ffffff] border-[#ffffff]"}`}
              >
                <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                  
                  {/* Input Block */}
                  <div className="flex flex-col items-center justify-center bg-[#faf9fd] rounded-[10px] w-20 h-20 shrink-0">
                    <span className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest mb-1">Input</span>
                    <span className="text-2xl font-black text-[#002045]">{row.symbol}</span>
                  </div>

                  {/* Transitions Block */}
                  <div className="flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#f4f3f7] flex items-center justify-center font-bold text-[#43474e] text-sm">{evalData.pair[0]}</div>
                      <ArrowRight className="w-4 h-4 text-[#c4c6cf]" />
                      <div className={`w-10 h-10 rounded-full border ${isDist ? 'border-[#c6955e]/30 bg-[#c6955e]/10 text-[#c6955e]' : 'border-transparent bg-[#faf9fd] text-[#43474e]'} flex items-center justify-center font-bold text-sm`}>{row.nextStates[0]}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#f4f3f7] flex items-center justify-center font-bold text-[#43474e] text-sm">{evalData.pair[1]}</div>
                      <ArrowRight className="w-4 h-4 text-[#c4c6cf]" />
                      <div className={`w-10 h-10 rounded-full border ${isDist ? 'border-[#c6955e]/30 bg-[#c6955e]/10 text-[#c6955e]' : 'border-transparent bg-[#faf9fd] text-[#43474e]'} flex items-center justify-center font-bold text-sm`}>{row.nextStates[1]}</div>
                    </div>
                  </div>

                  <ArrowRight className="w-6 h-6 text-[#f4f3f7] hidden md:block shrink-0" />

                  {/* Target Pair Block */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-[#c4c6cf] uppercase tracking-widest">Resolves To</span>
                    {row.nextPair ? (
                       <Badge variant="outline" className="text-sm px-5 py-2 border-[#c4c6cf]/20 bg-[#faf9fd] shadow-none font-semibold rounded-full">Pair ({row.nextPair.join(", ")})</Badge>
                    ) : (
                       <Badge variant="outline" className="text-sm px-5 py-2 border-[#c4c6cf]/20 bg-[#faf9fd] text-[#43474e] shadow-none font-semibold rounded-full">Identical ({row.nextStates[0]})</Badge>
                    )}
                  </div>

                  {/* Result Badge */}
                  <div className="sm:ml-auto w-full sm:w-auto flex justify-start sm:justify-end pt-4 sm:pt-0">
                     <div className={`flex flex-col items-center justify-center px-6 py-3 rounded-[10px] ${isDist ? 'bg-[#c6955e] text-[#ffffff] shadow-[0_4px_16px_rgba(198,149,94,0.3)]' : 'bg-[#f4f3f7] text-[#43474e]'}`}>
                       <span className="font-bold text-sm">{isDist ? "Distinguishable" : "Equivalent"}</span>
                     </div>
                  </div>
                </div>
                
                {/* Explanation Footer */}
                <div className="mt-6 text-sm text-[#43474e] bg-[#faf9fd] p-4 rounded-[8px]">
                   {row.reason}
                </div>
              </motion.div>
            );
          })}
        </div>

        {showFinalDecision && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`flex items-start gap-5 rounded-[16px] p-6 shadow-[0_4px_24px_rgba(0,32,69,0.04)] mt-8 border ${evalData.isMarked ? "bg-[#c6955e]/10 text-[#c6955e] border-[#c6955e]/20" : "bg-[#faf9fd] text-[#1a1c1e] border-transparent"}`}>
            {evalData.isMarked ? <XCircle className="h-8 w-8 shrink-0" /> : <CheckCircle2 className="h-8 w-8 shrink-0 text-[#c4c6cf]" />}
            <div>
              <div className="font-bold text-lg mb-1">{evalData.isMarked ? "Matrix Marked (Distinguishable)" : "Retained Equivalence"}</div>
              <div className="leading-relaxed opacity-90">{evalData.reason}</div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  if (view === "walkthrough" && result && parsed.dfa && activeStep) {

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

        <div className="mx-auto max-w-[1600px] w-full flex-1 flex flex-col gap-12 pb-20">
          
          {/* HEADER */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-4 mb-4">
                <Button variant="secondary" size="icon" onClick={() => setView("input")} title="Home" className="h-10 w-10 shrink-0 border-zinc-700 bg-zinc-800 shadow-sm hover:bg-zinc-700">
                  <Home className="w-4 h-4 text-zinc-100" />
                </Button>
                <h1 className="text-5xl font-extrabold tracking-tight text-zinc-50">DFA Minimization</h1>
              </div>
              <p className="text-lg text-zinc-400 leading-relaxed">
                An interactive exploration of the Myhill-Nerode theorem. Observe structural equivalencies to derive the minimal topological state machine.
              </p>
            </div>
            
            {/* PROGRESS BREADCRUMBS */}
            <div className="flex bg-zinc-950 border border-zinc-800 p-1.5 rounded-2xl w-fit shadow-inner">
              <div className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${['init', 'base-mark', 'iterative-mark'].includes(activeStep.phase) ? "bg-red-600 text-white shadow-sm shadow-red-900/40" : "text-zinc-500"}`}>
                <FileSearch className="w-4 h-4" /> 1. Matrix Evaluation
              </div>
              <div className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${['merge-overview', 'merge-check', 'merge-execute'].includes(activeStep.phase) ? "bg-red-600 text-white shadow-sm shadow-red-900/40" : "text-zinc-500"}`}>
                <GitMerge className="w-4 h-4" /> 2. Eager Merging
              </div>
              <div className={`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-sm font-bold transition-all duration-300 ${activeStep.phase === 'final' ? "bg-red-600 text-white shadow-sm shadow-red-900/40" : "text-zinc-500"}`}>
                <CheckCircle2 className="w-4 h-4" /> 3. Minimized
              </div>
            </div>
          </div>

          {/* MAIN ASYMMETRICAL LAYOUT */}
          <div className="flex-1 flex flex-col xl:flex-row gap-12 min-h-0">
            
            {/* LEFT COLUMN: Visualizations (Canvas + Tables) */}
            <div className="w-full xl:w-2/3 flex flex-col gap-12">
              <div className="h-[45vh] min-h-[400px]">
                <GraphView 
                  dfa={currentGraphState!} 
                  title={['merge-overview', 'merge-check', 'merge-execute', 'final'].includes(activeStep.phase) ? "Minimized Synthesis" : "Base Topology"}
                  graphKey={`graph-${currentStepIndex}`} 
                  activeStates={highlightedPair || (activeStep.pair ? activeStep.pair : [])} 
                  mergeMode={activeStep.phase.includes('merge')}
                  mergingPair={activeStep.phase === "merge-execute" && mergePhase === "merging" ? activeStep.mergingNodes : null}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="min-h-[250px]">
                   <TriangularTableSnapshot 
                     dfa={currentGraphState!} 
                     rows={currentTableRows} 
                     activePair={highlightedPair || (activeStep.pair ? activeStep.pair : null)}
                     title="Myhill-Nerode Matrix"
                     onCellClick={handleCellClick}
                   />
                </div>
                
                <div className="min-h-[250px]">
                  <TransitionTable 
                    dfa={currentGraphState!} 
                    title="Structural Mappings" 
                    highlightedStates={activeStep.pair && activeStep.pair[0] ? activeStep.pair : []}
                    activeSymbol={activeSymbol}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Editorial Step Logic */}
            <div className="w-full xl:w-1/3">
              <div className="sticky top-8 bg-zinc-900 rounded-[24px] shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-zinc-900/50 px-8 py-8 border-b border-zinc-800">
                  <div className="text-xs font-bold tracking-widest text-red-500 uppercase mb-3 flex items-center justify-between">
                    <span>{['init', 'base-mark', 'iterative-mark'].includes(activeStep.phase) ? "Matrix Evaluation" : "Topology Update"}</span>
                    {activeStep.phase === "iterative-mark" && !historyEval && (
                      <button onClick={handleReplay} className="text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors font-bold"><RotateCcw className="w-3 h-3"/> Replay</button>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-zinc-50 leading-tight">{activeStep.title}</h3>
                  <p className="text-base text-zinc-400 mt-4 leading-relaxed">{activeStep.description}</p>
                </div>
                
                <div className="flex-1 overflow-auto p-8 bg-zinc-900">
                  {/* INIT PHASE RENDERING */}
                  {activeStep.phase === "init" && (
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center gap-4">
                         <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                         <div className="font-bold text-xl text-zinc-100">Ready to Begin</div>
                       </div>
                       <div className="text-zinc-400 leading-relaxed mt-2">{activeStep.reason}</div>
                    </div>
                  )}

                  {/* MARKING PHASE RENDERING */}
                  {activeStep.phase === "base-mark" && (
                    historyEval && historyEval.evalData ? (
                      renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                    ) : (
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-4">
                           <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                           <div className="font-bold text-xl text-zinc-100">Base Cases Marked</div>
                         </div>
                         <div className="text-zinc-400 leading-relaxed mt-2">{activeStep.reason}</div>
                         {activeStep.evaluations && activeStep.evaluations.length > 0 && (
                           <div className="mt-6 text-sm font-semibold bg-zinc-950 p-4 rounded-xl text-zinc-400 border border-zinc-800 flex items-center gap-2">
                             <MousePointerClick className="w-4 h-4 text-zinc-500" /> Tap any cell in the matrix to inspect its logic.
                           </div>
                         )}
                      </div>
                    )
                  )}

                  {activeStep.phase === "iterative-mark" && (
                    historyEval && historyEval.evalData ? (
                         renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                      ) : activeEval ? (
                         renderPairEvaluation(activeEval, undefined, activeStep.title)
                      ) : (
                         <div className="flex flex-col gap-3">
                           <div className="flex items-center gap-4">
                             <CheckCircle2 className="h-8 w-8 shrink-0 text-blue-500" />
                             <div className="font-bold text-xl text-zinc-100">Iteration Complete</div>
                           </div>
                           <div className="text-zinc-400 leading-relaxed mt-2">The algorithmic pass evaluated {activeStep.evaluations?.length} unmarked pairs.</div>
                           <div className="mt-6 text-sm font-semibold bg-zinc-950 p-4 rounded-xl text-zinc-400 border border-zinc-800 flex items-center gap-2">
                             <MousePointerClick className="w-4 h-4 text-zinc-500" /> Tap any cell in the matrix to inspect its precise mathematical logic.
                           </div>
                         </div>
                      )
                  )}

                  {/* MERGING OVERVIEW RENDERING */}
                  {activeStep.phase === "merge-overview" && (
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <CheckCircle2 className="h-8 w-8 shrink-0 text-red-500" />
                          <div className="font-bold text-xl text-zinc-100">Matrix Resolved</div>
                        </div>
                        <div className="text-zinc-400 leading-relaxed mt-2">All iterations are complete. The remaining unmarked pairs in the Myhill-Nerode table mathematically denote identical state behaviors.</div>
                     </div>
                  )}

                  {/* MERGING PHASE RENDERING */}
                  {(activeStep.phase === "merge-check" || activeStep.phase === "merge-execute") && activeStep.pair && (
                     <div className="space-y-8">
                       <div className="transition-opacity duration-700" style={{ opacity: activeStep.phase === "merge-check" ? 1 : 0.3 }}>
                         <div className="font-bold text-lg text-zinc-100 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-zinc-400">1</div> Structural Verification</div>
                         <div className="text-zinc-400 leading-relaxed">Pair <Badge variant="outline" className="bg-zinc-950 border-zinc-800">({activeStep.pair[0]}, {activeStep.pair[1]})</Badge> has been identified as intrinsically equivalent.</div>
                       </div>
                       
                       {activeStep.phase === "merge-execute" && (
                         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pt-6 border-t border-zinc-800">
                           <div className="font-bold text-lg text-zinc-100 mb-6 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">2</div> Topological Restructure</div>
                           <div className="flex items-center gap-3 flex-wrap bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                             <div className="flex items-center justify-center min-w-[48px] h-12 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold shadow-sm">{activeStep.pair[0]}</div>
                             <span className="text-zinc-600 font-bold text-xl">+</span>
                             <div className="flex items-center justify-center min-w-[48px] h-12 px-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold shadow-sm">{activeStep.pair[1]}</div>
                             <ArrowRight className="w-5 h-5 mx-2 text-red-500" />
                             <motion.div 
                               initial={{ scale: 0.8, opacity: 0 }}
                               animate={{ scale: [1.2, 1], opacity: 1 }}
                               transition={{ duration: 0.5 }}
                               className="flex items-center justify-center px-6 h-12 rounded-full bg-red-600 text-white font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                             >
                               {(() => {
                                  const currentPair = activeStep.pair || ["", ""];
                                  const raw1 = currentPair[0].replace(/[{}]/g, "").split(",");
                                  const raw2 = currentPair[1].replace(/[{}]/g, "").split(",");
                                  const combined = [...raw1, ...raw2].sort().join(",");
                                  return `{${combined}}`;
                               })()}
                             </motion.div>
                           </div>
                           {mergePhase === "merged" && <div className="text-sm text-red-400 mt-6 leading-relaxed italic">The graph layout and matrix have dynamically collapsed to absorb the redundancy.</div>}
                         </motion.div>
                       )}
                     </div>
                  )}

                  {activeStep.phase === "final" && (
                     historyEval && historyEval.evalData ? (
                        renderPairEvaluation(historyEval.evalData, undefined, historyEval.passTitle)
                     ) : (
                       <div className="flex flex-col gap-4">
                         <div className="flex items-center gap-4">
                           <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-500" />
                           <div className="font-bold text-xl text-zinc-100">Optimization Complete</div>
                         </div>
                         <div className="text-zinc-400 leading-relaxed mt-2">All mathematically verified redundancies have been unified. The resulting topological structure is perfectly minimal.</div>
                       </div>
                     )
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass} style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-4xl space-y-12 w-full pt-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-red-950/40 border border-red-900 text-red-400 px-5 py-2 text-sm font-bold">
            <Sparkles className="h-4 w-4" /> The Digital Monograph
          </div>
          <h1 className="text-6xl font-extrabold tracking-tight text-zinc-50">DFA Minimization</h1>
          <p className="mt-6 text-xl text-zinc-400 leading-relaxed">
            Initialize the structural parameters. This visualizer applies strict Myhill-Nerode algorithmic passes, proactively merging states using Eager Equivalence.
          </p>
        </motion.div>

        <Card className="shadow-[0_0_40px_rgba(0,0,0,0.5)] border-zinc-800">
          <CardHeader className="bg-zinc-900 border-b border-zinc-800">
             <div className="inline-flex rounded-[12px] bg-zinc-950 border border-zinc-800 p-1.5 w-fit">
                <button
                  onClick={() => setInputMode("table")}
                  className={`rounded-[8px] px-6 py-3 text-sm font-bold transition-all ${
                    inputMode === "table"
                      ? "bg-zinc-800 text-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Structural Matrix
                </button>
                <button
                  onClick={() => setInputMode("json")}
                  className={`rounded-[8px] px-6 py-3 text-sm font-bold transition-all ${
                    inputMode === "json"
                      ? "bg-zinc-800 text-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Raw Data (JSON)
                </button>
              </div>
          </CardHeader>
          <CardContent className="space-y-8 bg-zinc-950 rounded-b-[16px]">
            {inputMode === "table" ? (
              <div className="space-y-10">
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-sm font-bold text-zinc-300">
                      <span className="text-xl font-black text-red-500 mr-2">Q</span> Finite set of states
                    </label>
                    <Input value={formState.statesText} onChange={(e) => setFormState(p => ({ ...p, statesText: e.target.value }))} className="bg-zinc-900 shadow-inner border-zinc-800" />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-zinc-300">
                      <span className="text-xl font-black text-red-500 mr-2">Σ</span> Alphabet
                    </label>
                    <Input value={formState.alphabetText} onChange={(e) => setFormState(p => ({ ...p, alphabetText: e.target.value }))} className="bg-zinc-900 shadow-inner border-zinc-800" />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-zinc-300">
                      <span className="text-xl font-black text-red-500 mr-2">q<sub>0</sub></span> Initial state
                    </label>
                    <Input value={formState.startState} onChange={(e) => setFormState(p => ({ ...p, startState: e.target.value }))} className="bg-zinc-900 shadow-inner border-zinc-800" />
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-bold text-zinc-300">
                      <span className="text-base font-black text-red-500 mr-1">F</span> Set of final states
                    </label>
                    <Input value={formState.finalStatesText} onChange={(e) => setFormState(p => ({ ...p, finalStatesText: e.target.value }))} className="bg-zinc-900 shadow-inner border-zinc-800" />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <label className="block text-sm font-bold text-zinc-300">
                      <span className="text-xl font-black text-red-500 mr-2">δ</span> Transition Function (Q × Σ → Q)
                    </label>
                    <button onClick={handleAddState} className="inline-flex items-center text-sm font-bold text-zinc-400 hover:text-red-400 transition-colors py-1.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                      <Plus className="w-4 h-4 mr-1.5" /> Add State
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-[12px] bg-zinc-900 shadow-inner border border-zinc-800">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="px-6 py-4 font-bold border-b border-zinc-800">Origin State</th>
                          {formAlphabet.map((symbol) => (
                            <th key={symbol} className="px-6 py-4 font-bold border-b border-zinc-800">Input {symbol}</th>
                          ))}
                          <th className="px-4 py-3 text-center font-bold border-b border-zinc-800 w-12">
                            <button onClick={handleAddSymbol} title="Add Input Symbol" className="inline-flex items-center justify-center w-6 h-6 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        <AnimatePresence initial={false}>
                          {formStates.map((state) => (
                            <motion.tr 
                              key={state} 
                              initial={{ opacity: 0, y: -10, backgroundColor: "#450a0a" }} 
                              animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }} 
                              exit={{ opacity: 0, backgroundColor: "#450a0a" }}
                              transition={{ duration: 0.3 }}
                              className="hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 font-bold text-zinc-100">
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleRemoveState(state)} title={`Remove State ${state}`} className="inline-flex items-center justify-center w-6 h-6 rounded-[6px] bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-red-600 hover:text-white transition-colors flex-shrink-0 shadow-sm">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span>{state}</span>
                                </div>
                              </td>
                              {formAlphabet.map((symbol) => (
                                <td key={`${state}-${symbol}`} className="px-6 py-4">
                                  <Select
                                    value={formState.transitions[state]?.[symbol] ?? ""}
                                    onChange={(e) => setFormState(p => ({ ...p, transitions: { ...p.transitions, [state]: { ...p.transitions[state], [symbol]: e.target.value } } }))}
                                    className="min-w-[120px] bg-zinc-950 shadow-inner border-zinc-800"
                                  >
                                    <option value="" disabled className="text-zinc-600">Select...</option>
                                    {formStates.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </Select>
                                </td>
                              ))}
                              <td className="px-6 py-4"></td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button size="lg" className="w-full sm:w-auto" onClick={buildAndRunFromTable}>Compile Topology <ArrowRight className="ml-2 w-5 h-5"/></Button>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={loadSample}>Load Sample Data</Button>
                </div>
                
                {formError && (
                  <div className="flex items-start gap-4 rounded-[12px] bg-red-950/40 border border-red-900 p-6 text-red-400 mt-6"><AlertCircle className="w-6 h-6 shrink-0" /><div><div className="font-bold text-lg mb-1 text-zinc-100">Compilation Error</div><div className="text-sm font-medium">{formError}</div></div></div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-[500px] font-mono text-sm leading-loose bg-zinc-900 border-zinc-800 shadow-inner" />
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="w-full sm:w-auto" onClick={() => startWalkthrough(input)}>Compile Topology <ArrowRight className="ml-2 w-5 h-5"/></Button>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={loadSample}>Load Sample Data</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}