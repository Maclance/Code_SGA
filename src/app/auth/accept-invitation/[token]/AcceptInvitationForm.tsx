'use client';

/**
 * Accept Invitation Form Component
 *
 * @module app/auth/accept-invitation/[token]/AcceptInvitationForm
 * @description Form for setting up account after accepting invitation (US-002)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './AcceptInvitationForm.module.css';

type AcceptInvitationFormProps = {
    token: string;
    email: string;
};

export default function AcceptInvitationForm({ token, email }: AcceptInvitationFormProps) {
    const router = useRouter();
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user ID from session on mount
    useEffect(() => {
        const getSession = async () => {
            // First try to get existing session
            const { data: sessionData } = await supabase.auth.getSession();

            if (sessionData?.session?.user?.id) {
                setUserId(sessionData.session.user.id);
                return;
            }

            // Check URL hash for tokens from invite link
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (!error && data.session?.user?.id) {
                    setUserId(data.session.user.id);
                }
            }
        };

        getSession();
    }, [supabase.auth]);

    const checkPasswordStrength = (pwd: string) => {
        if (pwd.length < 8) return 'weak';
        const hasLower = /[a-z]/.test(pwd);
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        if (score >= 4 && pwd.length >= 12) return 'strong';
        if (score >= 3) return 'medium';
        return 'weak';
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordStrength(value ? checkPasswordStrength(value) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!displayName.trim()) {
            setError('Veuillez entrer votre nom');
            return;
        }

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            setError('Le mot de passe doit contenir une majuscule, une minuscule et un chiffre');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (!userId) {
            setError('Session non trouvée. Veuillez cliquer à nouveau sur le lien d\'invitation.');
            return;
        }

        setIsLoading(true);

        try {
            // Call API to accept invitation - server will set password via admin API
            const response = await fetch('/api/auth/accept-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    auth_user_id: userId,
                    display_name: displayName,
                    password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de l\'acceptation de l\'invitation');
            }

            // Sign out and sign in with new password to verify it works
            await supabase.auth.signOut();

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                console.warn('Auto sign-in failed:', signInError);
                // Still redirect, user can login manually
                router.push('/auth/login?message=account_created');
                return;
            }

            // Redirect to dashboard
            router.push('/dashboard?welcome=true');
        } catch (err) {
            console.error('Signup error:', err);
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Display Name */}
            <div className={styles.inputGroup}>
                <label htmlFor="displayName" className={styles.label}>
                    Votre nom
                </label>
                <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jean Dupont"
                    className={styles.input}
                    required
                    autoComplete="name"
                    disabled={isLoading}
                />
            </div>

            {/* Email (read-only) */}
            <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    className={`${styles.input} ${styles.inputDisabled}`}
                    disabled
                />
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                    Mot de passe
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className={styles.input}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                />
                {passwordStrength && (
                    <div className={styles.passwordStrength}>
                        <div className={`${styles.strengthBar} ${styles[passwordStrength]}`} />
                        <span className={styles.strengthLabel}>
                            {passwordStrength === 'weak' && 'Faible'}
                            {passwordStrength === 'medium' && 'Moyen'}
                            {passwordStrength === 'strong' && 'Fort'}
                        </span>
                    </div>
                )}
                <p className={styles.hint}>
                    Min. 8 caractères avec majuscule, minuscule et chiffre
                </p>
            </div>

            {/* Confirm Password */}
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

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className={styles.buttonSpinner}></span>
                        Création en cours...
                    </>
                ) : (
                    'Créer mon compte'
                )}
            </button>
        </form>
    );
}
