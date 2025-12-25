# audit_alignement_pedagogique.md — Audit Ingénieur Formation

**Version** : 1.0  
**Date** : 2025-12-25  
**Auteur** : Ingénieur Formation  
**Objet** : Vérification alignement Objectifs → Mécaniques → Feedback → Évaluation

---

## 1) Synthèse de l'Audit

### 1.1 Documents analysés

| Document | Contenu principal |
|----------|-------------------|
| `gameplay_core.md` | Boucle de jeu, 5 phases, multi-produits |
| `modes_difficultes.md` | Novice/Intermédiaire, vitesse, compagnies |
| `scoring_badges_debrief.md` | Score, 10 badges, debrief 5 sections |
| `contenu_pedagogique.md` | Compagnies, événements, tutoriel, biais |
| `roles_multijoueur.md` | Rôles MVP, architecture préparée V1 |

### 1.2 Constats généraux

| Aspect | État | Commentaire |
|--------|------|-------------|
| Objectifs pédagogiques | ⚠️ Partiel | Définis globalement mais pas par niveau |
| Alignement objectifs → mécaniques | ⚠️ Partiel | Liens implicites, pas formalisés |
| Feedback en jeu | ✅ Bon | Top 3 drivers, alertes, preview |
| Évaluation (scoring) | ⚠️ À améliorer | Score = performance, pas apprentissage |
| Debrief | ⚠️ À enrichir | Biais détectés mais pas d'évaluation compétences |

---

## 2) Corrections Proposées

### 2.1 `contenu_pedagogique.md` — Section 1.1

**Problème** : Les objectifs pédagogiques sont listés globalement sans différenciation par niveau de difficulté.

**Correction proposée** : Remplacer la section 1.1 par une matrice objectifs × niveaux (voir section 3 ci-dessous).

---

### 2.2 `modes_difficultes.md` — Section 3

**Problème** : La difficulté est définie uniquement par le nombre de leviers et les paramètres techniques, pas par les objectifs d'apprentissage.

**Correction proposée** : Ajouter une sous-section "Objectifs d'apprentissage" pour chaque niveau avec les compétences ciblées.

```markdown
### 3.1 Novice

#### Objectifs d'apprentissage Novice
| Compétence | Niveau attendu |
|------------|---------------|
| Lecture cockpit | Identifier les 7 indices |
| Causalité décision → effet | Comprendre les liens directs |
| Gestion budget | Allouer un budget limité |
| Réaction aux événements | Lire et anticiper les impacts |

[paramètres existants...]
```

---

### 2.3 `scoring_badges_debrief.md` — Section 2

**Problème** : Le score mesure la **performance finale** (indices × pondérations), pas l'**apprentissage** (progression, compréhension des causalités).

**Correction proposée** : Ajouter un "Score Pédagogique" complémentaire.

```markdown
### 2.4 Score Pédagogique (complémentaire)

| Composante | Mesure | Points |
|------------|--------|--------|
| Progression | Δ indices (fin vs début) | 0-200 |
| Équilibre | Écart-type des 7 indices final | 0-100 |
| Anticipation | Réactions pertinentes aux événements | 0-100 |
| Apprentissage effets retard | Décisions tenant compte des délais | 0-100 |

Score_Pédagogique = Σ composantes
Affichage : Score Performance (existant) + Score Apprentissage (nouveau)
```

---

### 2.4 `scoring_badges_debrief.md` — Section 3.2

**Problème** : Les badges mesurent des résultats ponctuels, pas des compétences acquises.

**Correction proposée** : Ajouter des "Badges Compétence" distincts des badges performance.

```markdown
### 3.4 Badges Compétence (nouveau)

| Badge | Compétence mesurée | Condition |
|-------|-------------------|-----------|
| 🎓 Lecteur averti | Lecture cockpit | Consulter toutes les sections cockpit |
| 🔮 Visionnaire | Anticipation | 3+ décisions tenant compte des effets retard |
| ⚖️ Stratège équilibré | Vision systémique | Maintenir tous indices > 40 pendant 5+ tours |
| 🛠️ Réactif | Gestion de crise | Redresser un indice de < 35 à > 50 |
| 📈 Progressant | Amélioration | Score tour 12 > Score tour 6 de +100pts |
```

---

### 2.5 `scoring_badges_debrief.md` — Section 4.1.4

**Problème** : L'analyse des biais détecte les erreurs mais ne mesure pas l'acquisition des compétences.

**Correction proposée** : Ajouter une section "Évaluation des compétences acquises".

```markdown
#### 4.1.6 Évaluation des Compétences (nouveau)

Pour chaque objectif pédagogique, évaluer le niveau atteint :

| Compétence | Indicateurs | Niveau (0-3) |
|------------|-------------|--------------|
| Arbitrage croissance/rentabilité | IAC vs IPP équilibrés | ⭐⭐⭐ |
| Gestion chaîne sinistres | IPQO stable, stock contrôlé | ⭐⭐ |
| Résilience financière | IRF > 50, réassurance active | ⭐⭐⭐ |
| Vision systémique | Pas de sur-optimisation | ⭐ |
| Conformité | IS > 60, pas de sanction | ⭐⭐ |

Légende :
- ⭐ = En cours d'acquisition
- ⭐⭐ = Acquis partiellement  
- ⭐⭐⭐ = Maîtrisé
```

