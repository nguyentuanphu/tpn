# (Meshy production, 7 Nov 2026) One person, end to end, from the raw downloads of overnight.ps1:
# auto joints, high-detail (30k remesh, Meshy picture) and light (9k remesh, 320 px) fits, Meshy rig onto the game's
# joints, packed GLBs and check renders, all outside the repository (D:\WorkSpace\meshy\fitted\<id>).
#   powershell -File tools/meshy/fit_person.ps1 -Id finn [-Ref <game reference raw glb>]
param([string]$Id, [string]$Ref = '')
if (-not $Ref) { $Ref = "D:\WorkSpace\meshy\work-v108\$Id-game-hd.glb" }
$ErrorActionPreference = 'Stop'
$B = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe'; $npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
$raw = 'D:\WorkSpace\meshy\raw-models'; $o = "D:\WorkSpace\meshy\fitted\$Id"; New-Item -ItemType Directory -Force $o | Out-Null
$j = "$repo\docs\meshy-production-20261107\joints\$Id.json"
function Run($script, $argList) { $ErrorActionPreference = 'Continue'; $out = & $B -b -P $script -- @argList 2>&1 | Out-String; if ($out -match 'Traceback|rror: ') { throw "$script failed: $($out.Substring([Math]::Max(0,$out.Length-800)))" }; return $out }
$null = Run 'tools\meshy\auto_joints.py' @("$raw\remesh\$Id.glb", "$raw\rigged\$Id.glb", $Id, $j, "$o\joints-check.png")
$null = Run 'tools\meshy\fit_people.py' @("$raw\remesh\$Id.glb", $Ref, "$o\$Id-hd-pre.glb", "$o\hd", '40000', '2048', '1.0', '-1', $j)
$null = Run 'tools\meshy\fit_people.py' @("$raw\remesh\$Id-9000.glb", $Ref, "$o\$Id-light-pre.glb", "$o\light", '12000', '288', '1.0', '-1', $j)
foreach ($n in "$Id-hd", "$Id-light") { $null = Run 'tools\meshy\transfer_rig.py' @("$o\$n-pre.blend", "$raw\rigged\$Id.glb", "$o\$n.glb", $Ref) }
& node $npx -y gltfpack@0.20.0 -i "$o\$Id-light.glb" -o "$o\$Id-light-packed.glb" -cc -kn -km 2>&1 | Out-Null
& node $npx -y gltfpack@0.20.0 -i "$o\$Id-hd.glb" -o "$o\$Id-hd-packed.glb" -cc -kn -km 2>&1 | Out-Null
Write-Output ("{0}: light {1} KB, hd {2} KB" -f $Id, [int]((Get-Item "$o\$Id-light-packed.glb").Length / 1KB), [int]((Get-Item "$o\$Id-hd-packed.glb").Length / 1KB))
