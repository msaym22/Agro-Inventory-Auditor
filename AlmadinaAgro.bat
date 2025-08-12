@echo off

:: Start backend server
start /B node "backend\server.js"

:: Wait 10 seconds for backend to initialize
timeout /t 10 /nobreak >nul

:: Start frontend server
start /B cmd /c "cd frontend && npm start"

:: Wait 5 seconds for frontend to start
timeout /t 5 /nobreak >nul

:: Open the application in default browser
start http://localhost:3000

exit