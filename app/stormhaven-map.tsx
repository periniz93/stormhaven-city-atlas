"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createStormhavenArchitectureKit, type ArchitectureKind, type StormhavenArchitectureKit } from "./stormhaven-architecture";

type District = { name:string; short:string; x:number; y:number; z:number; color:string; kind:string; population:string; description:string };

const DISTRICTS: District[] = [
  { name:"The Sea Ward",short:"Sea Ward",x:11,y:8,z:2,color:"#6ea6b2",kind:"Harbor · Lower city",population:"10,500",description:"Storm-battered quays, stilt warehouses and working canals crowd the western shoreline. The city arrives here wet, indebted, and looking for work." },
  { name:"The Spillway",short:"Spillway",x:38,y:5,z:3,color:"#a96d46",kind:"Drainage basin · Lower city",population:"2,500",description:"Three sluices carry the upper city’s poison into one low basin. Rust, Arc runoff and cheap lives settle together." },
  { name:"Radiance",short:"Radiance",x:22,y:22,z:28,color:"#d98965",kind:"Prism ward · Middle city",population:"6,000",description:"Mirror canyons catch the Beacon’s spill-light and sell it back to the city. Beautiful from a distance. Blinding up close." },
  { name:"The Beacon",short:"Beacon",x:25,y:30,z:30,color:"#75eaff",kind:"Arc works · Western anchor",population:"2,500",description:"A 170-metre stormglass and brass tower cages the lightning. Around its foot, the GlassWorks furnaces never go dark." },
  { name:"The Whispers",short:"Whispers",x:48,y:15,z:15,color:"#8a7cab",kind:"Fog depression · Lower city",population:"6,500",description:"Fog pools between cramped platforms and gives old conversations back at the wrong time. Every door has another exit." },
  { name:"Summit",short:"Summit",x:60,y:54,z:45,color:"#d8b978",kind:"Noble ridge · Upper city",population:"4,000",description:"Dry bridges stitch the Great Houses together above the rain. Their towers are clean because the cost runs downhill." },
  { name:"The Grove",short:"Grove",x:44,y:49,z:42,color:"#76a56e",kind:"Choir terraces · Upper city",population:"1,500",description:"Public gardens rise through Cantor terraces to a restricted canopy level with the bases of Summit’s towers." },
  { name:"The Eye",short:"The Eye",x:84,y:33,z:30,color:"#9dc2c9",kind:"Synod precinct · Upper city edge",population:"4,500",description:"A stormglass cathedral still remembers when lightning chose it. Copper prayer-lines hum beneath a severe public square." },
  { name:"Raincatcher’s Ward",short:"Raincatcher",x:76,y:20,z:38,color:"#58b5b2",kind:"Water terraces · Middle city",population:"3,500",description:"Fifteen gardens step from z48 to z25, aging stormwater into clarity while every lower basin inherits what came before." },
  { name:"Foggy Bottoms",short:"Foggy Bottoms",x:86,y:7,z:7,color:"#718467",kind:"Swamp edge · Lower city",population:"3,500",description:"Platforms sag into the eastern marsh. Pre-Sundering stone shows through the mud wherever the district has not sunk yet." },
];

type CityBand = { name:string; color:string; description:string };
const CITY_BANDS:CityBand[] = [
  { name:"Lower City",color:"#a86d4b",description:"Sea level to the first terrace: docks, fog, canals and runoff." },
  { name:"Mid-City",color:"#5a9a9b",description:"The working terraces: trade, water, Arc craft and the spine road." },
  { name:"Upper City",color:"#b79a68",description:"The ridge and canopy: dry bridges, estates and choir terraces." },
];

type LocalSite={name:string;x:number;y:number;z?:number;visited?:boolean;note?:string};
const LOCAL_SITES:Record<string,LocalSite[]>={
  "The Sea Ward":[{name:"Whale-Jaw Arch",x:10,y:10,visited:true},{name:"Beacon’s Echo",x:13,y:6,z:12},{name:"Lantern Fishmarket",x:8.5,y:7},{name:"Leviathan Quays",x:12,y:4,visited:true}],
  "The Spillway":[{name:"Vane’s Safehouse",x:39.4,y:7.6,z:4,visited:true},{name:"The Drain",x:37,y:6,visited:true},{name:"Three Sluices",x:40,y:7},{name:"Rust Market",x:35,y:4},{name:"Gutter Gate",x:41,y:3}],
  "Radiance":[{name:"Luminox Hall",x:21,y:24},{name:"Mirror Market",x:24,y:22},{name:"Dark Cells",x:20,y:20},{name:"Glarebound Plaza",x:23,y:19}],
  "The Beacon":[{name:"GlassWorks",x:23,y:29,z:30,visited:true},{name:"Warmth Hall",x:27.4,y:29.2,z:29,visited:true},{name:"Health Wing",x:28.7,y:28.6,z:28,visited:true},{name:"Steamer’s Row",x:30,y:25.2,z:26,visited:true,note:"Lower Glassworks · Back Canal"},{name:"Back Canal",x:31.4,y:23.5,z:22,note:"Shallow working canal parallel to Steamer’s Row"},{name:"Zaps Clinic / Old Baths",x:31.1,y:25.4,z:26,visited:true},{name:"Old Rope Works",x:32.8,y:24.4,z:24,visited:true},{name:"Ygnlov House",x:28.1,y:24.5,z:25,visited:true},{name:"Della’s",x:28.8,y:26.1,z:26,visited:true},{name:"Workers’ Hall",x:30,y:26.4,z:26},{name:"Glassworks Crematorium",x:34,y:27.2,z:27,visited:true},{name:"Guild Mouth",x:24,y:27,z:30,visited:true},{name:"Furnace Belt",x:27,y:31,z:31},{name:"Night Galleries",x:25,y:33,z:31}],
  "The Whispers":[{name:"Murk Street",x:47,y:15,z:15},{name:"The Red Veil",x:51,y:17,z:16},{name:"Drowned Candle",x:45,y:13,z:14},{name:"Moth & Shroud",x:50,y:12,z:15,visited:true}],
  "Summit":[{name:"Ticking Palace",x:60.4,y:54.1,z:46,visited:true},{name:"Prism Hall",x:59,y:52,z:45},{name:"Conclave Tower",x:61,y:55,z:45},{name:"Skytouched Observatory",x:56,y:55,z:45},{name:"First-Blood Balcony",x:64,y:52,z:45}],
  "The Grove":[{name:"The Synapse",x:44,y:51,z:45},{name:"Cantor Terraces",x:41,y:49,z:41},{name:"Listening Walk",x:47,y:46,z:38},{name:"Restricted Canopy",x:44,y:53,z:45}],
  "The Eye":[{name:"Grand Cathedral",x:84,y:33,z:30},{name:"Zephyr’s Pavilion",x:86,y:35,z:31},{name:"Brawl Courts",x:81,y:32,z:30},{name:"Shrine Ring",x:85,y:30,z:29}],
  "Raincatcher’s Ward":[{name:"Jade Terrace",x:78,y:24,z:42},{name:"Silverstream",x:76,y:21,z:37},{name:"Clearwater House",x:74,y:18,z:32},{name:"Sixty-Day Basin",x:72,y:16,z:28}],
  "Foggy Bottoms":[{name:"Sweet Susie Wreck",x:82.2,y:5.7,z:2,visited:true},{name:"Slanted Market",x:85,y:9,z:8},{name:"Mirefoot Ruins",x:89,y:7,z:4},{name:"Blackwater Complex",x:83,y:6,z:7},{name:"Bog-Runner Mooring",x:90,y:4,z:2}],
};

const STORY_LABELS=[
  {name:"Steamer’s Row",district:"The Beacon",x:30,y:25.2,z:26},
];

