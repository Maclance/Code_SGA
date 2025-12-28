/**
 * User & Invitation Service
 *
 * @module lib/services/user.service
 * @description Business logic for user and invitation management (US-002)
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
    type User,
    type Invitation,
    type CreateInvitationInput,
    type UpdateUserRoleInput,
    type InvitationResponse,
    CreateInvitationSchema,
    UpdateUserRoleSchema,
    INVITATION_EXPIRATION_HOURS,
} from '@/types/user';
import { getServerAppUrl } from '@/lib/utils/app-url';
import { logAuditEvent, AuditAction } from '@/lib/services/audit.service';

// ============================================
// Error Classes
// ============================================

export class UserError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 500
    ) {
        super(message);
        this.name = 'UserError';
    }
}

export class UserNotFoundError extends UserError {
    constructor(identifier: string) {
        super(`User not found: ${identifier}`, 'USER_NOT_FOUND', 404);
    }
}

export class UserAlreadyExistsError extends UserError {
    constructor(email: string) {
        super(`User with email "${email}" already exists`, 'USER_ALREADY_EXISTS', 409);
    }
}

export class InvitationNotFoundError extends UserError {
    constructor(identifier: string) {
        super(`Invitation not found: ${identifier}`, 'INVITATION_NOT_FOUND', 404);
    }
}

export class InvitationExpiredError extends UserError {
    constructor() {
        super(
            `Invitation has expired (valid for ${INVITATION_EXPIRATION_HOURS}h)`,
            'INVITATION_EXPIRED',
            410
        );
    }
}

export class InvitationAlreadyUsedError extends UserError {
    constructor() {
        super('Invitation has already been used', 'INVITATION_ALREADY_USED', 410);
    }
}

export class EmailAlreadyInvitedError extends UserError {
    constructor(email: string) {
        super(`An invitation for "${email}" already exists`, 'INVITATION_EMAIL_EXISTS', 409);
    }
}

export class ValidationError extends UserError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

// ============================================
// Admin Client (for auth operations)
// ============================================

/**
 * Create Supabase admin client with service_role key
 * Required for auth.admin operations like inviteUserByEmail
 */
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase service role configuration');
    }

    return createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// ============================================
// Invitation Functions
// ============================================

/**
 * Create a new invitation and send email via Supabase Auth
 *
 * @param tenantId - Tenant to invite user to
 * @param invitedBy - User ID of the admin creating the invitation
 * @param input - Email and role for the invitation
 * @returns Created invitation with activation URL
 */
export async function createInvitation(
    tenantId: string,
    invitedBy: string,
    input: CreateInvitationInput
): Promise<InvitationResponse> {
    // Validate input
    const validation = CreateInvitationSchema.safeParse(input);
    if (!validation.success) {
        throw new ValidationError(
            validation.error.issues.map((e) => e.message).join(', ')
        );
    }

    const { email, role } = validation.data;
    const supabase = await createServerClient();
    const adminClient = getAdminClient();

    // Check if user already exists in this tenant
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .single();

    if (existingUser) {
        throw new UserAlreadyExistsError(email);
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .is('accepted_at', null)
        .single();

    if (existingInvitation) {
        throw new EmailAlreadyInvitedError(email);
    }

    // Create invitation record
    const { data: invitation, error: invError } = await supabase
        .from('invitations')
        .insert({
            tenant_id: tenantId,
            email,
            role,
            invited_by: invitedBy,
        })
        .select()
        .single();

    if (invError) {
        throw new UserError(`Failed to create invitation: ${invError.message}`, 'DB_ERROR');
    }

    // Send invitation email via Supabase Auth
    const appUrl = await getServerAppUrl();
    const redirectUrl = `${appUrl}/auth/accept-invitation/${invitation.token}`;

    const { error: authError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectUrl,
        data: {
            tenant_id: tenantId,
            invited_role: role,
            invitation_token: invitation.token,
        },
    });

    if (authError) {
        // Rollback invitation if email fails
        await supabase.from('invitations').delete().eq('id', invitation.id);
        throw new UserError(`Failed to send invitation email: ${authError.message}`, 'EMAIL_ERROR');
    }

    // Log audit event (async, non-blocking)
    logAuditEvent({
        tenantId,
        userId: invitedBy,
        action: AuditAction.USER_INVITE,
        resourceType: 'invitation',
        resourceId: invitation.id,
        payload: { role, invitedEmail: '[REDACTED]' },
    });

    return {
        invitation: invitation as Invitation,
        activation_url: redirectUrl,
    };
}

