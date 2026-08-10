"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
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
  "The Spillway":[{name:"Vane’s Safehouse",x:40.8,y:11.3,z:11,visited:true,note:"Lower-city shelf southwest of the Whispers, above the Spillway approach"},{name:"The Drain",x:37,y:6,visited:true},{name:"Three Sluices",x:40,y:7},{name:"Rust Market",x:35,y:4},{name:"Gutter Gate",x:41,y:3}],
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

// District signatures use a tiny shared primitive set. Every mesh is folded into
// a material bucket before first paint, so added character costs vertices, not
// runtime scene traversal or a draw call per prop.
const sharedDetail=<T extends THREE.BufferGeometry>(geometry:T)=>{geometry.userData.sharedSource=true;return geometry};
const DETAIL_BOX=sharedDetail(new THREE.BoxGeometry(1,1,1));
const DETAIL_CYLINDER=sharedDetail(new THREE.CylinderGeometry(.82,1,1,7));
const DETAIL_CONE=sharedDetail(new THREE.ConeGeometry(1,1,7));
const DETAIL_OCTAHEDRON=sharedDetail(new THREE.OctahedronGeometry(1,0));
const DETAIL_ICOSAHEDRON=sharedDetail(new THREE.IcosahedronGeometry(1,1));
const DETAIL_HALF_ARCH=sharedDetail(new THREE.TorusGeometry(1,.09,6,22,Math.PI));

function addDetailBox(group:THREE.Group,position:THREE.Vector3,scale:[number,number,number],material:THREE.Material,rotationY=0,rotationZ=0){
  const mesh=new THREE.Mesh(DETAIL_BOX,material);mesh.position.copy(position);mesh.scale.set(...scale);mesh.rotation.set(0,rotationY,rotationZ);group.add(mesh);return mesh;
}
function addDetailCylinder(group:THREE.Group,base:THREE.Vector3,height:number,radius:number,material:THREE.Material,lean=0){
  const mesh=new THREE.Mesh(DETAIL_CYLINDER,material);mesh.position.copy(base);mesh.position.y+=height/2;mesh.scale.set(radius,height,radius);mesh.rotation.z=lean;group.add(mesh);return mesh;
}
function addDetailCone(group:THREE.Group,base:THREE.Vector3,height:number,radius:number,material:THREE.Material){
  const mesh=new THREE.Mesh(DETAIL_CONE,material);mesh.position.copy(base);mesh.position.y+=height/2;mesh.scale.set(radius,height,radius);group.add(mesh);return mesh;
}
function addDetailOctahedron(group:THREE.Group,position:THREE.Vector3,radius:number,material:THREE.Material){
  const mesh=new THREE.Mesh(DETAIL_OCTAHEDRON,material);mesh.position.copy(position);mesh.scale.setScalar(radius);group.add(mesh);return mesh;
}
function addDetailBeam(group:THREE.Group,from:THREE.Vector3,to:THREE.Vector3,width:number,material:THREE.Material){
  const midpoint=from.clone().lerp(to,.5),mesh=addDetailBox(group,midpoint,[width,width,from.distanceTo(to)],material);mesh.lookAt(to);return mesh;
}
function addDetailArch(group:THREE.Group,position:THREE.Vector3,width:number,height:number,depth:number,material:THREE.Material,rotationY=0){
  const mesh=new THREE.Mesh(DETAIL_HALF_ARCH,material);mesh.position.copy(position);mesh.scale.set(width,height,depth);mesh.rotation.y=rotationY;group.add(mesh);return mesh;
}

function bakeStaticGroup(group:THREE.Group,name:string,castShadow=true){
  group.updateMatrixWorld(true);
  const buckets=new Map<THREE.Material,THREE.Mesh[]>(),source:THREE.Mesh[]=[];
  group.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||Array.isArray(object.material))return;
    const list=buckets.get(object.material)??[];list.push(object);buckets.set(object.material,list);source.push(object);
  });
  const baked:THREE.Mesh[]=[];
  buckets.forEach((meshes,material)=>{
    const materialData=material as unknown as Record<string,unknown>,usesUv=["map","alphaMap","aoMap","bumpMap","normalMap","roughnessMap","metalnessMap","displacementMap","emissiveMap","lightMap"].some(key=>Boolean(materialData[key]));
    let vertexCount=0,indexCount=0,hasNormals=!(material instanceof THREE.MeshBasicMaterial),hasUvs=usesUv;
    for(const mesh of meshes){const position=mesh.geometry.getAttribute("position");vertexCount+=position.count;indexCount+=mesh.geometry.index?.count??position.count;hasNormals&&=Boolean(mesh.geometry.getAttribute("normal"));hasUvs&&=Boolean(mesh.geometry.getAttribute("uv"))}
    const positions=new Float32Array(vertexCount*3),normals=hasNormals?new Float32Array(vertexCount*3):undefined,uvs=hasUvs?new Float32Array(vertexCount*2):undefined,indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let vertexOffset=0,indexOffset=0;
    const normalMatrix=new THREE.Matrix3();
    for(const mesh of meshes){
      const geometry=mesh.geometry,position=geometry.getAttribute("position"),normal=hasNormals?geometry.getAttribute("normal"):undefined,uv=hasUvs?geometry.getAttribute("uv"):undefined,m=mesh.matrixWorld.elements;
      normalMatrix.getNormalMatrix(mesh.matrixWorld);const n=normalMatrix.elements;
      for(let i=0;i<position.count;i++){
        const x=position.getX(i),y=position.getY(i),z=position.getZ(i),p=(vertexOffset+i)*3;
        positions[p]=m[0]*x+m[4]*y+m[8]*z+m[12];positions[p+1]=m[1]*x+m[5]*y+m[9]*z+m[13];positions[p+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
        if(normal&&normals){const nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i),tx=n[0]*nx+n[3]*ny+n[6]*nz,ty=n[1]*nx+n[4]*ny+n[7]*nz,tz=n[2]*nx+n[5]*ny+n[8]*nz,length=Math.hypot(tx,ty,tz)||1;normals[p]=tx/length;normals[p+1]=ty/length;normals[p+2]=tz/length}
        if(uv&&uvs){const u=(vertexOffset+i)*2;uvs[u]=uv.getX(i);uvs[u+1]=uv.getY(i)}
      }
      const index=geometry.index,count=index?.count??position.count;for(let i=0;i<count;i++)indices[indexOffset+i]=vertexOffset+(index?index.getX(i):i);indexOffset+=count;vertexOffset+=position.count;
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));if(normals)geometry.setAttribute("normal",new THREE.BufferAttribute(normals,3));if(uvs)geometry.setAttribute("uv",new THREE.BufferAttribute(uvs,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));
    geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.name=`${name}-${baked.length}`;mesh.castShadow=castShadow;mesh.receiveShadow=true;baked.push(mesh);
  });
  source.forEach(mesh=>{if(!mesh.geometry.userData.sharedSource)mesh.geometry.dispose()});group.clear();group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.set(1,1,1);group.add(...baked);
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

function addCanalRibbon(group:THREE.Group,points:Array<[number,number]>,width:number,water:THREE.Material,edge:THREE.Material){
  addStreet(group,points,width,water,.045);
  for(let i=0;i<points.length-1;i++){
    const [ax,ay]=points[i],[bx,by]=points[i+1],dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy)||1,offset=(width*.56+.07)/S,px=-dy/length*offset,py=dx/length*offset;
    addStreet(group,[[ax+px,ay+py],[bx+px,by+py]],.065,edge,.085);
    addStreet(group,[[ax-px,ay-py],[bx-px,by-py]],.065,edge,.085);
  }
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

const DISTRICT_FOOTPRINTS:Record<string,[number,number]>={
  "The Sea Ward":[8,5.5],"The Spillway":[6,4.2],Radiance:[6.5,5],"The Beacon":[7,6],"The Whispers":[9,6],
  Summit:[8,5],"The Grove":[7,5],"The Eye":[6,5],"Raincatcher’s Ward":[7.5,6.5],"Foggy Bottoms":[8,5],
};

const NEIGHBORHOOD_ANCHORS:Record<string,[number,number,number?]>={
  "The Sea Ward":[10.5,8,3],"The Spillway":[40.2,10.1,10],Radiance:[22.4,21.5,27],"The Beacon":[30,25.2,26],"The Whispers":[48,15,15],
  Summit:[56.5,51.5,44],"The Grove":[44,49,42],"The Eye":[81.5,31.5,30],"Raincatcher’s Ward":[76,20,38],"Foggy Bottoms":[86,7,7],
};

function neighborhoodAnchor(district:District){return NEIGHBORHOOD_ANCHORS[district.name]??[district.x,district.y,district.z]}

