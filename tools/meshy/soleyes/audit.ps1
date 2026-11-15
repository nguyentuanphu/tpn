# the facekit auditor's face pass (tools/meshy/audit-facekit.mts, a local copy of sv-meshy-facekit's audit.mts, not committed)
# against this worktree's server; positional args for heavy.ps1
param([string]$Out, [string]$Quick = 'poses:face,pics,kitviews')
$env:SV_URL = 'http://localhost:8797/'
Set-Location (Join-Path $PSScriptRoot '..\..\..\tests')
& node ../tools/meshy/audit-facekit.mts $Out sol $Quick
exit $LASTEXITCODE
