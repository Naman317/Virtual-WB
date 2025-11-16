@echo off
echo ========================================
echo   Virtual Whiteboard - Quick Start
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ from python.org
    pause
    exit /b 1
)

echo [1/5] Checking Python installation...
python --version
echo.

echo [2/5] Installing dependencies...
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

echo [3/5] Running database migrations...
python manage.py migrate --noinput
if %errorlevel% neq 0 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo Database ready!
echo.

echo [4/5] Checking configuration...
python manage.py check
if %errorlevel% neq 0 (
    echo ERROR: Configuration check failed
    pause
    exit /b 1
)
echo Configuration OK!
echo.

echo ========================================
echo   IMPORTANT: Redis Server Required
echo ========================================
echo.
echo Make sure Redis server is running on port 6379
echo.
echo Windows: Download from github.com/microsoftarchive/redis/releases
echo Or use WSL: wsl sudo service redis-server start
echo.
echo Check Redis: redis-cli ping (should return PONG)
echo.
pause
echo.

echo [5/5] Starting development server...
echo.
echo ========================================
echo   Virtual Whiteboard is Running!
echo ========================================
echo.
echo   Access at: http://localhost:8000
echo   Admin at:  http://localhost:8000/admin
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

python manage.py runserver
