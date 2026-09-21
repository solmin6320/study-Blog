@echo off
setlocal
cd /d "%~dp0"

rem ===========================================================================
rem  start.bat - one launcher for the local blog (meeting-05 B-6).
rem
rem  Two ways to run this blog locally:
rem    1. Docker editor server (server/, docs/api.md): write.html "Save" writes
rem       posts/ directly and auto-commits. Port 5500.
rem    2. start.ps1 preview server: static files only, NO save API - write.html
rem       cannot save (Save button disabled, "server missing"). Port 5500 as well.
rem
rem  This file picks for you: if the Docker daemon answers "docker info" within
rem  5 seconds, it runs "docker compose up -d" and opens the browser. Otherwise
rem  it starts start.ps1 exactly as before. Only one of the two may own port 5500.
rem
rem  No build step, no Node.js. Python lives only inside the Docker image.
rem
rem  Messages are in English on purpose: a .bat file written in UTF-8 can print
rem  mojibake on machines whose console code page is not 65001, and a broken
rem  message is worse than a plain one. Korean notes live in the docs.
rem
rem  Options are passed straight through to start.ps1, e.g.:  start.bat -Port 5501
rem  (any option skips the Docker path - you asked for the preview server.)
rem ===========================================================================

if not "%~1"=="" goto :preview

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
echo  [start.bat] Docker is up - starting the editor server ^(docker compose up -d^)...
docker compose up -d
if errorlevel 1 (
    echo.
    echo  [start.bat] docker compose failed ^(see above^) - falling back to the preview server.
    goto :preview
)

rem  Wait until /api/health answers (image build on first run can take a while).
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok = $false; for ($i = 0; $i -lt 40 -and -not $ok; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 http://localhost:5500/api/health; if ($r.StatusCode -eq 200) { $ok = $true } } catch { Start-Sleep -Milliseconds 500 } }; if ($ok) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo.
    echo  [start.bat] the server did not answer on http://localhost:5500/api/health within 20 s.
    echo              Check:  docker compose logs -f     Stop:  docker compose down
    pause
    exit /b 1
)

echo.
echo  [start.bat] editor server : http://localhost:5500/write.html   ^(save writes posts/ and commits^)
echo  [start.bat] logs          : docker compose logs -f
echo  [start.bat] stop          : docker compose down
echo.
start "" "http://localhost:5500/index.html"
endlocal
exit /b 0

:preview
if not exist "start.ps1" (
    echo.
    echo  [start.bat] start.ps1 is missing next to this file.
    echo              Both files must sit in the project root, together.
    echo.
    pause
    exit /b 1
)

where powershell >nul 2>&1
if errorlevel 1 (
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
)

rem  -File takes a RELATIVE path on purpose. The project folder name contains
rem  non-ASCII characters, and handing that path from cmd to powershell can
rem  mangle it. We already ran "cd /d %~dp0", so powershell inherits the right
rem  working directory and resolves start.ps1 itself.
powershell -NoProfile -ExecutionPolicy Bypass -File "start.ps1" %*
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
    echo.
    echo  [start.bat] the server exited with code %RC%.
    echo.
    pause
)

endlocal
