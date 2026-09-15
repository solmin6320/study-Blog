@echo off
setlocal
cd /d "%~dp0"

rem ===========================================================================
rem  start.bat - local preview server for this static blog.
rem
rem  Why a server at all? The pages fetch posts/index.json and posts/*.md.
rem  Browsers block those requests when a page is opened with file://,
rem  so opening index.html by double-click shows an empty board.
rem
rem  No build step, no Node.js, no Python. The server is start.ps1, which uses
rem  System.Net.HttpListener from the Windows PowerShell that ships with Windows.
rem  This file only launches it.
rem
rem  Messages are in English on purpose: a .bat file written in UTF-8 can print
rem  mojibake on machines whose console code page is not 65001, and a broken
rem  message is worse than a plain one. Korean notes live in the docs.
rem
rem  Options are passed straight through, e.g.:  start.bat -Port 5501
rem ===========================================================================

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
