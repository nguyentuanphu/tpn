# run shots.mts against this worktree's server (port 8797); positional args so heavy.ps1 sees no dashed ones
param([string]$Out, [string]$Which = 'new', [string]$What = 'both')
$env:SV_URL = 'http://localhost:8797/'
Set-Location (Join-Path $PSScriptRoot '..\..\..\tests')
& node ../tools/meshy/soleyes/shots.mts $Out $Which $What
exit $LASTEXITCODE
