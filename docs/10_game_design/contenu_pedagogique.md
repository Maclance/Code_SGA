# contenu_pedagogique.md — Contenu Pédagogique et Éducatif

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25

---

## 1) Vue d'ensemble

Ce document spécifie le contenu pédagogique d'AssurManager dans le cadre du **MVP**.

### 1.1 Objectifs Pédagogiques (Learning Outcomes)

À l'issue d'une session, l'apprenant doit mieux savoir :

| Compétence | Description |
|------------|-------------|
| **Arbitrage croissance/rentabilité** | Comprendre le lien prix/volumes/qualité portefeuille |
| **Gestion chaîne sinistres** | Capacité, qualité, coûts, fraude, recours |
| **Résilience financière** | Réassurance, provisions, absorption des chocs |
| **Vision systémique** | Interactions entre fonctions, effets retard |
| **Conformité** | Contrainte structurante, pas un frein |

### 1.2 Matrice Objectifs × Niveaux de Difficulté

| Objectif pédagogique | Novice | Intermédiaire | Expert [V1+] | Survie [V1+] |
|---------------------|--------|---------------|--------------|--------------|
| **Lecture cockpit** | Identifier les 7 indices | Interpréter les tendances | Anticiper les seuils critiques | Lecture rapide sous stress |
| **Arbitrage croissance/rentabilité** | Comprendre le lien prix → volume | Gérer le S/P par produit | Optimiser segmentation | Survivre sans croissance |
| **Gestion chaîne sinistres** | Comprendre capacité vs charge | Activer fraude N1 + recours | Industrialiser fraude N2/N3 | Prioriser sous contrainte |
| **Résilience financière** | Connaître le rôle de la réassurance | Arbitrer coût vs protection | Gérer provisions + placements | Absorber chocs multiples |
| **Vision systémique** | Observer les effets retard | Anticiper les interactions | Optimiser chaînes causales | Gérer cascades de crises |
| **Conformité** | Comprendre IS et ses impacts | Intégrer comme contrainte | Exploiter comme avantage | Maintenir sous pression |

### 1.3 Alignement Objectifs → Mécaniques → Feedback → Évaluation

| Objectif | Mécanique de jeu | Feedback in-game | Évaluation |
|----------|-----------------|------------------|------------|
| Arbitrage croissance/rentabilité | Tarif + Offre + Distribution | IAC vs IPP dans cockpit | Score équilibre + Badge Équilibré |
| Gestion chaîne sinistres | Leviers sinistres + fraude + RH | Stock, IPQO, alertes | Badge Efficace + Compétence |
| Résilience financière | Réassurance + Provisions | IRF, alertes solvabilité | Badge Résilient + Score |
| Vision systémique | Effets retard + multi-produits | Preview impacts futurs | Biais sur-optimisation |
| Conformité | IS + événements sanction | Alertes IS, news flash | Badge Prudent + IS final |

---

## 2) Contenu : Compagnies (18)

### 2.1 Mécanique : Fiches Compagnies

| Attribut | Valeur |
|----------|--------|
| **Input** | Catalogue de 18 compagnies pré-définies |
| **Output** | Fiche sélectionnable avec traits appliqués |
| **Limites** | Traits fixes, pas de personnalisation |
| **Feedback joueur** | Radar indices, description, forces/faiblesses |

### 2.2 Structure d'une Fiche

```
Compagnie
├── Identité
│   ├── Nom
│   ├── Logo (placeholder MVP)
│   └── Description narrative
├── Traits (3-5)
│   ├── trait_id
│   ├── nom
│   ├── effet_moteur
│   └── description_joueur
├── Indices Initiaux
│   ├── IAC: 45-70
│   ├── IPQO: 50-75
│   ├── IERH: 55-70
│   ├── IRF: 40-80
│   ├── IMD: 30-60
│   ├── IS: 60-80
│   └── IPP: 45-65
└── Portefeuille Initial
    ├── Auto: nb contrats, primes
    └── MRH: nb contrats, primes
```

### 2.3 Exemples de Traits

| Trait | Effet Moteur | Description Joueur |
|-------|--------------|-------------------|
| Digital First | IMD +10, IPQO -5 | "Forte maturité digitale mais processus parfois instables" |
| Réseau Dense | IAC +5 (distribution) | "Un réseau d'agents bien implanté sur le territoire" |
| Prudent | IS +10, IRF +5, IPP -5 | "Une politique de gestion prudente et respectée" |
| Agressif | IAC +10, IS -10 | "Croissance rapide mais parfois au détriment de la qualité" |
| Mutualiste | IERH +5, IAC -5 | "Culture forte, fidélité employés, mais moins commercial" |
| Spécialiste Auto | Auto +15% portefeuille | "Expertise reconnue en assurance automobile" |

