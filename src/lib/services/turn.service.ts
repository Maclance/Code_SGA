/**
 * Turn Service
 * 
 * @module lib/services/turn.service
 * @description Turn orchestration service integrating engine calculations (US-014)
 * 
 * Key features:
 * - Resolve turn with decisions
 * - Calculate new indices and P&L
 * - Prepare feedback with major variations
 * - Audit logging for turn events
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TurnState, TurnStateInput, Decision, IndicesSnapshot, PnLSnapshot } from '@/types/game-state';
import type { CompanyVariables, IndicesState, PnLState } from '@/lib/engine';
import { calculateAllIndices, calculatePnL, DEFAULT_INDICES } from '@/lib/engine';
import { saveTurnState, loadTurnState, getLatestState } from './game-state.service';
import { logAuditEvent } from './audit.service';
import { TurnPhase, type PendingDecision, type TurnStateSnapshot } from '@/lib/game/turn-machine';

// ============================================
// TYPES
// ============================================

/**
 * Input for turn resolution
 */
export interface ResolveTurnInput {
    sessionId: string;
    turnNumber: number;
    decisions: PendingDecision[];
    seed: number;
}

/**
 * Feedback about major variations
 */
export interface MajorVariation {
    index: string;
    delta: number;
    previousValue: number;
    newValue: number;
    drivers: string[];
}

/**
 * Complete feedback after resolution
 */
export interface TurnFeedback {
    majorVariations: MajorVariation[];
    summary: {
        decisionsApplied: number;
        indicesImproved: number;
        indicesDegraded: number;
        pnlChange: number;
    };
}

/**
 * Result of turn resolution
 */
export interface ResolveTurnResult {
    success: boolean;
    nextState: {
        turnNumber: number;
        indices: IndicesSnapshot;
        pnl: PnLSnapshot;
    };
    feedback: TurnFeedback;
}

/**
 * Error for turn resolution failures
 */
export class TurnResolutionError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'TurnResolutionError';
    }
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Threshold for major variation (absolute delta)
 */
const MAJOR_VARIATION_THRESHOLD = 5;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert IndicesState to IndicesSnapshot
 */
function toIndicesSnapshot(state: IndicesState): IndicesSnapshot {
    return {
        IAC: state.IAC,
        IPQO: state.IPQO,
        IERH: state.IERH,
        IRF: state.IRF,
        IMD: state.IMD,
        IS: state.IS,
        IPP: state.IPP,
    };
}

/**
 * Convert PnLState to PnLSnapshot
 */
function toPnLSnapshot(state: PnLState): PnLSnapshot {
    return {
        primes: state.primes.nettes,
        sinistres: state.sinistres.nets,
        frais: state.frais.total,
        produits_financiers: state.produits_financiers,
        resultat: state.resultat_total,
    };
}

/**
 * Create default company variables from current state
 * In a full implementation, this would pull from session/product data
 */
function createCompanyVariables(
    currentIndices: IndicesSnapshot,
    currentPnL: PnLSnapshot
): CompanyVariables {
    // Default mid-range values - in production, these come from session state
    return {
        // IAC
        competitivite_prix: 60,
        qualite_service_sinistres: 60,
        etendue_garanties: 55,
        force_distribution: 55,
        notoriete: 50,
        satisfaction_nps: 55,
        // IPQO
        ratio_charge_capacite: 1.0,
        delai_gestion: 35,
        taux_erreur: 0.04,
        qualite_presta: 60,
        stabilite_si: 55,
        competence_rh: 55,
        // IERH
        effectif_vs_besoin: 1.0,
        competences: 55,
        turnover: 0.12,
        climat_social: 55,
        // IRF
        solvency_ratio: 1.5,
        reassurance_level: 55,
        provisions_marge: 0.05,
        placements_securite: 0.6,
        // IMD
        qualite_donnees: 50,
        gouvernance: 45,
        outillage: 50,
        use_cases_ia: 1,
        dette_technique: 35,
        // IS
        adequation_provisions: 0.02,
        court_termisme_score: 65,
        conformite: 70,
        is_precedent: currentIndices.IS,
        // P&L
        primes_brutes: currentPnL.primes * 1.1, // Approximate gross from net
        primes_cedees: currentPnL.primes * 0.1,
        sinistres_bruts: currentPnL.sinistres * 1.1,
        recup_reassurance: currentPnL.sinistres * 0.1,
        frais_acquisition: currentPnL.frais * 0.6,
        frais_gestion: currentPnL.frais * 0.4,
        produits_financiers: currentPnL.produits_financiers,
        resultat_marche: currentPnL.resultat * 0.9,
    };
}

