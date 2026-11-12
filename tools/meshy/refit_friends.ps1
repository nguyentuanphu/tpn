# (13 Nov 2026) Refit and redress friends one after another, retrying a fit that crashes (Blender EXCEPTION_ACCESS_VIOLATION on
# the shared machine, about one fit in three), and install both sizes in models/.  powershell -File tools/meshy/refit_friends.ps1 clara sol finn lumi
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
foreach ($id in $args) {
  $t = Get-Date
  $ok = $false
  for ($k = 1; $k -le 3 -and -not $ok; $k++) {
    powershell -File tools/meshy/fit_person.ps1 -Id "$id-swim" -Ref "D:\WorkSpace\meshy\work-v108\$id-game-hd.glb" -Prefix "$id-"
    if ($LASTEXITCODE -eq 0) { $ok = $true } else { Write-Output "fit $id try $k crashed, again" }
  }
  if (-not $ok) { throw "fit $id failed" }
  if ($id -eq 'lumi') { powershell -File tools/meshy/dress_own.ps1 -Id $id -LightTex 512 } else { powershell -File tools/meshy/dress_own.ps1 -Id $id }
  if ($LASTEXITCODE -ne 0) { throw "dress $id failed" }
  Copy-Item "D:\WorkSpace\meshy\fitted\$id-own\$id-dressed-light-packed.glb" "models\$id.glb" -Force
  Copy-Item "D:\WorkSpace\meshy\fitted\$id-own\$id-dressed-hd-packed.glb" "models\$id-hd.glb" -Force
  Write-Output ("{0} done in {1:n1} min" -f $id, ((Get-Date) - $t).TotalMinutes)
}
Write-Output 'ALL DONE'
