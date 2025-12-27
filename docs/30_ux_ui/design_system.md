# design_system.md — Design System AssurManager

**Version** : 1.1  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-27  
**Auteur** : UX/UI Designer

> **CHANGELOG**
> - **2025-12-27** : Ajout tokens pour indices secondaires, alignement PRD §8.5.

---

## 1) Principes de design

### 1.1 Philosophie

| Principe | Description |
|----------|-------------|
| **Cockpit** | Interface lisible en 3 minutes, hiérarchie visuelle claire |
| **Progressive disclosure** | Novice = macro, Expert = détails disponibles |
| **Explainability** | Chaque donnée a un tooltip explicatif |
| **Feedforward** | Indiquer l'impact avant la décision |

### 1.2 Modes d'affichage

| Mode | Usage | Caractéristiques |
|------|-------|------------------|
| **Standard** | Joueur individuel | Détails complets, interactions riches |
| **Projection** | Séminaire grand écran | Taille ×1.5, contraste renforcé |
| **Compact** | Mobile/tablette | Priorité aux indices, collapse sections |

---

## 2) Palette de couleurs

### 2.1 Couleurs primaires

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#2563EB` | Actions principales, liens, focus |
| `--color-primary-hover` | `#1D4ED8` | Hover sur primaire |
| `--color-primary-light` | `#DBEAFE` | Backgrounds légers |

### 2.2 Couleurs sémantiques

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#10B981` | Indices ↑, validation, succès |
| `--color-warning` | `#F59E0B` | Alertes modérées, indices 30-50 |
| `--color-danger` | `#EF4444` | Alertes critiques, indices < 30 |
| `--color-info` | `#3B82F6` | Informations, événements marché |
| `--color-neutral` | `#6B7280` | Texte secondaire, valeurs stables |

### 2.3 Couleurs de fond

| Token | Hex (Light) | Hex (Dark) | Usage |
|-------|-------------|------------|-------|
| `--bg-primary` | `#FFFFFF` | `#1F2937` | Fond principal |
| `--bg-secondary` | `#F9FAFB` | `#111827` | Fond secondaire |
| `--bg-card` | `#FFFFFF` | `#374151` | Cards, modals |
| `--bg-overlay` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Modals overlay |

### 2.4 Indicateurs et indices

| Indice | Seuil | Couleur | Token |
|--------|-------|---------|-------|
| Critique | < 30 | Rouge | `--color-index-critical` |
| Warning | 30-50 | Orange | `--color-index-warning` |
| Normal | 50-70 | Jaune | `--color-index-normal` |
| Bon | ≥ 70 | Vert | `--color-index-good` |

---

## 3) Typographie

### 3.1 Famille de polices

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Échelle typographique

| Token | Taille | Poids | Usage |
|-------|--------|-------|-------|
| `--text-xs` | 12px | 400 | Labels, badges |
| `--text-sm` | 14px | 400 | Texte secondaire |
| `--text-base` | 16px | 400 | Corps de texte |
| `--text-lg` | 18px | 500 | Sous-titres |
| `--text-xl` | 20px | 600 | Titres de section |
| `--text-2xl` | 24px | 700 | Titres d'écran |
| `--text-3xl` | 30px | 700 | Scores, valeurs principales |
| `--text-4xl` | 36px | 800 | Mode projection |

### 3.3 Données chiffrées

```css
/* Chiffres du cockpit */
.value-primary {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  font-feature-settings: 'tnum' 1; /* Tabular numbers */
}

/* Deltas */
.value-delta {
  font-size: var(--text-sm);
  font-weight: 600;
}
.value-delta--positive { color: var(--color-success); }
.value-delta--negative { color: var(--color-danger); }
.value-delta--neutral { color: var(--color-neutral); }
```

---

## 4) Espacements et grille

### 4.1 Tokens d'espacement

| Token | Valeur | Usage |
|-------|--------|-------|
| `--space-1` | 4px | Micro-espacements |
| `--space-2` | 8px | Entre éléments proches |
| `--space-3` | 12px | Padding interne cards |
| `--space-4` | 16px | Espacement standard |
| `--space-6` | 24px | Entre sections |
| `--space-8` | 32px | Marges conteneurs |
| `--space-12` | 48px | Séparations majeures |

### 4.2 Grille responsive

```css
/* Cockpit grid */
.cockpit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

/* Cards produits */
.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* Auto, MRH, Total */
  gap: var(--space-4);
}
```

### 4.3 Breakpoints

| Token | Valeur | Usage |
|-------|--------|-------|
| `--bp-sm` | 640px | Mobile |
| `--bp-md` | 768px | Tablette |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Large desktop |
| `--bp-2xl` | 1536px | Mode projection |

