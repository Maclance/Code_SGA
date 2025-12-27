/**
 * RBAC Middleware Unit Tests
 *
 * @module tests/auth/rbac.test
 * @description Unit tests for RBAC middleware (US-002)
 * AC3: Given rôle Joueur, When accès route admin, Then 403 Forbidden
 * AC4: Given rôle Formateur, When création session, Then autorisé
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    hasPermission,
    getRolesWithPermission,
    ROLE_PERMISSIONS,
    type UserRole,
    type Action,
} from '@/types/user';

describe('RBAC Permissions Matrix', () => {
    describe('hasPermission', () => {
        it('should return true for allowed actions', () => {
            // Admin tenant can invite users
            expect(hasPermission('admin_tenant', 'tenant:invite_user')).toBe(true);

            // Formateur can create sessions (AC4)
            expect(hasPermission('formateur', 'session:create')).toBe(true);

            // Joueur can play
            expect(hasPermission('joueur', 'game:play')).toBe(true);
        });

        it('should return false for denied actions (AC3)', () => {
            // Joueur cannot invite users (admin action)
            expect(hasPermission('joueur', 'tenant:invite_user')).toBe(false);

            // Joueur cannot change roles
            expect(hasPermission('joueur', 'tenant:change_role')).toBe(false);

            // Observateur cannot play
            expect(hasPermission('observateur', 'game:play')).toBe(false);
        });
    });

    describe('getRolesWithPermission', () => {
        it('should return only admin_tenant for user management', () => {
            const roles = getRolesWithPermission('tenant:invite_user');
            expect(roles).toContain('admin_tenant');
            expect(roles).not.toContain('formateur');
            expect(roles).not.toContain('joueur');
            expect(roles).not.toContain('observateur');
        });

        it('should return admin_tenant and formateur for session creation', () => {
            const roles = getRolesWithPermission('session:create');
            expect(roles).toContain('admin_tenant');
            expect(roles).toContain('formateur');
            expect(roles).not.toContain('joueur');
            expect(roles).not.toContain('observateur');
        });

        it('should return joueur for playing games', () => {
            const roles = getRolesWithPermission('game:play');
            expect(roles).toContain('joueur');
        });
    });

    describe('Deny-by-Default Principle', () => {
        it('should deny undefined permissions', () => {
            // Any action not explicitly defined should be denied
            const roles: UserRole[] = ['admin_tenant', 'formateur', 'joueur', 'observateur'];

            roles.forEach(role => {
                // Check that undefined permissions return undefined (falsy)
                const permissions = ROLE_PERMISSIONS[role];
                const undefinedAction = 'nonexistent:action' as Action;
                expect(permissions[undefinedAction]).toBeUndefined();
            });
        });

        it('should not have super_admin role exposed', () => {
            const exposedRoles = Object.keys(ROLE_PERMISSIONS);
            expect(exposedRoles).not.toContain('super_admin');
        });
    });

    describe('AC3: Joueur cannot access admin routes', () => {
        const adminActions: Action[] = [
            'tenant:invite_user',
            'tenant:remove_user',
            'tenant:change_role',
            'tenant:view_audit',
            'tenant:export_data',
        ];

        adminActions.forEach(action => {
            it(`should deny joueur access to ${action}`, () => {
                expect(hasPermission('joueur', action)).toBe(false);
            });
        });
    });

    describe('AC4: Formateur can create sessions', () => {
        const formateurActions: Action[] = [
            'session:create',
            'session:configure',
            'session:start',
            'session:invite_participants',
        ];

        formateurActions.forEach(action => {
            it(`should allow formateur to ${action}`, () => {
                expect(hasPermission('formateur', action)).toBe(true);
            });
        });
    });

    describe('Observateur Read-Only', () => {
        it('should allow observateur to view but not modify', () => {
            // Can view
            expect(hasPermission('observateur', 'game:view_market')).toBe(true);
            expect(hasPermission('observateur', 'game:view_ranking')).toBe(true);

            // Cannot modify
            expect(hasPermission('observateur', 'game:play')).toBe(false);
            expect(hasPermission('observateur', 'session:create')).toBe(false);
        });
    });
});

describe('Role Hierarchy', () => {
    it('admin_tenant should have more permissions than formateur', () => {
        const adminPerms = Object.keys(ROLE_PERMISSIONS['admin_tenant']).length;
        const formateurPerms = Object.keys(ROLE_PERMISSIONS['formateur']).length;

        expect(adminPerms).toBeGreaterThan(formateurPerms);
    });

    it('formateur should have more permissions than joueur', () => {
        const formateurPerms = Object.keys(ROLE_PERMISSIONS['formateur']).length;
        const joueurPerms = Object.keys(ROLE_PERMISSIONS['joueur']).length;

        expect(formateurPerms).toBeGreaterThan(joueurPerms);
    });

    it('joueur should have more permissions than observateur', () => {
        const joueurPerms = Object.keys(ROLE_PERMISSIONS['joueur']).length;
        const observateurPerms = Object.keys(ROLE_PERMISSIONS['observateur']).length;

        expect(joueurPerms).toBeGreaterThan(observateurPerms);
    });
});