const DISTRICT_FOCUS_SCALE:Record<string,[number,number]>={
  "The Sea Ward":[1.55,1.05],"The Spillway":[1.2,.82],Radiance:[1.22,.92],"The Beacon":[1.25,1],
  "The Whispers":[1.55,1.02],Summit:[1.55,.88],"The Grove":[1.34,.98],"The Eye":[1.2,.95],
  "Raincatcher’s Ward":[1.45,1.05],"Foggy Bottoms":[1.5,.95],
};

const S=.78, V=.12;
function terrainHeight(x:number,y:number){
  let h=4+40*Math.pow(Math.max(0,y)/58,1.13);
  h+=3.6*Math.exp(-((x-60)**2)/520-((y-52)**2)/150);
  h+=3.5*Math.exp(-((x-44)**2)/95-((y-49)**2)/70);
  h-=15*Math.exp(-((x-7)**2)/180-((y-8)**2)/170);
  h-=13*Math.exp(-((x-96)**2)/150-((y-8)**2)/170);
  h-=5.5*Math.exp(-((x-38)**2)/85-((y-5)**2)/40);
  h-=1.8*Math.exp(-((x-48)**2)/90-((y-15)**2)/65);
  h+=6*Math.exp(-((x-25)**2)/125-((y-30)**2)/90);
  h+=5*Math.exp(-((x-84)**2)/95-((y-33)**2)/80);
  return Math.max(-1,h);
}
function cityPos(x:number,y:number,elevation=terrainHeight(x,y)){ return new THREE.Vector3((x-50)*S,elevation*V,(30-y)*S); }
function seeded(seed:number){ let t=seed>>>0; return()=>{t+=0x6d2b79f5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}; }

function bakeStaticGroup(group:THREE.Group,name:string,castShadow=true){
  group.updateMatrixWorld(true);
  const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>(),source:THREE.Mesh[]=[];
  group.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||Array.isArray(object.material))return;
    const geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);
    const list=buckets.get(object.material)??[];list.push(geometry);buckets.set(object.material,list);source.push(object);
  });
  const baked:THREE.Mesh[]=[];
  buckets.forEach((geometries,material)=>{
    const geometry=mergeGeometries(geometries,false);geometries.forEach(item=>item.dispose());
    if(!geometry)return;
    geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.name=`${name}-${baked.length}`;mesh.castShadow=castShadow;mesh.receiveShadow=true;baked.push(mesh);
  });
  source.forEach(mesh=>mesh.geometry.dispose());group.clear();group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.set(1,1,1);group.add(...baked);
  return baked.length;
}

function addStreet(group:THREE.Group,points:Array<[number,number]>,width:number,material:THREE.Material,lift=.07){
  for(let i=0;i<points.length-1;i++){
    const [ax,ay]=points[i],[bx,by]=points[i+1],a=cityPos(ax,ay),b=cityPos(bx,by);
    a.y+=lift;b.y+=lift;
    const length=a.distanceTo(b),street=new THREE.Mesh(new THREE.BoxGeometry(width,.07,length),material);
    street.position.copy(a).lerp(b,.5);street.lookAt(b);street.receiveShadow=true;group.add(street);
  }
}

function addRingStreet(group:THREE.Group,cx:number,cy:number,rx:number,ry:number,width:number,material:THREE.Material,segments=28){
  const points:Array<[number,number]>=[];
  for(let i=0;i<=segments;i++){const angle=i/segments*Math.PI*2;points.push([cx+Math.cos(angle)*rx,cy+Math.sin(angle)*ry])}
  addStreet(group,points,width,material);
}

function addStairs(group:THREE.Group,from:[number,number,number],to:[number,number,number],count:number,width:number,material:THREE.Material){
  const a=cityPos(...from),b=cityPos(...to),direction=b.clone().sub(a),run=Math.hypot(direction.x,direction.z),stepRun=run/count;
  for(let i=0;i<count;i++){
    const t=(i+.5)/count,p=a.clone().lerp(b,t),step=new THREE.Mesh(new THREE.BoxGeometry(width,.1,stepRun+.035),material);
    step.position.copy(p);step.position.y-=.03;step.rotation.y=Math.atan2(direction.x,direction.z);step.receiveShadow=true;group.add(step);
  }
}

function addPlaza(group:THREE.Group,x:number,y:number,radius:number,material:THREE.Material,elevation?:number){
  const p=cityPos(x,y,elevation),plaza=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.1,32),material);plaza.position.set(p.x,p.y+.04,p.z);plaza.receiveShadow=true;group.add(plaza);
}

function addRetainingWall(group:THREE.Group,points:Array<[number,number]>,height:number,material:THREE.Material){
  for(let i=0;i<points.length-1;i++){
    const [ax,ay]=points[i],[bx,by]=points[i+1],a=cityPos(ax,ay),b=cityPos(bx,by),length=Math.hypot(b.x-a.x,b.z-a.z),wall=new THREE.Mesh(new THREE.BoxGeometry(.22,height,length),material);
    wall.position.copy(a).lerp(b,.5);wall.position.y-=height*.46;wall.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);wall.castShadow=true;wall.receiveShadow=true;group.add(wall);
  }
}

function addMarketStalls(group:THREE.Group,cx:number,cy:number,count:number,spreadX:number,spreadY:number,seed:number,wood:THREE.Material,canvas:THREE.Material){
  const random=seeded(seed);
  for(let i=0;i<count;i++){
    const x=cx+(random()-.5)*spreadX,y=cy+(random()-.5)*spreadY,p=cityPos(x,y),stall=new THREE.Mesh(new THREE.BoxGeometry(.34,.22,.24),wood),awning=new THREE.Mesh(new THREE.BoxGeometry(.42,.035,.32),canvas);
    stall.position.set(p.x,p.y+.13,p.z);awning.position.set(p.x,p.y+.46,p.z);awning.rotation.z=(random()-.5)*.12;group.add(stall,awning);
  }
}

function addBridge(group:THREE.Group,x:number,y:number,elevation:number,width:number,length:number,rotation:number,material:THREE.Material){
  const p=cityPos(x,y,elevation),deck=new THREE.Mesh(new THREE.BoxGeometry(width,.14,length),material);deck.position.set(p.x,p.y+.2,p.z);deck.rotation.y=rotation;deck.castShadow=true;group.add(deck);
  for(const side of[-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.04,.26,length),material);rail.position.set(p.x+Math.cos(rotation)*width*.44*side,p.y+.38,p.z-Math.sin(rotation)*width*.44*side);rail.rotation.y=rotation;group.add(rail)}
}

function addLamp(group:THREE.Group,x:number,y:number,postMaterial:THREE.Material,glowMaterial:THREE.Material,height=.62){
  const p=cityPos(x,y),post=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,height,6),postMaterial),lamp=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),glowMaterial);post.position.set(p.x,p.y+height/2,p.z);lamp.position.set(p.x,p.y+height+.03,p.z);group.add(post,lamp);
}

