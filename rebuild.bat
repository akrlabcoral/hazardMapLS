@echo off
chcp 65001 >nul
echo ============================================
echo  🔄 HazardMap - Docker Rebuild Script
echo ============================================
echo.
echo Stopping containers...
cd /d "C:\Users\KIIT0001\Downloads\hazardmap"
docker-compose down
cls
echo.
echo 🔄 Building and starting containers...
echo This may take 2-3 minutes...
echo.
docker-compose up --build
echo.
echo ============================================
echo Done! Press any key to close...
pause >nul
