/**
 * Audit Service Unit Tests
 *
 * @module tests/services/audit.service.test
 * @description Unit tests for audit logging service (US-004)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before importing service
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({
        from: mockFrom,
    })),
}));

// Import after mock
import {
    extractRequestContext,
    logAuditEvent,
    getAuditLogs,
    AuditError,
} from '@/lib/services/audit.service';
import { AuditAction } from '@/types/audit';

// Set env vars for tests
beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

    // Reset mocks
    vi.clearAllMocks();

    // Default mock chain
    mockFrom.mockReturnValue({
        insert: mockInsert.mockReturnValue({
            error: null,
        }),
        select: mockSelect.mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            range: vi.fn().mockResolvedValue({
                data: [],
                error: null,
                count: 0,
            }),
        }),
    });
});

describe('AuditService', () => {
    describe('extractRequestContext', () => {
        it('should return empty object when no request provided', () => {
            const context = extractRequestContext(undefined);
            expect(context).toEqual({});
        });

        it('should extract IP from x-forwarded-for header', () => {
            const mockRequest = {
                headers: {
                    get: vi.fn((header: string) => {
                        if (header === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
                        if (header === 'user-agent') return 'Mozilla/5.0 Test';
                        return null;
                    }),
                },
            } as unknown as Request;

            const context = extractRequestContext(mockRequest as never);
            expect(context.ip).toBe('192.168.1.1');
            expect(context.userAgent).toBe('Mozilla/5.0 Test');
        });

        it('should extract IP from x-real-ip header as fallback', () => {
            const mockRequest = {
                headers: {
                    get: vi.fn((header: string) => {
                        if (header === 'x-real-ip') return '10.0.0.1';
                        return null;
                    }),
                },
            } as unknown as Request;

            const context = extractRequestContext(mockRequest as never);
            expect(context.ip).toBe('10.0.0.1');
        });
    });

    describe('logAuditEvent', () => {
        it('should insert audit log with required fields', async () => {
            mockInsert.mockResolvedValueOnce({ error: null });

            await logAuditEvent({
                tenantId: '123e4567-e89b-12d3-a456-426614174000',
                userId: '223e4567-e89b-12d3-a456-426614174000',
                action: AuditAction.SESSION_CREATE,
                resourceType: 'session',
                resourceId: '323e4567-e89b-12d3-a456-426614174000',
            });

            expect(mockFrom).toHaveBeenCalledWith('audit_logs');
            expect(mockInsert).toHaveBeenCalled();
        });

        it('should not throw on insert error (fire-and-forget)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            mockInsert.mockResolvedValueOnce({ error: { message: 'Test error' } });

            // Should not throw
            await expect(
                logAuditEvent({
                    tenantId: 'test-tenant',
                    action: AuditAction.SESSION_CREATE,
                })
            ).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should sanitize PII fields in payload', async () => {
            let insertedData: { payload?: Record<string, unknown> } = {};
            mockInsert.mockImplementation((data: { payload?: Record<string, unknown> }) => {
                insertedData = data;
                return Promise.resolve({ error: null });
            });

            await logAuditEvent({
                tenantId: 'test-tenant',
                action: AuditAction.USER_INVITE,
                payload: {
                    email: 'test@example.com',
                    role: 'formateur',
                },
            });

            // Email should be redacted
            expect(insertedData.payload?.email).toBe('[REDACTED]');
            // Role should remain
            expect(insertedData.payload?.role).toBe('formateur');
        });
    });

    describe('getAuditLogs', () => {
        it('should return paginated logs with default options', async () => {
            const mockLogs = [
                { id: 'log-1', action: 'session.create', created_at: '2025-01-01' },
                { id: 'log-2', action: 'user.invite', created_at: '2025-01-02' },
            ];

            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: mockLogs,
                        error: null,
                        count: 2,
                    }),
                }),
            });

            const result = await getAuditLogs('test-tenant');

            expect(result.logs).toHaveLength(2);
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(50);
            expect(result.pagination.total).toBe(2);
        });

        it('should respect page and limit options', async () => {
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                        count: 100,
                    }),
                }),
            });

            const result = await getAuditLogs('test-tenant', { page: 2, limit: 25 });

            expect(result.pagination.page).toBe(2);
            expect(result.pagination.limit).toBe(25);
            expect(result.pagination.totalPages).toBe(4);
        });

        it('should enforce maximum limit of 50', async () => {
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                        count: 0,
                    }),
                }),
            });

            const result = await getAuditLogs('test-tenant', { limit: 100 });

            expect(result.pagination.limit).toBe(50);
        });

        it('should throw AuditError on database error', async () => {
            mockFrom.mockReturnValueOnce({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnThis(),
                    order: vi.fn().mockReturnThis(),
                    range: vi.fn().mockResolvedValue({
                        data: null,
                        error: { message: 'Database error' },
                        count: 0,
                    }),
                }),
            });

            await expect(getAuditLogs('test-tenant')).rejects.toThrow(AuditError);
        });
    });
});

describe('AuditAction enum', () => {
    it('should have correct values for MVP actions', () => {
        expect(AuditAction.SESSION_CREATE).toBe('session.create');
        expect(AuditAction.SESSION_UPDATE).toBe('session.update');
        expect(AuditAction.SESSION_DELETE).toBe('session.delete');
        expect(AuditAction.USER_INVITE).toBe('user.invite');
        expect(AuditAction.USER_ROLE_CHANGE).toBe('user.role_change');
        expect(AuditAction.EXPORT_PDF).toBe('export.pdf');
        expect(AuditAction.EXPORT_DATA).toBe('export.data');
    });
});