function addUrbanGrid(group:THREE.Group,district:District,columns:number,rows:number,spanX:number,spanY:number,seed:number,kit:StormhavenArchitectureKit,kinds:ArchitectureKind[],heightScale:number,details:{lean?:number,openCore?:number}={}){
  const random=seeded(seed),sx=spanX/(columns-1),sy=spanY/(rows-1);
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    const localX=-spanX/2+column*sx,localY=-spanY/2+row*sy;
    if(Math.abs(localX)<sx*.58||Math.abs(localY)<sy*.54)continue;
    if(details.openCore&&Math.hypot(localX,localY)<details.openCore)continue;
    if((localX/(spanX*.54))**2+(localY/(spanY*.55))**2>1)continue;
    const x=district.x+localX+(random()-.5)*sx*.32,y=district.y+localY+(random()-.5)*sy*.28;
    if(!pointInPolygon(x,y,CITY_OUTLINE)&&district.name!=="The Spillway"&&district.name!=="The Sea Ward")continue;
    const w=sx*S*(.54+random()*.27),d=sy*S*(.54+random()*.27),h=(.72+random()*1.62)*heightScale,kind=kinds[Math.floor(random()*kinds.length)],building=kit.create(kind,{width:w,depth:d,height:h,seed:seed+row*97+column*13}),p=cityPos(x,y);
    building.position.copy(p);building.rotation.y=(random()-.5)*.2;if(details.lean)building.rotation.z+=(random()-.5)*details.lean;group.add(building);
  }
}
function addCurve(group:THREE.Group,points:Array<[number,number,number]>,color:number,width:number,opacity=1){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>cityPos(x,y,z)));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*9),width,5,false),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity}));group.add(tube);return tube;
}
function addMapPatch(group:THREE.Group,points:Array<[number,number]>,material:THREE.Material,lift=.16){
  const vertices:number[]=[],indices:number[]=[];
  points.forEach(([x,y])=>{const p=cityPos(x,y,terrainHeight(x,y));vertices.push(p.x,p.y+lift,p.z)});
  for(let i=1;i<points.length-1;i++)indices.push(0,i+1,i);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=-3;mesh.frustumCulled=false;group.add(mesh);return mesh;
}
function addFlatPatch(group:THREE.Group,points:Array<[number,number]>,material:THREE.Material,elevation=.12){
  const shape=new THREE.Shape();points.forEach(([x,y],index)=>{const px=(x-50)*S,pz=(30-y)*S;if(index===0)shape.moveTo(px,-pz);else shape.lineTo(px,-pz)});shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape),mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=elevation*V;mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function addContourLine(group:THREE.Group,points:Array<[number,number]>,color:number,width=.035,opacity=.42,lift=.24){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y])=>{const p=cityPos(x,y,terrainHeight(x,y));p.y+=lift;return p}));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*8),width,4,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));tube.renderOrder=-2;group.add(tube);return tube;
}
const CITY_OUTLINE:Array<[number,number]>=[
  [2,2],[3,14],[7,29],[11,43],[20,53],[34,59],[51,61],[68,58],[82,51],[93,41],[98,28],[98,14],[94,4],
  [85,0],[76,3],[70,8],[64,11],[58,13],[51,14],[45,13],[39,12],[34,13],[29,13],[24,11],[20,7],[15,3],[9,0],
];
function pointInPolygon(x:number,y:number,polygon:Array<[number,number]>){
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const [xi,yi]=polygon[i],[xj,yj]=polygon[j];
    if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
}
function buildTerrain(){
  const geometry=new THREE.BufferGeometry(),vertices:number[]=[],colors:number[]=[],indices:number[]=[],nx=92,ny=58,color=new THREE.Color();
  const isLand=(x:number,y:number)=>pointInPolygon(x,y,CITY_OUTLINE);
  for(let iy=0;iy<ny;iy++){const y=iy/(ny-1)*62-1;for(let ix=0;ix<nx;ix++){const x=ix/(nx-1)*102-1,h=terrainHeight(x,y),p=cityPos(x,y,h);vertices.push(p.x,p.y,p.z);color.set(h<8?"#36504d":h<22?"#45564f":h<38?"#595b52":"#686457");const n=(Math.sin(x*2.13+y*.71)+1)*.018-.012;colors.push(color.r+n,color.g+n,color.b+n)}}
  for(let iy=0;iy<ny-1;iy++)for(let ix=0;ix<nx-1;ix++){const a=iy*nx+ix,b=a+1,c=a+nx,d=c+1,x=(ix+.5)/(nx-1)*102-1,y=(iy+.5)/(ny-1)*62-1;if(isLand(x,y))indices.push(a,c,b,b,c,d)}
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.94,metalness:.025,flatShading:true}));mesh.receiveShadow=true;return mesh;
}