### 2.4 Calibration des 18 Compagnies

| ID | Profil | IAC | IPQO | IERH | IRF | IMD | IS | IPP |
|----|--------|-----|------|------|-----|-----|---|----|
| 1-4 | Généraliste | 55 | 60 | 60 | 55 | 45 | 70 | 55 |
| 5-7 | Leader | 65 | 70 | 65 | 70 | 50 | 70 | 60 |
| 8-10 | Challenger | 60 | 55 | 55 | 50 | 45 | 60 | 50 |
| 11-13 | Mutualiste | 50 | 65 | 70 | 65 | 40 | 80 | 52 |
| 14-16 | Digital | 55 | 55 | 55 | 50 | 60 | 65 | 55 |
| 17 | Spécialiste Auto | 60 | 65 | 60 | 55 | 45 | 70 | 58 |
| 18 | Spécialiste MRH | 58 | 63 | 60 | 58 | 45 | 72 | 56 |

**Dépendances simulation** : Application des traits aux indices initiaux lors du choix de compagnie.

---

## 3) Contenu : Événements

### 3.1 Mécanique : Catalogue d'Événements

| Attribut | Valeur |
|----------|--------|
| **Input** | Probabilités de base + vulnérabilités compagnie |
| **Output** | Événement déclenché avec impacts |
| **Limites** | Catalogue fixe MVP (~20-25 événements) |
| **Feedback joueur** | News Flash avec icône type, impact, durée |

### 3.2 Événements Marché (Systémiques) — MVP

| ID | Événement | Probabilité/tour | Impact Principal | Durée |
|----|-----------|-----------------|------------------|-------|
| EV-M01 | Épisode climatique modéré | 15% | Fréquence MRH +10%, Auto +5% | 1 tour |
| EV-M02 | Épisode climatique sévère | 5% | Fréquence MRH +25%, coût +15% | 2 tours |
| EV-M03 | Inflation pièces auto | 20% | Sévérité Auto +8% | 3 tours |
| EV-M04 | Inflation générale | 10% | Frais +5%, coûts sinistres +5% | 4 tours |
| EV-M05 | Choc réglementaire | 8% | IS -5 si conformité faible, contraintes | 2 tours |
| EV-M06 | Disrupteur (insurtech) | 10% | Pression prix -3%, acquisition -5% | 3 tours |
| EV-M07 | Mutation parc auto | 12% | Sévérité Auto +10%, expertise requise | continu |

### 3.3 Événements Compagnie (Idiosyncratiques) — MVP

| ID | Événement | P_base | Vulnérabilité | Impact |
|----|-----------|--------|---------------|--------|
| EV-C01 | Cyberattaque | 5% | IMD < 40 : ×2 | IPQO -15, capacité -30% (1 tour) |
| EV-C02 | Panne SI majeure | 8% | IMD < 50 : ×1.5 | IPQO -10, délais +20% (2 tours) |
| EV-C03 | Crise RH | 5% | IERH < 40 : ×2 | IERH -20, capacité -20% (3 tours) |

### 3.4 Format News Flash

```
╔════════════════════════════════════════════╗
║ 🌪️ ÉVÉNEMENT MARCHÉ                        ║
╠════════════════════════════════════════════╣
║ Épisode climatique sévère                  ║
║                                            ║
║ Des intempéries majeures frappent          ║
║ plusieurs régions.                         ║
║                                            ║
║ Impact : Fréquence MRH +25%                ║
║          Coût moyen sinistres +15%         ║
║ Durée  : 2 tours                           ║
║                                            ║
║ 💡 Conseil : Vérifiez votre réassurance    ║
╚════════════════════════════════════════════╝
```

**Dépendances simulation** : Calcul probabilité avec vulnérabilités, application impacts aux indices.

---

## 4) Contenu : Explications Pédagogiques

### 4.1 Mécanique : Tooltips et Aides

| Attribut | Valeur |
|----------|--------|
| **Input** | Élément UI survolé/cliqué |
| **Output** | Explication contextuelle |
| **Limites** | Textes courts (max 100 mots) |
| **Feedback joueur** | Bulle d'aide, popup modal |

### 4.2 Types d'Explications

| Contexte | Contenu |
|----------|---------|
| **Indice** | Définition, facteurs d'influence, liens avec autres indices |
| **Levier** | Ce qu'il fait, coût, délai, impact attendu |
| **Événement** | Contexte métier, pourquoi c'est important |
| **Alerte** | Cause probable, actions suggérées |
| **Variation** | "Pourquoi ça bouge" (top 3 drivers) |

### 4.3 Exemples Tooltips

**Indice IRF** :
> "L'Indice de Résilience Financière mesure votre capacité à absorber les chocs. Un IRF élevé vous protège des événements majeurs mais peut coûter en rentabilité (réassurance, provisions). Si IRF < 30, vous risquez des difficultés de solvabilité."

