# Script pour créer les issues GitHub pour AssurManager MVP
# Exécuter avec: $env:GH_TOKEN = "votre_token"; .\scripts\create-github-issues.ps1

# Configuration avec chemin complet vers gh.exe
$ghExe = "C:\Program Files\GitHub CLI\gh.exe"

# Vérifier que le token est défini
if (-not $env:GH_TOKEN) {
    Write-Host "ERREUR: Variable GH_TOKEN non définie." -ForegroundColor Red
    Write-Host "Exécutez: `$env:GH_TOKEN = 'votre_token_github'" -ForegroundColor Yellow
    exit 1
}

$repo = "Maclance/Code_SGA"

Write-Host "=== Configuration GitHub pour AssurManager ===" -ForegroundColor Cyan
Write-Host "Repository: $repo"

# Vérifier l'authentification
Write-Host "`n[1/4] Vérification de l'authentification..." -ForegroundColor Yellow
& $ghExe auth status

# Créer les labels
Write-Host "`n[2/4] Création des labels..." -ForegroundColor Yellow

$labels = @(
    @{name = "priority: P0"; color = "b60205"; description = "Indispensable MVP" },
    @{name = "priority: P1"; color = "d93f0b"; description = "Important V1" },
    @{name = "priority: P2"; color = "0e8a16"; description = "Nice-to-have V2" },
    @{name = "release: MVP"; color = "1d76db"; description = "Scope MVP" },
    @{name = "release: V1"; color = "5319e7"; description = "Scope V1" },
    @{name = "release: V2"; color = "fbca04"; description = "Scope V2" },
    @{name = "size: S"; color = "c5def5"; description = "Petite tache" },
    @{name = "size: M"; color = "bfd4f2"; description = "Tache moyenne" },
    @{name = "size: L"; color = "0052cc"; description = "Grande tache" },
    @{name = "epic: E0"; color = "d4c5f9"; description = "Foundations SaaS" },
    @{name = "epic: E1"; color = "d4c5f9"; description = "Sessions Core Loop" },
    @{name = "epic: E2"; color = "d4c5f9"; description = "Moteur Simulation" },
    @{name = "epic: E3"; color = "d4c5f9"; description = "UI Cockpit" },
    @{name = "epic: E4"; color = "d4c5f9"; description = "Contenu" },
    @{name = "epic: E5"; color = "d4c5f9"; description = "Scoring Debrief" },
    @{name = "epic: E6"; color = "d4c5f9"; description = "Admin B2B" },
    @{name = "epic: E7"; color = "d4c5f9"; description = "Instrumentation" },
    @{name = "epic: E9"; color = "d4c5f9"; description = "Non-fonctionnel" }
)

foreach ($label in $labels) {
    Write-Host "  Creating label: $($label.name)"
    & $ghExe label create $label.name --color $label.color --description $label.description --repo $repo --force 2>$null
}

# Créer les milestones
Write-Host "`n[3/4] Création des milestones..." -ForegroundColor Yellow
& $ghExe api repos/$repo/milestones -f title="MVP" -f description="Jouer et apprendre en solo" -f state="open" 2>$null
& $ghExe api repos/$repo/milestones -f title="V1" -f description="Multijoueur et seminaire 200+" -f state="open" 2>$null
& $ghExe api repos/$repo/milestones -f title="V2" -f description="Scale et differenciation" -f state="open" 2>$null

# Créer les issues P0 MVP
Write-Host "`n[4/4] Création des issues P0 MVP..." -ForegroundColor Yellow

