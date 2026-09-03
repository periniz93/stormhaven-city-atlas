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
  assert.match(
    response.headers.get("content-security-policy") ?? "",
    /frame-ancestors https:\/\/stormhaven\.online http:\/\/localhost:30000 http:\/\/127\.0\.0\.1:30000/,
  );
  assert.equal(response.headers.get("x-frame-options"), null);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");

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

  assert.match(mapSource, /bakeStaticGroup/);
  assert.match(mapSource, /vertexCount>65535\?new Uint32Array/);
  assert.match(mapSource, /sharedSource/);
  assert.doesNotMatch(mapSource, /mergeGeometries/);
  assert.match(mapSource, /InstancedMesh/);
  assert.match(mapSource, /ShaderMaterial/);
  assert.match(mapSource, /deviceMemory/);
  assert.match(mapSource, /renderer\.shadowMap\.enabled=!constrained/);
  assert.match(mapSource, /fps<48/);
  assert.match(mapSource, /document\.hidden/);
  assert.match(mapSource, /labelRenders/);
  assert.match(mapSource, /Steamer’s Row/);
  assert.match(mapSource, /Zaps Clinic \/ Old Baths/);
  assert.match(mapSource, /Old Rope Works/);
  assert.match(mapSource, /Ygnlov House/);
  assert.match(mapSource, /CITY_OUTLINE/);
  assert.match(mapSource, /addMapFabric/);
  assert.match(mapSource, /URBAN_MASSES/);
  assert.match(mapSource, /addCanalRibbon/);
  assert.match(mapSource, /addNeighborhoodLayer/);
  assert.match(mapSource, /NEIGHBORHOOD_PLANS/);
  assert.match(mapSource, /ensureNeighborhood/);
  assert.match(mapSource, /coarseFabric\.forEach/);
  assert.match(mapSource, /The lens follows the ward's real circulation/);
  assert.match(mapSource, /streetLayers/);
  assert.match(mapSource, /infrastructure\.visible=false/);
  assert.match(mapSource, /setRoutes\]=useState\(false\)/);
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css, /backdrop-filter:none/);
  assert.match(css, /\.detail-panel\.is-atlas/);
});

test("places the Spillway west and the Whispers beneath right-hand Mid-City", async () => {
  const [mapSource, architectureSource] = await Promise.all([
    readFile(new URL("../app/stormhaven-map.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/stormhaven-architecture.ts", import.meta.url), "utf8"),
  ]);
  const districtAnchor = (name) => {
    const match = mapSource.match(new RegExp(`name:"${name}"[^\\n]*?x:([\\d.]+),y:([\\d.]+),z:([\\d.]+)`));
    assert.ok(match, `Missing ${name} district anchor`);
    return match.slice(1).map(Number);
  };
  const spillway = districtAnchor("The Spillway");
  const foggyBottoms = districtAnchor("Foggy Bottoms");
  const whispers = districtAnchor("The Whispers");

  assert.deepEqual(spillway, [53, 12, 5]);
  assert.deepEqual(foggyBottoms, [78, 4, 4]);
  assert.deepEqual(whispers, [59, 21, 15]);
  assert.ok(spillway[0] < whispers[0]);
  assert.ok(whispers[0] > 50 && whispers[1] > spillway[1] && whispers[1] < 27);
  assert.ok(Math.hypot(spillway[0] - foggyBottoms[0], spillway[1] - foggyBottoms[1]) >= 25);
  assert.match(mapSource, /const FOGGY_MARSH_OUTLINE/);
  assert.match(mapSource, /const spill=cityPos\(53,12,5\)/);
  assert.match(mapSource, /name:"Three Sluices",x:54\.8,y:14/);
  assert.match(mapSource, /name:"Murk Street",x:58,y:21,z:15/);
  assert.match(mapSource, /\[\[53,19\],\[56,20\],\[59,21\],\[62,20\],\[66,22\]\]/);
  assert.match(mapSource, /DISTRICTS\[9\][^\n]*lowerArchitecture,\["ruin","ruin","sinkhouse","ruin","ruin","stilt-house","ruin","ruin"\],\.58,\{lean:\.22,openCore:2\.35,voidChance:\.5\}/);
  assert.match(mapSource, /spacing:2\.05,voidChance:\.55/);
  assert.match(mapSource, /marshFog\.name="foggy-bottoms-fog"/);
  assert.match(mapSource, /DETAIL_FOG_PLANE/);
  assert.match(mapSource, /radial=pow\(max\(0\.0,1\.0-length\(p\)\*1\.92\),2\.0\)/);
  assert.match(mapSource, /\[\[70,7\],\[73,5\.9\],\[76,5\.1\],\[80,4\.6\],\[84,3\.7\]\]/);
  assert.match(architectureSource, /const slab=box\(g/);
  assert.match(mapSource, /const wreck=cityPos\(74\.2,2\.7,2\)/);
  assert.match(mapSource, /x=80-t\*4\.5,y=28-t\*14/);
  assert.match(mapSource, /name:"Vane’s Safehouse",x:40\.8,y:11\.3,z:11/);
  assert.match(mapSource, /name:"Steamer’s Row",x:30,y:25\.2,z:26/);
});

test("defines clickable district and elevation-band area focus", async () => {
  const [mapSource, css] = await Promise.all([
    readFile(new URL("../app/stormhaven-map.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(mapSource, /const DISTRICT_AREAS:Record<string,AreaPolygon\[\]>/);
  for (const district of ["The Sea Ward", "The Spillway", "Radiance", "The Beacon", "The Whispers", "Summit", "The Grove", "The Eye", "Raincatcher’s Ward", "Foggy Bottoms"]) {
    assert.match(mapSource, new RegExp(`(?:name:"${district}"|["]${district}["]:\\[\\[)`));
  }
  assert.match(mapSource, /districts:\["The Sea Ward","The Spillway","The Whispers","Foggy Bottoms"\]/);
  assert.match(mapSource, /districts:\["Radiance","The Beacon","Raincatcher’s Ward"\]/);
  assert.match(mapSource, /districts:\["Summit","The Grove","The Eye"\]/);
  assert.match(mapSource, /function buildAreaGeometry/);
  assert.match(mapSource, /selectionArea\.name="selected-map-area"/);
  assert.match(mapSource, /blending:THREE\.AdditiveBlending/);
  assert.match(mapSource, /renderer\.toneMappingExposure=baseExposure\*\(active\?\.84:1\)/);
  assert.match(mapSource, /raycaster\.intersectObjects\(areaTargets,false\)/);
  assert.match(mapSource, /focusBand:\(band:CityBand\)=>void/);
  assert.match(css, /\.city-band-legend button/);
  assert.match(css, /\.band-label[^}]*pointer-events:auto/);
});
