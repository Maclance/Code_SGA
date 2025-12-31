/**
 * Game Dashboard Page
 *
 * @module app/game/[sessionId]/page
 * @description Main game dashboard with start button and turn access
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';
import { StartGameButton } from '@/components/game/StartGameButton';

interface PageProps {
    params: Promise<{
        sessionId: string;
    }>;
}

export default async function GamePage({ params }: PageProps) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth/login');
    }

    // Get session data
    const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error || !session) {
        redirect('/dashboard/sessions');
    }

    // If session is still draft, redirect to setup
    if (session.status === 'draft') {
        redirect(`/game/${sessionId}/setup`);
    }

    // Extract products from config
    const products = session.config?.products || [];

    // Determine current turn (at least 1 when running)
    const displayTurn = session.status === 'running'
        ? Math.max(session.current_turn, 1)
        : session.current_turn;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>🎮 {session.name || 'Partie en cours'}</h1>
                <div className={styles.statusBadge}>
                    <span className={styles.statusIndicator}></span>
                    {session.status === 'ready' ? 'Prêt' :
                        session.status === 'running' ? 'En cours' : session.status}
                </div>
            </header>

            <main className={styles.main}>
                <section className={styles.card}>
                    <h2>Produits gérés</h2>
                    <ul className={styles.productList}>
                        {products.includes('auto') && (
                            <li className={styles.productItem}>
                                <strong>🚗 Automobile</strong>
                                <span>RC Auto, Dommages Auto</span>
                            </li>
                        )}
                        {products.includes('mrh') && (
                            <li className={styles.productItem}>
                                <strong>🏠 MRH</strong>
                                <span>RC MRH, Dommages MRH</span>
                            </li>
                        )}
                    </ul>
                </section>

                <section className={styles.card}>
                    <h2>Informations partie</h2>
                    <dl className={styles.infoList}>
                        <dt>Tour actuel</dt>
                        <dd>{displayTurn} / {session.max_turns}</dd>
                        <dt>Difficulté</dt>
                        <dd>{session.config?.difficulty === 'novice' ? 'Novice' : 'Intermédiaire'}</dd>
                        <dt>Vitesse</dt>
                        <dd>
                            {session.config?.speed === 'rapide' ? 'Rapide' :
                                session.config?.speed === 'lente' ? 'Lente' : 'Moyenne'}
                        </dd>
                    </dl>
                </section>

                {/* Action buttons based on session status */}
                <section className={styles.actions}>
                    {session.status === 'ready' && (
                        <StartGameButton sessionId={sessionId} />
                    )}

                    {session.status === 'running' && (
                        <Link
                            href={`/game/${sessionId}/turn/${displayTurn}`}
                            className={styles.playButton}
                        >
                            ▶️ Jouer Tour {displayTurn}
                        </Link>
                    )}

                    {session.status === 'ended' && (
                        <Link
                            href={`/game/${sessionId}/debrief`}
                            className={styles.debriefButton}
                        >
                            📋 Voir le Débrief
                        </Link>
                    )}
                </section>
            </main>
        </div>
    );
}

