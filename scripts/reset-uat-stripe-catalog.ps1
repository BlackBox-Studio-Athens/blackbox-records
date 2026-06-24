#Requires -Version 7.0

[CmdletBinding()]
param(
  [switch]$PlanOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$confirmationPhrase = 'RESET UAT STRIPE TEST CATALOG'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$scriptPath = (Resolve-Path $PSCommandPath).Path
$scriptRelativePath = $scriptPath.Substring($repoRoot.Length + 1).Replace('\', '/')
$previousStripeSecretKey = $env:STRIPE_SECRET_KEY
$secretBstr = [IntPtr]::Zero

function Write-Step {
  param([Parameter(Mandatory)][string]$Message)
  Write-Host ''
  Write-Host "==> $Message"
}

function Invoke-RepoCommand {
  param(
    [Parameter(Mandatory)][string]$Command,
    [Parameter(Mandatory)][string[]]$Arguments
  )

  Write-Host "> $Command $($Arguments -join ' ')"
  & $Command @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code $LASTEXITCODE`: $Command $($Arguments -join ' ')"
  }
}

function Read-GitText {
  param([Parameter(Mandatory)][string[]]$Arguments)

  $output = & git @Arguments

  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($Arguments -join ' ')"
  }

  return ($output -join "`n").Trim()
}

function Assert-SafeCatalogSourceTree {
  $branch = Read-GitText @('rev-parse', '--abbrev-ref', 'HEAD')

  if ($branch -ne 'main') {
    throw "Refusing to mutate UAT catalog from branch '$branch'. Switch to main first."
  }

  $head = Read-GitText @('rev-parse', 'HEAD')
  $upstream = Read-GitText @('rev-parse', '@{u}')

  if ($head -ne $upstream) {
    throw 'Refusing to mutate UAT catalog because local main is not at its upstream commit.'
  }

  $dirtyLines = @(& git status --short --untracked-files=all)

  if ($LASTEXITCODE -ne 0) {
    throw 'Git status failed.'
  }

  $unexpectedDirtyLines = @(
    $dirtyLines | Where-Object {
      $line = $_
      $path = ($line -replace '^\S+\s+', '').Trim().Replace('\', '/')
      $path -ne $scriptRelativePath
    }
  )

  if ($unexpectedDirtyLines.Count -gt 0) {
    throw "Refusing to mutate UAT catalog with unexpected local changes:`n$($unexpectedDirtyLines -join "`n")"
  }
}

function Read-UatStripeTestSecret {
  $secureSecret = Read-Host 'Paste UAT Stripe test STRIPE_SECRET_KEY (input hidden)' -AsSecureString
  $script:secretBstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
  $secret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($script:secretBstr).Trim()

  if (-not $secret.StartsWith('sk_test_', [StringComparison]::Ordinal)) {
    throw 'Refusing secret: expected a Stripe test secret key starting with sk_test_.'
  }

  if ($secret.StartsWith('sk_live_', [StringComparison]::Ordinal)) {
    throw 'Refusing secret: live Stripe keys are never allowed in this UAT reset script.'
  }

  $env:STRIPE_SECRET_KEY = $secret
}

function Invoke-Pnpm {
  param([Parameter(Mandatory)][string[]]$Arguments)
  Invoke-RepoCommand -Command 'pnpm' -Arguments $Arguments
}

function Invoke-UatD1Sql {
  param([Parameter(Mandatory)][string]$Sql)

  Invoke-Pnpm @(
    '-C',
    'apps/backend',
    'exec',
    'wrangler',
    'd1',
    'execute',
    'COMMERCE_DB',
    '--env',
    'uat',
    '--remote',
    '--command',
    $Sql,
    '--json'
  )
}

$catalogD1SummarySql = "SELECT (SELECT COUNT(*) FROM VariantStripeMapping WHERE variantId IN (SELECT variantId FROM StoreItemOption)) AS mappingsForCurrentStoreItems, (SELECT COUNT(*) FROM StoreOfferSnapshot WHERE variantId IN (SELECT variantId FROM StoreItemOption)) AS snapshotsForCurrentStoreItems, (SELECT SUM(CASE WHEN stripeLookupKey LIKE 'blackbox:sandbox:%' THEN 1 ELSE 0 END) FROM StoreOfferSnapshot WHERE variantId IN (SELECT variantId FROM StoreItemOption)) AS sandboxLookupSnapshots, (SELECT SUM(CASE WHEN stripeLookupKey LIKE 'blackbox:uat:%' THEN 1 ELSE 0 END) FROM StoreOfferSnapshot WHERE variantId IN (SELECT variantId FROM StoreItemOption)) AS uatLookupSnapshots;"
$clearCatalogD1Sql = "DELETE FROM StoreOfferSnapshot WHERE variantId IN (SELECT variantId FROM StoreItemOption); DELETE FROM VariantStripeMapping WHERE variantId IN (SELECT variantId FROM StoreItemOption);"

try {
  Set-Location $repoRoot

  Write-Host 'UAT Stripe catalog reset helper'
  Write-Host 'Scope: UAT/test-mode only. PRD/live Stripe is refused.'
  Write-Host 'Effect: archive matching active UAT/legacy sandbox Stripe test catalog objects, clear UAT D1 catalog mappings/snapshots, then rebuild UAT desired catalog.'

  Write-Step 'Checking repository state'
  Assert-SafeCatalogSourceTree
  Invoke-Pnpm @('stripe:catalog:artifacts:check')

  Write-Step 'Reading UAT Stripe test secret'
  Read-UatStripeTestSecret

  Write-Step 'Dry-run reset plan'
  Invoke-Pnpm @('stripe:catalog:reset-uat', '--env', 'uat', '--dry-run')

  Write-Step 'Current UAT D1 catalog mapping/snapshot summary'
  Invoke-UatD1Sql $catalogD1SummarySql

  if ($PlanOnly) {
    Write-Host ''
    Write-Host 'Plan-only mode complete. No Stripe or D1 mutation was performed.'
    exit 0
  }

  Write-Host ''
  Write-Host 'About to mutate UAT/test-mode provider state:'
  Write-Host '- archive matching active Stripe test Products/Prices for UAT and legacy sandbox identities'
  Write-Host '- clear UAT D1 VariantStripeMapping and StoreOfferSnapshot rows for current StoreItemOption variants'
  Write-Host '- create/update current UAT Stripe test catalog objects'
  Write-Host '- repopulate UAT D1 VariantStripeMapping and StoreOfferSnapshot rows from fresh Stripe test catalog'
  Write-Host ''
  $confirmation = Read-Host "Type '$confirmationPhrase' to continue"

  if ($confirmation -cne $confirmationPhrase) {
    throw 'Aborted before mutation.'
  }

  Write-Step 'Archiving old UAT/legacy sandbox Stripe test catalog objects'
  Invoke-Pnpm @('stripe:catalog:reset-uat', '--env', 'uat', '--confirm')

  Write-Step 'Clearing stale UAT D1 catalog mappings/snapshots'
  Invoke-UatD1Sql $clearCatalogD1Sql

  Write-Step 'Applying current UAT desired catalog'
  Invoke-Pnpm @('stripe:catalog:verify', '--env', 'uat', '--apply')

  Write-Step 'Verifying UAT catalog is clean'
  Invoke-Pnpm @('stripe:catalog:verify', '--env', 'uat')

  Write-Step 'Checking UAT D1 lookup key summary'
  Invoke-UatD1Sql $catalogD1SummarySql

  Write-Host ''
  Write-Host 'Done. UAT catalog reset/apply/verify completed.'
} finally {
  if ($secretBstr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretBstr)
  }

  if ($null -eq $previousStripeSecretKey) {
    Remove-Item Env:\STRIPE_SECRET_KEY -ErrorAction SilentlyContinue
  } else {
    $env:STRIPE_SECRET_KEY = $previousStripeSecretKey
  }
}
