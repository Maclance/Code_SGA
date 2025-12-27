'use client';

/**
 * Users List Component
 *
 * @module app/dashboard/users/components/UsersList
 * @description Display and manage tenant users
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './UsersList.module.css';

type User = {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    status: string;
    created_at: string;
};

type UsersListProps = {
    users: User[];
    currentUserId: string;
    tenantId: string;
};

const roleOptions = [
    { value: 'joueur', label: 'Joueur' },
    { value: 'formateur', label: 'Formateur' },
    { value: 'admin_tenant', label: 'Administrateur' },
    { value: 'observateur', label: 'Observateur' },
];

export default function UsersList({ users, currentUserId, tenantId }: UsersListProps) {
    const router = useRouter();
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [newRole, setNewRole] = useState<string>('');

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            const response = await fetch(`/api/tenants/${tenantId}/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
            });

            if (response.ok) {
                setEditingUser(null);
                router.refresh();
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    };

    const startEditRole = (user: User) => {
        setEditingUser(user.id);
        setNewRole(user.role);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.table}>
            <div className={styles.header}>
                <span className={styles.headerCell}>Utilisateur</span>
                <span className={styles.headerCell}>Rôle</span>
                <span className={styles.headerCell}>Statut</span>
                <span className={styles.headerCell}>Inscrit le</span>
                <span className={styles.headerCell}></span>
            </div>
            {users.map((user) => (
                <div key={user.id} className={styles.row}>
                    <div className={styles.userCell}>
                        <div className={styles.avatar}>
                            {user.display_name?.charAt(0) || user.email.charAt(0)}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.name}>
                                {user.display_name || 'Sans nom'}
                                {user.id === currentUserId && (
                                    <span className={styles.youBadge}>Vous</span>
                                )}
                            </span>
                            <span className={styles.email}>{user.email}</span>
                        </div>
                    </div>
                    <div className={styles.cell}>
                        {editingUser === user.id ? (
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                className={styles.roleSelect}
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className={`${styles.badge} ${styles[`badge-${user.role}`]}`}>
                                {getRoleLabel(user.role)}
                            </span>
                        )}
                    </div>
                    <div className={styles.cell}>
                        <span className={`${styles.status} ${styles[`status-${user.status}`]}`}>
                            {getStatusLabel(user.status)}
                        </span>
                    </div>
                    <div className={styles.cell}>
                        <span className={styles.date}>{formatDate(user.created_at)}</span>
                    </div>
                    <div className={styles.actionsCell}>
                        {user.id !== currentUserId && (
                            <>
                                {editingUser === user.id ? (
                                    <>
                                        <button
                                            onClick={() => handleRoleChange(user.id, newRole)}
                                            className={styles.saveButton}
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            className={styles.cancelButton}
                                        >
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => startEditRole(user)}
                                        className={styles.editButton}
                                    >
                                        Modifier
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
        admin_tenant: 'Administrateur',
        formateur: 'Formateur',
        joueur: 'Joueur',
        observateur: 'Observateur',
    };
    return labels[role] || role;
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        active: 'Actif',
        pending: 'En attente',
        suspended: 'Suspendu',
    };
    return labels[status] || status;
}
