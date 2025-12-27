'use client';

/**
 * Invite User Form
 *
 * @module app/dashboard/users/components/InviteUserForm
 * @description Form for sending user invitations
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './InviteUserForm.module.css';

type InviteUserFormProps = {
    tenantId: string;
};

const roleOptions = [
    { value: 'joueur', label: 'Joueur', description: 'Peut jouer aux simulations' },
    { value: 'formateur', label: 'Formateur', description: 'Peut créer et gérer des sessions' },
    { value: 'admin_tenant', label: 'Administrateur', description: 'Accès complet à l\'organisation' },
    { value: 'observateur', label: 'Observateur', description: 'Lecture seule' },
];

export default function InviteUserForm({ tenantId }: InviteUserFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('joueur');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'envoi de l\'invitation');
            }

            setSuccess(`Invitation envoyée à ${email}`);
            setEmail('');
            setRole('joueur');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
                <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.label}>
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="utilisateur@entreprise.com"
                        className={styles.input}
                        required
                        disabled={isLoading}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="role" className={styles.label}>
                        Rôle
                    </label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={styles.select}
                        disabled={isLoading}
                    >
                        {roleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading || !email}
                >
                    {isLoading ? 'Envoi...' : 'Inviter'}
                </button>
            </div>

            {/* Role description */}
            <p className={styles.roleDesc}>
                {roleOptions.find((r) => r.value === role)?.description}
            </p>

            {/* Messages */}
            {error && (
                <div className={styles.error}>
                    <span>⚠️</span> {error}
                </div>
            )}
            {success && (
                <div className={styles.success}>
                    <span>✅</span> {success}
                </div>
            )}
        </form>
    );
}