const FABRIC_STREETS:Array<Array<[number,number]>>=[
  [[7,9],[18,13],[29,14],[40,15],[52,15],[65,17],[78,14],[91,8]],
  [[16,20],[27,22],[39,21],[52,22],[64,25],[76,29],[86,32]],
  [[20,28],[31,32],[43,37],[54,44],[62,51],[72,46],[83,36]],
  [[27,29],[35,37],[44,48],[52,51],[60,54]],
];

const FABRIC_CANALS:Array<Array<[number,number]>>=[
  [[47,2],[47,7],[44,12],[40,17],[35,22],[32,28]],
  [[27,23.7],[30,24.1],[34,23.1],[38,21],[42,18]],
  [[80,30],[81,25],[82,20],[83,15],[84,10],[86,4]],
  [[46,15],[40,14],[32,12],[24,10],[16,8],[10,6]],
  [[70,14],[64,14],[58,14],[52,14],[46,14]],
  [[19,10],[22,14],[26,19],[29,25],[31,30]],
  [[39,7],[39,12],[37,17],[38,22],[42,27]],
  [[43,23],[48,26],[54,29],[61,30],[68,27],[75,25]],
];

type FabricBand="lower"|"mid"|"upper";
type UrbanMass={name:string;points:Array<[number,number]>;band:FabricBand;kinds:ArchitectureKind[];height:number;angle:number;spacing:number;voidChance:number};
const URBAN_MASSES:UrbanMass[]=[
  {name:"western shelf",points:[[6,7],[10,17],[16,27],[24,31],[30,26],[29,18],[22,10],[14,4]],band:"lower",kinds:["canal-house","warehouse","tenement","stilt-house"],height:.68,angle:.16,spacing:1.48,voidChance:.1},
  {name:"lower-city crescent",points:[[17,8],[22,15],[29,22],[39,25],[49,22],[58,18],[65,13],[60,9],[52,10],[44,12],[37,11],[30,9],[24,6]],band:"lower",kinds:["tenement","canal-house","warehouse","townhouse"],height:.73,angle:.04,spacing:1.42,voidChance:.08},
  {name:"harbor-edge platforms",points:[[40,8],[45,12],[52,14],[61,13],[70,9],[75,5],[68,3],[59,5],[51,7],[45,6]],band:"lower",kinds:["canal-house","stilt-house","warehouse"],height:.57,angle:-.08,spacing:1.5,voidChance:.13},
  {name:"mid-city plateau",points:[[25,22],[30,31],[40,39],[52,43],[65,40],[78,33],[79,26],[70,20],[58,18],[46,20],[36,18]],band:"mid",kinds:["tenement","townhouse","canal-house","glassworks"],height:.84,angle:.035,spacing:1.4,voidChance:.075},
  {name:"summit skirt",points:[[34,34],[42,45],[53,52],[67,49],[79,40],[73,33],[61,35],[49,32],[41,30]],band:"upper",kinds:["townhouse","tower-house","shrine","bathhouse"],height:.94,angle:.08,spacing:1.52,voidChance:.12},
  {name:"eye approach",points:[[67,29],[75,38],[86,40],[91,33],[87,26],[78,23],[72,24]],band:"upper",kinds:["townhouse","shrine","tower-house"],height:.82,angle:-.04,spacing:1.58,voidChance:.15},
  {name:"raincatcher housing",points:[[67,14],[75,14],[84,18],[89,25],[86,32],[80,34],[74,28],[67,23]],band:"mid",kinds:["bathhouse","canal-house","greenhouse","townhouse"],height:.68,angle:.2,spacing:1.52,voidChance:.14},
  {name:"eastern marsh edge",points:[[75,5],[82,2],[92,3],[96,10],[91,16],[84,16],[78,12]],band:"lower",kinds:["stilt-house","ruin","canal-house"],height:.5,angle:-.2,spacing:1.62,voidChance:.2},
];

function distanceToSegment(x:number,y:number,a:[number,number],b:[number,number]){
  const dx=b[0]-a[0],dy=b[1]-a[1],lengthSquared=dx*dx+dy*dy;
  const t=lengthSquared?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/lengthSquared)):0;
  return Math.hypot(x-(a[0]+dx*t),y-(a[1]+dy*t));
}

function distanceToPaths(x:number,y:number,paths:Array<Array<[number,number]>>){
  let nearest=Infinity;
  for(const path of paths)for(let i=0;i<path.length-1;i++)nearest=Math.min(nearest,distanceToSegment(x,y,path[i],path[i+1]));
  return nearest;
}

type FabricKits={lower:StormhavenArchitectureKit;mid:StormhavenArchitectureKit;upper:StormhavenArchitectureKit};
function addMapFabric(group:THREE.Group,kits:FabricKits,mobileGrade:boolean){
  const random=seeded(503_721),occupied:Array<[number,number]>=[];let parcel=0;
  URBAN_MASSES.forEach((mass,massIndex)=>{
    const xs=mass.points.map(point=>point[0]),ys=mass.points.map(point=>point[1]),step=mass.spacing*(mobileGrade?1.14:1),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),target=Math.ceil((maxX-minX)*(maxY-minY)/(step*step)*.31);
    let accepted=0;
    for(let attempt=0;attempt<target*22&&accepted<target;attempt++){
      const px=minX+random()*(maxX-minX),py=minY+random()*(maxY-minY);
      if(!pointInPolygon(px,py,mass.points)||!pointInPolygon(px,py,CITY_OUTLINE))continue;
      if(distanceToPaths(px,py,FABRIC_STREETS)<.62||distanceToPaths(px,py,FABRIC_CANALS)<.92)continue;
      const inWard=DISTRICTS.some(district=>{const [rx,ry]=DISTRICT_FOOTPRINTS[district.name]??[6,5];return((px-district.x)/(rx*.92))**2+((py-district.y)/(ry*.92))**2<1});
      if(inWard||occupied.some(([ox,oy])=>Math.hypot(px-ox,py-oy)<step*(.58+random()*.1))||random()<mass.voidChance)continue;
      const kind=mass.kinds[Math.floor(random()*mass.kinds.length)],w=S*step*(.45+random()*.22),d=S*step*.9*(.47+random()*.23),h=(.9+random()*1.45)*mass.height,building=kits[mass.band].create(kind,{width:w,depth:d,height:h,seed:9200+massIndex*1009+parcel*19}),p=cityPos(px,py);
      const terraceTurn=Math.sin(px*.17+py*.11+massIndex)*.075;building.position.copy(p);building.rotation.y=mass.angle+terraceTurn+(random()-.5)*.13;if(mass.band==="lower")building.rotation.z=(random()-.5)*.035;group.add(building);occupied.push([px,py]);parcel++;accepted++;
    }
  });
}

type NeighborhoodMaterials={stone:THREE.Material;darkStone:THREE.Material;cobble:THREE.Material;paleStone:THREE.Material;copper:THREE.Material;wood:THREE.Material;water:THREE.Material;garden:THREE.Material;arc:THREE.Material;warm:THREE.Material;redCanvas:THREE.Material;tealCanvas:THREE.Material;glass:THREE.Material};

