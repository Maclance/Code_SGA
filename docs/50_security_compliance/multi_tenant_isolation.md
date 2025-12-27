# multi_tenant_isolation.md — Isolation Multi-Tenant

**Version** : 1.0  
**Statut** : Draft  
**Dernière MAJ** : 2025-12-25  
**Rôle rédacteur** : Sécurité / Multi-tenant

---

## 1) Principes d'Architecture Multi-Tenant

### 1.1 Définition

> **Multi-tenant** : architecture où plusieurs organisations (tenants) partagent la même application, avec **isolation stricte** des données et droits.

### 1.2 Stratégie d'Isolation Choisie

| Stratégie | Description | Choix AssurManager |
|-----------|-------------|-------------------|
| Base séparée par tenant | Chaque tenant a sa propre BDD | ✗ Complexe, coûteux |
| Schéma séparé par tenant | Un schéma PostgreSQL par tenant | ✗ Migration complexe |
| **Isolation par ligne (RLS)** | Une BDD partagée, chaque ligne a un `tenant_id` | ✓ **Choisi** |

### 1.3 Garanties d'Isolation

| Garantie | Description |
|----------|-------------|
| **Données** | Aucune donnée d'un tenant n'est accessible par un autre |
| **Sessions** | Les sessions de jeu sont scopées à un tenant |
| **Utilisateurs** | Un utilisateur appartient à un seul tenant |
| **Exports** | Les exports ne contiennent que les données du tenant exportateur |
| **Audit** | Les logs d'audit sont scopés par tenant |

---

## 2) Mécanismes Techniques

### 2.1 Clé d'Isolation : `tenant_id`

Toutes les tables métier incluent une colonne `tenant_id` :

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- autres colonnes...
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### 2.2 Row-Level Security (RLS)

> [!IMPORTANT]
> **RLS est la couche de sécurité OBLIGATOIRE** au niveau base de données.

