/**
 * Turn State Machine
 * 
 * @module lib/game/turn-machine
 * @description State machine for turn phase management (US-014)
 * 
 * Implements strict forward-only transitions between phases:
 * DASHBOARD → EVENTS → DECISIONS → RESOLUTION → FEEDBACK
 */

// ============================================
// TURN PHASE ENUM
// ============================================

/**
 * Turn phases in game order
 * Transitions are strictly forward-only
 */
export enum TurnPhase {
    DASHBOARD = 'dashboard',
    EVENTS = 'events',
    DECISIONS = 'decisions',
    RESOLUTION = 'resolution',
    FEEDBACK = 'feedback',
}

/**
 * Ordered array of phases for transition logic
 */
export const PHASE_ORDER: readonly TurnPhase[] = [
    TurnPhase.DASHBOARD,
    TurnPhase.EVENTS,
    TurnPhase.DECISIONS,
    TurnPhase.RESOLUTION,
    TurnPhase.FEEDBACK,
] as const;

// ============================================
// TURN CONTEXT
// ============================================

/**
 * Decision pending validation
 */
export interface PendingDecision {
    leverId: string;
    value: number | string | boolean;
    productId?: string; // null = shared lever
}

/**
 * Active event in current turn
 */
export interface ActiveEvent {
    eventId: string;
    eventType: 'marche' | 'compagnie';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    impacts: Record<string, number>;
    durationTurns: number;
    turnTriggered: number;
}

/**
 * Complete turn context for state machine
 */
export interface TurnContext {
    sessionId: string;
    turnNumber: number;
    phase: TurnPhase;
    maxTurns: number;
    previousState: TurnStateSnapshot | null;
    currentState: TurnStateSnapshot;
    pendingDecisions: PendingDecision[];
    activeEvents: ActiveEvent[];
    seed: number;
}

/**
 * Snapshot of turn state (indices + pnl)
 */
export interface TurnStateSnapshot {
    indices: Record<string, number>;
    pnl: {
        primes: number;
        sinistres: number;
        frais: number;
        produits_financiers: number;
        resultat: number;
    };
}

// ============================================
// PHASE CONFIGURATION
// ============================================

/**
 * Configuration for each phase
 */
export interface PhaseConfig {
    name: string;
    description: string;
    allowsDecisions: boolean;
    requiresApiCall: boolean;
    nextAction: string;
}

/**
 * Phase configurations
 */
export const PHASE_CONFIGS: Record<TurnPhase, PhaseConfig> = {
    [TurnPhase.DASHBOARD]: {
        name: 'Tableau de bord',
        description: 'Vue d\'ensemble des indices et du P&L',
        allowsDecisions: false,
        requiresApiCall: false,
        nextAction: 'Voir les événements',
    },
    [TurnPhase.EVENTS]: {
        name: 'Événements',
        description: 'Événements marché et compagnie actifs',
        allowsDecisions: false,
        requiresApiCall: false,
        nextAction: 'Prendre des décisions',
    },
    [TurnPhase.DECISIONS]: {
        name: 'Décisions',
        description: 'Sélection des leviers stratégiques',
        allowsDecisions: true,
        requiresApiCall: false,
        nextAction: 'Valider les décisions',
    },
    [TurnPhase.RESOLUTION]: {
        name: 'Résolution',
        description: 'Calcul des effets en cours...',
        allowsDecisions: false,
        requiresApiCall: true,
        nextAction: 'Voir les résultats',
    },
    [TurnPhase.FEEDBACK]: {
        name: 'Résultats',
        description: 'Analyse des variations et impacts',
        allowsDecisions: false,
        requiresApiCall: false,
        nextAction: 'Tour suivant',
    },
};

// ============================================
// TRANSITION FUNCTIONS
// ============================================

/**
 * Get the index of a phase in the order
 * 
 * @param phase - Phase to find
 * @returns Index (0-4) or -1 if not found
 */
export function getPhaseIndex(phase: TurnPhase): number {
    return PHASE_ORDER.indexOf(phase);
}

/**
 * Check if a transition is valid
 * Only forward transitions to adjacent phases are allowed
 * 
 * @param from - Current phase
 * @param to - Target phase
 * @returns true if transition is valid
 */
