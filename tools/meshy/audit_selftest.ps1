# (Meshy production, 9 Nov 2026; owner: the auditor must be trustworthy) Plants each kind of fault on purpose and checks
# that the auditor catches it. Run after any change to tools/meshy/audit.mts, before trusting a round's numbers.
#   powershell -File tools/meshy/audit_selftest.ps1 [-Id sol] [-Out D:\WorkSpace\meshy\fitted] [-Only far,glow]
# (10 Nov 2026, owner: "tại sao lại missed") also bite (a band round the knee not drawn), rag (the trousers made jagged; 10 Nov: no longer the boot tops, the body inside the boots now counts as the boots and filled the teeth in)
# and deep (trousers 5 cm through a skirt, on Clara, who wears one); the auditor's own count for each must fire.
# (11 Nov 2026, what the auditor did not check yet) far (the light model's legs below the knee not drawn: its outline
# against the high-detail model's), glow (the top unlit at night), grip (the item bound to the trunk, not the hand), lightpoke
# (the poke plant on the light model: every check runs on it too). Each runs on a friend whose real model does not already
# fail that check (lightpoke and far: Clara; Sol's light model had lost its arms on 11 Nov, so far would pass on Sol unplanted).
# -Out: where the plant rounds go (one folder each, deleted first); sessions sharing this PC each use their own.
# The page server is tests/harness.mts's SV_URL (default http://localhost:8765/).
param([string]$Id = 'sol', [string]$Out = 'D:\WorkSpace\meshy\fitted', [string]$Only = '')
$ErrorActionPreference = 'Stop'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location "$repo\tests"
$ok = $true
# name = check, friend ('' = -Id), extra pass
$plants = [ordered]@{ kit = @('kit', ''); poke = @('poke', ''); fold = @('fold', ''); eyes = @('eyes', ''); bite = @('bite', ''); rag = @('rag', ''); deep = @('poke', 'clara');
  lightpoke = @('poke', 'clara', 'light', 'poke'); far = @('far', 'clara', 'light'); glow = @('glow', '', 'night'); grip = @('grip', '', 'item') }
foreach ($f in $plants.Keys) {
  if ($Only -and -not ($Only.Split(',') -contains $f)) { continue }
  $p = $plants[$f]; $check = $p[0]; $who = if ($p[1]) { $p[1] } else { $Id }
  $plant = if ($p.Count -gt 3) { $p[3] } else { $f }; $q = "selftest:$plant" + $(if ($p.Count -gt 2 -and $p[2]) { ",$($p[2])" } else { '' })
  $dir = Join-Path $Out "audit-selftest-$f"
  if (Test-Path $dir) { Remove-Item -Recurse -Force $dir }
  for ($t = 0; $t -lt 4; $t++) {   # (a busy PC: the page server can time out; run the plant again)
    $ErrorActionPreference = 'Continue'; node ..\tools\meshy\audit.mts $dir $who $q *> "$dir.log"; $ErrorActionPreference = 'Stop'   # (node's warnings on stderr would stop the script)
    if (-not (Select-String -Path "$dir.log" -Pattern 'TimeoutError' -Quiet)) { break } }
  $line = if (Test-Path "$dir\summary.txt") { (Get-Content "$dir\summary.txt" -Encoding utf8 | Where-Object { $_ -match "^${check}:" } | Select-Object -First 1) } else { 'no summary: the run failed, see ' + "$dir.log" }
  $caught = $line -match "^${check}: ([1-9][0-9]*) cases"
  Write-Output ("{0,-9} {1}  ({2})" -f $f, $(if ($caught) { 'caught' } else { 'MISSED' }), $line)
  if (-not $caught) { $ok = $false }
}
if (-not $ok) { Write-Output 'SELF-TEST FAILED: a planted fault was not caught'; exit 2 }
Write-Output 'SELF-TEST PASSED'
