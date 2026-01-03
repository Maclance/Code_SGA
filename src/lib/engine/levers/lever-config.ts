/**
 * Lever Gating Configuration
 *
 * @module lib/engine/levers/lever-config
 * @description Externalized lever configuration with difficulty gating (US-034)
 *
 * Source of truth: docs/20_simulation/leviers_catalogue.md
 */

// ============================================
// TYPES
// ============================================

/**
 * Lever categories matching the catalog
 */
export type LeverCategory =
    | 'PRODUIT_TARIFICATION'
    | 'DISTRIBUTION'
    | 'MARKETING'
    | 'RH'
    | 'IT_DATA'
    | 'SINISTRES'
    | 'REASSURANCE'
    | 'PREVENTION'
    | 'PROVISIONS'
    | 'SOUSCRIPTION'
    | 'GESTION_CRISE'
    | 'EXPERIENCE_CLIENT'
    | 'CONFORMITE';

/**
 * Difficulty levels for gating
 */
export type GatingDifficulty = 'novice' | 'intermediate' | 'expert';

/**
 * Impact preview type for UI display
 */
export type ImpactType = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * Impact preview configuration
 */
export interface ImpactPreview {
    target: string;
    type: ImpactType;
    description: string;
}

/**
 * Cost configuration for a lever
 */
export interface LeverCost {
    budgetUnits: number;
    recurring: boolean;
}

/**
 * Complete lever gating configuration
 */
export interface LeverGatingConfig {
    /** Unique lever ID (e.g., LEV-TAR-01) */
    id: string;
    /** Display name */
    name: string;
    /** Category for grouping */
    category: LeverCategory;
    /** Minimum difficulty required to activate this lever */
    minDifficulty: GatingDifficulty;
    /** Cost in budget units */
    cost: LeverCost;
    /** Description for tooltip/display */
    description: string;
    /** Impact preview for hover state */
    impactPreview: ImpactPreview;
    /** Optional delay in turns (for UI display) */
    delay?: number;
}

// ============================================
// CATEGORY DISPLAY CONFIG
// ============================================

export const LEVER_CATEGORY_CONFIG: Record<LeverCategory, { name: string; emoji: string; order: number }> = {
    PRODUIT_TARIFICATION: { name: 'Tarification', emoji: '💵', order: 1 },
    DISTRIBUTION: { name: 'Distribution', emoji: '🏪', order: 2 },
    MARKETING: { name: 'Marketing', emoji: '📢', order: 3 },
    RH: { name: 'Ressources Humaines', emoji: '👥', order: 4 },
    IT_DATA: { name: 'IT / Data', emoji: '💻', order: 5 },
    SINISTRES: { name: 'Gestion Sinistres', emoji: '📋', order: 6 },
    REASSURANCE: { name: 'Réassurance', emoji: '🛡️', order: 7 },
    PREVENTION: { name: 'Prévention', emoji: '🔒', order: 8 },
    PROVISIONS: { name: 'Provisions', emoji: '💰', order: 9 },
    SOUSCRIPTION: { name: 'Souscription', emoji: '✍️', order: 10 },
    EXPERIENCE_CLIENT: { name: 'Expérience Client', emoji: '😊', order: 11 },
    GESTION_CRISE: { name: 'Gestion de Crise', emoji: '🚨', order: 12 },
    CONFORMITE: { name: 'Conformité', emoji: '📜', order: 13 },
};

// ============================================
// LEVER CATALOG - NOVICE (10 levers)
// ============================================

