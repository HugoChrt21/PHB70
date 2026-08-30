@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "$listener = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue; if (-not $listener) { Start-Process -FilePath node -ArgumentList 'server.mjs' -WorkingDirectory $PWD.Path -WindowStyle Hidden; for ($i = 0; $i -lt 20; $i++) { if (Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue) { break }; Start-Sleep -Milliseconds 100 } }"
start "" "http://127.0.0.1:5500/"
