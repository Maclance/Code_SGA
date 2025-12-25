# gameplay_core.md — Mécaniques de Jeu Fondamentales

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Auteur** : Game Designer

---

## 1) Vue d'ensemble

Ce document spécifie les mécaniques de gameplay fondamentales d'AssurManager : Le Défi IARD dans le cadre du **MVP**.

### 1.1 Philosophie de jeu

AssurManager combine deux paradigmes :
- **Civ-like** : progression sur plusieurs tours, compétition entre 18 acteurs, dynamiques de marché
- **Tower defense** : vagues de menaces externes à contrer via des "défenses" (leviers)

**Objectif pédagogique** : le joueur apprend à arbitrer entre croissance, rentabilité, qualité opérationnelle, résilience financière et contraintes réglementaires.

### 1.2 Scope MVP

| Élément | MVP | V1+ |
|---------|-----|-----|
| Mode de jeu | Solo (vs IA) | Multijoueur, Séminaire 200+ |
| Difficultés | Novice, Intermédiaire | Expert, Survie |
| Vitesse | Moyenne (1 tour = 1 trimestre) | Rapide, Lente |
| Produits | Auto + MRH | PJ, GAV |
| Leviers | ~12-22 selon difficulté | 30+ |

---

## 2) Boucle de Jeu (Game Loop)

### 2.1 Structure d'un tour

```
┌─────────────────────────────────────────────────────────────┐
│                        TOUR N                                │
├─────────────────────────────────────────────────────────────┤
│  1. LECTURE     │ Cockpit (indices, P&L, indicateurs)       │
│                 │ Alertes actives                            │
├─────────────────├────────────────────────────────────────────┤
│  2. ÉVÉNEMENTS  │ News Flash : événements marché/compagnie   │
│                 │ Impacts + durée affichés                   │
├─────────────────├────────────────────────────────────────────┤
│  3. DÉCISIONS   │ Allocation budget + choix stratégiques     │
│                 │ Leviers selon difficulté                   │
├─────────────────├────────────────────────────────────────────┤
│  4. RÉSOLUTION  │ Calcul moteur de simulation                │
│                 │ Application des effets (immédiats + retard)│
├─────────────────├────────────────────────────────────────────┤
│  5. FEEDBACK    │ Variations d'indices                       │
│                 │ Debrief court : impacts + prévisions       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Mécanique : Phase de Lecture (Cockpit)

| Attribut | Valeur |
|----------|--------|
| **Input** | État de la partie au tour T-1 |
| **Output** | Affichage cockpit : 7 indices + P&L + indicateurs par produit |
| **Limites** | Affichage uniquement, pas d'interaction |
| **Feedback joueur** | Radar 7 axes, alertes colorées (🔴 < 30, 🟠 < 50, 🟢 ≥ 70) |

**Indicateurs affichés (MVP)** :
- Par produit (Auto, MRH) + Total :
  - Nb contrats
  - Primes collectées
  - Stock sinistres
- Global :
  - Effectif total (répartition macro)
  - 7 indices systémiques
  - P&L synthétique

**Dépendances vers la simulation** :
- Lecture de l'état `game_state[T-1]` contenant indices, portefeuille, P&L
- Les alertes sont déclenchées par des seuils sur les indices (voir `indices.md`)

---

### 2.3 Mécanique : Phase d'Événements

| Attribut | Valeur |
|----------|--------|
| **Input** | Catalogue d'événements + état compagnie (vulnérabilités) |
| **Output** | 0 à N événements déclenchés pour le tour |
| **Limites** | Le joueur ne peut pas empêcher un événement déclenché |
| **Feedback joueur** | News Flash avec icône (marché/compagnie), impact estimé, durée |

#### 2.3.1 Types d'événements (MVP)

| Type | Exemples | Déclenchement | Impact |
|------|----------|---------------|--------|
| **Marché (systémique)** | Climat, Inflation, Réglementation, Disrupteur, Mutation parc auto | Probabilité fixe + paramètres scénario | Tous les acteurs, modulé par stratégie |
| **Compagnie (idiosyncratique)** | Cyber/panne SI, Crise RH | Probabilité × Vulnérabilité | Compagnie ciblée uniquement |

#### 2.3.2 Calcul de déclenchement événement compagnie

```
P(événement_compagnie) = P_base × Facteur_Vulnérabilité

