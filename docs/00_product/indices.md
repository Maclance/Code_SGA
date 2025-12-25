# indices.md — Spécification des Indices du Moteur

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2024-12-25

---

## 1) Vue d'ensemble

Le moteur de simulation utilise **7 indices systémiques** normalisés (0–100) pour représenter l'état de la compagnie. Chaque indice :
- Réagit aux **leviers** du joueur et aux **événements** externes
- Possède des **sous-indicateurs** et des **effets retard**
- Participe au **scoring** final (pondérations selon mode/difficulté)

```
┌─────────────────────────────────────────────────────────────┐
│                      SCORING GLOBAL                         │
│  = Σ (Indice_i × Poids_i) + Objectifs_Scénario             │
└─────────────────────────────────────────────────────────────┘
        │
        ├── IAC  (Attractivité Commerciale)
        ├── IPQO (Performance & Qualité Opérationnelle)
        ├── IERH (Équilibre RH)
        ├── IRF  (Résilience Financière)
        ├── IMD  (Maturité Data)
        ├── IS   (Sincérité)
        └── IPP  (Performance P&L)
```

---

## 2) Définition des 7 Indices

### 2.1 IAC — Indice Attractivité Commerciale

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (45–70) |
| **Inertie** | Faible (réagit vite aux décisions) |

**Sous-indicateurs** :
- Compétitivité prix (tarification vs marché)
- Étendue des garanties
- Force de distribution (mix canaux, animation)
- Notoriété/image (effets marketing)
- Satisfaction client (proxy satisfaction, échelle simplifiée inspirée NPS)

**Formule simplifiée** :
```
IAC(t) = w1×Compétitivité_prix + w2×Garanties + w3×Distribution 
       + w4×Notoriété + w5×Satisfaction
```

**Interactions clés** :
- Tarifs bas → IAC ↑ (court terme) mais risque IPP ↓
- IPQO ↓ → Satisfaction ↓ → IAC ↓ (effet retard 1-2 tours)
- Marketing ↑ → Notoriété ↑ (effet immédiat puis décroissant)

---

### 2.2 IPQO — Indice Performance & Qualité Opérationnelle

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (50–75) |
| **Inertie** | Moyenne (2 tours pour changements significatifs) |

**Sous-indicateurs** :
- Ratio charge/capacité sinistres
- Délais de gestion moyens
- Taux d'erreur/reprise
- Qualité prestataires (SLA)
- Taux de réclamations / contentieux
- Stabilité SI (dette technique inverse)

**Formule simplifiée** :
```
IPQO(t) = f(Capacité_RH, Qualité_Process, SI_Stabilité, Prestataires_SLA)
        × (1 - Surcharge_Factor)
```

**Interactions clés** :
- IERH ↓ → IPQO ↓ (effet retard 2 tours)
- IMD ↑ → Automatisation → Capacité effective ↑ → IPQO ↑
- Stock sinistres ↑ sans capacité → IPQO ↓

---

### 2.3 IERH — Indice Équilibre RH

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (55–70) |
| **Inertie** | Forte (effets retard 2-3 tours) |

**Sous-indicateurs** :
- Effectif vs besoins (par service)
- Compétences/formation
- Turnover/climat social
- QVT/rémunération

**Formule simplifiée** :
```
IERH(t) = Base(t-1) × (1 - Δ_Turnover) 
        + Impact_Recrutement(t-lag) + Impact_Formation(t-lag)
```

**Interactions clés** :
- Sous-investissement RH → IERH ↓ → IPQO ↓ (cascade)
- Crise RH (événement) → IERH ↓↓ brutal
- Recrutement → effet positif après 2 tours

---

### 2.4 IRF — Indice Résilience Financière

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (40–80) |
| **Inertie** | Moyenne |

**Sous-indicateurs** :
- Niveau de fonds propres (proxy)
- Protection réassurance
- Prudence provisions (marge vs PSNEM → voir glossaire : IBNR)
- Diversification placements / Duration (exposition taux)

**Formule simplifiée** :
```
IRF(t) = w1×Capital_Ratio + w2×Réassurance_Level 
       + w3×Provisions_Marge + w4×Placements_Sécurité
```

**Interactions clés** :
- Réassurance ↑ → IRF ↑ mais IPP ↓ (coût)
- Provisions agressives → IRF ↓, IS ↓
- Choc climatique majeur → IRF ↓ si mal protégé

---

### 2.5 IMD — Indice Maturité Data

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (30–60) |
| **Inertie** | Très forte (3-6 tours) |

**Sous-indicateurs** :
- Qualité données
- Gouvernance data
- Outillage/automatisation
- Cas d'usage IA déployés

**Formule simplifiée** :
```
IMD(t) = IMD(t-1) + Δ_Investissement_IT(t-lag) × Facteur_Absorption
       - Dette_Technique_Accumulation
```

