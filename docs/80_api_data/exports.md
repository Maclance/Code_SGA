# exports.md — Spécifications Exports de Données

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-27  
**Auteur** : Tech Writer

> **Scope MVP** : Export PDF simple (cf. [scope.md](../00_product/scope.md) §3.1.F)

---

## 1) Formats Supportés

### 1.1 MVP

| Format | Usage | Priorité |
|--------|-------|----------|
| **PDF** | Débrief individuel joueur | P0 |

### 1.2 V1+

| Format | Usage | Priorité |
|--------|-------|----------|
| CSV | Export données brutes session | P1 |
| Excel (XLSX) | Analyses personnalisées | P2 |
| JSON | Intégration SI | P2 |

---

## 2) Contenu Export PDF (MVP)

### 2.1 Structure du document

```
┌────────────────────────────────────────────┐
│ 1. EN-TÊTE                                 │
│    - Logo AssurManager                     │
│    - Nom session, date, difficulté         │
│    - Compagnie jouée                       │
├────────────────────────────────────────────┤
│ 2. RÉSUMÉ                                  │
│    - Score final                           │
│    - Classement (si multijoueur)           │
│    - Badges obtenus                        │
├────────────────────────────────────────────┤
│ 3. GRAPHIQUE INDICES                       │
│    - Courbes 7 indices sur durée session   │
│    - Légende couleur par indice            │
├────────────────────────────────────────────┤
│ 4. P&L SYNTHÉTIQUE                         │
│    - Primes / Sinistres / Frais / Résultat │
│    - Par produit si multi-produits         │
├────────────────────────────────────────────┤
│ 5. TOP ÉVÉNEMENTS                          │
│    - 5 événements majeurs                  │
│    - Impact et réaction joueur             │
├────────────────────────────────────────────┤
│ 6. DÉCISIONS CLÉS                          │
│    - Top 3 décisions positives             │
│    - Top 3 décisions à impact négatif      │
├────────────────────────────────────────────┤
│ 7. PISTES D'AMÉLIORATION                   │
│    - Recommandations pédagogiques          │
└────────────────────────────────────────────┘
```

### 2.2 Données incluses

| Section | Données | Source |
|---------|---------|--------|
| En-tête | Session metadata | `game_sessions` |
| Score | `final_score`, `rank` | `scoreboards` |
| Indices | 7 indices × nb tours | `turn_indices` |
| P&L | Primes, sinistres, frais | `turn_indices` |
| Événements | Top 5 par impact | `turn_events` |
| Décisions | Top contributeurs score | `turn_decisions` + analyse |

---

## 3) API Endpoint

```
GET /api/sessions/{session_id}/export
```

### 3.1 Paramètres

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `pdf` | Format de sortie (pdf, csv, xlsx, json) |
| `participant_id` | UUID | auth user | Export pour un participant spécifique |

### 3.2 Réponse

| Code | Description |
|------|-------------|
| 200 | Fichier retourné (Content-Type selon format) |
| 403 | Accès refusé (pas participant ou session autre tenant) |
| 404 | Session non trouvée |
| 422 | Format non supporté |

---

## 4) Permissions

| Rôle | Peut exporter |
|------|---------------|
| **Joueur** | Son propre débrief uniquement |
| **Formateur** | Tous les participants de ses sessions |
| **Admin Tenant** | Toutes sessions du tenant |
| **Super Admin** | — (pas d'export cross-tenant) |

---

## 5) Décisions / Risques / Checklist

### 5.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| EXP-01 | PDF uniquement en MVP | Simplicité, couverture 90% des besoins |
| EXP-02 | Génération serveur-side | Contrôle mise en page, templates |

### 5.2 Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Performance génération PDF | Moyen | Queue async, timeout 30s |
| Taille fichier | Faible | Compression images, limite pages |

### 5.3 Checklist MVP

- [ ] Template PDF défini
- [ ] Endpoint implémenté
- [ ] Tests génération (contenu, permissions)
- [ ] Timeouts et erreurs gérés

---

*Document créé suite audit cohérence 2025-12-27.*
