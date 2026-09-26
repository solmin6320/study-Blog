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
rem  This file picks for you: if the Docker daemon answers "docker info" within
rem  5 seconds, it runs "docker compose up -d" and opens the browser. Otherwise
rem  it starts start.ps1 exactly as before. Only one of the two may run at once.
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

if not "%~1"=="" goto :preview_args

where docker >nul 2>&1
if errorlevel 1 goto :preview

if not exist "docker-compose.yml" goto :preview

rem  "docker info" hangs for a long time while Docker Desktop is still booting.
rem  Give it 5 seconds through a tiny PowerShell wait; anything else = fallback.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Start-Process -FilePath docker -ArgumentList 'info' -WindowStyle Hidden -PassThru; if ($p.WaitForExit(5000) -and $p.ExitCode -eq 0) { exit 0 } else { try { $p.Kill() } catch {}; exit 1 }"
if errorlevel 1 (
    echo.
    echo  [start.bat] Docker is installed but the daemon is not running - using the preview server.
    echo              Start Docker Desktop and run start.bat again to enable saving.
    goto :preview
)

echo.
set "START_PICK=docker"
powershell -NoProfile -ExecutionPolicy Bypass -Command "%PK%"
set "PORT=%ERRORLEVEL%"
if %PORT% LSS 1024 goto :noport
set "BLOG_HOST_PORT=%PORT%"

echo  [start.bat] Docker is up - starting the editor server on port %PORT% ^(docker compose up -d^)...
docker compose up -d
if errorlevel 1 (
    echo.
    echo  [start.bat] docker compose failed ^(see above^) - falling back to the preview server.
    goto :preview
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
