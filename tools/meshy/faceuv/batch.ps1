# make.ps1 for several models, one after the other, inside ONE heavy job; each model's log goes to faceuv-<id>\make.log
#   powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\faceuv\batch.ps1 sol,clara,finn all"
param([string]$Ids, [string]$Steps = 'all')
$bad = 0
foreach ($i in $Ids.Split(',')) {
  New-Item -ItemType Directory -Force "D:\WorkSpace\meshy\fitted\faceuv-$i" | Out-Null
  $mk = Join-Path $PSScriptRoot 'make.ps1'; $log = "D:\WorkSpace\meshy\fitted\faceuv-$i\make.log"
  & cmd /c "powershell -NoProfile -File `"$mk`" $i $Steps > `"$log`" 2>&1"
  "$i exit $LASTEXITCODE"; if ($LASTEXITCODE -ne 0) { $bad++ }
}
exit $bad
