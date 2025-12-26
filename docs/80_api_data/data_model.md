# Data Model — AssurManager

> **Source of Truth** pour le modèle de données.
> Dernière mise à jour : 2025-12-26

---

## 1) Conventions

### Naming

| Element | Convention | Exemple |
|---------|------------|---------|
| Tables | `snake_case`, pluriel | `game_sessions`, `turn_decisions` |
| Colonnes | `snake_case` | `tenant_id`, `created_at` |
| Clés primaires | `id` (UUID) | `id UUID PRIMARY KEY` |
| Clés étrangères | `<entity>_id` | `session_id`, `user_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ DEFAULT NOW()` |

### Champs systémiques obligatoires

```sql
-- Toute table scopée tenant DOIT avoir :
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Soft Delete (optionnel)

```sql
deleted_at TIMESTAMPTZ NULL  -- NULL = actif, sinon = supprimé
```

---

## 2) Diagramme Entités-Relations

```
┌──────────────┐         ┌──────────────────┐
│   tenants    │◄────────│      users       │
│              │ 1     N │                  │
└──────────────┘         └────────┬─────────┘
       │                          │
       │ 1                        │ N
       ▼                          │
┌──────────────────┐              │
│  game_sessions   │◄─────────────┤ (created_by)
│                  │              │
│  tenant_id ──────┼──────────────┘
└────────┬─────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐         ┌──────────────────┐
│   participants   │────────►│   user_roles     │
└────────┬─────────┘         └──────────────────┘
         │ 1
         │
         ▼ N
┌──────────────────┐
│      turns       │
│                  │
│  session_id ─────┼──────────────────────────────┐
└────────┬─────────┘                              │
         │ 1                                      │
         │                                        │
         ▼ N                                      ▼ N
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  turn_decisions  │    │   turn_events    │    │  turn_indices    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                                         │
                                                         │ par produit
                                                         ▼
                                                ┌──────────────────┐
                                                │ turn_indices_    │
                                                │ by_product       │
                                                └──────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   scoreboards    │         │   audit_logs     │
│                  │         │                  │
│  session_id ─────┼         │  tenant_id ──────┼
└──────────────────┘         └──────────────────┘
```

---

## 3) Entités détaillées

### 3.1 Tenants

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
```

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `name` | VARCHAR(255) | NOT NULL | Nom affiché |
| `slug` | VARCHAR(100) | UNIQUE | URL-safe identifier |
| `settings` | JSONB | - | Paramètres tenant (branding, limits) |
| `status` | VARCHAR(20) | NOT NULL | État du tenant |

---

### 3.2 Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  auth_provider VARCHAR(50) NOT NULL DEFAULT 'email', -- email, google, azure
  auth_provider_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- pending, active, suspended
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `tenant_id` | UUID | FK, NOT NULL | **Isolation tenant** |
| `email` | VARCHAR(255) | UNIQUE par tenant | Email utilisateur |
| `auth_provider` | VARCHAR(50) | NOT NULL | Source auth (email, SSO) |

---

### 3.3 User Roles

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- super_admin, admin_tenant, trainer, player, observer, team_lead
  scope_type VARCHAR(50), -- null = global tenant, 'session' = limité
  scope_id UUID, -- session_id si scope_type = 'session'
  granted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, role, scope_type, scope_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**Rôles valides** : `super_admin`, `admin_tenant`, `trainer`, `player`, `observer`, `team_lead`

---

### 3.4 Game Sessions

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Paramètres
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE, -- Code de rejoindre (ex: ABC-1234)
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediate', -- novice, intermediate, expert, survival
  speed VARCHAR(20) NOT NULL DEFAULT 'medium', -- fast, medium, slow
  duration_turns INTEGER NOT NULL DEFAULT 12,
  products JSONB NOT NULL DEFAULT '["auto", "mrh"]', -- Produits activés
  
  -- État
  status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, ready, running, paused, ended
  current_turn INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Moteur
  engine_version VARCHAR(50) NOT NULL,
  scenario_id UUID, -- Référence scénario optionnel
  settings JSONB DEFAULT '{}', -- Pondérations, events actifs
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_tenant ON game_sessions(tenant_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_code ON game_sessions(code);
CREATE INDEX idx_sessions_created_by ON game_sessions(created_by);
```

---

### 3.5 Participants

```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rôle in-session
  role VARCHAR(50) NOT NULL DEFAULT 'player', -- player, observer, team_lead
  team_id UUID, -- Équipe (séminaire V1+)
  
  -- Compagnie choisie
  company_id VARCHAR(50), -- ID parmi les 18 compagnies
  company_locked BOOLEAN DEFAULT FALSE,
  
  -- État
  status VARCHAR(20) NOT NULL DEFAULT 'invited', -- invited, active, eliminated, left
  joined_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, user_id)
);

CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_participants_status ON participants(status);
```

---

### 3.6 Turns

```sql
CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  
  -- État
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, submitted, resolved
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  
  -- Snapshot état après résolution
  state_snapshot JSONB, -- Indices, P&L, portefeuille après calcul
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, participant_id, turn_number)
);

CREATE INDEX idx_turns_session ON turns(session_id);
CREATE INDEX idx_turns_participant ON turns(participant_id);
CREATE INDEX idx_turns_number ON turns(turn_number);
```

---

### 3.7 Turn Decisions

```sql
CREATE TABLE turn_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  
  lever_id VARCHAR(50) NOT NULL, -- Ex: L-PROD-01, L-RH-01
  product_id VARCHAR(50), -- null = global, sinon auto/mrh/pj/gav
  value JSONB NOT NULL, -- Valeur de la décision (structure selon levier)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_decisions_turn ON turn_decisions(turn_id);
CREATE INDEX idx_decisions_lever ON turn_decisions(lever_id);
```

---

### 3.8 Turn Events

```sql
CREATE TABLE turn_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  
  event_id VARCHAR(50) NOT NULL, -- Ex: EVT-CLIMAT-01
  event_type VARCHAR(20) NOT NULL, -- market, company
  severity VARCHAR(20), -- low, medium, high, critical
  
  -- Impacts calculés
  impacts JSONB, -- {iac: -5, ipqo: -10, ...}
  duration_turns INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_turn ON turn_events(turn_id);
CREATE INDEX idx_events_type ON turn_events(event_type);
```

---

### 3.9 Turn Indices

```sql
CREATE TABLE turn_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  
  -- Les 7 indices (niveau compagnie)
  iac DECIMAL(5,2) NOT NULL CHECK (iac >= 0 AND iac <= 100),
  ipqo DECIMAL(5,2) NOT NULL CHECK (ipqo >= 0 AND ipqo <= 100),
  ierh DECIMAL(5,2) NOT NULL CHECK (ierh >= 0 AND ierh <= 100),
  irf DECIMAL(5,2) NOT NULL CHECK (irf >= 0 AND irf <= 100),
  imd DECIMAL(5,2) NOT NULL CHECK (imd >= 0 AND imd <= 100),
  is_index DECIMAL(5,2) NOT NULL CHECK (is_index >= 0 AND is_index <= 100), -- "is" est réservé SQL
  ipp DECIMAL(5,2) NOT NULL CHECK (ipp >= 0 AND ipp <= 100),
  
  -- P&L synthétique
  premiums DECIMAL(15,2) NOT NULL DEFAULT 0,
  claims DECIMAL(15,2) NOT NULL DEFAULT 0,
  expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
  reinsurance_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_result DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Portefeuille agrégé
  total_contracts INTEGER NOT NULL DEFAULT 0,
  total_claims_stock INTEGER NOT NULL DEFAULT 0,
  total_employees INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(turn_id)
);

CREATE INDEX idx_indices_turn ON turn_indices(turn_id);
```

---

### 3.10 Turn Indices by Product

```sql
CREATE TABLE turn_indices_by_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  product_id VARCHAR(50) NOT NULL, -- auto, mrh, pj, gav
  
  -- Métriques par produit
  contracts INTEGER NOT NULL DEFAULT 0,
  premiums DECIMAL(15,2) NOT NULL DEFAULT 0,
  claims_count INTEGER NOT NULL DEFAULT 0,
  claims_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  claims_stock INTEGER NOT NULL DEFAULT 0,
  acquisition INTEGER NOT NULL DEFAULT 0,
  churn INTEGER NOT NULL DEFAULT 0,
  
  -- S/P par produit
  loss_ratio DECIMAL(5,2), -- sinistres/primes
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(turn_id, product_id)
);

