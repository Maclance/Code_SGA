/**
 * Dashboard Layout
 *
 * @module app/dashboard/layout
 * @description Layout for authenticated dashboard pages
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import DashboardNav from './components/DashboardNav';
import styles from './layout.module.css';

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

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Profile fetch error:', profileError);
    }

    // Get tenant info
    let tenantInfo = null;
    if (profile?.tenant_id) {
        const { data: tenant } = await adminClient
            .from('tenants')
            .select('name, slug')
            .eq('id', profile.tenant_id)
            .single();
        tenantInfo = tenant;
    }

    // Merge tenant info into profile
    const userWithTenant = profile ? {
        ...profile,
        tenants: tenantInfo
    } : null;

    return (
        <div className={styles.layout}>
            <DashboardNav user={userWithTenant} />
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}

