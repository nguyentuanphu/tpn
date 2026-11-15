# Sol's face-UV model, end to end: bake, eyes, build, pack, install into models/. Positional args (heavy.ps1).
#   powershell -NoProfile -Command "& 'D:\WorkSpace\meshy\tools\heavy.ps1' powershell -NoProfile -File tools\meshy\soleyes\make.ps1"
param([string]$Src = 'D:\WorkSpace\meshy\fitted\sol-own\sol-dressed-hd.glb', [string]$D = 'D:\WorkSpace\meshy\fitted\soleyes-bake', [string]$Model = 'sol-hd')
$ErrorActionPreference = 'Stop'
$py = 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\4.2\python\bin\python.exe'; $t = $PSScriptRoot; $repo = Resolve-Path (Join-Path $t '..\..\..')
foreach ($step in @(@('bake.py', $Src, $D), @('eyes.py', $D), @('build.py', $Src, $D, "$D\$Model-faceuv.glb"))) {
  & $py (Join-Path $t $step[0]) @($step[1..($step.Count - 1)]); if ($LASTEXITCODE -ne 0) { throw "$($step[0]) failed" } }
& (Join-Path $t 'pack.ps1') "$D\$Model-faceuv.glb" "$D\$Model-faceuv-packed.glb"
Copy-Item "$D\$Model-faceuv-packed.glb" (Join-Path $repo "models\$Model.glb")
Write-Output ("installed models\$Model.glb {0} KB" -f [int]((Get-Item "$D\$Model-faceuv-packed.glb").Length / 1KB))
