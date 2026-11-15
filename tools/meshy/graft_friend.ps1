# (Meshy production, 8 Nov 2026; owner: friends as their approved head on a swim body, clothes made in the game)
# One friend end to end, all outside the repository: refit the friend's earlier model (approved face, latest face fixes),
# fit the swim body, put the old head on it (graft_head.py), make the clothes (make_clothes.py), pack both sizes.
#   powershell -File tools/meshy/graft_friend.ps1 -Id sol
# Out: D:\WorkSpace\meshy\fitted\<id>-graft\<id>-dressed-light-packed.glb and -hd-packed.glb (models/<id>.glb, <id>-hd.glb
# after the owner approves the in-game pictures).
param([string]$Id)
$ErrorActionPreference = 'Stop'
$B = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe'; $npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
$ref = "D:\WorkSpace\meshy\work-v108\$Id-game-hd.glb"; $raw = 'D:\WorkSpace\meshy\raw-models'
function Run($script, $argList) { $ErrorActionPreference = 'Continue'; $out = & $B -b -P $script -- @argList 2>&1 | Out-String; if ($LASTEXITCODE -ne 0 -or $out -match 'Traceback|rror: |EXCEPTION_') { throw "$script failed: $($out.Substring([Math]::Max(0,$out.Length-800)))" }; return $out }
if ($env:GF_SKIP_REFIT) { Write-Output 'refits skipped' } else {
# 1. the earlier model, refitted (Clara's comes from her approved revision clara-r2 with hand-marked joints)
if ($Id -eq 'clara') {
  $o = 'D:\WorkSpace\meshy\fitted\clara'; $j = 'docs\meshy-production-20261107\joints\clara-remesh.json'
  foreach ($r in @(@('hd', "$raw\remesh\clara-r2.glb", '40000', '2048'), @('light', "$raw\remesh\clara-r2-9000.glb", '12000', '512'))) {
    $null = Run 'tools\meshy\fit_people.py' @($r[1], $ref, "$o\clara-$($r[0])-pre.glb", "$o\$($r[0])", $r[2], $r[3], '1.0', '-1', $j)
    $null = Run 'tools\meshy\transfer_rig.py' @("$o\clara-$($r[0])-pre.blend", "$raw\rigged\clara-r2.glb", "$o\clara-$($r[0]).glb", $ref) }
} else { powershell -NoProfile -ExecutionPolicy Bypass -File tools\meshy\fit_person.ps1 -Id $Id | Out-Null }
# 2. the swim body
powershell -NoProfile -ExecutionPolicy Bypass -File tools\meshy\fit_person.ps1 -Id "$Id-swim" -Ref $ref -Prefix "$Id-" | Out-Null
}   # (GF_SKIP_REFIT=1: reuse the fitted heads and bodies, only graft and dress again)
# 3. the old head on it, the clothes, packed
if ($Id -eq 'clara') { $env:GH_LONG_HAIR = '1' } else { Remove-Item Env:GH_LONG_HAIR -ErrorAction SilentlyContinue }   # (Clara's braids hang to her chest)
$g = "D:\WorkSpace\meshy\fitted\$Id-graft"; New-Item -ItemType Directory -Force $g | Out-Null
foreach ($n in 'hd', 'light') {
  if ($n -eq 'light' -and $Id -eq 'clara') { $env:GH_TEX_MAX = '300' } else { Remove-Item Env:GH_TEX_MAX -ErrorAction SilentlyContinue }   # (Clara's light model: 500 KB limit)
  $null = Run 'tools\meshy\graft_head.py' @("D:\WorkSpace\meshy\fitted\$Id-swim\$Id-swim-$n.blend", "D:\WorkSpace\meshy\fitted\$Id\$Id-$n.blend", "$g\$Id-graft-$n.blend")
  $null = Run 'tools\meshy\make_clothes.py' @("$g\$Id-graft-$n.blend", "$g\$Id-dressed-$n.glb")
  & node $npx -y gltfpack@0.20.0 -i "$g\$Id-dressed-$n.glb" -o "$g\$Id-dressed-$n-packed.glb" -cc -kn -km -ke 2>&1 | Out-Null
}
Write-Output ("{0}: light {1} KB, hd {2} KB" -f $Id, [int]((Get-Item "$g\$Id-dressed-light-packed.glb").Length / 1KB), [int]((Get-Item "$g\$Id-dressed-hd-packed.glb").Length / 1KB))
