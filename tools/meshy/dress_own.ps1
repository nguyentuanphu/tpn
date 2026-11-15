# (Meshy production, 8 Nov 2026; owner: "nếu bím tóc clara khó quá thì lấy cái hình của meshy rồi làm lại mắt cũng được")
# A friend on their OWN swim-body model, head and all (no graft): the fitted swim body already carries its own face moods
# (fit_people.py); this only makes the clothes (make_clothes.py, braids marked by CL_OWN_BRAIDS) and packs both sizes.
#   powershell -File tools/meshy/dress_own.ps1 -Id clara
# In:  D:\WorkSpace\meshy\fitted\<id>-swim\<id>-swim-{hd,light}.blend (fit_person.ps1 -Id <id>-swim)
# Out: D:\WorkSpace\meshy\fitted\<id>-own\<id>-dressed-{light,hd}-packed.glb (models/<id>.glb, <id>-hd.glb once approved)
param([string]$Id, [int]$LightTex = 400, [string]$LightBody = '.6')
$ErrorActionPreference = 'Stop'
$B = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\blender.exe'; $npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent; Set-Location $repo
function Run($script, $argList) { $ErrorActionPreference = 'Continue'; $out = & $B -b -P $script -- @argList 2>&1 | Out-String; if ($LASTEXITCODE -ne 0 -or $out -match 'Traceback|rror: |EXCEPTION_') { throw "$script failed: $($out.Substring([Math]::Max(0,$out.Length-800)))" }; return $out }
$s = "D:\WorkSpace\meshy\fitted\$Id-swim"; $g = "D:\WorkSpace\meshy\fitted\$Id-own"; New-Item -ItemType Directory -Force $g | Out-Null
# the light model's pictures at most $LightTex px (500 KB limit), and its body thinned below the neck
$null = Run 'tools\meshy\tex_max.py' @("$s\$Id-swim-light.blend", "$g\$Id-own-light.blend", "$LightTex")
$env:CL_OWN_BRAIDS = '1'
foreach ($n in 'hd', 'light') {
  $src = if ($n -eq 'hd') { "$s\$Id-swim-hd.blend" } else { "$g\$Id-own-light.blend" }
  if ($n -eq 'light') { $env:CL_BODY_REDUCE = $LightBody } else { Remove-Item Env:CL_BODY_REDUCE -ErrorAction SilentlyContinue }
  $null = Run 'tools\meshy\make_clothes.py' @($src, "$g\$Id-dressed-$n.glb")
  & node $npx -y gltfpack@0.20.0 -i "$g\$Id-dressed-$n.glb" -o "$g\$Id-dressed-$n-packed.glb" -cc -kn -km -ke 2>&1 | Out-Null
}
Remove-Item Env:CL_OWN_BRAIDS, Env:CL_BODY_REDUCE -ErrorAction SilentlyContinue
Write-Output ("{0} (own head): light {1} KB, hd {2} KB" -f $Id, [int]((Get-Item "$g\$Id-dressed-light-packed.glb").Length / 1KB), [int]((Get-Item "$g\$Id-dressed-hd-packed.glb").Length / 1KB))
