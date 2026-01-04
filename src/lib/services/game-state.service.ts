/**
 * Game State Service
 * 
 * @module lib/services/game-state.service
 * @description Business logic for game state management (US-005)
 * 
 * Key features:
 * - Append-only state storage (no modification of past states)
 * - SHA256 checksum for integrity validation
 * - JSONB storage for schema flexibility
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import {
    type TurnState,
    type TurnStateInput,
    type GameState,
    TurnStateInputSchema,
} from '@/types/game-state';

// Re-export engine version error for consolidated error handling
export { EngineVersionMismatchError } from '@/lib/engine';


// ============================================
// Error Classes
// ============================================

export class GameStateError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'GameStateError';
    }
}

export class StateNotFoundError extends GameStateError {
    constructor(sessionId: string, turnNumber?: number) {
        const msg = turnNumber !== undefined
            ? `State not found for session ${sessionId}, turn ${turnNumber}`
            : `No states found for session ${sessionId}`;
        super(msg, 'STATE_NOT_FOUND', 404);
    }
}

export class ChecksumMismatchError extends GameStateError {
    constructor(sessionId: string, turnNumber: number) {
        super(
            `Checksum mismatch for session ${sessionId}, turn ${turnNumber}. Data may be corrupted.`,
            'CHECKSUM_MISMATCH',
            500
        );
    }
}

export class StateAlreadyExistsError extends GameStateError {
    constructor(sessionId: string, turnNumber: number) {
        super(
            `State already exists for session ${sessionId}, turn ${turnNumber}. States are append-only.`,
            'STATE_ALREADY_EXISTS',
            409
        );
    }
}

export class ValidationError extends GameStateError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

// ============================================
// Checksum Functions
// ============================================

/**
 * Compute SHA256 checksum of a TurnState
 * Uses deterministic JSON stringification (sorted keys)
 * 
 * @param state - TurnState without checksum
 * @returns 64-character hex string
 */
export function computeChecksum(state: TurnStateInput): string {
    // Create a copy with all nested objects sorted by key
    const stateForHash = sortObject({
        session_id: state.session_id,
        turn_number: state.turn_number,
        timestamp: state.timestamp,
        indices: state.indices,
        pnl: state.pnl,
        decisions: state.decisions,
        events: state.events,
        portfolio: state.portfolio,
        delayed_effects: state.delayed_effects,
    });

    // Stringify the pre-sorted object (no replacer needed)
    const normalized = JSON.stringify(stateForHash);

    return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify checksum of a loaded state
 * 
 * @param state - Complete TurnState with checksum
 * @returns true if checksum matches
 */
export function verifyChecksum(state: TurnState): boolean {
    const { checksum, ...stateWithoutChecksum } = state;
    const computed = computeChecksum(stateWithoutChecksum);
    return computed === checksum;
}

/**
 * Helper: Sort object keys for deterministic JSON
 */
function sortObject<T extends object>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObject) as T;
    }
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
        sorted[key] = sortObject((obj as Record<string, unknown>)[key] as object);
    }
    return sorted as T;
}

// ============================================
// Service Functions
// ============================================

/**
 * Save a turn state (append-only)
 * 
 * @param supabase - Supabase client
 * @param sessionId - Session UUID
 * @param turnNumber - Turn number (0-indexed)
 * @param stateInput - State data without checksum
 * @returns Saved TurnState with checksum
 * @throws {StateAlreadyExistsError} If state for this turn already exists
 * @throws {ValidationError} If state data is invalid
 */
