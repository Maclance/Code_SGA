# Script pour nettoyer les issues GitHub (supprimer doublons par numero US)
# Usage: .\cleanup_github_issues.ps1

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

Write-Host "=== ETAPE 1: Recuperation de toutes les issues ===" -ForegroundColor Yellow

# Recuperer toutes les issues ouvertes
$allIssues = gh issue list --repo $repo --limit 200 --state open --json "number,title" | ConvertFrom-Json

Write-Host "Total issues ouvertes: $($allIssues.Count)" -ForegroundColor Green

Write-Host "`n=== ETAPE 2: Extraction des numeros US ===" -ForegroundColor Yellow

# Creer une hashtable pour regrouper par US
$usGroups = @{}

foreach ($issue in $allIssues) {
    # Extraire US-XXX du titre
    if ($issue.title -match "US-(\d+)") {
        $usNumber = "US-" + $matches[1]
        
        if (-not $usGroups.ContainsKey($usNumber)) {
            $usGroups[$usNumber] = @()
        }
        $usGroups[$usNumber] += @{
            number = $issue.number
            title  = $issue.title
        }
    }
}

Write-Host "Numeros US uniques trouves: $($usGroups.Count)" -ForegroundColor Green

Write-Host "`n=== ETAPE 3: Identification des doublons ===" -ForegroundColor Yellow

$duplicates = @()
$singleIssues = 0

foreach ($usNumber in $usGroups.Keys | Sort-Object) {
    $issues = $usGroups[$usNumber]
    
    if ($issues.Count -gt 1) {
        Write-Host "`n$usNumber a $($issues.Count) issues:" -ForegroundColor Red
        
        # Trier par numero d'issue DESCENDANT (garder le plus recent)
        $sorted = $issues | Sort-Object { $_.number } -Descending
        $keep = $sorted[0]
        Write-Host "  GARDER #$($keep.number)" -ForegroundColor Green
        
        for ($i = 1; $i -lt $sorted.Count; $i++) {
            $toClose = $sorted[$i]
            Write-Host "  FERMER #$($toClose.number)" -ForegroundColor Red
            $duplicates += $toClose.number
        }
    }
    else {
        $singleIssues++
    }
}

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "RESUME:" -ForegroundColor Yellow
Write-Host "  - US uniques: $($usGroups.Count)"
Write-Host "  - US sans doublon: $singleIssues"
Write-Host "  - US avec doublons: $($usGroups.Count - $singleIssues)"
Write-Host "  - Doublons a FERMER: $($duplicates.Count)"
Write-Host "  - Issues finales: $($usGroups.Count) (1 par US)"
Write-Host "========================================" -ForegroundColor Yellow

if ($duplicates.Count -gt 0) {
    Write-Host "`nIssues a fermer: $($duplicates -join ', ')" -ForegroundColor Red
    
    $confirm = Read-Host "`nVoulez-vous fermer ces $($duplicates.Count) issues en doublon? (O/N)"
    
    if ($confirm -eq "O" -or $confirm -eq "o") {
        foreach ($issueNum in $duplicates) {
            Write-Host "Fermeture de l'issue #$issueNum..." -ForegroundColor DarkGray
            gh issue close $issueNum --repo $repo --reason "not planned" --comment "Ferme car doublon"
            Start-Sleep -Milliseconds 500
        }
        Write-Host "`nDoublons fermes!" -ForegroundColor Green
    }
    else {
        Write-Host "Operation annulee." -ForegroundColor Yellow
    }
}
else {
    Write-Host "`nAucun doublon trouve!" -ForegroundColor Green
}
