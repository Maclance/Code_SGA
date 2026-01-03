/**
 * Event Formatter - Narrative Generation
 *
 * @module lib/engine/events/event-formatter
 * @description Formats events into engaging journalistic narratives (US-033)
 *
 * References:
 * - docs/20_simulation/events_catalogue.md (event templates)
 * - docs/000_projet/specs_fonctionnelles_mvp.md (US-033 AC3)
 */

import type { GameEvent, EventImpact, EventSeverity } from './event-types';

// ============================================
// EVENT TYPE ENUM (for formatter lookup)
// ============================================

/**
 * Event type enum for narrative template lookup
 */
export enum EventTypeEnum {
    CLIMATE_EPISODE = 'CLIMATE_EPISODE',
    INFLATION = 'INFLATION',
    REGULATION = 'REGULATION',
    DISRUPTOR = 'DISRUPTOR',
    ELECTRIFICATION = 'ELECTRIFICATION',
    CYBER_ATTACK = 'CYBER_ATTACK',
    SYSTEM_FAILURE = 'SYSTEM_FAILURE',
    HR_CRISIS = 'HR_CRISIS',
    PROVIDER_FAILURE = 'PROVIDER_FAILURE',
    LITIGATION = 'LITIGATION',
}

// ============================================
// NARRATIVE TEMPLATES
// ============================================

interface NarrativeTemplate {
    low: string;
    medium: string;
    high: string;
    critical: string;
}

/**
 * Narrative templates per event type
 * Each narrative must be ≥50 characters (AC3)
 */
const NARRATIVE_TEMPLATES: Record<EventTypeEnum, NarrativeTemplate> = {
    [EventTypeEnum.CLIMATE_EPISODE]: {
        low: "Des intempéries localisées provoquent quelques dégâts matériels dans certaines régions.",
        medium: "Une série d'événements climatiques frappe plusieurs régions, augmentant la sinistralité MRH.",
        high: "Une tempête majeure s'abat sur le territoire, provoquant d'importants dégâts aux habitations.",
        critical: "Catastrophe naturelle historique : une tempête dévastatrice paralyse plusieurs départements et génère un afflux massif de sinistres.",
    },
    [EventTypeEnum.INFLATION]: {
        low: "Une légère hausse des coûts de réparation est observée sur le marché automobile.",
        medium: "L'inflation persistante impacte significativement les coûts de sinistres et les marges techniques.",
        high: "La poussée inflationniste accélère, mettant sous pression les ratios techniques du secteur.",
        critical: "Choc inflationniste majeur : les coûts de réparation explosent, menaçant l'équilibre du portefeuille.",
    },
    [EventTypeEnum.REGULATION]: {
        low: "De nouvelles obligations de reporting entrent en vigueur pour les assureurs IARD.",
        medium: "Le régulateur renforce les contraintes de solvabilité et les exigences de conformité.",
        high: "Une directive européenne impose une restructuration majeure des pratiques commerciales.",
        critical: "Révolution réglementaire : l'ACPR impose des mesures de redressement immédiates au secteur.",
    },
    [EventTypeEnum.DISRUPTOR]: {
        low: "Une nouvelle insurtech fait son entrée discrète sur le segment de l'assurance auto.",
        medium: "Un concurrent digital agressif bouscule les prix du marché avec des offres innovantes.",
        high: "Le nouvel entrant capte rapidement des parts de marché grâce à une expérience client révolutionnaire.",
        critical: "Disruption majeure : l'acteur digital révolutionne les standards du marché et menace les acteurs traditionnels.",
    },
    [EventTypeEnum.ELECTRIFICATION]: {
        low: "La part des véhicules électriques augmente progressivement dans le parc automobile français.",
        medium: "L'électrification accélérée du parc auto modifie les coûts moyens de réparation.",
        high: "La mutation rapide vers l'électrique met sous tension les réseaux de réparateurs agréés.",
        critical: "Transition brutale : l'explosion des véhicules électriques bouleverse toute la chaîne de sinistres auto.",
    },
    [EventTypeEnum.CYBER_ATTACK]: {
        low: "Une tentative d'intrusion informatique a été détectée et contenue par les équipes IT.",
        medium: "Un incident cyber affecte plusieurs systèmes et ralentit temporairement les opérations.",
        high: "Cyberattaque en cours : des systèmes critiques sont compromis, impactant la gestion des sinistres.",
        critical: "Attaque majeure : ransomware généralisé paralysant l'ensemble des systèmes d'information de la compagnie.",
    },
    [EventTypeEnum.SYSTEM_FAILURE]: {
        low: "Un incident technique mineur perturbe temporairement certaines applications métier.",
        medium: "Une panne système affecte la productivité des équipes de gestion pendant plusieurs heures.",
        high: "Défaillance majeure du SI : plusieurs processus critiques sont à l'arrêt depuis ce matin.",
        critical: "Panne généralisée : l'infrastructure informatique est indisponible, bloquant toute l'activité opérationnelle.",
    },
    [EventTypeEnum.HR_CRISIS]: {
        low: "Des signaux faibles de tension sociale émergent au sein des équipes opérationnelles.",
        medium: "Un mouvement de mécontentement prend de l'ampleur, des négociations sont en cours avec les syndicats.",
        high: "Conflit social : un préavis de grève a été déposé par les organisations syndicales.",
        critical: "Crise RH majeure : grève illimitée et vague de démissions menacent la continuité opérationnelle.",
    },
    [EventTypeEnum.PROVIDER_FAILURE]: {
        low: "Un partenaire rencontre des difficultés temporaires affectant quelques dossiers.",
        medium: "La défaillance d'un prestataire clé nécessite l'activation du plan de continuité.",
        high: "Rupture de service critique : un prestataire majeur ne peut plus honorer ses engagements.",
        critical: "Faillite d'un prestataire stratégique : l'externalisation se retourne contre la compagnie.",
    },
    [EventTypeEnum.LITIGATION]: {
        low: "Une réclamation client fait l'objet d'une médiation auprès de l'organisme compétent.",
        medium: "L'ACPR lance une inspection sur certaines pratiques commerciales de la compagnie.",
        high: "Un litige collectif est engagé par une association de consommateurs contre la compagnie.",
        critical: "Sanction majeure : amende record de l'ACPR et obligation de remédiation immédiate.",
    },
};