**Levier Fraude N1** :
> "Contrôles basiques anti-fraude. Effet rapide mais plafonné à 5% d'économies. Pour aller plus loin, passez aux niveaux supérieurs (non disponibles en Novice)."

**Alerte Stock Sinistres** :
> "Votre stock de sinistres augmente : les entrées dépassent vos capacités de traitement. Actions suggérées : recruter des gestionnaires (RH), externaliser (Prestataires), ou améliorer l'automatisation (IT)."

---

## 5) Contenu : Alertes et Recommandations

### 5.1 Mécanique : Système d'Alertes

| Attribut | Valeur |
|----------|--------|
| **Input** | État des indices et indicateurs |
| **Output** | Alertes actives avec niveaux de gravité |
| **Limites** | Max 5 alertes simultanées affichées |
| **Feedback joueur** | Badges colorés, liste priorisée |

### 5.2 Catalogue d'Alertes MVP

| ID | Alerte | Condition | Niveau | Recommandation |
|----|--------|-----------|--------|----------------|
| AL-01 | Solvabilité dégradée | IRF < 40 | 🟠 | Augmenter réassurance |
| AL-02 | Solvabilité critique | IRF < 30 | 🔴 | URGENT: Capital/Réassurance |
| AL-03 | Surcharge sinistres | Stock > Capacité ×1.2 | 🟠 | Recruter ou externaliser |
| AL-04 | Qualité dégradée | IPQO < 50 | 🟠 | Investir RH/IT |
| AL-05 | Crise RH imminente | IERH < 40 | 🟠 | Formation, rémunération |
| AL-06 | Dette technique | IMD < 35 | 🟠 | Investir stabilité SI |
| AL-07 | Sincérité faible | IS < 50 | 🟠 | Provisions plus prudentes |
| AL-08 | Rentabilité négative | IPP < 40 | 🟠 | Revoir tarification/coûts |

### 5.3 Affichage Alertes

```
┌─ ALERTES ACTIVES ─────────────────────────┐
│ 🔴 Solvabilité critique (IRF: 28)         │
│    → Augmentez votre réassurance          │
│                                           │
│ 🟠 Surcharge sinistres (+35% vs capacité) │
│    → Recrutez ou externalisez             │
└───────────────────────────────────────────┘
```

**Dépendances simulation** : Seuils configurables par difficulté (voir modes_difficultes.md).

---

## 6) Contenu : Guide In-App (Onboarding)

### 6.1 Mécanique : Tutoriel Première Partie

| Attribut | Valeur |
|----------|--------|
| **Input** | Première session d'un joueur |
| **Output** | Guide pas à pas |
| **Limites** | Optionnel (skip possible) |
| **Feedback joueur** | Bulles guidées, checklist visible |

### 6.2 Étapes du Tutoriel (Novice)

| Étape | Écran | Contenu |
|-------|-------|---------|
| 1 | Choix compagnie | "Choisissez votre compagnie. Chacune a des forces et faiblesses." |
| 2 | Cockpit | "Voici votre tableau de bord. Les 7 jauges sont vos indices clés." |
| 3 | Indices | "Survolez chaque indice pour comprendre ce qu'il mesure." |
| 4 | Événements | "Des événements peuvent survenir. Lisez-les attentivement." |
| 5 | Décisions | "Allouez votre budget aux différents leviers." |
| 6 | Validation | "Validez vos choix pour passer au tour suivant." |
| 7 | Feedback | "Observez l'impact de vos décisions sur les indices." |

### 6.3 Checklist Première Partie

```
□ Comprendre les 7 indices
□ Lire un événement
□ Activer au moins 3 leviers
□ Passer au tour suivant
□ Observer une variation d'indice
□ Consulter une alerte
□ Terminer 3 tours
```

---

## 7) Contenu : Debrief Pédagogique

### 7.1 Analyse des Biais de Pilotage

| Biais | Indicateurs | Message Pédagogique |
|-------|-------------|---------------------|
| **Court-termisme** | IS bas, provisions agressives | "Vous avez privilégié les résultats immédiats au détriment de la solidité future." |
| **Sur-optimisation** | 1 indice >80, autres <50 | "Attention à ne pas négliger certains aspects pour en maximiser un seul." |
| **Négligence risque** | IRF bas, pas de réassurance | "La résilience se construit avant les crises, pas pendant." |
| **Sous-investissement RH** | IERH en baisse, recrutement nul | "Les équipes sont un investissement à moyen terme." |
| **Dette technologique** | IMD en baisse | "Le SI est le socle de votre efficacité opérationnelle." |

### 7.2 Recommandations Personnalisées

Basées sur les biais détectés :