const NOVICE_LEVERS: LeverGatingConfig[] = [
    {
        id: 'LEV-TAR-01',
        name: 'Niveau de prime',
        category: 'PRODUIT_TARIFICATION',
        minDifficulty: 'novice',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Ajuster le niveau tarifaire global par rapport au marché',
        impactPreview: { target: 'IAC', type: 'mixed', description: 'Impact IAC et IPP' },
        delay: 1,
    },
    {
        id: 'LEV-GAR-01',
        name: 'Niveau de franchise',
        category: 'PRODUIT_TARIFICATION',
        minDifficulty: 'novice',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Définir le niveau de franchise applicable aux sinistres',
        impactPreview: { target: 'IAC', type: 'mixed', description: 'Impact IAC et coûts sinistres' },
        delay: 1,
    },
    {
        id: 'LEV-DIS-01',
        name: 'Mix de distribution',
        category: 'DISTRIBUTION',
        minDifficulty: 'novice',
        cost: { budgetUnits: 2, recurring: true },
        description: 'Répartir les canaux de distribution (digital, agents, courtiers)',
        impactPreview: { target: 'IAC', type: 'positive', description: 'Impact IAC et coûts acquisition' },
        delay: 2,
    },
    {
        id: 'LEV-MKT-01',
        name: 'Publicité marque',
        category: 'MARKETING',
        minDifficulty: 'novice',
        cost: { budgetUnits: 3, recurring: false },
        description: 'Lancer une campagne publicitaire pour renforcer la notoriété',
        impactPreview: { target: 'IAC', type: 'positive', description: 'Boost notoriété et IAC' },
        delay: 0,
    },
    {
        id: 'LEV-RH-01',
        name: 'Recrutement sinistres',
        category: 'RH',
        minDifficulty: 'novice',
        cost: { budgetUnits: 2, recurring: false },
        description: 'Recruter des gestionnaires de sinistres supplémentaires',
        impactPreview: { target: 'IPQO', type: 'positive', description: 'Améliore capacité et IPQO' },
        delay: 2,
    },
    {
        id: 'LEV-IT-01',
        name: 'Stabilité SI',
        category: 'IT_DATA',
        minDifficulty: 'novice',
        cost: { budgetUnits: 2, recurring: true },
        description: 'Investir dans la stabilité et la sécurité du système d\'information',
        impactPreview: { target: 'IMD', type: 'positive', description: 'Réduit dette technique et risque cyber' },
        delay: 2,
    },
    {
        id: 'LEV-SIN-02',
        name: 'Lutte anti-fraude N1',
        category: 'SINISTRES',
        minDifficulty: 'novice',
        cost: { budgetUnits: 1, recurring: false },
        description: 'Mettre en place des contrôles basiques de détection de fraude',
        impactPreview: { target: 'IPP', type: 'positive', description: 'Réduit S/P jusqu\'à 5%' },
        delay: 1,
    },
    {
        id: 'LEV-REA-01',
        name: 'Niveau de réassurance',
        category: 'REASSURANCE',
        minDifficulty: 'novice',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Ajuster le niveau de protection réassurance (cession de primes)',
        impactPreview: { target: 'IRF', type: 'positive', description: 'Impact sur IRF et primes nettes' },
        delay: 0,
    },
    {
        id: 'LEV-PROV-01',
        name: 'Politique de provisionnement',
        category: 'PROVISIONS',
        minDifficulty: 'novice',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Choisir une politique de provisionnement (prudente, standard, agressive)',
        impactPreview: { target: 'IS', type: 'mixed', description: 'Impact IS, IPP et IRF' },
        delay: 0,
    },
    {
        id: 'LEV-UND-01',
        name: 'Posture de souscription',
        category: 'SOUSCRIPTION',
        minDifficulty: 'novice',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Définir la sélectivité de la souscription (permissive à très sélective)',
        impactPreview: { target: 'IAC', type: 'mixed', description: 'Arbitrage IAC vs risque anti-sélection' },
        delay: 0,
    },
];

// ============================================
// LEVER CATALOG - INTERMEDIATE (+8 levers)
// ============================================