Où Facteur_Vulnérabilité :
- Cyber/Panne SI : (100 - IMD) / 50  → IMD faible = vulnérabilité élevée
- Crise RH : (100 - IERH) / 50       → IERH faible = vulnérabilité élevée
```

**Dépendances vers la simulation** :
- Lecture des indices IMD, IERH pour calculer les vulnérabilités
- Catalogues d'événements avec probabilités de base
- Paramètres de session (intensité événements)

---

### 2.4 Mécanique : Phase de Décisions

| Attribut | Valeur |
|----------|--------|
| **Input** | Budget de tour + liste des leviers disponibles (selon difficulté) |
| **Output** | Ensemble de décisions validées pour le tour |
| **Limites** | Budget ≤ Budget_Max, prérequis respectés, exclusions mutuelles |
| **Feedback joueur** | Indication directionnelle d'impact (↑/↓) + délai estimé |

#### 2.4.1 Budget de tour

```
Budget_Tour = f(Taille_Compagnie, Résultat_T-1, Difficulté)

Règle simplifiée MVP :
- Base = 10 unités
- Bonus résultat positif : +1 à +3 unités
- Malus résultat négatif : -1 à -2 unités
- Modificateur difficulté : Novice ×1.2, Intermédiaire ×1.0
```

#### 2.4.2 Surface de décision par difficulté

| Catégorie | Novice | Intermédiaire |
|-----------|--------|---------------|
| Tarification | 2 leviers | 3 leviers |
| Distribution | 1 levier | 3 leviers |
| Marketing | 1 levier | 3 leviers |
| RH | 3 leviers | 5 leviers |
| IT/Data | 1 levier | 3 leviers |
| Sinistres | 2 + Fraude N1 | 3 + Fraude N1 |
| Réassurance | 1 levier | 1 levier |
| Prévention | 0 | 2 leviers |
| Provisions | 1 levier | 1 levier |
| **Total** | ~12 | ~22 |

**Dépendances vers la simulation** :
- Validation des prérequis (ex: IMD ≥ 40 pour Fraude N2 — [OUT OF SCOPE MVP])
- Vérification budget restant
- Référence au catalogue de leviers (`leviers_catalogue.md`)

---

### 2.5 Mécanique : Phase de Résolution

| Attribut | Valeur |
|----------|--------|
| **Input** | Décisions du tour + événements actifs + état T-1 + effets retard en attente |
| **Output** | Nouvel état T : indices, portefeuille, P&L |
| **Limites** | Calcul déterministe selon formules du moteur |
| **Feedback joueur** | Aucun pendant le calcul (< 2s) |

#### 2.5.1 Ordre de calcul

```
1. Appliquer les événements (impacts immédiats sur indices)
2. Appliquer les effets retard arrivant à maturité
3. Appliquer les décisions du tour (effets immédiats)
4. Enregistrer les nouveaux effets retard
5. Calculer la dynamique de marché (concurrence IA)
6. Mettre à jour le portefeuille (acquisition/résiliation)
7. Calculer le P&L du tour
8. Mettre à jour les indices
9. Vérifier les contraintes (game over si IRF < 20)
```

#### 2.5.2 Effets retard (paramétrés par vitesse Moyenne = trimestre)

| Domaine | Délai (tours) | Exemple |
|---------|---------------|---------|
| RH (recrutement) | 2 | Recrutement → Capacité effective après 2 tours |
| IT/Data | 3-6 | Investissement SI → IMD + après 3-6 tours |
| Prévention | 4-8 | Programme prévention → Fréquence − après 4-8 tours |
| Réputation | 1-3 | Satisfaction client → IAC après 1-3 tours |
| Marketing | 0+décroissance | Campagne → Effet immédiat puis −2/tour |

**Dépendances vers la simulation** :
- File d'attente des effets retard (`delayed_effects_queue`)
- Formules de calcul des indices (voir `indices.md`)
- État du marché et concurrents IA

---

### 2.6 Mécanique : Phase de Feedback

| Attribut | Valeur |
|----------|--------|
| **Input** | État T vs État T-1 + décisions du tour |
| **Output** | Écran de feedback avec variations et explications |
| **Limites** | Explainability MVP = top 3 drivers |
| **Feedback joueur** | Variations d'indices (Δ), alertes nouvelles, preview impacts futurs |

#### 2.6.1 Contenu du feedback

1. **Variations d'indices** : Δ par indice avec jauge visuelle
2. **Top 3 drivers** : Pourquoi chaque indice majeur a bougé
   - Catégories : Décision joueur / Événement / Effet retard
3. **Alertes** : Nouveaux seuils franchis
4. **Preview** : "Ce qui va impacter les prochains tours" (effets retard en attente)
5. **Message pédagogique** : Conseil contextuel lié à l'objectif d'apprentissage

#### 2.6.2 Messages Pédagogiques Contextuels

| Attribut | Valeur |
|----------|--------|
| **Input** | Variations d'indices + contexte décisionnel |
| **Output** | 1 message pédagogique par tour (max) |
| **Limites** | Messages prédéfinis, pas de génération dynamique |
| **Feedback joueur** | Encart "💡 Conseil métier" après les variations |

**Exemples de messages** :

| Déclencheur | Message |
|-------------|---------|
| IRF en baisse | "💡 La résilience se construit avant les crises. Pensez réassurance et provisions prudentes." |
| IPQO baisse après croissance | "💡 La croissance rapide sollicite vos capacités. Anticipez les besoins RH." |
| Effet retard arrive | "💡 Cette amélioration vient d'une décision d'il y a X tours. L'inertie est clé en assurance." |
| IS < 50 | "💡 Un IS bas peut déclencher des contrôles. Les provisions prudentes protègent l'avenir." |
| Stock sinistres en hausse | "💡 Le stock de sinistres grandit. Capacité = effectifs × productivité." |

**Règles d'affichage** :
- 1 seul message par tour (le plus prioritaire)
- Priorité : Alerte critique > Effet retard > Conseil général
- Message différent à chaque tour si possible

**Dépendances vers la simulation** :
- Calcul des deltas entre états T et T-1
- Attribution des variations aux causes (traçabilité moteur)
- Liste des effets retard programmés

---

## 3) Mécaniques de Portefeuille Multi-Produits

### 3.1 Structure du portefeuille

```
Compagnie
├── Produit : Auto
│   ├── Contrats (volume)
│   ├── Primes (montant)
│   ├── Sinistres (stock, flux, coût moyen)
│   └── Indicateurs dédiés (IAC_Auto, IPP_Auto)
│
├── Produit : MRH
│   ├── Contrats (volume)
│   ├── Primes (montant)
│   ├── Sinistres (stock, flux, coût moyen)
│   └── Indicateurs dédiés (IAC_MRH, IPP_MRH)
│
└── Ressources Communes
    ├── Budget
    ├── Effectifs (sinistres/distribution/IT/support)
    ├── IT/Data (IMD)
    ├── Capital/Réassurance (IRF)
    └── Indices globaux (IERH, IS)
