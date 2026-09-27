@echo off
setlocal
cd /d "%~dp0"

rem ===========================================================================
rem  start.bat - one launcher for the local blog (meeting-05 B-6).
rem
rem  Two ways to run this blog locally:
rem    1. Docker editor server (server/, docs/api.md): write.html "Save" writes
rem       posts/ directly and auto-commits.
rem    2. start.ps1 preview server: static files only, NO save API - write.html
rem       cannot save (Save button disabled, "server missing").
rem
rem  This file picks for you: if Docker is installed it always goes for the
rem  editor server (2026-09-27 - the user asked for Docker to be handled
rem  automatically, and a silent fall back to the preview meant "server
rem  missing" in the editor):
rem    a. the daemon answers "docker info"         -> go on
rem    b. it does not, Docker Desktop is not open  -> launch Docker Desktop.exe
rem       (it does not, but Docker Desktop is open -> nudge with
rem        "docker desktop start --detach", it may still be booting)
rem    c. wait up to 120 seconds for the daemon, one progress line
rem    d. still nothing (exe not found / timeout) -> say why, print a loud
rem       "SAVING IS DISABLED" warning, then the preview server
rem  Then "docker compose up -d" and the browser. Only one of the two servers
rem  may run at once: a start.ps1 preview left on port 5500-5509 (or on
rem  BLOG_HOST_PORT) is stopped first - a preview started earlier while Docker
rem  was down would otherwise hold the port and push the editor elsewhere.
rem  Previews started with -Root (agents' sandbox copies) are left alone.
rem  Without Docker on PATH it starts start.ps1 as before, with the same warning.
rem
rem  Port (2026-09-26). 5500 is only the first choice - another program may own
rem  it (on this PC Oracle XE's listener sits on 127.0.0.1:5500, and the browser
rem  then talks to Oracle instead of the blog). The port is decided like this:
rem    1. our container is already running  -> reuse its port (no re-create)
rem    2. BLOG_HOST_PORT is set (environment variable, or a line in .env)
rem                                         -> use that value as it is
rem    3. otherwise                         -> the first of 5500..5509 that can
rem                                            be bound on 127.0.0.1 (and ::1)
rem  The choice goes to docker compose as BLOG_HOST_PORT (docker-compose.yml
rem  maps 127.0.0.1:${BLOG_HOST_PORT:-5500} to the container's 5500), and the
rem  health check, the printed addresses and the browser all use it. Without
rem  Docker the preview server gets the same choice (steps 2-3) as -Port.
rem  Note: drafts in localStorage belong to one address - a draft typed on
rem  localhost:5500 is not visible on localhost:5501. Steps 1-3 keep the port
rem  stable on one PC, so this only matters when the busy program changes.
rem
rem  BLOG_NO_BROWSER=1 skips opening the browser (checks and scripts).
rem
rem  No build step, no Node.js. Python lives only inside the Docker image.
rem
rem  Messages are in English on purpose: a .bat file written in UTF-8 can print
rem  mojibake on machines whose console code page is not 65001, and a broken
rem  message is worse than a plain one. Korean notes live in the docs.
rem
rem  Options are passed straight through to start.ps1, e.g.:  start.bat -Port 5501
rem  (any option skips the Docker path and the port choice - you asked for the
rem  preview server on your own terms.)
rem ===========================================================================

rem  Port picker, shared by both paths. PowerShell prints its own notes and
rem  hands the port back as its exit code (0 = no usable port; any code under
rem  1024 is read as a failure, so a pinned port must be 1024-65535). No double
rem  quotes inside - the whole script travels inside one "..." argument.
rem  START_PICK=docker enables step 1; START_PICK=preview skips it and also
rem  refuses a BLOG_HOST_PORT that another program is holding.
set "PK=$ErrorActionPreference = 'SilentlyContinue';"
set "PK=%PK% function Free($p) { foreach ($i in 0, 1) { if ($i -eq 0) { $a = [Net.IPAddress]::Loopback } else { $a = [Net.IPAddress]::IPv6Loopback };"
set "PK=%PK%   $l = New-Object Net.Sockets.TcpListener($a, $p); $l.ExclusiveAddressUse = $true;"
set "PK=%PK%   try { $l.Start(); $l.Stop() } catch { $e = $_.Exception; if ($e.InnerException) { $e = $e.InnerException };"
set "PK=%PK%     if ($i -eq 0 -or [string]$e.SocketErrorCode -eq 'AddressAlreadyInUse') { return $false } } }; return $true };"
set "PK=%PK% if ($env:START_PICK -eq 'docker') { $o = docker compose port editor 5500 2>$null;"
set "PK=%PK%   if ($LASTEXITCODE -eq 0 -and ([string]$o) -match ':(\d+)\s*$') { $q = [int]$matches[1];"
set "PK=%PK%     Write-Host (' [start.bat] the editor server is already running on port ' + $q + ' - reusing it.'); exit $q } };"
set "PK=%PK% $pin = [string]$env:BLOG_HOST_PORT; $src = 'BLOG_HOST_PORT';"
set "PK=%PK% if (-not $pin -and (Test-Path -LiteralPath '.env')) { foreach ($ln in Get-Content -LiteralPath '.env') {"
set "PK=%PK%   if ($ln -match '^\s*BLOG_HOST_PORT\s*=\s*[\x22\x27]?\s*([^\x22\x27\s#]*)') { $pin = $matches[1]; $src = 'BLOG_HOST_PORT in .env' } } };"
set "PK=%PK% $pin = $pin.Trim();"
set "PK=%PK% if ($pin) { if ($pin -match '^\d{1,5}$' -and [int]$pin -ge 1024 -and [int]$pin -le 65535) { $q = [int]$pin;"
set "PK=%PK%     if (Free $q) { exit $q };"
set "PK=%PK%     if ($env:START_PICK -eq 'docker') { Write-Host (' [start.bat] ' + $src + '=' + $q + ' but another program holds that port - docker compose will likely fail.'); exit $q };"
set "PK=%PK%     Write-Host (' [start.bat] ' + $src + '=' + $q + ' is held by another program - looking for a free port.') }"
set "PK=%PK%   else { Write-Host (' [start.bat] ignoring ' + $src + '=' + $pin + ' - not a port number in 1024-65535.') } };"
set "PK=%PK% foreach ($p in 5500..5509) { if (Free $p) { if ($p -ne 5500) { Write-Host (' [start.bat] port 5500 is in use by another program - using ' + $p) }; exit $p } };"
set "PK=%PK% Write-Host ' [start.bat] ports 5500-5509 are all in use by other programs.'; exit 0"

rem  Docker waiter (2026-09-27). "docker info" hangs for a long time while
rem  Docker Desktop is still booting, so each probe gets 5 seconds and is killed
rem  after that. Exit 0 = the daemon answers, 2 = Docker Desktop.exe not found,
rem  3 = no answer within 120 seconds. Same rule as PK: no double quotes.
set "DW=$ErrorActionPreference = 'SilentlyContinue';"
set "DW=%DW% function Up { $p = Start-Process -FilePath docker -ArgumentList 'info' -WindowStyle Hidden -PassThru;"
set "DW=%DW%   if ($p.WaitForExit(5000) -and $p.ExitCode -eq 0) { return $true }; try { $p.Kill() } catch {}; return $false };"
set "DW=%DW% if (Up) { exit 0 };"
set "DW=%DW% if (Get-Process -Name 'Docker Desktop') {"
set "DW=%DW%   Write-Host ' [start.bat] Docker Desktop is open but the engine does not answer yet - waiting for it.';"
set "DW=%DW%   Start-Process -FilePath docker -ArgumentList 'desktop', 'start', '--detach' -WindowStyle Hidden }"
set "DW=%DW% else { $c = @(); $d = (Get-Command docker).Source;"
set "DW=%DW%   if ($d) { $c += Join-Path (Split-Path (Split-Path (Split-Path $d))) 'Docker Desktop.exe' };"
set "DW=%DW%   foreach ($r in $env:ProgramFiles, $env:ProgramW6432) { if ($r) { $c += Join-Path $r 'Docker\Docker\Docker Desktop.exe' } };"
set "DW=%DW%   if ($env:LOCALAPPDATA) { $c += Join-Path $env:LOCALAPPDATA 'Programs\Docker\Docker\Docker Desktop.exe'; $c += Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe' };"
set "DW=%DW%   $c = @($c | Select-Object -Unique); $x = $null; foreach ($f in $c) { if (-not $x -and (Test-Path -LiteralPath $f)) { $x = $f } };"
set "DW=%DW%   if (-not $x) { Write-Host ' [start.bat] Docker is installed but not running, and Docker Desktop.exe was not found in:';"
set "DW=%DW%     foreach ($f in $c) { Write-Host ('               ' + $f) }; exit 2 };"
set "DW=%DW%   Write-Host (' [start.bat] Docker is not running - starting Docker Desktop: ' + $x); Start-Process -FilePath $x };"
set "DW=%DW% $t = [Diagnostics.Stopwatch]::StartNew();"
set "DW=%DW% while ($t.Elapsed.TotalSeconds -lt 120) { Write-Host -NoNewline ([string][char]13 + ' [start.bat] waiting for Docker Desktop to start... ' + [int]$t.Elapsed.TotalSeconds + 's   ');"
set "DW=%DW%   if (Up) { Write-Host ''; Write-Host (' [start.bat] Docker is ready after ' + [int]$t.Elapsed.TotalSeconds + 's.'); exit 0 }; Start-Sleep -Seconds 2 };"
set "DW=%DW% Write-Host ''; Write-Host ' [start.bat] Docker Desktop did not answer within 120 seconds.'; exit 3"

rem  Preview stopper (2026-09-27). A start.ps1 preview holds its port through
rem  http.sys (the port owner shows as PID 4), so it is found by command line:
rem  powershell/pwsh running -File start.ps1 without -Root, whose -Port (default
rem  5500) is in 5500-5509 or equals BLOG_HOST_PORT / .env. The cmd window that
rem  launched it through start.bat is closed too, so no stale window is left
rem  saying "the server exited". Same rule as PK: no double quotes.
set "KP=$ErrorActionPreference = 'SilentlyContinue';"
set "KP=%KP% $pin = [string]$env:BLOG_HOST_PORT;"
set "KP=%KP% if (-not $pin -and (Test-Path -LiteralPath '.env')) { foreach ($ln in Get-Content -LiteralPath '.env') {"
set "KP=%KP%   if ($ln -match '^\s*BLOG_HOST_PORT\s*=\s*[\x22\x27]?\s*([^\x22\x27\s#]*)') { $pin = $matches[1] } } };"
set "KP=%KP% $pin = $pin.Trim(); $me = @($PID); $w = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $PID); if ($w) { $me += $w.ParentProcessId };"
set "KP=%KP% $n = 0; foreach ($q in Get-CimInstance Win32_Process -Filter 'Name=''powershell.exe'' OR Name=''pwsh.exe''') {"
set "KP=%KP%   $cl = [string]$q.CommandLine; if ($me -contains $q.ProcessId) { continue };"
set "KP=%KP%   if ($cl -notmatch '-File\s+[\x22\x27]?[^\x22\x27]*start\.ps1' -or $cl -match '\s-Root\b') { continue };"
set "KP=%KP%   $port = 5500; if ($cl -match '-Port\s+(\d+)') { $port = [int]$matches[1] };"
set "KP=%KP%   if (-not (($port -ge 5500 -and $port -le 5509) -or [string]$port -eq $pin)) { continue };"
set "KP=%KP%   Write-Host (' [start.bat] stopping the preview server on port ' + $port + ' (pid ' + $q.ProcessId + ') - only one server may run at a time.');"
set "KP=%KP%   $pa = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $q.ParentProcessId);"
set "KP=%KP%   if ($pa -and $pa.Name -eq 'cmd.exe' -and ([string]$pa.CommandLine) -match 'start\.bat' -and -not ($me -contains $pa.ProcessId)) { Stop-Process -Id $pa.ProcessId -Force };"
set "KP=%KP%   Stop-Process -Id $q.ProcessId -Force; Wait-Process -Id $q.ProcessId -Timeout 5; $n++ };"
set "KP=%KP% if ($n) { Start-Sleep -Milliseconds 500 }; exit 0"

if not "%~1"=="" goto :preview_args

where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [start.bat] Docker was not found on this PC ^(no "docker" on PATH^).
    goto :nosave
)

if not exist "docker-compose.yml" (
    echo.
    echo  [start.bat] docker-compose.yml is missing next to this file.
    goto :nosave
)

echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "%DW%"
if errorlevel 1 goto :nosave

powershell -NoProfile -ExecutionPolicy Bypass -Command "%KP%"

set "START_PICK=docker"
powershell -NoProfile -ExecutionPolicy Bypass -Command "%PK%"
set "PORT=%ERRORLEVEL%"
if %PORT% LSS 1024 goto :noport
set "BLOG_HOST_PORT=%PORT%"

echo  [start.bat] Docker is up - starting the editor server on port %PORT% ^(docker compose up -d^)...
docker compose up -d
if errorlevel 1 (
    echo.
    echo  [start.bat] docker compose failed ^(see above^).
    goto :nosave
)

rem  Wait until /api/health answers (image build on first run can take a while).
rem  127.0.0.1, not localhost: compose publishes on IPv4 loopback only, and
rem  this skips the ::1 attempt. The browser below still uses localhost.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok = $false; for ($i = 0; $i -lt 40 -and -not $ok; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://127.0.0.1:%PORT%/api/health; if ($r.StatusCode -eq 200) { $ok = $true } } catch { Start-Sleep -Milliseconds 500 } }; if ($ok) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo.
    echo  [start.bat] the server did not answer on http://localhost:%PORT%/api/health within 20 s.
    echo              Check:  docker compose logs -f     Stop:  docker compose down
    pause
    exit /b 1
)

echo.
echo  [start.bat] editor server : http://localhost:%PORT%/write.html   ^(save writes posts/ and commits^)
echo  [start.bat] logs          : docker compose logs -f
echo  [start.bat] stop          : docker compose down
echo.
if not "%BLOG_NO_BROWSER%"=="1" start "" "http://localhost:%PORT%/index.html"
endlocal
exit /b 0

:noport
echo              Close one of them, or set BLOG_HOST_PORT in .env to a port you know is free.
echo.
pause
exit /b 1

rem  Every way from the Docker path down to the preview comes through here:
rem  the reason is already printed above, this makes the result impossible to
rem  miss (2026-09-27 - a quiet fall back looked like "Docker is broken").
:nosave
echo.
echo  ========================================================================
echo   WARNING: the Docker editor server is NOT running - SAVING IS DISABLED.
echo.
echo   Falling back to the preview server ^(static files only, no save API^).
echo   In write.html the Save button stays disabled ^("server missing"^);
echo   drafts are kept only in this browser until you can save.
echo   Fix the reason above ^(start Docker Desktop^), then run start.bat again.
echo  ========================================================================
echo.

:preview
if not exist "start.ps1" goto :noscript
where powershell >nul 2>&1
if errorlevel 1 goto :nopowershell

set "START_PICK=preview"
powershell -NoProfile -ExecutionPolicy Bypass -Command "%PK%"
set "PORT=%ERRORLEVEL%"
if %PORT% LSS 1024 goto :noport

rem  -File takes a RELATIVE path on purpose. The project folder name contains
rem  non-ASCII characters, and handing that path from cmd to powershell can
rem  mangle it. We already ran "cd /d %~dp0", so powershell inherits the right
rem  working directory and resolves start.ps1 itself.
if "%BLOG_NO_BROWSER%"=="1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "start.ps1" -Port %PORT% -NoBrowser
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -File "start.ps1" -Port %PORT%
)
goto :preview_done

:preview_args
if not exist "start.ps1" goto :noscript
where powershell >nul 2>&1
if errorlevel 1 goto :nopowershell
powershell -NoProfile -ExecutionPolicy Bypass -File "start.ps1" %*

:preview_done
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
    echo.
    echo  [start.bat] the server exited with code %RC%.
    echo.
    pause
)

endlocal & exit /b %RC%

:noscript
echo.
echo  [start.bat] start.ps1 is missing next to this file.
echo              Both files must sit in the project root, together.
echo.
pause
exit /b 1

:nopowershell
echo.
echo  [start.bat] Windows PowerShell was not found on PATH.
echo.
echo   Nothing is broken - this blog needs no build tools.
echo   A tiny local web server is only needed so the browser is allowed
echo   to read posts/index.json and posts/*.md over http.
echo.
echo   Use any static server you already have ^(VS Code "Live Server"^),
echo   then open  http://localhost:5500/index.html
echo.
pause
exit /b 1
