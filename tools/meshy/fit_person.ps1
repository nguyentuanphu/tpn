# (Meshy production, 7 Nov 2026) One person, end to end, from the raw downloads of overnight.ps1:
# auto joints, high-detail (30k remesh, Meshy picture) and light (9k remesh, 512 px: only far away since 8 Nov; near, every friend is high detail) fits, Meshy rig onto the game's
# joints, packed GLBs and check renders, all outside the repository (D:\WorkSpace\meshy\fitted\<id>).
#   powershell -File tools/meshy/fit_person.ps1 -Id finn [-Ref <game reference raw glb>]
# (8 Nov 2026) -Villager: a villager has one model, seen close and far (js/main.ts wears models/villager-<id>.glb):
# one fit of the 30k remesh with a 1024 px picture (8 Nov: Meshy's own face is seen, 512 px blurred the eyes); the 288 px light picture showed
# specks and broken hair up close. The reference is lumi.py's villager role=<id> build; its parts are named villager-.
param([string]$Id, [string]$Ref = '', [string]$Prefix = '', [switch]$Villager)   # -Prefix: the reference's part names, default <id>-
if (-not $Ref) { $Ref = "D:\WorkSpace\meshy\work-v108\$Id-game-hd.glb" }
if ($Villager -and -not $Prefix) { $Prefix = 'villager-' }
$ErrorActionPreference = 'Stop'
$B = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe'; $npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
$raw = 'D:\WorkSpace\meshy\raw-models'; $o = "D:\WorkSpace\meshy\fitted\$Id"; New-Item -ItemType Directory -Force $o | Out-Null
$j = "$repo\docs\meshy-production-20261107\joints\$Id.json"
function Run($script, $argList) { $ErrorActionPreference = 'Continue'; $out = & $B -b -P $script -- @argList 2>&1 | Out-String; if ($LASTEXITCODE -ne 0 -or $out -match 'Traceback|rror: |EXCEPTION_') { throw "$script failed: $($out.Substring([Math]::Max(0,$out.Length-800)))" }; return $out }
# (-ke keeps the materials' skin_ref / own_face tags: without it the game never saw them)
function Pack($n) { & node $npx -y gltfpack@0.20.0 -i "$o\$n.glb" -o "$o\$n-packed.glb" -cc -kn -km -ke 2>&1 | Out-Null; return [int]((Get-Item "$o\$n-packed.glb").Length / 1KB) }
$null = Run 'tools\meshy\auto_joints.py' (@("$raw\remesh\$Id.glb", "$raw\rigged\$Id.glb", $Id, $j, "$o\joints-check.png") + @(if ($Prefix) { $Prefix } else { @() }))
if ($Villager) {
  $null = Run 'tools\meshy\fit_people.py' @("$raw\remesh\$Id.glb", $Ref, "$o\$Id-mid-pre.glb", "$o\mid", '40000', '1024', '1.0', '-1', $j)
  $null = Run 'tools\meshy\transfer_rig.py' @("$o\$Id-mid-pre.blend", "$raw\rigged\$Id.glb", "$o\$Id-mid.glb", $Ref)
  Write-Output ("{0}: villager {1} KB" -f $Id, (Pack "$Id-mid")); return
}
$null = Run 'tools\meshy\fit_people.py' @("$raw\remesh\$Id.glb", $Ref, "$o\$Id-hd-pre.glb", "$o\hd", '40000', '2048', '1.0', '-1', $j)
$null = Run 'tools\meshy\fit_people.py' @("$raw\remesh\$Id-9000.glb", $Ref, "$o\$Id-light-pre.glb", "$o\light", '12000', '512', '1.0', '-1', $j)
foreach ($n in "$Id-hd", "$Id-light") { $null = Run 'tools\meshy\transfer_rig.py' @("$o\$n-pre.blend", "$raw\rigged\$Id.glb", "$o\$n.glb", $Ref) }
Write-Output ("{0}: light {1} KB, hd {2} KB" -f $Id, (Pack "$Id-light"), (Pack "$Id-hd"))
