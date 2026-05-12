param(
  [string]$TaskName = 'Zawadi-Temp-Cleanup-Weekly',
  [int]$OlderThanDays = 7,
  [string]$DayOfWeek = 'Sunday',
  [string]$Time = '03:00'
)

$scriptPath = "C:\Amalgamate\Projects\Zawadi SMS\scripts\cleanup-temp.ps1"
if (!(Test-Path -LiteralPath $scriptPath)) {
  throw "Cleanup script not found: $scriptPath"
}

$actionArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -OlderThanDays $OlderThanDays"
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $actionArgs
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $DayOfWeek -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -WakeToRun

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'Weekly cleanup of temp files' -Force | Out-Null
Write-Host "Scheduled task created/updated: $TaskName ($DayOfWeek at $Time)"