function addNeighborhoodLayer(group:THREE.Group,district:District,materials:NeighborhoodMaterials,seed:number){
  const r=seeded(seed),angle:Record<string,number>={"The Sea Ward":.34,"The Spillway":-.18,Radiance:.08,"The Beacon":.12,"The Whispers":-.16,Summit:.05,"The Grove":-.22,"The Eye":0,"Raincatcher’s Ward":.2,"Foggy Bottoms":-.31}[district.name]??0;
  const [centerX,centerY,centerZ]=neighborhoodAnchor(district),elevation=centerZ??terrainHeight(centerX,centerY);
  const point=(along:number,across:number):[number,number]=>[centerX+Math.cos(angle)*along-Math.sin(angle)*across,centerY+Math.sin(angle)*along+Math.cos(angle)*across];
  const laneMaterial=district.y>32?materials.paleStone:district.name==="Foggy Bottoms"||district.name==="The Sea Ward"?materials.wood:materials.cobble;
  for(const across of[-1.48,0,1.48])addStreet(group,[point(-4.8,across),point(-2.1,across+(r()-.5)*.25),point(.2,across),point(2.5,across+(r()-.5)*.3),point(4.8,across)],across===0?.2:.12,laneMaterial,.13);
  for(const along of[-3.15,1.65])addStreet(group,[point(along,-2.65),point(along+(r()-.5)*.2,0),point(along,2.65)],.105,laneMaterial,.135);
  addPlaza(group,...point(district.name==="The Grove"?1.6:-1.2,district.name==="The Eye"?0:1.48),district.name==="Summit"||district.name==="The Eye"?.78:.48,laneMaterial,elevation);

  // Parcel-scale street furniture: market awnings, stoops, crates, bollards, rain barrels
  // and clustered lamps make the close view read as a place people actually use.
  for(let i=0;i<26;i++){
    const [x,y]=point(-4.4+r()*8.8,(i%2?1:-1)*(1.76+r()*.62)),p=cityPos(x,y),kind=i%5;
    if(kind===0){const crate=new THREE.Mesh(new THREE.BoxGeometry(.16+r()*.12,.13+r()*.13,.16+r()*.12),materials.wood);crate.position.set(p.x,p.y+.1,p.z);crate.rotation.y=r()*.8;group.add(crate)}
    else if(kind===1){const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.08,.09,.22,7),materials.darkStone);barrel.position.set(p.x,p.y+.11,p.z);group.add(barrel)}
    else if(kind===2){const stoop=new THREE.Mesh(new THREE.BoxGeometry(.35,.08,.22),laneMaterial);stoop.position.set(p.x,p.y+.04,p.z);stoop.rotation.y=angle;group.add(stoop)}
    else if(kind===3){const awning=new THREE.Mesh(new THREE.BoxGeometry(.48,.035,.28),i%2?materials.redCanvas:materials.tealCanvas);awning.position.set(p.x,p.y+.62,p.z);awning.rotation.y=angle;awning.rotation.z=(r()-.5)*.08;group.add(awning)}
    else addLamp(group,x,y,materials.copper,i%2?materials.warm:materials.arc,.56+r()*.16);
  }
  addMarketStalls(group,...point(1.1,-1.45),district.name==="Summit"||district.name==="The Grove"?4:8,3.2,.45,seed+440,materials.wood,district.name==="Raincatcher’s Ward"?materials.tealCanvas:materials.redCanvas);

  if(district.name==="The Sea Ward"){
    for(const along of[-4,-2,0,2,4]){const [x,y]=point(along,-2.9),p=cityPos(x,y,1.6),pier=new THREE.Mesh(new THREE.BoxGeometry(.5,.09,1.6),materials.wood);pier.position.set(p.x,p.y,p.z);pier.rotation.y=angle;group.add(pier);addLamp(group,x,y,materials.copper,materials.warm,.48)}
    const [archX,archY]=point(-.65,.2),archPosition=cityPos(archX,archY,elevation);addDetailArch(group,archPosition,.72,1.02,.74,materials.paleStone,angle);
    for(const along of[-3.5,0,3.5]){const [postX,postY]=point(along,-2.1),base=cityPos(postX,postY,elevation),top=base.clone();top.y+=1.15;addDetailCylinder(group,base,1.15,.055,materials.wood,-.04);const boom=top.clone().add(new THREE.Vector3(Math.cos(angle)*.7,-.03,-Math.sin(angle)*.7));addDetailBeam(group,top,boom,.045,materials.wood);addDetailBeam(group,boom,boom.clone().add(new THREE.Vector3(0,-.52,0)),.018,materials.copper);const lamp=boom.clone();lamp.y-=.56;addDetailOctahedron(group,lamp,.07,materials.warm)}
  }else if(district.name==="The Spillway"){
    for(const across of[-2.2,0,2.2]){const start=point(-4.4,across),end=point(4.4,across);addStreet(group,[start,end],.32,materials.water,.1);addStreet(group,[point(-4.4,across-.28),point(4.4,across-.28)],.055,materials.copper,.15);addStreet(group,[point(-4.4,across+.28),point(4.4,across+.28)],.055,materials.copper,.15)}
    for(const along of[-3.2,0,3.2]){const [leftX,leftY]=point(along,-.5),[rightX,rightY]=point(along,.5),left=cityPos(leftX,leftY,elevation),right=cityPos(rightX,rightY,elevation);addDetailCylinder(group,left,.9,.065,materials.copper);addDetailCylinder(group,right,.9,.065,materials.copper);const lintelLeft=left.clone(),lintelRight=right.clone();lintelLeft.y+=.82;lintelRight.y+=.82;addDetailBeam(group,lintelLeft,lintelRight,.08,materials.darkStone);const warning=lintelLeft.clone().lerp(lintelRight,.5);warning.y+=.18;addDetailOctahedron(group,warning,.08,materials.arc);addBridge(group,...point(along,0),elevation+.32,.54,1.3,angle+Math.PI/2,materials.wood)}
    for(const along of[-2.2,2.2]){const [x,y]=point(along,1.85),p=cityPos(x,y,elevation);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.2,0)),[1.1,.12,.72],materials.wood,angle);for(const side of[-1,1]){const [sx,sy]=point(along+side*.55,1.85);addDetailCylinder(group,cityPos(sx,sy,elevation),.4,.045,materials.wood)}}
  }else if(district.name==="Radiance"){
    for(let i=0;i<16;i++){const [x,y]=point(-4+r()*8,-2.1+r()*4.2),p=cityPos(x,y),prism=new THREE.Mesh(new THREE.OctahedronGeometry(.09+r()*.1,0),materials.glass);prism.position.set(p.x,p.y+.34+r()*.65,p.z);group.add(prism)}
    for(let i=0;i<10;i++){const side=i%2?1:-1,[x,y]=point(-4+i*.9,side*2.05),p=cityPos(x,y,elevation);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.66,0)),[.075,1.18,.45],materials.glass,angle+side*.18,side*.09);const shard=p.clone();shard.y+=1.44;addDetailOctahedron(group,shard,.12,materials.arc)}
    for(const along of[-2.7,0,2.7]){const [x,y]=point(along,-1.6),p=cityPos(x,y,elevation);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.34,0)),[.72,.6,.64],materials.darkStone,angle);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.35,.34)),[.22,.3,.03],materials.arc,angle)}
  }else if(district.name==="The Beacon"){
    for(const along of[-4,-2.4,-.8,.8,2.4,4]){const [x,y]=point(along,-2.3),p=cityPos(x,y),vent=new THREE.Mesh(new THREE.CylinderGeometry(.065,.09,.5+r()*.45,7),materials.copper);vent.position.set(p.x,p.y+.3,p.z);group.add(vent)}
    [[-2.8,2.35],[0,2.35],[2.8,2.35]].forEach(([along,across])=>{const [x,y]=point(along,across);addBridge(group,x,y,terrainHeight(x,y)-1.15,.55,1.2,angle+Math.PI/2,materials.wood)});
    for(const along of[-3,-1,1,3]){const [x,y]=point(along,1.7),base=cityPos(x,y,elevation);addDetailCylinder(group,base,.72,.3,materials.darkStone);const cap=base.clone();cap.y+=.77;addDetailCone(group,cap,.28,.32,materials.copper);const fire=base.clone();fire.y+=.38;fire.z+=.26;addDetailOctahedron(group,fire,.11,materials.warm)}
    const pipeStart=cityPos(...point(-4,2.25),elevation+1.05),pipeEnd=cityPos(...point(4,2.25),elevation+1.05);addDetailBeam(group,pipeStart,pipeEnd,.09,materials.copper);for(const along of[-4,0,4])addDetailCylinder(group,cityPos(...point(along,2.25),elevation),1.05,.055,materials.copper);
  }else if(district.name==="The Whispers"){
    for(const across of[-2.1,2.1]){const start=cityPos(...point(-4.2,across),elevation+1.15),end=cityPos(...point(4.2,across),elevation+1.05);addDetailBeam(group,start,end,.018,materials.copper)}
    for(let i=0;i<18;i++){const side=i%2?1:-1,[x,y]=point(-4+i*.47,side*(1.9+r()*.3)),p=cityPos(x,y,elevation);addDetailCylinder(group,p,.55,.025,materials.copper,(r()-.5)*.08);p.y+=.64;addDetailOctahedron(group,p,.055+r()*.025,i%3===0?materials.warm:materials.glass)}
    for(const along of[-3.4,-1.7,0,1.7,3.4]){const [leftX,leftY]=point(along,-.34),[rightX,rightY]=point(along,.34),left=cityPos(leftX,leftY,elevation),right=cityPos(rightX,rightY,elevation);addDetailCylinder(group,left,.72,.04,materials.darkStone,(r()-.5)*.08);addDetailCylinder(group,right,.72,.04,materials.darkStone,(r()-.5)*.08);left.y+=.7;right.y+=.7;addDetailBeam(group,left,right,.04,materials.darkStone)}
  }else if(district.name==="Summit"){
    for(const across of[-2.35,2.35])for(let along=-4;along<=4;along+=.42){const [x,y]=point(along,across),p=cityPos(x,y,elevation),hedge=new THREE.Mesh(new THREE.BoxGeometry(.28,.3,.3),materials.garden);hedge.position.set(p.x,p.y+.16,p.z);group.add(hedge)}
    for(const along of[-2.8,0,2.8]){const a=cityPos(...point(along,-2.4),elevation+1.05),b=cityPos(...point(along,2.4),elevation+1.05);addDetailBeam(group,a,b,.18,materials.paleStone);for(const side of[-1,1]){const railA=a.clone().add(new THREE.Vector3(Math.cos(angle)*side*.13,.18,-Math.sin(angle)*side*.13)),railB=b.clone().add(new THREE.Vector3(Math.cos(angle)*side*.13,.18,-Math.sin(angle)*side*.13));addDetailBeam(group,railA,railB,.035,materials.copper)}const gondola=a.clone().lerp(b,.5);gondola.y-=.38;addDetailOctahedron(group,gondola,.13,materials.copper)}
    for(let i=0;i<5;i++){const [x,y]=point(-2.8+i*1.4,1.12),p=cityPos(x,y,elevation);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.05,0)),[.26,.1,.26],materials.paleStone);p.y+=.28;addDetailOctahedron(group,p,.105,materials.paleStone)}
  }else if(district.name==="The Grove"){
    for(let i=0;i<34;i++){const [x,y]=point(-4.5+r()*9,-2.5+r()*5),p=cityPos(x,y),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.42,5),materials.wood),crown=new THREE.Mesh(DETAIL_ICOSAHEDRON,materials.garden),crownRadius=.18+r()*.18;trunk.position.set(p.x,p.y+.21,p.z);crown.position.set(p.x,p.y+.55+r()*.25,p.z);crown.scale.setScalar(crownRadius);group.add(trunk,crown);if(i%3===0){const graft=p.clone();graft.y+=.38;addDetailCylinder(group,graft,.5,.022,materials.glass,(r()-.5)*.18)}}
    for(const along of[-3,-1.5,0,1.5,3]){const [x,y]=point(along,1.72),p=cityPos(x,y,elevation);addDetailCylinder(group,p,.76,.035,materials.copper);addDetailBox(group,p.clone().add(new THREE.Vector3(0,.58,0)),[.28,.19,.035],materials.glass,angle)}
    addDetailBeam(group,cityPos(...point(-4,-1.25),elevation+.68),cityPos(...point(4,-1.25),elevation+.68),.09,materials.wood);
  }else if(district.name==="The Eye"){
    for(const along of[-4,-3,-2,-1,0,1,2,3,4])for(const across of[-2.35,2.35]){const [x,y]=point(along,across),p=cityPos(x,y,elevation),column=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.62,7),materials.paleStone);column.position.set(p.x,p.y+.31,p.z);group.add(column)}
    for(const along of[-3,-2,-1,0,1,2,3])addDetailBeam(group,cityPos(...point(along,-1.7),elevation+.045),cityPos(...point(along,1.7),elevation+.045),.025,materials.copper);
    for(const across of[-1.2,0,1.2])addDetailBeam(group,cityPos(...point(-3.5,across),elevation+.048),cityPos(...point(3.5,across),elevation+.048),.025,materials.copper);
    for(const side of[-1,1]){const p=cityPos(...point(2.65+side*.38,-.3),elevation);addDetailCylinder(group,p,.8,.08,materials.paleStone);p.y+=.8;addDetailCone(group,p,.55,.18,materials.copper)}
    const font=cityPos(...point(-2.45,0),elevation);addDetailCylinder(group,font,.12,.58,materials.paleStone);font.y+=.13;addDetailCylinder(group,font,.035,.48,materials.water);
  }else if(district.name==="Raincatcher’s Ward"){
    const basins:Array<THREE.Vector3>=[];for(const along of[-3.6,-2.4,-1.2,0,1.2,2.4,3.6]){const [x,y]=point(along,-2.15),p=cityPos(x,y);addDetailCylinder(group,p,.13,.42,materials.stone);const pool=p.clone();pool.y+=.13;addDetailCylinder(group,pool,.035,.34,materials.water);basins.push(pool)}for(let i=0;i<basins.length-1;i++){const start=basins[i].clone(),end=basins[i+1].clone();start.y+=.04;end.y+=.04;addDetailBeam(group,start,end,.055,materials.water)}
    for(const along of[-3,-1.5,0,1.5,3]){const p=cityPos(...point(along,1.75),elevation);addDetailArch(group,p,.42,.58,.45,materials.glass,angle)}
    for(const along of[-2.7,0,2.7]){const p=cityPos(...point(along,.8),elevation);addDetailCylinder(group,p,.72,.05,materials.copper);p.y+=.74;addDetailOctahedron(group,p,.075,materials.arc)}
  }else if(district.name==="Foggy Bottoms"){
    for(const across of[-2.35,2.35]){const [aX,aY]=point(-4.7,across),[bX,bY]=point(4.7,across);addStreet(group,[[aX,aY],[bX,bY]],.28,materials.wood,.25)}
    for(let i=0;i<20;i++){const [x,y]=point(-4.5+r()*9,-2.6+r()*5.2),p=cityPos(x,y),post=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.65,5),materials.wood);post.position.set(p.x,p.y+.14,p.z);post.rotation.z=(r()-.5)*.15;group.add(post)}
    for(const [along,across,radius] of [[-2.8,1.3,.55],[.4,-1.4,.7],[3.1,1.45,.46]] as Array<[number,number,number]>){const p=cityPos(...point(along,across),elevation-.12);addDetailCylinder(group,p,.05,radius,materials.water)}
    const wreck=cityPos(...point(-.8,.15),elevation),bow=wreck.clone().add(new THREE.Vector3(-1.05,.16,.28)),stern=wreck.clone().add(new THREE.Vector3(1.05,-.08,-.28));addDetailBeam(group,bow,stern,.22,materials.wood);for(const offset of[-.7,0,.7]){const keel=wreck.clone().add(new THREE.Vector3(offset,.02,-offset*.26)),ribTop=keel.clone().add(new THREE.Vector3(0,.48,.08));addDetailBeam(group,keel,ribTop,.045,materials.wood)}const mastBase=wreck.clone(),mastTop=wreck.clone().add(new THREE.Vector3(.18,1.55,-.05));addDetailBeam(group,mastBase,mastTop,.055,materials.wood);addDetailBeam(group,mastTop.clone().add(new THREE.Vector3(-.48,-.3,0)),mastTop.clone().add(new THREE.Vector3(.48,-.3,0)),.035,materials.wood);
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
  const profileStarted=performance.now(),profile:Record<string,number>={};let phaseStarted=profileStarted;
  const city=new THREE.Group(),hitTargets:THREE.Object3D[]=[],labelLayer=new THREE.Group(),detailLayers=new Map<string,THREE.Group>(),streetLayers=new Map<string,THREE.Group>();
  const stone=new THREE.MeshStandardMaterial({color:0x687071,roughness:.86,metalness:.08}),darkStone=new THREE.MeshStandardMaterial({color:0x394245,roughness:.95}),slate=new THREE.MeshStandardMaterial({color:0x46545b,roughness:.82,metalness:.06}),soot=new THREE.MeshStandardMaterial({color:0x29363a,roughness:.88,metalness:.16}),copper=new THREE.MeshStandardMaterial({color:0x9b6847,roughness:.62,metalness:.58}),plaster=new THREE.MeshStandardMaterial({color:0x969087,roughness:.92}),wetWood=new THREE.MeshStandardMaterial({color:0x514037,roughness:.85}),glass=new THREE.MeshPhysicalMaterial({color:0x76e8f2,emissive:0x1e7382,emissiveIntensity:2.7,transparent:true,opacity:.82,roughness:.14,metalness:.2}),water=new THREE.MeshPhysicalMaterial({color:0x1b6671,emissive:0x0c3640,emissiveIntensity:.48,transparent:true,opacity:.9,roughness:.12,metalness:.15}),garden=new THREE.MeshStandardMaterial({color:0x526e4f,roughness:.95});
  city.add(buildTerrain());
  const cobble=new THREE.MeshStandardMaterial({color:0x303d3f,roughness:.72,metalness:.15}),paleStone=new THREE.MeshStandardMaterial({color:0x85857e,roughness:.9}),arcLamp=new THREE.MeshBasicMaterial({color:0x8eefff}),gasLamp=new THREE.MeshBasicMaterial({color:0xf0b265}),redCanvas=new THREE.MeshStandardMaterial({color:0x8b5341,roughness:.82}),tealCanvas=new THREE.MeshStandardMaterial({color:0x41787b,roughness:.82});
  const bandLower=new THREE.MeshBasicMaterial({color:0xa86d4b,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}),bandMid=new THREE.MeshBasicMaterial({color:0x5a9a9b,transparent:true,opacity:.15,depthWrite:false,side:THREE.DoubleSide}),bandUpper=new THREE.MeshBasicMaterial({color:0xb79a68,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide});
  const lowerStone=new THREE.MeshStandardMaterial({color:0x4b5657,roughness:.93,metalness:.04}),lowerPlaster=new THREE.MeshStandardMaterial({color:0x716e67,roughness:.96}),midStone=new THREE.MeshStandardMaterial({color:0x657173,roughness:.88,metalness:.055}),midPlaster=new THREE.MeshStandardMaterial({color:0x918a7f,roughness:.93}),upperStone=new THREE.MeshStandardMaterial({color:0x85857c,roughness:.9,metalness:.04}),upperPlaster=new THREE.MeshStandardMaterial({color:0xaaa294,roughness:.91});
  const lowerArchitecture=createStormhavenArchitectureKit({stone:lowerStone,darkStone,slate,soot,copper,plaster:lowerPlaster,wetWood,glass,garden,window:arcLamp,warmWindow:gasLamp,pipe:copper}),architecture=createStormhavenArchitectureKit({stone:midStone,darkStone,slate,soot,copper,plaster:midPlaster,wetWood,glass,garden,window:arcLamp,warmWindow:gasLamp,pipe:copper}),upperArchitecture=createStormhavenArchitectureKit({stone:upperStone,darkStone:stone,slate,soot,copper,plaster:upperPlaster,wetWood,glass,garden,window:arcLamp,warmWindow:gasLamp,pipe:copper});
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
  // Flat, masonry-edged canals divide the dense masses into lived-in blocks. Their
  // widths and stepped courses follow the painted harbor rather than reading as routes.
  const canalFabric=new THREE.Group();canalFabric.name="canal-fabric";
  FABRIC_CANALS.forEach((path,index)=>addCanalRibbon(canalFabric,path,index===0||index===2?.62:index<5?.46:.36,harborWater,darkStone));
  bakeStaticGroup(canalFabric,"canals",false);city.add(canalFabric);
  profile.contextMs=performance.now()-phaseStarted;phaseStarted=performance.now();
  const wards=new THREE.Group(),streets=new THREE.Group();city.add(wards,streets);
  addUrbanGrid(wards,DISTRICTS[0],mobileGrade?14:17,mobileGrade?9:11,15,10,11,lowerArchitecture,["harbor-house","warehouse","stilt-house"],.82,{openCore:1.9});
  addUrbanGrid(wards,DISTRICTS[1],mobileGrade?10:13,mobileGrade?7:9,11,7,22,lowerArchitecture,["sluice-house","tenement","warehouse"],.75,{openCore:2.05});
  addUrbanGrid(wards,DISTRICTS[2],mobileGrade?12:15,mobileGrade?9:11,12,9,33,architecture,["prism-house","townhouse","glassworks"],.98,{openCore:1.65});
  addUrbanGrid(wards,DISTRICTS[3],mobileGrade?12:15,mobileGrade?10:12,12.5,10.5,44,architecture,["furnace-house","glassworks","warehouse"],1.08,{openCore:2.75});
  addUrbanGrid(wards,DISTRICTS[4],mobileGrade?15:18,mobileGrade?11:13,17,11,55,lowerArchitecture,["whisper-house","tenement","canal-house"],.87,{lean:.045,openCore:1.15});
  addUrbanGrid(wards,DISTRICTS[5],mobileGrade?12:15,mobileGrade?9:11,15,9,66,upperArchitecture,["salon-house","tower-house","townhouse"],1.5,{openCore:2.15});
  addUrbanGrid(wards,DISTRICTS[6],mobileGrade?8:10,mobileGrade?7:8,12,9,77,upperArchitecture,["cantor-house","greenhouse","townhouse"],.92,{openCore:3.1});
  addUrbanGrid(wards,DISTRICTS[7],mobileGrade?11:14,mobileGrade?9:11,11,9.5,88,upperArchitecture,["prayer-house","shrine","townhouse"],1.08,{openCore:2.85});
  addUrbanGrid(wards,DISTRICTS[8],mobileGrade?12:15,mobileGrade?10:12,14,12,99,architecture,["terrace-house","bathhouse","greenhouse"],.82,{openCore:2.85});
  addUrbanGrid(wards,DISTRICTS[9],mobileGrade?13:16,mobileGrade?9:11,15,9,110,lowerArchitecture,["sinkhouse","stilt-house","ruin"],.74,{lean:.1,openCore:1.65});
  addMapFabric(wards,{lower:lowerArchitecture,mid:architecture,upper:upperArchitecture},mobileGrade);

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

  // Four civic terraces carry the city. Short local streets branch from them, but
  // the old diagrammatic district-to-district links are reserved for Route overlay.
  FABRIC_STREETS.forEach((path,index)=>addStreet(streets,path,index===0?.3:index===1?.34:index===2?.29:.22,index>1?paleStone:cobble,.11));
  addStreet(streets,[[42,13],[45,14],[48,15],[51,14],[55,16]],.32,cobble); // Murk Street
  addStreet(streets,[[19,18],[21,21],[22,24],[25,26]],.3,paleStone);
  addStreet(streets,[[26,25.7],[28,25.5],[30,25.25],[32,25],[34.6,24.7]],.34,cobble,.13); // Steamer's Row
  addStreet(streets,[[26.2,27.4],[29,27.1],[32,26.8],[35,26.4]],.16,cobble,.12);
  addStreet(streets,[[81,31],[84,33],[88,37]],.5,paleStone);
  addStreet(streets,[[71,43],[74,45],[78,47]],.2,paleStone);
  addStreet(streets,[[83,9],[86,7],[91,5]],.2,wetWood,.16);
  addStreet(streets,[[7,9],[11,8],[15,9]],.3,wetWood,.15);
  addStairs(streets,[19,19,17],[22,24,26],12,.42,paleStone);
  addStairs(streets,[31,30,30],[35,35,35],10,.38,paleStone);
  addStairs(streets,[52,42,39],[56,48,44],13,.42,paleStone);
  addStairs(streets,[73,42,37],[78,38,32],11,.5,paleStone);
  addStairs(streets,[82,32,30],[80,28,44],14,.42,paleStone);
  addStairs(streets,[48,47,40],[44,51,44],10,.3,paleStone);
  addStairs(streets,[53,50,44],[59,53,45],11,.32,paleStone);
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
  profile.fabricGenerateMs=performance.now()-phaseStarted;phaseStarted=performance.now();
  const buildingDraws=bakeStaticGroup(wards,"city-fabric",!mobileGrade);
  const streetDraws=bakeStaticGroup(streets,"street-fabric",false);
  profile.fabricBakeMs=performance.now()-phaseStarted;phaseStarted=performance.now();
  let neighborhoodDraws=0;
  DISTRICTS.forEach((district,index)=>{
    const layer=new THREE.Group();layer.name=`neighborhood-${district.short.toLowerCase().replaceAll(" ","-")}`;layer.visible=false;
    addNeighborhoodLayer(layer,district,{stone,darkStone,cobble,paleStone,copper,wood:wetWood,water,garden,arc:arcLamp,warm:gasLamp,redCanvas,tealCanvas,glass},7300+index*503);
    neighborhoodDraws+=bakeStaticGroup(layer,layer.name,false);streetLayers.set(district.name,layer);city.add(layer);
  });
  profile.neighborhoodMs=performance.now()-phaseStarted;phaseStarted=performance.now();

  let landmarkDraws=0;
  const beacon=new THREE.Group(),beaconShell=new THREE.Group(),bp=cityPos(25,30,30);beacon.position.copy(bp);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.9,2.6,12),copper),spire=new THREE.Mesh(new THREE.CylinderGeometry(.3,1.5,17.2,8),glass),needle=new THREE.Mesh(new THREE.ConeGeometry(.34,4.1,7),glass);base.position.y=1.3;spire.position.y=11.1;needle.position.y=21.75;beaconShell.add(base,spire,needle);
  [5.6,10.2,14.8].forEach((height,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25-i*.2,.12,7,28),copper);ring.rotation.x=Math.PI/2;ring.position.y=height;beaconShell.add(ring)});landmarkDraws+=bakeStaticGroup(beaconShell,"beacon-shell",!mobileGrade);
  const beaconLight=new THREE.PointLight(0x64ddff,55,34,1.8);beaconLight.position.y=14;beacon.add(beaconShell,beaconLight);city.add(beacon);

  const summitLandmarks=new THREE.Group(),towers=[{x:56.5,y:53,top:95},{x:60,y:55,top:115},{x:63.4,y:52.2,top:105}],towerMeshes:THREE.Mesh[]=[];
  towers.forEach((tower,i)=>{const h=(tower.top-45)*V,p=cityPos(tower.x,tower.y,45),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.72,1.18,h,7),i===1?plaster:stone);mesh.position.set(p.x,p.y+h/2,p.z);mesh.castShadow=true;summitLandmarks.add(mesh);const cap=new THREE.Mesh(new THREE.ConeGeometry(.8,1.65,7),slate);cap.position.set(p.x,p.y+h+.8,p.z);summitLandmarks.add(cap);towerMeshes.push(mesh)});
  [[0,1],[1,2],[0,2]].forEach(([a,b],i)=>{const pa=towerMeshes[a].position.clone(),pb=towerMeshes[b].position.clone();pa.y=pb.y=cityPos(60,54,[60,70,80][i]).y;const mid=pa.clone().lerp(pb,.5),len=pa.distanceTo(pb),bridge=new THREE.Mesh(new THREE.BoxGeometry(.25,.18,len),copper);bridge.position.copy(mid);bridge.lookAt(pb);summitLandmarks.add(bridge)});landmarkDraws+=bakeStaticGroup(summitLandmarks,"summit-landmarks",!mobileGrade);city.add(summitLandmarks);

  const eye=new THREE.Group(),ep=cityPos(84,33,30);eye.position.copy(ep);const nave=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.5,2.2),plaster),transept=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.15,4.1),stone);nave.position.y=1.25;transept.position.y=1.1;eye.add(nave,transept);[[-1.45,-.75],[1.45,-.75],[-1.45,.75],[1.45,.75]].forEach(([x,z])=>{const sp=new THREE.Mesh(new THREE.ConeGeometry(.52,2.9,5),slate);sp.position.set(x,3.55,z);eye.add(sp)});landmarkDraws+=bakeStaticGroup(eye,"eye",!mobileGrade);city.add(eye);

  // One consolidated signature layer gives every ward a readable city-scale
  // silhouette while remaining a handful of material buckets after baking.
  const citySignatures=new THREE.Group();citySignatures.name="district-signatures";
  const groveRandom=seeded(7521);
  for(let i=0;i<92;i++){
    const x=44+(groveRandom()-.5)*13,y=49+(groveRandom()-.5)*10,p=cityPos(x,y,Math.min(45,terrainHeight(x,y))),trunkHeight=.7+groveRandom()*.5,crownRadius=.38+groveRandom()*.38;
    addDetailCylinder(citySignatures,p,trunkHeight,.085,wetWood,(groveRandom()-.5)*.16);
    const crown=new THREE.Mesh(DETAIL_ICOSAHEDRON,garden);crown.position.set(p.x,p.y+trunkHeight+.35+groveRandom()*.45,p.z);crown.scale.set(crownRadius,crownRadius*.86,crownRadius);citySignatures.add(crown);
    if(i%5===0){const graft=p.clone();graft.y+=trunkHeight*.48;addDetailCylinder(citySignatures,graft,trunkHeight*.72,.028,glass,(groveRandom()-.5)*.2)}
  }
  const rainPools:THREE.Vector3[]=[];
  for(let i=0;i<15;i++){const t=i/14,x=80-t*10,y=28-t*14,z=48-t*23,p=cityPos(x,y,z);addDetailBox(citySignatures,p,[3.2+t*.8,.24,1.2],stone,.2);const pool=p.clone();pool.y+=.16;addDetailBox(citySignatures,pool,[2.55+t*.7,.08,.76],water,.2);rainPools.push(pool)}
  for(let i=0;i<rainPools.length-1;i++)addDetailBeam(citySignatures,rainPools[i].clone().add(new THREE.Vector3(0,.08,0)),rainPools[i+1].clone().add(new THREE.Vector3(0,.08,0)),.075,water);
  const radianceRandom=seeded(2202);
  for(let i=0;i<18;i++){const x=22+(radianceRandom()-.5)*8,y=22+(radianceRandom()-.5)*7,p=cityPos(x,y);p.y+=.8+radianceRandom();addDetailOctahedron(citySignatures,p,.18+radianceRandom()*.18,glass)}
  for(let i=0;i<8;i++){const x=18.5+i,y=19+(i%2)*5,p=cityPos(x,y);addDetailBox(citySignatures,p.clone().add(new THREE.Vector3(0,1.15,0)),[.12,2.1,.7],glass,.08+(i%2?-.16:.16),(i%2?-.12:.12));p.y+=2.38;addDetailOctahedron(citySignatures,p,.16,arcLamp)}

  for(let i=0;i<7;i++){const x=5.5+i*1.65,y=2.2+(i%2)*1.15,p=cityPos(x,y,.3);p.z+=1.5;p.y+=.05;addDetailBox(citySignatures,p,[1,.12,4+(i%3)],wetWood)}
  const boatRandom=seeded(118);
  for(let i=0;i<12;i++){const x=5+boatRandom()*14,y=-1+boatRandom()*8,p=cityPos(x,y,.2);addDetailBox(citySignatures,p,[.65,.12,1.45],wetWood,(boatRandom()-.5)*1.2);addDetailCylinder(citySignatures,p,1.2,.022,wetWood)}
  addDetailArch(citySignatures,cityPos(10,10,3),.88,1.35,.8,paleStone,.08);
  const echoBase=cityPos(13,6,12);addDetailCylinder(citySignatures,echoBase,3.4,.34,copper);const echoCrown=echoBase.clone();echoCrown.y+=3.55;addDetailOctahedron(citySignatures,echoCrown,.42,glass);addDetailCone(citySignatures,echoCrown.clone().add(new THREE.Vector3(0,.3,0)),.8,.38,slate);

  const spill=cityPos(38,5,3);
  [1.1,1.8,2.6].forEach((radius,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.1,6,36),i===0?water:copper);ring.rotation.x=Math.PI/2;ring.position.set(spill.x,spill.y+.04+i*.04,spill.z);citySignatures.add(ring)});
  for(const gateX of[35.8,38,40.2]){const left=cityPos(gateX,6.4,4),right=cityPos(gateX,4.9,4);addDetailCylinder(citySignatures,left,1.25,.09,copper);addDetailCylinder(citySignatures,right,1.25,.09,copper);left.y+=1.12;right.y+=1.12;addDetailBeam(citySignatures,left,right,.12,darkStone);const warning=left.clone().lerp(right,.5);warning.y+=.24;addDetailOctahedron(citySignatures,warning,.11,arcLamp)}

  const whisperRandom=seeded(4515);
  for(let i=0;i<14;i++){const x=43+whisperRandom()*10,y=12+whisperRandom()*6,p=cityPos(x,y);addDetailCylinder(citySignatures,p,.72,.03,copper,(whisperRandom()-.5)*.12);p.y+=.83;addDetailOctahedron(citySignatures,p,.075+whisperRandom()*.035,i%4===0?gasLamp:glass)}

  const wreck=cityPos(82.2,5.7,2),wreckBow=wreck.clone().add(new THREE.Vector3(-1.6,.28,.5)),wreckStern=wreck.clone().add(new THREE.Vector3(1.55,-.05,-.45));addDetailBeam(citySignatures,wreckBow,wreckStern,.3,wetWood);
  for(const offset of[-1.05,-.52,0,.52,1.05]){const ribBase=wreck.clone().add(new THREE.Vector3(offset,0,-offset*.28)),ribTop=ribBase.clone().add(new THREE.Vector3(0,.72,.12));addDetailBeam(citySignatures,ribBase,ribTop,.06,wetWood)}
  addDetailBeam(citySignatures,wreck,wreck.clone().add(new THREE.Vector3(.25,2.35,-.08)),.075,wetWood);
  for(const [x,y,radius] of [[80.5,8,.8],[86.5,6.2,1.05],[91,9,.72]] as Array<[number,number,number]>)addDetailCylinder(citySignatures,cityPos(x,y,1.4),.06,radius,water);
  landmarkDraws+=bakeStaticGroup(citySignatures,"district-signatures",false);city.add(citySignatures);

  const infrastructure=new THREE.Group();infrastructure.name="infrastructure";
  addCurve(infrastructure,[[25,30,30],[40,38,32],[50,45,38],[58,52,45]],0xc58552,.075,.9);addCurve(infrastructure,[[60,52,45],[72,44,35],[82,36,30],[84,33,30]],0xc58552,.075,.9);addCurve(infrastructure,[[56,52,45],[48,42,35],[38,32,25],[28,22,15],[18,14,8],[12,10,3]],0xc58552,.06,.75);
  addCurve(infrastructure,[[46,15,15],[40,14,12],[32,12,8],[24,10,4],[16,8,2],[10,6,0]],0x2d8fa1,.34,.95);addCurve(infrastructure,[[70,14,25],[64,14,22],[58,14,18],[52,14,16],[46,14,15]],0x2d8fa1,.3,.95);addCurve(infrastructure,[[82,28,18],[72,26,16],[62,24,14],[52,22,12],[42,20,10],[32,16,6]],0x2d8fa1,.26,.85);
  addBridge(infrastructure,40,14,12,.65,1.55,Math.PI/2,copper);addBridge(infrastructure,32,12,8,.62,1.4,Math.PI/2,wetWood);addBridge(infrastructure,58,14,18,.68,1.45,Math.PI/2,stone);addBridge(infrastructure,72,26,16,.75,1.6,Math.PI/2,copper);addBridge(infrastructure,52,22,12,.7,1.5,Math.PI/2,stone);infrastructure.visible=false;city.add(infrastructure);

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
    const sites=LOCAL_SITES[district.name]??[],[anchorX,anchorY]=neighborhoodAnchor(district),neighborhoodSites=new Set([...sites].sort((a,b)=>Math.hypot(a.x-anchorX,a.y-anchorY)-Math.hypot(b.x-anchorX,b.y-anchorY)).slice(0,6).map(site=>site.name));
    for(const site of sites){
      const sitePosition=cityPos(site.x,site.y,site.z),stem=new THREE.Mesh(new THREE.CylinderGeometry(.018,.035,.52,6),haloMaterial),marker=new THREE.Mesh(new THREE.OctahedronGeometry(.09,0),haloMaterial);
      const neighborhood=neighborhoodSites.has(site.name);stem.userData.neighborhood=neighborhood;marker.userData.neighborhood=neighborhood;stem.position.set(sitePosition.x,sitePosition.y+.26,sitePosition.z);marker.position.set(sitePosition.x,sitePosition.y+.6,sitePosition.z);detailLayer.add(stem,marker);
      const siteElement=document.createElement("div");siteElement.className=`poi-label${site.visited?" is-visited":""}`;siteElement.textContent=site.name;if(site.note)siteElement.title=site.note;const siteLabel=new CSS2DObject(siteElement);siteLabel.userData.neighborhood=neighborhood;siteLabel.position.set(sitePosition.x,sitePosition.y+.82,sitePosition.z);detailLayer.add(siteLabel);
    }
    detailLayers.set(district.name,detailLayer);city.add(detailLayer);
  });
  STORY_LABELS.forEach(story=>{
    const p=cityPos(story.x,story.y,story.z),element=document.createElement("button");element.className="story-label";element.textContent=story.name;element.setAttribute("aria-label",`Follow the party to ${story.name}`);element.addEventListener("click",event=>{event.stopPropagation();selectDistrict(story.district,{name:story.name,x:story.x,y:story.y,z:story.z,visited:true})});
    const label=new CSS2DObject(element);label.position.set(p.x,p.y+1.15,p.z);labelLayer.add(label);
  });city.add(labelLayer);profile.landmarkAndLabelMs=performance.now()-phaseStarted;profile.totalMs=performance.now()-profileStarted;
  return{city,hitTargets,labelLayer,detailLayers,streetLayers,selectionHalo,haloMaterial,infrastructure,beaconLight,staticDrawCalls:buildingDraws+streetDraws+neighborhoodDraws+landmarkDraws,profile};
}

