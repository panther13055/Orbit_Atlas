import React,{useEffect,useMemo,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {Maximize2,Pause,Play,RotateCcw,SlidersHorizontal} from "lucide-react";

const TYPES={
 active:{label:"Active satellites",color:0x7dff9c,desc:"Operational spacecraft still performing missions."},
 dead:{label:"Dead / inactive satellites",color:0xb8c0cc,desc:"Spacecraft that no longer perform their mission but remain in orbit."},
 rocket:{label:"Rocket bodies",color:0xffb36b,desc:"Spent launch-vehicle stages and related hardware."},
 fragment:{label:"Collision / fragmentation debris",color:0xff6f8f,desc:"Fragments created by explosions, collisions or other breakup events."},
 mission:{label:"Mission-related objects",color:0x72d9ff,desc:"Adapters, covers and other hardware released during missions."},
 unidentified:{label:"Unidentified objects",color:0xc59cff,desc:"Detected objects that cannot yet be confidently linked to a source."},
 tiny:{label:"1 mm–1 cm debris cloud",color:0xffe36e,desc:"A conceptual visualisation of the enormous population of smaller debris."},
 pslv:{label:"PSLV-C3 breakup debris",color:0xff4d72,desc:"A dedicated layer for the PSLV-C3 upper-stage fragmentation discussed in the article. Positions are illustrative, not a live catalogue."}
};

const SPECIAL=[
 {key:"iss",name:"ISS",type:"active",r:1.48,color:0xffffff,desc:"International Space Station — a crewed orbital platform that must operate safely in an increasingly crowded orbital environment."},
 {key:"spadex",name:"SpaDeX",type:"active",r:1.55,color:0x5dd9ff,desc:"India's rendezvous, docking and undocking demonstration. Its servicing-related technologies connect directly to safer, more sustainable space operations."},
 {key:"clearspace",name:"ClearSpace-1",type:"mission",r:1.82,color:0x72d9ff,desc:"An ESA-supported active debris-removal mission concept: a servicing spacecraft captures and removes an unwanted orbital object."},
 {key:"pslv-special",name:"PSLV-C3 debris",type:"pslv",r:2.12,color:0xff4d72,desc:"The PSLV-C3 upper stage fragmented in 2001. ISRO's 2025 report says 33 fragments remained in orbit at the end of 2025; this layer is a representative visualisation."}
];

const COLORS=Object.fromEntries(Object.entries(TYPES).map(([k,v])=>[k,v.color]));
function seeded(i){const x=Math.sin(i*12.9898)*43758.5453;return x-Math.floor(x)}
function orbitPoint(i,count,r,tilt=0){
 const a=(i/Math.max(count,1))*Math.PI*2;
 const p=new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0);
 p.applyAxisAngle(new THREE.Vector3(1,0,0),tilt);
 p.applyAxisAngle(new THREE.Vector3(0,1,0),(seeded(i+91)-.5)*.75);
 return p;
}
function labelSprite(text,color="#ffffff"){
 const c=document.createElement("canvas");c.width=640;c.height=92;
 const x=c.getContext("2d");x.font="600 26px Arial";x.fillStyle=color;x.shadowColor="#000";x.shadowBlur=8;x.fillText(text,10,48);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));
 s.scale.set(2.05,.3,1);return s;
}

