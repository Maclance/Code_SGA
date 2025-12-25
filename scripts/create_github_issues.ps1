# Script pour creer les issues GitHub manquantes
# Usage: .\create_github_issues.ps1

# Ajouter GitHub CLI au PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Program Files\GitHub CLI"

# Token GitHub - doit être défini via variable d'environnement
if (-not $env:GH_TOKEN) {
    Write-Host "ERREUR: La variable d'environnement GH_TOKEN n'est pas definie." -ForegroundColor Red
    Write-Host "Utilisez: `$env:GH_TOKEN = 'votre_token_github'" -ForegroundColor Yellow
    Write-Host "Ou authentifiez-vous avec: gh auth login" -ForegroundColor Yellow
    exit 1
}
$repo = "Maclance/Code_SGA"

# Fonction pour creer une issue
function Create-Issue {
    param(
        [string]$us,
        [string]$title,
        [string]$body,
        [string]$epic,
        [string]$priority,
        [string]$release,
        [string]$size
    )
    
    $labels = @("epic: $epic", "priority: $priority", "release: $release")
    if ($size) { $labels += "size: $size" }
    
    $labelsArg = ($labels | ForEach-Object { "--label `"$_`"" }) -join " "
    
    $milestone = if ($release -eq "MVP") { "MVP" } elseif ($release -eq "V1") { "V1" } else { "V2" }
    
    Write-Host "Creating $us : $title" -ForegroundColor Cyan
    
    $cmd = "gh issue create --repo $repo --title `"$us : $title`" --body `"$body`" $labelsArg --milestone `"$milestone`""
    Invoke-Expression $cmd
    
    Start-Sleep -Seconds 1
}

# Liste des US a creer
$issues = @(
    @{US = "US-000"; Title = "Initialiser Supabase et connecter l app"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = ""; Body = "## Objectif`nL app demarre, parle a Supabase, et je peux faire un select 1 + login basique.`n`n## Contenu`n- [ ] Creation projet Supabase + recuperation SUPABASE_URL / ANON_KEY`n- [ ] Ajout des variables d env + initialisation du client Supabase dans l app`n- [ ] Migrations initiales (schema minimal + tables tenants/users placeholder si besoin)`n- [ ] Verif connexion (healthcheck)" },
    
    @{US = "US-001"; Title = "Creer et gerer des tenants (entreprises/ecoles)"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Given super admin, When creation tenant, Then tenant_id unique + parametres init`n- AC2: Toutes les donnees tenant-scoped sont isolees (filtrage strict)" },
    
    @{US = "US-002"; Title = "Inviter des utilisateurs et attribuer un role (Admin tenant / Formateur / Joueur / Observateur)"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: When invitation envoyee, Then lien activation + expiration`n- AC2: RBAC empeche l acces non autorise aux ecrans/actions" },
    
    @{US = "US-003"; Title = "Authentification securisee (login/logout, reset)"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: When login valide, Then session creee + expiration`n- AC2: Tentatives invalides journalisees" },
    
    @{US = "US-004"; Title = "Journal d audit (actions sensibles)"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: When creation/modif session, Then audit log qui/quand/quoi`n- AC2: Consultation audit par Admin tenant" },
    
    @{US = "US-005"; Title = "Stocker l etat complet d une partie par tour"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Chaque tour persiste : decisions, evenements, indices, P&L, metriques portefeuille`n- AC2: Reprise/relecture au tour N possible" },
    
    @{US = "US-006"; Title = "Gestion version moteur (engine_version)"; Epic = "E0"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Chaque partie reference engine_version`n- AC2: Recalcul retroactif interdit par defaut" },
    
    @{US = "US-010"; Title = "Creer une session avec : vitesse, difficulte, duree, produits 1+, catalogue evenements baseline"; Epic = "E1"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Given session, When produits selectionnes, Then UI/leviers se configurent en consequence`n- AC2: Impossible de lancer sans au moins 1 produit" },
    
    @{US = "US-011"; Title = "Generer un code/lien de session (rejoindre)"; Epic = "E1"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: When session creee, Then code unique + etat brouillon/prete/lancee/terminee" },
    
    @{US = "US-012"; Title = "Rejoindre une session, choisir une compagnie parmi 18"; Epic = "E1"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Fiche compagnie (traits) visible avant confirmation`n- AC2: Selection verrouillee au lancement" },
    
    @{US = "US-013"; Title = "Confirmer le scope produits (affiche au joueur) avant tour 1"; Epic = "E1"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Le joueur voit les produits inclus (Auto/MRH...)" },
    
    @{US = "US-014"; Title = "Tour : dashboard - evenements - decisions - resolution - feedback"; Epic = "E1"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: When decision validee, Then calcul moteur + passage tour N+1`n- AC2: Feedback resume variations majeures" },
    
    @{US = "US-015"; Title = "Timer de tour (synchrone multijoueur)"; Epic = "E1"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: When timer expire, Then auto-submit selon regles (derniere decision ou defaut)" },
    
    @{US = "US-020"; Title = "Calcul des 7 indices + P&L pedagogique"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Indices`nIAC, IPQO, IERH, IRF, IMD, IS, IPP`n`n## Criteres d acceptation`n- AC1: Chaque levier impacte au moins un indice`n- AC2: P&L inclut primes, sinistres, frais, reassurance (niveau macro)" },
    
    @{US = "US-021"; Title = "Calculs par produit + agregation compagnie"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Given Auto+MRH, When decision RH/IT, Then impact partage (capacite/qualite)`n- AC2: When tarif Auto change, Then metriques Auto evoluent sans ecraser MRH" },
    
    @{US = "US-022"; Title = "Ressources communes (budget, effectifs, IT/Data) competitionnent entre produits"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: L allocation budget affiche consommation/solde et impacts" },
    
    @{US = "US-023"; Title = "Effets retard parametres par vitesse"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Delais`n- RH : ~2 tours (trimestre)`n- IT/Data : 3-6`n- Prevention : 4-8`n- Reputation : 1-3`n`n## Criteres d acceptation`n- AC1: UI indique effet differe attendu" },
    
    @{US = "US-024"; Title = "Persistance relative + compensation possible (cout croissant)"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: La correction est possible mais plus chere si tardive`n- AC2: Historique des decisions accessible" },
    
    @{US = "US-025"; Title = "Fraude niveau 1 (quick wins)"; Epic = "E2"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Effet rapide mais plafonne" },
    
    @{US = "US-026"; Title = "Fraude niveaux 2 et 3 avec prerequis (outillage/data/formation)"; Epic = "E2"; Priority = "P1"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: N2 necessite budget+process/formation`n- AC2: N3 necessite maturite data + inertie + ROI differe" },
    
    @{US = "US-027"; Title = "Concurrents IA simple (reagit aux prix/parts)"; Epic = "E2"; Priority = "P1"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Le marche evolue meme sans action joueur" },
    
    @{US = "US-028"; Title = "IA concurrente strategique (profils)"; Epic = "E2"; Priority = "P2"; Release = "V2"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Profils (agressif/prudent/data-driven) sont differencies" },
    
    @{US = "US-030"; Title = "Dashboard : indices + P&L + alertes + batterie d indicateurs par produit + total"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Indicateurs MVP minimum`n- Nb contrats (par produit + total)`n- Primes collectees (par produit + total)`n- Stock sinistres (par produit + total)`n- Effectif total + repartition macro (sinistres/distribution/data-IT/support)`n`n## Criteres d acceptation`n- AC1: Affichage grille produits + total`n- AC2: Niveau detail varie selon difficulte (novice macro, intermediaire +)" },
    
    @{US = "US-031"; Title = "Series temporelles (indices et P&L)"; Epic = "E3"; Priority = "P1"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Visualisation par tour (courbe)" },
    
    @{US = "US-032"; Title = "Alertes (goulot RH, derive stock sinistres, resilience faible, dette IT)"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: When seuil franchi, Then alerte affiche cause probable + leviers conseilles" },
    
    @{US = "US-033"; Title = "News flash + details (impact + duree)"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: L evenement indique marche ou compagnie" },
    
    @{US = "US-034"; Title = "Decisions avec gating selon difficulte"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Novice : leviers macro`n- AC2: Intermediaire : leviers supplementaires + granularite" },
    
    @{US = "US-035"; Title = "Indication directionnelle d impact (haut/bas + delai)"; Epic = "E3"; Priority = "P1"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Indique incertitude / retard (sans promesse de formule)" },
    
    @{US = "US-036"; Title = "Parts de marche + prix moyens + tendances (par produit + global)"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Tableau comparatif joueur vs marche" },
    
    @{US = "US-037"; Title = "Pourquoi ca bouge (top 3 drivers) pour variations majeures"; Epic = "E3"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Drivers = decisions / evenements / effets retard" },
    
    @{US = "US-038"; Title = "Timeline de relecture tour par tour"; Epic = "E3"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Navigation rapide N vers N+1 et filtres par produit" },
    
    @{US = "US-040"; Title = "18 fiches compagnies + traits appliques au moteur"; Epic = "E4"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Chaque compagnie a au moins 3 traits ayant un effet moteur" },
    
    @{US = "US-041"; Title = "Produits jouables MVP : Auto + MRH"; Epic = "E4"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Metriques et leviers dedies existent pour chaque produit" },
    
    @{US = "US-042"; Title = "Produits jouables V1 : PJ + GAV"; Epic = "E4"; Priority = "P1"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Ajout sans casser Auto/MRH (design modulaire)" },
    
    @{US = "US-043"; Title = "Evenements marche : climat, inflation, reglementation, disrupteur, mutation parc auto"; Epic = "E4"; Priority = "P0"; Release = "MVP"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: S appliquent a tous avec modulation par strategie" },
    
    @{US = "US-044"; Title = "Evenements compagnie : au moins cyber/panne SI + 1 autre"; Epic = "E4"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Declenchement influence par vulnerabilites (ex IMD faible)" },
    
    @{US = "US-045"; Title = "Scenarios thematiques preconfigures"; Epic = "E4"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Objectifs + ponderations scoring specifiques" },
    
    @{US = "US-050"; Title = "Score global (ponderation indices + objectifs)"; Epic = "E5"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Score final explicable (composants visibles)" },
    
    @{US = "US-051"; Title = "Ponderations variables selon mode (survie vs standard)"; Epic = "E5"; Priority = "P1"; Release = "V1"; Size = "S"; Body = "## Criteres d acceptation`n- AC1: Mode survie valorise IRF + IPQO" },
    
    @{US = "US-052"; Title = "Debrief fin de partie : decisions cles + impacts immediats/differes + biais"; Epic = "E5"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Liste top 5 decisions determinantes" },
    
    @{US = "US-053"; Title = "Export PDF simple"; Epic = "E5"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: PDF contient : contexte, courbes indices, P&L macro, top evenements, score" },
    
    @{US = "US-054"; Title = "Debrief seminaire / equipes"; Epic = "E5"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Distribution des choix par equipe + comparaison" },
    
    @{US = "US-060"; Title = "Admin : gerer participants (import/invite) et roles"; Epic = "E6"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Observateur n a pas acces a la soumission de decisions" },
    
    @{US = "US-061"; Title = "Chef d equipe (seminaire) : droits de consolidation"; Epic = "E6"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Un chef d equipe peut valider la decision de l equipe" },
    
    @{US = "US-062"; Title = "Parametrer ponderations indices, intensite/frequence evenements, reglage realisme"; Epic = "E6"; Priority = "P1"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Warnings si reglage extreme" },
    
    @{US = "US-063"; Title = "Branding tenant"; Epic = "E6"; Priority = "P2"; Release = "V2"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Logo/couleurs refletes dans UI + exports" },
    
    @{US = "US-064"; Title = "Vue admin : score, completion, temps/tour, export"; Epic = "E6"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Filtre par session / produit / difficulte" },
    
    @{US = "US-070"; Title = "Event tracking : session_start, turn_start/end, decision_submit, event_triggered, debrief_open, export_pdf"; Epic = "E7"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Chaque evenement inclut tenant_id, session_id, user_id (si applicable)" },
    
    @{US = "US-071"; Title = "Tableau KPI produit (admin)"; Epic = "E7"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: KPI : completion, nb sessions/utilisateur, temps moyen/tour" },
    
    @{US = "US-072"; Title = "KPI pedagogiques : progression par competence + detection biais"; Epic = "E7"; Priority = "P2"; Release = "V2"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Recommandations prochaine partie cote formateur" },
    
    @{US = "US-080"; Title = "Lobby multijoueur : rejoindre, former equipes, ready-check"; Epic = "E8"; Priority = "P0"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Aucune notion de plafond fonctionnel`n- AC2: Gouvernance via equipes et roles" },
    
    @{US = "US-081"; Title = "Tour synchrone + decision par equipe (vote ou chef d equipe)"; Epic = "E8"; Priority = "P0"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Regles d egalite definies" },
    
    @{US = "US-082"; Title = "Role Observateur (lecture seule) + mode projection"; Epic = "E8"; Priority = "P0"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: UI projection est lisible sur grand ecran" },
    
    @{US = "US-083"; Title = "Pause, acceleration, injection evenement, commentaire"; Epic = "E8"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Actions facilitateur audit-loggees" },
    
    @{US = "US-084"; Title = "Classement live inter-equipes + moments cles"; Epic = "E8"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Historique des positions consultable" },
    
    @{US = "US-090"; Title = "RGPD : minimisation + export/suppression utilisateur"; Epic = "E9"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Suppression anonymise les traces non essentielles" },
    
    @{US = "US-091"; Title = "Securite : RBAC strict + protections de base (rate limiting, brute force)"; Epic = "E9"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Tentatives suspectes journalisees" },
    
    @{US = "US-092"; Title = "Logs techniques + metriques (latence calcul, erreurs)"; Epic = "E9"; Priority = "P0"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Dashboard interne sante moteur" },
    
    @{US = "US-093"; Title = "Optimisation temps reel (fan-out, cache, throttling)"; Epic = "E9"; Priority = "P1"; Release = "V1"; Size = "L"; Body = "## Criteres d acceptation`n- AC1: Tests de charge valides pour 200+ participants/observateurs (objectif latence defini)" },
    
    @{US = "US-100"; Title = "Guide in-app (tooltips + checklist premiere partie)"; Epic = "E10"; Priority = "P1"; Release = "MVP"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Un novice comprend la boucle en moins de 5 min" },
    
    @{US = "US-101"; Title = "Kit facilitateur (script, timings, regles)"; Epic = "E10"; Priority = "P1"; Release = "V1"; Size = "M"; Body = "## Criteres d acceptation`n- AC1: Exportable/printable" }
)

# Recuperer les issues existantes
Write-Host "Recuperation des issues existantes..." -ForegroundColor Yellow
$existingIssues = gh issue list --repo $repo --limit 200 --json title | ConvertFrom-Json

$existingTitles = $existingIssues | ForEach-Object { $_.title }

Write-Host "Issues existantes: $($existingTitles.Count)" -ForegroundColor Green

# Creer les issues manquantes
$created = 0
$skipped = 0

foreach ($issue in $issues) {
    $titlePattern = "$($issue.US) :"
    $exists = $existingTitles | Where-Object { $_ -like "$titlePattern*" }
    
    if ($exists) {
        Write-Host "SKIP: $($issue.US) existe deja" -ForegroundColor DarkGray
        $skipped++
    }
    else {
        Create-Issue -us $issue.US -title $issue.Title -body $issue.Body -epic $issue.Epic -priority $issue.Priority -release $issue.Release -size $issue.Size
        $created++
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Resume:" -ForegroundColor Green
Write-Host "  - Issues creees: $created" -ForegroundColor Cyan
Write-Host "  - Issues ignorees (existantes): $skipped" -ForegroundColor DarkGray
Write-Host "========================================" -ForegroundColor Green
