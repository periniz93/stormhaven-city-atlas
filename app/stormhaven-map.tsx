"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";

type District = { name:string; short:string; x:number; y:number; z:number; color:string; kind:string; population:string; description:string };

const DISTRICTS: District[] = [
  { name:"The Sea Ward",short:"Sea Ward",x:11,y:8,z:2,color:"#6ea6b2",kind:"Harbor · Lower city",population:"10,500",description:"Storm-battered quays, stilt warehouses and working canals crowd the western shoreline. The city arrives here wet, indebted, and looking for work." },
  { name:"The Spillway",short:"Spillway",x:38,y:5,z:3,color:"#a96d46",kind:"Drainage basin · Lower city",population:"2,500",description:"Three sluices carry the upper city’s poison into one low basin. Rust, Arc runoff and cheap lives settle together." },
  { name:"Radiance",short:"Radiance",x:22,y:22,z:28,color:"#d98965",kind:"Prism ward · Middle city",population:"6,000",description:"Mirror canyons catch the Beacon’s spill-light and sell it back to the city. Beautiful from a distance. Blinding up close." },
  { name:"The Beacon",short:"Beacon",x:25,y:30,z:30,color:"#75eaff",kind:"Arc works · Western anchor",population:"2,500",description:"A 170-metre stormglass and brass tower cages the lightning. Around its foot, the GlassWorks furnaces never go dark." },
  { name:"The Whispers",short:"Whispers",x:48,y:15,z:15,color:"#8a7cab",kind:"Fog depression · Lower city",population:"6,500",description:"Fog pools between cramped platforms and gives old conversations back at the wrong time. Every door has another exit." },
  { name:"Summit",short:"Summit",x:60,y:54,z:45,color:"#d8b978",kind:"Noble ridge · Upper city",population:"4,000",description:"Dry bridges stitch the Great Houses together above the rain. Their towers are clean because the cost runs downhill." },
  { name:"The Grove",short:"Grove",x:75,y:45,z:38,color:"#76a56e",kind:"Choir terraces · Upper city",population:"1,500",description:"Public gardens rise through Cantor terraces to a restricted canopy level with the bases of Summit’s towers." },
  { name:"The Eye",short:"The Eye",x:85,y:35,z:30,color:"#9dc2c9",kind:"Synod precinct · Eastern anchor",population:"4,500",description:"A stormglass cathedral still remembers when lightning chose it. Copper prayer-lines hum beneath a severe public square." },
  { name:"Raincatcher’s Ward",short:"Raincatcher",x:76,y:20,z:38,color:"#58b5b2",kind:"Water terraces · Middle city",population:"3,500",description:"Fifteen gardens step from z48 to z25, aging stormwater into clarity while every lower basin inherits what came before." },
  { name:"Foggy Bottoms",short:"Foggy Bottoms",x:86,y:7,z:7,color:"#718467",kind:"Swamp edge · Lower city",population:"3,500",description:"Platforms sag into the eastern marsh. Pre-Sundering stone shows through the mud wherever the district has not sunk yet." },
];

const S=.78, V=.12;
function terrainHeight(x:number,y:number){
  let h=4+40*Math.pow(Math.max(0,y)/58,1.13);
  h+=3.6*Math.exp(-((x-60)**2)/520-((y-52)**2)/150);
  h-=15*Math.exp(-((x-7)**2)/180-((y-8)**2)/170);
  h-=13*Math.exp(-((x-96)**2)/150-((y-8)**2)/170);
  h-=5.5*Math.exp(-((x-38)**2)/85-((y-5)**2)/40);
  h-=1.8*Math.exp(-((x-48)**2)/90-((y-15)**2)/65);
  h+=6*Math.exp(-((x-25)**2)/125-((y-30)**2)/90);
  h+=5*Math.exp(-((x-85)**2)/95-((y-35)**2)/80);
  return Math.max(-1,h);
}
function cityPos(x:number,y:number,elevation=terrainHeight(x,y)){ return new THREE.Vector3((x-50)*S,elevation*V,(30-y)*S); }
function seeded(seed:number){ let t=seed>>>0; return()=>{t+=0x6d2b79f5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}; }

