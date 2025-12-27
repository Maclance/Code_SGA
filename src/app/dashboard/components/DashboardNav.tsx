'use client';

/**
 * Dashboard Navigation
 *
 * @module app/dashboard/components/DashboardNav
 * @description Sidebar navigation for dashboard
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import styles from './DashboardNav.module.css';

type DashboardNavProps = {
    user: {
        id: string;
        email: string;
        display_name: string | null;
        role: string;
        tenant_id: string;
        tenants?: {
            name: string;
            slug: string;
        };
    } | null;
};

const navItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: '📊' },
    { href: '/dashboard/users', label: 'Utilisateurs', icon: '👥', roles: ['admin_tenant'] },
    { href: '/dashboard/sessions', label: 'Sessions', icon: '🎮', roles: ['admin_tenant', 'formateur'] },
];

export default function DashboardNav({ user }: DashboardNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    const filteredNavItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    return (
        <nav className={styles.nav}>
            {/* Logo */}
            <div className={styles.logo}>
                <span className={styles.logoIcon}>🎮</span>
                <span className={styles.logoText}>AssurManager</span>
            </div>

            {/* Tenant Info */}
            {user?.tenants && (
                <div className={styles.tenantInfo}>
                    <span className={styles.tenantLabel}>Organisation</span>
                    <span className={styles.tenantName}>{user.tenants.name}</span>
                </div>
            )}

            {/* Navigation Links */}
            <ul className={styles.navList}>
                {filteredNavItems.map((item) => (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={`${styles.navLink} ${pathname === item.href ? styles.active : ''
                                }`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>

            {/* User Info & Logout */}
            <div className={styles.userSection}>
                <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                        {user?.display_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                    <div className={styles.userDetails}>
                        <span className={styles.userName}>
                            {user?.display_name || user?.email}
                        </span>
                        <span className={styles.userRole}>{getRoleLabel(user?.role)}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Déconnexion
                </button>
            </div>
        </nav>
    );
}

function getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
        admin_tenant: 'Administrateur',
        formateur: 'Formateur',
        joueur: 'Joueur',
        observateur: 'Observateur',
    };
    return labels[role || ''] || role || '';
}
