/**
 * Accept Invitation Page
 *
 * @module app/auth/accept-invitation/[token]
 * @description Page for accepting invitations and setting up account (US-002)
 * AC2: Given lien activation, When délai > 48h, Then lien invalide (erreur)
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AcceptInvitationForm from './AcceptInvitationForm';
import { getInvitationByToken, InvitationExpiredError, InvitationAlreadyUsedError } from '@/lib/services/user.service';
import styles from './page.module.css';

type PageProps = {
    params: Promise<{ token: string }>;
};

async function InvitationContent({ token }: { token: string }) {
    try {
        const invitation = await getInvitationByToken(token);

        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.logo}>
                            <span className={styles.logoIcon}>🎮</span>
                            <span className={styles.logoText}>AssurManager</span>
                        </div>
                        <h1 className={styles.title}>Bienvenue !</h1>
                        <p className={styles.subtitle}>
                            Vous avez été invité(e) à rejoindre l&apos;équipe.
                        </p>
                    </div>

                    {/* Invitation Details */}
                    <div className={styles.invitationInfo}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Email</span>
                            <span className={styles.infoValue}>{invitation.email}</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Rôle</span>
                            <span className={`${styles.badge} ${styles[`badge-${invitation.role}`]}`}>
                                {getRoleLabel(invitation.role)}
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <AcceptInvitationForm
                        token={token}
                        email={invitation.email}
                    />

                    {/* Footer */}
                    <div className={styles.footer}>
                        <p className={styles.footerText}>
                            En créant votre compte, vous acceptez nos{' '}
                            <a href="/terms" className={styles.link}>conditions d&apos;utilisation</a>
                            {' '}et notre{' '}
                            <a href="/privacy" className={styles.link}>politique de confidentialité</a>.
                        </p>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        if (error instanceof InvitationExpiredError) {
            return (
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.errorHeader}>
                            <span className={styles.errorIcon}>⏰</span>
                            <h1 className={styles.errorTitle}>Invitation expirée</h1>
                        </div>
                        <p className={styles.errorMessage}>
                            Cette invitation a expiré. Les invitations sont valables pendant 48 heures.
                        </p>
                        <p className={styles.errorHint}>
                            Veuillez contacter l&apos;administrateur pour recevoir une nouvelle invitation.
                        </p>
                    </div>
                </div>
            );
        }

        if (error instanceof InvitationAlreadyUsedError) {
            return (
                <div className={styles.container}>
                    <div className={styles.card}>
                        <div className={styles.errorHeader}>
                            <span className={styles.errorIcon}>✓</span>
                            <h1 className={styles.errorTitle}>Invitation déjà utilisée</h1>
                        </div>
                        <p className={styles.errorMessage}>
                            Cette invitation a déjà été utilisée pour créer un compte.
                        </p>
                        <a href="/auth/login" className={styles.loginButton}>
                            Se connecter
                        </a>
                    </div>
                </div>
            );
        }

        // Unknown error - invalid token
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.errorHeader}>
                        <span className={styles.errorIcon}>❌</span>
                        <h1 className={styles.errorTitle}>Invitation invalide</h1>
                    </div>
                    <p className={styles.errorMessage}>
                        Ce lien d&apos;invitation n&apos;est pas valide ou a été supprimé.
                    </p>
                    <p className={styles.errorHint}>
                        Veuillez vérifier le lien ou contacter l&apos;administrateur.
                    </p>
                </div>
            </div>
        );
    }
}

function LoadingState() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Vérification de l&apos;invitation...</p>
                </div>
            </div>
        </div>
    );
}

export default async function AcceptInvitationPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) {
        redirect('/');
    }

    return (
        <main className={styles.main}>
            <Suspense fallback={<LoadingState />}>
                <InvitationContent token={token} />
            </Suspense>
        </main>
    );
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        admin_tenant: 'Administrateur',
        formateur: 'Formateur',
        joueur: 'Joueur',
        observateur: 'Observateur',
    };
    return labels[role] || role;
}
