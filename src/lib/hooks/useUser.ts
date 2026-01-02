'use client';

/**
 * useUser Hook
 *
 * @module lib/hooks/useUser
 * @description Current user data hook with role and tenant info (US-003)
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/user';

interface UserData {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    tenantId: string;
    status: 'pending' | 'active' | 'suspended';
}

interface UseUserReturn {
    user: UserData | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching current user data from the users table
 * Includes role and tenant information
 *
 * @returns User data, loading state, and refetch function
 *
 * @example
 * const { user, loading } = useUser();
 * if (user?.role === 'admin_tenant') { ... }
 */
export function useUser(): UseUserReturn {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const supabase = createClient();

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Get authenticated user first
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                throw authError;
            }

            if (!authUser) {
                setUser(null);
                return;
            }

            // Fetch user data from users table
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('id, email, display_name, avatar_url, role, tenant_id, status')
                .eq('id', authUser.id)
                .single();

            if (fetchError) {
                // User might not exist in users table yet (invited but not activated)
                if (fetchError.code === 'PGRST116') {
                    setUser(null);
                    return;
                }
                throw fetchError;
            }

            setUser({
                id: data.id,
                email: data.email,
                displayName: data.display_name,
                avatarUrl: data.avatar_url,
                role: data.role as UserRole,
                tenantId: data.tenant_id,
                status: data.status,
            });
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch user'));
            setUser(null);
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // supabase is stable

    useEffect(() => {
        fetchUser();

        // Re-fetch when auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchUser();
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchUser]); // supabase.auth is stable

    return {
        user,
        loading,
        error,
        refetch: fetchUser,
    };
}
