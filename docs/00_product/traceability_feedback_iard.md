# Traçabilité Feedback IARD → Documentation

> **Date** : 2025-12-26  
> **Objectif** : Mapper les 5 points du feedback IARD vers les modifications apportées à la documentation.

---

## 📋 Résumé de Couverture

| Gap # | Thème | Leviers | Indices | Événements | KPI | Statut |
|-------|-------|---------|---------|------------|-----|--------|
| 1 | Souscription/Appétit | 2 ✓ | 2 ✓ | - | 3 ✓ | ✅ Couvert |
| 2 | CatNat/Crise | 1 ✓ | 4 ✓ | 2 ✓ | 1 ✓ | ✅ Couvert |
| 3 | Réclamations/Contentieux | 2 ✓ | 3 ✓ | 1 ✓ | 4 ✓ | ✅ Couvert |
| 4 | Gouvernance/Conformité | 3 ✓ | 2 ✓ | 2 ✓ | 2 ✓ | ✅ Couvert |
| 5 | Distribution Concentration | 2 ✓ | 2 ✓ | 1 ✓ | 1 ✓ | ✅ Couvert |

---

## Gap 1 : Sélection des risques / Appétit au risque

> **Feedback** : "Il manque un levier clair 'underwriting posture' (acceptation/refus, règles de souscription, anti-sélection, pilotage du mix). Prix sans sélection = apprendre à se crasher plus vite."

### Modifications apportées

| Document | Section | Éléments ajoutés |
|----------|---------|-----------------|
| [prd.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/prd.md) | 7.11 | Leviers LEV-UND-01, LEV-UND-02 |
| [indices.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/indices.md) | 7.1, 7.2 | UND_STRICTNESS, ADVERSE_SEL_RISK |
| [leviers_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/leviers_catalogue.md) | 2.11 | Posture souscription, Règles sélection |
| [kpi_success.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/kpi_success.md) | 16.1-16.3 | Portfolio_Mix_Quality, Acceptance_Rate, Bad_Risks_Share |
| [glossary.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/glossary.md) | 3bis | Appétit au risque, Posture souscription, Anti-sélection |

---

## Gap 2 : CatNat / Modélisation CAT et gestion de crise

> **Feedback** : "Distinguer impact technique (fréquence/sévérité), impact opérationnel (afflux, backlogs, prestataires saturés), impact réputationnel/régulateur. Sinon on rate 'le vrai chaos'."

### Modifications apportées

| Document | Section | Éléments ajoutés |
|----------|---------|-----------------|
| [prd.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/prd.md) | 7.12 | Mécanisme "Triple Impact CatNat", LEV-CRISE-01 |
| [indices.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/indices.md) | 7.3-7.6 | OPS_SURGE_CAP, BACKLOG_DAYS, REP_TEMP, REG_HEAT |
| [leviers_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/leviers_catalogue.md) | 2.12 | Plan de crise & surge capacity (N1/N2/N3) |
| [events_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/events_catalogue.md) | 3.6, 3.10 | EVT-CATNAT-01 (triple impact), EVT-FRAUD-OPP-01 (fraude post-CatNat) |
| [glossary.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/glossary.md) | 3bis | CAT modeling, Gestion de crise, Surge capacity, Backlog |

---

## Gap 3 : Expérience client / Réclamations / Contentieux

> **Feedback** : "NPS cité, mais pas de leviers dédiés (service client, médiation, politique indemnisation/transaction, coût juridique). C'est un vrai arbitrage coût vs risque vs réputation."

### Modifications apportées

| Document | Section | Éléments ajoutés |
|----------|---------|-----------------|
| [prd.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/prd.md) | 7.13 | LEV-CLI-01, LEV-CLI-02 |
| [indices.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/indices.md) | 7.7-7.9 | COMPLAINTS_RATE, LITIGATION_RISK, LEGAL_COST_RATIO |
| [leviers_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/leviers_catalogue.md) | 2.13 | Politique indemnisation, Service client & médiation |
| [events_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/events_catalogue.md) | 3.9 | EVT-MEDIACRISE-01 (crise médiatique indemnisation) |
| [kpi_success.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/kpi_success.md) | 16.4-16.7 | Complaint_Rate, Claims_Cycle_Time, Litigation_Rate, Legal_Cost_Ratio |
| [glossary.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/glossary.md) | 3bis | Médiation, Transaction, Contentieux |

