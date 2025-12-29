/**
 * Session Detail Page
 *
 * @module app/dashboard/sessions/[id]/page
 * @description Session detail view (placeholder for US-011+)
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Session {
    id: string;
    code: string;
    name: string;
    status: string;
    config: {
        speed: string;
        difficulty: string;
        maxTurns: number;
        products: string[];
    };
    engineVersion: string;
    currentTurn: number;
    createdAt: string;
}

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const response = await fetch(`/api/sessions/${params.id}`);
                if (!response.ok) {
                    throw new Error('Session non trouvée');
                }
                const data = await response.json();
                setSession(data.session);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchSession();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Chargement...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={() => router.push('/dashboard')}>
                        Retour au tableau de bord
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const speedLabels: Record<string, string> = {
        fast: 'Rapide',
        medium: 'Moyenne',
        slow: 'Lente',
    };

    const difficultyLabels: Record<string, string> = {
        novice: 'Novice',
        intermediate: 'Intermédiaire',
    };

    const statusLabels: Record<string, string> = {
        draft: 'Brouillon',
        ready: 'Prête',
        running: 'En cours',
        paused: 'En pause',
        ended: 'Terminée',
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTop}>
                    <h1>{session.name}</h1>
                    <span className={`${styles.badge} ${styles[`badge_${session.status}`]}`}>
                        {statusLabels[session.status] || session.status}
                    </span>
                </div>
                <p className={styles.code}>Code : <strong>{session.code}</strong></p>
            </header>

            <div className={styles.card}>
                <h2>Configuration</h2>
                <dl className={styles.details}>
                    <div className={styles.detailRow}>
                        <dt>Vitesse</dt>
                        <dd>{speedLabels[session.config.speed] || session.config.speed}</dd>
                    </div>
                    <div className={styles.detailRow}>
                        <dt>Difficulté</dt>
                        <dd>{difficultyLabels[session.config.difficulty] || session.config.difficulty}</dd>
                    </div>
                    <div className={styles.detailRow}>
                        <dt>Durée</dt>
                        <dd>{session.config.maxTurns} tours</dd>
                    </div>
                    <div className={styles.detailRow}>
                        <dt>Produits</dt>
                        <dd>{session.config.products.map(p => p.toUpperCase()).join(', ')}</dd>
                    </div>
                    <div className={styles.detailRow}>
                        <dt>Version moteur</dt>
                        <dd>{session.engineVersion}</dd>
                    </div>
                </dl>
            </div>

            <div className={styles.card}>
                <h2>Progression</h2>
                <p className={styles.progress}>
                    Tour {session.currentTurn} / {session.config.maxTurns}
                </p>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${(session.currentTurn / session.config.maxTurns) * 100}%` }}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
                    ← Retour
                </button>
                {session.status === 'draft' && (
                    <button className={styles.primaryButton} disabled>
                        Lancer la session (bientôt disponible)
                    </button>
                )}
            </div>
        </div>
    );
}
