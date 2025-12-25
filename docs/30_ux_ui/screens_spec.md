# screens_spec.md — Spécifications Écran par Écran

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Auteur** : UX/UI Designer

---

## 1) Vue d'ensemble des écrans MVP

| ID | Écran | Rôle concerné | Phase |
|----|-------|---------------|-------|
| S01 | Login / Inscription | Tous | Auth |
| S02 | Dashboard Admin | Admin tenant | Admin |
| S03 | Dashboard Formateur | Formateur | Admin |
| S04 | Lobby / Sélection compagnie | Joueur | Onboarding |
| S05 | Cockpit (Dashboard principal) | Joueur | Tour - Lecture |
| S06 | News Flash (Événements) | Joueur | Tour - Événements |
| S07 | Décisions (Leviers) | Joueur | Tour - Décisions |
| S08 | Vue Marché | Joueur | Tour - Lecture |
| S09 | Feedback (Résolution) | Joueur | Tour - Feedback |
| S10 | Debrief Fin de Partie | Joueur | Fin |

---

## 2) S01 — Login / Inscription

### Contenu

| Zone | Éléments |
|------|----------|
| Header | Logo AssurManager |
| Formulaire Login | Email, Mot de passe, Bouton "Connexion" |
| Liens | "Mot de passe oublié", "Créer un compte" |
| Footer | Mentions légales, version |

### Layout

```
┌─────────────────────────────────────┐
│           [LOGO]                    │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │  Email                      │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │  Mot de passe          [👁] │   │
│   └─────────────────────────────┘   │
│                                     │
│   [      Se connecter      ]        │
│                                     │
│   Mot de passe oublié ?             │
│   Créer un compte                   │
│                                     │
└─────────────────────────────────────┘
```

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Default** | Formulaire vide prêt | Arrivée sur page |
| **Loading** | Spinner sur bouton, inputs disabled | Clic connexion |
| **Error** | Message rouge sous input concerné | Validation échouée |
| **Success** | Redirection vers Dashboard | Auth réussie |

### Erreurs spécifiques

| Code | Message | Emplacement |
|------|---------|-------------|
| AUTH_INVALID | "Email ou mot de passe incorrect" | Sous formulaire |
| AUTH_LOCKED | "Compte verrouillé. Contactez l'admin." | Modal |
| NETWORK | "Connexion impossible. Réessayez." | Toast |

### Micro-interactions

- **Focus input** : Border devient primaire (2px)
- **Validation temps réel** : Check vert si email valide
- **Visibilité MDP** : Toggle œil avec animation
- **Bouton submit** : Ripple effect au clic

### Accessibilité

- `aria-label` sur toggle visibilité mot de passe
- `aria-invalid="true"` + `aria-describedby` sur erreurs
- Focus automatique sur premier champ au chargement

---

## 3) S02 — Dashboard Admin

### Contenu

| Zone | Éléments |
|------|----------|
| Sidebar | Navigation (Utilisateurs, Sessions, Logs, Politiques) |
| Header | Nom tenant, Profil, Déconnexion |
| Main | Cards statistiques + Actions rapides |

### Statistiques affichées

- Utilisateurs actifs / Total
- Sessions en cours / Terminées
- Dernière activité

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton sur cards stats | Chargement initial |
| **Empty** | "Aucune session créée. Commencez ici." + CTA | Nouveau tenant |
| **Error** | Banner "Erreur de chargement" + Retry | Erreur API |
| **Success** | Données affichées | Données OK |

---

## 4) S03 — Dashboard Formateur

### Contenu

| Zone | Éléments |
|------|----------|
| Header | Titre "Mes Sessions", Bouton "+ Nouvelle Session" |
| Liste | Cards sessions (Brouillon / Prête / En cours / Terminée) |
| Actions | Dupliquer, Modifier, Supprimer, Lancer |

### Card Session

