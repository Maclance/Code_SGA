/**
 * Game State Service Unit Tests
 * 
 * @module tests/services/game-state.service.test
 * @description Unit tests for game state management service (US-005)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    computeChecksum,
    verifyChecksum,
    saveTurnState,
    loadTurnState,
    getLatestState,
    StateNotFoundError,
    StateAlreadyExistsError,
    ChecksumMismatchError,
    ValidationError,
} from '@/lib/services/game-state.service';
import type { TurnState, TurnStateInput } from '@/types/game-state';

// ============================================
// Mock Data
// ============================================

const mockSessionId = '123e4567-e89b-12d3-a456-426614174000';

const mockTurnStateInput: TurnStateInput = {
    session_id: mockSessionId,
    turn_number: 1,
    timestamp: '2025-12-28T23:00:00.000Z',
    indices: {
        IAC: 75.5,
        IPQO: 68.2,
        IERH: 82.0,
        IRF: 90.0,
        IMD: 55.0,
        IS: 70.0,
        IPP: 65.3,
    },
    pnl: {
        primes: 1000000,
        sinistres: 650000,
        frais: 200000,
        produits_financiers: 50000,
        resultat: 200000,
    },
    decisions: [
        {
            lever_id: 'L-PROD-01',
            value: 5,
            product_id: 'auto',
            timestamp: '2025-12-28T22:55:00.000Z',
        },
    ],
    events: [
        {
            event_id: 'EVT-CLIMAT-01',
            event_type: 'marche',
            severity: 'medium',
            impacts: { IAC: -5, IPP: -3 },
            duration_turns: 2,
            turn_triggered: 1,
        },
    ],
    portfolio: {
        auto: {
            contracts: 50000,
            premiums: 600000,
            claims_stock: 1200,
            claims_flow_in: 150,
            claims_flow_out: 120,
        },
        mrh: {
            contracts: 30000,
            premiums: 400000,
            claims_stock: 800,
            claims_flow_in: 100,
            claims_flow_out: 90,
        },
    },
};

// ============================================
// Mock Supabase Client
// ============================================

function createMockSupabase(overrides: Record<string, unknown> = {}) {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        ...overrides,
    };

    return {
        from: vi.fn().mockReturnValue(mockChain),
        _mockChain: mockChain,
    };
}

// ============================================
// Checksum Tests
// ============================================

describe('Checksum Functions', () => {
    describe('computeChecksum', () => {
        it('should produce a 64-character hex string', () => {
            const checksum = computeChecksum(mockTurnStateInput);

            expect(checksum).toHaveLength(64);
            expect(/^[0-9a-f]{64}$/.test(checksum)).toBe(true);
        });

        it('should be deterministic (same input = same output)', () => {
            const checksum1 = computeChecksum(mockTurnStateInput);
            const checksum2 = computeChecksum(mockTurnStateInput);

            expect(checksum1).toBe(checksum2);
        });

        it('should produce different checksums for different states', () => {
            const checksum1 = computeChecksum(mockTurnStateInput);

            const modifiedState = {
                ...mockTurnStateInput,
                indices: { ...mockTurnStateInput.indices, IAC: 80 },
            };
            const checksum2 = computeChecksum(modifiedState);

            expect(checksum1).not.toBe(checksum2);
        });

        it('should be insensitive to key order (normalized JSON)', () => {
            // Create state with different key order
            const state1: TurnStateInput = {
                session_id: mockSessionId,
                turn_number: 1,
                timestamp: '2025-12-28T23:00:00.000Z',
                indices: { IAC: 75, IPQO: 68, IERH: 82, IRF: 90, IMD: 55, IS: 70, IPP: 65 },
                pnl: { primes: 1000, sinistres: 650, frais: 200, produits_financiers: 50, resultat: 200 },
                decisions: [],
                events: [],
                portfolio: {},
            };

            const state2: TurnStateInput = {
                turn_number: 1,
                session_id: mockSessionId,
                timestamp: '2025-12-28T23:00:00.000Z',
                portfolio: {},
                events: [],
                decisions: [],
                pnl: { resultat: 200, primes: 1000, frais: 200, sinistres: 650, produits_financiers: 50 },
                indices: { IPP: 65, IS: 70, IMD: 55, IRF: 90, IERH: 82, IPQO: 68, IAC: 75 },
            };

            const checksum1 = computeChecksum(state1);
            const checksum2 = computeChecksum(state2);

            expect(checksum1).toBe(checksum2);
        });
    });

    describe('verifyChecksum', () => {
        it('should return true for valid checksum', () => {
            const checksum = computeChecksum(mockTurnStateInput);
            const stateWithChecksum = {
                ...mockTurnStateInput,
                checksum,
            } as TurnState;

            expect(verifyChecksum(stateWithChecksum)).toBe(true);
        });

        it('should return false for invalid checksum', () => {
            const stateWithBadChecksum = {
                ...mockTurnStateInput,
                checksum: 'invalid_checksum_0000000000000000000000000000000000000000',
            } as TurnState;

            expect(verifyChecksum(stateWithBadChecksum)).toBe(false);
        });

        it('should detect corruption (modified data)', () => {
            const checksum = computeChecksum(mockTurnStateInput);
            const corruptedState = {
                ...mockTurnStateInput,
                indices: { ...mockTurnStateInput.indices, IAC: 99 }, // Modified!
                checksum,
            } as TurnState;

            expect(verifyChecksum(corruptedState)).toBe(false);
        });
    });
});

// ============================================
// Service Function Tests
// ============================================

describe('GameStateService', () => {
    describe('saveTurnState', () => {
        it('should save state with computed checksum', async () => {
            const mockSupabase = createMockSupabase();
            const expectedChecksum = computeChecksum(mockTurnStateInput);

            // First call: check if state exists
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            // Second call: insert
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: 'new-id',
                        session_id: mockSessionId,
                        turn_number: 1,
                        state: { ...mockTurnStateInput, checksum: expectedChecksum },
                        checksum: expectedChecksum,
                    },
                    error: null,
                });

            const result = await saveTurnState(
                mockSupabase as never,
                mockSessionId,
                1,
                mockTurnStateInput
            );

            expect(result.checksum).toBe(expectedChecksum);
            expect(mockSupabase.from).toHaveBeenCalledWith('game_states');
        });

        it('should throw StateAlreadyExistsError if state exists', async () => {
            const mockSupabase = createMockSupabase();

            // State already exists
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null });

            await expect(
                saveTurnState(mockSupabase as never, mockSessionId, 1, mockTurnStateInput)
            ).rejects.toThrow(StateAlreadyExistsError);
        });

        it('should throw ValidationError for mismatched session_id', async () => {
            const mockSupabase = createMockSupabase();
            const wrongSessionInput = {
                ...mockTurnStateInput,
                session_id: 'wrong-session-id',
            };

            await expect(
                saveTurnState(mockSupabase as never, mockSessionId, 1, wrongSessionInput)
            ).rejects.toThrow(ValidationError);
        });

        it('should throw ValidationError for mismatched turn_number', async () => {
            const mockSupabase = createMockSupabase();

            await expect(
                saveTurnState(mockSupabase as never, mockSessionId, 2, mockTurnStateInput)
            ).rejects.toThrow(ValidationError);
        });
    });

    describe('loadTurnState', () => {
        it('should load and validate state', async () => {
            const mockSupabase = createMockSupabase();
            const checksum = computeChecksum(mockTurnStateInput);
            const storedState = { ...mockTurnStateInput, checksum } as TurnState;

            mockSupabase._mockChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: 'state-id',
                        session_id: mockSessionId,
                        turn_number: 1,
                        state: storedState,
                        checksum,
                    },
                    error: null,
                });

            const result = await loadTurnState(mockSupabase as never, mockSessionId, 1);

            expect(result).toEqual(storedState);
            expect(result.checksum).toBe(checksum);
        });

        it('should throw StateNotFoundError when state does not exist', async () => {
            const mockSupabase = createMockSupabase();

            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            await expect(
                loadTurnState(mockSupabase as never, mockSessionId, 1)
            ).rejects.toThrow(StateNotFoundError);
        });

        it('should throw ChecksumMismatchError for corrupted state', async () => {
            const mockSupabase = createMockSupabase();
            const corruptedState = {
                ...mockTurnStateInput,
                indices: { ...mockTurnStateInput.indices, IAC: 99 }, // Corrupted!
                checksum: computeChecksum(mockTurnStateInput), // Original checksum
            } as TurnState;

            mockSupabase._mockChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: 'state-id',
                        session_id: mockSessionId,
                        turn_number: 1,
                        state: corruptedState,
                        checksum: corruptedState.checksum,
                    },
                    error: null,
                });

            await expect(
                loadTurnState(mockSupabase as never, mockSessionId, 1)
            ).rejects.toThrow(ChecksumMismatchError);
        });
    });

    describe('getLatestState', () => {
        it('should return most recent state', async () => {
            const mockSupabase = createMockSupabase();
            const checksum = computeChecksum(mockTurnStateInput);
            const storedState = { ...mockTurnStateInput, checksum } as TurnState;

            mockSupabase._mockChain.single
                .mockResolvedValueOnce({
                    data: {
                        id: 'state-id',
                        session_id: mockSessionId,
                        turn_number: 1,
                        state: storedState,
                        checksum,
                    },
                    error: null,
                });

            const result = await getLatestState(mockSupabase as never, mockSessionId);

            expect(result).toEqual(storedState);
            expect(mockSupabase._mockChain.order).toHaveBeenCalledWith('turn_number', { ascending: false });
            expect(mockSupabase._mockChain.limit).toHaveBeenCalledWith(1);
        });

        it('should return null when no states exist', async () => {
            const mockSupabase = createMockSupabase();

            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            const result = await getLatestState(mockSupabase as never, mockSessionId);

            expect(result).toBeNull();
        });
    });
});

// ============================================
// Edge Cases
// ============================================

describe('Edge Cases', () => {
    it('should handle empty decisions array', async () => {
        const stateWithNoDecisions: TurnStateInput = {
            ...mockTurnStateInput,
            decisions: [],
        };

        const checksum = computeChecksum(stateWithNoDecisions);
        expect(checksum).toHaveLength(64);
    });

    it('should handle empty events array', async () => {
        const stateWithNoEvents: TurnStateInput = {
            ...mockTurnStateInput,
            events: [],
        };

        const checksum = computeChecksum(stateWithNoEvents);
        expect(checksum).toHaveLength(64);
    });

    it('should handle empty portfolio', async () => {
        const stateWithNoPortfolio: TurnStateInput = {
            ...mockTurnStateInput,
            portfolio: {},
        };

        const checksum = computeChecksum(stateWithNoPortfolio);
        expect(checksum).toHaveLength(64);
    });

    it('should handle turn number 0 (initial state)', async () => {
        const initialState: TurnStateInput = {
            ...mockTurnStateInput,
            turn_number: 0,
        };

        const checksum = computeChecksum(initialState);
        expect(checksum).toHaveLength(64);
    });
});
