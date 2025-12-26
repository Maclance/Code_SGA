# API Contract — AssurManager

> **Source of Truth** pour le contrat API REST.
> Dernière mise à jour : 2025-12-26

---

## 1) Conventions générales

### Base URL

```
Production : https://api.assurmanager.com/v1
Staging    : https://api-staging.assurmanager.com/v1
Local      : http://localhost:3000/api/v1
```

### Headers obligatoires

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Tenant-ID: <tenant_uuid>  # Optionnel si présent dans JWT
```

### Format de réponse

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-26T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Format d'erreur

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": {
    "timestamp": "2025-12-26T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## 2) Authentification

### POST /auth/login

Login par email/password.

**Request**
```json
{
  "email": "user@company.com",
  "password": "***"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "email": "user@company.com",
      "display_name": "John Doe",
      "roles": ["player"]
    }
  }
}
```

**Erreurs**
| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email/password incorrect |
| `ACCOUNT_SUSPENDED` | 403 | Compte suspendu |
| `RATE_LIMITED` | 429 | Trop de tentatives |

---

### POST /auth/refresh

Rafraîchir le token.

**Request**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "expires_in": 86400
  }
}
```

---

### POST /auth/logout

Déconnexion (invalide les tokens).

**Response 200**
```json
{
  "success": true,
  "data": { "message": "Logged out" }
}
```

---

## 3) Sessions de jeu

### GET /sessions

Liste des sessions du tenant.

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filtrer par statut (draft, running, ended) |
| `page` | int | Page (défaut: 1) |
| `limit` | int | Par page (défaut: 20, max: 100) |

**Response 200**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "name": "Formation Q1 2025",
        "code": "ABC-1234",
        "status": "running",
        "difficulty": "intermediate",
        "speed": "medium",
        "products": ["auto", "mrh"],
        "current_turn": 3,
        "duration_turns": 12,
        "participants_count": 15,
        "created_at": "2025-12-26T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "total_pages": 3
    }
  }
}
```

---

### POST /sessions

Créer une session (Formateur/Admin).

**Request**
```json
{
  "name": "Formation Q1 2025",
  "difficulty": "intermediate",
  "speed": "medium",
  "duration_turns": 12,
  "products": ["auto", "mrh"],
  "settings": {
    "events_intensity": 1.0,
    "score_weights": { "iac": 0.15, "ipqo": 0.2 }
  }
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "ABC-1234",
    "status": "draft",
    "engine_version": "1.2.0"
  }
}
```

**Erreurs**
| Code | HTTP | Description |
|------|------|-------------|
| `FORBIDDEN` | 403 | Rôle insuffisant |
| `VALIDATION_ERROR` | 400 | Données invalides |

---

### GET /sessions/:id

Détails d'une session.

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Formation Q1 2025",
    "code": "ABC-1234",
    "status": "running",
    "difficulty": "intermediate",
    "speed": "medium",
    "products": ["auto", "mrh"],
    "current_turn": 3,
    "duration_turns": 12,
    "engine_version": "1.2.0",
    "settings": { ... },
    "participants": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "display_name": "John",
        "role": "player",
        "company_id": "axa",
        "status": "active"
      }
    ],
    "created_by": { "id": "uuid", "display_name": "Trainer" },
    "started_at": "2025-12-26T10:30:00Z"
  }
}
```

---

### POST /sessions/:id/join

Rejoindre une session.

**Request**
```json
{
  "code": "ABC-1234"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "participant_id": "uuid",
    "session": { ... },
    "available_companies": [
      { "id": "axa", "name": "AXA France", "traits": [...] }
    ]
  }
}
```

---

### POST /sessions/:id/start

Lancer la session (Formateur).

**Response 200**
```json
{
  "success": true,
  "data": {
    "status": "running",
    "current_turn": 1,
    "started_at": "2025-12-26T10:30:00Z"
  }
}
```

---

## 4) Gameplay

### GET /sessions/:id/cockpit

Dashboard du joueur (tour courant).

**Response 200**
```json
{
  "success": true,
  "data": {
    "turn": 3,
    "status": "in_progress",
    "indices": {
      "iac": 72.5,
      "ipqo": 68.0,
      "ierh": 75.0,
      "irf": 80.0,
      "imd": 45.0,
      "is": 85.0,
      "ipp": 65.0
    },
    "pnl": {
      "premiums": 1250000,
      "claims": 850000,
      "expenses": 200000,
      "reinsurance": 50000,
      "net_result": 150000
    },
    "portfolio": {
      "total_contracts": 12500,
      "by_product": [
        { "product": "auto", "contracts": 8000, "premiums": 750000, "claims_stock": 120 },
        { "product": "mrh", "contracts": 4500, "premiums": 500000, "claims_stock": 80 }
      ]
    },
    "alerts": [
      { "type": "warning", "code": "RH_OVERLOAD", "message": "Charge sinistres élevée" }
    ],
    "pending_effects": [
      { "source": "IT Investment", "expected_turn": 6, "impact": "IMD +10" }
    ]
  }
}
```

---

### GET /sessions/:id/events

Événements du tour courant.

