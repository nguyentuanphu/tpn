# the face-UV auditor's face pass (tools/meshy/faceuv/audit.mts) against this worktree's server; positional args for heavy.ps1
#   audit.ps1 <out dir> <friend id> [route: model=glb;...] [what]     route '-' = the models as installed
param([string]$Out, [string]$Id, [string]$Route = '-', [string]$Quick = 'poses:face,pics,kitviews')
$env:SV_URL = 'http://localhost:8797/'
if ($Route -ne '-') { $env:AUDIT_ROUTE = $Route } else { $env:AUDIT_ROUTE = '' }
Set-Location (Join-Path $PSScriptRoot '..\..\..\tests')
& node ../tools/meshy/faceuv/audit.mts $Out $Id $Quick
exit $LASTEXITCODE