```sql
-- Activer RLS sur chaque table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Politique de lecture (SELECT)
CREATE POLICY tenant_read_isolation ON sessions
  FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Politique d'écriture (INSERT)
CREATE POLICY tenant_write_isolation ON sessions
  FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Politique de modification (UPDATE)
CREATE POLICY tenant_update_isolation ON sessions
  FOR UPDATE
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Politique de suppression (DELETE)
CREATE POLICY tenant_delete_isolation ON sessions
  FOR DELETE
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 2.3 Injection du Contexte Tenant

À chaque requête, le middleware injecte le `tenant_id` :

```typescript
// Middleware tenant (exécuté après auth)
const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.user.tenant_id;
  
  // Injecter dans le contexte de connexion DB
  await db.query(`SET app.current_tenant_id = '${tenantId}'`);
  
  next();
};
```

### 2.4 Points de Contrôle

| Couche | Mécanisme | Responsabilité |
|--------|-----------|----------------|
| **API Gateway** | Extraction tenant du JWT | Authentifier et identifier |
| **Middleware** | Injection `tenant_id` dans contexte | Préparer le contexte |
| **ORM/Query** | Clause `WHERE tenant_id = ?` automatique | Filtrage applicatif |
| **Database (RLS)** | Policies PostgreSQL | Dernier rempart |

---

## 3) Tables et Entités Concernées

### 3.1 Entités Scopées par Tenant

> **Note** : Noms de tables alignés sur `80_api_data/data_model.md` (source of truth).

| Table | Contient `tenant_id` | RLS Activée | Notes |
|-------|:--------------------:|:-----------:|-------|
| `users` | ✓ | ✓ | Utilisateurs du tenant |
| `game_sessions` | ✓ | ✓ | Sessions de jeu |
| `participants` | ✓ | ✓ | Participants aux sessions |
| `turns` | ✓ | ✓ | États de jeu par tour |
| `turn_decisions` | ✓ | ✓ | Décisions des joueurs |
| `scoreboards` | ✓ | ✓ | Rapports de fin de partie |
| `audit_logs` | ✓ | ✓ | Journal d'audit |

### 3.2 Entités Globales (Super Admin)

| Table | Scope | Accès |
|-------|-------|-------|
| `tenants` | Global | Super Admin uniquement |
| `engine_versions` | Global | Super Admin uniquement |
| `event_catalog_templates` | Global | Super Admin (lecture Admin Tenant) |

---

## 4) Scénarios de Tests d'Étanchéité

> [!CAUTION]
> Ces 5 scénarios **DOIVENT** être exécutés avant chaque mise en production.

### SC-01 : Cross-Tenant Data Access

| Attribut | Valeur |
|----------|--------|
| **Objectif** | Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre tenant |
| **Prérequis** | 2 tenants (A, B) avec chacun 1 session et 1 utilisateur |
| **Actions** | User A tente de lire/modifier/supprimer la session de Tenant B |
| **Résultat attendu** | HTTP 403 ou 404 (ressource masquée) |
| **Vérification** | Aucune trace de la session B dans les logs de Tenant A |

**Étapes détaillées :**

1. Créer Tenant A avec User A et Session A
2. Créer Tenant B avec User B et Session B
3. User A authentifié tente :
   - `GET /api/sessions/{session_b_id}` → 403/404
   - `PUT /api/sessions/{session_b_id}` → 403/404
   - `DELETE /api/sessions/{session_b_id}` → 403/404
4. Vérifier audit_log : aucune entrée avec `session_b_id` visible par Tenant A

---

### SC-02 : Session Isolation

| Attribut | Valeur |
|----------|--------|
| **Objectif** | Vérifier qu'un joueur ne peut rejoindre que les sessions de son tenant |
| **Prérequis** | 2 tenants, 1 session chacun, code d'invitation |
| **Actions** | User A tente de rejoindre Session B avec le code d'invitation B |
| **Résultat attendu** | Rejet avec message "Session non trouvée" |
| **Vérification** | User A n'apparaît jamais dans `session_participants` de B |

**Étapes détaillées :**

1. Créer Session B dans Tenant B, obtenir code d'invitation
2. User A (Tenant A) tente `POST /api/sessions/join` avec le code de B
3. Réponse attendue : `{"error": "session_not_found"}`
4. Vérifier en BDD : `SELECT * FROM session_participants WHERE user_id = A AND session_id = B` → 0 résultats

---

### SC-03 : Export Data Leakage

| Attribut | Valeur |
|----------|--------|
| **Objectif** | Vérifier que les exports ne contiennent que les données du tenant |
| **Prérequis** | 2 tenants avec sessions jouées et décisions |
| **Actions** | Admin Tenant A exporte toutes les sessions |
| **Résultat attendu** | Export ne contient QUE les données de Tenant A |
| **Vérification** | Parser le fichier, vérifier absence d'IDs appartenant à B |

**Étapes détaillées :**

1. Jouer plusieurs tours dans Session A (Tenant A)
2. Jouer plusieurs tours dans Session B (Tenant B)
3. Admin A demande `GET /api/exports/sessions?format=csv`
4. Vérifier le CSV :
   - Tous les `session_id` appartiennent à Tenant A
   - Tous les `user_id` appartiennent à Tenant A
   - Aucune décision de Tenant B présente

---

### SC-04 : Admin Tenant Boundary

| Attribut | Valeur |
|----------|--------|
| **Objectif** | Vérifier qu'un Admin Tenant ne peut pas gérer les utilisateurs d'un autre tenant |
| **Prérequis** | Admin A (Tenant A), User B (Tenant B) |
| **Actions** | Admin A tente de modifier/supprimer User B |
| **Résultat attendu** | HTTP 403 |
| **Vérification** | User B inchangé, tentative loguée |

**Étapes détaillées :**

1. Admin A tente `PUT /api/users/{user_b_id}` (changer rôle) → 403
2. Admin A tente `DELETE /api/users/{user_b_id}` → 403
3. Admin A tente `GET /api/users/{user_b_id}` → 403/404
4. Vérifier : User B toujours présent et inchangé en BDD
5. Vérifier audit_log Tenant A : tentative loguée comme `access_denied`

---

### SC-05 : Audit Log Isolation

| Attribut | Valeur |
|----------|--------|
| **Objectif** | Vérifier que les logs d'audit ne montrent que les actions du tenant |
| **Prérequis** | Actions administratives effectuées dans les 2 tenants |
| **Actions** | Admin A consulte le journal d'audit |
| **Résultat attendu** | Uniquement les logs de Tenant A visibles |
| **Vérification** | Aucun `tenant_id = B` dans les résultats |

**Étapes détaillées :**

1. Admin A effectue plusieurs actions (créer session, inviter user)
2. Admin B effectue plusieurs actions (créer session, inviter user)
3. Admin A consulte `GET /api/audit-logs`
4. Vérifier :
   - Tous les logs retournés ont `tenant_id = A`
   - Aucun log avec `tenant_id = B`
5. Requête SQL directe (test dev) : même vérification avec RLS activé

---

## 5) Cas Particuliers

### 5.1 Super Admin

Le Super Admin **n'est pas soumis** à l'isolation tenant :

- Peut lister/modifier tous les tenants
- Peut consulter les logs globaux
- DOIT être tracké dans un audit_log séparé (table `super_admin_audit_logs`)

### 5.2 Changement de Tenant d'un Utilisateur

> [!WARNING]
> **Interdit.** Un utilisateur ne peut PAS changer de tenant.

Si nécessaire (cas exceptionnel) :
1. Désactiver l'utilisateur dans l'ancien tenant
2. Créer un nouveau compte dans le nouveau tenant
3. Les anciennes données restent scopées à l'ancien tenant

### 5.3 Tenant Supprimé

Lors de la suppression d'un tenant :
1. **Soft delete** : `tenants.deleted_at = NOW()`
2. Toutes les données restent en BDD (période de rétention)
3. Aucun accès possible (auth rejetée pour ce tenant)
4. Suppression physique après période légale (RGPD)

---

## 6) Décisions / Risques / Checklist

### 6.1 Décisions

| ID | Décision | Justification |
|----|----------|---------------|
| MT-01 | Isolation par RLS | Coût/complexité optimal |
| MT-02 | tenant_id obligatoire partout | Garantie structurelle |
| MT-03 | Masquer existence cross-tenant | Sécurité par obscurité en complément |
| MT-04 | Super Admin hors RLS | Nécessité opérationnelle |

### 6.2 Risques

| ID | Risque | Mitigation |
|----|--------|------------|
| R-MT-01 | Oubli tenant_id sur nouvelle table | Lint/CI pour vérifier schéma |
| R-MT-02 | Query directe sans RLS | Policy `FORCE ROW LEVEL SECURITY` |
| R-MT-03 | Bypass via Super Admin | Audit séparé, principe 4 yeux |

### 6.3 Checklist MVP

- [ ] RLS activé sur toutes les tables métier
- [ ] Middleware tenant implémenté
- [ ] Tests SC-01 à SC-05 automatisés (CI)
- [ ] Audit des tentatives cross-tenant
- [ ] Documentation schéma avec tenant_id

---

## 7) Impacts Dev

> [!IMPORTANT]
> **Où appliquer ces règles dans le code**

### 7.1 Schéma Base de Données

```sql
-- Template pour chaque nouvelle table
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- colonnes métier...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Toujours ajouter RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_table FORCE ROW LEVEL SECURITY; -- Même pour owner

