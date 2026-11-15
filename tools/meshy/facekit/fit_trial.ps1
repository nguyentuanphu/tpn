# (15 Nov 2026, the shared face kit) Refit and dress one friend into D:\WorkSpace\meshy\fitted\facekit-<id>-{swim,own}, never
# the stream's own folders, and install both sizes in THIS worktree's models/ (the facekit branch only).
#   powershell -File D:\WorkSpace\meshy\tools\heavy.ps1 powershell -File tools/meshy/facekit/fit_trial.ps1 sol
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent)
foreach ($id in $args) {
  $t = Get-Date; $sw = "D:\WorkSpace\meshy\fitted\facekit-$id-swim"; $ow = "D:\WorkSpace\meshy\fitted\facekit-$id-own"
  $ok = $false
  for ($k = 1; $k -le 3 -and -not $ok; $k++) {
    powershell -File tools/meshy/fit_person.ps1 -Id "$id-swim" -Ref "D:\WorkSpace\meshy\work-v108\$id-game-hd.glb" -Prefix "$id-" -Out $sw
    if ($LASTEXITCODE -eq 0) { $ok = $true } else { Write-Output "fit $id try $k crashed, again" }
  }
  if (-not $ok) { throw "fit $id failed" }
  if ($id -eq 'lumi') { powershell -File tools/meshy/dress_own.ps1 -Id $id -LightTex 512 -Swim $sw -Out $ow } else { powershell -File tools/meshy/dress_own.ps1 -Id $id -Swim $sw -Out $ow }
  if ($LASTEXITCODE -ne 0) { throw "dress $id failed" }
  Copy-Item "$ow\$id-dressed-light-packed.glb" "models\$id.glb" -Force
  Copy-Item "$ow\$id-dressed-hd-packed.glb" "models\$id-hd.glb" -Force
  Write-Output ("{0} done in {1:n1} min" -f $id, ((Get-Date) - $t).TotalMinutes)
}
Write-Output 'ALL DONE'
