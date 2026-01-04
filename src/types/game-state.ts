/**
 * Game State Types
 * 
 * @module types/game-state
 * @description Types for game session and turn state management (US-005)
 * 
 * References:
 * - docs/80_api_data/data_model.md (sessions, game_states)
 * - docs/20_simulation/overview.md (SimulationState)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (TurnState)
 */

import { z } from 'zod';
import type { LevierId, ProduitType, EvenementType, IndiceType } from './index';

// ============================================
// SESSION TYPES
// ============================================

/**
 * Session status enum matching database
 */
export type SessionStatus = 'draft' | 'ready' | 'running' | 'paused' | 'ended';

/**
 * Session configuration stored in JSONB
 */
export interface SessionConfig {
    difficulty: 'novice' | 'intermediaire' | 'expert' | 'survie';
    speed: 'rapide' | 'moyenne' | 'lente';
    products: ProduitType[];
    seed?: number; // Random seed for reproducibility
}

/**
 * Session database row
 */
export interface Session {
    id: string;
    tenant_id: string;
    code: string;
    name: string | null;
    status: SessionStatus;
    config: SessionConfig;
    engine_version: string;
    current_turn: number;
    max_turns: number;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    started_at: string | null;
    ended_at: string | null;
}

/**
 * Input for creating a session
 */
export interface CreateSessionInput {
    tenant_id: string;
    name?: string;
    config: SessionConfig;
    engine_version: string;
    max_turns?: number;
    created_by?: string;
}

// ============================================
// TURN STATE TYPES (JSONB payload)
// ============================================

/**
 * Indices snapshot (all 7 indices, values 0-100)
 */
export interface IndicesSnapshot {
    IAC: number;
    IPQO: number;
    IERH: number;
    IRF: number;
    IMD: number;
    IS: number;
    IPP: number;
}

/**
 * P&L snapshot for the turn
 */
export interface PnLSnapshot {
    primes: number;           // Premiums collected
    sinistres: number;        // Claims paid
    frais: number;            // Operating expenses
    produits_financiers: number; // Financial income
    resultat: number;         // Net result
}

/**
 * Decision made during a turn
 */
export interface Decision {
    lever_id: LevierId;
    value: number | string | boolean | Record<string, unknown>;
    product_id?: ProduitType; // null = global lever
    timestamp: string;        // ISO8601
}

/**
 * Event triggered during a turn
 */
export interface TriggeredEvent {
    event_id: string;
    event_type: EvenementType;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    impacts: Partial<Record<IndiceType, number>>;
    duration_turns: number;
    turn_triggered: number;
}

/**
 * Portfolio metrics for a single product
 */
export interface ProductPortfolioMetrics {
    contracts: number;
    premiums: number;
    claims_stock: number;
    claims_flow_in: number;
    claims_flow_out: number;
}

/**
 * Portfolio metrics by product
 */
export type PortfolioByProduct = {
    [productId in ProduitType]?: ProductPortfolioMetrics;
};

/**
 * Complete turn state stored in JSONB
 * This is the main structure persisted in game_states.state
 */
export interface TurnState {
    session_id: string;
    turn_number: number;
    timestamp: string; // ISO8601

    // Core game state
    indices: IndicesSnapshot;
    pnl: PnLSnapshot;
    decisions: Decision[];
    events: TriggeredEvent[];
    portfolio: PortfolioByProduct;
    /**
     * Delayed effects queue - uses any[] to avoid circular imports.
     * Service layer should cast to DelayedEffect[] from effects-types.ts
     */
    delayed_effects?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pending: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applied: any[];
    };
    active_levers?: Record<string, string | number | boolean>;

    // Integrity
    checksum: string; // SHA256 hex string
}

/**
 * Game state database row
 */
export interface GameState {
    id: string;
    session_id: string;
    turn_number: number;
    state: TurnState;
    checksum: string;
    created_at: string;
}

// ============================================
// ZOD SCHEMAS (Validation)
// ============================================