```

### 3.2 Mécanique : Compétition des ressources

| Attribut | Valeur |
|----------|--------|
| **Input** | Décisions d'allocation par produit |
| **Output** | Répartition des ressources communes |
| **Limites** | Total allocation ≤ Ressources disponibles |
| **Feedback joueur** | Jauge d'utilisation des ressources, alertes surcharge |

**Exemple d'interaction** :
```
Surcroît acquisition Auto → Charge sinistres ↑ (avec retard)
→ Capacité RH partagée sollicitée
→ IPQO global ↓ (surcharge)
→ Satisfaction MRH ↓ (effet collatéral)
→ Rétention MRH ↓
```

**Dépendances vers la simulation** :
- Calcul de la charge par produit
- Calcul de la capacité globale (effectifs × productivité)
- Ratio charge/capacité → impact IPQO

---

## 4) Mécanique de Concurrence (IA Simple)

### 4.1 Comportement IA MVP

| Attribut | Valeur |
|----------|--------|
| **Input** | État du marché (prix moyens, parts de marché) |
| **Output** | Ajustements de prix et parts des 17 concurrents |
| **Limites** | IA réactive uniquement (pas de profils stratégiques en MVP) |
| **Feedback joueur** | Vue marché : évolution parts de marché et prix moyens |

#### 4.1.1 Règles de l'IA réactive

```
Pour chaque concurrent IA :
1. Si Part_Marché < Cible → Baisse prix de 2-5%
2. Si Part_Marché > Cible → Hausse prix de 1-3%
3. Ajustement aléatoire ±2% (variabilité)
4. Réaction aux événements marché (ex: inflation → tous +3%)
```

### 4.2 Impact sur le joueur

Le marché n'est pas statique :
- Les prix moyens évoluent → impact sur l'attractivité relative du joueur
- Les parts de marché se redistribuent → compétition pour l'acquisition
- Les événements marché affectent tous les acteurs

**Dépendances vers la simulation** :
- État global du marché (18 compagnies)
- Calcul des prix moyens par produit
- Calcul des parts de marché

---

## 5) Conditions de Fin de Partie

### 5.1 Fin normale

| Condition | Résultat |
|-----------|----------|
| Durée atteinte (ex: 12 tours) | Calcul du score final, debrief |

### 5.2 Game Over anticipé

| Condition | Seuil | Résultat |
|-----------|-------|----------|
| IRF critique | IRF < 20 pendant 2 tours | Faillite (solvabilité) |
| [OUT OF SCOPE] IERH critique | IERH < 15 | Paralysie opérationnelle |
| [OUT OF SCOPE] IPP négatif prolongé | IPP < 20 pendant 5 tours | Pertes insurmontables |

> Note : En MVP, seul le game over par IRF critique est implémenté. Les autres conditions sont envisagées pour les modes Expert/Survie (V1+).

---

## 6) Persistance et Inertie

### 6.1 Types de décisions

| Type | Comportement | Exemple |
|------|--------------|---------|
| **Ponctuel** | Effet immédiat, disparaît au tour suivant | Campagne pub |
| **Persistant** | Effet qui perdure avec atténuation | Recrutement |
| **Progressif** | Niveaux cumulatifs N1→N2→N3 | Lutte fraude |

### 6.2 Mécanique de compensation

| Attribut | Valeur |
|----------|--------|
| **Input** | Décision de correction après une mauvaise décision antérieure |
| **Output** | Amélioration progressive avec surcoût |
| **Limites** | Coût de rattrapage = Coût_Base × (1 + 0.2 × Tours_Écoulés) |
| **Feedback joueur** | Indication du surcoût lors de la décision |

**Exemple** :
- Tour 1 : Sous-investissement IT → Dette technique +10
- Tour 5 : Décision de rattraper → Coût × 1.8 (4 tours de retard)
- Effet : Réduction progressive de la dette sur 3-4 tours

---

## 7) Décisions / Risques / Checklist

### 7.1 Décisions de design

| ID | Décision | Justification |
|----|----------|---------------|
| GD-01 | Boucle en 5 phases séquentielles | Clarté pédagogique, structure prévisible |
| GD-02 | Feedback explicite top 3 drivers | Explainability sans surcharge cognitive |
| GD-03 | Game over uniquement sur IRF en MVP | Simplification, autres conditions en V1+ |
| GD-04 | IA réactive sans profils | Time-to-market, IA stratégique en V2 |
| GD-05 | Effets retard visibles au joueur | Valeur pédagogique sur l'inertie |

### 7.2 Risques identifiés

| ID | Risque | Impact | Mitigation |
|----|--------|--------|------------|
| R-01 | Boucle trop longue (> 5min/tour) | Désengagement | Limiter les décisions affichées en Novice |
| R-02 | Feedback insuffisant | Incompréhension des causalités | Top 3 drivers + alertes claires |
| R-03 | Effets retard frustrants | Sentiment d'impuissance | Preview explicite des effets à venir |
| R-04 | Multi-produits trop complexe | Surcharge cognitive | Agrégation par défaut, détail optionnel |

### 7.3 Checklist d'implémentation

- [ ] Structure de données `game_state` avec tous les indicateurs par tour
- [ ] File d'attente des effets retard (`delayed_effects_queue`)
- [ ] Catalogue d'événements avec probabilités et impacts
- [ ] Algorithme de résolution en 9 étapes
- [ ] IA réactive pour les 17 concurrents
- [ ] Calcul du budget de tour dynamique
- [ ] Affichage cockpit avec indicateurs par produit + total
- [ ] Écran feedback avec top 3 drivers
- [ ] Condition de game over (IRF < 20)
- [ ] Traçabilité décisions → impacts pour debrief

---

## 8) Dépendances vers la Simulation

### 8.1 Données requises du moteur

| Donnée | Source | Utilisation Gameplay |
|--------|--------|---------------------|
| Indices (7) | `indices.md` | Cockpit, alertes, scoring |
| Leviers | `leviers_catalogue.md` | Écran décisions, budget |
| Événements | Catalogue événements | Phase événements, impacts |
| Effets retard | File d'attente moteur | Preview, résolution |
| État marché | Calcul IA concurrents | Vue marché, attractivité relative |

### 8.2 Interfaces avec les indices

Chaque indice impacte le gameplay :

| Indice | Impact Gameplay |
|--------|-----------------|
| IAC | Acquisition/résiliation du portefeuille |
| IPQO | Coût des sinistres, délais, satisfaction |
| IERH | Capacité opérationnelle, vulnérabilité crise RH |
| IRF | Condition de game over, absorption des chocs |
| IMD | Prérequis leviers avancés, vulnérabilité cyber |
| IS | Boni/mali futurs, risque sanction |
| IPP | Budget du tour suivant, score |

### 8.3 Interfaces avec les leviers

Les leviers sont la principale interface joueur → simulation :
- Validation des prérequis (IMD, niveau précédent)
- Décompte du budget
- Enregistrement des effets (immédiats + retard)
- Persistance des décisions tour à tour

---

*Document rédigé selon le scope MVP. Les éléments tagués [OUT OF SCOPE] sont prévus pour les versions ultérieures (V1/V2).*
