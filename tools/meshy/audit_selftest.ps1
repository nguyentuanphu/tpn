# (Meshy production, 9 Nov 2026; owner: the auditor must be trustworthy) Plants each kind of fault on purpose and checks
# that the auditor catches it. Run after any change to tools/meshy/audit.mts, before trusting a round's numbers.
#   powershell -File tools/meshy/audit_selftest.ps1 [-Id sol]
# (10 Nov 2026, owner: "tại sao lại missed") also bite (a band round the knee not drawn), rag (the trousers made jagged; 10 Nov: no longer the boot tops, the body inside the boots now counts as the boots and filled the teeth in)
# and deep (trousers 5 cm through a skirt, on Clara, who wears one); the auditor's own count for each must fire.
param([string]$Id = 'sol')
$ErrorActionPreference = 'Stop'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location "$repo\tests"
$ok = $true
$plants = [ordered]@{ kit = 'kit'; poke = 'poke'; fold = 'fold'; eyes = 'eyes'; bite = 'bite'; rag = 'rag'; deep = 'poke' }
foreach ($f in $plants.Keys) {
  $out = "D:\WorkSpace\meshy\fitted\audit-selftest-$f"; $check = $plants[$f]
  $who = if ($f -eq 'deep') { 'clara' } else { $Id }
  if (Test-Path $out) { Remove-Item -Recurse -Force $out }
  node ..\tools\meshy\audit.mts $out $who "selftest:$f" 2>$null | Out-Null
  $line = (Get-Content "$out\summary.txt" -Encoding utf8 | Where-Object { $_ -match "^${check}:" } | Select-Object -First 1)
  $caught = $line -match "^${check}: ([1-9][0-9]*) cases"
  Write-Output ("{0,-5} {1}  ({2})" -f $f, $(if ($caught) { 'caught' } else { 'MISSED' }), $line)
  if (-not $caught) { $ok = $false }
}
if (-not $ok) { Write-Output 'SELF-TEST FAILED: a planted fault was not caught'; exit 2 }
Write-Output 'SELF-TEST PASSED'
