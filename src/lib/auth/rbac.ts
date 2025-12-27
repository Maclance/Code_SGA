/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * @module lib/auth/rbac
 * @description Centralized RBAC middleware for route protection (US-002)
 * Implements deny-by-default policy per auth_rbac.md
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { type User, type UserRole, type Action, hasPermission } from '@/types/user';
import { NextResponse } from 'next/server';

// ============================================
// Admin Client (bypasses RLS)
// ============================================

function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

// ============================================
// Error Classes
// ============================================

export class AuthError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 401
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

export class UnauthorizedError extends AuthError {
    constructor(message = 'Authentication required') {
        super(message, 'UNAUTHORIZED', 401);
    }
}

export class ForbiddenError extends AuthError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'FORBIDDEN', 403);
    }
}

export class TenantMismatchError extends AuthError {
    constructor() {
        // Masquer l'existence de la ressource (auth_rbac.md §5)
        super('Resource not found', 'FORBIDDEN', 403);
    }
}

// ============================================
// User Context Functions
// ============================================

/**
 * Gets the current authenticated user from Supabase auth
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    const {
        data: { user: authUser },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
        return null;
    }

    // Use admin client to bypass RLS for profile fetching
    const adminClient = getAdminClient();

    // Get user profile from our users table
    const { data: user, error: userError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (userError || !user) {
        return null;
    }

    return user as User;
}

/**
 * Gets the current user or throws UnauthorizedError
 */
export async function requireUser(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) {
        throw new UnauthorizedError();
    }
    return user;
}

/**
 * Check if user has access to a specific tenant
 * Implements strict tenant isolation per auth_rbac.md §4
 */
export function checkTenantAccess(user: User, tenantId: string): boolean {
    return user.tenant_id === tenantId;
}

/**
 * Verifies tenant access and throws error if mismatch
 */
export function requireTenantAccess(user: User, tenantId: string): void {
    if (!checkTenantAccess(user, tenantId)) {
        throw new TenantMismatchError();
    }
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User, roles: UserRole[]): boolean {
    return roles.includes(user.role);
}

/**
 * Check if user can perform an action
 */
export function canPerformAction(user: User, action: Action): boolean {
    return hasPermission(user.role, action);
}

// ============================================
// Middleware Factories
// ============================================

/**
 * Creates a middleware that requires specific roles
 * Implements deny-by-default: if role not in list, access denied
 *
 * @example
 * // In API route
 * const roleCheck = await requireRole(['admin_tenant']);
 * if (roleCheck) return roleCheck; // Returns 403 response
 */
export async function requireRole(
    allowedRoles: UserRole[]
): Promise<NextResponse | null> {
    try {
        const user = await requireUser();

        // Deny-by-default: role must be in allowed list
        if (!hasRole(user, allowedRoles)) {
            return NextResponse.json(
                { error: 'forbidden', message: 'Insufficient permissions' },
                { status: 403 }
            );
        }

        // Access granted
        return null;
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        throw error;
    }
}

/**
 * Creates a middleware that requires role AND tenant access
 *
 * @example
 * const check = await requireRoleAndTenant(['admin_tenant', 'formateur'], tenantId);
 * if (check) return check;
 */
export async function requireRoleAndTenant(
    allowedRoles: UserRole[],
    tenantId: string
): Promise<{ response: NextResponse | null; user: User | null }> {
    try {
        const user = await requireUser();

        // Check tenant access first
        if (!checkTenantAccess(user, tenantId)) {
            return {
                response: NextResponse.json(
                    { error: 'forbidden', message: 'Resource not found' },
                    { status: 403 }
                ),
                user: null,
            };
        }

        // Check role
        if (!hasRole(user, allowedRoles)) {
            return {
                response: NextResponse.json(
                    { error: 'forbidden', message: 'Insufficient permissions' },
                    { status: 403 }
                ),
                user: null,
            };
        }

        return { response: null, user };
    } catch (error) {
        if (error instanceof AuthError) {
            return {
                response: NextResponse.json(
                    { error: error.code.toLowerCase(), message: error.message },
                    { status: error.statusCode }
                ),
                user: null,
            };
        }
        throw error;
    }
}

/**
 * Creates a middleware that requires a specific action permission
 */
export async function requireAction(
    action: Action,
    tenantId?: string
): Promise<{ response: NextResponse | null; user: User | null }> {
    try {
        const user = await requireUser();

        // Check tenant if provided
        if (tenantId && !checkTenantAccess(user, tenantId)) {
            return {
                response: NextResponse.json(
                    { error: 'forbidden', message: 'Resource not found' },
                    { status: 403 }
                ),
                user: null,
            };
        }

        // Check permission
        if (!canPerformAction(user, action)) {
            return {
                response: NextResponse.json(
                    { error: 'forbidden', message: 'Insufficient permissions' },
                    { status: 403 }
                ),
                user: null,
            };
        }

        return { response: null, user };
    } catch (error) {
        if (error instanceof AuthError) {
            return {
                response: NextResponse.json(
                    { error: error.code.toLowerCase(), message: error.message },
                    { status: error.statusCode }
                ),
                user: null,
            };
        }
        throw error;
    }
}

// ============================================
// Utility for API Routes
// ============================================

/**
 * Wrapper for protected API routes
 * Handles auth errors and returns standardized responses
 */
export async function withAuth<T>(
    handler: (user: User) => Promise<T>,
    options: {
        roles?: UserRole[];
        action?: Action;
        tenantId?: string;
    } = {}
): Promise<NextResponse<T | { error: string; message: string }>> {
    try {
        const user = await requireUser();

        // Check tenant access if provided
        if (options.tenantId) {
            requireTenantAccess(user, options.tenantId);
        }

        // Check role if provided
        if (options.roles && !hasRole(user, options.roles)) {
            throw new ForbiddenError();
        }

        // Check action permission if provided
        if (options.action && !canPerformAction(user, options.action)) {
            throw new ForbiddenError();
        }

        const result = await handler(user);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json(
                { error: error.code.toLowerCase(), message: error.message },
                { status: error.statusCode }
            );
        }
        throw error;
    }
}

// ============================================
// Request Helpers
// ============================================

/**
 * Extract tenant ID from request params
 */
export function getTenantIdFromParams(
    params: { tenantId?: string } | Promise<{ tenantId?: string }>
): Promise<string> {
    return Promise.resolve(params).then((p) => {
        if (!p.tenantId) {
            throw new Error('Tenant ID is required');
        }
        return p.tenantId;
    });
}