/**
 * Get all pending invitations for a tenant
 *
 * @param tenantId - Tenant ID to filter by
 * @returns List of pending invitations (not expired, not accepted)
 */
export async function getInvitations(tenantId: string): Promise<Invitation[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        throw new UserError(`Failed to fetch invitations: ${error.message}`, 'DB_ERROR');
    }

    return (data ?? []) as Invitation[];
}

/**
 * Get a specific invitation by ID
 */
export async function getInvitationById(
    invitationId: string,
    tenantId: string
): Promise<Invitation> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('tenant_id', tenantId)
        .single();

    if (error || !data) {
        throw new InvitationNotFoundError(invitationId);
    }

    return data as Invitation;
}

/**
 * Get an invitation by token (for activation page)
 * Uses admin client to bypass RLS
 */
export async function getInvitationByToken(token: string): Promise<Invitation> {
    const adminClient = getAdminClient();

    const { data, error } = await adminClient
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

    if (error || !data) {
        throw new InvitationNotFoundError(token);
    }

    const invitation = data as Invitation;

    // Check if already used
    if (invitation.accepted_at) {
        throw new InvitationAlreadyUsedError();
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
        throw new InvitationExpiredError();
    }

    return invitation;
}

/**
 * Delete/cancel an invitation
 */
export async function deleteInvitation(
    invitationId: string,
    tenantId: string
): Promise<void> {
    const supabase = await createServerClient();

    // Check invitation exists
    await getInvitationById(invitationId, tenantId);

    const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('tenant_id', tenantId);

    if (error) {
        throw new UserError(`Failed to delete invitation: ${error.message}`, 'DB_ERROR');
    }
}

/**
 * Accept an invitation and create user
 * Called after user completes password setup
 * 
 * @param token - Invitation token
 * @param authUserId - User ID from Supabase Auth
 * @param displayName - User's display name
 * @param password - User's new password
 */
export async function acceptInvitation(
    token: string,
    authUserId: string,
    displayName?: string,
    password?: string
): Promise<User> {
    const adminClient = getAdminClient();

    // Get and validate invitation
    const invitation = await getInvitationByToken(token);

    // Update auth user with password and metadata if provided
    if (password || displayName) {
        const updateData: { password?: string; user_metadata?: { display_name: string } } = {};

        if (password) {
            updateData.password = password;
        }

        if (displayName) {
            updateData.user_metadata = { display_name: displayName };
        }

        const { error: updateError } = await adminClient.auth.admin.updateUserById(
            authUserId,
            updateData
        );

        if (updateError) {
            console.error('Failed to update auth user:', updateError);
            // Don't throw - continue with user creation even if password update fails
        }
    }

    // Create user in our users table
    const { data: user, error: userError } = await adminClient
        .from('users')
        .insert({
            id: authUserId,
            tenant_id: invitation.tenant_id,
            email: invitation.email,
            role: invitation.role,
            status: 'active',
            display_name: displayName || null,
        })
        .select()
        .single();

    if (userError) {
        throw new UserError(`Failed to create user: ${userError.message}`, 'DB_ERROR');
    }

    // Mark invitation as accepted
    await adminClient
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

    return user as User;
}

/**
 * Resend an existing invitation
 */