---

## 5) Composants de base

### 5.1 Boutons

#### Types

| Variante | Usage | Style |
|----------|-------|-------|
| `btn-primary` | Actions principales | Fond primaire, texte blanc |
| `btn-secondary` | Actions secondaires | Border primaire, fond transparent |
| `btn-ghost` | Actions tertiaires | Texte uniquement |
| `btn-danger` | Actions destructives | Fond danger |

#### États

| État | Transformation |
|------|----------------|
| Default | — |
| Hover | Background +10% dark, elevation |
| Active | Scale 0.98 |
| Focus | Ring 2px primaire |
| Disabled | Opacity 0.5, cursor not-allowed |
| Loading | Spinner + texte "Chargement..." |

#### Tailles

| Taille | Padding | Font-size |
|--------|---------|-----------|
| `btn-sm` | 8px 12px | 14px |
| `btn-md` | 12px 20px | 16px |
| `btn-lg` | 16px 28px | 18px |

### 5.2 Inputs

#### Types

| Type | Usage |
|------|-------|
| `input-text` | Saisie texte standard |
| `input-number` | Valeurs numériques |
| `input-select` | Sélection dropdown |
| `input-slider` | Ajustement valeurs (leviers) |

#### États

| État | Style |
|------|-------|
| Default | Border grise 1px |
| Focus | Border primaire 2px, ring léger |
| Error | Border danger, message sous input |
| Disabled | Background gris, opacity 0.7 |
| Valid | Border success, check icon |

### 5.3 Cards

```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms, transform 200ms;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card--selected {
  border: 2px solid var(--color-primary);
}
```

### 5.4 Modals

| Élément | Style |
|---------|-------|
| Overlay | Fond semi-transparent, click = fermer |
| Container | Max-width 600px, centré, border-radius |
| Header | Titre + bouton fermer (×) |
| Content | Scrollable si long |
| Footer | Boutons actions (Annuler / Confirmer) |

**Animation** : Fade-in 200ms + scale 0.95 → 1

### 5.5 Toasts

| Type | Icône | Couleur | Durée |
|------|-------|---------|-------|
| Success | ✓ | Vert | 3s |
| Error | ✕ | Rouge | 5s (+ action) |
| Warning | ⚠ | Orange | 4s |
| Info | ℹ | Bleu | 3s |

**Position** : Bottom-right, stack vertical  
**Animation** : Slide-in 300ms, auto-dismiss

---

## 6) Composants métier

### 6.1 Indicateur d'indice (Gauge)

```
┌─────────────────────────────┐
│  IAC                   62   │
│  ████████████░░░░░░░░  ↓4   │
│  Attractivité Commerciale   │
└─────────────────────────────┘
```

| Élément | Données |
|---------|---------|
| Label | Acronyme (IAC) |
| Valeur | 0-100 |
| Jauge | Remplie proportionnellement |
| Delta | ↑/↓ + valeur |
| Tooltip | Définition + historique |

**Couleur jauge** : Selon seuils (< 30 rouge, < 50 orange, ≥ 70 vert)

### 6.2 Radar 7 axes

```
         IAC (62)
           ╱╲
          ╱  ╲
    IPP ──    ── IPQO
         │  │
    IS ──┼──┼── IERH
         │  │
    IMD ──    ── IRF
```

| Propriété | Valeur |
|-----------|--------|
| Axes | 7 indices normalisés 0-100 |
| Ligne joueur | Primaire, rempli 20% opacity |
| Ligne marché | Gris pointillé (comparaison) |
| Hover | Tooltip avec valeur + delta |

### 6.3 Card Événement

```
┌─────────────────────────────────────────┐
│  🌍 MARCHÉ                      [Détails]│
├─────────────────────────────────────────┤
│  Épisode climatique majeur              │
│                                         │
│  Impact: Sinistralité ↑↑   Durée: 2T    │
│                                         │
│  [────────── Description ──────────]    │
│                                         │
│              [Compris ✓]                │
└─────────────────────────────────────────┘
```

| Type | Badge | Couleur fond |
|------|-------|--------------|
| Marché | 🌍 | Bleu clair |
| Compagnie | 🏢 | Orange clair |

### 6.4 Card Levier

```
┌─────────────────────────────────────────┐
│  Tarif Auto                    Coût: 1  │
├─────────────────────────────────────────┤
│  ◀───────────●───────────▶              │
│  -10%      Actuel       +10%            │
│                                         │
│  Impact: IAC ↓ court terme              │
│          IPP ↑ moyen terme              │
│  Délai: Immédiat                        │
│                                         │
│  [  Appliquer  ]                        │
└─────────────────────────────────────────┘
```

