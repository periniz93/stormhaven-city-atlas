@echo off
setlocal
cd /d "C:\Users\perin\Documents\Codex\2026-08-02\ok-you-have-a-serious-picture"
if not exist "work" mkdir "work"
"C:\Program Files\nodejs\node.exe" "C:\Users\perin\Documents\Codex\2026-08-02\ok-you-have-a-serious-picture\ops\map-server.mjs" >> "work\map-production.log" 2>> "work\map-production.err.log"
