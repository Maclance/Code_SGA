'use client';

/**
 * ProductScopeSelector Component
 *
 * @module components/game/ProductScopeSelector
 * @description Select products for a game session (US-013)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductScopeSelector.module.css';

// ============================================
// Product Definitions
// ============================================

interface ProductInfo {
    id: 'auto' | 'mrh';
    name: string;
    description: string;
    coverages: string[];
    defaultSelected: boolean;
}

const PRODUCTS: ProductInfo[] = [
    {
        id: 'auto',
        name: 'Automobile',
        description: 'Assurance véhicules particuliers et professionnels',
        coverages: ['RC Auto (Responsabilité Civile)', 'Dommages Auto (Vol, Incendie, Bris de glace)'],
        defaultSelected: true,
    },
    {
        id: 'mrh',
        name: 'MRH (Multirisques Habitation)',
        description: 'Assurance logements et biens mobiliers',
        coverages: ['RC MRH (Responsabilité Civile)', 'Dommages MRH (Incendie, Dégât des eaux, Vol)'],
        defaultSelected: false,
    },
];

// ============================================
// Component Props
// ============================================

export interface ProductScopeSelectorProps {
    sessionId: string;
    initialProducts?: string[];
    onConfirm?: () => void;
}

// ============================================
// Component
// ============================================

export function ProductScopeSelector({
    sessionId,
    initialProducts,
    onConfirm,
}: ProductScopeSelectorProps) {
    const router = useRouter();

    // Initialize with initial products or defaults
    const getInitialSelection = (): string[] => {
        if (initialProducts && initialProducts.length > 0) {
            return initialProducts;
        }
        return PRODUCTS.filter(p => p.defaultSelected).map(p => p.id);
    };

    const [selected, setSelected] = useState<string[]>(getInitialSelection);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = (productId: string) => {
        setError(null);
        setSelected(prev => {
            if (prev.includes(productId)) {
                return prev.filter(id => id !== productId);
            }
            return [...prev, productId];
        });
    };

    const handleConfirm = async () => {
        // Validation (AC2)
        if (selected.length === 0) {
            setError('Sélectionnez au moins un produit');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/sessions/${sessionId}/confirm-scope`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ products: selected }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erreur lors de la confirmation');
                return;
            }

            // Success callback
            if (onConfirm) {
                onConfirm();
            }

            // Redirect to game dashboard (AC3)
            router.push(`/game/${sessionId}`);
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Choisissez vos produits</h2>
                <p className={styles.subtitle}>
                    Sélectionnez les branches d&apos;assurance que vous souhaitez gérer dans cette partie.
                </p>
            </div>

            <div className={styles.productList}>
                {PRODUCTS.map((product) => (
                    <label
                        key={product.id}
                        className={`${styles.productCard} ${selected.includes(product.id) ? styles.selected : ''}`}
                    >
                        <div className={styles.checkboxContainer}>
                            <input
                                type="checkbox"
                                checked={selected.includes(product.id)}
                                onChange={() => handleToggle(product.id)}
                                className={styles.checkbox}
                                disabled={isLoading}
                            />
                        </div>
                        <div className={styles.productInfo}>
                            <h3 className={styles.productName}>{product.name}</h3>
                            <p className={styles.productDescription}>{product.description}</p>
                            <ul className={styles.coverageList}>
                                {product.coverages.map((coverage, index) => (
                                    <li key={index} className={styles.coverageItem}>
                                        {coverage}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </label>
                ))}
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.actions}>
                <button
                    onClick={handleConfirm}
                    disabled={isLoading || selected.length === 0}
                    className={styles.confirmButton}
                >
                    {isLoading ? 'Confirmation...' : 'Confirmer et démarrer'}
                </button>
            </div>

            <p className={styles.warning}>
                ⚠️ Attention : Ce choix est définitif et ne pourra pas être modifié une fois la partie lancée.
            </p>
        </div>
    );
}

export default ProductScopeSelector;
