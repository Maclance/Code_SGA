'use client';

/**
 * Reset Password Form Component
 *
 * @module components/auth/ResetPasswordForm
 * @description Reusable form for password reset request and update (US-003 AC4)
 */

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import styles from './ResetPasswordForm.module.css';

type Mode = 'request' | 'reset';

interface ResetPasswordFormProps {
    mode: Mode;
    onSuccess?: () => void;
}

/**
 * Password reset form component
 * - request mode: Enter email to receive reset link
 * - reset mode: Enter new password (after clicking email link)
 */
export function ResetPasswordForm({ mode, onSuccess }: ResetPasswordFormProps) {
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
            onSuccess?.();
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
            onSuccess?.();
        } catch (err) {
            console.error('Password update error:', err);
            setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.success}>
                <div className={styles.successIcon}>
                    {mode === 'request' ? '📧' : '✅'}
                </div>
                <p className={styles.successMessage}>
                    {mode === 'request'
                        ? 'Email envoyé ! Vérifiez votre boîte de réception.'
                        : 'Mot de passe mis à jour avec succès.'}
                </p>
            </div>
        );
    }

    if (mode === 'request') {
        return (
            <form onSubmit={handleRequestReset} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label htmlFor="reset-email" className={styles.label}>
                        Email
                    </label>
                    <input
                        type="email"
                        id="reset-email"
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
        );
    }

    return (
        <form onSubmit={handleResetPassword} className={styles.form}>
            <div className={styles.inputGroup}>
                <label htmlFor="new-password" className={styles.label}>
                    Nouveau mot de passe
                </label>
                <input
                    type="password"
                    id="new-password"
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
                <label htmlFor="confirm-password" className={styles.label}>
                    Confirmer le mot de passe
                </label>
                <input
                    type="password"
                    id="confirm-password"
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
    );
}
