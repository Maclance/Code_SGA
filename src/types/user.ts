/**
 * User & Invitation Types & Validation Schemas
 *
 * @module types/user
 * @description TypeScript types and Zod schemas for user management (US-002)
 */

import { z } from 'zod';

// ============================================
// Constants
// ============================================

/**
 * Available user roles for MVP
 * Aligned with auth_rbac.md section 3
 */
export const USER_ROLES = ['admin_tenant', 'formateur', 'joueur', 'observateur'] as const;

/**
 * User status values
 */
export const USER_STATUSES = ['pending', 'active', 'suspended'] as const;

/**
 * Invitation expiration duration in hours
 */
export const INVITATION_EXPIRATION_HOURS = 48;

// ============================================
// Zod Validation Schemas
// ============================================

/**
 * Schema for user role enum
 */
export const UserRoleSchema = z.enum(USER_ROLES);

/**
 * Schema for user status enum
 */
export const UserStatusSchema = z.enum(USER_STATUSES);

/**
 * Schema for creating an invitation
 */
export const CreateInvitationSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email must be 255 characters or less'),
    role: UserRoleSchema.default('joueur'),
});

/**
 * Schema for accepting an invitation
 */
export const AcceptInvitationSchema = z.object({
    token: z.string().uuid('Invalid invitation token'),
    display_name: z.string()
        .min(1, 'Display name is required')
        .max(255, 'Display name must be 255 characters or less'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be 100 characters or less')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        ),
});

/**
 * Schema for updating a user's role
 */
export const UpdateUserRoleSchema = z.object({
    role: UserRoleSchema,
});

/**
 * Schema for updating user profile
 */
export const UpdateUserProfileSchema = z.object({
    display_name: z.string()
        .min(1, 'Display name cannot be empty')
        .max(255, 'Display name must be 255 characters or less')
        .optional(),
    avatar_url: z.string().url('Invalid URL').optional().nullable(),
});

// ============================================
// TypeScript Types
// ============================================

/**
 * User role enum type
 * - admin_tenant: Full access within tenant (CRUD users, sessions, export)
 * - formateur: Create/manage sessions, view users
 * - joueur: Play games, view own sessions
 * - observateur: Read-only access (V1+)
 */
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * User status enum type
 * - pending: Invited but not yet activated
 * - active: Can use the application
 * - suspended: Blocked from access
 */
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * User entity as stored in database
 * Aligned with data_model.md § 3.2 Users
 */
export interface User {
    /** UUID v4 primary key (references auth.users) */
    id: string;
    /** Tenant this user belongs to */
    tenant_id: string;
    /** User's email address */
    email: string;
    /** Display name (shown in UI) */
    display_name: string | null;
    /** Avatar URL (optional) */
    avatar_url: string | null;
    /** User's role for RBAC */
    role: UserRole;
    /** Account status */
    status: UserStatus;
    /** Last login timestamp (UTC) */
    last_login_at: string | null;
    /** Creation timestamp (UTC) */
    created_at: string;
    /** Last update timestamp (UTC) */
    updated_at: string;
}

/**
 * Invitation entity as stored in database
 */
export interface Invitation {
    /** UUID v4 primary key */
    id: string;
    /** Tenant this invitation belongs to */
    tenant_id: string;
    /** Email of the invited user */
    email: string;
    /** Role to assign upon acceptance */
    role: UserRole;
    /** Secret token for activation link */
    token: string;
    /** User who created the invitation */
    invited_by: string;
    /** Expiration timestamp (48h after creation) */
    expires_at: string;
    /** Acceptance timestamp (null if pending) */
    accepted_at: string | null;
    /** Creation timestamp (UTC) */
    created_at: string;
}

/**
 * Input type for creating an invitation
 */
export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;

/**
 * Input type for accepting an invitation
 */
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

/**
 * Input type for updating user role
 */
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

/**
 * Input type for updating user profile
 */
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;

/**
 * Invitation with additional computed fields
 */
export interface InvitationWithStatus extends Invitation {
    /** Whether the invitation is still valid */
    is_valid: boolean;
    /** Whether the invitation has been used */
    is_accepted: boolean;
    /** Whether the invitation has expired */
    is_expired: boolean;
}

/**
 * User with tenant info for display
 */
export interface UserWithTenant extends User {
    tenant_name: string;
    tenant_slug: string;
}

/**
 * Response for invitation operations
 */
export interface InvitationResponse {
    invitation: Invitation;
    /** Activation URL to send via email */
    activation_url: string;
}

/**
 * Error codes for user/invitation operations
 */
export type UserErrorCode =
    | 'USER_NOT_FOUND'
    | 'USER_ALREADY_EXISTS'
    | 'INVITATION_NOT_FOUND'
    | 'INVITATION_EXPIRED'
    | 'INVITATION_ALREADY_USED'
    | 'INVITATION_EMAIL_EXISTS'
    | 'FORBIDDEN'
    | 'INVALID_TOKEN';

// ============================================
// Role Permissions Matrix
// ============================================

/**
 * Actions that can be performed in the system
 * Aligned with auth_rbac.md section 3
 */
export type Action =
    // Tenant actions
    | 'tenant:invite_user'
    | 'tenant:remove_user'
    | 'tenant:change_role'
    | 'tenant:view_audit'
    | 'tenant:view_kpis'
    | 'tenant:export_data'
    // Session actions
    | 'session:create'
    | 'session:configure'
    | 'session:delete'
    | 'session:start'
    | 'session:invite_participants'
    | 'session:view_results'
    | 'session:export_pdf'
    // Game actions
    | 'game:play'
    | 'game:view_own_cockpit'
    | 'game:view_market'
    | 'game:view_ranking';

/**
 * Role permissions matrix
 * true = allowed, false = denied
 */
export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<Action, boolean>>> = {
    admin_tenant: {
        'tenant:invite_user': true,
        'tenant:remove_user': true,
        'tenant:change_role': true,
        'tenant:view_audit': true,
        'tenant:view_kpis': true,
        'tenant:export_data': true,
        'session:create': true,
        'session:configure': true,
        'session:delete': true,
        'session:start': true,
        'session:invite_participants': true,
        'session:view_results': true,
        'session:export_pdf': true,
        'game:view_market': true,
        'game:view_ranking': true,
    },
    formateur: {
        'session:create': true,
        'session:configure': true, // own sessions only
        'session:delete': true, // own sessions only
        'session:start': true, // own sessions only
        'session:invite_participants': true, // own sessions only
        'session:view_results': true, // own sessions only
        'session:export_pdf': true, // own sessions only
        'game:view_market': true,
        'game:view_ranking': true,
    },
    joueur: {
        'game:play': true,
        'game:view_own_cockpit': true,
        'game:view_market': true,
        'game:view_ranking': true,
        'session:view_results': true, // own results only
        'session:export_pdf': true, // own results only
    },
    observateur: {
        'game:view_own_cockpit': true, // read-only
        'game:view_market': true,
        'game:view_ranking': true,
    },
};

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: UserRole, action: Action): boolean {
    return ROLE_PERMISSIONS[role]?.[action] === true;
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(action: Action): UserRole[] {
    return USER_ROLES.filter((role) => hasPermission(role, action));
}