**Interactions clés** :
- IMD ↑ → Prérequis leviers avancés (fraude N3, tarification fine)
- IMD ↑ → IPQO ↑ (automatisation, triage)
- Sous-investissement SI → IMD ↓, dette technique ↑

---

### 2.6 IS — Indice de Sincérité

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | 70 (neutre) |
| **Inertie** | Moyenne |

**Sous-indicateurs** :
- Adéquation provisions vs sinistres réels (boni/mali)
- Transparence décisions (court-termisme détecté)
- Conformité comportementale

**Formule simplifiée** :
```
IS(t) = IS(t-1) - Pénalité_Provisions_Agressives 
      - Pénalité_Court_Termisme + Bonus_Prudence
```

**Interactions clés** :
- Provisions agressives → IS ↓ → Risque mali futur
- IS < 40 → Événement "contrôle/sanction" probable
- IS influence le score final (pondération éthique)

---

### 2.7 IPP — Indice Performance P&L

| Attribut | Valeur |
|----------|--------|
| **Plage** | 0–100 |
| **Valeur initiale** | Dépend du profil compagnie (45–65) |
| **Inertie** | Faible (réactif) |

**Sous-indicateurs** :
- Primes collectées
- Sinistres payés (S/P)
- Variation PSAP (provisions sinistres à payer)
- Frais (acquisition, gestion, généraux)
- Solde réassurance (primes cédées - sinistres récupérés)
- Résultat technique
- Produits financiers

**Formule simplifiée** :
```
IPP(t) = f(Primes - Sinistres - Frais + Produits_Financiers)
       normalisé sur échelle 0-100 relative au marché
```

**Interactions clés** :
- IAC ↑ via prix bas → IPP ↓ si S/P se dégrade
- IPQO ↓ → Coûts sinistres ↑ → IPP ↓
- Réassurance ↑ → IPP ↓ (coût) mais IRF ↑

---

## 3) Matrice des Interactions

| Indice Source | Indice Cible | Sens | Délai | Mécanisme |
|---------------|--------------|------|-------|-----------|
| IAC | IPP | − | 2-4T | IAC ↑ via prix bas → anti-sélection → IPP − |
| IERH | IPQO | + | 2T | Sous-effectif dégrade qualité |
| IPQO | IAC | + | 1-2T | Satisfaction client |
| IMD | IPQO | + | 1T | Automatisation, efficacité |
| IMD | IPP | + | 3T | Fraude, tarification |
| IRF | IPP | − | 0T | Coût protection (réassurance) |
| IS | IRF | + | 2T | Mali = consommation capital |

---

## 4) Paramétrage par Difficulté

| Paramètre | Novice | Intermédiaire | Expert |
|-----------|--------|---------------|--------|
| Amplitude variations | ±5/tour | ±10/tour | ±15/tour |
| Effets retard | Délais ÷ 2 (arrondis au tour) | Standard | Délais × 1.5 |
| Seuils alertes | Visibles à 60 | Visibles à 50 | Visibles à 40 |
| Poids IS dans score | 5% | 10% | 20% |

---

## 5) Invariants du Moteur

```
INV-1  ∀ Indice ∈ {IAC, IPQO, IERH, IRF, IMD, IS, IPP} : 0 ≤ Indice ≤ 100

INV-2  Score_Global = Σ(Indice_i × Poids_i) où Σ(Poids_i) = 1

INV-3  Si IERH < 30 pendant 3 tours → Événement "Crise RH" déclenché

INV-4  Si IRF < 30 → Alerte "Solvabilité dégradée"
       Si IRF < 20 → Alerte "Solvabilité critique" + contraintes (game over possible)

INV-5  Δ_Indice par tour ≤ Amplitude_Max(difficulté)

INV-6  Fraude_Évitée(t) ≤ Fraude_Baseline × Taux_Détection_Max(niveau)
       (on ne peut pas éviter plus de fraude qu'il n'en existe)

INV-7  Coût_Réassurance(t) = Primes(t) × Taux_Cession(niveau_protection)
       (cohérence P&L réassurance)

INV-8  ∀ Levier_Progressif : Niveau(t) ∈ {0, N1, N2, N3}
       (pas de niveau intermédiaire)

INV-9  Si Stock_Sinistres(t) > Capacité(t) × Seuil_Surcharge 
       → IPQO(t+1) < IPQO(t)
       (la surcharge dégrade obligatoirement la qualité)

INV-10 Σ Mix_Canaux(%) = 100%
       (contrainte de totalité distribution)
```

---

## 6) Affichage Cockpit

**Radar 7 axes** : Vue synthétique des indices (comparaison t vs t-1)

**Indicateurs par produit** (si multi-produits) :
- IAC, IPQO, IPP calculés par produit
- IERH, IRF, IMD, IS restent globaux (ressources partagées)

**Alertes** :
- 🔴 Rouge : Indice < 30
- 🟠 Orange : Indice < 50
- 🟢 Vert : Indice ≥ 70
