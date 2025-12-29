'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './page.module.css';

/**
 * Join Session Page (US-012)
 * 
 * Players can join a game session by entering the session code.
 */
export default function JoinSessionPage() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Redirect to login with return URL
                const returnUrl = encodeURIComponent('/sessions/join');
                router.push(`/auth/login?redirect=${returnUrl}`);
            } else {
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    /**
     * Format code for display (ABC-123)
     */
    const formatCodeInput = (value: string): string => {
        // Remove non-alphanumeric characters and convert to uppercase
        const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        // Limit to 6 characters
        const limited = cleaned.slice(0, 6);

        // Add separator after 3 characters
        if (limited.length > 3) {
            return limited.slice(0, 3) + '-' + limited.slice(3);
        }

        return limited;
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCodeInput(e.target.value);
        setCode(formatted);
        setError(null); // Clear error on input change
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Basic validation
        const rawCode = code.replace(/-/g, '');
        if (rawCode.length < 6) {
            setError('Code incomplet (6 caractères requis)');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/sessions/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: rawCode }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success: redirect to game
                router.push(`/game/${data.sessionId}`);
            } else if (response.status === 401) {
                // Not authenticated: redirect to login
                const returnUrl = encodeURIComponent('/sessions/join');
                router.push(`/auth/login?redirect=${returnUrl}`);
            } else {
                // Error: display message
                setError(data.error || 'Erreur lors de la connexion');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking auth
    if (isCheckingAuth) {
        return (
            <main className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loadingContainer}>
                        <span className={styles.spinner}></span>
                        <p>Vérification...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <span className="gradient-text">Rejoindre</span> une session
                    </h1>
                    <p className={styles.subtitle}>
                        Entrez le code fourni par votre formateur
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="session-code" className={styles.label}>
                            Code de session
                        </label>
                        <input
                            id="session-code"
                            type="text"
                            value={code}
                            onChange={handleCodeChange}
                            placeholder="ABC-123"
                            maxLength={7}
                            className={styles.input}
                            autoComplete="off"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className={styles.error} role="alert">
                            <svg
                                className={styles.errorIcon}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isLoading || code.replace(/-/g, '').length < 6}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Connexion...
                            </>
                        ) : (
                            'Rejoindre'
                        )}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p className={styles.hint}>
                        Le code ressemble à <code>ABC-123</code>
                    </p>
                </div>
            </div>
        </main>
    );
}
