@echo off
cd /d "D:\Code\receta-bebesh"
call npm run import:babyfoode -- --limit=20 >> logs\import.log 2>&1