---

### 2.6 `gameplay_core.md` — Section 2.6

**Problème** : Le feedback de fin de tour ne mentionne pas explicitement le lien avec les objectifs pédagogiques.

**Correction proposée** : Ajouter un message pédagogique dans le feedback.

```markdown
#### 2.6.2 Message pédagogique (nouveau)

Après les variations d'indices, afficher un message contextuel :

Exemples :
- Si IRF a baissé : "💡 La résilience financière se construit avant les crises. 
  Pensez réassurance et provisions prudentes."
- Si IPQO baisse après croissance : "💡 La croissance rapide sollicite 
  vos capacités. Anticipez les besoins RH."
- Si effet retard arrive : "💡 Cette amélioration vient d'une décision 
  d'il y a 3 tours. L'inertie est clé en assurance."
```

---

### 2.7 `contenu_pedagogique.md` — Section 7

**Problème** : Le debrief pédagogique analyse les biais mais ne propose pas de parcours de progression.

**Correction proposée** : Ajouter une recommandation de parcours.

```markdown
### 7.3 Parcours de Progression Recommandé

Basé sur les compétences évaluées :

| Niveau actuel | Prochaine étape recommandée |
|---------------|----------------------------|
| Novice, Score < 500 | Refaire une partie Novice en ciblant 1 compétence |
| Novice, Score ≥ 500 | Passer en Intermédiaire |
| Intermédiaire, Score < 600 | Revoir les mécaniques de résilience |
| Intermédiaire, Score ≥ 600 | Session thématique (sinistres, finance) [V1+] |
```

---

## 3) Objectifs d'Apprentissage par Niveau

### 3.1 Matrice Objectifs × Niveaux

| Objectif pédagogique | Novice | Intermédiaire | Expert [V1+] | Survie [V1+] |
|---------------------|--------|---------------|--------------|--------------|
| **Lecture cockpit** | Identifier les 7 indices | Interpréter les tendances | Anticiper les seuils critiques | Lecture rapide sous stress |
| **Arbitrage croissance/rentabilité** | Comprendre le lien prix → volume | Gérer le S/P par produit | Optimiser segmentation | Survivre sans croissance |
| **Gestion chaîne sinistres** | Comprendre capacité vs charge | Activer fraude N1 + recours | Industrialiser fraude N2/N3 | Prioriser sous contrainte |
| **Résilience financière** | Connaître le rôle de la réassurance | Arbitrer coût vs protection | Gérer provisions + placements | Absorber chocs multiples |
| **Vision systémique** | Observer les effets retard | Anticiper les interactions | Optimiser chaînes causales | Gérer cascades de crises |
| **Conformité** | Comprendre IS et ses impacts | Intégrer comme contrainte | Exploiter comme avantage | Maintenir sous pression |

### 3.2 Compétences par Niveau

#### Novice — "Découvrir le métier"
1. Comprendre les 7 indices et leur signification
2. Faire le lien entre décisions simples et effets visibles
3. Gérer un budget de tour avec arbitrages basiques
4. Réagir aux événements de manière appropriée
5. Terminer une partie sans game over

#### Intermédiaire — "Piloter une compagnie"
1. Anticiper les effets retard et planifier à moyen terme
2. Équilibrer plusieurs objectifs contradictoires
3. Gérer les interactions entre produits (Auto/MRH)
4. Utiliser les leviers avancés (prévention, recours, placements)
5. Optimiser le score tout en maintenant l'équilibre

#### Expert [V1+] — "Maîtriser la complexité"
1. Optimiser les chaînes causales multi-tours
2. Anticiper les vulnérabilités et les mitiger
3. Industrialiser les processus (fraude N2/N3, data)
4. Gérer les contraintes réglementaires comme opportunités
5. Surperformer le marché de manière durable

#### Survie [V1+] — "Gérer les crises"
1. Prioriser sous contrainte de ressources
2. Absorber des chocs multiples sans game over
3. Prendre des décisions rapides sous pression
4. Sacrifier le court terme pour la survie
5. Rebondir après une crise majeure

---

## 4) Ajustements Scoring / Badges

### 4.1 Structure de Score Recommandée

```
Score Final = Score Performance (70%) + Score Apprentissage (30%)

Score Performance (existant) :
- Indices finaux × pondérations
- Bonus objectifs scénario

Score Apprentissage (nouveau) :
- Progression (amélioration vs début)
- Équilibre (pas de sur-optimisation)
- Anticipation (réactions aux événements)
- Compréhension effets retard
```

### 4.2 Badges Réorganisés par Catégorie