function createCity(selectDistrict:(name:string,site?:LocalSite)=>void,mobileGrade=false){
  const city=new THREE.Group(),hitTargets:THREE.Object3D[]=[],labelLayer=new THREE.Group(),detailLayers=new Map<string,THREE.Group>();
  const stone=new THREE.MeshStandardMaterial({color:0x687071,roughness:.86,metalness:.08}),darkStone=new THREE.MeshStandardMaterial({color:0x394245,roughness:.95}),slate=new THREE.MeshStandardMaterial({color:0x46545b,roughness:.82,metalness:.06}),soot=new THREE.MeshStandardMaterial({color:0x29363a,roughness:.88,metalness:.16}),copper=new THREE.MeshStandardMaterial({color:0x9b6847,roughness:.62,metalness:.58}),plaster=new THREE.MeshStandardMaterial({color:0x969087,roughness:.92}),wetWood=new THREE.MeshStandardMaterial({color:0x514037,roughness:.85}),glass=new THREE.MeshPhysicalMaterial({color:0x76e8f2,emissive:0x1e7382,emissiveIntensity:2.7,transparent:true,opacity:.82,roughness:.14,metalness:.2}),water=new THREE.MeshPhysicalMaterial({color:0x1b6671,emissive:0x0c3640,emissiveIntensity:.48,transparent:true,opacity:.9,roughness:.12,metalness:.15}),garden=new THREE.MeshStandardMaterial({color:0x526e4f,roughness:.95});
  city.add(buildTerrain());
  const cobble=new THREE.MeshStandardMaterial({color:0x303d3f,roughness:.72,metalness:.15}),paleStone=new THREE.MeshStandardMaterial({color:0x85857e,roughness:.9}),arcLamp=new THREE.MeshBasicMaterial({color:0x8eefff}),gasLamp=new THREE.MeshBasicMaterial({color:0xf0b265}),redCanvas=new THREE.MeshStandardMaterial({color:0x8b5341,roughness:.82}),tealCanvas=new THREE.MeshStandardMaterial({color:0x41787b,roughness:.82});
  const bandLower=new THREE.MeshBasicMaterial({color:0xa86d4b,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}),bandMid=new THREE.MeshBasicMaterial({color:0x5a9a9b,transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide}),bandUpper=new THREE.MeshBasicMaterial({color:0xb79a68,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide});
  const architecture=createStormhavenArchitectureKit({stone,darkStone,slate,soot,copper,plaster,wetWood,glass,garden,window:arcLamp,warmWindow:gasLamp,pipe:copper});
  const ocean=new THREE.Mesh(new THREE.CircleGeometry(82,96),new THREE.MeshPhysicalMaterial({color:mobileGrade?0x123943:0x0b2a33,emissive:0x07151a,emissiveIntensity:.38,roughness:.2,metalness:.25,transparent:true,opacity:.97}));ocean.rotation.x=-Math.PI/2;ocean.position.y=-.16;ocean.receiveShadow=true;city.add(ocean);
  const harborWater=new THREE.MeshPhysicalMaterial({color:mobileGrade?0x16515b:0x103d48,emissive:0x08232a,emissiveIntensity:.36,roughness:.18,metalness:.22,transparent:true,opacity:.92});
  addFlatPatch(city,[[16,-1],[18,4],[20,7],[24,11],[29,13],[34,13],[39,12],[45,13],[51,14],[58,13],[64,11],[70,8],[76,3],[78,-1]],harborWater,.18);
  const context=new THREE.Group();context.name="city-context";city.add(context);
  // Broad elevation bands keep the 3D districts legible as one city: lower docks and
  // basins, the working middle terraces, then the dry upper ridge and canopy.
  addMapPatch(context,[[5,1],[94,1],[94,12],[87,16],[73,20],[56,19],[39,18],[24,16],[10,13],[5,10]],bandLower);
  addMapPatch(context,[[15,15],[87,18],[87,31],[80,36],[67,37],[53,33],[39,29],[22,29],[15,23]],bandMid);
  addMapPatch(context,[[30,31],[81,34],[80,47],[70,53],[54,57],[39,49],[31,40]],bandUpper);
  // Map-like contour seams echo the hand-painted source without flattening the 3D terrain.
  addContourLine(context,[[12,8],[20,5],[30,6],[40,8],[50,10],[60,11],[70,12],[80,11],[88,9],[92,6]],0x758b83,.025,.35);
  addContourLine(context,[[14,12],[25,10],[35,12],[45,14],[55,16],[62,17],[70,17],[78,16],[84,14],[88,11]],0x7d948a,.028,.38);
  addContourLine(context,[[18,18],[28,16],[38,18],[48,22],[58,23],[68,24],[78,22],[82,20]],0x94a69b,.032,.42);
  addContourLine(context,[[20,24],[30,22],[40,24],[50,26],[62,30],[70,32],[78,32],[86,28]],0xb2b4a0,.035,.44);
  addContourLine(context,[[30,32],[40,34],[50,38],[58,46],[64,50],[70,50],[76,46]],0xc2b796,.038,.46);
  // Working-water lines run between the bands and make the low city read as connected ground.
  addCurve(context,[[47,2,0],[47,7,1],[44,12,6],[40,17,13],[35,22,21],[32,28,27]],0x2f8f9e,.44,.78);
  addCurve(context,[[27,23.7,22],[30,24.1,23],[34,23.1,20],[38,21,16],[42,18,13]],0x3e9fac,.26,.76);
  addCurve(context,[[80,30,47],[81,25,39],[82,20,31],[83,15,22],[84,10,12],[86,4,2]],0x4bb1b9,.38,.82);
  addCurve(context,[[46,15,15],[40,14,12],[32,12,8],[24,10,4],[16,8,2],[10,6,0]],0x247f8d,.11,.48);
  addCurve(context,[[70,14,25],[64,14,22],[58,14,18],[52,14,16],[46,14,15]],0x3da1aa,.085,.46);
  addCurve(context,[[82,28,18],[72,26,16],[62,24,14],[52,22,12],[42,20,10],[32,16,6]],0x3b9ba6,.075,.44);
  addCurve(context,[[40,8,6],[38,5,3],[32,5,2],[24,6,1],[18,6,1]],0x247f8d,.09,.4);
  const wards=new THREE.Group(),streets=new THREE.Group();city.add(wards,streets);
  addUrbanGrid(wards,DISTRICTS[0],14,9,14,9,11,architecture,["canal-house","warehouse","stilt-house"],.76,{openCore:2.1});
  addUrbanGrid(wards,DISTRICTS[1],10,7,10,6,22,architecture,["tenement","warehouse","glassworks"],.7,{openCore:2.35});
  addUrbanGrid(wards,DISTRICTS[2],12,9,11,8,33,architecture,["townhouse","canal-house","glassworks"],.92,{openCore:1.8});
  addUrbanGrid(wards,DISTRICTS[3],12,10,11,9,44,architecture,["glassworks","warehouse","tenement"],1.04,{openCore:3.1});
  addUrbanGrid(wards,DISTRICTS[4],15,11,15,10,55,architecture,["tenement","canal-house","townhouse"],.8,{lean:.045,openCore:1.3});
  addUrbanGrid(wards,DISTRICTS[5],12,9,14,8,66,architecture,["tower-house","townhouse","bathhouse"],1.45,{openCore:2.3});
  addUrbanGrid(wards,DISTRICTS[6],8,7,11,8,77,architecture,["greenhouse","townhouse","shrine"],.88,{openCore:3.4});
  addUrbanGrid(wards,DISTRICTS[7],11,9,10,8,88,architecture,["shrine","townhouse","tower-house"],1.02,{openCore:3.1});
  addUrbanGrid(wards,DISTRICTS[8],12,10,13,11,99,architecture,["bathhouse","greenhouse","canal-house"],.76,{openCore:3.2});
  addUrbanGrid(wards,DISTRICTS[9],13,9,14,8,110,architecture,["stilt-house","ruin","canal-house"],.7,{lean:.1,openCore:1.8});
  // Low-density transition blocks keep the spaces between named wards believable.
  addUrbanGrid(wards,{name:"Lower City fabric",short:"Lower City",x:60,y:11,z:12,color:"#a86d4b",kind:"",population:"",description:""},23,7,43,10,121,architecture,["tenement","canal-house","warehouse"],.5,{openCore:1.4});
  addUrbanGrid(wards,{name:"Mid-City fabric",short:"Mid-City",x:57,y:29,z:28,color:"#5a9a9b",kind:"",population:"",description:""},25,8,52,12,132,architecture,["tenement","townhouse","canal-house","glassworks"],.64,{openCore:1.7});
  addUrbanGrid(wards,{name:"Upper City fabric",short:"Upper City",x:55,y:43,z:40,color:"#b79a68",kind:"",population:"",description:""},19,7,40,10,143,architecture,["townhouse","shrine","greenhouse"],.68,{openCore:2.1});
  addUrbanGrid(wards,{name:"Western climb",short:"Western climb",x:30,y:37,z:34,color:"#b79a68",kind:"",population:"",description:""},10,8,13,14,154,architecture,["tenement","glassworks","townhouse"],.69,{openCore:1.1});
  addUrbanGrid(wards,{name:"Eastern climb",short:"Eastern climb",x:75,y:39,z:34,color:"#b79a68",kind:"",population:"",description:""},12,8,18,13,165,architecture,["townhouse","shrine","bathhouse"],.72,{openCore:1.4});

  // Steamer's Row: a compact, legible street scene beneath the Beacon. The road and
  // Back Canal run in parallel, with the old bathhouse and workers' blocks facing them.
  const rowRandom=seeded(50308);
  for(let i=0;i<12;i++){
    const t=i/11,x=26.1+t*8.4,y=25.25-t*.95,side=i%2===0?1:-1;
    const kind:ArchitectureKind=i===7?"bathhouse":i%3===0?"canal-house":"tenement";
    const building=architecture.create(kind,{width:.62+rowRandom()*.22,depth:.72+rowRandom()*.22,height:1.15+rowRandom()*.75,seed:1800+i});
    const p=cityPos(x,y+side*1.05,24.5+terrainHeight(x,y)*.07);building.position.copy(p);building.rotation.y=.11;wards.add(building);
  }
  const clinic=architecture.create("bathhouse",{width:1.45,depth:1.18,height:2.25,seed:1911});clinic.position.copy(cityPos(31.1,26.15,26));clinic.rotation.y=.1;wards.add(clinic);
  const ropeWorks=architecture.create("warehouse",{width:1.55,depth:1.05,height:1.75,seed:1912});ropeWorks.position.copy(cityPos(32.8,23.85,23));ropeWorks.rotation.y=.1;wards.add(ropeWorks);
  const ygnlovBlock=architecture.create("tenement",{width:1.05,depth:1.15,height:2.45,seed:1913});ygnlovBlock.position.copy(cityPos(28.1,23.9,24));ygnlovBlock.rotation.y=.1;wards.add(ygnlovBlock);
  const dellas=architecture.create("townhouse",{width:.92,depth:.9,height:1.65,seed:1914});dellas.position.copy(cityPos(28.8,26.45,26));dellas.rotation.y=.1;wards.add(dellas);
  const bottlingPlant=architecture.create("glassworks",{width:1.7,depth:1.4,height:2.7,seed:1901});bottlingPlant.position.copy(cityPos(35.1,27.1,27));wards.add(bottlingPlant);

  // Streets follow the painted map's terrace composition: an east-west civic spine,
  // compact lower-city canal blocks, radial anchors, and narrow climbing approaches.
  addStreet(streets,[[12,10],[18,17],[25,25],[25,30],[37,34],[50,39],[60,45],[72,40],[84,33]],.52,cobble);
  addStreet(streets,[[25,30],[34,37],[44,48],[52,50],[60,54]],.28,paleStone);
  addStreet(streets,[[44,49],[47,46],[51,44],[56,45]],.2,paleStone);
  addStreet(streets,[[20,24],[30,22],[42,20],[54,21],[66,24],[76,29],[84,33]],.38,cobble);
  addStreet(streets,[[13,8],[20,12],[29,14],[39,15],[48,15],[59,15],[70,16],[80,12],[88,8]],.32,cobble);
  addStreet(streets,[[18,11],[30,10],[42,11],[54,12],[67,14],[80,15],[89,12]],.18,cobble);
  addStreet(streets,[[22,17],[34,17],[46,18],[58,19],[70,21],[82,24]],.18,cobble);
  addRingStreet(streets,25,30,4.3,3.5,.32,cobble);addRingStreet(streets,25,30,6.2,5,.24,cobble);
  addRingStreet(streets,84,33,4.2,3.6,.42,paleStone);addRingStreet(streets,60,54,7,4.1,.3,paleStone);
  addRingStreet(streets,48,15,6.5,4.3,.22,cobble);addRingStreet(streets,38,5,4.4,2.7,.22,cobble);
  addStreet(streets,[[42,13],[45,14],[48,15],[51,14],[55,16]],.32,cobble); // Murk Street
  addStreet(streets,[[19,18],[21,21],[22,24],[25,26]],.3,paleStone);
  addStreet(streets,[[26,25.7],[28,25.5],[30,25.25],[32,25],[34.6,24.7]],.34,cobble,.13); // Steamer's Row
  addStreet(streets,[[26.2,27.4],[29,27.1],[32,26.8],[35,26.4]],.16,cobble,.12);
  addStreet(streets,[[81,31],[84,33],[88,37]],.5,paleStone);
  addStreet(streets,[[71,43],[74,45],[78,47]],.2,paleStone);
  addStreet(streets,[[83,9],[86,7],[91,5]],.2,wetWood,.16);
  addStreet(streets,[[7,9],[11,8],[15,9]],.3,wetWood,.15);
  addStairs(streets,[12,10,2],[25,25,28],34,.42,paleStone);
  addStairs(streets,[48,20,22],[59,50,45],46,.36,paleStone);
  addStairs(streets,[83,38,30],[60,52,45],38,.5,paleStone);
  addStairs(streets,[82,32,30],[80,28,48],22,.42,paleStone);
  addStairs(streets,[48,46,39],[44,51,44],12,.3,paleStone);
  addStairs(streets,[45,49,42],[60,54,45],24,.32,paleStone);
  addPlaza(streets,25,30,3.35,cobble,30);addPlaza(streets,84,33,3.3,paleStone,30);addPlaza(streets,60,54,2.8,paleStone,45);addPlaza(streets,48,15,1.45,cobble,15);
  for(let x=17;x<=83;x+=5.5)addLamp(streets,x,34+(x-25)*.075,copper,arcLamp,.72);
  for(let x=43;x<=54;x+=2.2)addLamp(streets,x,15,copper,gasLamp,.52);
  for(let i=0;i<14;i++){const angle=i/14*Math.PI*2;addLamp(streets,84+Math.cos(angle)*4.1,33+Math.sin(angle)*3.5,copper,gasLamp,.7)}
  addRetainingWall(streets,[[17,18],[22,22],[30,23],[40,24],[50,25],[62,27],[72,30],[82,30]],2.5,darkStone);
  addRetainingWall(streets,[[27,30],[38,33],[48,38],[56,44],[64,48],[72,46],[79,40]],1.75,stone);
  addRetainingWall(streets,[[33,9],[38,8],[44,10],[48,12],[52,11],[58,12]],1.15,darkStone);
  addRetainingWall(streets,[...CITY_OUTLINE,CITY_OUTLINE[0]],1.65,darkStone);
  addMarketStalls(streets,11,8,22,7,3,601,wetWood,redCanvas);
  addMarketStalls(streets,48,15,18,8,2.2,602,wetWood,tealCanvas);
  addMarketStalls(streets,84,36.2,12,5,1.2,603,wetWood,redCanvas);
  [[28.2,24.5],[30.4,24],[32.6,23.5]].forEach(([x,y])=>addBridge(streets,x,y,terrainHeight(x,y)-1.6,.52,1.15,.17,wetWood));
  // Secondary rings and cross-streets give every ward believable blocks at street lens.
  const laneSpecs:Array<[District,number,number]>=[
    [DISTRICTS[0],5.8,3.8],[DISTRICTS[1],4.2,2.4],[DISTRICTS[2],4.4,3.2],[DISTRICTS[3],5,4.1],[DISTRICTS[4],6.4,4.2],
    [DISTRICTS[5],6.2,3.5],[DISTRICTS[6],4.8,3.6],[DISTRICTS[7],4.4,3.6],[DISTRICTS[8],5.4,4.8],[DISTRICTS[9],5.8,3.2],
  ];
  laneSpecs.forEach(([district,rx,ry],index)=>{
    addRingStreet(streets,district.x,district.y,rx*.68,ry*.68,.105,index>4?paleStone:cobble,20);
    addStreet(streets,[[district.x-rx,district.y],[district.x+rx,district.y]],.095,index>4?paleStone:cobble,.1);
    addStreet(streets,[[district.x,district.y-ry],[district.x,district.y+ry]],.095,index>4?paleStone:cobble,.1);
  });
  const buildingDraws=bakeStaticGroup(wards,"city-fabric",!mobileGrade);
  const streetDraws=bakeStaticGroup(streets,"street-fabric",false);

  const beacon=new THREE.Group(),bp=cityPos(25,30,30);beacon.position.copy(bp);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.9,2.6,12),copper),spire=new THREE.Mesh(new THREE.CylinderGeometry(.3,1.5,17.2,8),glass),needle=new THREE.Mesh(new THREE.ConeGeometry(.34,4.1,7),glass);base.position.y=1.3;spire.position.y=11.1;needle.position.y=21.75;beacon.add(base,spire,needle);
  [5.6,10.2,14.8].forEach((height,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25-i*.2,.12,7,28),copper);ring.rotation.x=Math.PI/2;ring.position.y=height;beacon.add(ring)});
  const beaconLight=new THREE.PointLight(0x64ddff,55,34,1.8);beaconLight.position.y=14;beacon.add(beaconLight);city.add(beacon);

  const towers=[{x:56.5,y:53,top:95},{x:60,y:55,top:115},{x:63.4,y:52.2,top:105}],towerMeshes:THREE.Mesh[]=[];
  towers.forEach((tower,i)=>{const h=(tower.top-45)*V,p=cityPos(tower.x,tower.y,45),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.72,1.18,h,7),i===1?plaster:stone);mesh.position.set(p.x,p.y+h/2,p.z);mesh.castShadow=true;city.add(mesh);const cap=new THREE.Mesh(new THREE.ConeGeometry(.8,1.65,7),slate);cap.position.set(p.x,p.y+h+.8,p.z);city.add(cap);towerMeshes.push(mesh)});
  [[0,1],[1,2],[0,2]].forEach(([a,b],i)=>{const pa=towerMeshes[a].position.clone(),pb=towerMeshes[b].position.clone();pa.y=pb.y=cityPos(60,54,[60,70,80][i]).y;const mid=pa.clone().lerp(pb,.5),len=pa.distanceTo(pb),bridge=new THREE.Mesh(new THREE.BoxGeometry(.25,.18,len),copper);bridge.position.copy(mid);bridge.lookAt(pb);city.add(bridge)});

  const eye=new THREE.Group(),ep=cityPos(84,33,30);eye.position.copy(ep);const nave=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.5,2.2),plaster),transept=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.15,4.1),stone);nave.position.y=1.25;transept.position.y=1.1;eye.add(nave,transept);[[-1.45,-.75],[1.45,-.75],[-1.45,.75],[1.45,.75]].forEach(([x,z])=>{const sp=new THREE.Mesh(new THREE.ConeGeometry(.52,2.9,5),slate);sp.position.set(x,3.55,z);eye.add(sp)});city.add(eye);

  const grove=new THREE.Group(),groveRandom=seeded(7521);for(let i=0;i<92;i++){const x=44+(groveRandom()-.5)*13,y=49+(groveRandom()-.5)*10,p=cityPos(x,y,Math.min(45,terrainHeight(x,y))),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.7+groveRandom()*.5,5),wetWood),crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.38+groveRandom()*.38,1),garden);trunk.position.set(p.x,p.y+.45,p.z);crown.position.set(p.x,p.y+1+groveRandom()*.7,p.z);grove.add(trunk,crown)}bakeStaticGroup(grove,"grove",false);city.add(grove);
  for(let i=0;i<15;i++){const t=i/14,x=80-t*10,y=28-t*14,z=48-t*23,p=cityPos(x,y,z),terrace=new THREE.Mesh(new THREE.BoxGeometry(3.2+t*.8,.24,1.2),stone),pool=new THREE.Mesh(new THREE.BoxGeometry(2.55+t*.7,.08,.76),water);terrace.position.set(p.x,p.y,p.z);pool.position.set(p.x,p.y+.16,p.z);city.add(terrace,pool)}
  const radianceRandom=seeded(2202);for(let i=0;i<18;i++){const x=22+(radianceRandom()-.5)*8,y=22+(radianceRandom()-.5)*7,p=cityPos(x,y),prism=new THREE.Mesh(new THREE.OctahedronGeometry(.18+radianceRandom()*.18,0),glass);prism.position.set(p.x,p.y+.8+radianceRandom(),p.z);city.add(prism)}
  for(let i=0;i<7;i++){const x=5.5+i*1.65,y=2.2+(i%2)*1.15,p=cityPos(x,y,.3),pier=new THREE.Mesh(new THREE.BoxGeometry(1,.12,4+(i%3)),wetWood);pier.position.set(p.x,p.y+.05,p.z+1.5);city.add(pier)}
  const boatRandom=seeded(118);for(let i=0;i<12;i++){const x=5+boatRandom()*14,y=-1+boatRandom()*8,p=cityPos(x,y,.2),hull=new THREE.Mesh(new THREE.BoxGeometry(.65,.12,1.45),wetWood),mast=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,1.2,5),wetWood);hull.position.copy(p);hull.rotation.y=(boatRandom()-.5)*1.2;mast.position.set(p.x,p.y+.65,p.z);city.add(hull,mast)}
  const spill=cityPos(38,5,3);[1.1,1.8,2.6].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.1,6,36),i===0?water:copper);ring.rotation.x=Math.PI/2;ring.position.set(spill.x,spill.y+.04+i*.04,spill.z);city.add(ring)});

  const infrastructure=new THREE.Group();infrastructure.name="infrastructure";
  addCurve(infrastructure,[[25,30,30],[40,38,32],[50,45,38],[58,52,45]],0xc58552,.075,.9);addCurve(infrastructure,[[60,52,45],[72,44,35],[82,36,30],[84,33,30]],0xc58552,.075,.9);addCurve(infrastructure,[[56,52,45],[48,42,35],[38,32,25],[28,22,15],[18,14,8],[12,10,3]],0xc58552,.06,.75);
  addCurve(infrastructure,[[46,15,15],[40,14,12],[32,12,8],[24,10,4],[16,8,2],[10,6,0]],0x2d8fa1,.34,.95);addCurve(infrastructure,[[70,14,25],[64,14,22],[58,14,18],[52,14,16],[46,14,15]],0x2d8fa1,.3,.95);addCurve(infrastructure,[[82,28,18],[72,26,16],[62,24,14],[52,22,12],[42,20,10],[32,16,6]],0x2d8fa1,.26,.85);
  addBridge(infrastructure,40,14,12,.65,1.55,Math.PI/2,copper);addBridge(infrastructure,32,12,8,.62,1.4,Math.PI/2,wetWood);addBridge(infrastructure,58,14,18,.68,1.45,Math.PI/2,stone);addBridge(infrastructure,72,26,16,.75,1.6,Math.PI/2,copper);addBridge(infrastructure,52,22,12,.7,1.5,Math.PI/2,stone);city.add(infrastructure);

  const haloMaterial=new THREE.MeshBasicMaterial({color:0x72e4ff,transparent:true,opacity:.62,depthWrite:false}),selectionHalo=new THREE.Mesh(new THREE.TorusGeometry(4.1,.055,6,64),haloMaterial);selectionHalo.rotation.x=Math.PI/2;selectionHalo.visible=false;city.add(selectionHalo);
  const bandLabelPositions:{name:string;x:number;y:number;offset:number}[]=[{name:"LOWER CITY",x:43,y:10,offset:2.1},{name:"MID-CITY",x:61,y:24,offset:2.4},{name:"UPPER CITY",x:58,y:47,offset:2.8}];
  bandLabelPositions.forEach(({name,x,y,offset})=>{const p=cityPos(x,y);const element=document.createElement("div");element.className="band-label";element.textContent=name;const label=new CSS2DObject(element);label.position.set(p.x,p.y+offset,p.z);labelLayer.add(label)});
  const upperRaincatcherPosition=cityPos(79,29),upperRaincatcherElement=document.createElement("div");upperRaincatcherElement.className="band-label water-label";upperRaincatcherElement.textContent="UPPER RAINCATCHER";const upperRaincatcherLabel=new CSS2DObject(upperRaincatcherElement);upperRaincatcherLabel.position.set(upperRaincatcherPosition.x,upperRaincatcherPosition.y+2.5,upperRaincatcherPosition.z);labelLayer.add(upperRaincatcherLabel);
  DISTRICTS.forEach(district=>{
    const p=cityPos(district.x,district.y,district.z),hit=new THREE.Mesh(new THREE.CylinderGeometry(4.7,4.7,6.5,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    hit.position.set(p.x,p.y+2.8,p.z);hit.userData.district=district.name;city.add(hit);hitTargets.push(hit);
    const element=document.createElement("button");element.className="map-label";element.textContent=district.short;element.setAttribute("aria-label",`Explore ${district.name}`);element.addEventListener("click",event=>{event.stopPropagation();selectDistrict(district.name)});
    const label=new CSS2DObject(element);label.position.set(p.x,p.y+(district.name==="The Beacon"?20:district.name==="Summit"?10:3),p.z);labelLayer.add(label);
    const detailLayer=new THREE.Group();detailLayer.visible=false;
    for(const site of LOCAL_SITES[district.name]??[]){
      const sitePosition=cityPos(site.x,site.y,site.z),stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.035,.52,6),haloMaterial),marker=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),haloMaterial);
      stem.position.set(sitePosition.x,sitePosition.y+.26,sitePosition.z);marker.position.set(sitePosition.x,sitePosition.y+.6,sitePosition.z);detailLayer.add(stem,marker);
      const siteElement=document.createElement("div");siteElement.className=`poi-label${site.visited?" is-visited":""}`;siteElement.textContent=site.name;if(site.note)siteElement.title=site.note;const siteLabel=new CSS2DObject(siteElement);siteLabel.position.set(sitePosition.x,sitePosition.y+.82,sitePosition.z);detailLayer.add(siteLabel);
    }
    detailLayers.set(district.name,detailLayer);city.add(detailLayer);
  });
  STORY_LABELS.forEach(story=>{
    const p=cityPos(story.x,story.y,story.z),element=document.createElement("button");element.className="story-label";element.textContent=story.name;element.setAttribute("aria-label",`Follow the party to ${story.name}`);element.addEventListener("click",event=>{event.stopPropagation();selectDistrict(story.district,{name:story.name,x:story.x,y:story.y,z:story.z,visited:true})});
    const label=new CSS2DObject(element);label.position.set(p.x,p.y+1.15,p.z);labelLayer.add(label);
  });city.add(labelLayer);
  return{city,hitTargets,labelLayer,detailLayers,selectionHalo,haloMaterial,infrastructure,beaconLight,staticDrawCalls:buildingDraws+streetDraws};
}

