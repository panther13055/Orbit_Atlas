import React,{useEffect,useRef,useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {Maximize2,Pause,Play,RotateCcw,SlidersHorizontal,ZoomIn} from "lucide-react";

const TYPES={
  active:{label:"Active satellites",color:0x7dff9c,desc:"Operational spacecraft still performing a mission."},
  dead:{label:"Dead / inactive satellites",color:0xb8c0cc,desc:"Payloads that no longer perform their mission."},
  rocket:{label:"Rocket bodies",color:0xffb36b,desc:"Spent launch-vehicle stages and related hardware."},
  fragment:{label:"Fragmentation debris",color:0xff6f8f,desc:"Pieces produced by collisions, explosions or breakups."},
  mission:{label:"Mission-related objects",color:0x72d9ff,desc:"Covers, adapters, caps and other hardware released during missions."},
  unidentified:{label:"Unidentified objects",color:0xc59cff,desc:"Detected objects not yet confidently linked to a known origin."},
  tiny:{label:"Small debris cloud",color:0xffe36e,desc:"A conceptual statistical cloud representing millimetre-to-centimetre debris."}
};
function seeded(i){const x=Math.sin(i*12.9898)*43758.5453;return x-Math.floor(x)}
function pointOnOrbit(i,count,r,tilt){
  const a=(i/count)*Math.PI*2;const p=new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0);
  p.applyAxisAngle(new THREE.Vector3(1,0,0),tilt);p.applyAxisAngle(new THREE.Vector3(0,1,0),(seeded(i+210)-.5)*.7);return p;
}
export default function Orbit3D({onSelect}){
 const mount=useRef(null);const sceneRef=useRef(null);const [paused,setPaused]=useState(false);const [selected,setSelected]=useState(null);const [layers,setLayers]=useState(Object.keys(TYPES).reduce((a,k)=>(a[k]=true,a),{}));const [speed,setSpeed]=useState(1);const [hud,setHud]=useState(true);
 useEffect(()=>{
  const el=mount.current;if(!el)return;const scene=new THREE.Scene();scene.background=new THREE.Color(0x02040a);sceneRef.current=scene;
  const camera=new THREE.PerspectiveCamera(42,el.clientWidth/el.clientHeight,.05,100);camera.position.set(0,3.1,7.4);
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;el.appendChild(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=3.2;controls.maxDistance=12;controls.target.set(0,0,0);
  scene.add(new THREE.AmbientLight(0x6688aa,.8));const sun=new THREE.DirectionalLight(0xffffff,2.4);sun.position.set(4,3,5);scene.add(sun);
  const starGeo=new THREE.BufferGeometry(),starPts=[];for(let i=0;i<1800;i++){const r=18+seeded(i)*22,a=seeded(i+2)*Math.PI*2,b=Math.acos(2*seeded(i+3)-1);starPts.push(r*Math.sin(b)*Math.cos(a),r*Math.sin(b)*Math.sin(a),r*Math.cos(b));}starGeo.setAttribute("position",new THREE.Float32BufferAttribute(starPts,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xbddcff,size:.025,sizeAttenuation:true,transparent:true,opacity:.85})));
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1.12,64,64),new THREE.MeshPhongMaterial({color:0x174f70,emissive:0x06121d,shininess:12}));scene.add(earth);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(1.17,48,48),new THREE.MeshBasicMaterial({color:0x5dd9ff,transparent:true,opacity:.11,side:THREE.BackSide}));scene.add(glow);
  const groups={};Object.keys(TYPES).forEach(k=>{groups[k]=new THREE.Group();groups[k].userData.layer=k;scene.add(groups[k]);});
  const radii={active:1.48,dead:1.68,rocket:1.88,fragment:2.08,mission:2.3,unidentified:2.5};
  Object.entries(radii).forEach(([k,r])=>{const curve=new THREE.EllipseCurve(0,0,r,r*(.66+.18*seeded(r*10)),0,Math.PI*2,false,0);const pts=curve.getPoints(128).map(p=>new THREE.Vector3(p.x,p.y,0));const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:TYPES[k].color,transparent:true,opacity:.15}));line.rotation.x=(seeded(r*20)-.5)*1.1;line.rotation.z=(seeded(r*30)-.5)*.8;groups[k].add(line);});
  const items=[];const counts={active:42,dead:25,rocket:20,fragment:82,mission:22,unidentified:25};
  Object.entries(counts).forEach(([k,count])=>{for(let i=0;i<count;i++){const size=k==="rocket"?.075:k==="fragment"?.035:k==="mission"?.045:k==="unidentified"?.04:.06;const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,k==="fragment"?6:10,k==="fragment"?6:10),new THREE.MeshBasicMaterial({color:TYPES[k].color}));const g=new THREE.Group();g.add(mesh);g.position.copy(pointOnOrbit(i+7,count,radii[k],(seeded(i+13)-.5)*1.15));g.userData={type:k};groups[k].add(g);items.push(g);}});
  const tinyGeo=new THREE.BufferGeometry(),tinyPos=[];for(let i=0;i<1200;i++){const a=seeded(i)*Math.PI*2,r=1.55+seeded(i+2)*1.05,y=(seeded(i+3)-.5)*1.0;tinyPos.push(Math.cos(a)*r,y,Math.sin(a)*r);}tinyGeo.setAttribute("position",new THREE.Float32BufferAttribute(tinyPos,3));groups.tiny.add(new THREE.Points(tinyGeo,new THREE.PointsMaterial({color:TYPES.tiny.color,size:.018,transparent:true,opacity:.55})));
  const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();
  const click=e=>{const r=renderer.domElement.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(items,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.type)o=o.parent;if(o){setSelected(o.userData.type);onSelect?.(o.userData.type)}}};
  renderer.domElement.addEventListener("click",click);const clock=new THREE.Clock();let raf;
  const animate=()=>{raf=requestAnimationFrame(animate);const dt=clock.getDelta();if(!paused){Object.entries(groups).forEach(([k,g],idx)=>{g.rotation.y+=dt*(k==="tiny"?.018:.04*speed*(idx%2?-.65:1));});earth.rotation.y+=dt*.035*speed;glow.rotation.y-=dt*.012;}controls.update();renderer.render(scene,camera)};animate();
  const resize=()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer.setSize(el.clientWidth,el.clientHeight)};window.addEventListener("resize",resize);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);renderer.domElement.removeEventListener("click",click);controls.dispose();renderer.dispose();el.removeChild(renderer.domElement)};
 },[onSelect,paused,speed]);
 useEffect(()=>{const root=sceneRef.current;if(!root)return;Object.entries(layers).forEach(([k,v])=>{const g=root.children.find(x=>x.userData?.layer===k);if(g)g.visible=v});},[layers]);
 const toggle=k=>setLayers(v=>({...v,[k]:!v[k]}));
 return <div className="orbit3d-shell">
  <div ref={mount} className="orbit3d-canvas"/>
  {hud&&<div className="orbitHud"><div className="hudTop"><span><i className="livePulse"/> ORBITAL VISUAL MODEL</span><b>EARTH ORBIT / 3D</b></div><div className="hudBottom"><div><strong>ORBIT ATLAS</strong><span>Representative distribution · not live telemetry</span></div><div className="hudHint">DRAG TO ROTATE · SCROLL TO ZOOM</div></div></div>}
  <div className="orbitControls"><button onClick={()=>setPaused(v=>!v)} title={paused?"Play":"Pause"}>{paused?<Play size={16}/>:<Pause size={16}/>}</button><button onClick={()=>setSpeed(v=>v===1?5:v===5?20:1)} title="Simulation speed"><span className="speed">{speed}×</span></button><button onClick={()=>setHud(v=>!v)} title="Toggle HUD"><SlidersHorizontal size={16}/></button><button onClick={()=>setHud(true)} title="Reset view"><RotateCcw size={16}/></button><button onClick={()=>mount.current?.requestFullscreen?.()} title="Fullscreen"><Maximize2 size={16}/></button></div>
  <div className="layerPanel"><div className="layerTitle">OBJECT LAYERS <span>toggle</span></div>{Object.entries(TYPES).map(([k,v])=><button key={k} onClick={()=>toggle(k)} className={layers[k]?"on":""}><i style={{background:"#"+v.color.toString(16).padStart(6,"0")}}/><span>{v.label}</span></button>)}</div>
  {selected&&<div className="orbitInspect"><button onClick={()=>setSelected(null)}>×</button><span>{TYPES[selected].label}</span><h4>{TYPES[selected].desc}</h4><small>Representative visualization. Categories follow the ESA/ISRO material used by Orbit Atlas; positions are illustrative, not a live catalogue.</small></div>}
 </div>
}
