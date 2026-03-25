@echo off
REM Vercel Deployment Setup Script for Windows

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║          Bounce Classic 2026 - Vercel Setup            ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed. Please install Git first.
    echo Download from: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/npm is not installed. Please install it first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Git and npm are installed
echo.

REM Initialize git
echo [1] Initializing Git repository...
git init
git add .
git commit -m "Initial commit: Bounce Classic 2026"
echo [OK] Git repository initialized
echo.

REM Install Vercel CLI
echo [2] Installing Vercel CLI...
npm install -g vercel
echo [OK] Vercel CLI installed
echo.

REM Login to Vercel
echo [3] Opening Vercel login...
echo Please log in with your GitHub account:
vercel login
echo [OK] Vercel login complete
echo.

REM Deploy to Vercel
echo [4] Deploying to Vercel...
echo.
echo NOTE: When prompted:
echo   - Scope: Select your account
echo   - Project name: Enter 'bounce-classic-2026'
echo   - Link to existing project?: No
echo   - Build command: Leave blank (press Enter)
echo   - Output directory: Leave blank (press Enter)
echo.
echo Starting deployment...
vercel --prod
if %errorlevel% neq 0 (
    echo [ERROR] Deployment failed. Check the errors above.
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║          ✅ Deployment Complete!                       ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo NEXT STEPS:
echo 1. Go to vercel.com and log in
echo 2. Find your "bounce-classic-2026" project
echo 3. Go to Settings ^> Environment Variables
echo 4. Add this variable:
echo    - Name: GEMINI_API_KEY
echo    - Value: AIzaSyBdCEZP61fcYuCLZQBP5w67GwY6DVx8WCc
echo 5. Redeploy: vercel --prod
echo.
echo URL: Your game will be at https://bounce-classic-2026.vercel.app
echo.
pause
