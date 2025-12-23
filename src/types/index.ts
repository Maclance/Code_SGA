/**
 * Types principaux pour AssurManager - Le Défi IARD
 */

// ============================================
// COMPAGNIES
// ============================================

export interface Compagnie {
    id: string
    nom: string
    description: string
    logo?: string
    traits: Trait[]
    stats_initiales: StatsCompagnie
}

export interface Trait {
    id: string
    nom: string
    description: string
    effet: EffetTrait
}

export interface EffetTrait {
    indice: IndiceType
    modificateur: number // ex: +5, -10
    type: 'bonus' | 'malus'
}

export interface StatsCompagnie {
    parts_marche: Record<ProduitType, number>
    effectifs: EffectifsRepartition
    maturite_it: number // 0-100
    reputation: number // 0-100
}

// ============================================
// PRODUITS
// ============================================

export type ProduitType = 'auto' | 'mrh' | 'pj' | 'gav'

export interface Produit {
    type: ProduitType
    nom: string
    actif: boolean
    metriques: MetriquesProduit
}

export interface MetriquesProduit {
    nb_contrats: number
    primes_collectees: number
    stock_sinistres: number
    taux_resiliation: number
    taux_acquisition: number
    frequence_sinistres: number
    cout_moyen_sinistre: number
}

// ============================================
// INDICES SYSTÉMIQUES
// ============================================

export type IndiceType =
    | 'IAC'   // Indice Attractivité Commerciale
    | 'IPQO'  // Indice Performance & Qualité Opérationnelle
    | 'IERH'  // Indice Équilibre RH
    | 'IRF'   // Indice Résilience Financière
    | 'IMD'   // Indice Maturité Data
    | 'IS'    // Indice de Sincérité (Boni/Mali)
    | 'IPP'   // Indice Performance P&L

export interface IndiceValeur {
    type: IndiceType
    valeur: number        // 0-100
    tendance: 'up' | 'down' | 'stable'
    variation: number     // variation depuis dernier tour
}

export interface IndicesEtat {
    IAC: IndiceValeur
    IPQO: IndiceValeur
    IERH: IndiceValeur
    IRF: IndiceValeur
    IMD: IndiceValeur
    IS: IndiceValeur
    IPP: IndiceValeur
}

// ============================================
// EFFECTIFS & RH
// ============================================

export interface EffectifsRepartition {
    sinistres: number
    distribution: number
    data_it: number
    support: number
    total: number
}

// ============================================
// P&L SIMPLIFIÉ
// ============================================

export interface PnL {
    primes_acquises: number
    charge_sinistres: number
    frais_gestion: number
    commissions: number
    cout_reassurance: number
    resultat_technique: number
    produits_financiers: number
    resultat_net: number
}

// ============================================
// LEVIERS / DÉCISIONS
// ============================================

export type LevierId =
    // Produit
    | 'L-PROD-01' | 'L-PROD-02' | 'L-PROD-03' | 'L-PROD-04'
    // Distribution
    | 'L-DIST-01' | 'L-DIST-02' | 'L-DIST-03'
    // Marketing
    | 'L-MKT-01' | 'L-MKT-02'
    // RH
    | 'L-RH-01' | 'L-RH-02' | 'L-RH-03'
    // IT/Data
    | 'L-IT-01' | 'L-DATA-01' | 'L-AI-01'
    // Prestataires
    | 'L-PART-01' | 'L-PART-02'
    // Sinistres & Fraude
    | 'L-SIN-01' | 'L-FRAUDE-01' | 'L-FRAUDE-02' | 'L-FRAUDE-03'
    // Réassurance
    | 'L-REASS-01' | 'L-REASS-02'
    // Prévention
    | 'L-PREV-01' | 'L-PREV-02'
    // Provisions & Placements
    | 'L-PROV-01' | 'L-INV-01'

export interface Levier {
    id: LevierId
    nom: string
    description: string
    categorie: LevierCategorie
    disponible_difficulte: Difficulte[]
    valeur_min: number
    valeur_max: number
    valeur_defaut: number
    effet_retard_tours: number  // 0 = immédiat
    indices_impactes: IndiceType[]
}

export type LevierCategorie =
    | 'produit'
    | 'distribution'
    | 'marketing'
    | 'rh'
    | 'it_data'
    | 'prestataires'
    | 'sinistres'
    | 'reassurance'
    | 'prevention'
    | 'provisions'

export interface DecisionLevier {
    levier_id: LevierId
    valeur: number
    produit?: ProduitType  // si applicable par produit
}

// ============================================
// ÉVÉNEMENTS
// ============================================

export type EvenementType = 'marche' | 'compagnie'

export interface Evenement {
    id: string
    type: EvenementType
    nom: string
    description: string
    duree_tours: number
    probabilite_base: number
    conditions?: ConditionEvenement[]
    effets: EffetEvenement[]
}

export interface ConditionEvenement {
    indice: IndiceType
    operateur: 'lt' | 'gt' | 'eq'
    seuil: number
}

export interface EffetEvenement {
    indice?: IndiceType
    produit?: ProduitType
    modificateur: number
    type: 'absolu' | 'pourcentage'
}

export interface EvenementActif extends Evenement {
    tour_debut: number
    tours_restants: number
}

// ============================================
// PARTIE / SESSION
// ============================================

export type Difficulte = 'novice' | 'intermediaire' | 'expert' | 'survie'
export type Vitesse = 'rapide' | 'moyenne' | 'lente'  // année / trimestre / mois
export type StatutSession = 'brouillon' | 'prete' | 'lancee' | 'terminee'

export interface Session {
    id: string
    tenant_id: string
    code_acces: string
    nom: string
    statut: StatutSession
    difficulte: Difficulte
    vitesse: Vitesse
    produits_actifs: ProduitType[]
    duree_tours: number
    tour_actuel: number
    created_at: string
    updated_at: string
}

export interface EtatPartie {
    session_id: string
    joueur_id: string
    compagnie_id: string
    tour: number
    indices: IndicesEtat
    pnl: PnL
    produits: Produit[]
    effectifs: EffectifsRepartition
    evenements_actifs: EvenementActif[]
    decisions_tour: DecisionLevier[]
    score: number
}

// ============================================
// UTILISATEURS & AUTH
// ============================================

export type Role = 'super_admin' | 'admin_tenant' | 'formateur' | 'joueur' | 'observateur' | 'chef_equipe'

export interface Utilisateur {
    id: string
    email: string
    nom: string
    role: Role
    tenant_id: string
    created_at: string
}

export interface Tenant {
    id: string
    nom: string
    branding?: TenantBranding
    created_at: string
}

export interface TenantBranding {
    logo_url?: string
    couleur_primaire?: string
    couleur_secondaire?: string
}
