@echo off
cd /d "C:\Users\KIIT0001\Downloads\hazardmap"
echo 🛑 Stopping HazardMap containers...
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>nul
docker-compose down 2>nul
echo ✅ Done! Containers stopped.
pause >nul
