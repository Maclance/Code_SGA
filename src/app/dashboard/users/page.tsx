/**
 * Users Management Page
 *
 * @module app/dashboard/users/page
 * @description Page for managing users and invitations (US-002)
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import UsersList from './components/UsersList';
import InvitationsList from './components/InvitationsList';
import InviteUserForm from './components/InviteUserForm';
import styles from './page.module.css';

// Admin client to bypass RLS
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

export default async function UsersPage() {
    const supabase = await createClient();

    // Get current user from auth
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
        redirect('/auth/login');
    }

    // Use admin client for data fetching
    const adminClient = getAdminClient();

    // Get user profile
    const { data: currentUser } = await adminClient
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    if (!currentUser) {
        redirect('/auth/login');
    }

    // Check if user is admin
    if (currentUser.role !== 'admin_tenant') {
        redirect('/dashboard');
    }

    const tenantId = currentUser.tenant_id;

    // Get users for this tenant
    const { data: users } = await adminClient
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

    // Get pending invitations
    const { data: invitations } = await adminClient
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Utilisateurs</h1>
                    <p className={styles.subtitle}>
                        Gérez les membres de votre organisation
                    </p>
                </div>
            </div>

            {/* Invite Form */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>✉️</span>
                    Inviter un utilisateur
                </h2>
                <InviteUserForm tenantId={tenantId} />
            </section>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <span className={styles.sectionIcon}>⏳</span>
                        Invitations en attente ({invitations.length})
                    </h2>
                    <InvitationsList invitations={invitations} tenantId={tenantId} />
                </section>
            )}

            {/* Users List */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>👥</span>
                    Membres ({users?.length || 0})
                </h2>
                <UsersList users={users || []} currentUserId={currentUser.id} tenantId={tenantId} />
            </section>
        </div>
    );
}
