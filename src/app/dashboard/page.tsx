/**
 * Dashboard Home Page
 *
 * @module app/dashboard/page
 * @description Main dashboard page
 */

import Link from 'next/link';
import styles from './page.module.css';

export default function DashboardPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Tableau de bord</h1>
            <p className={styles.subtitle}>
                Bienvenue dans votre espace AssurManager
            </p>

            <div className={styles.cards}>
                <Link href="/dashboard/sessions" className={styles.card}>
                    <span className={styles.cardIcon}>🎮</span>
                    <h2 className={styles.cardTitle}>Sessions</h2>
                    <p className={styles.cardDesc}>
                        Gérez vos sessions de simulation
                    </p>
                </Link>
                <Link href="/sessions/join" className={styles.card}>
                    <span className={styles.cardIcon}>🎯</span>
                    <h2 className={styles.cardTitle}>Rejoindre</h2>
                    <p className={styles.cardDesc}>
                        Rejoindre une session avec un code
                    </p>
                </Link>
                <Link href="/dashboard/users" className={styles.card}>
                    <span className={styles.cardIcon}>👥</span>
                    <h2 className={styles.cardTitle}>Utilisateurs</h2>
                    <p className={styles.cardDesc}>
                        Invitez et gérez les membres
                    </p>
                </Link>
                <Link href="/dashboard/stats" className={styles.card}>
                    <span className={styles.cardIcon}>📊</span>
                    <h2 className={styles.cardTitle}>Statistiques</h2>
                    <p className={styles.cardDesc}>
                        Consultez les performances
                    </p>
                </Link>
            </div>
        </div>
    );
}

