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
  | "ruin";

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

export function createStormhavenArchitectureKit(m:ArchitectureMaterials):StormhavenArchitectureKit{
  const box=(g:THREE.Group,w:number,h:number,d:number,material:THREE.Material,x=0,y=h/2,z=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh};
  const pane=(g:THREE.Group,w:number,h:number,material:THREE.Material,x:number,y:number,z:number,back=false)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.position.set(x,y,z);if(back)mesh.rotation.y=Math.PI;g.add(mesh);return mesh};
  const cylinder=(g:THREE.Group,top:number,bottom:number,h:number,sides:number,material:THREE.Material,x=0,y=h/2,z=0)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,h,sides),material);mesh.position.set(x,y,z);mesh.castShadow=true;g.add(mesh);return mesh};
  const roof=(g:THREE.Group,w:number,d:number,y:number,material:THREE.Material,tall=.28)=>{const mesh=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,Math.max(.2,Math.min(w,d)*tall),4),material);mesh.position.y=y+Math.max(.1,Math.min(w,d)*tall/2);mesh.rotation.y=Math.PI/4;mesh.castShadow=true;g.add(mesh)};
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
  const finish=(g:THREE.Group)=>{g.traverse(object=>{if(object instanceof THREE.Mesh){object.geometry.computeBoundingBox();const size=new THREE.Vector3();object.geometry.boundingBox?.getSize(size);const substantial=Math.max(size.x,size.y,size.z)>.22;object.castShadow=substantial;object.receiveShadow=substantial}});return g};

  const tenement=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.74,d,m.darkStone);box(g,w*.86,h*.26,d*.9,r()>.5?m.soot:m.stone,(r()-.5)*w*.08,h*.87,0);cornice(g,w,d,h*.73,m.copper);roof(g,w*.88,d*.9,h,m.slate,.22);door(g,w,d,m.wetWood,-w*.18);windows(g,w,d,h*.7,Math.max(2,Math.floor(h/.45)),2,r()>.5?m.window:m.warmWindow,.04);balcony(g,w,d,h*.53,m.copper);pipe(g,w,d,h,m.pipe,r()>.5?1:-1);return finish(g);
  };
  const canalHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group(),lift=.18+r()*.18;stilts(g,w,d,lift);box(g,w,h,d,r()>.45?m.plaster:m.wetWood,0,lift+h/2,0);roof(g,w,d,lift+h,m.slate,.35);door(g,w,d,m.wetWood,w*.2);windows(g,w,d,h*.82,Math.max(2,Math.floor(h/.5)),2,m.warmWindow,lift);box(g,w*.48,.05,d*.32,m.wetWood,0,lift+.1,d*.62);pipe(g,w,d,lift+h,m.copper,-1);return finish(g);
  };
  const warehouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.78,d,m.soot);box(g,w*.34,h*.5,.03,m.wetWood,0,h*.25,d/2+.02);roof(g,w,d,h*.78,r()>.5?m.copper:m.slate,.18);cornice(g,w,d,h*.78,m.copper);for(let x=-w*.32;x<=w*.32;x+=w*.32)pane(g,w*.16,.12,m.window,x,h*.59,d/2+.021);cylinder(g,.055,.075,h*.78,7,m.pipe,w*.34,h*1.02,-d*.16);return finish(g);
  };
  const glassworks=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.62,d,m.soot);cornice(g,w,d,h*.61,m.copper);for(let i=-1;i<=1;i++){const cap=new THREE.Mesh(new THREE.ConeGeometry(w*.24,h*.22,4),m.glass);cap.position.set(i*w*.27,h*.74,0);cap.rotation.y=Math.PI/4;g.add(cap)}for(const side of[-1,1])cylinder(g,.05,.08,h*(.85+r()*.3),8,m.copper,side*w*.35,h*.7,-d*.28);door(g,w,d,m.copper);windows(g,w,d,h*.52,2,3,m.window);return finish(g);
  };
  const townhouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h,d,r()>.5?m.plaster:m.stone);cornice(g,w,d,h*.34,m.copper);cornice(g,w,d,h*.67,m.copper);roof(g,w,d,h,m.slate,.42);door(g,w,d,m.copper);windows(g,w,d,h*.88,Math.max(2,Math.floor(h/.48)),2,r()>.62?m.window:m.warmWindow);if(r()>.35)balcony(g,w,d,h*.61,m.copper);return finish(g);
  };
  const towerHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group(),radius=Math.max(w,d)*.48;cylinder(g,radius*.9,radius,h*.72,7,r()>.55?m.plaster:m.stone);cylinder(g,radius*.72,radius*.82,h*.28,7,m.darkStone,0,h*.86,0);for(const y of[h*.43,h*.72]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*.98,.035,5,24),m.copper);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring)}const cap=new THREE.Mesh(new THREE.ConeGeometry(radius*.78,h*.27,7),m.slate);cap.position.y=h*1.14;g.add(cap);for(let i=0;i<7;i++){const angle=i/7*Math.PI*2,win=box(g,.1,.17,.025,m.window,Math.sin(angle)*radius*.84,h*.55,Math.cos(angle)*radius*.84);win.rotation.y=angle}return finish(g);
  };
  const greenhouse=({width:w,depth:d,height:h}:BuildOptions)=>{
    const g=new THREE.Group();box(g,w,.18,d,m.stone);box(g,w*.92,h*.42,d*.92,m.glass,0,.18+h*.21,0);const dome=new THREE.Mesh(new THREE.SphereGeometry(Math.max(w,d)*.46,10,6,0,Math.PI*2,0,Math.PI/2),m.glass);dome.scale.set(1,h/Math.max(w,d),d/w);dome.position.y=.18+h*.42;g.add(dome);for(const x of[-w*.44,0,w*.44])box(g,.025,h*.55,.025,m.copper,x,.2+h*.3,d*.46);return finish(g);
  };
  const bathhouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w,h*.55,d,r()>.5?m.plaster:m.stone);const dome=new THREE.Mesh(new THREE.SphereGeometry(Math.max(w,d)*.38,12,7,0,Math.PI*2,0,Math.PI/2),m.copper);dome.scale.set(1,.55,d/w);dome.position.y=h*.55;g.add(dome);for(const side of[-1,1])cylinder(g,.09,.11,h*.66,8,m.stone,side*w*.38,h*.33,-d*.34);door(g,w,d,m.copper);windows(g,w,d,h*.48,1,3,m.window);return finish(g);
  };
  const shrine=({width:w,depth:d,height:h}:BuildOptions)=>{
    const g=new THREE.Group();box(g,w*.62,h*.7,d,m.stone);box(g,w,h*.42,d*.42,m.plaster,0,h*.22,0);for(const side of[-1,1])box(g,w*.12,h*.58,d*.12,m.darkStone,side*w*.36,h*.29,d*.22);const spire=new THREE.Mesh(new THREE.ConeGeometry(w*.32,h*.62,6),m.slate);spire.position.y=h*.96;g.add(spire);door(g,w,d,m.copper);windows(g,w*.62,d,h*.6,2,1,m.window);return finish(g);
  };
  const stiltHouse=({width:w,depth:d,height:h,seed}:BuildOptions)=>{const g=canalHouse({width:w,depth:d,height:h,seed});g.rotation.z=(randomFrom(seed+4)()-.5)*.13;box(g,w*.7,.04,d*.22,m.wetWood,w*.18,.38,d*.61);return finish(g)};
  const ruin=({width:w,depth:d,height:h,seed}:BuildOptions)=>{
    const r=randomFrom(seed),g=new THREE.Group();box(g,w*.23,h,d,m.darkStone,-w*.38,h/2,0);box(g,w*.23,h*(.55+r()*.25),d,m.stone,w*.38,h*.3,0);box(g,w*.6,h*.18,d*.2,m.darkStone,0,h*.1,-d*.38);for(let i=0;i<3;i++)cylinder(g,.035,.05,h*(.25+r()*.35),6,m.copper,(r()-.5)*w,h*.2,(r()-.5)*d);return finish(g);
  };

  const builders:Record<ArchitectureKind,(options:BuildOptions)=>THREE.Group>={tenement, "canal-house":canalHouse, warehouse, glassworks, townhouse, "tower-house":towerHouse, greenhouse, bathhouse, shrine, "stilt-house":stiltHouse, ruin};
  return{create:(kind,options)=>builders[kind](options)};
}
