import * as THREE from "three";

export type ArchitectureKind =
  | "tenement"
  | "canal-house"
  | "warehouse"
  | "glassworks"
  | "townhouse"
  | "tower-house"
  | "greenhouse"
  | "bathhouse"
  | "shrine"
  | "stilt-house"
  | "ruin"
  | "harbor-house"
  | "sluice-house"
  | "prism-house"
  | "furnace-house"
  | "whisper-house"
  | "salon-house"
  | "cantor-house"
  | "prayer-house"
  | "terrace-house"
  | "sinkhouse";

export type ArchitectureMaterials = {
  stone: THREE.Material;
  darkStone: THREE.Material;
  slate: THREE.Material;
  soot: THREE.Material;
  copper: THREE.Material;
  plaster: THREE.Material;
  wetWood: THREE.Material;
  glass: THREE.Material;
  garden: THREE.Material;
  window: THREE.Material;
  warmWindow: THREE.Material;
  pipe: THREE.Material;
};

type BuildOptions = { width:number; depth:number; height:number; seed:number };
export type StormhavenArchitectureKit = { create:(kind:ArchitectureKind,options:BuildOptions)=>THREE.Group };

function randomFrom(seed:number){let t=seed>>>0;return()=>{t+=0x6d2b79f5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296}}

