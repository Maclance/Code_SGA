/**
 * Sessions List Page
 *
 * @module app/dashboard/sessions/page
 * @description List of game sessions with creation action (Fixes 404)
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    currentTurn: number;
    createdAt: string;
}

export default function SessionsListPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch('/api/sessions');
                if (!response.ok) {
                    throw new Error('Erreur lors du chargement des sessions');
                }
                const data = await response.json();
                setSessions(data.sessions);
            } catch (err) {
                console.error(err);
                setError('Impossible de charger les sessions.');
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const statusLabels: Record<string, string> = {
        draft: 'Brouillon',
        ready: 'Prête',
        running: 'En cours',
        paused: 'En pause',
        ended: 'Terminée',
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Mes Sessions</h1>
                    <p>Gérez vos sessions de jeu et suivez leur progression</p>
                </div>
                <Link href="/dashboard/sessions/new" className={styles.createButton}>
                    + Nouvelle Session
                </Link>
            </header>

            {loading ? (
                <div className={styles.loading}>Chargement des sessions...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : sessions.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎮</div>
                    <h2>Aucune session créée</h2>
                    <p>Commencez par créer votre première session de jeu.</p>
                    <Link href="/dashboard/sessions/new" className={styles.createButtonSecondary}>
                        Créer une session
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={styles.card}
                            onClick={() => router.push(`/dashboard/sessions/${session.id}`)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.cardHeader}>
                                <span className={`${styles.badge} ${styles[`badge_${session.status}`]}`}>
                                    {statusLabels[session.status] || session.status}
                                </span>
                                <span className={styles.date}>{formatDate(session.createdAt)}</span>
                            </div>

                            <h3 className={styles.cardTitle}>{session.name}</h3>
                            <div className={styles.cardCode}>Code: <strong>{session.code}</strong></div>

                            <div className={styles.cardMeta}>
                                <span>{session.currentTurn} / {session.config.maxTurns} tours</span>
                                <span>{session.config.products.length} produits</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
