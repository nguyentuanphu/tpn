# (Meshy production, 7 Nov 2026, owner-authorised overnight run) For each asset in order: the Meshy model (run_batch.py),
# a 30k and a 9k Remesh (remesh_once.py) and, for people, Auto-Rigging of the 30k remesh (rig_once.py). Every paid step is
# one POST through the tools' durable journal (never retried). Stops at the first error, or before spending past the cap.
#   powershell -File tools/meshy/overnight.ps1 -Assets finn,sol -StartBalance 2979 -Cap 1000
# (10 Nov 2026, cloud pilot) SV_MESHY_ROOT (default D:\WorkSpace\meshy), SV_PY (default Blender's Python on the owner's PC)
param([string[]]$Assets, [int]$StartBalance, [int]$Cap = 1000, [string]$Journal = '', [string]$Account = '', [string]$Raw = '', [string[]]$NoRig = @('puppy'))
$root = if ($env:SV_MESHY_ROOT) { $env:SV_MESHY_ROOT } else { 'D:\WorkSpace\meshy' }
if (-not $Journal) { $Journal = Join-Path $root 'private/meshy-jobs.sqlite3' }; if (-not $Account) { $Account = Join-Path $root 'private/meshy-account.json' }; if (-not $Raw) { $Raw = Join-Path $root 'raw-models' }
$ErrorActionPreference = 'Stop'
$Assets = @($Assets | ForEach-Object { $_ -split ',' } | Where-Object { $_ })   # (-File passes "a,b,c" as one string)
$env:PYTHONUTF8 = '1'; if (-not ($IsLinux -or $IsMacOS)) { $env:MESHY_API_KEY = [Environment]::GetEnvironmentVariable('MESHY_API_KEY', 'User') }
$py = if ($env:SV_PY) { $env:SV_PY } else { 'C:\Users\nguye\tools\blender-4.2.23-windows-x64\4.2\python\bin\python.exe' }
Set-Location (Split-Path $PSScriptRoot -Parent | Split-Path -Parent)
function Log($m) { $l = "$((Get-Date).ToString('HH:mm:ss')) $m"; Write-Output $l; Add-Content -Path (Join-Path $root 'private/overnight.log') -Value $l }
function Balance { (Invoke-RestMethod -Uri 'https://api.meshy.ai/openapi/v1/balance' -Headers @{ Authorization = "Bearer $env:MESHY_API_KEY" } -TimeoutSec 30).balance }
function Step($tool, $argsList) { $o = & $py $tool @argsList 2>&1 | Out-String; if ($o -match 'errorType') { throw "$tool $($argsList -join ' '): $($o.Trim())" }; return $o.Trim() }
function Wait($tool, $key, $kind) {
  for ($i = 0; $i -lt 90; $i++) {
    $o = if ($kind -eq 'job') { Step $tool @('poll', '--asset', $key, '--journal', $Journal) } else { Step $tool @('poll', '--source-asset', $key, '--journal', $Journal) }
    if ($o -match 'SUCCEEDED') { return }
    if ($o -match 'FAILED|CANCEL') { throw "$key failed: $o" }
    Start-Sleep -Seconds 20
  }
  throw "$key did not finish in 30 min"
}
function Guard($need) { $b = Balance; if ($StartBalance - $b + $need -gt $Cap) { throw "cap: spent $($StartBalance - $b), next step $need would pass $Cap" }; return $b }
try {
  foreach ($a in $Assets) {
    Log "== $a"
    $null = Guard 30; Log (Step (Join-Path 'tools/meshy' 'run_batch.py') @('submit', '--asset', $a, '--journal', $Journal, '--account', $Account))
    Wait (Join-Path 'tools/meshy' 'run_batch.py') $a 'job'; Log (Step (Join-Path 'tools/meshy' 'run_batch.py') @('download', '--asset', $a, '--journal', $Journal, '--raw-root', $Raw))
    $null = Guard 5; Log (Step (Join-Path 'tools/meshy' 'remesh_once.py') @('submit', '--source-asset', $a, '--polycount', '30000', '--journal', $Journal, '--approved'))
    Wait (Join-Path 'tools/meshy' 'remesh_once.py') $a 'remesh'; Log (Step (Join-Path 'tools/meshy' 'remesh_once.py') @('download', '--source-asset', $a, '--journal', $Journal, '--raw-root', $Raw))
    $null = Guard 5; Log (Step (Join-Path 'tools/meshy' 'remesh_once.py') @('submit', '--source-asset', "$a@9000", '--polycount', '9000', '--journal', $Journal, '--approved'))
    Wait (Join-Path 'tools/meshy' 'remesh_once.py') "$a@9000" 'remesh'; Log (Step (Join-Path 'tools/meshy' 'remesh_once.py') @('download', '--source-asset', "$a@9000", '--journal', $Journal, '--raw-root', $Raw))
    if ($NoRig -notcontains $a) {
      $null = Guard 5; Log (Step (Join-Path 'tools/meshy' 'rig_once.py') @('submit', '--source-asset', $a, '--height', '1.25', '--journal', $Journal, '--approved'))
      Wait (Join-Path 'tools/meshy' 'rig_once.py') $a 'rig'; Log (Step (Join-Path 'tools/meshy' 'rig_once.py') @('download', '--source-asset', $a, '--journal', $Journal, '--raw-root', $Raw))
    }
    Log "done $a, balance $(Balance)"
  }
  Log "ALL DONE, balance $(Balance)"
} catch { Log "STOPPED: $($_.Exception.Message)" } finally { if (-not ($IsLinux -or $IsMacOS)) { Remove-Item Env:MESHY_API_KEY -ErrorAction SilentlyContinue } }
