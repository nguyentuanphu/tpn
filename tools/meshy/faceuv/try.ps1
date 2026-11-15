# quick look while tuning: close-ups of the new model only, for several models, in ONE heavy job (into faceuv-<id>\shots-try)
#   powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\faceuv\try.ps1 sol,mai"
param([string]$Ids)
foreach ($i in $Ids.Split(',')) {
  $O = "D:\WorkSpace\meshy\fitted\faceuv-$i"; $row = Get-Content "$O\model.json" -Raw | ConvertFrom-Json
  Remove-Item -Recurse -Force "$O\shots-try" -ErrorAction SilentlyContinue
  & (Join-Path $PSScriptRoot 'shots.ps1') "$O\shots-try" $i $row.kind $row.model "$O\$($row.model)-faceuv-packed.glb" 'close' $row.server
  "$i exit $LASTEXITCODE"
}
