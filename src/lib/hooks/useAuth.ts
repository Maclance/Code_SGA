'use client';

/**
 * useAuth Hook
 *
 * @module lib/hooks/useAuth
 * @description Authentication state management hook (US-003)
 */

import { useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
}

interface UseAuthReturn extends AuthState {
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

/**
 * Hook for managing authentication state
 * Subscribes to Supabase auth state changes and provides auth methods
 *
 * @returns Auth state and methods
 *
 * @example
 * const { user, loading, signIn, signOut } = useAuth();
 */
export function useAuth(): UseAuthReturn {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    });

    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const initSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
            }

            setState({
                user: session?.user ?? null,
                session: session,
                loading: false,
            });
        };

        initSession();

        // Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setState({
                    user: session?.user ?? null,
                    session: session,
                    loading: false,
                });
            }
        );

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // supabase is stable, no need to add to deps

    /**
     * Sign in with email and password
     */
    const signIn = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error: error ? new Error(error.message) : null };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // supabase is stable

    /**
     * Sign out the current user
     */
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // supabase is stable

    /**
     * Request password reset email
     */
    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback`,
        });

        return { error: error ? new Error(error.message) : null };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // supabase is stable

    return {
        ...state,
        signIn,
        signOut,
        resetPassword,
    };
}