/**
 * Apply decisions to company variables
 * This is a simplified implementation - in production, use product-engine
 */
function applyDecisionsToVariables(
    variables: CompanyVariables,
    decisions: PendingDecision[]
): CompanyVariables {
    const updated = { ...variables };

    for (const decision of decisions) {
        const { leverId, value } = decision;

        // Map lever IDs to variable effects (simplified)
        // In production, this uses the full lever catalogue
        if (leverId.startsWith('LEV-TAR') && typeof value === 'number') {
            // Tarif lever affects competitivite_prix
            updated.competitivite_prix += value * 2;
        } else if (leverId.startsWith('LEV-RH') && typeof value === 'number') {
            // RH lever affects effectif and competences
            updated.effectif_vs_besoin += value * 0.01;
            updated.competences += value * 0.5;
        } else if (leverId.startsWith('LEV-IT') && typeof value === 'number') {
            // IT lever affects stabilite_si and outillage
            updated.stabilite_si += value * 0.5;
            updated.outillage += value * 0.5;
        } else if (leverId.startsWith('LEV-SIN') && typeof value === 'number') {
            // Sinistres lever affects ratio_charge_capacite
            updated.ratio_charge_capacite -= value * 0.01;
        }
    }

    return updated;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Resolve a turn by applying decisions and calculating new state
 * 
 * @param supabase - Supabase client
 * @param input - Resolution input with decisions
 * @param tenantId - Tenant ID for audit
 * @param userId - User ID for audit
 * @returns Resolution result with new state and feedback
 */
export async function resolveTurn(
    supabase: SupabaseClient,
    input: ResolveTurnInput,
    tenantId: string,
    userId: string
): Promise<ResolveTurnResult> {
    const { sessionId, turnNumber, decisions, seed } = input;

    // Log turn start
    await logAuditEvent({
        tenantId,
        userId,
        action: 'session.update',
        resourceType: 'session',
        resourceId: sessionId,
        payload: { event: 'turn.start', turnNumber, decisionsCount: decisions.length },
    });

    try {
        // 1. Load current state
        let previousState: TurnState | null = null;
        let currentIndices: IndicesSnapshot;
        let currentPnL: PnLSnapshot;

        if (turnNumber > 1) {
            previousState = await loadTurnState(supabase, sessionId, turnNumber - 1);
            currentIndices = previousState.indices;
            currentPnL = previousState.pnl;
        } else {
            // First turn - use defaults
            currentIndices = { ...DEFAULT_INDICES };
            currentPnL = {
                primes: 50_000_000,
                sinistres: 32_500_000,
                frais: 12_500_000,
                produits_financiers: 1_500_000,
                resultat: 6_500_000,
            };
        }

        // 2. Create company variables from current state
        const variables = createCompanyVariables(currentIndices, currentPnL);

        // 3. Apply decisions to variables
        const updatedVariables = applyDecisionsToVariables(variables, decisions);

        // 4. Calculate new indices
        const newIndicesState = calculateAllIndices(updatedVariables);
        const newIndices = toIndicesSnapshot(newIndicesState);

        // 5. Calculate new P&L
        const newPnLState = calculatePnL(updatedVariables);
        const newPnL = toPnLSnapshot(newPnLState);

        // 6. Prepare feedback
        const feedback = prepareFeedback(currentIndices, newIndices, currentPnL, newPnL, decisions);

        // 7. Log resolution
        await logAuditEvent({
            tenantId,
            userId,
            action: 'session.update',
            resourceType: 'session',
            resourceId: sessionId,
            payload: {
                event: 'turn.resolve',
                turnNumber,
                majorVariations: feedback.majorVariations.length,
            },
        });

        // 8. Save new state
        const newState: TurnStateInput = {
            session_id: sessionId,
            turn_number: turnNumber,
            timestamp: new Date().toISOString(),
            indices: newIndices,
            pnl: newPnL,
            decisions: decisions.map((d) => ({
                lever_id: d.leverId,
                value: d.value,
                product_id: d.productId as 'auto' | 'mrh' | 'pj' | 'gav' | undefined,
                timestamp: new Date().toISOString(),
            })),
            events: [], // Events would be populated from event system
            portfolio: {}, // Portfolio would be populated from product engine
        };

        await saveTurnState(supabase, sessionId, turnNumber, newState);

        // 9. Log completion
        await logAuditEvent({
            tenantId,
            userId,
            action: 'session.update',
            resourceType: 'session',
            resourceId: sessionId,
            payload: { event: 'turn.complete', turnNumber },
        });

        return {
            success: true,
            nextState: {
                turnNumber: turnNumber + 1,
                indices: newIndices,
                pnl: newPnL,
            },
            feedback,
        };

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TurnResolutionError(
            `Failed to resolve turn ${turnNumber}: ${message}`,
            'RESOLUTION_FAILED',
            500
        );
    }
}

/**
 * Prepare feedback with major variations
 */
export function prepareFeedback(
    previousIndices: IndicesSnapshot,
    newIndices: IndicesSnapshot,
    previousPnL: PnLSnapshot,
    newPnL: PnLSnapshot,
    decisions: PendingDecision[]
): TurnFeedback {
    const majorVariations: MajorVariation[] = [];
    let indicesImproved = 0;
    let indicesDegraded = 0;

    // Check each index for major variations
    const indexKeys: (keyof IndicesSnapshot)[] = ['IAC', 'IPQO', 'IERH', 'IRF', 'IMD', 'IS', 'IPP'];

    for (const key of indexKeys) {
        const prev = previousIndices[key];
        const curr = newIndices[key];
        const delta = curr - prev;

        if (delta > 0) indicesImproved++;
        if (delta < 0) indicesDegraded++;

        if (Math.abs(delta) >= MAJOR_VARIATION_THRESHOLD) {
            // Identify drivers (simplified - in production, use effect tracking)
            const drivers = identifyDrivers(key, decisions);

            majorVariations.push({
                index: key,
                delta,
                previousValue: prev,
                newValue: curr,
                drivers,
            });
        }
    }

    return {
        majorVariations,
        summary: {
            decisionsApplied: decisions.length,
            indicesImproved,
            indicesDegraded,
            pnlChange: newPnL.resultat - previousPnL.resultat,
        },
    };
}

/**
 * Identify drivers for an index change (simplified)
 */
function identifyDrivers(
    indexKey: string,
    decisions: PendingDecision[]
): string[] {
    const drivers: string[] = [];

    // Map indices to relevant lever prefixes
    const indexToLevers: Record<string, string[]> = {
        IAC: ['LEV-TAR', 'LEV-DIST', 'LEV-MKT'],
        IPQO: ['LEV-SIN', 'LEV-IT', 'LEV-RH'],
        IERH: ['LEV-RH'],
        IRF: ['LEV-REA', 'LEV-PROV', 'LEV-CAP'],
        IMD: ['LEV-IT', 'LEV-DATA'],
        IS: ['LEV-PROV', 'LEV-CONF'],
        IPP: ['LEV-TAR', 'LEV-SIN', 'LEV-REA'],
    };

    const relevantPrefixes = indexToLevers[indexKey] || [];

    for (const decision of decisions) {
        for (const prefix of relevantPrefixes) {
            if (decision.leverId.startsWith(prefix)) {
                drivers.push(decision.leverId);
            }
        }
    }

    // Limit to top 3 drivers
    return drivers.slice(0, 3);
}

/**
 * Get current turn state for a session
 */
export async function getCurrentTurnState(
    supabase: SupabaseClient,
    sessionId: string
): Promise<TurnStateSnapshot | null> {
    const latest = await getLatestState(supabase, sessionId);

    if (!latest) {
        return null;
    }

    return {
        indices: latest.indices as unknown as Record<string, number>,
        pnl: latest.pnl,
    };
}

/**
 * Initialize first turn state
 */
export function createInitialState(): TurnStateSnapshot {
    return {
        indices: { ...DEFAULT_INDICES },
        pnl: {
            primes: 50_000_000,
            sinistres: 32_500_000,
            frais: 12_500_000,
            produits_financiers: 1_500_000,
            resultat: 6_500_000,
        },
    };
}
