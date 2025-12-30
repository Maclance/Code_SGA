/**
 * Session Detail Page
 *
 * @module app/dashboard/sessions/[id]/page
 * @description Redirects to appropriate game page based on session status
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
    const { id: sessionId } = await params;
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
        // Session not found, redirect to sessions list
        redirect('/dashboard/sessions');
    }

    // Redirect based on session status
    if (session.status === 'draft') {
        // Draft session: redirect to setup page to confirm products
        redirect(`/game/${sessionId}/setup`);
    } else {
        // Ready/running/ended: redirect to game dashboard
        redirect(`/game/${sessionId}`);
    }
}