/**
 * Zod schema for IndicesSnapshot
 */
export const IndicesSnapshotSchema = z.object({
    IAC: z.number().min(0).max(100),
    IPQO: z.number().min(0).max(100),
    IERH: z.number().min(0).max(100),
    IRF: z.number().min(0).max(100),
    IMD: z.number().min(0).max(100),
    IS: z.number().min(0).max(100),
    IPP: z.number().min(0).max(100),
});

/**
 * Zod schema for PnLSnapshot
 */
export const PnLSnapshotSchema = z.object({
    primes: z.number(),
    sinistres: z.number(),
    frais: z.number(),
    produits_financiers: z.number(),
    resultat: z.number(),
});

/**
 * Zod schema for Decision
 */
export const DecisionSchema = z.object({
    lever_id: z.string(),
    value: z.union([z.number(), z.string(), z.boolean(), z.record(z.string(), z.unknown())]),
    product_id: z.enum(['auto', 'mrh', 'pj', 'gav']).optional(),
    timestamp: z.string().datetime(),
});

/**
 * Zod schema for TriggeredEvent
 */
export const TriggeredEventSchema = z.object({
    event_id: z.string(),
    event_type: z.enum(['marche', 'compagnie']),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    impacts: z.record(z.string(), z.number()),
    duration_turns: z.number().int().min(0),
    turn_triggered: z.number().int().min(0),
});

/**
 * Zod schema for ProductPortfolioMetrics
 */
export const ProductPortfolioMetricsSchema = z.object({
    contracts: z.number().int().min(0),
    premiums: z.number().min(0),
    claims_stock: z.number().int().min(0),
    claims_flow_in: z.number().int().min(0),
    claims_flow_out: z.number().int().min(0),
});

/**
 * Zod schema for PortfolioByProduct
 * Uses string keys for flexibility (auto, mrh, pj, gav)
 */
export const PortfolioByProductSchema = z.record(
    z.string(),
    ProductPortfolioMetricsSchema
);

/**
 * Zod schema for TurnState (without checksum - computed separately)
 */
export const TurnStateInputSchema = z.object({
    session_id: z.string().uuid(),
    turn_number: z.number().int().min(0),
    timestamp: z.string().datetime(),
    indices: IndicesSnapshotSchema,
    pnl: PnLSnapshotSchema,
    decisions: z.array(DecisionSchema),
    events: z.array(TriggeredEventSchema),
    portfolio: PortfolioByProductSchema,
    // Using z.unknown() to avoid circular dependencies with effects-types
    delayed_effects: z.object({
        pending: z.array(z.unknown()),
        applied: z.array(z.unknown()),
    }).optional(),
    active_levers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/**
 * Zod schema for complete TurnState (with checksum)
 */
export const TurnStateSchema = TurnStateInputSchema.extend({
    checksum: z.string().length(64), // SHA256 hex
});

/**
 * Session config schema
 */
export const SessionConfigSchema = z.object({
    difficulty: z.enum(['novice', 'intermediaire', 'expert', 'survie']),
    speed: z.enum(['rapide', 'moyenne', 'lente']),
    products: z.array(z.enum(['auto', 'mrh', 'pj', 'gav'])).min(1),
    seed: z.number().int().optional(),
});

/**
 * Create session input schema
 */
export const CreateSessionInputSchema = z.object({
    tenant_id: z.string().uuid(),
    name: z.string().max(255).optional(),
    config: SessionConfigSchema,
    engine_version: z.string().max(20),
    max_turns: z.number().int().min(4).max(24).default(12),
    created_by: z.string().uuid().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type TurnStateInput = z.infer<typeof TurnStateInputSchema>;
export type ValidatedTurnState = z.infer<typeof TurnStateSchema>;
export type ValidatedSessionConfig = z.infer<typeof SessionConfigSchema>;
export type ValidatedCreateSessionInput = z.infer<typeof CreateSessionInputSchema>;
