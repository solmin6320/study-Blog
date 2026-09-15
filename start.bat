@chcp 65001 >nul
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
rem  No build step, no Node.js - this only serves the folder as-is.
rem  Messages are in English on purpose: a .bat file written in UTF-8 can
rem  print mojibake on machines whose console code page is not 65001,
rem  and a broken message is worse than a plain one.
rem ===========================================================================

set "PORT=5500"
set "URL=http://localhost:%PORT%/index.html"

rem --- second pass -----------------------------------------------------------
rem  The script re-launches itself with --open so the browser opens only after
rem  the server is listening. Doing it inside this file avoids nested quoting.
if /i "%~1"=="--open" (
    ping -n 3 127.0.0.1 >nul
    start "" "%URL%"
    exit /b 0
)

rem --- find Python -----------------------------------------------------------
rem  "python -c ..." instead of "where python": on Windows the Microsoft Store
rem  alias sits on PATH but cannot actually run anything, so "where" lies.
set "PY="
python -c "import sys" >nul 2>&1
if not errorlevel 1 set "PY=python"

if not defined PY (
    py -c "import sys" >nul 2>&1
    if not errorlevel 1 set "PY=py"
)

if not defined PY (
    echo.
    echo  [start.bat] No Python found on this PC.
    echo.
    echo   Nothing is broken - this blog needs no build tools.
    echo   A tiny local web server is only needed so the browser is allowed
    echo   to read posts/index.json and posts/*.md over http.
    echo.
    echo   Pick whichever you prefer:
    echo     1^) Install Python  https://www.python.org/downloads/
    echo     2^) Use a static server you already have
    echo        ^(VS Code "Live Server" extension, port 5500^)
    echo.
    echo   Then open  %URL%
    echo.
    pause
    exit /b 1
)

rem --- run -------------------------------------------------------------------
echo.
echo  [start.bat] folder : %CD%
echo  [start.bat] address: %URL%
echo  [start.bat] stop   : Ctrl+C, or just close this window
echo.
echo  If the address is already in use, another server is running on %PORT%.
echo.

start "" /b "%~f0" --open
%PY% -m http.server %PORT%

echo.
echo  [start.bat] server stopped.
pause
endlocal
