/**
 * Audit Logs Admin Page
 *
 * @module app/dashboard/audit-logs/page
 * @description Audit log consultation for admin users (US-004)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './page.module.css';

// Types for audit logs
interface AuditLogEntry {
    id: string;
    user_id: string | null;
    action: string;
    resource_type: string | null;
    resource_id: string | null;
    ip_address: string | null;
    created_at: string;
    // Joined user info (actor)
    user?: {
        display_name: string | null;
        email: string;
    } | null;
    // Target user info (when resource_type is 'user')
    target_user?: {
        display_name: string | null;
        email: string;
    } | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface AuditLogsResponse {
    logs: AuditLogEntry[];
    pagination: Pagination;
}

// Available actions for filtering
const AUDIT_ACTIONS = [
    { value: '', label: 'Toutes les actions' },
    { value: 'session.create', label: 'Création de session' },
    { value: 'session.update', label: 'Modification de session' },
    { value: 'session.delete', label: 'Suppression de session' },
    { value: 'user.invite', label: 'Invitation utilisateur' },
    { value: 'user.role_change', label: 'Changement de rôle' },
    { value: 'export.pdf', label: 'Export PDF' },
    { value: 'export.data', label: 'Export données' },
];

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = useCallback(async (page: number, action: string) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50',
            });
            if (action) {
                params.set('action', action);
            }

            const response = await fetch(`/api/admin/audit-logs?${params}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erreur lors du chargement');
            }

            const data: AuditLogsResponse = await response.json();
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(pagination.page, actionFilter);
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage, actionFilter);
        }
    };

    const handleFilterChange = (action: string) => {
        setActionFilter(action);
        fetchLogs(1, action);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAction = (action: string) => {
        const actionMap: Record<string, string> = {
            'session.create': 'Création session',
            'session.update': 'Modification session',
            'session.delete': 'Suppression session',
            'user.invite': 'Invitation',
            'user.role_change': 'Changement rôle',
            'export.pdf': 'Export PDF',
            'export.data': 'Export données',
        };
        return actionMap[action] || action;
    };

    const formatResourceType = (type: string) => {
        const typeMap: Record<string, string> = {
            'user': 'Utilisateur',
            'invitation': 'Invitation',
            'session': 'Session',
            'export': 'Export',
        };
        return typeMap[type] || type;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Journal d&apos;audit</h1>
                <p className={styles.subtitle}>
                    Historique des actions sensibles
                </p>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <label className={styles.filterLabel}>
                    Filtrer par action:
                    <select
                        className={styles.filterSelect}
                        value={actionFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                    >
                        {AUDIT_ACTIONS.map((action) => (
                            <option key={action.value} value={action.value}>
                                {action.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Error state */}
            {error && (
                <div className={styles.error}>
                    <p>❌ {error}</p>
                    <button
                        onClick={() => fetchLogs(pagination.page, actionFilter)}
                        className={styles.retryButton}
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className={styles.loading}>
                    <p>Chargement...</p>
                </div>
            )}

            {/* Logs table */}
            {!loading && !error && (
                <>
                    {logs.length === 0 ? (
                        <div className={styles.empty}>
                            <p>Aucun log trouvé</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Action</th>
                                        <th>Acteur</th>
                                        <th>Cible</th>
                                        <th>IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className={styles.dateCell}>
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td>
                                                <span className={styles.actionBadge}>
                                                    {formatAction(log.action)}
                                                </span>
                                            </td>
                                            <td className={styles.userCell}>
                                                {log.user ? (
                                                    <span className={styles.userName}>
                                                        {log.user.display_name || log.user.email}
                                                    </span>
                                                ) : log.user_id ? (
                                                    <span className={styles.userId}>
                                                        {log.user_id.slice(0, 8)}...
                                                    </span>
                                                ) : (
                                                    <span className={styles.noData}>Système</span>
                                                )}
                                            </td>
                                            <td className={styles.targetCell}>
                                                {log.target_user ? (
                                                    <span className={styles.targetName}>
                                                        {log.target_user.display_name || log.target_user.email}
                                                    </span>
                                                ) : log.resource_type ? (
                                                    <span className={styles.resourceType}>
                                                        {formatResourceType(log.resource_type)}
                                                    </span>
                                                ) : (
                                                    <span className={styles.noData}>—</span>
                                                )}
                                            </td>
                                            <td className={styles.ipCell}>
                                                {log.ip_address || (
                                                    <span className={styles.noData}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageButton}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                            >
                                ← Précédent
                            </button>
                            <span className={styles.pageInfo}>
                                Page {pagination.page} sur {pagination.totalPages}
                                <span className={styles.totalCount}>
                                    ({pagination.total} logs)
                                </span>
                            </span>
                            <button
                                className={styles.pageButton}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
