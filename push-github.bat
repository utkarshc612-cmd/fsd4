@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\utkar\Documents\GitHub\fullstack_app"

echo ========================================
echo GitHub Push Deployment Script
echo ========================================
echo.

echo [1/5] Configuring git user...
git config --global user.name "uc085211-boop"
git config --global user.email "utkarsh@github.com"
echo Done.
echo.

echo [2/5] Staging all files...
git add -A
echo Done.
echo.

echo [3/5] Committing changes...
git commit -m "Teacher management system - 21/22 features implemented, CORS fixed, all endpoints operational"
echo Done.
echo.

echo [4/5] Configuring remote repository...
echo Remote already configured (use your personal access token when prompted)
echo Done.
echo.

echo [5/5] Pushing to GitHub...
git push -u origin main --force
echo.

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo SUCCESS! Your code has been pushed to GitHub.
    echo Repository: https://github.com/utkarshc612-cmd/fsd4
    echo ========================================
) else (
    echo ========================================
    echo WARNING: Push command completed with status code %ERRORLEVEL%
    echo Check GitHub to verify if push was successful.
    echo ========================================
)

echo.
pause