function addBox(group:THREE.Group,x:number,y:number,w:number,d:number,h:number,material:THREE.Material,roof=false){
  const p=cityPos(x,y), mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(p.x,p.y+h/2,p.z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
  if(roof){const capH=Math.max(.35,h*.22);const cap=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,capH,4),material);cap.position.set(p.x,p.y+h+capH/2,p.z);cap.rotation.y=Math.PI/4;cap.castShadow=true;group.add(cap)}
  return mesh;
}
function addDenseWard(group:THREE.Group,district:District,count:number,radiusX:number,radiusY:number,seed:number,palette:THREE.Material[],tall=1){
  const random=seeded(seed);
  for(let i=0;i<count;i++){const angle=random()*Math.PI*2,radius=Math.sqrt(random()),x=district.x+Math.cos(angle)*radiusX*radius,y=district.y+Math.sin(angle)*radiusY*radius,w=(.45+random()*.55)*S,d=(.45+random()*.7)*S,h=(.45+random()*1.45)*tall;addBox(group,x,y,w,d,h,palette[Math.floor(random()*palette.length)],random()>.42)}
}
function addCurve(group:THREE.Group,points:Array<[number,number,number]>,color:number,width:number,opacity=1){
  const curve=new THREE.CatmullRomCurve3(points.map(([x,y,z])=>cityPos(x,y,z)));
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(24,points.length*9),width,5,false),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity}));group.add(tube);return tube;
}
function buildTerrain(){
  const geometry=new THREE.BufferGeometry(),vertices:number[]=[],colors:number[]=[],indices:number[]=[],nx=71,ny=45,color=new THREE.Color();
  const isLand=(x:number,y:number)=>((x-51)/53)**2+((y-29)/34)**2<1&&x>1.5&&x<98&&y>-1&&y<61;
  for(let iy=0;iy<ny;iy++){const y=iy/(ny-1)*62-1;for(let ix=0;ix<nx;ix++){const x=ix/(nx-1)*102-1,h=terrainHeight(x,y),p=cityPos(x,y,h);vertices.push(p.x,p.y,p.z);color.set(h<8?"#273e3d":h<22?"#36433d":h<38?"#454944":"#55554d");const n=(Math.sin(x*2.13+y*.71)+1)*.018-.012;colors.push(color.r+n,color.g+n,color.b+n)}}
  for(let iy=0;iy<ny-1;iy++)for(let ix=0;ix<nx-1;ix++){const a=iy*nx+ix,b=a+1,c=a+nx,d=c+1,x=(ix+.5)/(nx-1)*102-1,y=(iy+.5)/(ny-1)*62-1;if(isLand(x,y))indices.push(a,c,b,b,c,d)}
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:.03,flatShading:true}));mesh.receiveShadow=true;return mesh;
}