export function createStormhavenArchitectureKit(m:ArchitectureMaterials,lowDetail=false):StormhavenArchitectureKit{
  // Buildings are baked into material buckets before their first render. Reusing
  // normalized source primitives avoids allocating thousands of equivalent
  // BufferGeometry objects while preserving the exact transformed vertices.
  const shared=<T extends THREE.BufferGeometry>(geometry:T)=>{geometry.userData.sharedSource=true;return geometry},unitBox=shared(new THREE.BoxGeometry(1,1,1)),unitPane=shared(new THREE.PlaneGeometry(1,1)),unitOctahedron=shared(new THREE.OctahedronGeometry(1,0)),cylinders=new Map<string,THREE.CylinderGeometry>(),cones=new Map<number,THREE.ConeGeometry>(),domes=new Map<string,THREE.SphereGeometry>();
  const coneGeometry=(sides:number)=>{let geometry=cones.get(sides);if(!geometry){geometry=shared(new THREE.ConeGeometry(1,1,sides));cones.set(sides,geometry)}return geometry};
  const cylinderGeometry=(top:number,bottom:number,sides:number)=>{const ratio=bottom===0?0:top/bottom,key=`${ratio.toFixed(6)}:${sides}`;let geometry=cylinders.get(key);if(!geometry){geometry=shared(new THREE.CylinderGeometry(ratio,1,1,sides));cylinders.set(key,geometry)}return geometry};
  const domeGeometry=(widthSegments:number,heightSegments:number)=>{const key=`${widthSegments}:${heightSegments}`;let geometry=domes.get(key);if(!geometry){geometry=shared(new THREE.SphereGeometry(1,widthSegments,heightSegments,0,Math.PI*2,0,Math.PI/2));domes.set(key,geometry)}return geometry};
  const box=(g:THREE.Group,w:number,h:number,d:number,material:THREE.Material,x=0,y=h/2,z=0)=>{const mesh=new THREE.Mesh(unitBox,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh};
  const pane=(g:THREE.Group,w:number,h:number,material:THREE.Material,x:number,y:number,z:number,back=false)=>{const mesh=new THREE.Mesh(unitPane,material);mesh.position.set(x,y,z);mesh.scale.set(w,h,1);if(back)mesh.rotation.y=Math.PI;g.add(mesh);return mesh};
  const cylinder=(g:THREE.Group,top:number,bottom:number,h:number,sides:number,material:THREE.Material,x=0,y=h/2,z=0)=>{const mesh=new THREE.Mesh(cylinderGeometry(top,bottom,sides),material);mesh.position.set(x,y,z);mesh.scale.set(bottom,h,bottom);mesh.castShadow=true;g.add(mesh);return mesh};
  const roof=(g:THREE.Group,w:number,d:number,y:number,material:THREE.Material,tall=.28)=>{const radius=Math.max(w,d)*.72,height=Math.max(.2,Math.min(w,d)*tall),mesh=new THREE.Mesh(coneGeometry(4),material);mesh.position.y=y+Math.max(.1,height/2);mesh.scale.set(radius,height,radius);mesh.rotation.y=Math.PI/4;mesh.castShadow=true;g.add(mesh)};
  const cornice=(g:THREE.Group,w:number,d:number,y:number,material:THREE.Material)=>box(g,w*1.08,.07,d*1.08,material,0,y,0);
  const door=(g:THREE.Group,w:number,d:number,material:THREE.Material,x=0)=>pane(g,Math.min(.18,w*.28),.3,material,x,.15,d/2+.015);
  const windows=(g:THREE.Group,w:number,d:number,h:number,rows:number,columns:number,material:THREE.Material,offsetY=0)=>{
    const ww=Math.min(.13,w/(columns*2.25)),wh=Math.min(.18,h/(rows*2.1));
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      const x=(col-(columns-1)/2)*w/(columns+.25),y=offsetY+(row+1)*h/(rows+1);
      pane(g,ww,wh,material,x,y,d/2+.013);
      if(row%2===0)pane(g,ww,wh,material,-x,y,-d/2-.013,true);
    }
  };
  const pipe=(g:THREE.Group,w:number,d:number,h:number,material:THREE.Material,side=1)=>{const p=cylinder(g,.022,.03,h*.82,6,material,w*.46*side,h*.43,d*.18);p.rotation.z=.025*side};
  const balcony=(g:THREE.Group,w:number,d:number,y:number,material:THREE.Material)=>{box(g,w*.62,.055,d*.28,material,0,y,d*.58);box(g,w*.62,.18,.025,material,0,y+.11,d*.7)};
  const stilts=(g:THREE.Group,w:number,d:number,lift:number)=>{for(const x of[-w*.37,w*.37])for(const z of[-d*.37,d*.37])cylinder(g,.025,.035,lift,5,m.wetWood,x,lift/2,z)};
  const dormers=(g:THREE.Group,w:number,d:number,y:number,wall:THREE.Material,roofMaterial:THREE.Material,count=2)=>{
    for(let i=0;i<count;i++){const x=(i-(count-1)/2)*w*.42;box(g,w*.18,.18,d*.13,wall,x,y+.08,d*.37);const cap=new THREE.Mesh(coneGeometry(4),roofMaterial);cap.position.set(x,y+.23,d*.37);cap.scale.set(w*.15,.16,d*.15);cap.rotation.y=Math.PI/4;g.add(cap)}
  };
  const roofTank=(g:THREE.Group,w:number,d:number,y:number)=>{cylinder(g,.1,.13,.34,7,m.copper,w*.24,y+.17,-d*.18);const cap=new THREE.Mesh(coneGeometry(7),m.slate);cap.position.set(w*.24,y+.4,-d*.18);cap.scale.set(.12,.16,.12);g.add(cap)};
  // The kit's output is always consolidated before its first render; shadow and
  // receive flags are assigned once to the resulting material buckets there.
  const finish=(g:THREE.Group)=>g;

  const tenement=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.74,d,m.darkStone);box(g,w*.86,h*.26,d*.9,r()>.5?m.soot:m.stone,(r()-.5)*w*.08,h*.87,0);cornice(g,w,d,h*.73,m.copper);roof(g,w*.88,d*.9,h,m.slate,.22);if(!lowDetail&&r()>.48)roofTank(g,w,d,h);door(g,w,d,m.wetWood,-w*.18);windows(g,w,d,h*.7,Math.max(2,Math.floor(h/.45)),2,r()>.5?m.window:m.warmWindow,.04);balcony(g,w,d,h*.53,m.copper);pipe(g,w,d,h,m.pipe,r()>.5?1:-1);return finish(g);
  };
  const canalHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group(),lift=.18+r()*.18;stilts(g,w,d,lift);box(g,w,h,d,r()>.45?m.plaster:m.wetWood,0,lift+h/2,0);if(!lowDetail&&r()>.5)box(g,w*.36,h*.58,d*.28,m.stone,-w*.3,lift+h*.46,-d*.31);roof(g,w,d,lift+h,m.slate,.35);if(!lowDetail&&r()>.54)dormers(g,w,d,lift+h,m.plaster,m.slate,1);door(g,w,d,m.wetWood,w*.2);windows(g,w,d,h*.82,Math.max(2,Math.floor(h/.5)),2,m.warmWindow,lift);box(g,w*.48,.05,d*.32,m.wetWood,0,lift+.1,d*.62);pipe(g,w,d,lift+h,m.copper,-1);return finish(g);
  };
  const warehouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.78,d,m.soot);box(g,w*.34,h*.5,.03,m.wetWood,0,h*.25,d/2+.02);roof(g,w,d,h*.78,r()>.5?m.copper:m.slate,.18);cornice(g,w,d,h*.78,m.copper);for(let x=-w*.32;x<=w*.32;x+=w*.32)pane(g,w*.16,.12,m.window,x,h*.59,d/2+.021);if(!lowDetail)for(const x of[-w*.23,w*.23]){box(g,w*.18,.18,d*.5,m.darkStone,x,h*.86,0);roof(g,w*.18,d*.5,h*.95,m.slate,.14)}cylinder(g,.055,.075,h*.78,7,m.pipe,w*.34,h*1.02,-d*.16);return finish(g);
  };
  const glassworks=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.62,d,m.soot);cornice(g,w,d,h*.61,m.copper);for(let i=-1;i<=1;i++){const cap=new THREE.Mesh(coneGeometry(4),m.glass);cap.position.set(i*w*.27,h*.74,0);cap.scale.set(w*.24,h*.22,w*.24);cap.rotation.y=Math.PI/4;g.add(cap)}for(const side of[-1,1])cylinder(g,.05,.08,h*(.85+r()*.3),8,m.copper,side*w*.35,h*.7,-d*.28);door(g,w,d,m.copper);windows(g,w,d,h*.52,2,3,m.window);return finish(g);
  };
  const townhouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h,d,r()>.5?m.plaster:m.stone);if(!lowDetail&&r()>.52)box(g,w*.38,h*.58,d*.32,m.stone,w*.34,h*.48,-d*.27);cornice(g,w,d,h*.34,m.copper);cornice(g,w,d,h*.67,m.copper);roof(g,w,d,h,m.slate,.42);if(!lowDetail&&r()>.32)dormers(g,w,d,h,r()>.5?m.plaster:m.stone,m.slate,r()>.7?2:1);door(g,w,d,m.copper);windows(g,w,d,h*.88,Math.max(2,Math.floor(h/.48)),2,r()>.62?m.window:m.warmWindow);if(r()>.35)balcony(g,w,d,h*.61,m.copper);return finish(g);
  };
  const towerHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group(),radius=Math.max(w,d)*.48;cylinder(g,radius*.9,radius,h*.72,7,r()>.55?m.plaster:m.stone);cylinder(g,radius*.72,radius*.82,h*.28,7,m.darkStone,0,h*.86,0);for(const y of[h*.43,h*.72]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.98,.035,5,24),m.copper);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring)}const cap=new THREE.Mesh(coneGeometry(7),m.slate);cap.position.y=h*1.14;cap.scale.set(radius*.78,h*.27,radius*.78);g.add(cap);for(let i=0;i<7;i++){const angle=i/7*Math.PI*2,win=box(g,.1,.17,.025,m.window,Math.sin(angle)*radius*.84,h*.55,Math.cos(angle)*radius*.84);win.rotation.y=angle}return finish(g);
  };
  const greenhouse=({width:w,depth:d,height:h}:BuildOptions)=>{
    const g=new THREE.Group();box(g,w,.18,d,m.stone);box(g,w*.92,h*.42,d*.92,m.glass,0,.18+h*.21,0);const radius=Math.max(w,d)*.46,dome=new THREE.Mesh(domeGeometry(10,6),m.glass);dome.scale.set(radius,radius*h/Math.max(w,d),radius*d/w);dome.position.y=.18+h*.42;g.add(dome);for(const x of[-w*.44,0,w*.44])box(g,.025,h*.55,.025,m.copper,x,.2+h*.3,d*.46);return finish(g);
  };
  const bathhouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.55,d,r()>.5?m.plaster:m.stone);const radius=Math.max(w,d)*.38,dome=new THREE.Mesh(domeGeometry(12,7),m.copper);dome.scale.set(radius,radius*.55,radius*d/w);dome.position.y=h*.55;g.add(dome);for(const side of[-1,1])cylinder(g,.09,.11,h*.66,8,m.stone,side*w*.38,h*.33,-d*.34);door(g,w,d,m.copper);windows(g,w,d,h*.48,1,3,m.window);return finish(g);
  };
  const shrine=({width:w,depth:d,height:h}:BuildOptions)=>{
    const g=new THREE.Group();box(g,w*.62,h*.7,d,m.stone);box(g,w,h*.42,d*.42,m.plaster,0,h*.22,0);for(const side of[-1,1])box(g,w*.12,h*.58,d*.12,m.darkStone,side*w*.36,h*.29,d*.22);const spire=new THREE.Mesh(coneGeometry(6),m.slate);spire.position.y=h*.96;spire.scale.set(w*.32,h*.62,w*.32);g.add(spire);door(g,w,d,m.copper);windows(g,w*.62,d,h*.6,2,1,m.window);return finish(g);
  };
  const stiltHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{const g=canalHouse({width:w,depth:d,height:h,seed});g.rotation.z=(randomFrom(seed+4)()-.5)*.13;box(g,w*.7,.04,d*.22,m.wetWood,w*.18,.38,d*.61);return finish(g)};
  const ruin=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();
    for(const side of[-1,1]){
      const fragments=side<0?3:2;
      for(let i=0;i<fragments;i++){
        const fragmentHeight=h*(.24+r()*.58),x=side*w*(.34+r()*.07),z=(i-(fragments-1)/2)*d*.38;
        const wall=box(g,w*(.12+r()*.1),fragmentHeight,d*(.2+r()*.12),(i+side)%2?m.darkStone:m.stone,x,fragmentHeight/2,z);
        wall.rotation.z=(r()-.5)*.28;wall.rotation.y=(r()-.5)*.16;
      }
    }
    const rear=box(g,w*(.3+r()*.22),h*(.1+r()*.17),d*.14,m.darkStone,(r()-.5)*w*.15,h*.08,-d*.42);rear.rotation.z=(r()-.5)*.34;
    for(let i=0;i<6;i++){
      const slab=box(g,w*(.14+r()*.24),h*(.03+r()*.06),d*(.1+r()*.24),i%2?m.stone:m.darkStone,(r()-.5)*w,h*(.02+r()*.08),(r()-.5)*d);
      slab.rotation.set((r()-.5)*.24,r()*Math.PI,(r()-.5)*.5);
    }
    for(let i=0;i<4;i++){
      const rod=cylinder(g,.02,.035,h*(.18+r()*.42),6,i%3===0?m.wetWood:m.copper,(r()-.5)*w,h*.15,(r()-.5)*d);
      rod.rotation.z=(r()-.5)*.55;
    }
    return finish(g);
  };

  // District houses carry the working logic of their ward in their silhouette.
  // They deliberately reuse the same normalized primitives and material palette,
  // so hundreds of local cues still collapse into the existing baked draw buckets.
  const harborHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+91),g=canalHouse(options);
    const crane=cylinder(g,.025,.035,h*.72,6,m.wetWood,w*.38,h*.92,-d*.26);crane.rotation.z=-.05;
    box(g,w*.72,.045,.045,m.wetWood,w*.08,h*1.25,-d*.26);cylinder(g,.014,.014,h*.32,5,m.copper,-w*.27,h*1.07,-d*.26);
    box(g,w*.45,.04,d*.24,m.wetWood,(r()-.5)*w*.2,.2,d*.62);return finish(g);
  };
  const sluiceHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+123),g=tenement(options);
    box(g,w*1.04,.065,d*.28,m.wetWood,0,h*.24,d*.58);box(g,w*1.06,.045,d*.18,m.copper,0,h*.39,d*.61);
    for(const side of[-1,1])cylinder(g,.025,.035,h*.88,6,m.copper,side*w*.47,h*.46,-d*.28);
    const live=new THREE.Mesh(unitOctahedron,r()>.45?m.warmWindow:m.window);live.position.set(w*.36,h*.58,d*.54);live.scale.setScalar(.075);g.add(live);return finish(g);
  };
  const prismHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+211),g=townhouse(options);
    for(const side of[-1,0,1]){const fin=box(g,w*.07,h*(.55+r()*.18),d*.13,m.glass,side*w*.34,h*.74,d*.58);fin.rotation.z=side*.12}
    box(g,w*.76,.045,d*.34,m.soot,0,h*.36,d*.67);const crown=new THREE.Mesh(unitOctahedron,m.glass);crown.position.set(0,h*1.2,0);crown.scale.set(w*.18,h*.2,w*.18);g.add(crown);return finish(g);
  };
  const furnaceHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+307),g=glassworks(options);
    const stack=cylinder(g,.065,.11,h*(1.25+r()*.35),8,m.soot,w*.38,h*.8,-d*.34);stack.rotation.z=.025;
    box(g,w*.78,.09,.09,m.copper,0,h*.78,-d*.46);for(const side of[-1,1])cylinder(g,.035,.045,h*.54,6,m.copper,side*w*.35,h*.76,-d*.46);
    box(g,w*.36,.18,.035,m.warmWindow,0,h*.24,d*.51);return finish(g);
  };
  const whisperHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+401),g=tenement(options);
    pane(g,w*.18,.28,m.wetWood,-w*.28,.15,d/2+.021);pane(g,w*.16,.25,m.wetWood,w*.3,.14,-d/2-.021,true);
    for(const side of[-1,1])box(g,.035,h*.56,.035,m.copper,side*w*.4,h*.86,d*.28);box(g,w*.78,.025,.025,m.copper,0,h*1.13,d*.28);
    for(let i=0;i<3;i++){const echo=new THREE.Mesh(unitOctahedron,i===1?m.warmWindow:m.glass);echo.position.set((i-1)*w*.24,h*(.78+r()*.14),d*.31);echo.scale.setScalar(.045+i*.008);g.add(echo)}return finish(g);
  };
  const salonHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+503),g=towerHouse(options);
    box(g,w*.92,.07,d*.34,m.copper,0,h*.62,d*.54);box(g,w*.7,.035,d*.48,m.glass,0,h*.88,d*.48);
    for(const side of[-1,1])cylinder(g,.035,.045,h*.52,7,m.copper,side*w*.35,h*.7,d*.48);
    if(r()>.45){const future=new THREE.Mesh(unitOctahedron,m.plaster);future.position.set(w*.24,h*.22,d*.62);future.scale.set(w*.08,h*.2,w*.08);g.add(future)}return finish(g);
  };
  const cantorHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h}=options,g=greenhouse(options);
    for(const side of[-1,1]){const trunk=cylinder(g,.035,.055,h*1.18,6,m.wetWood,side*w*.38,h*.62,-d*.22);trunk.rotation.z=side*.13;box(g,.045,h*.72,.045,m.glass,side*w*.32,h*.8,-d*.2)}
    box(g,w*.72,.035,d*.12,m.copper,0,h*.48,d*.58);return finish(g);
  };
  const prayerHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h}=options,g=shrine(options);
    for(const side of[-1,1]){cylinder(g,.018,.025,h*.9,7,m.copper,side*w*.22,h*1.08,0);box(g,w*.08,.025,d*.78,m.copper,side*w*.22,.035,0)}
    box(g,w*.82,.025,.025,m.copper,0,.04,d*.22);return finish(g);
  };
  const terraceHouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h}=options,g=bathhouse(options);
    box(g,w*1.08,.08,d*.32,m.stone,0,.08,d*.62);box(g,w*.9,.035,d*.25,m.glass,0,.145,d*.64);
    for(const side of[-1,1]){const vent=cylinder(g,.035,.045,h*.58,7,m.copper,side*w*.38,h*.76,-d*.27);vent.rotation.z=side*.025}return finish(g);
  };
  const sinkhouse=(options:BuildOptions)=>{
    const {width:w,depth:d,height:h,seed}=options,r=randomFrom(seed+617),g=stiltHouse(options);g.rotation.z+=(r()-.5)*.17;
    const brace=box(g,.045,h*.92,.045,m.wetWood,w*.48,h*.46,-d*.3);brace.rotation.z=-.34;box(g,w*.9,.045,d*.25,m.wetWood,0,h*.46,d*.58);return finish(g);
  };

  const builders:Record<ArchitectureKind,(options:BuildOptions)=>THREE.Group>={tenement, "canal-house":canalHouse, warehouse, glassworks, townhouse, "tower-house":towerHouse, greenhouse, bathhouse, shrine, "stilt-house":stiltHouse, ruin, "harbor-house":harborHouse, "sluice-house":sluiceHouse, "prism-house":prismHouse, "furnace-house":furnaceHouse, "whisper-house":whisperHouse, "salon-house":salonHouse, "cantor-house":cantorHouse, "prayer-house":prayerHouse, "terrace-house":terraceHouse, sinkhouse};
  return{create:(kind,options)=>builders[kind](options)};
}
