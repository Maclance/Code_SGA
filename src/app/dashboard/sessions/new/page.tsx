/**
 * Session Creation Page
 *
 * @module app/dashboard/sessions/new/page
 * @description UI for creating new game sessions (US-010)
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

// ============================================
// Types
// ============================================

interface FormState {
    name: string;
    speed: 'fast' | 'medium' | 'slow';
    difficulty: 'novice' | 'intermediate';
    maxTurns: number;
    products: {
        auto: boolean;
        mrh: boolean;
    };
}

interface FormErrors {
    name?: string;
    products?: string;
    general?: string;
}

// ============================================
// Component
// ============================================

export default function NewSessionPage() {
    const router = useRouter();

    const [formState, setFormState] = useState<FormState>({
        name: '',
        speed: 'medium',
        difficulty: 'novice',
        maxTurns: 8,
        products: {
            auto: true,
            mrh: true,
        },
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setFormState((prev) => ({
                ...prev,
                products: {
                    ...prev.products,
                    [name]: checkbox.checked,
                },
            }));
        } else if (name === 'maxTurns') {
            setFormState((prev) => ({
                ...prev,
                [name]: parseInt(value, 10),
            }));
        } else {
            setFormState((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear errors on change
        setErrors({});
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formState.name.trim()) {
            newErrors.name = 'Le nom de la session est requis';
        }

        if (!formState.products.auto && !formState.products.mrh) {
            newErrors.products = 'Au moins un produit doit être sélectionné';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            // Build products array
            const products: ('auto' | 'mrh')[] = [];
            if (formState.products.auto) products.push('auto');
            if (formState.products.mrh) products.push('mrh');

            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formState.name,
                    config: {
                        speed: formState.speed,
                        difficulty: formState.difficulty,
                        maxTurns: formState.maxTurns,
                        products,
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: data.error || 'Erreur lors de la création',
                });
                return;
            }

            // Redirect to session page
            router.push(`/dashboard/sessions/${data.session.id}`);
        } catch (error) {
            console.error('Error creating session:', error);
            setErrors({
                general: 'Erreur de connexion au serveur',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Nouvelle Session</h1>
                <p>Configurez les paramètres de votre session de jeu</p>
            </header>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* General error */}
                {errors.general && (
                    <div className={styles.errorBanner}>{errors.general}</div>
                )}

                {/* Session Name */}
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>
                        Nom de la session *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        placeholder="Ex: Formation Janvier 2025"
                        className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                        disabled={isSubmitting}
                    />
                    {errors.name && (
                        <span className={styles.errorText}>{errors.name}</span>
                    )}
                </div>

                {/* Speed */}
                <div className={styles.formGroup}>
                    <label htmlFor="speed" className={styles.label}>
                        Vitesse de jeu
                    </label>
                    <select
                        id="speed"
                        name="speed"
                        value={formState.speed}
                        onChange={handleChange}
                        className={styles.select}
                        disabled={isSubmitting}
                    >
                        <option value="fast">Rapide (1 tour = 1 an)</option>
                        <option value="medium">Moyenne (1 tour = 1 trimestre)</option>
                        <option value="slow">Lente (1 tour = 1 mois)</option>
                    </select>
                </div>

                {/* Difficulty */}
                <div className={styles.formGroup}>
                    <label htmlFor="difficulty" className={styles.label}>
                        Difficulté
                    </label>
                    <select
                        id="difficulty"
                        name="difficulty"
                        value={formState.difficulty}
                        onChange={handleChange}
                        className={styles.select}
                        disabled={isSubmitting}
                    >
                        <option value="novice">Novice (leviers simplifiés)</option>
                        <option value="intermediate">Intermédiaire (leviers complets)</option>
                    </select>
                </div>

                {/* Duration */}
                <div className={styles.formGroup}>
                    <label htmlFor="maxTurns" className={styles.label}>
                        Durée : {formState.maxTurns} tours
                    </label>
                    <input
                        type="range"
                        id="maxTurns"
                        name="maxTurns"
                        min="4"
                        max="20"
                        value={formState.maxTurns}
                        onChange={handleChange}
                        className={styles.slider}
                        disabled={isSubmitting}
                    />
                    <div className={styles.sliderLabels}>
                        <span>4 tours</span>
                        <span>20 tours</span>
                    </div>
                </div>

                {/* Products */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>Produits d&apos;assurance *</label>
                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="auto"
                                checked={formState.products.auto}
                                onChange={handleChange}
                                className={styles.checkbox}
                                disabled={isSubmitting}
                            />
                            <span className={styles.checkboxText}>
                                <strong>Auto</strong>
                                <small>Assurance automobile</small>
                            </span>
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="mrh"
                                checked={formState.products.mrh}
                                onChange={handleChange}
                                className={styles.checkbox}
                                disabled={isSubmitting}
                            />
                            <span className={styles.checkboxText}>
                                <strong>MRH</strong>
                                <small>Multirisque Habitation</small>
                            </span>
                        </label>
                    </div>
                    {errors.products && (
                        <span className={styles.errorText}>{errors.products}</span>
                    )}
                </div>

                {/* Submit */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={styles.cancelButton}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Création en cours...' : 'Créer la session'}
                    </button>
                </div>
            </form>
        </div>
    );
}