```
Vos axes d'amélioration :

1. Anticipez les risques
   Votre IRF était souvent en dessous de 40. Pensez à 
   investir dans la réassurance AVANT les crises.

2. Équilibrez vos priorités
   Vous avez négligé l'IT/Data (IMD final: 35). 
   L'automatisation améliore la qualité à long terme.

3. Pensez long terme
   IS final: 45. Des provisions plus prudentes vous
   auraient évité un mali au tour 8.
```

### 7.3 Parcours de Progression Recommandé

| Attribut | Valeur |
|----------|--------|
| **Input** | Niveau actuel + score + compétences |
| **Output** | Recommandation de prochaine étape |
| **Limites** | Parcours prédéfinis (pas de personnalisation fine) |
| **Feedback joueur** | Section "Votre prochaine étape" dans le debrief |

**Logique de recommandation** :

| Niveau actuel | Score | Recommandation |
|---------------|-------|----------------|
| Novice | < 400 | Refaire Novice, focus sur la compétence la plus faible |
| Novice | 400-550 | Refaire Novice avec autre compagnie |
| Novice | ≥ 550 | Passer en Intermédiaire |
| Intermédiaire | < 500 | Revenir en Novice pour consolider |
| Intermédiaire | 500-650 | Refaire Inter, focus compétences faibles |
| Intermédiaire | ≥ 650 | Prêt pour Expert [V1+] |

**Affichage** :
```
Votre prochaine étape :

🎯 Objectif suggéré : Améliorer la résilience financière
   Focus : Maintenir IRF > 50 pendant toute la partie

🎮 Configuration recommandée :
   - Difficulté : Intermédiaire
   - Compagnie : Mutualiste (IRF initial élevé)
   - Durée : 12 tours

📖 Pour aller plus loin :
   - Tooltip "Réassurance" à relire
   - Glossaire : IBNR, Provisions
```

---

## 8) Contenu : Lexique Intégré

### 8.1 Mécanique : Glossaire In-App

| Attribut | Valeur |
|----------|--------|
| **Input** | Termes cliqués ou survolés |
| **Output** | Définition métier/jeu |
| **Limites** | Termes issus de glossary.md |
| **Feedback joueur** | Modal ou sidebar avec définition |

### 8.2 Termes Clés (extraits)

| Terme | Définition courte |
|-------|-------------------|
| S/P | Ratio Sinistres/Primes. Indicateur de rentabilité technique. |
| Réassurance | Transfert de risque à un réassureur. Coûte mais protège. |
| IBNR | Sinistres survenus mais pas encore déclarés. |
| Franchise | Part restant à charge de l'assuré. |
| IAC | Attractivité commerciale : capacité à attirer des clients. |

---

## 9) Décisions / Risques / Checklist

### 9.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| CP-01 | 18 compagnies avec traits | Rejouabilité, choix stratégique |
| CP-02 | ~10 événements marché + 3 compagnie | Couverture pédagogique sans surcharge |
| CP-03 | Tutoriel optionnel | Flexibilité pour joueurs expérimentés |
| CP-04 | 5 types de biais | Couverture erreurs courantes |
| CP-05 | Glossaire intégré | Accessibilité vocabulaire métier |

### 9.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-16 | Compagnies déséquilibrées | Playtests, calibration |
| R-17 | Événements trop fréquents | Ajuster probabilités |
| R-18 | Tutoriel trop long | Étapes concises, skip |
| R-19 | Vocabulaire trop technique | Tooltips et glossaire |

### 9.3 Checklist

- [ ] 18 fiches compagnies complètes
- [ ] Catalogue événements (~13 en MVP)
- [ ] Textes tooltips (indices, leviers, alertes)
- [ ] Système d'alertes (8 types)
- [ ] Tutoriel 7 étapes
- [ ] Détection 5 biais
- [ ] Glossaire intégré

---

## 10) Dépendances vers la Simulation

### 10.1 Données Requises

| Donnée | Source | Utilisation |
|--------|--------|-------------|
| company_profiles[] | Configuration | Traits et indices initiaux |
| events_catalog[] | Configuration | Événements déclenchables |
| game_state[t] | Moteur | Alertes, biais, debrief |
| decisions[t] | Joueur | Attribution impacts |

### 10.2 Interfaces

| Interface | Entrée | Sortie |
|-----------|--------|--------|
| getCompanyProfile(id) | company_id | Fiche complète |
| triggerEvent(probability, vulnerability) | Paramètres | Événement ou null |
| checkAlerts(state) | État courant | Liste alertes actives |
| detectBiases(history) | Historique complet | Biais détectés |
| generateRecommendations(biases) | Biais | 3 recommandations |

---

*Scope MVP. [OUT OF SCOPE] = V1/V2.*
