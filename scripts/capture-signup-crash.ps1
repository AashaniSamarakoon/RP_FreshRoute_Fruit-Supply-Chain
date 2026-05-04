param(
  [string]$DeviceId = "R58M64NJEKL",
  [string]$PackageName = "com.akalankadias.freshroutemobile",
  [int]$Seconds = 90
)

$ErrorActionPreference = "Stop"

$logsDir = Join-Path (Get-Location) "logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fullLog = Join-Path $logsDir "signup-crash-$timestamp.log"
$filteredLog = Join-Path $logsDir "signup-crash-$timestamp.filtered.log"

Write-Host "Clearing logcat on $DeviceId..."
adb -s $DeviceId logcat -c

Write-Host "Launching $PackageName..."
adb -s $DeviceId shell monkey -p $PackageName -c android.intent.category.LAUNCHER 1 | Out-Null

Write-Host "Reproduce the signup crash now. Capturing for $Seconds seconds..."
$job = Start-Job -ScriptBlock {
  param($DeviceId, $FullLog)
  adb -s $DeviceId logcat -v time | Tee-Object -FilePath $FullLog
} -ArgumentList $DeviceId, $fullLog

Start-Sleep -Seconds $Seconds
Stop-Job $job | Out-Null
Receive-Job $job | Out-Null
Remove-Job $job | Out-Null

$patterns = @(
  $PackageName,
  "SignupFlow",
  "GlobalError",
  "ReactNativeJS",
  "AndroidRuntime",
  "FATAL EXCEPTION",
  "Fatal signal",
  "DEBUG"
)

Select-String -Path $fullLog -Pattern $patterns |
  ForEach-Object { $_.Line } |
  Set-Content -Path $filteredLog

Write-Host "Full log: $fullLog"
Write-Host "Filtered log: $filteredLog"
