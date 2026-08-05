import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Stormhaven atlas shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Stormhaven .* The City Beneath the Storm<\/title>/i);
  assert.match(html, /Charting the storm/);
  assert.match(html, /Interactive three-dimensional map of Stormhaven/);
  assert.match(html, /Atlas view/);
  assert.match(html, /Neighborhood lens/);
  assert.match(html, /Steamer’s Row/);
  assert.match(html, /Back Canal/);
  assert.match(html, /Mapped landmarks .* gold marks the party trail/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview/i);
});

test("keeps high detail compatible with constrained mobile hardware", async () => {
  const [mapSource, css] = await Promise.all([
    readFile(new URL("../app/stormhaven-map.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(mapSource, /mergeGeometries/);
  assert.match(mapSource, /bakeStaticGroup/);
  assert.match(mapSource, /InstancedMesh/);
  assert.match(mapSource, /ShaderMaterial/);
  assert.match(mapSource, /deviceMemory/);
  assert.match(mapSource, /renderer\.shadowMap\.enabled=!constrained/);
  assert.match(mapSource, /fps<48/);
  assert.match(mapSource, /document\.hidden/);
  assert.match(mapSource, /Steamer’s Row/);
  assert.match(mapSource, /Zaps Clinic \/ Old Baths/);
  assert.match(mapSource, /Old Rope Works/);
  assert.match(mapSource, /Ygnlov House/);
  assert.match(mapSource, /CITY_OUTLINE/);
  assert.match(mapSource, /addMapFabric/);
  assert.match(mapSource, /URBAN_MASSES/);
  assert.match(mapSource, /addCanalRibbon/);
  assert.match(mapSource, /addNeighborhoodLayer/);
  assert.match(mapSource, /streetLayers/);
  assert.match(mapSource, /infrastructure\.visible=false/);
  assert.match(mapSource, /setRoutes\]=useState\(false\)/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /backdrop-filter:none/);
  assert.match(css, /\.detail-panel\.is-atlas/);
});
