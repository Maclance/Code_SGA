/**
 * Session Types for US-010
 * 
 * @module types/session
 * @description API-compatible session types with English enums
 * 
 * References:
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-010)
 * - docs/80_api_data/data_model.md (game_sessions)
 */

import { z } from 'zod';

// ============================================
// API-COMPATIBLE ENUMS (English)
// ============================================

/**
 * Session speed: controls the pace of in-game time
 * - fast: 1 turn = 1 year
 * - medium: 1 turn = 1 quarter (default)
 * - slow: 1 turn = 1 month
 */
export type SessionSpeed = 'fast' | 'medium' | 'slow';

/**
 * Session difficulty level (MVP: novice/intermediate only)
 */
export type SessionDifficulty = 'novice' | 'intermediate';

/**
 * Product identifiers (MVP: auto/mrh only)
 */
export type ProductId = 'auto' | 'mrh';

/**
 * Session status enum matching database
 */
export type SessionStatus = 'draft' | 'ready' | 'running' | 'paused' | 'ended';

// ============================================
// INTERFACES
// ============================================

/**
 * Session configuration for API
 */
export interface SessionConfig {
    speed: SessionSpeed;
    difficulty: SessionDifficulty;
    maxTurns: number;
    products: ProductId[];
}

/**
 * Session database row (API representation)
 */
export interface Session {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    status: SessionStatus;
    config: SessionConfig;
    engineVersion: string;
    currentTurn: number;
    createdBy: string;
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
}

/**
 * Input for creating a session via API
 */
export interface CreateSessionInput {
    name: string;
    config: {
        speed: SessionSpeed;
        difficulty: SessionDifficulty;
        maxTurns: number;
        products: ProductId[];
    };
}

// ============================================
// ZOD SCHEMAS
// ============================================

/**
 * Session config validation schema
 */
export const SessionConfigSchema = z.object({
    speed: z.enum(['fast', 'medium', 'slow']),
    difficulty: z.enum(['novice', 'intermediate']),
    maxTurns: z.number().int().min(4).max(20),
    products: z.array(z.enum(['auto', 'mrh'])).min(1, 'Au moins un produit requis'),
});

/**
 * Create session input validation schema
 */
export const CreateSessionInputSchema = z.object({
    name: z.string().min(1, 'Le nom est requis').max(255, 'Nom trop long (max 255)'),
    config: SessionConfigSchema,
});

// ============================================
// MAPPING FUNCTIONS
// ============================================

/**
 * Map API speed to database speed (French)
 */
export function mapSpeedToDb(speed: SessionSpeed): 'rapide' | 'moyenne' | 'lente' {
    const map: Record<SessionSpeed, 'rapide' | 'moyenne' | 'lente'> = {
        fast: 'rapide',
        medium: 'moyenne',
        slow: 'lente',
    };
    return map[speed];
}

/**
 * Map database speed to API speed (English)
 */
export function mapSpeedFromDb(speed: string): SessionSpeed {
    const map: Record<string, SessionSpeed> = {
        rapide: 'fast',
        moyenne: 'medium',
        lente: 'slow',
    };
    return map[speed] || 'medium';
}

/**
 * Map API difficulty to database difficulty (French)
 */
export function mapDifficultyToDb(difficulty: SessionDifficulty): 'novice' | 'intermediaire' {
    const map: Record<SessionDifficulty, 'novice' | 'intermediaire'> = {
        novice: 'novice',
        intermediate: 'intermediaire',
    };
    return map[difficulty];
}

/**
 * Map database difficulty to API difficulty (English)
 */
export function mapDifficultyFromDb(difficulty: string): SessionDifficulty {
    const map: Record<string, SessionDifficulty> = {
        novice: 'novice',
        intermediaire: 'intermediate',
    };
    return map[difficulty] || 'novice';
}

// ============================================
// TYPE EXPORTS
// ============================================

export type ValidatedCreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
export type ValidatedSessionConfig = z.infer<typeof SessionConfigSchema>;