**Response 200**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "EVT-CLIMAT-01",
        "type": "market",
        "name": "Épisode de grêle",
        "description": "Vague de grêle affectant le Nord-Est",
        "severity": "high",
        "impacts": { "mrh": { "claims_frequency": "+30%" } },
        "duration": 2
      }
    ]
  }
}
```

---

### GET /sessions/:id/levers

Leviers disponibles selon difficulté.

**Response 200**
```json
{
  "success": true,
  "data": {
    "levers": [
      {
        "id": "L-PROD-01",
        "category": "produit",
        "name": "Tarification",
        "description": "Ajuster le niveau de prime",
        "scope": "product", // ou "global"
        "products": ["auto", "mrh"],
        "options": [
          { "value": -10, "label": "-10%", "impact_hint": "IAC ↑, IPP ↓" },
          { "value": 0, "label": "Stable" },
          { "value": 10, "label": "+10%", "impact_hint": "IAC ↓, IPP ↑" }
        ],
        "current_value": 0,
        "delay_turns": 1
      }
    ],
    "budget": {
      "available": 500000,
      "allocated": 350000,
      "remaining": 150000
    }
  }
}
```

---

### POST /sessions/:id/decisions

Soumettre les décisions du tour.

**Request**
```json
{
  "decisions": [
    { "lever_id": "L-PROD-01", "product_id": "auto", "value": 5 },
    { "lever_id": "L-PROD-01", "product_id": "mrh", "value": 0 },
    { "lever_id": "L-RH-01", "product_id": null, "value": { "sinistres": 10, "distribution": 5 } },
    { "lever_id": "L-FRAUDE-01", "product_id": null, "value": "N1" }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "turn_id": "uuid",
    "status": "submitted",
    "message": "Décisions enregistrées. Résolution en cours..."
  }
}
```

**Erreurs**
| Code | HTTP | Description |
|------|------|-------------|
| `SESSION_NOT_RUNNING` | 400 | Session pas en cours |
| `TURN_ALREADY_SUBMITTED` | 400 | Tour déjà soumis |
| `BUDGET_EXCEEDED` | 400 | Budget dépassé |
| `INVALID_LEVER` | 400 | Levier invalide ou non disponible |

---

### GET /sessions/:id/market

Vue marché (parts, prix moyens).

**Response 200**
```json
{
  "success": true,
  "data": {
    "market_share": {
      "player": 5.2,
      "competitors": [
        { "company_id": "allianz", "share": 12.5 },
        { "company_id": "generali", "share": 8.3 }
      ]
    },
    "avg_prices": {
      "auto": { "market": 450, "player": 475 },
      "mrh": { "market": 180, "player": 170 }
    },
    "trends": [
      { "metric": "market_growth", "value": -2.5, "period": "last_turn" }
    ]
  }
}
```

---

## 5) Débrief & Scores

### GET /sessions/:id/debrief

Débrief fin de partie.

**Response 200**
```json
{
  "success": true,
  "data": {
    "final_score": 725,
    "rank": 3,
    "total_participants": 15,
    "score_breakdown": {
      "iac": 75,
      "ipqo": 120,
      "ierh": 100,
      "irf": 150,
      "imd": 80,
      "is": 100,
      "ipp": 100
    },
    "badges": ["resilient", "data_pioneer"],
    "top_decisions": [
      { "turn": 3, "lever": "L-IT-01", "impact": "IMD +15 en T6" }
    ],
    "biases_detected": [
      { "type": "short_termism", "description": "Sous-investissement IT/Data" }
    ],
    "recommendations": [
      "Anticiper les investissements IT dès les premiers tours"
    ]
  }
}
```

---

### GET /sessions/:id/scoreboard

Classement de la session.

**Response 200**
```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "participant_id": "uuid",
        "display_name": "Alice",
        "company_id": "axa",
        "final_score": 850,
        "badges": ["champion", "growth_master"]
      }
    ]
  }
}
```

---

## 6) Export

### GET /sessions/:id/export/pdf

Exporter le débrief en PDF.

**Response 200** (Content-Type: application/pdf)

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `include_details` | bool | Inclure tous les tours (défaut: false) |

---

## 7) Administration

### GET /admin/users

Liste utilisateurs du tenant (Admin).

**Query params** : `page`, `limit`, `role`, `status`

---

### POST /admin/users/invite

Inviter un utilisateur.

**Request**
```json
{
  "email": "new@company.com",
  "role": "player",
  "sessions": ["uuid1", "uuid2"]
}
```

---

### GET /admin/audit

Journal d'audit (Admin).

**Query params**
| Param | Type | Description |
|-------|------|-------------|
| `action` | string | Filtrer par action |
| `user_id` | uuid | Filtrer par utilisateur |
| `from` | datetime | Date début |
| `to` | datetime | Date fin |
| `page` | int | Page |
| `limit` | int | Par page |

---

## 8) Pagination

Format standard :

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 9) Codes d'erreur

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant ou invalide |
| `FORBIDDEN` | 403 | Permission refusée |
| `NOT_FOUND` | 404 | Ressource introuvable |
| `VALIDATION_ERROR` | 400 | Données invalides |
| `CONFLICT` | 409 | Conflit (ex: email déjà pris) |
| `RATE_LIMITED` | 429 | Trop de requêtes |
| `INTERNAL_ERROR` | 500 | Erreur serveur |

---

## 10) Décisions actées

| ID | Décision | Date |
|----|----------|------|
| API-001 | REST JSON (pas GraphQL MVP) | 2025-12 |
| API-002 | JWT pour auth | 2025-12 |
| API-003 | Pagination offset-based | 2025-12 |
| API-004 | Versioning URL (/v1) | 2025-12 |