| Catégorie | Badges | Objectif pédagogique mesuré |
|-----------|--------|----------------------------|
| **Performance** | Croissance, Rentable, Challenger | Résultats obtenus |
| **Qualité** | Résilient, Efficace, Prudent | Gestion des risques |
| **Stratégie** | Équilibré, Data-driven | Vision systémique |
| **Compétence** | Visionnaire, Stratège, Réactif, Progressant | Apprentissage démontré |
| **Progression** | Survivant, Première partie | Engagement |

### 4.3 Badges Manquants (à ajouter)

| Badge | Condition | Compétence mesurée |
|-------|-----------|-------------------|
| 🔄 Anticipateur | 3+ décisions liées aux effets retard | Vision moyen terme |
| 🎯 Focalisé | 1 compétence passée de ⭐ à ⭐⭐⭐ | Amélioration ciblée |
| 📚 Apprenant | Consulter 10+ tooltips | Engagement pédagogique |
| 🔁 Persévérant | 3+ parties complétées | Répétition |

---

## 5) Recommandations sur le Debrief

### 5.1 Structure Recommandée (6 sections)

| # | Section | Contenu | Durée lecture |
|---|---------|---------|---------------|
| 1 | **Résumé** | Score, badges, radar | 30s |
| 2 | **Performance** | Indices finaux, P&L, classement | 1min |
| 3 | **Décisions clés** | Top 5 impacts + explication | 2min |
| 4 | **Apprentissages** | Compétences acquises, niveau atteint | 1min |
| 5 | **Biais & Erreurs** | Analyse comportementale | 1min |
| 6 | **Prochaines étapes** | Recommandations personnalisées | 30s |

### 5.2 Messages Clés par Section

#### Section 4 — Apprentissages (nouveau)
```
Vos compétences acquises :

✅ Arbitrage croissance/rentabilité : ⭐⭐⭐ Maîtrisé
   Vous avez maintenu un bon équilibre prix/volume.

⚠️ Vision systémique : ⭐ En cours
   Vous avez parfois négligé les effets de second ordre.

📈 Progression : +150 points entre T1 et T12
   Votre pilotage s'est amélioré au fil de la partie.
```

#### Section 5 — Biais (enrichi)
```
Biais détectés et conseils :

🔴 Court-termisme (IS final: 42)
   → Pour votre prochaine partie, augmentez vos provisions
     dès le T3 pour éviter le mali du T8.

🟠 Sous-investissement IT (IMD final: 38)
   → L'IT a des effets retard de 3-6 tours.
     Investissez tôt, même si l'effet n'est pas immédiat.

💡 Conseil métier :
   "Dans une vraie compagnie, la dette technique coûte
    3× plus cher à rattraper qu'à prévenir."
```

#### Section 6 — Prochaines étapes (enrichi)
```
Votre prochaine partie :

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

### 5.3 Export PDF — Structure Enrichie

| Page | Contenu |
|------|---------|
| 1 | Résumé + Score + Radar |
| 2 | Courbes indices + Événements |
| 3 | Top 5 décisions + Impacts |
| 4 | **Compétences acquises** (nouveau) |
| 5 | Biais + Recommandations |
| 6 | Parcours progression + Glossaire termes rencontrés |

---

## 6) Checklist Corrections

### 6.1 Corrections Immédiates (MVP)

- [ ] Ajouter matrice objectifs × niveaux dans `contenu_pedagogique.md`
- [ ] Ajouter objectifs d'apprentissage dans `modes_difficultes.md`
- [ ] Ajouter Score Pédagogique dans `scoring_badges_debrief.md`
- [ ] Ajouter Badges Compétence dans `scoring_badges_debrief.md`
- [ ] Ajouter section Évaluation Compétences dans debrief
- [ ] Ajouter messages pédagogiques dans feedback tour

### 6.2 Améliorations V1+

- [ ] Parcours de progression thématiques
- [ ] Comparaison inter-joueurs sur compétences
- [ ] Dashboard formateur avec suivi compétences groupe
- [ ] Export PDF enrichi (page compétences)

---

## 7) Matrice d'Alignement Final

| Objectif Pédagogique | Mécanique | Feedback | Évaluation |
|---------------------|-----------|----------|------------|
| Arbitrage croissance/rentabilité | Tarif + Offre + Distribution | IAC vs IPP dans cockpit | Score équilibre + Badge Équilibré |
| Gestion chaîne sinistres | Leviers sinistres + fraude + RH | Stock, IPQO, alertes | Badge Efficace + Compétence |
| Résilience financière | Réassurance + Provisions | IRF, alertes solvabilité | Badge Résilient + Score résilience |
| Vision systémique | Effets retard + multi-produits | Preview impacts futurs | Biais sur-optimisation + Compétence |
| Conformité | IS + événements sanction | Alertes IS, news flash | Badge Prudent + IS final |

---

*Audit réalisé par Ingénieur Formation — 2025-12-25*
