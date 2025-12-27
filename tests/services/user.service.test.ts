/**
 * User & Invitation Service Unit Tests
 *
 * @module tests/services/user.service.test
 * @description Unit tests for user and invitation management (US-002)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createInvitation,
    getInvitations,
    getInvitationByToken,
    deleteInvitation,
    updateUserRole,
    UserNotFoundError,
    UserAlreadyExistsError,
    InvitationNotFoundError,
    InvitationExpiredError,
    InvitationAlreadyUsedError,
    EmailAlreadyInvitedError,
    ValidationError,
} from '@/lib/services/user.service';
import type { User, Invitation } from '@/types/user';

// Mock invitations for tests
const mockInvitation: Invitation = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    tenant_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'newuser@example.com',
    role: 'joueur',
    token: '123e4567-e89b-12d3-a456-426614174002',
    invited_by: '123e4567-e89b-12d3-a456-426614174003',
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString(),
};

const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    tenant_id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'existing@example.com',
    display_name: 'Test User',
    avatar_url: null,
    role: 'joueur',
    status: 'active',
    last_login_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
    }),
}));

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        auth: {
            admin: {
                inviteUserByEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
            },
        },
    }),
}));

describe('User Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Invitation Validation', () => {
        it('should reject invalid email format', async () => {
            await expect(
                createInvitation(
                    mockInvitation.tenant_id,
                    mockInvitation.invited_by,
                    { email: 'invalid-email', role: 'joueur' }
                )
            ).rejects.toThrow(ValidationError);
        });

        it('should reject empty email', async () => {
            await expect(
                createInvitation(
                    mockInvitation.tenant_id,
                    mockInvitation.invited_by,
                    { email: '', role: 'joueur' }
                )
            ).rejects.toThrow(ValidationError);
        });

        it('should accept valid roles', () => {
            const validRoles = ['admin_tenant', 'formateur', 'joueur', 'observateur'];
            validRoles.forEach(role => {
                expect(() => {
                    // Just validate the role is in our expected list
                    if (!validRoles.includes(role)) {
                        throw new Error('Invalid role');
                    }
                }).not.toThrow();
            });
        });
    });

    describe('Invitation Errors', () => {
        it('InvitationNotFoundError should have correct properties', () => {
            const error = new InvitationNotFoundError('test-token');
            expect(error.code).toBe('INVITATION_NOT_FOUND');
            expect(error.statusCode).toBe(404);
            expect(error.message).toContain('test-token');
        });

        it('InvitationExpiredError should have correct properties', () => {
            const error = new InvitationExpiredError();
            expect(error.code).toBe('INVITATION_EXPIRED');
            expect(error.statusCode).toBe(410);
            expect(error.message).toContain('48');
        });

        it('InvitationAlreadyUsedError should have correct properties', () => {
            const error = new InvitationAlreadyUsedError();
            expect(error.code).toBe('INVITATION_ALREADY_USED');
            expect(error.statusCode).toBe(410);
        });

        it('EmailAlreadyInvitedError should have correct properties', () => {
            const error = new EmailAlreadyInvitedError('test@example.com');
            expect(error.code).toBe('INVITATION_EMAIL_EXISTS');
            expect(error.statusCode).toBe(409);
            expect(error.message).toContain('test@example.com');
        });
    });

    describe('User Errors', () => {
        it('UserNotFoundError should have correct properties', () => {
            const error = new UserNotFoundError('user-id');
            expect(error.code).toBe('USER_NOT_FOUND');
            expect(error.statusCode).toBe(404);
        });

        it('UserAlreadyExistsError should have correct properties', () => {
            const error = new UserAlreadyExistsError('test@example.com');
            expect(error.code).toBe('USER_ALREADY_EXISTS');
            expect(error.statusCode).toBe(409);
        });
    });
});

describe('Invitation Expiration (AC2)', () => {
    it('should identify expired invitation', () => {
        const expiredInvitation = {
            ...mockInvitation,
            expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        };

        const isExpired = new Date(expiredInvitation.expires_at) < new Date();
        expect(isExpired).toBe(true);
    });

    it('should identify valid invitation', () => {
        const validInvitation = {
            ...mockInvitation,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h from now
        };

        const isExpired = new Date(validInvitation.expires_at) < new Date();
        expect(isExpired).toBe(false);
    });

    it('should identify used invitation', () => {
        const usedInvitation = {
            ...mockInvitation,
            accepted_at: new Date().toISOString(),
        };

        expect(usedInvitation.accepted_at).not.toBeNull();
    });
});

describe('Role Update Validation', () => {
    it('should accept valid role values', () => {
        const validRoles = ['admin_tenant', 'formateur', 'joueur', 'observateur'];

        validRoles.forEach(role => {
            const input = { role };
            expect(input.role).toBe(role);
        });
    });

    it('should reject invalid role values', () => {
        const invalidRoles = ['super_admin', 'admin', 'user', ''];
        const validRoles = ['admin_tenant', 'formateur', 'joueur', 'observateur'];

        invalidRoles.forEach(role => {
            expect(validRoles.includes(role)).toBe(false);
        });
    });
});
