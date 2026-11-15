# The gate: one approval page per model, D:\WorkSpace\meshy\fitted\gate\<id>\index.html (plain HTML, relative pictures,
# readable on a phone): old against new for every mood at the game's distance on a phone, a tablet and a computer, then
# close up at yaw 0, +-.4, +-.7, +-1.2, the auditor's face numbers (friends) and make.ps1's report.
#   powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\faceuv\gate.ps1 sol,clara,finn [steps]"
# ids: a comma list (positional: heavy.ps1 swallows dashed arguments). steps: make,audit,page (default audit,page;
# 'make' first runs make.ps1 all for a model that has no report.json yet). The auditor (tools/meshy/faceuv/audit.mts,
# the facekit auditor taught the face-UV layout) runs on friends only, old model and new, about 6 minutes each.
param([string]$Ids, [string]$Steps = 'audit,page')
$py = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\4.2\python\bin\python.exe'; $t = $PSScriptRoot; $fit = 'D:\WorkSpace\meshy\fitted'; $do = $Steps.Split(','); $bad = 0
foreach ($i in $Ids.Split(',')) {
  $O = "$fit\faceuv-$i"; New-Item -ItemType Directory -Force $O | Out-Null
  if (($do -contains 'make') -and -not (Test-Path "$O\report.json")) { & cmd /c "powershell -NoProfile -File `"$t\make.ps1`" $i all > `"$O\make.log`" 2>&1" }
  if (-not (Test-Path "$O\model.json")) { "$i: not made yet (run make.ps1 $i)"; $bad++; continue }
  $row = Get-Content "$O\model.json" -Raw | ConvertFrom-Json; $new = "$O\$($row.model)-faceuv-packed.glb"
  if (($do -contains 'audit') -and $row.kind -eq 'friend') {
    foreach ($w in @(@('old', $row.old), @('new', $new))) {
      for ($try = 1; $try -le 2; $try++) { & cmd /c "powershell -NoProfile -File `"$t\audit.ps1`" `"$O\audit-$($w[0])`" $i `"$($row.model)=$($w[1])`" > `"$O\audit-$($w[0]).log`" 2>&1"; if (Test-Path "$O\audit-$($w[0])\cases.json") { break } }
      if (-not (Test-Path "$O\audit-$($w[0])\cases.json")) { "$i: the auditor failed on the $($w[0]) model (see $O\audit-$($w[0]).log)"; $bad++ } } }
  if ($do -contains 'page') { & $py (Join-Path $t 'gate.py') $i; if ($LASTEXITCODE -ne 0) { $bad++ } }
}
exit $bad
