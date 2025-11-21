@echo off
echo ========================================
echo    Authentication Test Script
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo Waiting for frontend to start...
timeout /t 8 /nobreak > nul

echo.
echo ========================================
echo    Servers Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Test Pages:
echo - Auth Test: http://localhost:3000/auth-test.html
echo - Debug Login: http://localhost:3000/debug-login.html
echo - Token Test: http://localhost:3000/test-token.html
echo.
echo Opening test page in browser...
start http://localhost:3000/auth-test.html

echo.
echo Press any key to exit...
pause > nul