```
┌─────────────────────────────────────┐
│  [Statut]              [Menu ...]   │
│                                     │
│  Nom de la session                  │
│  Auto + MRH | Intermédiaire | 12T   │
│                                     │
│  5/20 joueurs | Créée le 25/12      │
│                                     │
│  [  Lancer  ]  [  Modifier  ]       │
└─────────────────────────────────────┘
```

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton cards | Chargement |
| **Empty** | Illustration + "Créez votre première session" | 0 sessions |
| **Error** | Toast erreur + Retry | Erreur API |
| **Success** | Liste des sessions | Données OK |

---

## 5) S04 — Lobby / Sélection Compagnie

### Contenu

| Zone | Éléments |
|------|----------|
| Header | Nom session, Code, Nb joueurs connectés |
| Grille | 18 compagnies (cards clickables) |
| Sidebar | Fiche compagnie sélectionnée |
| Footer | Bouton "Confirmer mon choix" |

### Card Compagnie (grille)

```
┌─────────────┐
│   [Logo]    │
│  Nom court  │
│  ★★★☆☆     │
│ Trait1 Tr2  │
└─────────────┘
```

### Fiche Compagnie (sidebar)

| Section | Contenu |
|---------|---------|
| Identité | Logo, Nom complet, Baseline |
| Traits | 3-5 traits avec icônes |
| Forces | Points forts (vert) |
| Faiblesses | Points faibles (orange) |
| Indices initiaux | Mini radar preview |

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton grille | Chargement compagnies |
| **Empty** | N/A (toujours 18 compagnies) | — |
| **Error** | Modal "Impossible de charger" + Retry | Erreur API |
| **Success** | Grille complète + interactions | Données OK |
| **Selected** | Compagnie highlight + Sidebar ouverte | Clic compagnie |
| **Confirmed** | Grille grisée, "En attente du lancement" | Confirmation |

### Micro-interactions

- **Hover card** : Élévation + border primaire
- **Sélection** : Scale 1.05 + check overlay
- **Confirmation** : Confetti animation (subtil)

---

## 6) S05 — Cockpit (Dashboard Principal)

> Phase : LECTURE du tour

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tour 3/12       [Indicateurs par produit ▼]    [Menu ...]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────┐   │
│  │   RADAR     │  │          ALERTES ACTIVES            │   │
│  │  7 indices  │  │  🔴 IRF < 35 : Résilience faible    │   │
│  │             │  │  🟠 Stock sinistres +12%            │   │
│  │             │  │                                     │   │
│  └─────────────┘  └─────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              INDICATEURS PAR PRODUIT                │    │
│  │  ┌──────────────┬──────────────┬──────────────┐     │    │
│  │  │     AUTO     │     MRH      │    TOTAL     │     │    │
│  │  ├──────────────┼──────────────┼──────────────┤     │    │
│  │  │ Contrats: 45K│ Contrats: 32K│ Contrats: 77K│     │    │
│  │  │ Primes: 52M€ │ Primes: 28M€ │ Primes: 80M€ │     │    │
│  │  │ Sinistres: 2K│ Sinistres: 1K│ Sinistres: 3K│     │    │
│  │  └──────────────┴──────────────┴──────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  P&L SYNTHÉTIQUE                            Δ +2.3% │    │
│  │  Primes: 80M€ | Sinistres: 52M€ | Frais: 18M€       │    │
│  │  Résultat: +10M€                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [   Voir les événements   →   ]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Composants principaux

| Composant | Données | Refresh |
|-----------|---------|---------|
| Radar 7 indices | IAC, IPQO, IERH, IRF, IMD, IS, IPP | Chaque tour |
| Alertes | Seuils franchis (< 30 critique, < 50 warning) | Chaque tour |
| Grille produits | Contrats, Primes, Stock sinistres | Chaque tour |
| P&L | Primes, Sinistres, Frais, Résultat | Chaque tour |

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton sur tous composants | Début de tour |
| **Empty** | N/A (toujours des données) | — |
| **Error** | Banner "Erreur moteur" + Retry | Erreur calcul |
| **Success** | Cockpit complet | Données calculées |

