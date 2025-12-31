/**
 * Start Game Button Component
 * 
 * @module components/game/StartGameButton
 * @description Button to start a game session (changes status from ready to running)
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './StartGameButton.module.css';

interface StartGameButtonProps {
    sessionId: string;
}

export function StartGameButton({ sessionId }: StartGameButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStart = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'running',
                    current_turn: 1,
                    started_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors du démarrage');
            }

            // Refresh the page to show the new status
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <button
                onClick={handleStart}
                disabled={loading}
                className={styles.startButton}
            >
                {loading ? '⏳ Démarrage...' : '🚀 Démarrer la partie'}
            </button>
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}