$issues = @(
    # E0 - Foundations SaaS
    @{title = "US-001: Multi-tenant - Creer et gerer des tenants"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: Given super admin, When creation tenant, Then tenant_id unique + parametres init`n- AC2: Toutes les donnees tenant-scoped sont isolees (filtrage strict)"; labels = "priority: P0,release: MVP,size: L,epic: E0" },
    @{title = "US-002: RBAC - Inviter des utilisateurs et attribuer des roles"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: When invitation envoyee, Then lien activation + expiration`n- AC2: RBAC empeche l'acces non autorise aux ecrans/actions"; labels = "priority: P0,release: MVP,size: L,epic: E0" },
    @{title = "US-003: Auth - Authentification securisee (login/logout, reset)"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: When login valide, Then session creee + expiration`n- AC2: Tentatives invalides journalisees"; labels = "priority: P0,release: MVP,size: M,epic: E0" },
    @{title = "US-004: Audit - Journal d'audit (actions sensibles)"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: When creation/modif session, Then audit log qui/quand/quoi`n- AC2: Consultation audit par Admin tenant"; labels = "priority: P0,release: MVP,size: M,epic: E0" },
    @{title = "US-005: Stocker l'etat complet d'une partie par tour"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: Chaque tour persiste: decisions, evenements, indices, PnL, metriques portefeuille`n- AC2: Reprise/relecture au tour N possible"; labels = "priority: P0,release: MVP,size: L,epic: E0" },
    @{title = "US-006: Gestion version moteur (engine_version)"; body = "**Epic**: E0 - Foundations SaaS`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Chaque partie reference engine_version`n- AC2: Recalcul retroactif interdit par defaut"; labels = "priority: P0,release: MVP,size: M,epic: E0" },

    # E1 - Sessions & Core Gameplay Loop
    @{title = "US-010: Creer session (vitesse, difficulte, produits 1+)"; body = "**Epic**: E1 - Sessions Core Loop`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Given session, When produits selectionnes, Then UI/leviers se configurent`n- AC2: Impossible de lancer sans au moins 1 produit"; labels = "priority: P0,release: MVP,size: M,epic: E1" },
    @{title = "US-011: Generer code/lien de session"; body = "**Epic**: E1 - Sessions Core Loop`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: When session creee, Then code unique + etat brouillon/prete/lancee/terminee"; labels = "priority: P0,release: MVP,size: M,epic: E1" },
    @{title = "US-012: Rejoindre session, choisir compagnie parmi 18"; body = "**Epic**: E1 - Sessions Core Loop`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Fiche compagnie (traits) visible avant confirmation`n- AC2: Selection verrouillee au lancement"; labels = "priority: P0,release: MVP,size: M,epic: E1" },
    @{title = "US-013: Confirmer scope produits avant tour 1"; body = "**Epic**: E1 - Sessions Core Loop`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Le joueur voit les produits inclus (Auto/MRH...)"; labels = "priority: P0,release: MVP,size: M,epic: E1" },
    @{title = "US-014: Boucle de tour complete (dashboard - evenements - decisions - resolution - feedback)"; body = "**Epic**: E1 - Sessions Core Loop`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: When decision validee, Then calcul moteur + passage tour N+1`n- AC2: Feedback resume variations majeures"; labels = "priority: P0,release: MVP,size: L,epic: E1" },

    # E2 - Moteur Simulation
    @{title = "US-020: Calcul des 7 indices + PnL pedagogique"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: L`n`nIndices: IAC, IPQO, IERH, IRF, IMD, IS, IPP`n`n## Criteres d'acceptation`n- AC1: Chaque levier impacte au moins un indice`n- AC2: PnL inclut primes, sinistres, frais, reassurance (niveau macro)"; labels = "priority: P0,release: MVP,size: L,epic: E2" },
    @{title = "US-021: Calculs par produit + agregation compagnie"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: Given Auto+MRH, When decision RH/IT, Then impact partage (capacite/qualite)`n- AC2: When tarif Auto change, Then metriques Auto evoluent sans ecraser MRH"; labels = "priority: P0,release: MVP,size: L,epic: E2" },
    @{title = "US-022: Ressources communes (budget, effectifs, IT/Data)"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: L'allocation budget affiche consommation/solde et impacts"; labels = "priority: P0,release: MVP,size: M,epic: E2" },
    @{title = "US-023: Effets retard parametres par vitesse"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: L`n`nRH: ~2 tours, IT/Data: 3-6, prevention: 4-8, reputation: 1-3`n`n## Criteres d'acceptation`n- AC1: UI indique effet differe attendu"; labels = "priority: P0,release: MVP,size: L,epic: E2" },
    @{title = "US-024: Persistance relative + compensation possible"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: La correction est possible mais plus chere si tardive`n- AC2: Historique des decisions accessible"; labels = "priority: P0,release: MVP,size: L,epic: E2" },
    @{title = "US-025: Fraude niveau 1 (quick wins)"; body = "**Epic**: E2 - Moteur Simulation`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Effet rapide mais plafonne"; labels = "priority: P0,release: MVP,size: M,epic: E2" },

    # E3 - UI Cockpit
    @{title = "US-030: Dashboard enrichi par produit + indicateurs"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: L`n`nIndicateurs MVP minimum:`n- Nb contrats (par produit + total)`n- Primes collectees (par produit + total)`n- Stock sinistres (par produit + total)`n- Effectif total + repartition macro`n`n## Criteres d'acceptation`n- AC1: Affichage grille produits + total`n- AC2: Niveau detail varie selon difficulte"; labels = "priority: P0,release: MVP,size: L,epic: E3" },
    @{title = "US-032: Alertes (goulot RH, derive sinistres, resilience faible)"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: When seuil franchi, Then alerte affiche cause probable + leviers conseilles"; labels = "priority: P0,release: MVP,size: M,epic: E3" },
    @{title = "US-033: News flash + details evenements"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: L'evenement indique marche ou compagnie"; labels = "priority: P0,release: MVP,size: M,epic: E3" },
    @{title = "US-034: Decisions avec gating selon difficulte"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: Novice = leviers macro`n- AC2: Intermediaire = leviers supplementaires + granularite"; labels = "priority: P0,release: MVP,size: L,epic: E3" },
    @{title = "US-036: Vue marche (parts de marche, prix moyens)"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Tableau comparatif joueur vs marche"; labels = "priority: P0,release: MVP,size: M,epic: E3" },
    @{title = "US-037: Explainability - Pourquoi ca bouge (top 3 drivers)"; body = "**Epic**: E3 - UI Cockpit`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Drivers = decisions / evenements / effets retard"; labels = "priority: P0,release: MVP,size: M,epic: E3" },

    # E4 - Contenu
    @{title = "US-040: 18 fiches compagnies + traits appliques au moteur"; body = "**Epic**: E4 - Contenu`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Chaque compagnie a au moins 3 traits ayant un effet moteur"; labels = "priority: P0,release: MVP,size: M,epic: E4" },
    @{title = "US-041: Produits jouables MVP - Auto + MRH"; body = "**Epic**: E4 - Contenu`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: Metriques et leviers dedies existent pour chaque produit"; labels = "priority: P0,release: MVP,size: L,epic: E4" },
    @{title = "US-043: Evenements marche (climat, inflation, reglementation, disrupteur)"; body = "**Epic**: E4 - Contenu`n**Priorite**: P0`n**Taille**: L`n`n## Criteres d'acceptation`n- AC1: S'appliquent a tous avec modulation par strategie"; labels = "priority: P0,release: MVP,size: L,epic: E4" },
    @{title = "US-044: Evenements compagnie (cyber/panne SI + 1 autre)"; body = "**Epic**: E4 - Contenu`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Declenchement influence par vulnerabilites (ex IMD faible)"; labels = "priority: P0,release: MVP,size: M,epic: E4" },

    # E5 - Scoring & Debrief
    @{title = "US-050: Score global (ponderation indices + objectifs)"; body = "**Epic**: E5 - Scoring Debrief`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Score final explicable (composants visibles)"; labels = "priority: P0,release: MVP,size: M,epic: E5" },
    @{title = "US-052: Debrief fin de partie (decisions cles + impacts + biais)"; body = "**Epic**: E5 - Scoring Debrief`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Liste top 5 decisions determinantes"; labels = "priority: P0,release: MVP,size: M,epic: E5" },
    @{title = "US-053: Export PDF simple"; body = "**Epic**: E5 - Scoring Debrief`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: PDF contient: contexte, courbes indices, PnL macro, top evenements, score"; labels = "priority: P0,release: MVP,size: M,epic: E5" },

    # E6 - Admin B2B
    @{title = "US-060: Gerer participants (import/invite) et roles"; body = "**Epic**: E6 - Admin B2B`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Observateur n'a pas acces a la soumission de decisions"; labels = "priority: P0,release: MVP,size: M,epic: E6" },
    @{title = "US-064: Vue admin scores/completion/temps par tour/export"; body = "**Epic**: E6 - Admin B2B`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Filtre par session / produit / difficulte"; labels = "priority: P0,release: MVP,size: M,epic: E6" },

    # E7 - Instrumentation
    @{title = "US-070: Event tracking (session_start, turn_start/end, decision_submit...)"; body = "**Epic**: E7 - Instrumentation`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Chaque evenement inclut tenant_id, session_id, user_id (si applicable)"; labels = "priority: P0,release: MVP,size: M,epic: E7" },
    @{title = "US-071: Tableau KPI produit (admin)"; body = "**Epic**: E7 - Instrumentation`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: KPI: completion, nb sessions/utilisateur, temps moyen/tour"; labels = "priority: P0,release: MVP,size: M,epic: E7" },

    # E9 - Non-fonctionnel
    @{title = "US-090: RGPD - minimisation + export/suppression utilisateur"; body = "**Epic**: E9 - Non-fonctionnel`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Suppression anonymise les traces non essentielles"; labels = "priority: P0,release: MVP,size: M,epic: E9" },
    @{title = "US-091: Securite RBAC strict + protections de base"; body = "**Epic**: E9 - Non-fonctionnel`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Tentatives suspectes journalisees"; labels = "priority: P0,release: MVP,size: M,epic: E9" },
    @{title = "US-092: Logs techniques + metriques (latence calcul, erreurs)"; body = "**Epic**: E9 - Non-fonctionnel`n**Priorite**: P0`n**Taille**: M`n`n## Criteres d'acceptation`n- AC1: Dashboard interne sante moteur"; labels = "priority: P0,release: MVP,size: M,epic: E9" }
)

$count = 0
foreach ($issue in $issues) {
    $count++
    Write-Host "  [$count/$($issues.Count)] Creating: $($issue.title)"
    & $ghExe issue create --repo $repo --title $issue.title --body $issue.body --label $issue.labels
    Start-Sleep -Milliseconds 300
}

Write-Host "`n=== Termine! ===" -ForegroundColor Green
Write-Host "Issues creees: $count"
Write-Host "Verifiez sur: https://github.com/$repo/issues"
