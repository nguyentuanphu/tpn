# (Meshy production, 9 Nov 2026; owner: the auditor must be trustworthy) Plants each kind of fault on purpose and checks
# that the auditor catches it. Run after any change to tools/meshy/audit.mts, before trusting a round's numbers.
#   powershell -File tools/meshy/audit_selftest.ps1 [-Id sol]
param([string]$Id = 'sol')
$ErrorActionPreference = 'Stop'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location "$repo\tests"
$ok = $true
foreach ($f in 'kit', 'poke', 'fold', 'eyes') {
  $out = "D:\WorkSpace\meshy\fitted\audit-selftest-$f"
  node ..\tools\meshy\audit.mts $out $Id "selftest:$f" 2>$null | Out-Null
  $line = (Get-Content "$out\summary.txt" -Encoding utf8 | Where-Object { $_ -match "^${f}:" } | Select-Object -First 1)
  $caught = $line -match "^${f}: ([1-9][0-9]*) cases"
  Write-Output ("{0,-5} {1}  ({2})" -f $f, $(if ($caught) { 'caught' } else { 'MISSED' }), $line)
  if (-not $caught) { $ok = $false }
}
if (-not $ok) { Write-Output 'SELF-TEST FAILED: a planted fault was not caught'; exit 2 }
Write-Output 'SELF-TEST PASSED'
