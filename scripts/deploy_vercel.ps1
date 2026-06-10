param(
  [string]$TeamId = "team_WMFgdCTic1WYIl6sQDPgsOzA",
  [string]$TeamSlug = "weiping-yan-s-projects",
  [string]$ProjectName = "kbuilt",
  [string]$EngineUrl = "https://weipingapple-kbuilt-engine.hf.space/"
)

$ErrorActionPreference = "Stop"

if (-not $env:VERCEL_TOKEN) {
  throw "VERCEL_TOKEN is required. Create a Vercel account token and expose it only in the current shell."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
function Invoke-VercelApi {
  param(
    [Parameter(Mandatory = $true)][string]$Method,
    [Parameter(Mandatory = $true)][string]$Path,
    [object]$Body = $null
  )

  $headers = @{
    Authorization = "Bearer $env:VERCEL_TOKEN"
    "Content-Type" = "application/json"
  }

  $uri = "https://api.vercel.com$Path"
  if ($Body -ne $null) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 20)
  }

  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

Write-Host "[kbuilt] ensuring Vercel project '$ProjectName' exists..."
$projectPath = "/v9/projects/$ProjectName?teamId=$TeamId"

try {
  $null = Invoke-VercelApi -Method GET -Path $projectPath
  Write-Host "[kbuilt] project already exists"
} catch {
  $createBody = @{
    name = $ProjectName
    framework = $null
    buildCommand = "node build.js"
    outputDirectory = "public"
    rootDirectory = "web"
    gitRepository = @{
      type = "github"
      repo = "appleweiping/kbuilt"
    }
    environmentVariables = @(
      @{
        key = "NEXT_PUBLIC_ENGINE_URL"
        value = $EngineUrl
        target = "production"
        type = "plain"
      }
    )
  }

  try {
    $null = Invoke-VercelApi -Method POST -Path "/v11/projects?teamId=$TeamId" -Body $createBody
    Write-Host "[kbuilt] project created"
  } catch {
    if ($_.ErrorDetails.Message -match "already exists") {
      Write-Host "[kbuilt] project already exists"
    } else {
      throw
    }
  }
}

Write-Host "[kbuilt] upserting production engine URL..."
$envBody = @{
  key = "NEXT_PUBLIC_ENGINE_URL"
  value = $EngineUrl
  type = "plain"
  target = @("production", "preview", "development")
}
$null = Invoke-VercelApi -Method POST -Path "/v10/projects/$ProjectName/env?teamId=$TeamId&upsert=true" -Body $envBody

Push-Location $repoRoot
try {
  Write-Host "[kbuilt] linking repository root to Vercel project..."
  npx vercel@latest link --yes --project $ProjectName --scope $TeamSlug --token $env:VERCEL_TOKEN

  Write-Host "[kbuilt] deploying production..."
  npx vercel@latest deploy --prod --yes --scope $TeamSlug --token $env:VERCEL_TOKEN
} finally {
  Pop-Location
}
