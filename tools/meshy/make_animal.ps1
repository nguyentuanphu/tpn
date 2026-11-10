# (Meshy pets, 10 Nov 2026) One Meshy animal, start to end: fit (rig, weights, clips, face), pack, install in the working
# copy (models/world/creature-<kind>[-hd].glb; commit only after the owner approves), shots and the pets auditor.
#   powershell -File tools/meshy/make_animal.ps1 -Kind puppy [-Near <glb>] [-Far <glb>] [-Out <dir>] [-Url http://localhost:8777/] [-Quick]
# Exits 2 when the auditor finds faults over its limits.
param([Parameter(Mandatory)][string]$Kind, [string]$Near = "", [string]$Far = "", [string]$Out = "", [string]$Url = "http://localhost:8777/", [switch]$Quick)
$ErrorActionPreference = 'Continue'   # (Windows PowerShell 5.1 turns a native tool's stderr into errors: each step is checked below)
$B = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe'; $npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
$root = Split-Path (Split-Path $PSScriptRoot)
if (-not $Near) { $Near = "D:\WorkSpace\meshy\raw-models\remesh\$Kind.glb" }
if (-not $Far) { $Far = "D:\WorkSpace\meshy\raw-models\remesh\$Kind-9000.glb" }
if (-not $Out) { $Out = "D:\WorkSpace\meshy\pets\$Kind-" + (Get-Date -Format 'MMdd-HHmm') }
New-Item -ItemType Directory -Force $Out | Out-Null
& $B -b -P "$root\tools\meshy\fit_animal.py" -- $Kind $Near $Far $Out debug *> "$Out\fit.log"
if ($LASTEXITCODE -ne 0 -or (Select-String -Path "$Out\fit.log" -Pattern 'Traceback|EXCEPTION_' -Quiet)) { Write-Error "fit failed: $Out\fit.log" }
foreach ($n in "creature-$Kind-hd", "creature-$Kind") {
  & node $npx -y gltfpack@0.20.0 -i "$Out\$n.glb" -o "$Out\$n-packed.glb" -cc -kn -km -ke 2>&1 | Out-Null
  if (-not (Test-Path "$Out\$n-packed.glb")) { Write-Host "pack failed: $n"; exit 1 }
  Copy-Item "$Out\$n-packed.glb" "$root\models\world\$n.glb" -Force
  "{0} {1} KB" -f $n, [int]((Get-Item "$Out\$n-packed.glb").Length / 1KB)
}
$env:SV_URL = $Url
Push-Location "$root\tests"
try {
  & node ..\tools\meshy\pet_shots.mts "$Out\shots" close "$Kind-hd,$Kind" *> "$Out\shots.log"
  & node ..\tools\meshy\audit_pets.mts "$Out\audit" $Kind $(if ($Quick) { 'quick' } else { '' }) *> "$Out\audit.log"
  $code = $LASTEXITCODE
} finally { Pop-Location }
Get-Content "$Out\audit\summary.txt" | Select-Object -First 9
"out: $Out"
exit $code
