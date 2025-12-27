'use client';

/**
 * Invitations List Component
 *
 * @module app/dashboard/users/components/InvitationsList
 * @description Display and manage pending invitations
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './InvitationsList.module.css';

type Invitation = {
    id: string;
    email: string;
    role: string;
    expires_at: string;
    created_at: string;
};

type InvitationsListProps = {
    invitations: Invitation[];
    tenantId: string;
};

export default function InvitationsList({ invitations, tenantId }: InvitationsListProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (invitationId: string) => {
        if (!confirm('Annuler cette invitation ?')) return;

        setDeletingId(invitationId);
        try {
            const response = await fetch(
                `/api/tenants/${tenantId}/invitations/${invitationId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                router.refresh();
            }
        } catch (err) {
            console.error('Failed to delete invitation:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleResend = async (invitationId: string) => {
        try {
            const response = await fetch(
                `/api/tenants/${tenantId}/invitations/${invitationId}`,
                { method: 'POST' }
            );

            const data = await response.json();

            if (response.ok) {
                alert('Invitation renvoyée !');
                router.refresh();
            } else {
                alert(`Erreur: ${data.message || 'Impossible de renvoyer l\'invitation'}`);
            }
        } catch (err) {
            console.error('Failed to resend invitation:', err);
            alert('Erreur réseau lors du renvoi');
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const diff = new Date(expiresAt).getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Expire bientôt';
        if (hours < 24) return `${hours}h restantes`;
        return `${Math.floor(hours / 24)}j restants`;
    };

    return (
        <div className={styles.list}>
            {invitations.map((invitation) => (
                <div key={invitation.id} className={styles.item}>
                    <div className={styles.info}>
                        <span className={styles.email}>{invitation.email}</span>
                        <div className={styles.meta}>
                            <span className={`${styles.badge} ${styles[`badge-${invitation.role}`]}`}>
                                {getRoleLabel(invitation.role)}
                            </span>
                            <span className={styles.expires}>
                                ⏱️ {getTimeRemaining(invitation.expires_at)}
                            </span>
                        </div>
                    </div>
                    <div className={styles.actions}>
                        <button
                            onClick={() => handleResend(invitation.id)}
                            className={styles.resendButton}
                        >
                            Renvoyer
                        </button>
                        <button
                            onClick={() => handleDelete(invitation.id)}
                            className={styles.deleteButton}
                            disabled={deletingId === invitation.id}
                        >
                            {deletingId === invitation.id ? '...' : 'Annuler'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        admin_tenant: 'Admin',
        formateur: 'Formateur',
        joueur: 'Joueur',
        observateur: 'Observateur',
    };
    return labels[role] || role;
}
