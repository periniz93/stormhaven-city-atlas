@echo off
setlocal
cd /d "C:\Users\perin\Documents\Codex\2026-08-02\ok-you-have-a-serious-picture"
if not exist "work" mkdir "work"
"C:\Program Files (x86)\cloudflared\cloudflared.exe" --config "C:\Users\perin\.cloudflared\stormhaven-map.yml" tunnel --no-autoupdate run >> "work\map-tunnel.log" 2>> "work\map-tunnel.err.log"
