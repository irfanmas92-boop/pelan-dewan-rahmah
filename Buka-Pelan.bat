@echo off
rem Buka Pelan Dewan Rahmah dalam pelayar (perlu Node.js)
cd /d "%~dp0"
start "" http://localhost:5270
node serve.js 5270
