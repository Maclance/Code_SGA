/**
 * Session Service
 *
 * @module lib/services/session.service
 * @description Business logic for session management (US-010)
 */

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { ENGINE_VERSION } from '@/lib/engine';
import {
    generateSessionCode as generateCode,
    generateUniqueCode as generateUnique,
    formatCodeForDisplay,
    CodeGenerationError,
} from '@/lib/utils/session-code';
import {
    type Session,
    type CreateSessionInput,
    CreateSessionInputSchema,
    mapSpeedToDb,
    mapDifficultyToDb,
    mapSpeedFromDb,
    mapDifficultyFromDb,
} from '@/types/session';
import type { ProductId } from '@/types/session';

// ============================================
// Error Classes
// ============================================

export class SessionError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'SessionError';
    }
}

export class SessionNotFoundError extends SessionError {
    constructor(identifier: string) {
        super(`Session not found: ${identifier}`, 'SESSION_NOT_FOUND', 404);
    }
}

export class ValidationError extends SessionError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

export class UnauthorizedError extends SessionError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 403);
    }
}

export class SessionFullError extends SessionError {
    constructor() {
        super('Session complète', 'SESSION_FULL', 409);
    }
}

export class SessionInactiveError extends SessionError {
    constructor(status: string) {
        super(`Session non accessible (status: ${status})`, 'SESSION_INACTIVE', 403);
    }
}

export class AlreadyJoinedError extends SessionError {
    constructor() {
        super('Vous avez déjà rejoint cette session', 'ALREADY_JOINED', 409);
    }
}

// ============================================
// Admin Client (for bypassing RLS)
// ============================================

/**
 * Create Supabase admin client with service_role key
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new SessionError(
            'Missing Supabase configuration for session service',
            'CONFIG_ERROR',
            500
        );
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ============================================
// Helper Functions (delegating to session-code.ts)
// ============================================

/**
 * Generate a unique 6-character alphanumeric session code
 * @deprecated Use generateSessionCode from @/lib/utils/session-code directly
 */
export const generateSessionCode = generateCode;

/**
 * Re-export formatCodeForDisplay for convenience
 */
export { formatCodeForDisplay };

/**
 * Generate a unique code that doesn't exist in the database
 * Wraps the helper to use admin client and convert errors
 */
async function generateUniqueCode(maxAttempts: number = 10): Promise<string> {
    const supabase = getAdminClient();

    try {
        return await generateUnique(supabase, maxAttempts);
    } catch (error) {
        if (error instanceof CodeGenerationError) {
            throw new SessionError(
                'Unable to generate unique session code',
                'CODE_GENERATION_FAILED',
                500
            );
        }
        throw error;
    }
}

/**
 * Generate a unique session name by adding suffix if needed
 * Example: "Session Training" -> "Session Training-1" -> "Session Training-2"
 */
