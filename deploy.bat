@echo off
:: ─────────────────────────────────────────────────────────────
::  deploy.bat  —  Karthik Manu personal website
::
::  USAGE (from any CMD window):
::    deploy                    → auto-detects all changes
::    deploy "my custom message"→ uses your commit message
::
::  Just edit live_ppt.pptx, save it, then type:  deploy
::  GitHub Actions will convert the slides automatically (~2 min).
:: ─────────────────────────────────────────────────────────────
setlocal EnableDelayedExpansion

set "REPO=C:\Users\Karthik.Manu\OneDrive - Swerim\Desktop\Smarts\personal"
cd /d "%REPO%"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   Karthik Manu — Website Deploy Tool    ║
echo  ╚══════════════════════════════════════════╝
echo.

:: ── Stage all relevant files ───────────────────────────────
git add live_ppt.pptx index.html style.css script.js data.json

:: ── Check if there is anything staged ────────────────────
git diff --staged --quiet
if %ERRORLEVEL% == 0 (
    echo  [i] Nothing changed — website is already up to date.
    echo.
    goto :done
)

:: ── Build commit message ──────────────────────────────────
if "%~1"=="" (
    :: Auto-generate timestamp message
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "dt=%%a"
    set "stamp=!dt:~0,4!-!dt:~4,2!-!dt:~6,2! !dt:~8,2!:!dt:~10,2!"
    set "MSG=update: website content [!stamp!]"
) else (
    set "MSG=%~1"
)

:: ── Commit ────────────────────────────────────────────────
echo  [1/2] Committing: !MSG!
git commit -m "!MSG!"
if %ERRORLEVEL% neq 0 (
    echo  [!] Commit failed. Check git status above.
    goto :done
)

:: ── Push ─────────────────────────────────────────────────
echo  [2/2] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% neq 0 (
    echo  [!] Push failed. Check your internet connection.
    goto :done
)

echo.
echo  ✓  Done! GitHub will rebuild your site in ~2 minutes.
echo.
echo  ➜  Live site  : https://karman41-hub.github.io
echo  ➜  Actions    : https://github.com/karman41-hub/karman41-hub.github.io/actions
echo.

:done
pause