CREATE POLICY tenant_isolation ON new_table
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### 7.2 Points d'Implémentation

| Composant | Fichier(s) suggéré(s) | Responsabilité |
|-----------|----------------------|----------------|
| Migrations | `supabase/migrations/*.sql` | Schéma avec tenant_id + RLS |
| Tenant Middleware | `middleware/tenant.ts` | Injecter `app.current_tenant_id` |
| Repository Layer | `repositories/*.ts` | Ajouter tenant_id automatiquement |
| Tests Isolation | `tests/security/tenant-isolation.test.ts` | Scénarios SC-01 à SC-05 |

### 7.3 ORM Configuration (si applicable)

```typescript
// Prisma example - Global middleware
prisma.$use(async (params, next) => {
  // Lire tenant du contexte
  const tenantId = getCurrentTenantId();
  
  // Injecter dans les requêtes
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = { ...params.args.where, tenant_id: tenantId };
  }
  
  if (params.action === 'create') {
    params.args.data.tenant_id = tenantId;
  }
  
  return next(params);
});
```

### 7.4 Checklist Code Review

Pour chaque PR touchant la BDD :

- [ ] Nouvelle table a `tenant_id` NOT NULL ?
- [ ] RLS activée et policy créée ?
- [ ] Query inclut filtre tenant (ou via middleware) ?
- [ ] Tests d'isolation ajoutés ?

---

*Document rédigé selon PRD §13. Référence : [glossary.md](../00_product/glossary.md) §2 (Multi-tenant).*