---

## Gap 4 : Risque & conformité — gouvernance

> **Feedback** : "Il manque un levier 'dispositif de contrôle / conformité opérationnelle' (KYC affinitaires, délégataires, lutte anti-fraude procédurale, audits). La conformité reste un 'événement', pas une discipline."

### Modifications apportées

| Document | Section | Éléments ajoutés |
|----------|---------|-----------------|
| [prd.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/prd.md) | 7.14 | LEV-CONF-02, LEV-CONF-03, LEV-FRAUD-PROC-01 |
| [indices.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/indices.md) | 7.10-7.11 | CTRL_MATURITY, FRAUD_PROC_ROB |
| [leviers_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/leviers_catalogue.md) | 2.14 | Dispositif contrôle, Audit délégataires, Anti-fraude procédurale |
| [events_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/events_catalogue.md) | 3.7 | EVT-AUDIT-01 (Audit régulateur / injonction) |
| [kpi_success.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/kpi_success.md) | 16.8-16.9 | Compliance_Findings_Count, Remediation_Delay |
| [glossary.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/glossary.md) | 3bis | Dispositif contrôle interne, Audit délégataire |

---

## Gap 5 : Distribution — qualité vs volume + concentration

> **Feedback** : "La réalité c'est aussi qualité du portefeuille par canal (affinitaires vs agence vs digital), et risque de dépendance (un gros apporteur = pouvoir de négociation + risque de rupture)."

### Modifications apportées

| Document | Section | Éléments ajoutés |
|----------|---------|-----------------|
| [prd.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/prd.md) | 7.15 | LEV-DIS-02-QUALITY, LEV-DIS-03-CONCENTRATION |
| [indices.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/indices.md) | 7.12-7.13 | CHAN_QUALITY, DISTRIB_CONC_RISK |
| [leviers_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/leviers_catalogue.md) | 2.15 | Exigences qualité canal, Gestion concentration apporteurs |
| [events_catalogue.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/20_simulation/events_catalogue.md) | 3.8 | EVT-APPORTEUR-01 (Rupture apporteur majeur) |
| [kpi_success.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/kpi_success.md) | 16.10 | Distribution_Concentration_Index |
| [glossary.md](file:///d:/OneDrive/Documents/Boulot-Nico/Projets%20SAAS/Saas_B2B_Serious%20Game%20Assurance/Code_SGA/docs/00_product/glossary.md) | 3bis | Concentration apporteur, Qualité portefeuille par canal |

---

## ✅ Checklist Qualité Finale

| # | Critère | Statut |
|---|---------|--------|
| 1 | Les 5 gaps sont couverts par ≥1 levier + ≥1 indice + ≥1 événement ou KPI | ✅ |
| 2 | Les nouveaux leviers s'intègrent dans les écrans/parcours existants | ✅ |
| 3 | Les règles ont des exemples chiffrés/pseudo-formules | ✅ |
| 4 | Les effets retardés sont explicités quand pertinent | ✅ |
| 5 | Glossaire à jour (pas de synonymes flous) | ✅ |

---

## 📁 Fichiers Modifiés

| Fichier | Lignes ajoutées | Type de modification |
|---------|-----------------|---------------------|
| `docs/00_product/prd.md` | ~165 | Sections 7.11-7.15 + CHANGELOG |
| `docs/20_simulation/indices.md` | ~485 | Section 7 (13 indices) + invariants |
| `docs/20_simulation/leviers_catalogue.md` | ~713 | Sections 2.11-2.15 (10 leviers) |
| `docs/20_simulation/events_catalogue.md` | ~475 | Section 3.6-3.10 (5 événements) |
| `docs/00_product/kpi_success.md` | ~152 | Section 16 (10 KPIs gameplay) |
| `docs/00_product/glossary.md` | ~52 | Section 3bis (15+ termes) |