export async function resendInvitation(
    invitationId: string,
    tenantId: string
): Promise<InvitationResponse> {
    const supabase = await createServerClient();
    const adminClient = getAdminClient();

    // Get existing invitation
    const invitation = await getInvitationById(invitationId, tenantId);

    // Update expiration
    const newExpiresAt = new Date(
        Date.now() + INVITATION_EXPIRATION_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: updatedInvitation, error: updateError } = await supabase
        .from('invitations')
        .update({ expires_at: newExpiresAt })
        .eq('id', invitationId)
        .select()
        .single();

    if (updateError) {
        throw new UserError(`Failed to update invitation: ${updateError.message}`, 'DB_ERROR');
    }

    // Resend email
    const appUrl = await getServerAppUrl();
    const redirectUrl = `${appUrl}/auth/accept-invitation/${invitation.token}`;

    const { error: authError } = await adminClient.auth.admin.inviteUserByEmail(
        invitation.email,
        {
            redirectTo: redirectUrl,
            data: {
                tenant_id: invitation.tenant_id,
                invited_role: invitation.role,
                invitation_token: invitation.token,
            },
        }
    );

    if (authError) {
        throw new UserError(`Failed to resend invitation email: ${authError.message}`, 'EMAIL_ERROR');
    }

    return {
        invitation: updatedInvitation as Invitation,
        activation_url: redirectUrl,
    };
}

// ============================================
// User Functions
// ============================================

/**
 * Get all users for a tenant
 */
export async function getUsersByTenant(tenantId: string): Promise<User[]> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new UserError(`Failed to fetch users: ${error.message}`, 'DB_ERROR');
    }

    return (data ?? []) as User[];
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        throw new UserNotFoundError(userId);
    }

    return data as User;
}

/**
 * Update a user's role
 * Effect is immediate (AC: role change = effet immédiat)
 *
 * @param userId - Target user ID to update
 * @param tenantId - Tenant ID for verification
 * @param actorUserId - User ID of admin performing the action (for audit)
 * @param input - New role data
 */
export async function updateUserRole(
    userId: string,
    tenantId: string,
    actorUserId: string,
    input: UpdateUserRoleInput
): Promise<User> {
    // Validate input
    const validation = UpdateUserRoleSchema.safeParse(input);
    if (!validation.success) {
        throw new ValidationError(
            validation.error.issues.map((e) => e.message).join(', ')
        );
    }

    const supabase = await createServerClient();

    // Check user exists and belongs to tenant
    const existingUser = await getUserById(userId);
    if (existingUser.tenant_id !== tenantId) {
        throw new UserNotFoundError(userId);
    }

    // Update role
    const { data, error } = await supabase
        .from('users')
        .update({ role: validation.data.role })
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

    if (error) {
        throw new UserError(`Failed to update user role: ${error.message}`, 'DB_ERROR');
    }

    // Log audit event (async, non-blocking)
    logAuditEvent({
        tenantId,
        userId: actorUserId, // Admin performing the action
        action: AuditAction.USER_ROLE_CHANGE,
        resourceType: 'user',
        resourceId: userId, // Target user whose role was changed
        payload: { oldRole: existingUser.role, newRole: validation.data.role },
    });

    return data as User;
}

/**
 * Suspend a user
 */
export async function suspendUser(userId: string, tenantId: string): Promise<User> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

    if (error || !data) {
        throw new UserNotFoundError(userId);
    }

    return data as User;
}

/**
 * Reactivate a suspended user
 */
export async function reactivateUser(userId: string, tenantId: string): Promise<User> {
    const supabase = await createServerClient();

    const { data, error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

    if (error || !data) {
        throw new UserNotFoundError(userId);
    }

    return data as User;
}

/**
 * Delete a user (removes from users table)
 * The auth.users record is handled separately via Supabase Auth
 */
export async function deleteUser(userId: string, tenantId: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('tenant_id', tenantId);

    if (error) {
        throw new UserError(`Failed to delete user: ${error.message}`, 'DB_ERROR');
    }
}