async function generateUniqueName(
    baseName: string,
    tenantId: string
): Promise<string> {
    const supabase = getAdminClient();

    // Check if base name exists
    const { data: existing } = await supabase
        .from('sessions')
        .select('name')
        .eq('tenant_id', tenantId)
        .ilike('name', `${baseName}%`);

    if (!existing || existing.length === 0) {
        return baseName;
    }

    // Check if exact name exists
    const exactMatch = existing.find(
        (s) => s.name?.toLowerCase() === baseName.toLowerCase()
    );

    if (!exactMatch) {
        return baseName;
    }

    // Find highest suffix
    let maxSuffix = 0;
    const suffixPattern = new RegExp(`^${escapeRegExp(baseName)}-(\\d+)$`, 'i');

    for (const session of existing) {
        if (session.name) {
            const match = session.name.match(suffixPattern);
            if (match) {
                const suffix = parseInt(match[1], 10);
                if (suffix > maxSuffix) {
                    maxSuffix = suffix;
                }
            }
        }
    }

    return `${baseName}-${maxSuffix + 1}`;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// Core Functions
// ============================================

/**
 * Database row type for sessions table
 */
interface SessionDbRow {
    id: string;
    tenant_id: string;
    code: string;
    name: string | null;
    status: string;
    config: {
        speed?: string;
        difficulty?: string;
        products?: string[];
    };
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
 * Map database row to API Session
 */
function mapSessionFromDb(row: SessionDbRow): Session {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        code: row.code,
        name: row.name || '',
        status: row.status as Session['status'],
        config: {
            speed: mapSpeedFromDb(row.config.speed || 'moyenne'),
            difficulty: mapDifficultyFromDb(row.config.difficulty || 'novice'),
            maxTurns: row.max_turns,
            products: (row.config.products || ['auto', 'mrh']) as ProductId[],
        },
        engineVersion: row.engine_version,
        currentTurn: row.current_turn,
        createdBy: row.created_by || '',
        createdAt: row.created_at,
        startedAt: row.started_at,
        endedAt: row.ended_at,
    };
}

/**
 * Create a new game session
 *
 * @param input - Session creation input (name, config)
 * @param userId - User ID of the trainer creating the session
 * @param tenantId - Tenant ID for isolation
 * @returns Created session
 * @throws {ValidationError} If input is invalid or no products selected
 * @throws {UnauthorizedError} If tenantId is missing
 */
export async function createSession(
    input: CreateSessionInput,
    userId: string,
    tenantId: string
): Promise<Session> {
    // Validate tenant
    if (!tenantId) {
        throw new UnauthorizedError('Formateur sans tenant_id');
    }

    // Validate input
    const validation = CreateSessionInputSchema.safeParse(input);
    if (!validation.success) {
        throw new ValidationError(
            validation.error.issues.map((e) => e.message).join(', ')
        );
    }

    const { name, config } = validation.data;

    // Validate products (AC3: min 1 required)
    if (!config.products || config.products.length === 0) {
        throw new ValidationError('Au moins un produit requis');
    }

    const supabase = getAdminClient();

    // Generate unique code
    const code = await generateUniqueCode();

    // Generate unique name (handle duplicates with suffix)
    const uniqueName = await generateUniqueName(name, tenantId);

    // Prepare database row
    const dbConfig = {
        speed: mapSpeedToDb(config.speed),
        difficulty: mapDifficultyToDb(config.difficulty),
        products: config.products,
    };

    const { data, error } = await supabase
        .from('sessions')
        .insert({
            tenant_id: tenantId,
            code: code,
            name: uniqueName,
            status: 'draft', // AC: session.status = 'draft' à la création
            config: dbConfig,
            engine_version: ENGINE_VERSION, // AC: engine_version = ENGINE_VERSION
            current_turn: 0,
            max_turns: config.maxTurns,
            created_by: userId,
        })
        .select()
        .single();

    if (error) {
        throw new SessionError(
            `Failed to create session: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    return mapSessionFromDb(data as SessionDbRow);
}

/**
 * Get a session by ID
 *
 * @param sessionId - Session UUID
 * @param tenantId - Tenant ID for verification
 * @returns Session if found
 * @throws {SessionNotFoundError} If session doesn't exist or belongs to different tenant
 */
export async function getSessionById(
    sessionId: string,
    tenantId: string
): Promise<Session> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .single();

    if (error || !data) {
        throw new SessionNotFoundError(sessionId);
    }

    return mapSessionFromDb(data as SessionDbRow);
}

/**
 * Get all sessions for a tenant
 *
 * @param tenantId - Tenant ID
 * @returns List of sessions
 */
export async function getSessionsByTenant(tenantId: string): Promise<Session[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new SessionError(
            `Failed to fetch sessions: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    return (data || []).map((row) => mapSessionFromDb(row as SessionDbRow));
}

/**
 * Get a session by its join code
 *
 * @param code - 6-character join code
 * @returns Session if found
 * @throws {SessionNotFoundError} If code doesn't exist
 */
export async function getSessionByCode(code: string): Promise<Session> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !data) {
        throw new SessionNotFoundError(code);
    }

    return mapSessionFromDb(data as SessionDbRow);
}

// ============================================
// Join Session Functions (US-012)
// ============================================

/**
 * Get the count of participants in a session
 *
 * @param sessionId - Session UUID
 * @returns Number of participants
 */
export async function getSessionParticipantCount(sessionId: string): Promise<number> {
    const supabase = getAdminClient();

    const { count, error } = await supabase
        .from('session_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);

    if (error) {
        console.error('Error counting participants:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Check if a user is already a participant in a session
 *
 * @param sessionId - Session UUID
 * @param userId - User UUID
 * @returns True if user is already in session
 */
export async function isUserInSession(
    sessionId: string,
    userId: string
): Promise<boolean> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

    // No error and data found means user is in session
    return !error && !!data;
}

/**
 * Session with max_participants for join validation
 */
interface SessionWithCapacity extends Session {
    maxParticipants: number;
}

/**
 * Get a session by code with capacity info
 */
async function getSessionByCodeWithCapacity(code: string): Promise<SessionWithCapacity> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('*, max_participants')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !data) {
        throw new SessionNotFoundError(code);
    }

    const session = mapSessionFromDb(data as SessionDbRow);
    return {
        ...session,
        maxParticipants: data.max_participants || 50,
    };
}

/**
 * Join result type
 */
export interface JoinSessionResult {
    sessionId: string;
    session: Session;
    participantId: string;
}

/**
 * Join a session by code
 *
 * @param code - Session join code (6 chars, case-insensitive)
 * @param userId - User ID of the player joining
 * @returns Session data if successful
 * @throws {SessionNotFoundError} If code doesn't exist
 * @throws {SessionInactiveError} If session is not ready or running
 * @throws {SessionFullError} If session has reached max participants
 * @throws {AlreadyJoinedError} If user is already in session
 */
export async function joinSession(
    code: string,
    userId: string
): Promise<JoinSessionResult> {
    const supabase = getAdminClient();

    // Normalize code (uppercase, remove separators)
    const normalizedCode = code.replace(/-/g, '').toUpperCase();

    // Get session with capacity info
    const session = await getSessionByCodeWithCapacity(normalizedCode);

    // Validate session status (AC1: only active sessions)
    if (!['ready', 'running'].includes(session.status)) {
        throw new SessionInactiveError(session.status);
    }

    // Check if user already joined (US-012 constraint: no duplicate joins)
    const alreadyJoined = await isUserInSession(session.id, userId);
    if (alreadyJoined) {
        throw new AlreadyJoinedError();
    }

    // Check capacity (AC3: session full)
    const currentCount = await getSessionParticipantCount(session.id);
    if (currentCount >= session.maxParticipants) {
        throw new SessionFullError();
    }

    // Insert participant
    const { data, error } = await supabase
        .from('session_participants')
        .insert({
            session_id: session.id,
            user_id: userId,
            role: 'player',
        })
        .select()
        .single();

    if (error) {
        // Handle unique constraint violation (race condition)
        if (error.code === '23505') {
            throw new AlreadyJoinedError();
        }
        throw new SessionError(
            `Failed to join session: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    return {
        sessionId: session.id,
        session: session,
        participantId: data.id,
    };
}

// ============================================
// Confirm Product Scope Functions (US-013)
// ============================================

/**
 * Error for invalid session status transitions
 */
export class InvalidStatusTransitionError extends SessionError {
    constructor(currentStatus: string, targetStatus: string) {
        super(
            `Cannot transition from '${currentStatus}' to '${targetStatus}'`,
            'INVALID_STATUS_TRANSITION',
            403
        );
    }
}

/**
 * Confirm product scope result
 */
export interface ConfirmScopeResult {
    session: Session;
}

/**
 * Confirm the product scope for a session and transition to 'active' status
 * 
 * This is an IRREVERSIBLE transition per specs.
 * 
 * @param sessionId - Session UUID
 * @param products - Array of product IDs (at least 1 required)
 * @param userId - User ID performing the confirmation
 * @param tenantId - Tenant ID for authentication
 * @returns Updated session
 * @throws {ValidationError} If no products selected
 * @throws {SessionNotFoundError} If session doesn't exist
 * @throws {InvalidStatusTransitionError} If session is not in 'draft' status
 */
export async function confirmProductScope(
    sessionId: string,
    products: ProductId[],
    userId: string,
    tenantId: string
): Promise<ConfirmScopeResult> {
    // Validate products (AC2: at least 1 required)
    if (!products || products.length === 0) {
        throw new ValidationError('Sélectionnez au moins un produit');
    }

    // Validate product IDs
    const validProducts: ProductId[] = ['auto', 'mrh'];
    for (const product of products) {
        if (!validProducts.includes(product)) {
            throw new ValidationError(`Produit invalide: ${product}`);
        }
    }

    const supabase = getAdminClient();

    // Get current session
    const { data: currentSession, error: fetchError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('tenant_id', tenantId)
        .single();

    if (fetchError || !currentSession) {
        throw new SessionNotFoundError(sessionId);
    }

    // Validate status transition (AC3: only from 'draft')
    if (currentSession.status !== 'draft') {
        throw new InvalidStatusTransitionError(currentSession.status, 'ready');
    }

    // Update session: products + status = 'ready'
    const updatedConfig = {
        ...currentSession.config,
        products: products,
    };

    const { data, error } = await supabase
        .from('sessions')
        .update({
            config: updatedConfig,
            status: 'ready',
            started_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select()
        .single();

    if (error) {
        throw new SessionError(
            `Failed to confirm product scope: ${error.message}`,
            'DB_ERROR',
            500
        );
    }

    return {
        session: mapSessionFromDb(data as SessionDbRow),
    };
}
