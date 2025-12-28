'use client';

/**
 * Login Page
 *
 * @module app/auth/login
 * @description Login page with email/password authentication (US-002/US-003)
 */

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './page.module.css';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/dashboard';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                throw signInError;
            }

            router.push(redirect);
            router.refresh();
        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Identifiants incorrects');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>🎮</span>
                            <span className={styles.logoText}>AssurManager</span>
                        </div>
                        <h1 className={styles.title}>Connexion</h1>
                        <p className={styles.subtitle}>
                            Accédez à votre espace de simulation
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
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

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                id="password"
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
                                    Connexion...
                                </>
                            ) : (
                                'Se connecter'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <a href="/auth/reset-password" className={styles.link}>
                            Mot de passe oublié ?
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}

/**
 * Default export with Suspense boundary (required for useSearchParams in Next.js 15)
 */
export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <span className={styles.spinner}></span>
                        </div>
                    </div>
                </div>
            </main>
        }>
            <LoginPageContent />
        </Suspense>
    );
}