// ============================================
// IMPACT BADGE HELPERS
// ============================================

export interface ImpactBadgeResult {
    label: string;
    type: 'positive' | 'negative' | 'neutral';
    icon: string;
}

/**
 * Calculate the overall impact type from a list of impacts
 */
export function formatImpactBadge(impacts: EventImpact[]): ImpactBadgeResult {
    if (impacts.length === 0) {
        return { label: 'Impact neutre', type: 'neutral', icon: '⚪' };
    }

    const totalValue = impacts.reduce((sum, impact) => sum + impact.value, 0);

    if (totalValue > 0) {
        return { label: `+${totalValue} points`, type: 'positive', icon: '✅' };
    } else if (totalValue < 0) {
        return { label: `${totalValue} points`, type: 'negative', icon: '❌' };
    } else {
        return { label: 'Impact neutre', type: 'neutral', icon: '⚪' };
    }
}

/**
 * Format individual impact for display
 */
export function formatSingleImpact(impact: EventImpact): string {
    const sign = impact.value >= 0 ? '+' : '';
    const unit = impact.type === 'relative' ? '%' : '';
    return `${impact.target}: ${sign}${impact.value}${unit}`;
}

// ============================================
// NARRATIVE FORMATTER
// ============================================

interface FormatterEventInput {
    type: EventTypeEnum;
    severity?: EventSeverity;
    impactMRH?: number;
    impactAuto?: number;
    rate?: number;
    duration?: number | string;
    priceImpact?: number;
}

/**
 * Format an event into an engaging narrative
 * @param event Event data for formatting
 * @returns Narrative string (≥50 characters per AC3)
 */
export function formatEventNarrative(event: FormatterEventInput): string {
    const template = NARRATIVE_TEMPLATES[event.type];
    const severity = event.severity || 'medium';

    if (!template) {
        return "Un événement inattendu affecte les opérations de la compagnie.";
    }

    let narrative = template[severity];

    // Inject specific values if provided
    if (event.impactMRH !== undefined) {
        narrative = narrative.replace('{impactMRH}', `${event.impactMRH}%`);
    }
    if (event.impactAuto !== undefined) {
        narrative = narrative.replace('{impactAuto}', `${event.impactAuto}%`);
    }
    if (event.rate !== undefined) {
        narrative = narrative.replace('{rate}', `${event.rate}%`);
    }
    if (event.priceImpact !== undefined) {
        narrative = narrative.replace('{priceImpact}', `${event.priceImpact}%`);
    }

    return narrative;
}

/**
 * Get narrative from a GameEvent
 */
export function getEventNarrative(event: GameEvent): string {
    // If event already has a narrative, use it
    if (event.narrative && event.narrative.length >= 50) {
        return event.narrative;
    }

    // Map category to EventTypeEnum
    const categoryToType: Record<string, EventTypeEnum> = {
        'CLIMAT': EventTypeEnum.CLIMATE_EPISODE,
        'ECONOMIQUE': EventTypeEnum.INFLATION,
        'REGLEMENTAIRE': EventTypeEnum.REGULATION,
        'TECHNOLOGIQUE': EventTypeEnum.DISRUPTOR,
        'CYBER': EventTypeEnum.CYBER_ATTACK,
        'OPERATIONNEL': EventTypeEnum.SYSTEM_FAILURE,
        'RH': EventTypeEnum.HR_CRISIS,
    };

    const eventType = categoryToType[event.category] || EventTypeEnum.CLIMATE_EPISODE;

    return formatEventNarrative({
        type: eventType,
        severity: event.severity,
    });
}

// ============================================
// DURATION HELPERS
// ============================================

/**
 * Get remaining duration for an event
 */
export function getRemainingDuration(event: GameEvent, currentTurn: number): number {
    const turnsElapsed = currentTurn - event.turnTriggered;
    return Math.max(0, event.duration - turnsElapsed);
}

/**
 * Format duration for display
 */
export function formatDuration(duration: number): string {
    if (duration === 0) {
        return 'Se termine ce tour';
    } else if (duration === 1) {
        return '1 tour restant';
    } else {
        return `${duration} tours restants`;
    }
}

/**
 * Check if an event is still active
 */
export function isEventActive(event: GameEvent, currentTurn: number): boolean {
    return getRemainingDuration(event, currentTurn) > 0;
}
