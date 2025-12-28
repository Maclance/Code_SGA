'use client';

/**
 * Login Form Component
 *
 * @module components/auth/LoginForm
 * @description Reusable login form with rate limit handling (US-003)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginForm.module.css';

interface LoginFormProps {
    redirectTo?: string;
    onSuccess?: () => void;
}

/**
 * Login form component with email/password authentication
 * Handles rate limiting errors and displays appropriate messages
 */
export function LoginForm({ redirectTo = '/dashboard', onSuccess }: LoginFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryAfter, setRetryAfter] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setRetryAfter(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limited (AC3)
                    setRetryAfter(data.retryAfter || 60);
                    setError(data.message || 'Trop de tentatives. Réessayez plus tard.');
                } else if (response.status === 401) {
                    setError('Email ou mot de passe incorrect');
                } else {
                    setError(data.message || 'Une erreur est survenue');
                }
                return;
            }

            // Success - refresh the page to update auth state
            onSuccess?.();
            router.push(redirectTo);
            router.refresh();
        } catch (err) {
            console.error('Login error:', err);
            setError('Erreur de connexion. Vérifiez votre connexion internet.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
                <label htmlFor="login-email" className={styles.label}>
                    Email
                </label>
                <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@entreprise.com"
                    className={styles.input}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                />
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="login-password" className={styles.label}>
                    Mot de passe
                </label>
                <input
                    type="password"
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={styles.input}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                />
            </div>

            {error && (
                <div className={`${styles.error} ${retryAfter ? styles.rateLimit : ''}`}>
                    <span className={styles.errorIcon}>
                        {retryAfter ? '⏱️' : '⚠️'}
                    </span>
                    <div>
                        <span>{error}</span>
                        {retryAfter && (
                            <span className={styles.retryTimer}>
                                Réessayez dans {Math.ceil(retryAfter / 60)} minute(s)
                            </span>
                        )}
                    </div>
                </div>
            )}

            <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || !!retryAfter}
            >
                {isLoading ? (
                    <>
                        <span className={styles.spinner}></span>
                        Connexion...
                    </>
                ) : (
                    'Se connecter'
                )}
            </button>
        </form>
    );
}
