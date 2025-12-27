/**
 * Tenant Service Unit Tests
 * 
 * @module tests/services/tenant.service.test
 * @description Unit tests for tenant management service (US-001)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createTenant,
    getTenants,
    getTenantById,
    deleteTenant,
    updateTenant,
    TenantNotFoundError,
    TenantSlugConflictError,
    TenantValidationError,
} from '@/lib/services/tenant.service';
import type { Tenant } from '@/types/tenant';

// Mock tenant for tests
const mockTenant: Tenant = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Company',
    slug: 'test-company',
    settings: {},
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deleted_at: null,
};

// Create mock Supabase client
function createMockSupabase(overrides: Record<string, unknown> = {}) {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        ...overrides,
    };

    return {
        from: vi.fn().mockReturnValue(mockChain),
        _mockChain: mockChain,
    };
}

describe('TenantService', () => {
    describe('createTenant', () => {
        it('should create a tenant with valid input', async () => {
            const mockSupabase = createMockSupabase();

            // First call: check for duplicate slug
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            // Second call: insert and return
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: mockTenant, error: null });

            const result = await createTenant(mockSupabase as never, {
                name: 'Test Company',
                slug: 'test-company',
            });

            expect(result).toEqual(mockTenant);
            expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
        });

        it('should throw TenantSlugConflictError on duplicate slug', async () => {
            const mockSupabase = createMockSupabase();

            // Return existing tenant on slug check
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null });

            await expect(
                createTenant(mockSupabase as never, {
                    name: 'Test Company',
                    slug: 'existing-slug',
                })
            ).rejects.toThrow(TenantSlugConflictError);
        });

        it('should throw TenantValidationError for invalid slug format', async () => {
            const mockSupabase = createMockSupabase();

            await expect(
                createTenant(mockSupabase as never, {
                    name: 'Test Company',
                    slug: 'Invalid Slug With Spaces',
                })
            ).rejects.toThrow(TenantValidationError);
        });

        it('should throw TenantValidationError for empty name', async () => {
            const mockSupabase = createMockSupabase();

            await expect(
                createTenant(mockSupabase as never, {
                    name: '',
                    slug: 'valid-slug',
                })
            ).rejects.toThrow(TenantValidationError);
        });
    });

    describe('getTenants', () => {
        it('should return list of active tenants', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.order
                .mockResolvedValueOnce({ data: [mockTenant], error: null });

            const result = await getTenants(mockSupabase as never);

            expect(result).toEqual([mockTenant]);
            expect(mockSupabase._mockChain.is).toHaveBeenCalledWith('deleted_at', null);
        });

        it('should return empty array when no tenants', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.order
                .mockResolvedValueOnce({ data: [], error: null });

            const result = await getTenants(mockSupabase as never);

            expect(result).toEqual([]);
        });
    });

    describe('getTenantById', () => {
        it('should return tenant by ID', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: mockTenant, error: null });

            const result = await getTenantById(mockSupabase as never, mockTenant.id);

            expect(result).toEqual(mockTenant);
            expect(mockSupabase._mockChain.eq).toHaveBeenCalledWith('id', mockTenant.id);
        });

        it('should throw TenantNotFoundError when tenant does not exist', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            await expect(
                getTenantById(mockSupabase as never, 'non-existent-id')
            ).rejects.toThrow(TenantNotFoundError);
        });
    });

    describe('updateTenant', () => {
        it('should update tenant with valid input', async () => {
            const mockSupabase = createMockSupabase();
            const updatedTenant = { ...mockTenant, name: 'Updated Name' };

            // First call: getTenantById
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: mockTenant, error: null });

            // Second call: update
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: updatedTenant, error: null });

            const result = await updateTenant(mockSupabase as never, mockTenant.id, {
                name: 'Updated Name',
            });

            expect(result.name).toBe('Updated Name');
        });

        it('should throw TenantNotFoundError when updating non-existent tenant', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            await expect(
                updateTenant(mockSupabase as never, 'non-existent-id', { name: 'New Name' })
            ).rejects.toThrow(TenantNotFoundError);
        });
    });

    describe('deleteTenant', () => {
        it('should soft delete tenant (set deleted_at)', async () => {
            const mockSupabase = createMockSupabase();
            const deletedTenant = {
                ...mockTenant,
                status: 'deleted',
                deleted_at: '2025-01-01T12:00:00Z',
            };

            // First call: getTenantById
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: mockTenant, error: null });

            // Second call: update for soft delete
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: deletedTenant, error: null });

            const result = await deleteTenant(mockSupabase as never, mockTenant.id);

            expect(result.tenant.status).toBe('deleted');
            expect(result.tenant.deleted_at).not.toBeNull();
        });

        it('should throw TenantNotFoundError when deleting non-existent tenant', async () => {
            const mockSupabase = createMockSupabase();
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

            await expect(
                deleteTenant(mockSupabase as never, 'non-existent-id')
            ).rejects.toThrow(TenantNotFoundError);
        });
    });
});

describe('Tenant Validation', () => {
    it('should accept valid slug formats', async () => {
        const validSlugs = ['company', 'my-company', 'company-123', 'a1b2c3'];
        const mockSupabase = createMockSupabase();

        for (const slug of validSlugs) {
            mockSupabase._mockChain.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
                .mockResolvedValueOnce({ data: { ...mockTenant, slug }, error: null });

            const result = await createTenant(mockSupabase as never, {
                name: 'Test',
                slug,
            });

            expect(result.slug).toBe(slug);
        }
    });

    it('should reject invalid slug formats', async () => {
        const invalidSlugs = ['UPPERCASE', 'with spaces', 'special@chars', '-start-dash', 'end-dash-'];
        const mockSupabase = createMockSupabase();

        for (const slug of invalidSlugs) {
            await expect(
                createTenant(mockSupabase as never, {
                    name: 'Test',
                    slug,
                })
            ).rejects.toThrow(TenantValidationError);
        }
    });
});