type SceneApi={focus:(district:District)=>void;focusSite:(district:District,site:LocalSite)=>void;street:(district:District)=>void;cityView:()=>void;setAtlas:(atlas:boolean)=>void;setLabels:(visible:boolean)=>void;setInfrastructure:(visible:boolean)=>void};

export function StormhavenMap(){
  const hostRef=useRef<HTMLDivElement>(null),apiRef=useRef<SceneApi|null>(null);
  const [selected,setSelected]=useState<District>(DISTRICTS[3]),[atlas,setAtlas]=useState(false),[labels,setLabels]=useState(true),[routes,setRoutes]=useState(true),[reference,setReference]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    const mobileGrade=window.matchMedia("(max-width: 760px)").matches,cores=navigator.hardwareConcurrency||4,deviceMemory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory??4,constrained=mobileGrade||cores<=4||deviceMemory<=4;
    const scene=new THREE.Scene();scene.background=new THREE.Color(mobileGrade?0x19343c:0x0a171c);scene.fog=new THREE.FogExp2(mobileGrade?0x18333a:0x0b1c22,mobileGrade ? .0072 : .0084);
    const camera=new THREE.PerspectiveCamera(mobileGrade?44:38,host.clientWidth/host.clientHeight,.035,260);camera.position.set(mobileGrade?-63:-47,mobileGrade?74:45,mobileGrade?103:64);
    const renderer=new THREE.WebGLRenderer({antialias:!constrained,alpha:false,powerPreference:"high-performance",stencil:false});const initialDpr=Math.min(window.devicePixelRatio,mobileGrade?1.05:constrained?1.15:1.45);renderer.setPixelRatio(initialDpr);renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=mobileGrade?1.22:1.06;renderer.shadowMap.enabled=!constrained;renderer.shadowMap.type=THREE.PCFShadowMap;host.appendChild(renderer.domElement);
    const labelRenderer=new CSS2DRenderer();labelRenderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.domElement.style.position="absolute";labelRenderer.domElement.style.inset="0";labelRenderer.domElement.style.pointerEvents="none";host.appendChild(labelRenderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=2.2;controls.maxDistance=115;controls.maxPolarAngle=Math.PI*.49;controls.target.set(4,3.2,0);
    scene.add(new THREE.HemisphereLight(mobileGrade?0xa4d1d5:0x789da5,mobileGrade?0x4d4033:0x29221e,mobileGrade?2.25:1.65));const stormLight=new THREE.DirectionalLight(0xc9e5e7,mobileGrade?4.3:3.7);stormLight.position.set(-28,52,22);stormLight.castShadow=!constrained;stormLight.shadow.mapSize.set(1536,1536);stormLight.shadow.camera.left=-55;stormLight.shadow.camera.right=55;stormLight.shadow.camera.top=42;stormLight.shadow.camera.bottom=-42;scene.add(stormLight);const copperGlow=new THREE.PointLight(0xe18a4f,mobileGrade?25:21,36,2);copperGlow.position.set(-19,5,13);scene.add(copperGlow);
    if(mobileGrade){
      const horizonMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`varying vec2 vUv;void main(){float radial=1.0-smoothstep(.18,.72,distance(vUv,vec2(.5,.42)));float band=1.0-smoothstep(.08,.58,abs(vUv.y-.38));vec3 low=vec3(.10,.27,.30);vec3 high=vec3(.20,.38,.40);vec3 color=mix(low,high,smoothstep(.12,.78,vUv.y));gl_FragColor=vec4(color,radial*band*.42);}`});
      const horizon=new THREE.Mesh(new THREE.PlaneGeometry(78,38),horizonMaterial);horizon.position.set(3,10,-41);horizon.renderOrder=-10;horizon.frustumCulled=false;scene.add(horizon);
    }
    const {city,hitTargets,labelLayer,detailLayers,selectionHalo,haloMaterial,infrastructure,beaconLight,staticDrawCalls}=createCity((name,site)=>{const district=DISTRICTS.find(item=>item.name===name);if(district){setSelected(district);setAtlas(false);setLabels(true);if(site)apiRef.current?.focusSite(district,site);else apiRef.current?.focus(district)}},mobileGrade);scene.add(city);
    const clouds=new THREE.Group(),cloudMaterial=new THREE.MeshStandardMaterial({color:mobileGrade?0x263b41:0x16262c,transparent:true,opacity:mobileGrade ? .44 : .56,roughness:1,depthWrite:false}),cloudRandom=seeded(903),cloudCount=mobileGrade?12:22,cloudGeometry=new THREE.IcosahedronGeometry(1,mobileGrade?0:1),cloudMesh=new THREE.InstancedMesh(cloudGeometry,cloudMaterial,cloudCount),cloudMatrix=new THREE.Matrix4();for(let i=0;i<cloudCount;i++){const scale=5+cloudRandom()*9;cloudMatrix.compose(new THREE.Vector3((cloudRandom()-.5)*115,20+cloudRandom()*8,(cloudRandom()-.5)*75),new THREE.Quaternion(),new THREE.Vector3(scale,scale*(.15+cloudRandom()*.1),scale));cloudMesh.setMatrixAt(i,cloudMatrix)}cloudMesh.instanceMatrix.needsUpdate=true;clouds.add(cloudMesh);scene.add(clouds);
    const rainCount=mobileGrade?420:1100,rainPositions=new Float32Array(rainCount*3),rainSpeeds=new Float32Array(rainCount),rainRandom=seeded(8844);for(let i=0;i<rainCount;i++){rainPositions[i*3]=(rainRandom()-.5)*105;rainPositions[i*3+1]=rainRandom()*34;rainPositions[i*3+2]=(rainRandom()-.5)*74;rainSpeeds[i]=7+rainRandom()*7}const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute("position",new THREE.BufferAttribute(rainPositions,3));rainGeometry.setAttribute("aSpeed",new THREE.BufferAttribute(rainSpeeds,1));const rainMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:mobileGrade ? .22 : .35}},vertexShader:`uniform float uTime;attribute float aSpeed;void main(){vec3 p=position;p.y=mod(position.y-uTime*aSpeed+34.0,34.0);p.x-=mod(uTime*aSpeed*.035,3.0);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=1.35;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uOpacity;void main(){gl_FragColor=vec4(.68,.84,.86,uOpacity);}`});const rain=new THREE.Points(rainGeometry,rainMaterial);scene.add(rain);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown={x:0,y:0};const onDown=(event:PointerEvent)=>{pointerDown={x:event.clientX,y:event.clientY}},onClick=(event:PointerEvent)=>{if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=-(event.clientY-bounds.top)/bounds.height*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit?.object.userData.district){const district=DISTRICTS.find(item=>item.name===hit.object.userData.district);if(district){setSelected(district);setAtlas(false);setLabels(true);apiRef.current?.focus(district)}}};renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onClick);
    const tweenCamera=(position:THREE.Vector3,target:THREE.Vector3)=>{const fromPosition=camera.position.clone(),fromTarget=controls.target.clone(),start=performance.now(),duration=950,tick=(time:number)=>{const raw=Math.min(1,(time-start)/duration),eased=1-Math.pow(1-raw,3);camera.position.lerpVectors(fromPosition,position,eased);controls.target.lerpVectors(fromTarget,target,eased);if(raw<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
    let activeDistrict:District|undefined;
    const showDistrict=(district?:District,showLabels=true)=>{
      activeDistrict=district;
      detailLayers.forEach((layer,name)=>{layer.visible=Boolean(district&&showLabels&&name===district.name)});
      labelLayer.visible=!district&&showLabels;
      selectionHalo.visible=Boolean(district);
      if(district){
        const target=cityPos(district.x,district.y,district.z),scale=DISTRICT_FOCUS_SCALE[district.name]??[1,1];
        selectionHalo.position.set(target.x,target.y+.15,target.z);selectionHalo.scale.set(scale[0],scale[1],1);haloMaterial.color.set(district.color);
      }
    };
    const cityCamera=()=>new THREE.Vector3(mobileGrade?-63:-47,mobileGrade?74:45,mobileGrade?103:64);
    const cityView=()=>{activeDistrict=undefined;detailLayers.forEach(layer=>{layer.visible=false});selectionHalo.visible=false;labelLayer.visible=true;clouds.visible=true;tweenCamera(cityCamera(),new THREE.Vector3(4,3.2,0))};
    apiRef.current={
      focus:district=>{clouds.visible=true;showDistrict(district,true);const target=cityPos(district.x,district.y,district.z),offset=district.name==="The Beacon"?new THREE.Vector3(-6.4,6.7,8.7):new THREE.Vector3(-5.2,4.5,7.1);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.9,0)))},
      focusSite:(district,site)=>{clouds.visible=true;showDistrict(district,true);const target=cityPos(site.x,site.y,site.z),offset=mobileGrade?new THREE.Vector3(-8,9,13):new THREE.Vector3(-5.8,6.2,8.6);selectionHalo.position.set(target.x,target.y+.14,target.z);selectionHalo.scale.set(.34,.34,1);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.65,0)))},
      street:district=>{clouds.visible=true;showDistrict(district,true);const target=cityPos(district.x,district.y,district.z),offset=new THREE.Vector3(-2.8,1.7,4.1);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.65,0)))},
      cityView,
      setAtlas:enabled=>{activeDistrict=undefined;detailLayers.forEach(layer=>{layer.visible=false});selectionHalo.visible=false;labelLayer.visible=true;clouds.visible=!enabled;if(enabled)tweenCamera(new THREE.Vector3(0,mobileGrade?98:90,.01),new THREE.Vector3(0,0,0));else cityView()},
      setLabels:visible=>{labelLayer.visible=visible&&!activeDistrict;detailLayers.forEach((layer,name)=>{layer.visible=visible&&name===activeDistrict?.name})},
      setInfrastructure:visible=>{infrastructure.visible=visible}
    };
    const onResize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.setSize(host.clientWidth,host.clientHeight)};window.addEventListener("resize",onResize);
    const metricWindow=window as Window&{__stormhavenMetrics?:Record<string,number|boolean>},startedAt=performance.now();let animation=0,metricStarted=startedAt,metricFrames=0,adaptiveDone=false;
    const animate=(now:number)=>{animation=requestAnimationFrame(animate);if(document.hidden)return;const elapsed=(now-startedAt)/1000;controls.update();clouds.position.x=Math.sin(elapsed*.035)*5;rainMaterial.uniforms.uTime.value=elapsed;beaconLight.intensity=48+Math.sin(elapsed*2.7)*8;renderer.render(scene,camera);labelRenderer.render(scene,camera);metricFrames++;const metricSpan=now-metricStarted;if(metricSpan>=1000){const fps=metricFrames*1000/metricSpan,metrics={fps:Math.round(fps),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points,staticDrawCalls,pixelRatio:renderer.getPixelRatio(),mobileGrade,shadows:renderer.shadowMap.enabled};metricWindow.__stormhavenMetrics=metrics;host.dataset.performance=JSON.stringify(metrics);if(!adaptiveDone&&now-startedAt>2200){adaptiveDone=true;if(fps<48&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);renderer.setSize(host.clientWidth,host.clientHeight)}}metricFrames=0;metricStarted=now}};animation=requestAnimationFrame(animate);setReady(true);
    return()=>{cancelAnimationFrame(animation);window.removeEventListener("resize",onResize);renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onClick);controls.dispose();renderer.dispose();delete metricWindow.__stormhavenMetrics;delete host.dataset.performance;scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material?.dispose())}});host.replaceChildren();apiRef.current=null};
  },[]);
  const choose=(district:District)=>{setSelected(district);setAtlas(false);setLabels(true);apiRef.current?.focus(district)};
  return <main className="stormhaven-shell">
    <div ref={hostRef} className="map-canvas" role="img" aria-label="Interactive three-dimensional map of Stormhaven and its ten districts" />
    {!ready&&<div className="loading-mark">Charting the storm</div>}
    <header className="topbar"><div className="brand"><p className="eyebrow">A living atlas · year 503 A.S.</p><h1>Stormhaven</h1><span className="brand-note">Elevation is privilege. Everything else runs downhill.</span></div><div className="controls" aria-label="Map controls">
      <button className="control-button" type="button" onClick={()=>{setAtlas(false);setLabels(true);apiRef.current?.cityView()}}>City view</button>
      <button className="control-button" type="button" aria-pressed={atlas} onClick={()=>{const next=!atlas;setAtlas(next);setLabels(true);apiRef.current?.setAtlas(next)}}>{atlas?"Perspective":"Atlas view"}</button>
      <button className="control-button" type="button" aria-pressed={routes} onClick={()=>{const next=!routes;setRoutes(next);apiRef.current?.setInfrastructure(next)}}>Routes</button>
      <button className="control-button" type="button" aria-pressed={labels} onClick={()=>{const next=!labels;setLabels(next);apiRef.current?.setLabels(next)}}>Labels</button>
      <button className="control-button" type="button" onClick={()=>{setAtlas(false);setLabels(true);apiRef.current?.street(selected)}}>Street lens</button>
      <button className="control-button" type="button" onClick={()=>setReference(true)}>Source map</button>
    </div></header>
    <nav className="district-nav" aria-label="Stormhaven districts">{DISTRICTS.map(district=><button key={district.name} type="button" className={`district-button ${selected.name===district.name?"is-active":""}`} onClick={()=>choose(district)}>{district.short}</button>)}</nav>
    <aside className={`detail-panel${atlas?" is-atlas":""}`} style={{"--district-color":selected.color} as React.CSSProperties} aria-live="polite"><div className="detail-kicker"><span>{selected.kind}</span><span>Pop. {selected.population}</span></div><h2>{selected.name}</h2><p>{selected.description}</p><div className="local-sites"><span className="local-sites-label">Mapped landmarks · gold marks the party trail</span><div className="local-site-list">{(LOCAL_SITES[selected.name]??[]).map(site=><span className={`local-site${site.visited?" is-visited":""}`} title={site.note} key={site.name}>{site.name}</span>)}</div></div><div className="coordinates"><span><b>X</b> {selected.x}</span><span><b>Y</b> {selected.y}</span><span><b>Z</b> {selected.z}m</span><span>1 unit = 30m</span></div></aside>
    <div className="map-hint">Click a ward to enter · drag to orbit · scroll to descend · City view returns</div>
    <div className="city-band-legend" aria-label="Stormhaven elevation bands">{CITY_BANDS.map(band=><span key={band.name} title={band.description} style={{"--band-color":band.color} as React.CSSProperties}><i />{band.name}</span>)}</div>
    <div className="compass" aria-hidden="true" />
    {reference&&<div className="reference-backdrop" role="dialog" aria-modal="true" aria-label="Original Stormhaven cartographer map" onClick={()=>setReference(false)}><div className="reference-plate" onClick={event=>event.stopPropagation()}><img src="/assets/stormhaven-cartographer-reference.webp" alt="Original painted map of Stormhaven used as the architectural and compositional reference" /><button type="button" className="control-button reference-close" onClick={()=>setReference(false)}>Close</button></div></div>}
  </main>;
}
