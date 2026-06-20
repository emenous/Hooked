$ErrorActionPreference = "Stop"

$RemoteUser = "u289597582"
$RemoteHost = "147.93.42.188"
$RemotePort = "65002"
$RemotePath = "domains/prntscrn.dev/public_html/Hooked/."
$KeyPath = Join-Path $HOME ".ssh\hooked_deploy_ed25519"
$TargetPath = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path -LiteralPath $KeyPath)) {
    throw "SSH key not found: $KeyPath"
}

Write-Host "Pulling Hooked live files into $TargetPath"

scp `
    -r `
    -P $RemotePort `
    -i $KeyPath `
    -o IdentitiesOnly=yes `
    -o StrictHostKeyChecking=accept-new `
    "${RemoteUser}@${RemoteHost}:${RemotePath}" `
    $TargetPath

Write-Host "Pulled from ${RemoteUser}@${RemoteHost}:${RemotePath}"
