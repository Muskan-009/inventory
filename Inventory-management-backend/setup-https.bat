@echo off
echo ========================================
echo HTTPS Setup for Inventory Management
echo ========================================
echo.

echo Step 1: Generating SSL Certificates...
call npm run generate-ssl

echo.
echo Step 2: Checking .env file...
if not exist .env (
    echo Creating .env file from example...
    echo Please copy env.example to .env and configure it
    echo.
    echo Add these lines to your .env file:
    echo ENABLE_HTTPS=true
    echo HTTPS_PORT=5443
    echo.
) else (
    echo .env file exists. Please make sure it contains:
    echo ENABLE_HTTPS=true
    echo HTTPS_PORT=5443
    echo.
)

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure ENABLE_HTTPS=true is in your .env file
echo 2. Start the server: npm start
echo 3. Access HTTPS URL: https://localhost:5443
echo.
echo Note: Browser will show security warning for self-signed certificate.
echo       Click "Advanced" and "Proceed" to continue.
echo.
pause

