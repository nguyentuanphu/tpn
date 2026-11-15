# run shots.mts against this worktree's server (port 8797); positional args so heavy.ps1 sees no dashed ones
#   shots.ps1 <out dir> <id> <friend|villager> <model> <glb> [device|close|both] [server]
# server: the page server of the game code that draws this model (models.json "server"; this worktree's by default)
param([string]$Out, [string]$Id, [string]$Kind, [string]$Model, [string]$Glb, [string]$What = 'both', [string]$Server = 'http://localhost:8797/')
$env:SV_URL = $Server
Set-Location (Join-Path $PSScriptRoot '..\..\..\tests')
& node ../tools/meshy/faceuv/shots.mts $Out $Id $Kind $Model $Glb $What
exit $LASTEXITCODE