type SceneApi={focus:(district:District)=>void;focusSite:(district:District,site:LocalSite)=>void;street:(district:District)=>void;cityView:()=>void;setAtlas:(atlas:boolean)=>void;setLabels:(visible:boolean)=>void;setInfrastructure:(visible:boolean)=>void};

export function StormhavenMap(){
  const hostRef=useRef<HTMLDivElement>(null),apiRef=useRef<SceneApi|null>(null);
  const [selected,setSelected]=useState<District>(DISTRICTS[3]),[atlas,setAtlas]=useState(false),[labels,setLabels]=useState(true),[routes,setRoutes]=useState(false),[lens,setLens]=useState(false),[reference,setReference]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    const sceneBuildStarted=performance.now();
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
    const cityBuildStarted=performance.now(),{city,hitTargets,labelLayer,detailLayers,streetLayers,selectionHalo,haloMaterial,infrastructure,beaconLight,staticDrawCalls,profile}=createCity((name,site)=>{const district=DISTRICTS.find(item=>item.name===name);if(district){setSelected(district);setAtlas(false);setLabels(true);setLens(Boolean(site));if(site)apiRef.current?.focusSite(district,site);else apiRef.current?.focus(district)}},mobileGrade),cityBuildMs=performance.now()-cityBuildStarted;scene.add(city);
    const clouds=new THREE.Group(),cloudMaterial=new THREE.MeshStandardMaterial({color:mobileGrade?0x263b41:0x16262c,transparent:true,opacity:mobileGrade ? .44 : .56,roughness:1,depthWrite:false}),cloudRandom=seeded(903),cloudCount=mobileGrade?12:22,cloudGeometry=new THREE.IcosahedronGeometry(1,mobileGrade?0:1),cloudMesh=new THREE.InstancedMesh(cloudGeometry,cloudMaterial,cloudCount),cloudMatrix=new THREE.Matrix4();for(let i=0;i<cloudCount;i++){const scale=5+cloudRandom()*9;cloudMatrix.compose(new THREE.Vector3((cloudRandom()-.5)*115,20+cloudRandom()*8,(cloudRandom()-.5)*75),new THREE.Quaternion(),new THREE.Vector3(scale,scale*(.15+cloudRandom()*.1),scale));cloudMesh.setMatrixAt(i,cloudMatrix)}cloudMesh.instanceMatrix.needsUpdate=true;clouds.add(cloudMesh);scene.add(clouds);
    const rainCount=mobileGrade?420:1100,rainPositions=new Float32Array(rainCount*3),rainSpeeds=new Float32Array(rainCount),rainRandom=seeded(8844);for(let i=0;i<rainCount;i++){rainPositions[i*3]=(rainRandom()-.5)*105;rainPositions[i*3+1]=rainRandom()*34;rainPositions[i*3+2]=(rainRandom()-.5)*74;rainSpeeds[i]=7+rainRandom()*7}const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute("position",new THREE.BufferAttribute(rainPositions,3));rainGeometry.setAttribute("aSpeed",new THREE.BufferAttribute(rainSpeeds,1));const rainMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:mobileGrade ? .22 : .35}},vertexShader:`uniform float uTime;attribute float aSpeed;void main(){vec3 p=position;p.y=mod(position.y-uTime*aSpeed+34.0,34.0);p.x-=mod(uTime*aSpeed*.035,3.0);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=1.35;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uOpacity;void main(){gl_FragColor=vec4(.68,.84,.86,uOpacity);}`});const rain=new THREE.Points(rainGeometry,rainMaterial);scene.add(rain);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown={x:0,y:0};const onDown=(event:PointerEvent)=>{pointerDown={x:event.clientX,y:event.clientY}},onClick=(event:PointerEvent)=>{if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=-(event.clientY-bounds.top)/bounds.height*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit?.object.userData.district){const district=DISTRICTS.find(item=>item.name===hit.object.userData.district);if(district){setSelected(district);setAtlas(false);setLabels(true);setLens(false);apiRef.current?.focus(district)}}};renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onClick);
    let labelsDirty=true;const labelCameraPosition=new THREE.Vector3(),labelCameraQuaternion=new THREE.Quaternion();
    const tweenCamera=(position:THREE.Vector3,target:THREE.Vector3)=>{const fromPosition=camera.position.clone(),fromTarget=controls.target.clone(),start=performance.now(),duration=950,tick=(time:number)=>{const raw=Math.min(1,(time-start)/duration),eased=1-Math.pow(1-raw,3);camera.position.lerpVectors(fromPosition,position,eased);controls.target.lerpVectors(fromTarget,target,eased);labelsDirty=true;if(raw<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
    let activeDistrict:District|undefined;
    const showDistrict=(district?:District,showLabels=true,showNeighborhood=false)=>{
      labelsDirty=true;
      activeDistrict=district;
      detailLayers.forEach((layer,name)=>{layer.visible=Boolean(district&&showLabels&&name===district.name);layer.children.forEach(child=>{child.visible=!showNeighborhood||Boolean(child.userData.neighborhood)})});
      streetLayers.forEach((layer,name)=>{layer.visible=Boolean(district&&showNeighborhood&&name===district.name)});
      labelLayer.visible=!district&&showLabels;
      selectionHalo.visible=Boolean(district&&!showNeighborhood);
      if(district){
        const target=cityPos(district.x,district.y,district.z),scale=DISTRICT_FOCUS_SCALE[district.name]??[1,1];
        selectionHalo.position.set(target.x,target.y+.15,target.z);selectionHalo.scale.set(scale[0],scale[1],1);haloMaterial.color.set(district.color);
      }
    };
    const cityCamera=()=>new THREE.Vector3(mobileGrade?-63:-47,mobileGrade?74:45,mobileGrade?103:64);
    const lensOffset=(district:District)=>district.name==="The Beacon"?(mobileGrade?new THREE.Vector3(11.5,12,-15):new THREE.Vector3(8.5,7.8,-10.5)):(mobileGrade?new THREE.Vector3(10,11.5,16):new THREE.Vector3(7.2,7.8,10.2));
    const cityView=()=>{labelsDirty=true;activeDistrict=undefined;setLens(false);detailLayers.forEach(layer=>{layer.visible=false});streetLayers.forEach(layer=>{layer.visible=false});selectionHalo.visible=false;labelLayer.visible=true;clouds.visible=true;tweenCamera(cityCamera(),new THREE.Vector3(4,3.2,0))};
    apiRef.current={
      focus:district=>{setLens(false);clouds.visible=true;showDistrict(district,true,false);const target=cityPos(district.x,district.y,district.z),offset=district.name==="The Beacon"?new THREE.Vector3(-6.4,6.7,8.7):new THREE.Vector3(-5.2,4.5,7.1);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.9,0)))},
      focusSite:(district,site)=>{setLens(true);clouds.visible=false;showDistrict(district,true,true);const target=cityPos(site.x,site.y,site.z),offset=lensOffset(district);selectionHalo.position.set(target.x,target.y+.14,target.z);selectionHalo.scale.set(.34,.34,1);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.55,0)))},
      street:district=>{setLens(true);clouds.visible=false;showDistrict(district,true,true);const [x,y,z]=neighborhoodAnchor(district),target=cityPos(x,y,z),offset=lensOffset(district);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,.55,0)))},
      cityView,
      setAtlas:enabled=>{labelsDirty=true;activeDistrict=undefined;setLens(false);detailLayers.forEach(layer=>{layer.visible=false});streetLayers.forEach(layer=>{layer.visible=false});selectionHalo.visible=false;labelLayer.visible=true;clouds.visible=!enabled;if(enabled)tweenCamera(new THREE.Vector3(0,mobileGrade?98:90,.01),new THREE.Vector3(0,0,0));else cityView()},
      setLabels:visible=>{labelsDirty=true;labelLayer.visible=visible&&!activeDistrict;detailLayers.forEach((layer,name)=>{layer.visible=visible&&name===activeDistrict?.name})},
      setInfrastructure:visible=>{infrastructure.visible=visible}
    };
    const onResize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.setSize(host.clientWidth,host.clientHeight);labelsDirty=true};window.addEventListener("resize",onResize);
    const metricWindow=window as Window&{__stormhavenMetrics?:Record<string,number|boolean>},startedAt=performance.now(),initMs=startedAt-sceneBuildStarted;host.dataset.initMs=initMs.toFixed(1);host.dataset.cityBuildMs=cityBuildMs.toFixed(1);host.dataset.buildProfile=JSON.stringify(Object.fromEntries(Object.entries(profile).map(([key,value])=>[key,Math.round(value)])));let animation=0,metricStarted=startedAt,metricFrames=0,metricWorkMs=0,metricLabelMs=0,metricLabelRenders=0,adaptiveDone=false,firstFrame=true;
    const animate=(now:number)=>{animation=requestAnimationFrame(animate);if(document.hidden)return;const workStarted=performance.now(),elapsed=(now-startedAt)/1000;controls.update();if(camera.position.distanceToSquared(labelCameraPosition)>1e-8||1-Math.abs(camera.quaternion.dot(labelCameraQuaternion))>1e-12)labelsDirty=true;clouds.position.x=Math.sin(elapsed*.035)*5;rainMaterial.uniforms.uTime.value=elapsed;beaconLight.intensity=48+Math.sin(elapsed*2.7)*8;renderer.render(scene,camera);if(labelsDirty){const labelStarted=performance.now();labelRenderer.render(scene,camera);metricLabelMs+=performance.now()-labelStarted;metricLabelRenders++;labelsDirty=false;labelCameraPosition.copy(camera.position);labelCameraQuaternion.copy(camera.quaternion)}metricWorkMs+=performance.now()-workStarted;if(firstFrame){firstFrame=false;host.dataset.firstFrameMs=(performance.now()-sceneBuildStarted).toFixed(1)}metricFrames++;const metricSpan=now-metricStarted;if(metricSpan>=1000){const fps=metricFrames*1000/metricSpan,metrics={fps:Math.round(fps),frameCpuMs:Number((metricWorkMs/metricFrames).toFixed(2)),labelCpuMs:Number((metricLabelMs/metricFrames).toFixed(2)),labelRenders:metricLabelRenders,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,points:renderer.info.render.points,staticDrawCalls,pixelRatio:renderer.getPixelRatio(),mobileGrade,shadows:renderer.shadowMap.enabled,initMs:Math.round(initMs),cityBuildMs:Math.round(cityBuildMs)};metricWindow.__stormhavenMetrics=metrics;host.dataset.performance=JSON.stringify(metrics);if(!adaptiveDone&&now-startedAt>2200){adaptiveDone=true;if(fps<48&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);renderer.setSize(host.clientWidth,host.clientHeight)}}metricFrames=0;metricWorkMs=0;metricLabelMs=0;metricLabelRenders=0;metricStarted=now}};animation=requestAnimationFrame(animate);setReady(true);
    return()=>{cancelAnimationFrame(animation);window.removeEventListener("resize",onResize);renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onClick);controls.dispose();renderer.dispose();delete metricWindow.__stormhavenMetrics;delete host.dataset.performance;delete host.dataset.initMs;delete host.dataset.cityBuildMs;delete host.dataset.buildProfile;delete host.dataset.firstFrameMs;scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material?.dispose())}});host.replaceChildren();apiRef.current=null};
  },[]);
  const choose=(district:District)=>{setSelected(district);setAtlas(false);setLabels(true);setLens(false);apiRef.current?.focus(district)};
  return <main className="stormhaven-shell">
    <div ref={hostRef} className="map-canvas" role="img" aria-label="Interactive three-dimensional map of Stormhaven and its ten districts" />
    {!ready&&<div className="loading-mark">Charting the storm</div>}
    <header className="topbar"><div className="brand"><p className="eyebrow">A living atlas · year 503 A.S.</p><h1>Stormhaven</h1><span className="brand-note">Elevation is privilege. Everything else runs downhill.</span></div><div className="controls" aria-label="Map controls">
      <button className="control-button" type="button" onClick={()=>{setAtlas(false);setLabels(true);setLens(false);apiRef.current?.cityView()}}>City view</button>
      <button className="control-button" type="button" aria-pressed={atlas} onClick={()=>{const next=!atlas;setAtlas(next);setLabels(true);setLens(false);apiRef.current?.setAtlas(next)}}>{atlas?"Perspective":"Atlas view"}</button>
      <button className="control-button" type="button" aria-pressed={routes} onClick={()=>{const next=!routes;setRoutes(next);apiRef.current?.setInfrastructure(next)}}>Routes</button>
      <button className="control-button" type="button" aria-pressed={labels} onClick={()=>{const next=!labels;setLabels(next);apiRef.current?.setLabels(next)}}>Labels</button>
      <button className="control-button" type="button" aria-pressed={lens} onClick={()=>{setAtlas(false);setLabels(true);setLens(true);apiRef.current?.street(selected)}}>Neighborhood lens</button>
      <button className="control-button" type="button" onClick={()=>setReference(true)}>Source map</button>
    </div></header>
    <nav className="district-nav" aria-label="Stormhaven districts">{DISTRICTS.map(district=><button key={district.name} type="button" className={`district-button ${selected.name===district.name?"is-active":""}`} onClick={()=>choose(district)}>{district.short}</button>)}</nav>
    <aside className={`detail-panel${atlas?" is-atlas":""}${lens?" is-lens":""}`} style={{"--district-color":selected.color} as React.CSSProperties} aria-live="polite"><div className="detail-kicker"><span>{selected.kind}</span><span>Pop. {selected.population}</span></div><h2>{selected.name}</h2><p>{selected.description}</p><div className="local-sites"><span className="local-sites-label">Mapped landmarks · gold marks the party trail</span><div className="local-site-list">{(LOCAL_SITES[selected.name]??[]).map(site=><span className={`local-site${site.visited?" is-visited":""}`} title={site.note} key={site.name}>{site.name}</span>)}</div></div><div className="coordinates"><span><b>X</b> {selected.x}</span><span><b>Y</b> {selected.y}</span><span><b>Z</b> {selected.z}m</span><span>1 unit = 30m</span></div></aside>
    <div className="map-hint">Click a ward to enter · Neighborhood lens reveals streets · drag to orbit · City view returns</div>
    <div className="city-band-legend" aria-label="Stormhaven elevation bands">{CITY_BANDS.map(band=><span key={band.name} title={band.description} style={{"--band-color":band.color} as React.CSSProperties}><i />{band.name}</span>)}</div>
    <div className="compass" aria-hidden="true" />
    {reference&&<div className="reference-backdrop" role="dialog" aria-modal="true" aria-label="Original Stormhaven cartographer map" onClick={()=>setReference(false)}><div className="reference-plate" onClick={event=>event.stopPropagation()}><img src="/assets/stormhaven-cartographer-reference.webp" alt="Original painted map of Stormhaven used as the architectural and compositional reference" /><button type="button" className="control-button reference-close" onClick={()=>setReference(false)}>Close</button></div></div>}
  </main>;
}
