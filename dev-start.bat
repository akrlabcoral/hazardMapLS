@echo off
chcp 65001 >nul
echo ============================================
echo  🚀 HazardMap - Development Mode (HOT RELOAD)
echo ============================================
echo.
echo This mode supports automatic code reloading!
echo Any file you save will be reflected instantly.
echo.
echo Stopping any existing containers...
cd /d "C:\Users\KIIT0001\Downloads\hazardmap"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>nul
cls
echo.
echo 🔄 Starting in DEV mode (first build may take 2-3 minutes)...
echo.
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
echo.
echo ============================================
echo Done! Press any key to close...
pause >nul