export default function Orbit3D({onSelect}){
 const mount=useRef(null);
 const cameraRef=useRef(null);
 const controlsRef=useRef(null);
 const pausedRef=useRef(false);
 const speedRef=useRef(1);
 const modeRef=useRef("environment");
 const layersRef=useRef(Object.fromEntries(Object.keys(TYPES).map(k=>[k,true])));
 const onSelectRef=useRef(onSelect);
 const groupsRef=useRef({});
 const specialGroupRef=useRef(null);
 const radarRef=useRef(null);
 const cleanupRef=useRef(null);
 const collisionRef=useRef(null);
 const [paused,setPaused]=useState(false);
 const [speed,setSpeed]=useState(1);
 const [layers,setLayers]=useState(Object.fromEntries(Object.keys(TYPES).map(k=>[k,true])));
 const [mode,setMode]=useState("environment");
 const [selected,setSelected]=useState(null);
 const [hud,setHud]=useState(true);

 useEffect(()=>{onSelectRef.current=onSelect},[onSelect]);
 useEffect(()=>{pausedRef.current=paused},[paused]);
 useEffect(()=>{speedRef.current=speed},[speed]);
 useEffect(()=>{modeRef.current=mode},[mode]);
 useEffect(()=>{layersRef.current=layers;Object.entries(groupsRef.current).forEach(([k,g])=>{if(g)g.visible=layers[k]!==false})},[layers]);

 useEffect(()=>{
  const el=mount.current;if(!el)return;
  let disposed=false;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x010308);
  const camera=new THREE.PerspectiveCamera(42,Math.max(el.clientWidth,1)/Math.max(el.clientHeight,1),.03,100);
  camera.position.set(0,2.8,7.2);cameraRef.current=camera;
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  const mobile=window.matchMedia("(max-width: 700px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,mobile?1.35:1.6));
  renderer.setSize(el.clientWidth,el.clientHeight,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setAnimationLoop(null);
  el.appendChild(renderer.domElement);

  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=3;controls.maxDistance=13;
  controlsRef.current=controls;

  scene.add(new THREE.AmbientLight(0x64809a,.85));
  const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(4,3,5);scene.add(sun);

  const starGeo=new THREE.BufferGeometry(),starPos=[];
  for(let i=0;i<1500;i++){
   const r=18+seeded(i)*24,a=seeded(i+2)*Math.PI*2,b=Math.acos(2*seeded(i+3)-1);
   starPos.push(r*Math.sin(b)*Math.cos(a),r*Math.sin(b)*Math.sin(a),r*Math.cos(b));
  }
  starGeo.setAttribute("position",new THREE.Float32BufferAttribute(starPos,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xbddcff,size:.021,sizeAttenuation:true,opacity:.78,transparent:true})));

  const earth=new THREE.Mesh(
   new THREE.SphereGeometry(1.12,48,48),
   new THREE.MeshPhongMaterial({color:0x17516f,emissive:0x06111c,shininess:15})
  );scene.add(earth);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.18,40,40),new THREE.MeshBasicMaterial({color:0x55d8ff,transparent:true,opacity:.1,side:THREE.BackSide})));

  const netra=new THREE.Group();
  const netraBase=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,.08,8),new THREE.MeshBasicMaterial({color:0x72d9ff}));
  const netraDish=new THREE.Mesh(new THREE.SphereGeometry(.09,10,7,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff}));
  netraDish.position.y=.07;netraDish.rotation.x=-.45;netra.add(netraBase,netraDish);
  netra.position.set(-.48,.94,.45);
  netra.userData={special:{key:"netra",name:"NETRA / Hanle",type:"tracking",desc:"ISRO's Network for Space Objects Tracking and Analysis includes an optical telescope at Hanle, Ladakh, being established to strengthen India's space situational awareness. NETRA is a tracking capability on Earth, not orbital debris."}};
  earth.add(netra);

  const groups={};Object.keys(TYPES).forEach(k=>{groups[k]=new THREE.Group();groups[k].userData.layer=k;scene.add(groups[k])});groupsRef.current=groups;

  const bands={LEO:[1.42,1.78],MEO:[1.95,2.3],GEO:[2.52,2.68]};
  Object.entries(bands).forEach(([name,[a,b]],idx)=>{
   const r=(a+b)/2;
   const pts=new THREE.EllipseCurve(0,0,r,r*.72,0,Math.PI*2,false,0).getPoints(120).map(p=>new THREE.Vector3(p.x,p.y,0));
   const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:[0x4eeaff,0x9c7cff,0xffbd66][idx],transparent:true,opacity:.18}));
   line.rotation.x=(idx-.9)*.42;scene.add(line);
   const l=labelSprite(name,["#4eeaff","#c59cff","#ffbd66"][idx]);l.position.set(r,0,.02);scene.add(l);
  });

  const radii={active:1.48,dead:1.7,rocket:1.9,fragment:2.08,mission:2.32,unidentified:2.52,pslv:2.12};
  Object.entries(radii).forEach(([k,r])=>{
   const pts=new THREE.EllipseCurve(0,0,r,r*(.66+.18*seeded(r*10)),0,Math.PI*2,false,0).getPoints(96).map(p=>new THREE.Vector3(p.x,p.y,0));
   const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:COLORS[k],transparent:true,opacity:.1}));
   line.rotation.x=(seeded(r*20)-.5)*1.05;groups[k].add(line);
  });

  // Use instancing for repeated orbital objects: far fewer draw calls than hundreds of Mesh nodes.
  const counts={active:42,dead:28,rocket:22,fragment:95,mission:24,unidentified:28,pslv:33};
  const instanceMeshes={};
  const instanceKeys={};
  const temp=new THREE.Object3D();
  Object.entries(counts).forEach(([k,n])=>{
   const radius=k==="rocket"?.055:k==="fragment"||k==="pslv"?.03:k==="mission"?.04:k==="unidentified"?.035:.05;
   const geo=new THREE.SphereGeometry(radius,k==="fragment"||k==="pslv"?5:7,k==="fragment"||k==="pslv"?5:7);
   const mat=new THREE.MeshBasicMaterial({color:COLORS[k]});
   const mesh=new THREE.InstancedMesh(geo,mat,n);
   mesh.userData={layer:k};
   for(let i=0;i<n;i++){
    const p=orbitPoint(i+5,n,radii[k],(seeded(i+13)-.5)*1.15);
    temp.position.copy(p);temp.rotation.set(0,0,0);temp.scale.setScalar(1);temp.updateMatrix();mesh.setMatrixAt(i,temp.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
   groups[k].add(mesh);instanceMeshes[k]=mesh;instanceKeys[k]=n;
  });

  const tinyGeo=new THREE.BufferGeometry(),tinyPos=[];
  for(let i=0;i<1100;i++){const a=seeded(i)*Math.PI*2,r=1.5+seeded(i+2)*1.15,y=(seeded(i+3)-.5)*1.05;tinyPos.push(Math.cos(a)*r,y,Math.sin(a)*r)}
  tinyGeo.setAttribute("position",new THREE.Float32BufferAttribute(tinyPos,3));
  groups.tiny.add(new THREE.Points(tinyGeo,new THREE.PointsMaterial({color:COLORS.tiny,size:.016,transparent:true,opacity:.52})));

  const specialGroup=new THREE.Group();scene.add(specialGroup);specialGroupRef.current=specialGroup;
  SPECIAL.forEach((o,i)=>{
   const g=new THREE.Group();g.position.copy(orbitPoint(.12+i*.27,1,o.r,.3+i*.35));
   g.add(new THREE.Mesh(new THREE.SphereGeometry(.07,10,10),new THREE.MeshBasicMaterial({color:o.color})));
   const l=labelSprite(o.name,"#ffffff");l.position.y=.16;g.add(l);g.userData={special:o};specialGroup.add(g);
  });

  const radar=new THREE.Group();scene.add(radar);radarRef.current=radar;
  for(let i=0;i<6;i++){
   const a=i/6*Math.PI*2,p1=new THREE.Vector3(Math.cos(a)*1.3,Math.sin(a)*1.3,0),p2=new THREE.Vector3(Math.cos(a)*3.1,Math.sin(a)*3.1,0);
   radar.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1,p2]),new THREE.LineBasicMaterial({color:0x70e1ff,transparent:true,opacity:.3})));
  }

  const cleanup=new THREE.Group();scene.add(cleanup);cleanupRef.current=cleanup;
  const target=new THREE.Mesh(new THREE.BoxGeometry(.22,.1,.1),new THREE.MeshBasicMaterial({color:0xb8c0cc}));target.position.set(2.15,.35,.2);cleanup.add(target);
  const serv=new THREE.Mesh(new THREE.ConeGeometry(.1,.35,8),new THREE.MeshBasicMaterial({color:0x72d9ff}));serv.position.set(1.65,.3,.2);serv.rotation.z=-Math.PI/2;cleanup.add(serv);

  const collision=new THREE.Group();scene.add(collision);collisionRef.current=collision;
  const center=new THREE.Mesh(new THREE.SphereGeometry(.1,7,7),new THREE.MeshBasicMaterial({color:0xff6f8f}));center.position.set(2.05,.1,.2);collision.add(center);
  for(let i=0;i<22;i++){const p=new THREE.Mesh(new THREE.SphereGeometry(.022,4,4),new THREE.MeshBasicMaterial({color:0xff6f8f}));const a=seeded(i)*Math.PI*2,rr=.2+seeded(i+40)*.8;p.position.set(2.05+Math.cos(a)*rr,.1+(seeded(i+50)-.5)*rr,.2+Math.sin(a)*rr);collision.add(p)}

  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  const click=e=>{
   const r=renderer.domElement.getBoundingClientRect();mouse.x=(e.clientX-r.left)/r.width*2-1;mouse.y=-(e.clientY-r.top)/r.height*2+1;
   ray.setFromCamera(mouse,camera);
   const hits=ray.intersectObjects([specialGroup,...Object.values(groups),netra],true);
   if(!hits.length)return;
   let o=hits[0].object;
   while(o&&!o.userData.type&&!o.userData.special&&!o.userData.layer)o=o.parent;
   if(o?.userData?.special){
    setSelected(o.userData.special);onSelectRef.current?.(o.userData.special);
    return;
   }
   if(o?.userData?.layer){
    const data={key:o.userData.layer,name:TYPES[o.userData.layer].label,tag:o.userData.layer.toUpperCase(),desc:TYPES[o.userData.layer].desc,why:"This category is part of the orbital environment described in the article."};
    setSelected(data);onSelectRef.current?.(data);
   }
  };
  renderer.domElement.addEventListener("click",click);

  const clock=new THREE.Clock();let last=0;
  const animate=(time)=>{
   if(disposed)return;
   const minFrameMs=mobile?33:16;
   if(time-last<minFrameMs){return}
   last=time;
   const dt=Math.min(clock.getDelta(),.05);
   Object.entries(groups).forEach(([k,g])=>{g.visible=layersRef.current[k]!==false});
   specialGroup.children.forEach(child=>{const type=child.userData.special?.type;child.visible=type==="tracking"||layersRef.current[type]!==false});
   radar.visible=modeRef.current==="tracking";cleanup.visible=modeRef.current==="cleanup";collision.visible=modeRef.current==="kessler";
   if(!pausedRef.current){
    earth.rotation.y+=dt*.035*speedRef.current;
    Object.values(groups).forEach((g,i)=>{g.rotation.y+=dt*.022*speedRef.current*(i%2?-.7:1)});
    specialGroup.rotation.y+=dt*.025*speedRef.current;
    collision.rotation.y+=dt*.12*speedRef.current;
   }
   controls.update();renderer.render(scene,camera);
  };
  renderer.setAnimationLoop(animate);

  const resize=()=>{
   const w=Math.max(el.clientWidth,1),h=Math.max(el.clientHeight,1);
   camera.aspect=w/h;camera.updateProjectionMatrix();
   renderer.setSize(w,h,false);
  };
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(el);

  return()=>{
   disposed=true;resizeObserver.disconnect();renderer.setAnimationLoop(null);
   renderer.domElement.removeEventListener("click",click);controls.dispose();
   scene.traverse(o=>{
    if(o.geometry)o.geometry.dispose();
    if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}
   });
   renderer.dispose();if(renderer.domElement.parentNode===el)el.removeChild(renderer.domElement);
   groupsRef.current={};cameraRef.current=null;controlsRef.current=null;
  };
 },[]);

 const setModeSafe=next=>setMode(next);
 const toggle=k=>setLayers(v=>({...v,[k]:!v[k]}));
 const reset=()=>{
  setModeSafe("environment");setSpeed(1);setPaused(false);setSelected(null);
  if(cameraRef.current&&controlsRef.current){
   cameraRef.current.position.set(0,2.8,7.2);controlsRef.current.target.set(0,0,0);controlsRef.current.update();
  }
 };
 const modes=useMemo(()=>[["environment","ORBIT"],["tracking","TRACKING"],["kessler","KESSLER"],["cleanup","CLEANUP"]],[]);

 return <div className="orbit3d-shell">
  <div ref={mount} className="orbit3d-canvas"/>
  {hud&&<div className="orbitHud"><div className="hudTop"><span><i className="livePulse"/> ORBIT ATLAS / 3D</span><b>{mode.toUpperCase()} · ARTICLE OBJECTS</b></div><div className="hudBottom"><div><strong>EARTH ORBIT</strong><span>LEO · MEO · GEO · satellites · rockets · debris · India missions</span></div><div className="hudHint">DRAG · ZOOM · CLICK OBJECTS</div></div></div>}
  <div className="modeBar">{modes.map(([k,l])=><button key={k} className={mode===k?"active":""} onClick={()=>setModeSafe(k)}>{l}</button>)}</div>
  <div className="orbitControls"><button onClick={()=>setPaused(v=>!v)} title="Pause / play">{paused?<Play size={16}/>:<Pause size={16}/>}</button><button onClick={()=>setSpeed(v=>v===1?5:v===5?20:1)} title="Simulation speed"><span className="speed">{speed}×</span></button><button onClick={()=>setHud(v=>!v)} title="HUD"><SlidersHorizontal size={16}/></button><button onClick={reset} title="Reset view"><RotateCcw size={16}/></button><button onClick={()=>mount.current?.requestFullscreen?.()} title="Fullscreen"><Maximize2 size={16}/></button></div>
  <div className="layerPanel"><div className="layerTitle">EVERYTHING MENTIONED IN THE ARTICLE <span>toggle</span></div>{Object.entries(TYPES).map(([k,v])=><button key={k} onClick={()=>toggle(k)} className={layers[k]?"on":""}><i style={{background:"#"+v.color.toString(16).padStart(6,"0")}}/><span>{v.label}</span></button>)}</div>
  <div className="articleLegend"><span>LEO</span><span>MEO</span><span>GEO</span><small>Article-linked objects are shown as representative visuals, not live telemetry.</small></div>
  {selected&&<div className="orbitInspect"><button onClick={()=>setSelected(null)}>×</button><span>{selected.tag||selected.type?.toUpperCase()}</span><h4>{selected.name}</h4><small>{selected.desc}</small></div>}
 </div>
}
