import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {ArrowDown,ArrowUpRight,ChevronRight,CircleHelp,ExternalLink,Globe2,Layers,Menu,Orbit,Radio,Search,Shield,Sparkles,X,Zap} from "lucide-react";
import "./styles.css";

const sources=[
  ["ESA Space Debris","https://www.esa.int/Space_Safety/Space_Debris/Space_debris"],
  ["ESA Space Environment Report 2026","https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026"],
  ["ESA DISCOS statistics","https://sdup.esoc.esa.int/discosweb/statistics/"],
  ["ESA mitigation","https://www.esa.int/Space_Safety/Space_Debris/Mitigating_space_debris_generation"],
  ["ISRO ISSAR-2025","https://www.isro.gov.in/Indian_Space_Situational_Awareness_Report_2025.html"],
  ["NASA Eyes","https://science.nasa.gov/eyes/"]
];
const objects={
  active:{name:"Active satellite",tag:"WORKING",desc:"A spacecraft still performing its mission — communicating, imaging Earth, navigating or doing science.",why:"Active spacecraft are valuable infrastructure, but they must share increasingly crowded orbital lanes.",icon:"●"},
  dead:{name:"Dead satellite",tag:"END OF LIFE",desc:"A satellite that no longer performs its mission but remains in orbit.",why:"Without safe disposal, it can remain a future collision target.",icon:"◇"},
  rocket:{name:"Rocket body",tag:"LEFTOVER HARDWARE",desc:"A spent upper stage or other launch hardware left in orbit after delivering a payload.",why:"Large objects can fragment and create many smaller pieces after a collision or breakup.",icon:"△"},
  fragment:{name:"Fragmentation debris",tag:"BREAKUP",desc:"Pieces created when satellites or rocket bodies collide, explode or break apart.",why:"One breakup can multiply the number of objects that must be tracked.",icon:"✦"},
  tiny:{name:"Small debris",tag:"HARD TO SEE",desc:"Millimetre-to-centimetre material such as paint flakes, metal fragments and tiny particles.",why:"Small debris can be difficult to track yet still damage spacecraft at orbital velocity.",icon:"·"}
};
const nav=[["The orbit","orbit"],["What is debris?","debris"],["The numbers","numbers"],["Tracking","tracking"],["Kessler Syndrome","kessler"],["Cleanup","cleanup"],["India","india"],["The way forward","future"]];

