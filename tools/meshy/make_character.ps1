# (Meshy production, 9 Nov 2026; owner: "phải viết công cụ để có thể làm số lượng lớn và nhanh được") One command per
# character, start to end, stopping at the first failure; the auditor is the gate (docs/meshy-pipeline-20261109/PLAN.md).
#   powershell -File tools/meshy/make_character.ps1 -Id clara -Kind friend
#   powershell -File tools/meshy/make_character.ps1 -Batch finn,sol,clara,lumi -Kind friend [-SkipFit] [-Quick]
# friend:   fit_person.ps1 (<id>-swim, own Meshy face with moods) -> dress_own.ps1 (garments.json) -> models/ (working
#           copy only) -> audit.mts. villager: fit_person.ps1 -Villager -> models/villager-<id>.glb -> audit (moods).
# Paid Meshy jobs are never made here: it works on raw models already downloaded (D:\WorkSpace\meshy\raw-models).
# Nothing is committed: models go on the branch only after the owner approves the audit report and pictures.
param([string]$Id = '', [string]$Batch = '', [ValidateSet('friend', 'villager')][string]$Kind = 'friend', [switch]$SkipFit, [switch]$Quick, [string]$Out = '')
$ErrorActionPreference = 'Stop'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
$ids = if ($Batch) { $Batch.Split(',') } else { @($Id) }
if (-not $ids[0]) { throw 'give -Id or -Batch' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
if (-not $Out) { $Out = "D:\WorkSpace\meshy\fitted\audit-$stamp" }
$log = @()
# (a model file is sometimes held open for a moment by a scanner: copy again, up to 10 times, 2 s apart)
function CopyRetry($from, $to) { for ($k = 0; $k -lt 10; $k++) { try { Copy-Item $from $to -Force -ErrorAction Stop; return } catch { Start-Sleep -Seconds 2 } }; throw "could not copy $from to $to" }
foreach ($i in $ids) {
  $t0 = Get-Date
  if ($Kind -eq 'friend') {
    if (-not $SkipFit) { powershell -File tools/meshy/fit_person.ps1 -Id "$i-swim" -Ref "D:\WorkSpace\meshy\work-v108\$i-game-hd.glb" -Prefix "$i-"; if ($LASTEXITCODE) { throw "fit failed: $i" } }
    $r = powershell -File tools/meshy/dress_own.ps1 -Id $i; if ($LASTEXITCODE) { throw "dress failed: $i" }
    CopyRetry "D:\WorkSpace\meshy\fitted\$i-own\$i-dressed-light-packed.glb" "models\$i.glb"
    CopyRetry "D:\WorkSpace\meshy\fitted\$i-own\$i-dressed-hd-packed.glb" "models\$i-hd.glb"
    $kb = [int]((Get-Item "models\$i.glb").Length / 1KB); if ($kb -gt 500) { throw "light model $i is $kb KB (limit 500)" }
    $log += "$i built in $([int]((Get-Date) - $t0).TotalSeconds) s: $r"
  } else {
    if (-not $SkipFit) { powershell -File tools/meshy/fit_person.ps1 -Id $i -Villager; if ($LASTEXITCODE) { throw "fit failed: $i" } }
    Copy-Item "D:\WorkSpace\meshy\fitted\$i\$i-mid-packed.glb" "models\villager-$i.glb" -Force
    $log += "$i built in $([int]((Get-Date) - $t0).TotalSeconds) s"
  }
}
node tools/build.mts | Out-Null
Push-Location tests
# (10 Nov 2026, owner: "chạy và sửa quá chậm") one audit process per character, side by side (one browser each), then merged
New-Item -ItemType Directory -Force $Out | Out-Null
$procs = foreach ($i in $ids) {
  $a = @("..\tools\meshy\audit.mts", "$Out\part-$i", $i); if ($Quick) { $a += 'quick' }
  Start-Process node -ArgumentList $a -NoNewWindow -PassThru -RedirectStandardOutput "$Out\part-$i.log" -RedirectStandardError "$Out\part-$i.err"
}
$procs | Wait-Process
node ..\tools\meshy\audit.mts $Out merge 2>$null | Out-Null
if ($LASTEXITCODE) { Pop-Location; throw "audit failed: see $Out\part-*.err" }
Pop-Location
$sum = Get-Content "$Out\summary.txt" -Encoding utf8
$log + $sum | Out-File -Encoding utf8 "$Out\report.txt"
$log + $sum | Write-Output
if (($sum | Select-Object -First 1) -notmatch 'failing 0$') { Write-Output "AUDIT FAILED: see $Out (fault pictures, summary.txt)"; exit 2 }
Write-Output "AUDIT PASSED: $Out"
