# Quick Start Script for Virtual Whiteboard
# Run this script to quickly set up and run the application

Write-Host "🎨 Virtual Whiteboard - Quick Start" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Redis is running
Write-Host "📋 Checking Redis..." -ForegroundColor Yellow
try {
    $redis = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redis.TcpTestSucceeded) {
        Write-Host "✅ Redis is running on port 6379" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis is not running!" -ForegroundColor Red
        Write-Host "   Please start Redis server first." -ForegroundColor Yellow
        Write-Host "   Download: https://redis.io/download" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠️  Could not check Redis status" -ForegroundColor Yellow
}

Write-Host ""

# Check if migrations are needed
Write-Host "📋 Checking database..." -ForegroundColor Yellow
if (-not (Test-Path "db.sqlite3")) {
    Write-Host "   Running migrations..." -ForegroundColor Cyan
    python manage.py migrate
}

Write-Host ""

# Offer to create superuser
Write-Host "👤 Do you want to create a superuser? (y/N)" -ForegroundColor Yellow
$createSuperuser = Read-Host
if ($createSuperuser -eq "y" -or $createSuperuser -eq "Y") {
    python manage.py createsuperuser
}

Write-Host ""
Write-Host "🚀 Starting Virtual Whiteboard..." -ForegroundColor Green
Write-Host "   Access at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "   Admin at: http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
python manage.py runserver