**États du levier** :

| État | Affichage |
|------|-----------|
| Disponible | Interactif normal |
| Appliqué | Check + désactivé |
| Budget insuffisant | Grisé + tooltip |
| Prérequis manquant | Grisé + message |

### 6.5 Alerte

```
┌─────────────────────────────────────────┐
│ 🔴 ALERTE CRITIQUE                      │
│                                         │
│ IRF < 35 : Résilience financière faible │
│                                         │
│ Leviers conseillés : Réassurance,       │
│ Provisions prudentes                    │
│                                         │
│ [Voir les leviers →]                    │
└─────────────────────────────────────────┘
```

| Niveau | Icône | Couleur | Animation |
|--------|-------|---------|-----------|
| Critique | 🔴 | Rouge | Pulse |
| Warning | 🟠 | Orange | — |
| Info | 🔵 | Bleu | — |

### 6.6 Badge

| Type | Usage | Style |
|------|-------|-------|
| `badge-status` | Statut session | Pill, couleur selon état |
| `badge-difficulty` | Novice/Intermédiaire | Pill, primaire |
| `badge-product` | Auto/MRH | Pill outline |
| `badge-count` | Notifications | Circle, danger |

### 6.7 Stepper (Wizard)

```
  ●────────●────────○────────○
  Params   Produits  Diffic.  Recap
  ✓ Done   ● Current ○ Todo   ○ Todo
```

---

## 7) Micro-interactions

### 7.1 Transitions globales

| Élément | Propriété | Durée | Easing |
|---------|-----------|-------|--------|
| Boutons | all | 200ms | ease-out |
| Cards (hover) | transform, shadow | 200ms | ease-out |
| Modals | opacity, transform | 300ms | ease-out |
| Pages | opacity | 300ms | ease-in-out |
| Jauges | width | 500ms | ease-out |

### 7.2 Feedback immédiat

| Action | Feedback |
|--------|----------|
| Clic bouton | Ripple effect |
| Slider move | Valeur et impact en temps réel |
| Décision appliquée | Card ajoutée avec slide-in |
| Décision annulée | Card supprimée avec fade-out |
| Erreur validation | Shake + border rouge |
| Succès validation | Check animation |

### 7.3 Animations spécifiques

#### CountUp (chiffres)

```javascript
// Durée : 800ms
// Easing : ease-out
// Trigger : apparition ou changement
```

#### Radar draw

```javascript
// Durée : 600ms
// Animation : path drawing de 0 à valeur
// Trigger : chargement cockpit
```

#### Confetti (score > 80)

```javascript
// Durée : 2000ms
// Particules : 50
// Trigger : affichage score final
```

### 7.4 États de chargement

| Composant | Loading state |
|-----------|---------------|
| Cards | Skeleton (pulse gris) |
| Graphiques | Skeleton + outline |
| Boutons | Spinner inline |
| Pages | Full skeleton layout |

---

## 8) Tokens CSS complets

```css
:root {
  /* Colors */
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-primary-light: #DBEAFE;
  
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #3B82F6;
  --color-neutral: #6B7280;
  
  --color-index-critical: #EF4444;
  --color-index-warning: #F59E0B;
  --color-index-normal: #EAB308;
  --color-index-good: #10B981;
  
  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-card: #FFFFFF;
  --bg-overlay: rgba(0, 0, 0, 0.5);
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 200ms ease-out;
  --transition-slow: 300ms ease-out;
  
  /* Z-index */
  --z-dropdown: 10;
  --z-modal: 50;
  --z-toast: 100;
}
```

---

## 9) Décisions / Risques / Checklist

### Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| DS-01 | Inter comme police principale | Lisibilité, caractères tabulaires |
| DS-02 | Seuils fixes pour couleurs indices | Cohérence avec gameplay_core.md |
| DS-03 | Skeleton loading partout | Perception de rapidité |
| DS-04 | Animations < 300ms | Feedback sans latence perçue |

### Risques

| Risque | Mitigation |
|--------|------------|
| Incohérence couleurs entre devs | Tokens CSS centralisés |
| Animations trop lourdes | Respect de `prefers-reduced-motion` |
| Mode projection oublié | Tests dédiés sur grand écran |

### Checklist

- [x] Palette couleurs définie avec tokens
- [x] Typographie et échelle documentées
- [x] Composants de base spécifiés
- [x] Composants métier spécifiés
- [x] Micro-interactions listées
- [x] Tokens CSS exportables
