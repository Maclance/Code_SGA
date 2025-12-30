/**
 * Game Setup Page
 *
 * @module app/game/[sessionId]/setup/page
 * @description Product scope selection page (US-013)
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductScopeSelector } from '@/components/game/ProductScopeSelector';
import styles from './page.module.css';

interface PageProps {
    params: Promise<{
        sessionId: string;
    }>;
}

export default async function SetupPage({ params }: PageProps) {
    const { sessionId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/auth/login');
    }

    // Get user data with tenant
    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

    if (!userData?.tenant_id) {
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

    // If session is already active, redirect to game
    if (session.status !== 'draft') {
        redirect(`/game/${sessionId}`);
    }

    // Extract initial products from session config
    const initialProducts = session.config?.products || ['auto'];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Configuration de la partie</h1>
                <p className={styles.sessionInfo}>
                    Session : <strong>{session.name || 'Sans nom'}</strong>
                </p>
            </header>

            <main className={styles.main}>
                <ProductScopeSelector
                    sessionId={sessionId}
                    initialProducts={initialProducts}
                />
            </main>
        </div>
    );
}
