/**
 * Debrief Page
 * 
 * @module app/game/[sessionId]/debrief/page
 * @description End of game debrief (placeholder for US-052)
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './page.module.css';

interface PageProps {
    params: Promise<{
        sessionId: string;
    }>;
}

export default async function DebriefPage({ params }: PageProps) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth/login');
    }

    // Get session
    const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

    if (error || !session) {
        redirect('/dashboard/sessions');
    }

    // Get all game states for summary
    const { data: gameStates } = await supabase
        .from('game_states')
        .select('*')
        .eq('session_id', sessionId)
        .order('turn_number', { ascending: true });

    const totalTurns = gameStates?.length || 0;
    const lastState = gameStates?.[gameStates.length - 1]?.state;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>🏆 Débrief de Partie</h1>
                <p className={styles.subtitle}>{session.name}</p>
            </header>

            <main className={styles.main}>
                <section className={styles.summaryCard}>
                    <h2>📊 Résumé</h2>
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{totalTurns}</span>
                            <span className={styles.statLabel}>Tours joués</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>
                                {session.status === 'ended' ? '✅' : '⏸️'}
                            </span>
                            <span className={styles.statLabel}>
                                {session.status === 'ended' ? 'Terminée' : session.status}
                            </span>
                        </div>
                    </div>
                </section>

                {lastState && (
                    <section className={styles.resultCard}>
                        <h2>📈 Indices Finaux</h2>
                        <div className={styles.indicesGrid}>
                            {Object.entries(lastState.indices || {}).map(([key, value]) => (
                                <div key={key} className={styles.indexItem}>
                                    <span className={styles.indexName}>{key}</span>
                                    <span className={styles.indexValue}>{Math.round(value as number)}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className={styles.placeholder}>
                    <p>📋 L&apos;analyse détaillée (top 5 décisions, graphiques d&apos;évolution) sera disponible dans US-052.</p>
                </section>

                <div className={styles.actions}>
                    <Link href="/dashboard/sessions" className={styles.backBtn}>
                        ← Retour aux sessions
                    </Link>
                </div>
            </main>
        </div>
    );
}
