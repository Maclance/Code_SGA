'use client';

/**
 * Auth Callback Page
 *
 * @module app/auth/callback
 * @description Handles Supabase auth callbacks (email confirmations, magic links, etc.)
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            // Check for error in URL params
            const errorParam = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (errorParam) {
                setStatus('error');
                setError(errorDescription || errorParam);
                return;
            }

            // Check for hash fragment (Supabase puts tokens there)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');

            if (accessToken && refreshToken) {
                // Set the session from the tokens
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (sessionError) {
                    setStatus('error');
                    setError(sessionError.message);
                    return;
                }

                setStatus('success');

                // Redirect based on type
                if (type === 'invite' || type === 'signup') {
                    // For invitations, redirect to dashboard
                    router.push('/dashboard');
                } else if (type === 'recovery') {
                    // For password recovery, redirect to reset page
                    router.push('/auth/reset-password');
                } else {
                    // Default redirect to dashboard
                    router.push('/dashboard');
                }
                return;
            }

            // Check for code exchange (OAuth flow)
            const code = searchParams.get('code');
            if (code) {
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

                if (exchangeError) {
                    setStatus('error');
                    setError(exchangeError.message);
                    return;
                }

                setStatus('success');
                router.push('/dashboard');
                return;
            }

            // No valid auth params found
            setStatus('error');
            setError('Invalid callback parameters');
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-bg-primary)',
            padding: '2rem',
        }}>
            <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                maxWidth: '400px',
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-primary)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 1rem',
                        }} />
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Authentification en cours...
                        </p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ color: 'var(--color-text-primary)' }}>
                            Connexion réussie ! Redirection...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
                        <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                            Erreur d&apos;authentification
                        </h2>
                        <p style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
                            {error}
                        </p>
                        <a
                            href="/auth/login"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 1.5rem',
                                background: 'var(--color-primary)',
                                color: 'white',
                                borderRadius: '0.5rem',
                                textDecoration: 'none',
                            }}
                        >
                            Retour à la connexion
                        </a>
                    </>
                )}
            </div>
        </main>
    );
}

/**
 * Default export with Suspense boundary (required for useSearchParams in Next.js 15)
 */
export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <main style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--color-bg-primary)',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid var(--color-border)',
                    borderTopColor: 'var(--color-primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }} />
            </main>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