export function canTransition(from: TurnPhase, to: TurnPhase): boolean {
    const fromIndex = getPhaseIndex(from);
    const toIndex = getPhaseIndex(to);
    
    // Invalid phases
    if (fromIndex === -1 || toIndex === -1) {
        return false;
    }
    
    // Only allow forward transition to next phase
    return toIndex === fromIndex + 1;
}

/**
 * Get the next phase in sequence
 * 
 * @param current - Current phase
 * @returns Next phase or null if at FEEDBACK (end of turn)
 */
export function nextPhase(current: TurnPhase): TurnPhase | null {
    const currentIndex = getPhaseIndex(current);
    
    if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
        return null;
    }
    
    return PHASE_ORDER[currentIndex + 1];
}

/**
 * Get the previous phase in sequence
 * 
 * @param current - Current phase
 * @returns Previous phase or null if at DASHBOARD (start)
 */
export function previousPhase(current: TurnPhase): TurnPhase | null {
    const currentIndex = getPhaseIndex(current);
    
    if (currentIndex <= 0) {
        return null;
    }
    
    return PHASE_ORDER[currentIndex - 1];
}

/**
 * Check if this is the first phase
 */
export function isFirstPhase(phase: TurnPhase): boolean {
    return phase === TurnPhase.DASHBOARD;
}

/**
 * Check if this is the last phase
 */
export function isLastPhase(phase: TurnPhase): boolean {
    return phase === TurnPhase.FEEDBACK;
}

/**
 * Get phase configuration
 * 
 * @param phase - Phase to get config for
 * @returns PhaseConfig
 */
export function getPhaseConfig(phase: TurnPhase): PhaseConfig {
    return PHASE_CONFIGS[phase];
}

// ============================================
// CONTEXT HELPERS
// ============================================

/**
 * Create initial turn context
 * 
 * @param sessionId - Session UUID
 * @param turnNumber - Current turn (1-indexed)
 * @param maxTurns - Maximum turns in session
 * @param currentState - Current state snapshot
 * @param seed - RNG seed for determinism
 * @returns Initial TurnContext
 */
export function createTurnContext(
    sessionId: string,
    turnNumber: number,
    maxTurns: number,
    currentState: TurnStateSnapshot,
    seed: number,
    previousState: TurnStateSnapshot | null = null
): TurnContext {
    return {
        sessionId,
        turnNumber,
        phase: TurnPhase.DASHBOARD,
        maxTurns,
        previousState,
        currentState,
        pendingDecisions: [],
        activeEvents: [],
        seed,
    };
}

/**
 * Check if this is the final turn
 * 
 * @param context - Turn context
 * @returns true if current turn is the last
 */
export function isFinalTurn(context: TurnContext): boolean {
    return context.turnNumber >= context.maxTurns;
}

/**
 * Advance context to next phase
 * 
 * @param context - Current context
 * @returns Updated context or null if cannot advance
 */
export function advancePhase(context: TurnContext): TurnContext | null {
    const next = nextPhase(context.phase);
    
    if (next === null) {
        return null;
    }
    
    return {
        ...context,
        phase: next,
    };
}

/**
 * Add a pending decision to context
 * 
 * @param context - Current context
 * @param decision - Decision to add
 * @returns Updated context
 */
export function addDecision(
    context: TurnContext,
    decision: PendingDecision
): TurnContext {
    return {
        ...context,
        pendingDecisions: [...context.pendingDecisions, decision],
    };
}

/**
 * Remove a pending decision from context
 * 
 * @param context - Current context
 * @param leverId - Lever ID to remove
 * @returns Updated context
 */
export function removeDecision(
    context: TurnContext,
    leverId: string
): TurnContext {
    return {
        ...context,
        pendingDecisions: context.pendingDecisions.filter(
            (d) => d.leverId !== leverId
        ),
    };
}

/**
 * Clear all pending decisions
 * 
 * @param context - Current context
 * @returns Updated context with empty decisions
 */
export function clearDecisions(context: TurnContext): TurnContext {
    return {
        ...context,
        pendingDecisions: [],
    };
}

/**
 * Update current state in context
 * 
 * @param context - Current context
 * @param newState - New state snapshot
 * @returns Updated context
 */
export function updateState(
    context: TurnContext,
    newState: TurnStateSnapshot
): TurnContext {
    return {
        ...context,
        previousState: context.currentState,
        currentState: newState,
    };
}