### Micro-interactions

- **Radar** : Animation draw des axes au chargement
- **Alertes** : Pulse sur nouvelles alertes
- **Valeurs** : CountUp animation sur chiffres
- **Hover indice** : Tooltip avec définition + historique mini

### Accessibilité

- Radar : Alternative textuelle pour lecteur d'écran
- Alertes : `role="alert"` + `aria-live="polite"`
- Navigation clavier entre sections (Tab)

---

## 7) S06 — News Flash (Événements)

> Phase : ÉVÉNEMENTS du tour

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tour 3/12 — ÉVÉNEMENTS                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📰 BREAKING NEWS                                   │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  🌍 ÉVÉNEMENT MARCHÉ                        │    │    │
│  │  │                                             │    │    │
│  │  │  Épisode climatique majeur                  │    │    │
│  │  │                                             │    │    │
│  │  │  Impact : Sinistralité ↑↑ | Durée : 2 tours │    │    │
│  │  │                                             │    │    │
│  │  │  "Des inondations touchent le Sud-Ouest..." │    │    │
│  │  │                                             │    │    │
│  │  │  [Détails] [Compris ✓]                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  🏢 ÉVÉNEMENT COMPAGNIE                     │    │    │
│  │  │                                             │    │    │
│  │  │  Incident SI mineur                         │    │    │
│  │  │  Impact : IPQO ↓ | Durée : 1 tour           │    │    │
│  │  │                                             │    │    │
│  │  │  [Détails] [Compris ✓]                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│              [   Prendre mes décisions   →   ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Types d'événements

| Type | Icône | Couleur | Exemple |
|------|-------|---------|---------|
| Marché | 🌍 | Bleu | Climat, Inflation, Réglementation |
| Compagnie | 🏢 | Orange | Cyber, Crise RH |

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton cards | Calcul événements |
| **Empty** | "Trimestre calme — Aucun événement majeur" | 0 événements |
| **Error** | N/A (événements offline) | — |
| **Success** | Liste des événements | ≥1 événement |

### Micro-interactions

- **Apparition** : Slide-in séquentiel (200ms délai entre cards)
- **Hover** : Élévation légère
- **Clic "Détails"** : Expand animation
- **Clic "Compris"** : Check animation + card se réduit

---

## 8) S07 — Décisions (Leviers)

> Phase : DÉCISIONS du tour

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Tour 3/12 — DÉCISIONS                Budget: ████████░░ 7/10│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Produit▼] [Distribution] [Marketing] [RH] [IT] [Sinistres]│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRODUIT — TARIFICATION                                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Auto — Niveau de prime                     Coût: 1 │    │
│  │                                                     │    │
│  │  ◀───────────●───────────▶                          │    │
│  │  -10%      Actuel +0%     +10%                      │    │
│  │                                                     │    │
│  │  Impact estimé: IAC ↓ court terme, IPP ↑ moyen terme│    │
│  │  Délai: Immédiat                                    │    │
│  │                                                     │    │
│  │  [  Appliquer  ]                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  MRH — Niveau de prime                      Coût: 1 │    │
│  │  [...]                                              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  MES DÉCISIONS CE TOUR                                      │
│  • Auto +5% prime (Coût: 1)                      [Annuler]  │
│  • Recrutement sinistres +2 (Coût: 2)            [Annuler]  │
│                                                             │
│              [   Valider mes décisions   ✓   ]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Catégories de leviers (MVP)

