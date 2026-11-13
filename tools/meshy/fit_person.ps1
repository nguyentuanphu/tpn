# (Meshy production, 7 Nov 2026) One person, end to end, from the raw downloads of overnight.ps1:
# auto joints, high-detail (30k remesh, Meshy picture) and light (9k remesh, 512 px: only far away since 8 Nov; near, every friend is high detail) fits, Meshy rig onto the game's
# joints, packed GLBs and check renders, all outside the repository (D:\WorkSpace\meshy\fitted\<id>).
#   powershell -File tools/meshy/fit_person.ps1 -Id finn [-Ref <game reference raw glb>]
# (8 Nov 2026) -Villager: a villager has one model, seen close and far (js/main.ts wears models/villager-<id>.glb):
# one fit of the 30k remesh with a 1024 px picture (8 Nov: Meshy's own face is seen, 512 px blurred the eyes); the 288 px light picture showed
# specks and broken hair up close. The reference is lumi.py's villager role=<id> build; its parts are named villager-.
param([string]$Id, [string]$Ref = '', [string]$Prefix = '', [switch]$Villager, [string]$VMesh = '9000', [string]$VTex = '1024', [string]$VTile = '192', [string]$VQ = '70', [string]$VGrid = '26', [switch]$NoLimbTint, [string]$SkinSMax = '', [switch]$EyeDark, [switch]$SmoothPieces, [switch]$LidMatch, [string]$FaceUV = '', [string]$PieceSnap = '', [switch]$MouthFind, [switch]$LookSolid, [switch]$LidSoft, [switch]$PieceSink, [switch]$LidHair, [switch]$MouthSoft, [switch]$LidLocal, [switch]$SadTall, [switch]$EyeDespike, [string]$SadBot = '', [switch]$EyeSkin, [switch]$LidClip)   # -Prefix: the reference's part names, default <id>-
# (10 Nov 2026, cloud pilot) the tools also run on Linux: SV_MESHY_ROOT (default D:\WorkSpace\meshy), SV_BLENDER, SV_NPX
$root = if ($env:SV_MESHY_ROOT) { $env:SV_MESHY_ROOT } else { 'D:\WorkSpace\meshy' }
if (-not $Ref) { $Ref = Join-Path $root "work-v108/$Id-game-hd.glb" }
# (10 Nov 2026) a villager's reference is lumi.py's villager-<id>-<role>-hd.glb (game, elder, adult ...), never <id>-game-hd.glb
if ($Villager -and -not (Test-Path $Ref)) { $c = @(Get-ChildItem (Join-Path $root "work-v108/villager-$Id-*-hd.glb")); if ($c.Count -ne 1) { throw "villager reference for ${Id}: found $($c.Count)" }; $Ref = $c[0].FullName }
if ($Villager -and -not $Prefix) { $Prefix = 'villager-' }
$ErrorActionPreference = 'Stop'
# (10 Nov 2026, regional pilot) -NoLimbTint: no arm/leg/neck flag in the skin mark (a villager is never toned; the flag painted
# sleeves near the arms in the skin's colour)
if ($NoLimbTint) { $env:FIT_NO_LIMB_TINT = '1' } else { $env:FIT_NO_LIMB_TINT = '' }
# (10 Nov 2026) -SkinSMax .65: dark, strongly coloured skin (r084) still counts as skin in the face picture (fit_people.py SKIN_SMAX, default .44)
$env:FIT_SKIN_SMAX = $SkinSMax
# (10 Nov 2026) -EyeDark: the eye box also takes the dark iris and lashes above the whites (r057: whites lit only below the iris)
if ($EyeDark) { $env:FIT_EYE_DARK = '1' } else { $env:FIT_EYE_DARK = '' }
# (10 Nov 2026, owner: "hốc mắt chưa đẹp") -SmoothPieces: the mood pieces take the face's smooth surface direction, as the body is drawn
if ($SmoothPieces) { $env:FIT_SMOOTH_PIECES = '1' } else { $env:FIT_SMOOTH_PIECES = '' }
# (10 Nov 2026) -LidMatch: a closed lid's fill takes the brightness of the face's own skin inside the lid area (no pale disc round shut eyes)
if ($LidMatch) { $env:FIT_LID_MATCH = '1' } else { $env:FIT_LID_MATCH = '' }
# (owner 11 Nov 2026: "con mắt, mũi và miệng đều có vấn đề") -FaceUV 2: the face's islands of Meshy's layout twice as big in the picture
# (sharper eyes, nose, mouth); -PieceSnap .001: mood pieces at most 1 mm (+3) in front of the face, never floating over the mouth
$env:FIT_FACE_UV = $FaceUV; $env:FIT_PIECE_SNAP = $PieceSnap
# (owner 11 Nov 2026) -MouthFind: the mouth found below the eyes against the skin there, and erased on its own (not as an eye)
if ($MouthFind) { $env:FIT_MOUTH_FIND = '1' } else { $env:FIT_MOUTH_FIND = '' }
# (owner 11 Nov 2026) -LookSolid: the looking eyes' pieces cover the whole eye opening (no ring of the painted iris)
if ($LookSolid) { $env:FIT_LOOK_SOLID = '1' } else { $env:FIT_LOOK_SOLID = '' }
# (owner 11 Nov 2026, close-up) -LidSoft: a closed lid ends in a soft band of blurred skin (no disc edge, no ring of the painted eye's outline)
if ($LidSoft) { $env:FIT_LID_SOFT = '1' } else { $env:FIT_LID_SOFT = '' }
# (13 Nov 2026, r045's shut right eye at 1024 px: a lens-shaped dark fleck in every view) -PieceSink: a body point in front of a mood piece where the piece is not see-through (a thin hair tip lying on the lid, 7 mm out, between the grid's snap rays) goes 2 mm behind it
if ($PieceSink) { $env:FIT_PIECE_SINK = '1' } else { $env:FIT_PIECE_SINK = '' }
# (13 Nov 2026, r045 at 1024 px) -LidHair (with -LidSoft): above a shut eye's top, hair that is not dark (a mid-brown lock) stays as painted instead of turning dotted; strong changes inside the eye box are drawn solid (grey ticks of the old iris rim at the inner corners)
if ($LidHair) { $env:FIT_LID_HAIR = '1' } else { $env:FIT_LID_HAIR = '' }
# (13 Nov 2026, r050 at 1024 px) -MouthSoft: the "o", sad and excited mouth pieces reach a few px past what changed, so their cut edge does not leave a pale line along the erased smile
if ($MouthSoft) { $env:FIT_MOUTH_SOFT = '1' } else { $env:FIT_MOUTH_SOFT = '' }
# (13 Nov 2026, r050 and r057 at three-quarters) -LidLocal: a shut eye's fill takes the blush and shade round it (it was her flat painted skin, a light disc), and its smoothing runs long enough to reach the middle
if ($LidLocal) { $env:FIT_LID_LOCAL = '1' } else { $env:FIT_LID_LOCAL = '' }
# (13 Nov 2026, r064 and r050: two lash lines on the sad face) -SadTall: the sad face's part lid reaches a quarter above the eye's box, over a thick upper lash
if ($SadTall) { $env:FIT_SAD_TALL = '1' } else { $env:FIT_SAD_TALL = '' }
# (13 Nov 2026, r084's skin wedge across an iris, r045's shards over a lid) -EyeDespike: body points in the eye areas well in front of their neighbours go back to their depth
if ($EyeDespike) { $env:FIT_EYE_DESPIKE = '1' } else { $env:FIT_EYE_DESPIKE = '' }
# (13 Nov 2026, r074) -SadBot .42: how far down the eye's box the sad lid comes (default .18): her lash sat lower, the drawn lid closed nothing
$env:FIT_SAD_BOT = $SadBot
# (13 Nov 2026, r045's far eye past the nose) -EyeSkin: a villager's triangles inside each eye's oval are marked skin, so the game paints them while shut
if ($EyeSkin) { $env:FIT_EYE_SKIN = '1' } else { $env:FIT_EYE_SKIN = '' }
# (14 Nov 2026, r045's brows and hairline on shut eyes) -LidClip: a shut lid changes only its own oval and the eye's box
if ($LidClip) { $env:FIT_LID_CLIP = '1' } else { $env:FIT_LID_CLIP = '' }
$B = if ($env:SV_BLENDER) { $env:SV_BLENDER } else { 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe' }
$npx = if ($env:SV_NPX) { $env:SV_NPX } elseif ($IsLinux -or $IsMacOS) { Join-Path (Split-Path (Split-Path (Get-Command node).Source)) 'lib/node_modules/npm/bin/npx-cli.js' } else { 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js' }
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
$raw = Join-Path $root 'raw-models'; $o = Join-Path $root "fitted/$Id"; New-Item -ItemType Directory -Force $o | Out-Null
$j = Join-Path $repo "docs/meshy-production-20261107/joints/$Id.json"
function P($dir, $name) { Join-Path $dir $name }
# (11 Nov 2026) FIT_LOG=<file>: Blender's own output of every step is added to that file (the FIT lines: eyes, mouth, sizes)
function Run($script, $argList) { $ErrorActionPreference = 'Continue'; $out = & $B -b -P $script -- @argList 2>&1 | Out-String; if ($env:FIT_LOG) { Add-Content -Path $env:FIT_LOG -Value $out -Encoding UTF8 }; if ($LASTEXITCODE -ne 0 -or $out -match 'Traceback|rror: |EXCEPTION_') { throw "$script failed: $($out.Substring([Math]::Max(0,$out.Length-800)))" }; return $out }
# (-ke keeps the materials' skin_ref / own_face tags: without it the game never saw them)
function Pack($n) { & node $npx -y gltfpack@0.20.0 -i (P $o "$n.glb") -o (P $o "$n-packed.glb") -cc -kn -km -ke 2>&1 | Out-Null; return [int]((Get-Item (P $o "$n-packed.glb")).Length / 1KB) }
$null = Run (P 'tools/meshy' 'auto_joints.py') (@((P $raw "remesh/$Id.glb"), (P $raw "rigged/$Id.glb"), $Id, $j, (P $o 'joints-check.png')) + @(if ($Prefix) { $Prefix } else { @() }))
if ($Villager) {
  # (10 Nov 2026) the 500 KB budget: the 30k remesh at 1024 px was 1150 KB (580 KB of it shapes); Meshy's own 9k remesh
  # with a 1024 px picture, a 256 px face tile and JPEG $VQ keeps the face sharp up close (never our own decimation)
  if ($VMesh -eq '9000') { $vm = P $raw "remesh/$Id-9000.glb"; $vt = '12000' } else { $vm = P $raw "remesh/$Id.glb"; $vt = '40000' }
  # (10 Nov 2026) over 490 KB (Bom 517): fit again with a lighter picture (JPEG 60, then a 160 px face tile), never fewer triangles
  # (Mit was 504 KB at JPEG 60 and a 160 px tile: last, an 896 px picture at JPEG 70)
  foreach ($step in @(@($VQ, $VTile, $VTex), @('60', $VTile, $VTex), @('60', '160', $VTex), @('70', '160', '896'))) {
    $env:FIT_TILE = $step[1]; $env:FIT_JPGQ = $step[0]; $env:FIT_GN = $VGrid
    $null = Run (P 'tools/meshy' 'fit_people.py') @($vm, $Ref, (P $o "$Id-mid-pre.glb"), (P $o 'mid'), $vt, $step[2], '1.0', '-1', $j)
    $env:FIT_TILE = ''; $env:FIT_JPGQ = ''; $env:FIT_GN = ''
    $null = Run (P 'tools/meshy' 'transfer_rig.py') @((P $o "$Id-mid-pre.blend"), (P $raw "rigged/$Id.glb"), (P $o "$Id-mid.glb"), $Ref)
    $kb = Pack "$Id-mid"; if ($kb -le 490) { break }
  }
  if ($kb -gt 500) { throw "villager $Id is $kb KB (limit 500)" }
  Write-Output ("{0}: villager {1} KB (JPEG {2}, face tile {3}, picture {4} px)" -f $Id, $kb, $step[0], $step[1], $step[2]); return
}
$null = Run (P 'tools/meshy' 'fit_people.py') @((P $raw "remesh/$Id.glb"), $Ref, (P $o "$Id-hd-pre.glb"), (P $o 'hd'), '40000', '2048', '1.0', '-1', $j)
$null = Run (P 'tools/meshy' 'fit_people.py') @((P $raw "remesh/$Id-9000.glb"), $Ref, (P $o "$Id-light-pre.glb"), (P $o 'light'), '12000', '512', '1.0', '-1', $j)
foreach ($n in "$Id-hd", "$Id-light") { $null = Run (P 'tools/meshy' 'transfer_rig.py') @((P $o "$n-pre.blend"), (P $raw "rigged/$Id.glb"), (P $o "$n.glb"), $Ref) }
Write-Output ("{0}: light {1} KB, hd {2} KB" -f $Id, (Pack "$Id-light"), (Pack "$Id-hd"))