function createCity(selectDistrict:(name:string)=>void){
  const city=new THREE.Group(),hitTargets:THREE.Object3D[]=[],labelLayer=new THREE.Group();
  const stone=new THREE.MeshStandardMaterial({color:0x515657,roughness:.86,metalness:.08}),darkStone=new THREE.MeshStandardMaterial({color:0x2b3133,roughness:.95}),slate=new THREE.MeshStandardMaterial({color:0x343d43,roughness:.82,metalness:.06}),soot=new THREE.MeshStandardMaterial({color:0x1c2528,roughness:.88,metalness:.16}),copper=new THREE.MeshStandardMaterial({color:0x81543b,roughness:.62,metalness:.58}),plaster=new THREE.MeshStandardMaterial({color:0x7b7770,roughness:.92}),wetWood=new THREE.MeshStandardMaterial({color:0x3d3029,roughness:.85}),glass=new THREE.MeshPhysicalMaterial({color:0x62d8e8,emissive:0x176b7a,emissiveIntensity:2.5,transparent:true,opacity:.78,roughness:.14,metalness:.2}),water=new THREE.MeshPhysicalMaterial({color:0x17454e,emissive:0x092832,emissiveIntensity:.4,transparent:true,opacity:.86,roughness:.12,metalness:.15}),garden=new THREE.MeshStandardMaterial({color:0x405a42,roughness:.95});
  city.add(buildTerrain());
  const ocean=new THREE.Mesh(new THREE.CircleGeometry(82,96),new THREE.MeshPhysicalMaterial({color:0x071d24,roughness:.18,metalness:.28,transparent:true,opacity:.94}));ocean.rotation.x=-Math.PI/2;ocean.position.y=-.16;ocean.receiveShadow=true;city.add(ocean);
  const wards=new THREE.Group();city.add(wards);
  addDenseWard(wards,DISTRICTS[0],72,7,5,11,[wetWood,soot,darkStone],.7);addDenseWard(wards,DISTRICTS[1],42,5,3,22,[soot,darkStone,copper],.55);addDenseWard(wards,DISTRICTS[2],62,5.5,4,33,[plaster,copper,slate],.8);addDenseWard(wards,DISTRICTS[3],46,5,4,44,[soot,stone,copper],.95);addDenseWard(wards,DISTRICTS[4],92,7,5,55,[darkStone,soot,wetWood],.7);addDenseWard(wards,DISTRICTS[5],48,8,5,66,[plaster,stone,slate],1.45);addDenseWard(wards,DISTRICTS[6],24,6,5,77,[stone,garden,wetWood],.85);addDenseWard(wards,DISTRICTS[7],42,5,4,88,[plaster,slate,stone],.9);addDenseWard(wards,DISTRICTS[8],48,7,6,99,[stone,wetWood,garden],.65);addDenseWard(wards,DISTRICTS[9],54,7,4,110,[wetWood,darkStone,garden],.58);

  const beacon=new THREE.Group(),bp=cityPos(25,30,30);beacon.position.copy(bp);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.9,2.6,12),copper),spire=new THREE.Mesh(new THREE.CylinderGeometry(.3,1.5,17.2,8),glass),needle=new THREE.Mesh(new THREE.ConeGeometry(.34,4.1,7),glass);base.position.y=1.3;spire.position.y=11.1;needle.position.y=21.75;beacon.add(base,spire,needle);
  [5.6,10.2,14.8].forEach((height,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25-i*.2,.12,7,28),copper);ring.rotation.x=Math.PI/2;ring.position.y=height;beacon.add(ring)});
  const beaconLight=new THREE.PointLight(0x64ddff,55,34,1.8);beaconLight.position.y=14;beacon.add(beaconLight);city.add(beacon);

  const towers=[{x:56.5,y:53,top:95},{x:60,y:55,top:115},{x:63.4,y:52.2,top:105}],towerMeshes:THREE.Mesh[]=[];
  towers.forEach((tower,i)=>{const h=(tower.top-45)*V,p=cityPos(tower.x,tower.y,45),mesh=new THREE.Mesh(new THREE.CylinderGeometry(.72,1.18,h,7),i===1?plaster:stone);mesh.position.set(p.x,p.y+h/2,p.z);mesh.castShadow=true;city.add(mesh);const cap=new THREE.Mesh(new THREE.ConeGeometry(.8,1.65,7),slate);cap.position.set(p.x,p.y+h+.8,p.z);city.add(cap);towerMeshes.push(mesh)});
  [[0,1],[1,2],[0,2]].forEach(([a,b],i)=>{const pa=towerMeshes[a].position.clone(),pb=towerMeshes[b].position.clone();pa.y=pb.y=cityPos(60,54,[60,70,80][i]).y;const mid=pa.clone().lerp(pb,.5),len=pa.distanceTo(pb),bridge=new THREE.Mesh(new THREE.BoxGeometry(.25,.18,len),copper);bridge.position.copy(mid);bridge.lookAt(pb);city.add(bridge)});

  const eye=new THREE.Group(),ep=cityPos(85,35,30);eye.position.copy(ep);const nave=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.5,2.2),plaster),transept=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.15,4.1),stone);nave.position.y=1.25;transept.position.y=1.1;eye.add(nave,transept);[[-1.45,-.75],[1.45,-.75],[-1.45,.75],[1.45,.75]].forEach(([x,z])=>{const sp=new THREE.Mesh(new THREE.ConeGeometry(.52,2.9,5),slate);sp.position.set(x,3.55,z);eye.add(sp)});city.add(eye);

  const grove=new THREE.Group(),groveRandom=seeded(7521);for(let i=0;i<62;i++){const x=75+(groveRandom()-.5)*11,y=45+(groveRandom()-.5)*9,p=cityPos(x,y,Math.min(45,terrainHeight(x,y))),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,.7+groveRandom()*.5,5),wetWood),crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.38+groveRandom()*.38,1),garden);trunk.position.set(p.x,p.y+.45,p.z);crown.position.set(p.x,p.y+1+groveRandom()*.7,p.z);grove.add(trunk,crown)}city.add(grove);
  for(let i=0;i<15;i++){const t=i/14,x=80-t*10,y=28-t*14,z=48-t*23,p=cityPos(x,y,z),terrace=new THREE.Mesh(new THREE.BoxGeometry(3.2+t*.8,.24,1.2),stone),pool=new THREE.Mesh(new THREE.BoxGeometry(2.55+t*.7,.08,.76),water);terrace.position.set(p.x,p.y,p.z);pool.position.set(p.x,p.y+.16,p.z);city.add(terrace,pool)}
  const radianceRandom=seeded(2202);for(let i=0;i<18;i++){const x=22+(radianceRandom()-.5)*8,y=22+(radianceRandom()-.5)*7,p=cityPos(x,y),prism=new THREE.Mesh(new THREE.OctahedronGeometry(.18+radianceRandom()*.18,0),glass);prism.position.set(p.x,p.y+.8+radianceRandom(),p.z);city.add(prism)}
  for(let i=0;i<7;i++){const x=5.5+i*1.65,y=2.2+(i%2)*1.15,p=cityPos(x,y,.3),pier=new THREE.Mesh(new THREE.BoxGeometry(1,.12,4+(i%3)),wetWood);pier.position.set(p.x,p.y+.05,p.z+1.5);city.add(pier)}
  const boatRandom=seeded(118);for(let i=0;i<12;i++){const x=5+boatRandom()*14,y=-1+boatRandom()*8,p=cityPos(x,y,.2),hull=new THREE.Mesh(new THREE.BoxGeometry(.65,.12,1.45),wetWood),mast=new THREE.Mesh(new THREE.CylinderGeometry(.018,.025,1.2,5),wetWood);hull.position.copy(p);hull.rotation.y=(boatRandom()-.5)*1.2;mast.position.set(p.x,p.y+.65,p.z);city.add(hull,mast)}
  const spill=cityPos(38,5,3);[1.1,1.8,2.6].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.1,6,36),i===0?water:copper);ring.rotation.x=Math.PI/2;ring.position.set(spill.x,spill.y+.04+i*.04,spill.z);city.add(ring)});

  const infrastructure=new THREE.Group();infrastructure.name="infrastructure";
  addCurve(infrastructure,[[25,30,30],[40,38,32],[50,45,38],[58,52,45]],0xc58552,.07,.9);addCurve(infrastructure,[[60,52,45],[72,44,35],[82,36,30],[85,35,30]],0xc58552,.07,.9);addCurve(infrastructure,[[56,52,45],[48,42,35],[38,32,25],[28,22,15],[18,14,8],[12,10,3]],0xc58552,.055,.75);addCurve(infrastructure,[[46,15,15],[40,14,12],[32,12,8],[24,10,4],[16,8,2],[10,6,0]],0x2d8fa1,.17,.95);addCurve(infrastructure,[[70,14,25],[64,14,22],[58,14,18],[52,14,16],[46,14,15]],0x2d8fa1,.15,.95);addCurve(infrastructure,[[82,28,18],[72,26,16],[62,24,14],[52,22,12],[42,20,10],[32,16,6]],0x2d8fa1,.13,.85);city.add(infrastructure);

  DISTRICTS.forEach(district=>{const p=cityPos(district.x,district.y,district.z),hit=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.3,5.5,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.set(p.x,p.y+2.8,p.z);hit.userData.district=district.name;city.add(hit);hitTargets.push(hit);const element=document.createElement("button");element.className="map-label";element.textContent=district.short;element.setAttribute("aria-label",`Explore ${district.name}`);element.addEventListener("click",event=>{event.stopPropagation();selectDistrict(district.name)});const label=new CSS2DObject(element);label.position.set(p.x,p.y+(district.name==="The Beacon"?20:district.name==="Summit"?10:3),p.z);labelLayer.add(label)});city.add(labelLayer);
  return{city,hitTargets,labelLayer,infrastructure,beaconLight};
}