export async function saveTurnState(
    supabase: SupabaseClient,
    sessionId: string,
    turnNumber: number,
    stateInput: TurnStateInput
): Promise<TurnState> {
    // Validate input
    const validation = TurnStateInputSchema.safeParse(stateInput);
    if (!validation.success) {
        console.error('[GameState] Validation errors:', JSON.stringify(validation.error.issues, null, 2));
        throw new ValidationError(
            validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
    }

    // Ensure session_id and turn_number match
    if (stateInput.session_id !== sessionId) {
        throw new ValidationError('session_id in state does not match URL parameter');
    }
    if (stateInput.turn_number !== turnNumber) {
        throw new ValidationError('turn_number in state does not match URL parameter');
    }

    // Check if state already exists (append-only constraint)
    const { data: existing } = await supabase
        .from('game_states')
        .select('id')
        .eq('session_id', sessionId)
        .eq('turn_number', turnNumber)
        .single();

    if (existing) {
        throw new StateAlreadyExistsError(sessionId, turnNumber);
    }

    // Compute checksum
    const checksum = computeChecksum(stateInput);

    // Build complete state - cast to TurnState (validated by Zod)
    const state = {
        ...stateInput,
        checksum,
    } as TurnState;

    // Insert state
    const { data, error } = await supabase
        .from('game_states')
        .insert({
            session_id: sessionId,
            turn_number: turnNumber,
            state: state,
            checksum: checksum,
        })
        .select()
        .single();

    if (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === '23505') {
            throw new StateAlreadyExistsError(sessionId, turnNumber);
        }
        throw new GameStateError(`Failed to save state: ${error.message}`, 'DB_ERROR');
    }

    return data.state as TurnState;
}

/**
 * Load a turn state with checksum validation
 * 
 * @param supabase - Supabase client
 * @param sessionId - Session UUID
 * @param turnNumber - Turn number to load
 * @returns TurnState if found and valid
 * @throws {StateNotFoundError} If state doesn't exist
 * @throws {ChecksumMismatchError} If checksum validation fails
 */
export async function loadTurnState(
    supabase: SupabaseClient,
    sessionId: string,
    turnNumber: number
): Promise<TurnState> {
    const { data, error } = await supabase
        .from('game_states')
        .select('*')
        .eq('session_id', sessionId)
        .eq('turn_number', turnNumber)
        .single();

    if (error || !data) {
        throw new StateNotFoundError(sessionId, turnNumber);
    }

    const gameState = data as GameState;
    const state = gameState.state;

    // Validate checksum
    if (!verifyChecksum(state)) {
        throw new ChecksumMismatchError(sessionId, turnNumber);
    }

    return state;
}

/**
 * Get the latest (most recent) turn state for a session
 * 
 * @param supabase - Supabase client
 * @param sessionId - Session UUID
 * @returns Latest TurnState or null if no states exist
 */
export async function getLatestState(
    supabase: SupabaseClient,
    sessionId: string
): Promise<TurnState | null> {
    const { data, error } = await supabase
        .from('game_states')
        .select('*')
        .eq('session_id', sessionId)
        .order('turn_number', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return null;
    }

    const gameState = data as GameState;
    const state = gameState.state;

    // Validate checksum
    if (!verifyChecksum(state)) {
        throw new ChecksumMismatchError(sessionId, state.turn_number);
    }

    return state;
}

/**
 * Get all states from a specific turn onwards (for replay)
 * 
 * @param supabase - Supabase client
 * @param sessionId - Session UUID
 * @param startTurn - Starting turn number (inclusive)
 * @returns Array of TurnStates in order
 */
export async function replayFromTurn(
    supabase: SupabaseClient,
    sessionId: string,
    startTurn: number = 0
): Promise<TurnState[]> {
    const { data, error } = await supabase
        .from('game_states')
        .select('*')
        .eq('session_id', sessionId)
        .gte('turn_number', startTurn)
        .order('turn_number', { ascending: true });

    if (error) {
        throw new GameStateError(`Failed to load states: ${error.message}`, 'DB_ERROR');
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Validate all checksums
    const states: TurnState[] = [];
    for (const row of data) {
        const gameState = row as GameState;
        const state = gameState.state;

        if (!verifyChecksum(state)) {
            throw new ChecksumMismatchError(sessionId, state.turn_number);
        }

        states.push(state);
    }

    return states;
}

/**
 * Get the count of states for a session
 * 
 * @param supabase - Supabase client
 * @param sessionId - Session UUID
 * @returns Number of saved states
 */
export async function getStateCount(
    supabase: SupabaseClient,
    sessionId: string
): Promise<number> {
    const { count, error } = await supabase
        .from('game_states')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

    if (error) {
        throw new GameStateError(`Failed to count states: ${error.message}`, 'DB_ERROR');
    }

    return count ?? 0;
}
