'use client';

/**
 * Reset Password Page
 *
 * @module app/auth/reset-password
 * @description Password reset page with request and update modes (US-003 AC4)
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

type Mode = 'request' | 'reset';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const [mode, setMode] = useState<Mode>('request');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if we have tokens in URL hash (reset mode)
    useEffect(() => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'recovery') {
            setMode('reset');
        }
    }, []);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback`,
            });

            if (resetError) {
                throw resetError;
            }

            setSuccess(true);
        } catch (err) {
            console.error('Reset request error:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate password strength
        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
        } catch (err) {
            console.error('Password update error:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setIsLoading(false);
        }
    };

    // Success states
    if (success && mode === 'request') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.successIcon}>📧</div>
                        <h1 className={styles.title}>Email envoyé</h1>
                        <p className={styles.subtitle}>
                            Si cette adresse est associée à un compte, vous recevrez un lien de réinitialisation.
                        </p>
                        <a href="/auth/login" className={styles.link}>
                            Retour à la connexion
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    if (success && mode === 'reset') {
        return (
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.successIcon}>✅</div>
                        <h1 className={styles.title}>Mot de passe mis à jour</h1>
                        <p className={styles.subtitle}>
                            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                        </p>
                        <a href="/auth/login" className={styles.button}>
                            Se connecter
                        </a>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>🔐</span>
                            <span className={styles.logoText}>AssurManager</span>
                        </div>
                        <h1 className={styles.title}>
                            {mode === 'request' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
                        </h1>
                        <p className={styles.subtitle}>
                            {mode === 'request'
                                ? 'Entrez votre email pour recevoir un lien de réinitialisation'
                                : 'Choisissez un nouveau mot de passe sécurisé'}
                        </p>
                    </div>

                    {/* Request Reset Form */}
                    {mode === 'request' && (
                        <form onSubmit={handleRequestReset} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="vous@entreprise.com"
                                    className={styles.input}
                                    required
                                    autoComplete="email"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className={styles.error}>
                                    <span className={styles.errorIcon}>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Envoyer le lien'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Reset Password Form */}
                    {mode === 'reset' && (
                        <form onSubmit={handleResetPassword} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="password" className={styles.label}>
                                    Nouveau mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                    minLength={8}
                                />
                                <span className={styles.hint}>Minimum 8 caractères</span>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="confirmPassword" className={styles.label}>
                                    Confirmer le mot de passe
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    required
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                />
                            </div>

                            {error && (
                                <div className={styles.error}>
                                    <span className={styles.errorIcon}>⚠️</span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Mise à jour...
                                    </>
                                ) : (
                                    'Mettre à jour'
                                )}
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div className={styles.footer}>
                        <a href="/auth/login" className={styles.link}>
                            ← Retour à la connexion
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}

/**
 * Loading fallback for Suspense
 */
function LoadingFallback() {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className={styles.spinner} style={{ margin: '0 auto 1rem' }}></div>
                        <p style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
                    </div>
                </div>
            </div>
        </main>
    );
}

/**
 * Default export with Suspense boundary (required for useSearchParams in Next.js 15)
 */
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}