| Catégorie | Leviers Novice | Leviers Intermédiaire |
|-----------|----------------|----------------------|
| Produit | Tarif, Franchise | + par produit |
| Distribution | Mix canaux | + Commissions |
| Marketing | Campagne | + Ciblage |
| RH | Recrutement macro, Formation | + QVT |
| IT/Data | Invest SI, Qualité data | + détails |
| Sinistres | Capacité, Fraude N1 | + Organisation |
| Réassurance | Protection macro | — |
| Prévention | — | + Prévention |
| Provisions | Politique | — |

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton leviers | Chargement catalogue |
| **Empty** | N/A (toujours des leviers) | — |
| **Error** | Toast + Retry | Erreur API |
| **Success** | Liste complète | Données OK |
| **Budget épuisé** | Leviers non-appliquables grisés | Budget = 0 |
| **Prérequis manquant** | Levier grisé + tooltip explicatif | IMD insuffisant |

### Micro-interactions

- **Slider** : Valeur en temps réel + impact preview
- **Appliquer** : Animation ajout à la liste
- **Annuler** : Fade-out + restauration budget
- **Valider** : Confirmation modal si ≥1 décision

### Accessibilité

- Sliders : `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- Leviers grisés : `aria-disabled="true"` + explication
- Navigation par Tab entre leviers

---

## 9) S08 — Vue Marché

> Accessible depuis Cockpit ou menu

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  MARCHÉ — Vue globale                   [Auto▼] [Tendances] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PARTS DE MARCHÉ — AUTO                                     │
│                                                             │
│  [Graphique barres horizontales classement 18 compagnies]   │
│                                                             │
│  1. Concurrent A          ████████████████  18%             │
│  2. VOUS                  ██████████████    15% (↑2%)       │
│  3. Concurrent B          ████████████      12%             │
│  ...                                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PRIX MOYENS                                                │
│                                                             │
│  Marché: 450€/an | Vous: 465€/an (+3.3%)                   │
│                                                             │
│  [Graphique évolution prix sur N tours]                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TENDANCES                                                  │
│  • Pression prix: ↓ 2 concurrents baissent                  │
│  • Acquisition: Marché +1.2% ce trimestre                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton graphiques | Chargement données marché |
| **Empty** | N/A (toujours données marché) | — |
| **Error** | Banner + données du tour précédent | Erreur API |
| **Success** | Graphiques complets | Données OK |

---

## 10) S09 — Feedback (Résolution)

> Phase : FEEDBACK du tour

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  RÉSULTATS DU TOUR 3                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VARIATIONS DES INDICES                                     │
│                                                             │
│  IAC   ████████████░░░░░░░░  62 → 58  (↓4)   🔴             │
│  IPQO  ██████████████████░░  72 → 74  (↑2)   🟢             │
│  IERH  ████████████████░░░░  68 → 68  (=)    ⚪             │
│  IRF   ████████░░░░░░░░░░░░  38 → 35  (↓3)   🔴             │
│  IMD   ██████████████░░░░░░  55 → 57  (↑2)   🟢             │
│  IS    ██████████████████░░  70 → 70  (=)    ⚪             │
│  IPP   ████████████████░░░░  65 → 63  (↓2)   🟠             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOP 3 DRIVERS                                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🎯 Votre décision: Hausse tarif Auto +5%            │    │
│  │    → IAC ↓4 (clients moins attirés)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🌍 Événement: Épisode climatique                    │    │
│  │    → IRF ↓3 (sinistres exceptionnels)               │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ⏳ Effet retard: Recrutement (Tour 1)               │    │
│  │    → IPQO ↑2 (capacité augmentée)                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💡 CONSEIL MÉTIER                                          │
│  "La résilience financière se construit avant les crises.   │
│   Pensez réassurance et provisions prudentes."              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EFFETS À VENIR (Preview)                                   │
│  • Tour 5: Investissement IT (Tour 2) → IMD ↑ attendu       │
│  • Tour 6: Programme prévention actif                       │
│                                                             │
│              [   Tour suivant   →   ]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Spinner "Calcul en cours..." | Pendant résolution (< 2s) |
| **Empty** | N/A | — |
| **Error** | Modal erreur + Retry calcul | Erreur moteur |
| **Success** | Feedback complet | Calcul terminé |

### Micro-interactions

- **Jauges** : Animation slide de l'ancienne à la nouvelle valeur
- **Deltas** : CountUp animation
- **Drivers** : Apparition séquentielle (fade-in 300ms)
- **Conseil** : Highlight pulse subtil

---

## 11) S10 — Debrief Fin de Partie

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🏆 FIN DE PARTIE — DEBRIEF                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SCORE FINAL                                                │
│                                                             │
│       ┌─────────────────────────────┐                       │
│       │                             │                       │
│       │          72/100             │                       │
│       │        TRÈS BIEN            │                       │
│       │                             │                       │
│       └─────────────────────────────┘                       │
│                                                             │
│  Détail: IAC 15pts | IPQO 12pts | IRF 10pts | ...          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ÉVOLUTION DES INDICES                                      │
│  [Graphique lignes: 7 courbes sur 12 tours]                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TOP 5 DÉCISIONS DÉTERMINANTES                              │
│  1. Hausse tarif Auto Tour 3 → +8pts IPP sur la partie      │
│  2. Recrutement Tour 1 → Stabilité IPQO                     │
│  3. Réassurance Tour 5 → Survie après climat Tour 7         │
│  4. Fraude N1 Tour 4 → Économies sinistres +5%              │
│  5. Sous-invest IT Tour 2 → Dette technique accumulée       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BIAIS DÉTECTÉS                                             │
│  ⚠️ Court-termisme: Privilégié IPP au détriment de IRF      │
│  ⚠️ Négligence IT: IMD < 50 pendant 6 tours                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  POUR LA PROCHAINE PARTIE                                   │
│  • Investir plus tôt en IT/Data pour effets retard positifs │
│  • Équilibrer croissance et résilience financière           │
│                                                             │
│  [  Exporter PDF  ]    [  Rejouer  ]    [  Accueil  ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### États

| État | Affichage | Déclencheur |
|------|-----------|-------------|
| **Loading** | Skeleton + "Génération du debrief..." | Calcul debrief |
| **Empty** | N/A | — |
| **Error** | Toast + Retry | Erreur génération |
| **Success** | Debrief complet | Génération OK |
| **Exporting** | Spinner sur bouton PDF | Clic export |
| **Exported** | Toast "PDF téléchargé" + lien | Export OK |

### Micro-interactions

- **Score** : Animation CountUp + confetti si > 80
- **Graphique** : Draw progressif des courbes
- **Top 5** : Reveal séquentiel
- **Export** : Progress bar si long

---

## 12) Composants transverses

### Header de tour

Présent sur tous les écrans de jeu :

```
┌─────────────────────────────────────────────────────────────┐
│  Tour 3/12  │  Phase: DÉCISIONS  │  Timer: 02:45  │  [Menu] │
└─────────────────────────────────────────────────────────────┘
```

### Navigation rapide

Accessible via menu ou raccourcis :

| Destination | Raccourci | Disponibilité |
|-------------|-----------|---------------|
| Cockpit | C | Toujours |
| Marché | M | Toujours |
| Événements | E | Phase événements+ |
| Décisions | D | Phase décisions |

---

## 13) Décisions / Risques / Checklist

### Décisions UX

| ID | Décision | Justification |
|----|----------|---------------|
| SC-01 | Layout cockpit en grille | Lisibilité rapide, scan visuel |
| SC-02 | Feedback en 5 sections | Progressive disclosure |
| SC-03 | Leviers par catégorie avec onglets | Réduction charge cognitive |
| SC-04 | Debrief scrollable mono-page | Cohérence narrative |

### Risques

| Risque | Mitigation |
|--------|------------|
| Surcharge info cockpit | Niveau de détail par difficulté |
| Feedback trop long | Collapse sections optionnelles |
| Export PDF lent | Progress bar + async |

### Checklist

- [x] 10 écrans MVP spécifiés
- [x] États (loading/empty/error/success) pour chaque écran
- [x] Layout ASCII pour visualisation
- [x] Micro-interactions documentées
- [x] Accessibilité mentionnée par écran
