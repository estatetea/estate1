// The Windows laptop print helper, delivered as one double-click setup file (EstateTeaPrintSetup.cmd).
// Setup puts the helper in %LOCALAPPDATA%\EstateTeaPrint, downloads SumatraPDF (free, prints PDFs
// silently), and adds a hidden launcher to the Startup folder so it runs whenever the laptop is on.
// The helper checks Ledger's print queue every minute and prints each Ready-for-dispatch bill once.

const LEDGER_QUEUE = 'https://estate-tea-ledger.vercel.app/api/ledger/print-queue';
const SUMATRA_ZIP = 'https://www.sumatrapdfreader.org/dl/rel/3.5.2/SumatraPDF-3.5.2-64.zip';

const HELPER_PS1 = `$ErrorActionPreference = 'Continue'
$Dir = Join-Path $env:LOCALAPPDATA 'EstateTeaPrint'
$Log = Join-Path $Dir 'print-log.txt'
$Base = '${LEDGER_QUEUE}'
function Log($m) { Add-Content -Path $Log -Value ("{0:yyyy-MM-dd HH:mm:ss}  {1}" -f (Get-Date), $m) }
$mutex = New-Object System.Threading.Mutex($false, 'Local\\EstateTeaPrintHelper')
if (-not $mutex.WaitOne(0)) { exit }
$Key = (Get-Content (Join-Path $Dir 'key.txt') -Raw).Trim()
$Sumatra = Join-Path $Dir 'SumatraPDF.exe'
$h = @{ 'x-print-key' = $Key }
Log 'Print helper started'
while ($true) {
  try {
    $q = Invoke-RestMethod -Uri $Base -Headers $h -TimeoutSec 60
    foreach ($b in $q.bills) {
      $pdf = Join-Path $env:TEMP ('estate-bill-' + $b.order_id + '.pdf')
      Invoke-WebRequest -Uri ($Base + '/' + $b.order_id + '/pdf') -Headers $h -OutFile $pdf -TimeoutSec 60 -UseBasicParsing
      $printer = (Get-Printer | Where-Object { $_.Name -like '*Brother*' } | Select-Object -First 1).Name
      if ($printer) { $printArgs = '-print-to "' + $printer + '" -silent "' + $pdf + '"' } else { $printArgs = '-print-to-default -silent "' + $pdf + '"'; $printer = 'default printer' }
      Start-Process -FilePath $Sumatra -ArgumentList $printArgs -Wait -WindowStyle Hidden
      Invoke-RestMethod -Method Post -Uri ($Base + '/' + $b.order_id + '/printed?printer=' + [uri]::EscapeDataString($printer)) -Headers $h -TimeoutSec 60 | Out-Null
      Log ('Printed ' + $b.estate_order_number + ' on ' + $printer)
      Remove-Item $pdf -ErrorAction SilentlyContinue
    }
  } catch { Log ('Problem: ' + $_.Exception.Message) }
  Start-Sleep -Seconds 60
}
`;

export function printHelperSetupCmd(key) {
  const setup = `$ErrorActionPreference = 'Stop'
$Dir = Join-Path $env:LOCALAPPDATA 'EstateTeaPrint'
New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Set-Content -Path (Join-Path $Dir 'key.txt') -Value '${key}'
Set-Content -Path (Join-Path $Dir 'helper.ps1') -Value @'
${HELPER_PS1}'@
if (-not (Test-Path (Join-Path $Dir 'SumatraPDF.exe'))) {
  Write-Host 'Downloading SumatraPDF (free PDF printer)...'
  $zip = Join-Path $env:TEMP 'sumatra.zip'
  try {
    Invoke-WebRequest -Uri '${SUMATRA_ZIP}' -OutFile $zip -UseBasicParsing
    Expand-Archive -Path $zip -DestinationPath $Dir -Force
    Get-ChildItem $Dir -Filter 'SumatraPDF*.exe' | Where-Object { $_.Name -ne 'SumatraPDF.exe' } | Select-Object -First 1 | Rename-Item -NewName 'SumatraPDF.exe'
  } catch {
    Write-Host 'Could not download SumatraPDF automatically. Download the 64-bit portable version from sumatrapdfreader.org,' -ForegroundColor Yellow
    Write-Host ('rename it to SumatraPDF.exe and put it in ' + $Dir + ', then run this setup again.') -ForegroundColor Yellow
    exit 1
  }
}
$startup = Join-Path ([Environment]::GetFolderPath('Startup')) 'EstateTeaPrint.vbs'
$cmd = 'powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File ""' + (Join-Path $Dir 'helper.ps1') + '""'
Set-Content -Path $startup -Value ('CreateObject("Wscript.Shell").Run "' + $cmd + '", 0, False')
Start-Process wscript -ArgumentList ('"' + $startup + '"')
$brother = (Get-Printer | Where-Object { $_.Name -like '*Brother*' } | Select-Object -First 1).Name
Write-Host ''
Write-Host 'Estate Tea laptop printing is set up.' -ForegroundColor Green
if ($brother) { Write-Host ('Bills will print on: ' + $brother) } else { Write-Host 'No Brother printer found on this laptop yet. Add it in Settings > Bluetooth & devices > Printers, then bills print there.' -ForegroundColor Yellow }
Write-Host 'It runs in the background and starts by itself whenever this laptop starts.'
Write-Host ('Log of printed bills: ' + (Join-Path $Dir 'print-log.txt'))
`;
  return `@echo off\r\ntitle Estate Tea laptop printing setup\r\npowershell -NoProfile -ExecutionPolicy Bypass -Command "$s = Get-Content -LiteralPath '%~f0' -Raw; $i = $s.LastIndexOf('#PS-START'); Invoke-Expression $s.Substring($i)"\r\necho.\r\npause\r\nexit /b\r\n#PS-START\r\n${setup.replace(/\n/g, '\r\n')}`;
}
