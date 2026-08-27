import { createServer, request as proxyRequest } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const clientDir = join(root, "dist", "client");
const upstreamPort = 30002;
const publicPort = 30001;
const vinextCli = join(root, "node_modules", "vinext", "dist", "cli.js");

const contentTypes = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function withSecurityHeaders(headers = {}) {
  const secured = { ...headers };
  const protectedNames = new Set(Object.keys(securityHeaders).map((name) => name.toLowerCase()));
  for (const name of Object.keys(secured)) {
    if (protectedNames.has(name.toLowerCase())) delete secured[name];
  }
  return { ...secured, ...securityHeaders };
}

const upstream = spawn(process.execPath, [vinextCli, "start", "--hostname", "127.0.0.1", "--port", String(upstreamPort)], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
});

function safeStaticPath(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath); } catch { return null; }
  const candidate = resolve(clientDir, `.${decoded}`);
  return candidate.startsWith(`${resolve(clientDir)}\\`) ? candidate : null;
}

function serveStatic(req, res) {
  if (!req.url) return false;
  const pathname = req.url.split("?", 1)[0];
  if (!pathname.startsWith("/assets/") && pathname !== "/favicon.ico") return false;
  const filePath = safeStaticPath(pathname);
  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, withSecurityHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    res.end("Not Found");
    return true;
  }
  res.writeHead(200, withSecurityHeaders({
    "Content-Type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Cache-Control": pathname.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "public, max-age=3600",
  }));
  createReadStream(filePath).pipe(res);
  return true;
}

const server = createServer((req, res) => {
  if (serveStatic(req, res)) return;
  const upstreamReq = proxyRequest({
    hostname: "127.0.0.1",
    port: upstreamPort,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${upstreamPort}` },
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode ?? 502, withSecurityHeaders(upstreamRes.headers));
    upstreamRes.pipe(res);
  });
  upstreamReq.on("error", () => {
    if (!res.headersSent) res.writeHead(502, withSecurityHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
    res.end("Map server is warming up");
  });
  req.pipe(upstreamReq);
});

server.listen(publicPort, "127.0.0.1", () => {
  console.log(`[stormhaven-map] asset proxy listening on http://127.0.0.1:${publicPort}`);
});

function shutdown() {
  server.close();
  upstream.kill();
  setTimeout(() => process.exit(0), 250);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
upstream.on("exit", (code) => { if (code && code !== 0) process.exit(code); });