const INTERMEDIATE_LEVERS: LeverGatingConfig[] = [
    {
        id: 'LEV-TAR-02',
        name: 'Segmentation tarifaire',
        category: 'PRODUIT_TARIFICATION',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 1, recurring: true },
        description: 'Affiner la tarification par segment de clientèle',
        impactPreview: { target: 'IPP', type: 'positive', description: 'Améliore S/P par segment' },
        delay: 2,
    },
    {
        id: 'LEV-DIS-02',
        name: 'Commissions réseau',
        category: 'DISTRIBUTION',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 1, recurring: true },
        description: 'Ajuster les commissions versées au réseau de distribution',
        impactPreview: { target: 'IAC', type: 'mixed', description: 'Impact volume et coûts' },
        delay: 1,
    },
    {
        id: 'LEV-MKT-02',
        name: 'Marketing direct',
        category: 'MARKETING',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 2, recurring: false },
        description: 'Campagnes ciblées pour acquisition et fidélisation',
        impactPreview: { target: 'IAC', type: 'positive', description: 'Acquisition ciblée' },
        delay: 1,
    },
    {
        id: 'LEV-RH-02',
        name: 'Recrutement IT',
        category: 'RH',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 3, recurring: false },
        description: 'Renforcer l\'équipe IT et data',
        impactPreview: { target: 'IMD', type: 'positive', description: 'Améliore IMD' },
        delay: 2,
    },
    {
        id: 'LEV-RH-04',
        name: 'Programme de formation',
        category: 'RH',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 1, recurring: true },
        description: 'Investir dans la formation continue des équipes',
        impactPreview: { target: 'IERH', type: 'positive', description: 'Améliore compétences et IERH' },
        delay: 2,
    },
    {
        id: 'LEV-IT-03',
        name: 'Qualité données',
        category: 'IT_DATA',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 2, recurring: true },
        description: 'Améliorer la qualité et la gouvernance des données',
        impactPreview: { target: 'IMD', type: 'positive', description: 'Améliore IMD et fiabilité' },
        delay: 3,
    },
    {
        id: 'LEV-PREV-01',
        name: 'Prévention habitat',
        category: 'PREVENTION',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 1, recurring: false },
        description: 'Programme de prévention pour réduire la sinistralité MRH',
        impactPreview: { target: 'IPP', type: 'positive', description: 'Réduit fréquence sinistres' },
        delay: 4,
    },
    {
        id: 'LEV-CLI-01',
        name: 'Politique d\'indemnisation',
        category: 'EXPERIENCE_CLIENT',
        minDifficulty: 'intermediate',
        cost: { budgetUnits: 0, recurring: false },
        description: 'Définir la générosité des indemnisations (généreuse, standard, restrictive)',
        impactPreview: { target: 'satisfaction', type: 'mixed', description: 'Arbitrage coûts/satisfaction' },
        delay: 0,
    },
];

// ============================================
// LEVER CATALOG - EXPERT (future, for teasing)
// ============================================

const EXPERT_LEVERS: LeverGatingConfig[] = [
    {
        id: 'LEV-IT-05a',
        name: 'IA Fraude',
        category: 'IT_DATA',
        minDifficulty: 'expert',
        cost: { budgetUnits: 3, recurring: true },
        description: 'Déployer des modèles IA pour la détection de fraude avancée',
        impactPreview: { target: 'IPP', type: 'positive', description: 'Détection fraude +40%' },
        delay: 6,
    },
    {
        id: 'LEV-SIN-02-N3',
        name: 'Lutte anti-fraude N3',
        category: 'SINISTRES',
        minDifficulty: 'expert',
        cost: { budgetUnits: 4, recurring: false },
        description: 'IA prédictive intégrée pour la détection de fraude',
        impactPreview: { target: 'IPP', type: 'positive', description: 'Fraude évitée +30%' },
        delay: 4,
    },
    {
        id: 'LEV-CONF-03',
        name: 'Audit délégataires',
        category: 'CONFORMITE',
        minDifficulty: 'expert',
        cost: { budgetUnits: 2, recurring: true },
        description: 'Audit continu des délégataires et affinitaires',
        impactPreview: { target: 'CTRL_MATURITY', type: 'positive', description: 'Qualité réseau' },
        delay: 4,
    },
    {
        id: 'LEV-DIS-03',
        name: 'Gestion concentration',
        category: 'DISTRIBUTION',
        minDifficulty: 'expert',
        cost: { budgetUnits: 2, recurring: true },
        description: 'Gérer la concentration des apporteurs (plafonds, diversification)',
        impactPreview: { target: 'IRF', type: 'positive', description: 'Réduit risque concentration' },
        delay: 2,
    },
];

// ============================================
// COMBINED CATALOG
// ============================================

/**
 * Complete lever gating catalog
 * Combines all difficulty levels
 */
export const LEVER_GATING_CATALOG: LeverGatingConfig[] = [
    ...NOVICE_LEVERS,
    ...INTERMEDIATE_LEVERS,
    ...EXPERT_LEVERS,
];

/**
 * Lever IDs grouped by difficulty for quick lookup
 */
export const LEVER_IDS_BY_DIFFICULTY: Record<GatingDifficulty, string[]> = {
    novice: NOVICE_LEVERS.map(l => l.id),
    intermediate: [...NOVICE_LEVERS, ...INTERMEDIATE_LEVERS].map(l => l.id),
    expert: LEVER_GATING_CATALOG.map(l => l.id),
};

/**
 * Count of levers by difficulty
 */
export const LEVER_COUNTS: Record<GatingDifficulty, number> = {
    novice: NOVICE_LEVERS.length,
    intermediate: NOVICE_LEVERS.length + INTERMEDIATE_LEVERS.length,
    expert: LEVER_GATING_CATALOG.length,
};