CREATE INDEX idx_indices_product_turn ON turn_indices_by_product(turn_id);
CREATE INDEX idx_indices_product_id ON turn_indices_by_product(product_id);
```

---

### 3.11 Scoreboards

```sql
CREATE TABLE scoreboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  -- Scores
  final_score DECIMAL(10,2),
  rank INTEGER,
  
  -- Composants du score
  score_breakdown JSONB, -- {iac: 15, ipqo: 20, ...}
  
  -- Badges obtenus
  badges JSONB DEFAULT '[]', -- ["survivant", "growth_master", ...]
  
  -- Débrief
  debrief_summary JSONB, -- Top décisions, biais, recommandations
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, participant_id)
);

CREATE INDEX idx_scoreboards_session ON scoreboards(session_id);
CREATE INDEX idx_scoreboards_rank ON scoreboards(rank);
```

---

### 3.12 Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL, -- session.create, decision.submit, user.invite
  resource_type VARCHAR(50), -- session, user, tenant
  resource_id UUID,
  
  -- Contexte
  ip_address INET,
  user_agent TEXT,
  
  -- Données
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
```

---

## 4) Politiques RLS (Supabase)

```sql
-- Isolation stricte par tenant
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Exemple policy
CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY tenant_isolation_sessions ON game_sessions
  USING (tenant_id = auth.jwt() ->> 'tenant_id');
```

---

## 5) Cardinalités

| Relation | Cardinalité | Règle de suppression |
|----------|-------------|----------------------|
| tenant → users | 1:N | CASCADE |
| tenant → game_sessions | 1:N | CASCADE |
| user → user_roles | 1:N | CASCADE |
| user → participants | 1:N | CASCADE |
| session → participants | 1:N | CASCADE |
| session → turns | 1:N | CASCADE |
| participant → turns | 1:N | CASCADE |
| turn → turn_decisions | 1:N | CASCADE |
| turn → turn_events | 1:N | CASCADE |
| turn → turn_indices | 1:1 | CASCADE |
| turn → turn_indices_by_product | 1:N | CASCADE |
| session → scoreboards | 1:N | CASCADE |
| tenant → audit_logs | 1:N | CASCADE |

---

## 6) Invariants et contraintes business

```sql
-- Les indices sont TOUJOURS dans [0, 100]
ALTER TABLE turn_indices ADD CONSTRAINT chk_iac_range CHECK (iac >= 0 AND iac <= 100);
-- (déjà fait inline, mais documenté ici)

-- Un participant ne peut avoir qu'une compagnie par session
-- (garantit par UNIQUE(session_id, user_id))

-- Le turn_number est toujours >= 0 et <= session.duration_turns
-- (à vérifier en application)

-- P&L cohérence : net_result = premiums - claims - expenses - reinsurance_cost + financial_income
-- (calculé par le moteur, vérifié en test)
```

---

## 7) Stratégie de migration

### Règles

1. **Numérotation** : `NNNN_description.sql` (ex: `0001_initial_schema.sql`)
2. **Rollback** : chaque migration DOIT avoir un script DOWN
3. **Idempotence** : utiliser `IF NOT EXISTS` quand possible
4. **Test** : toute migration testée sur env dev avant staging/prod

### Template

```sql
-- Migration: 0001_initial_schema.sql
-- Description: Create initial tables

-- UP
CREATE TABLE tenants (...);
CREATE TABLE users (...);

-- DOWN
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS tenants;
```

---

## 8) Décisions actées

| ID | Décision | Date |
|----|----------|------|
| DM-001 | UUID pour toutes les PK | 2025-12 |
| DM-002 | tenant_id obligatoire sur toutes tables scopées | 2025-12 |
| DM-003 | JSONB pour données flexibles (settings, snapshots) | 2025-12 |
| DM-004 | RLS Supabase pour isolation | 2025-12 |
| DM-005 | Soft delete optionnel (deleted_at) | 2025-12 |

---

## 9) Risques & Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Leak cross-tenant** | Critique | RLS + middleware + tests |
| **JSONB non structuré** | Moyen | Schéma documenté + validation app |
| **Volume audit_logs** | Moyen | Partitionnement par date, rétention |
| **Performance calculs** | Moyen | Indexes + caching état courant |
