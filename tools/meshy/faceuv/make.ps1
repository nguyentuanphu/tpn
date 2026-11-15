# The face-UV face for one model, end to end, in ONE heavy job: bake, eye-free skin, moods, build, pack, shots (old and
# new), sheets, and report.json. Nothing is installed into models/: the shots answer the model's URL with the files.
#   powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\faceuv\make.ps1 <id> [steps]"
# steps (positional, comma list or 'all'): bake,eyes,build,pack,shots,sheets,report   e.g. "bake,eyes" while tuning.
# Output: D:\WorkSpace\meshy\fitted\faceuv-<id>\ (bake\, shots-old\, shots-new\, sheets\, <model>-faceuv[-packed].glb, report.json)
param([string]$Id, [string]$Steps = 'all')
$ErrorActionPreference = 'Stop'
$py = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\4.2\python\bin\python.exe'; $t = $PSScriptRoot
$fit = 'D:\WorkSpace\meshy\fitted'; $O = "$fit\faceuv-$Id"; $D = "$O\bake"; New-Item -ItemType Directory -Force $D | Out-Null
$row = & $py (Join-Path $t 'model.py') $Id "$O\model.json" | ConvertFrom-Json
if (-not $row.src -or -not (Test-Path $row.src)) { throw "no dressed model for $Id" }
$all = 'bake,eyes,build,pack,shots,sheets,report'; if ($Steps -eq 'all') { $Steps = $all }; $do = $Steps.Split(',')
$out = "$O\$($row.model)-faceuv.glb"; $packed = "$O\$($row.model)-faceuv-packed.glb"
function Py($script, $a) { & $py (Join-Path $t $script) @a; if ($LASTEXITCODE -ne 0) { throw "$script failed" } }
if ($do -contains 'bake') { Py 'bake.py' @($row.src, $D, "$O\model.json") }
if ($do -contains 'eyes') { Py 'eyes.py' @($D, "$O\model.json") }
if ($do -contains 'build') { Py 'build.py' @($row.src, $D, $out, $Id) }
if ($do -contains 'pack') { & (Join-Path $t 'pack.ps1') $out $packed $row.pack; if (-not (Test-Path $packed)) { throw 'pack failed' } }
if ($do -contains 'shots') {
  foreach ($w in @(@('old', $row.old), @('new', $packed))) {
    for ($try = 1; $try -le 3; $try++) { & (Join-Path $t 'shots.ps1') "$O\shots-$($w[0])" $Id $row.kind $row.model $w[1] 'both' $row.server; if ($LASTEXITCODE -eq 0) { break } }
    if ($LASTEXITCODE -ne 0) { throw "shots $($w[0]) failed" } } }
if ($do -contains 'sheets') { Py 'sheets.py' @("$O\shots-old", "$O\shots-new", "$O\sheets") }
if ($do -contains 'report') { Py 'report.py' @($Id, $O) }
Write-Output "faceuv $Id done: $O"
