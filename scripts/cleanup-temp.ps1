param(
  [int]$OlderThanDays = 7,
  [switch]$DryRun = $false,
  [switch]$IncludeWindowsTemp = $false,
  [switch]$IncludeAllUserTemps = $false
)

$ErrorActionPreference = 'Continue'
$cutoff = (Get-Date).AddDays(-$OlderThanDays)

$targets = New-Object System.Collections.Generic.List[string]
$targets.Add([System.IO.Path]::GetTempPath())

if ($IncludeWindowsTemp) {
  $targets.Add('C:\Windows\Temp')
}

if ($IncludeAllUserTemps) {
  Get-ChildItem 'C:\Users' -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $p = Join-Path $_.FullName 'AppData\Local\Temp'
    if (Test-Path -LiteralPath $p) { $targets.Add($p) }
  }
}

$summary = [ordered]@{
  scanned = 0
  removed = 0
  failed = 0
}

foreach ($target in ($targets | Select-Object -Unique)) {
  if (!(Test-Path -LiteralPath $target)) { continue }

  Write-Host "\nTarget: $target"
  Get-ChildItem -LiteralPath $target -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.LastWriteTime -lt $cutoff
  } | ForEach-Object {
    $summary.scanned++
    if ($DryRun) {
      Write-Host "[DRY RUN] Would remove: $($_.FullName)"
    } else {
      try {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
        $summary.removed++
      } catch {
        $summary.failed++
      }
    }
  }
}

Write-Host "\nDone. Scanned: $($summary.scanned) | Removed: $($summary.removed) | Failed: $($summary.failed)"