type SceneApi={focus:(district:District)=>void;setAtlas:(atlas:boolean)=>void;setLabels:(visible:boolean)=>void;setInfrastructure:(visible:boolean)=>void};

export function StormhavenMap(){
  const hostRef=useRef<HTMLDivElement>(null),apiRef=useRef<SceneApi|null>(null);
  const [selected,setSelected]=useState<District>(DISTRICTS[3]),[atlas,setAtlas]=useState(false),[labels,setLabels]=useState(true),[routes,setRoutes]=useState(true),[reference,setReference]=useState(false),[ready,setReady]=useState(false);
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x05090c);scene.fog=new THREE.FogExp2(0x071116,.0125);
    const camera=new THREE.PerspectiveCamera(38,host.clientWidth/host.clientHeight,.1,240);camera.position.set(-47,43,62);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.86;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    const labelRenderer=new CSS2DRenderer();labelRenderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.domElement.style.position="absolute";labelRenderer.domElement.style.inset="0";labelRenderer.domElement.style.pointerEvents="none";host.appendChild(labelRenderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=28;controls.maxDistance=115;controls.maxPolarAngle=Math.PI*.47;controls.target.set(4,3.2,0);
    scene.add(new THREE.HemisphereLight(0x5d8190,0x17100e,1.2));const stormLight=new THREE.DirectionalLight(0xb7dae1,3.3);stormLight.position.set(-28,52,22);stormLight.castShadow=true;stormLight.shadow.mapSize.set(2048,2048);stormLight.shadow.camera.left=-55;stormLight.shadow.camera.right=55;stormLight.shadow.camera.top=42;stormLight.shadow.camera.bottom=-42;scene.add(stormLight);const copperGlow=new THREE.PointLight(0xd47842,18,34,2);copperGlow.position.set(-19,5,13);scene.add(copperGlow);
    const {city,hitTargets,labelLayer,infrastructure,beaconLight}=createCity(name=>{const district=DISTRICTS.find(item=>item.name===name);if(district)setSelected(district)});scene.add(city);
    const clouds=new THREE.Group(),cloudMaterial=new THREE.MeshStandardMaterial({color:0x0c1419,transparent:true,opacity:.72,roughness:1,depthWrite:false}),cloudRandom=seeded(903);for(let i=0;i<34;i++){const cloud=new THREE.Mesh(new THREE.IcosahedronGeometry(5+cloudRandom()*9,2),cloudMaterial);cloud.scale.y=.16+cloudRandom()*.11;cloud.position.set((cloudRandom()-.5)*115,20+cloudRandom()*8,(cloudRandom()-.5)*75);clouds.add(cloud)}scene.add(clouds);
    const rainCount=2400,rainPositions=new Float32Array(rainCount*3),rainRandom=seeded(8844);for(let i=0;i<rainCount;i++){rainPositions[i*3]=(rainRandom()-.5)*105;rainPositions[i*3+1]=rainRandom()*34;rainPositions[i*3+2]=(rainRandom()-.5)*74}const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute("position",new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.Points(rainGeometry,new THREE.PointsMaterial({color:0x8ebbc2,size:.025,transparent:true,opacity:.42}));scene.add(rain);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerDown={x:0,y:0};const onDown=(event:PointerEvent)=>{pointerDown={x:event.clientX,y:event.clientY}},onClick=(event:PointerEvent)=>{if(Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5)return;const bounds=renderer.domElement.getBoundingClientRect();pointer.x=(event.clientX-bounds.left)/bounds.width*2-1;pointer.y=-(event.clientY-bounds.top)/bounds.height*2+1;raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(hitTargets,false)[0];if(hit?.object.userData.district){const district=DISTRICTS.find(item=>item.name===hit.object.userData.district);if(district)setSelected(district)}};renderer.domElement.addEventListener("pointerdown",onDown);renderer.domElement.addEventListener("pointerup",onClick);
    const tweenCamera=(position:THREE.Vector3,target:THREE.Vector3)=>{const fromPosition=camera.position.clone(),fromTarget=controls.target.clone(),start=performance.now(),duration=950,tick=(time:number)=>{const raw=Math.min(1,(time-start)/duration),eased=1-Math.pow(1-raw,3);camera.position.lerpVectors(fromPosition,position,eased);controls.target.lerpVectors(fromTarget,target,eased);if(raw<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
    apiRef.current={focus:district=>{const target=cityPos(district.x,district.y,district.z),offset=district.name==="The Beacon"?new THREE.Vector3(-12,13,17):new THREE.Vector3(-11,9,15);tweenCamera(target.clone().add(offset),target.clone().add(new THREE.Vector3(0,1.5,0)))},setAtlas:enabled=>enabled?tweenCamera(new THREE.Vector3(0,90,.01),new THREE.Vector3(0,0,0)):tweenCamera(new THREE.Vector3(-47,43,62),new THREE.Vector3(4,3.2,0)),setLabels:visible=>{labelLayer.visible=visible},setInfrastructure:visible=>{infrastructure.visible=visible}};
    const onResize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);labelRenderer.setSize(host.clientWidth,host.clientHeight)};window.addEventListener("resize",onResize);
    const clock=new THREE.Clock();let animation=0;const animate=()=>{animation=requestAnimationFrame(animate);const elapsed=clock.getElapsedTime();controls.update();clouds.position.x=Math.sin(elapsed*.035)*5;const positions=rainGeometry.attributes.position as THREE.BufferAttribute;for(let i=0;i<rainCount;i++){let y=positions.getY(i)-.22;if(y<-.2)y=33;positions.setY(i,y);positions.setX(i,positions.getX(i)-.008)}positions.needsUpdate=true;beaconLight.intensity=44+Math.sin(elapsed*2.7)*9;renderer.render(scene,camera);labelRenderer.render(scene,camera)};animate();setReady(true);
    return()=>{cancelAnimationFrame(animation);window.removeEventListener("resize",onResize);renderer.domElement.removeEventListener("pointerdown",onDown);renderer.domElement.removeEventListener("pointerup",onClick);controls.dispose();renderer.dispose();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){object.geometry?.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material?.dispose())}});host.replaceChildren();apiRef.current=null};
  },[]);
  const choose=(district:District)=>{setSelected(district);apiRef.current?.focus(district)};
  return <main className="stormhaven-shell">
    <div ref={hostRef} className="map-canvas" role="img" aria-label="Interactive three-dimensional map of Stormhaven and its ten districts" />
    {!ready&&<div className="loading-mark">Charting the storm</div>}
    <header className="topbar"><div className="brand"><p className="eyebrow">A living atlas · year 503 A.S.</p><h1>Stormhaven</h1><span className="brand-note">Elevation is privilege. Everything else runs downhill.</span></div><div className="controls" aria-label="Map controls">
      <button className="control-button" type="button" aria-pressed={atlas} onClick={()=>{const next=!atlas;setAtlas(next);apiRef.current?.setAtlas(next)}}>{atlas?"Perspective":"Atlas view"}</button>
      <button className="control-button" type="button" aria-pressed={routes} onClick={()=>{const next=!routes;setRoutes(next);apiRef.current?.setInfrastructure(next)}}>Routes</button>
      <button className="control-button" type="button" aria-pressed={labels} onClick={()=>{const next=!labels;setLabels(next);apiRef.current?.setLabels(next)}}>Labels</button>
      <button className="control-button" type="button" onClick={()=>setReference(true)}>Source map</button>
    </div></header>
    <nav className="district-nav" aria-label="Stormhaven districts">{DISTRICTS.map(district=><button key={district.name} type="button" className={`district-button ${selected.name===district.name?"is-active":""}`} onClick={()=>choose(district)}>{district.short}</button>)}</nav>
    <aside className="detail-panel" style={{"--district-color":selected.color} as React.CSSProperties} aria-live="polite"><div className="detail-kicker"><span>{selected.kind}</span><span>Pop. {selected.population}</span></div><h2>{selected.name}</h2><p>{selected.description}</p><div className="coordinates"><span><b>X</b> {selected.x}</span><span><b>Y</b> {selected.y}</span><span><b>Z</b> {selected.z}m</span><span>1 unit = 30m</span></div></aside>
    <div className="compass" aria-hidden="true" />
    {reference&&<div className="reference-backdrop" role="dialog" aria-modal="true" aria-label="Original Stormhaven cartographer map" onClick={()=>setReference(false)}><div className="reference-plate" onClick={event=>event.stopPropagation()}><img src="/assets/stormhaven-cartographer-reference.webp" alt="Original painted map of Stormhaven used as the architectural and compositional reference" /><button type="button" className="control-button reference-close" onClick={()=>setReference(false)}>Close</button></div></div>}
  </main>;
}