function App(){
  const [menu,setMenu]=useState(false),[selected,setSelected]=useState(null),[search,setSearch]=useState(""),[tour,setTour]=useState(false),[scale,setScale]=useState(55);
  useEffect(()=>{document.title="Orbit Atlas — Earth’s Orbit Is Not Empty"},[]);
  const filtered=useMemo(()=>Object.entries(objects).filter(([,v])=>
    (v.name+" "+v.tag).toLowerCase().includes(search.toLowerCase())),[search]);
  const scroll=id=>{document.getElementById(id)?.scrollIntoView({behavior:"smooth"});setMenu(false)};
  return <div className="app">
    <div className="grain"/>
    <header className="nav">
      <button className="brand" onClick={()=>scroll("top")} aria-label="Back to top"><span className="brandmark"><Orbit size={19}/></span><span>ORBIT <b>ATLAS</b></span></button>
      <nav>{nav.slice(0,6).map(([label,id])=><button key={id} onClick={()=>scroll(id)}>{label}</button>)}</nav>
      <button className="menu" onClick={()=>setMenu(!menu)} aria-label="Open navigation"><Menu size={20}/></button>
      <button className="tour" onClick={()=>setTour(true)}><Sparkles size={16}/> 60 sec tour</button>
    </header>
    {menu&&<div className="mobileNav">{nav.map(([label,id])=><button key={id} onClick={()=>scroll(id)}>{label}</button>)}</div>}
    <main id="top">
      <section className="hero" id="orbit">
        <div className="heroCopy"><div className="eyebrow"><span/> EARTH ORBIT / FIELD GUIDE 01</div>
          <h1>Earth’s orbit<br/><em>is not empty.</em></h1>
          <p className="lede">We built a highway around our planet. Now we have to learn how to keep it usable.</p>
          <div className="heroActions"><button className="primary" onClick={()=>scroll("debris")}>Explore the orbit <ChevronRight size={18}/></button><button className="ghost" onClick={()=>setTour(true)}>How does this work?</button></div>
          <div className="heroMeta"><span><strong>SPACE DEBRIS</strong><small>A growing orbital problem</small></span><span><strong>2026 REPORT</strong><small>ESA + ISRO snapshot</small></span></div>
        </div>
        <OrbitScene onSelect={setSelected}/>
      </section>

      <section className="chapter" id="debris"><div className="chapterNum">01</div><div className="chapterTitle"><p>THE BASICS</p><h2>So, what exactly<br/>is <em>space junk?</em></h2></div><div className="chapterText"><p>Space debris is human-made material left in Earth orbit that no longer has a useful purpose. That includes dead satellites, spent rocket stages, fragments from breakups and tiny pieces we can barely see.</p><p>The strange part is the scale. Something microscopic from Earth can become a serious engineering problem when it is moving around a planet at orbital velocity.</p></div></section>

      <section className="explorer"><div className="explorerHead"><div><p>CLICK TO INSPECT</p><h3>Everything in orbit has a story.</h3></div><label className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search object types..." aria-label="Search object types"/></label></div>
        <div className="objectGrid">{filtered.map(([k,v])=><button className="objectCard" key={k} onClick={()=>setSelected(k)}><span className="objectGlyph">{v.icon}</span><span className="objectTag">{v.tag}</span><strong>{v.name}</strong><small>Click to understand →</small></button>)}</div>
      </section>

      <section className="numbers" id="numbers"><div className="sectionIntro"><p>THE ORBITAL SNAPSHOT</p><h2>The problem is<br/><em>getting crowded.</em></h2><span>Report snapshots, not live telemetry.</span></div><div className="stats"><Stat n="300+" t="launches in 2025" s="ESA / 2026 report"/><Stat n="4,000+" t="new payloads in 2025" s="ESA / 2026 report"/><Stat n="47,110" t="regularly tracked objects" s="ESA / July 2026"/><Stat n="~1.5M" t="debris objects, 1–10 cm" s="ESA estimate"/></div></section>

      <section className="tracking" id="tracking"><div className="radar"><div className="radarRing"/><div className="radarRing r2"/><div className="sweep"/><span className="blip b1"/><span className="blip b2"/><span className="blip b3"/></div><div className="trackCopy"><p>02 / TRACKING</p><h2>How do you track<br/><em>something this small?</em></h2><p>Ground radars and optical telescopes observe objects, then teams combine measurements with orbital models to estimate where each object will be next.</p><div className="process"><div><b>01</b><span>OBSERVE</span></div><div><b>02</b><span>MEASURE</span></div><div><b>03</b><span>PREDICT</span></div><div><b>04</b><span>ALERT</span></div></div></div></section>

      <section className="collision"><div><p>INTERACTIVE MODEL</p><h2>When two orbital paths<br/><em>cross.</em></h2><p className="muted">Move the geometry slider. This is a conceptual visualization — not a real collision predictor.</p><input aria-label="Relative orbital geometry" type="range" min="0" max="100" value={scale} onChange={e=>setScale(+e.target.value)}/><div className="riskLabel"><span>RELATIVE GEOMETRY</span><strong>{scale<35?"LOW":"HIGH"} CONJUNCTION RISK</strong></div></div><div className="orbitModel"><div className="path pA"/><div className="path pB" style={{transform:"rotate("+(20+scale/3)+"deg)"}}/><span className="sat satA">●</span><span className="sat satB">●</span><div className="centerEarth"/></div></section>

      <section className="kessler" id="kessler"><div className="kesslerVisual"><span className="core"/>{Array.from({length:8}).map((_,i)=><i key={i}/>)}</div><div className="kesslerCopy"><p>03 / CASCADING RISK</p><h2>Kessler<br/><em>Syndrome</em></h2><p>A collision creates fragments. More fragments create more collision opportunities. In a severe scenario, the debris population can become self-reinforcing.</p><div className="steps"><span><b>01</b>Collision</span><span><b>02</b>Fragments</span><span><b>03</b>More targets</span><span><b>04</b>Cascade risk</span></div><small>It is a risk scenario, not a claim that an unstoppable cascade has already begun.</small></div></section>

      <section className="india" id="india"><div className="indiaBadge"><Globe2 size={22}/><span>INDIA / ORBITAL SAFETY</span></div><h2>India is building<br/><em>eyes on the sky.</em></h2><div className="indiaGrid"><div><strong>~160,000</strong><span>close-approach alerts in 2025</span></div><div><strong>18</strong><span>collision-avoidance manoeuvres for Indian satellites</span></div><div><strong>2030</strong><span>DFSM target for debris-free space missions</span></div></div><p>ISRO’s Space Situational Awareness work includes tracking, conjunction assessment and NETRA capabilities. SpaDeX also demonstrated autonomous rendezvous and docking — technologies that could matter for future in-space servicing.</p><a href={sources[4][1]} target="_blank" rel="noreferrer">Read ISSAR-2025 <ExternalLink size={15}/></a></section>

      <section className="cleanup" id="cleanup"><div className="cleanupArt"><div className="serviceSat"><span/><span/><span/></div><div className="targetDebris">◇</div><div className="tether"/></div><div className="cleanupCopy"><p>04 / CLEANUP</p><h2>Can we<br/><em>clean it up?</em></h2><p>In theory, yes. In practice, an orbital garbage truck has to find an object, match its orbit, approach it safely, capture or attach to it, and then change its trajectory.</p><div className="miniCards"><div><Shield size={17}/><b>REMOVE</b><span>Active debris removal</span></div><div><Zap size={17}/><b>SERVICE</b><span>Extend satellite life</span></div><div><Layers size={17}/><b>PREVENT</b><span>Design for disposal</span></div></div></div></section>

      <section className="future" id="future"><div className="futureTop"><p>05 / THE WAY FORWARD</p><h2>Before we build<br/>more in orbit, <em>we need a plan.</em></h2></div><div className="futureGrid"><Card icon={<Shield/>} t="Design for disposal" d="Build spacecraft so their end-of-life path is part of the mission from day one."/><Card icon={<Radio/>} t="Smarter traffic management" d="Better tracking and coordination can reduce dangerous close approaches."/><Card icon={<Orbit/>} t="In-orbit servicing" d="Refuelling, repair and life extension could reduce the need to replace spacecraft."/><Card icon={<Sparkles/>} t="Zero Debris" d="ESA’s approach pushes the industry toward dramatically lower debris generation."/></div></section>

      <section className="sources" id="sources"><div><p>EXPLORE THE SOURCES</p><h2>The atlas is only<br/><em>the beginning.</em></h2></div><div className="sourceList">{sources.map(([n,u])=><a key={n} href={u} target="_blank" rel="noreferrer"><span>{n}</span><ExternalLink size={15}/></a>)}</div></section>
    </main>
    <footer><span>ORBIT ATLAS · EARTH ORBIT FIELD GUIDE</span><button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})}>Back to top <ArrowUpRight size={15}/></button></footer>
    {selected&&<div className="modal" onClick={()=>setSelected(null)}><div className="inspect" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><span className="objectTag">{objects[selected].tag}</span><h2>{objects[selected].name}</h2><p>{objects[selected].desc}</p><div className="why"><CircleHelp size={18}/><div><b>Why it matters</b><span>{objects[selected].why}</span></div></div><div className="insight"><span>ORBIT ATLAS NOTE</span><strong>Every object has an orbit. The challenge is keeping those orbits predictable.</strong></div></div></div>}
    {tour&&<Tour close={()=>setTour(false)} scroll={scroll}/>}
  </div>;
}
function OrbitScene({onSelect}){return <div className="scene" aria-label="Interactive illustration of Earth orbit and common space-object types"><div className="earth"><div className="land l1"/><div className="land l2"/><div className="land l3"/><span className="atmo"/></div>{Object.keys(objects).map((k,i)=><button key={k} className={"orbObj o"+i} onClick={()=>onSelect(k)} title={objects[k].name}>{objects[k].icon}</button>)}<div className="ring ring1"/><div className="ring ring2"/><div className="ring ring3"/><div className="legend"><span><i className="dot live"/>active</span><span><i className="dot debris"/>debris</span><span><i className="dot rocket"/>rocket body</span></div></div>}
function Stat({n,t,s}){return <div className="stat"><strong>{n}</strong><span>{t}</span><small>{s}</small></div>}
function Card({icon,t,d}){return <div className="futureCard">{icon}<h3>{t}</h3><p>{d}</p></div>}
function Tour({close,scroll}){const [step,setStep]=useState(0);const steps=[["START HERE","Space debris is human-made material left in orbit."],["ZOOM IN","A tiny object can become dangerous at orbital velocity."],["SEE THE CASCADE","Kessler Syndrome describes a possible self-reinforcing collision chain."],["LOOK AHEAD","Tracking, removal and responsible end-of-life design are the path forward."]];return <div className="tourOverlay"><div className="tourCard" role="dialog" aria-modal="true"><button className="close" onClick={close} aria-label="Close"><X/></button><span>60 SECOND TOUR · {step+1}/4</span><h2>{steps[step][0]}</h2><p>{steps[step][1]}</p><div className="tourDots">{steps.map((_,i)=><i key={i} className={i===step?"on":""}/>)}</div><div className="tourActions"><button onClick={close}>Exit</button>{step<3?<button className="primary" onClick={()=>{setStep(step+1);if(step===0)scroll("debris");if(step===1)scroll("kessler");if(step===2)scroll("cleanup")}}>Next <ChevronRight size={17}/></button>:<button className="primary" onClick={()=>{close();scroll("sources")}}>Explore sources <ArrowDown size={17}/></button>}</div></div></div>}
createRoot(document.getElementById("root")).render(<App/>);