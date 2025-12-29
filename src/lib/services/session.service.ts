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
// Helper Functions
// ============================================

/**
 * Generate a unique 6-character alphanumeric session code
 * Format: ABC123 (3 uppercase letters + 3 digits)
 */
export function generateSessionCode(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O to avoid confusion
    const digits = '0123456789';

    let code = '';

    // 3 random letters
    for (let i = 0; i < 3; i++) {
        code += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    // 3 random digits
    for (let i = 0; i < 3; i++) {
        code += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return code;
}

/**
 * Generate a unique code that doesn't exist in the database
 */
async function generateUniqueCode(maxAttempts: number = 10): Promise<string> {
    const supabase = getAdminClient();

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = generateSessionCode();

        const { data: existing } = await supabase
            .from('sessions')
            .select('id')
            .eq('code', code)
            .single();

        if (!existing) {
            return code;
        }
    }

    throw new SessionError(
        'Unable to generate unique session code',
        'CODE_GENERATION_FAILED',
        500
    );
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
