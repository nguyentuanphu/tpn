# gltfpack with the pipeline's flags (fit_person.ps1 Pack): positional in/out/version, so heavy.ps1 sees no dashed arguments
param([string]$In, [string]$Out, [string]$Ver = '0.20.0')
$npx = 'C:\Program Files\nodejs\node_modules\npm\bin\npx-cli.js'
& node $npx -y gltfpack@$Ver -i $In -o $Out -cc -kn -km -ke
