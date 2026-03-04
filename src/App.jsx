import { useState, useRef, useEffect, useCallback } from "react";

// ── Storage ───────────────────────────────────────────────────
async function dbGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
async function dbSet(key,val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
async function fileToDataUrlCompressed(file,maxSize=512,quality=0.8){
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onerror=()=>reject(new Error("file read failed"));
    fr.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("image decode failed"));
      img.onload=()=>{
        const scale=Math.min(1,maxSize/Math.max(img.width,img.height));
        const w=Math.max(1,Math.round(img.width*scale));
        const h=Math.max(1,Math.round(img.height*scale));
        const c=document.createElement("canvas");
        c.width=w;c.height=h;
        const ctx=c.getContext("2d");
        if(!ctx){reject(new Error("canvas failed"));return;}
        ctx.drawImage(img,0,0,w,h);
        resolve(c.toDataURL("image/jpeg",quality));
      };
      img.src=String(fr.result||"");
    };
    fr.readAsDataURL(file);
  });
}

// ── Constants ─────────────────────────────────────────────────
const UNSPLASH = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
  "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
  "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&q=80",
];
const FRONT_AVATARS = ["https://i.pravatar.cc/300?img=32","https://i.pravatar.cc/300?img=45","https://i.pravatar.cc/300?img=12"];
const QUOTES = [
  `You can't say "I gave up" without saying "I gay" 🏳️‍🌈`,
  "Your future self is watching. Don't disappoint him, loser.",
  "Pain is temporary. Skipping leg day is forever.",
  "You vs. you. You're losing btw.",
  "If you quit now, your ex was right about you.",
];
const ROASTS = [
  {max:0,msg:"You woke up and chose failure. Iconic."},
  {max:2,msg:"Mediocrity has entered the chat."},
  {max:4,msg:"Halfway. The bare minimum. Classic."},
  {max:6,msg:"Almost! One more and you stop being a disappointment."},
  {max:99,msg:"ALL DONE. Actual legend. 🐐"},
];
const GOGGINS = ["STAY HARD!! 🗣️","WHO'S GONNA CARRY THE BOATS?!","YOU ARE NOT DONE!!","GET AFTER IT!!!","NO EXCUSES!!"];
const SNAP_CHALLENGES = [
  {task:"10 pushups", icon:"💪", desc:"Drop and give me 10. RIGHT NOW."},
  {task:"drink a full glass of water", icon:"💧", desc:"Hydrate or diedrate. Go."},
  {task:"5 minutes of stretching", icon:"🧘", desc:"You're stiff as a board. Fix it."},
  {task:"20 jumping jacks", icon:"🦘", desc:"Get that heart rate up. NOW."},
  {task:"make your bed", icon:"🛏️", desc:"A made bed is a made life. Allegedly."},
  {task:"5 deep breaths", icon:"🌬️", desc:"Breathe. In. Out. You got this."},
  {task:"10 squats", icon:"🏋️", desc:"Leg day never ends. Squat."},
  {task:"cold water on your face", icon:"🧊", desc:"Wake up. WAKE UP."},
];
const DAILY_CHALLENGES = [
  {id:"dc1", task:"Cold shower 🧊", icon:"🚿", desc:"30 seconds minimum. No excuses."},
  {id:"dc2", task:"100 steps outside 🚶", icon:"🌳", desc:"Touch grass. For real this time."},
  {id:"dc3", task:"No phone for 1 hour 📵", icon:"📵", desc:"Just... put it down."},
  {id:"dc4", task:"Write 3 things you're grateful for ✍️", icon:"📓", desc:"Yes this counts. Just do it."},
  {id:"dc5", task:"Call someone you haven't talked to in a while 📞", icon:"📞", desc:"Pick up the phone, coward."},
];
const DEFAULT_HABITS = [
  {id:1,name:"Train",icon:"🏋️",priority:"high",streak:0,best:0,done:false,backPhoto:null,frontPhoto:null},
  {id:2,name:"Read 10 pages",icon:"📖",priority:"high",streak:0,best:0,done:false,backPhoto:null,frontPhoto:null},
  {id:3,name:"Talk to yourself in the mirror",icon:"🪞",priority:"medium",streak:0,best:0,done:false,backPhoto:null,frontPhoto:null},
  {id:4,name:"Meditate 10 min",icon:"🧘",priority:"medium",streak:0,best:0,done:false,backPhoto:null,frontPhoto:null},
  {id:5,name:"Drink 2L water",icon:"💧",priority:"low",streak:0,best:0,done:false,backPhoto:null,frontPhoto:null},
];
const DEMO_USERS = [
  {username:"alex_lifts",displayName:"Alex",avatar:"https://i.pravatar.cc/150?img=12",bio:"No days off 💪",streakTotal:42,posts:[
    {id:"d1",habit:"Train",icon:"🏋️",time:"07:12",lateMin:0,streak:14,backPhoto:UNSPLASH[0],frontPhoto:"https://i.pravatar.cc/300?img=12",reactions:{"🔥":3,"💪":5,"👏":1,"❤️":2},myReaction:null,comments:[]},
  ]},
  {username:"sara_reads",displayName:"Sara",avatar:"https://i.pravatar.cc/150?img=47",bio:"Books & gains 📚",streakTotal:38,posts:[
    {id:"d2",habit:"Read 10 pages",icon:"📖",time:"06:30",lateMin:14,streak:30,backPhoto:UNSPLASH[3],frontPhoto:"https://i.pravatar.cc/300?img=47",reactions:{"🔥":8,"💪":2,"👏":5,"❤️":3},myReaction:null,comments:[
      {id:"c1",author:"alex_lifts",displayName:"Alex",text:"bro you're reading at 6:30am 😭",time:"06:35"},
    ]},
  ]},
  {username:"marcus_mode",displayName:"Marcus",avatar:"https://i.pravatar.cc/150?img=68",bio:"Still figuring it out",streakTotal:3,posts:[]},
  {username:"jonas_bro",displayName:"Jonas",avatar:"https://i.pravatar.cc/150?img=33",bio:"Just here for the vibes",streakTotal:1,posts:[]},
];

const P_ORDER={high:0,medium:1,low:2};
const F="'Inter',sans-serif";
const ACCENT="linear-gradient(135deg,#7c6fff,#c471ed)";
const CHART_COLORS=["#7c6fff","#00d2a8","#ff8c42","#ff6b6b","#5bc0eb","#ffd166","#c471ed","#9ef01a"];

const css=`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#0a0a0f}
  .app{font-family:'Inter',sans-serif;background:#0a0a0f;min-height:100vh;color:#fff;max-width:430px;margin:0 auto;padding-bottom:100px;overflow-x:hidden}
  .glass{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08)}
  .fade-in{animation:fadeIn .35s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  input::placeholder{color:rgba(255,255,255,0.2)}
  input,textarea{color:#fff}
  ::-webkit-scrollbar{display:none}

  .habit-row{transition:transform .15s ease,opacity .3s ease}
  .habit-row:active{transform:scale(0.98)}

  .flame-wrap{position:relative}
  .flame{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:22px;animation:flame-flicker .4s ease-in-out infinite alternate;pointer-events:none;z-index:2}
  @keyframes flame-flicker{from{transform:translateX(-50%) scale(1) rotate(-3deg)}to{transform:translateX(-50%) scale(1.15) rotate(3deg)}}

  .g-wrap{position:fixed;bottom:120px;right:-120px;z-index:9999;display:flex;flex-direction:column;align-items:center;pointer-events:none;animation:g-run 7s ease-in-out forwards}
  @keyframes g-run{0%{right:-120px}45%{right:calc(50vw - 40px)}55%{right:calc(50vw - 40px)}100%{right:calc(100vw + 120px)}}
  .g-fig{font-size:52px;filter:drop-shadow(0 0 12px rgba(255,100,0,0.8));animation:g-b .4s ease-in-out infinite alternate}
  @keyframes g-b{from{transform:translateY(0)}to{transform:translateY(-8px)}}
  .g-bubble{position:relative;background:linear-gradient(135deg,#ff4500,#ff8c00);color:#fff;font-size:13px;font-weight:900;padding:7px 14px;border-radius:12px;margin-bottom:8px;white-space:nowrap;box-shadow:0 0 24px rgba(255,69,0,0.8);opacity:0;animation:gb-show 7s ease-in-out forwards}
  @keyframes gb-show{0%,40%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.15)}55%,80%{opacity:1;transform:scale(1)}95%,100%{opacity:0}}
  .g-bubble::after{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);border:7px solid transparent;border-top-color:#ff4500}
  .g-flash{position:fixed;inset:0;background:rgba(255,69,0,0.18);z-index:9998;pointer-events:none;animation:gf 7s ease forwards}
  @keyframes gf{0%{opacity:1}20%{opacity:.15}80%{opacity:.15}100%{opacity:0}}

  .ramsay-wrap{position:fixed;inset:0;z-index:9997;pointer-events:none;display:flex;align-items:flex-end;padding:0 16px 110px}
  .ramsay-card{background:linear-gradient(135deg,#1a0a00,#3d1200);border:2px solid #ff4500;border-radius:22px;padding:16px 18px;max-width:280px;animation:r-in .4s cubic-bezier(.34,1.56,.64,1) forwards}
  @keyframes r-in{from{opacity:0;transform:translateY(40px) scale(0.85)}to{opacity:1;transform:translateY(0) scale(1)}}
  .ramsay-card.out{animation:r-out .3s ease forwards}
  @keyframes r-out{to{opacity:0;transform:translateY(40px)}}

  .bitch-wrap{position:fixed;inset:0;z-index:9997;pointer-events:none;display:flex;align-items:center;justify-content:center;padding:0 24px}
  @keyframes bitch-in{from{opacity:0;transform:scale(0.7) translateY(30px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes bitch-out{to{opacity:0;transform:scale(0.85) translateY(20px)}}
  @keyframes bitch-wobble{from{transform:rotate(-10deg)}to{transform:rotate(10deg) scale(1.2)}}

  .shame-toast{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9995;background:linear-gradient(135deg,#2a0a2a,#4a1060);border:1px solid rgba(167,139,250,0.4);border-radius:16px;padding:12px 20px;display:flex;align-items:center;gap:10px;white-space:nowrap;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:toast-in .4s cubic-bezier(.34,1.56,.64,1) forwards}
  .bell-ring{animation:bell .3s ease infinite alternate;display:inline-block}
  @keyframes bell{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}
  @keyframes toast-in{from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(0.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}

  .snap-alert{position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;padding:24px}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
  .snap-shake{animation:shake .15s ease 0s 4}
  @keyframes countdown-pulse{from{transform:scale(1)}to{transform:scale(1.08)}}

  .camera-modal{position:fixed;inset:0;z-index:500;background:#000;display:flex;flex-direction:column}
  .cam-preview{position:relative;flex:1;overflow:hidden;background:#000}
  .cam-back{width:100%;height:100%;object-fit:cover;display:block}
  .cam-front-pip{position:absolute;top:16px;left:16px;width:100px;height:130px;border-radius:14px;overflow:hidden;border:3px solid #fff;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.5)}
  .cam-controls{padding:24px 32px 44px;background:#000;display:flex;align-items:center;justify-content:space-between}
  .cam-shutter{width:72px;height:72px;border-radius:50%;background:#fff;border:5px solid rgba(255,255,255,0.4);cursor:pointer;transition:transform .1s}
  .cam-shutter:active{transform:scale(0.92)}
  .cam-side-btn{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.12);border:none;color:#fff;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center}

  .dual-photo{position:relative;width:100%;aspect-ratio:4/5;overflow:hidden;background:#111}
  .dual-back{width:100%;height:100%;object-fit:cover;display:block}
  .dual-front{position:absolute;top:12px;left:12px;width:90px;height:116px;border-radius:12px;overflow:hidden;border:3px solid #fff;box-shadow:0 4px 16px rgba(0,0,0,0.5)}
  .dual-front img{width:100%;height:100%;object-fit:cover}
  .late-badge{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);border-radius:99px;padding:4px 12px;font-size:11px;color:rgba(255,255,255,0.7);white-space:nowrap;font-weight:500}

  .auth-bg{position:fixed;inset:0;background:#0a0a0f;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;z-index:1000}
  .auth-input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px 16px;font-size:15px;font-family:'Inter',sans-serif;outline:none;margin-bottom:10px;transition:border-color .2s}
  .auth-input:focus{border-color:rgba(124,111,255,0.5)}
  .auth-btn{width:100%;background:linear-gradient(135deg,#7c6fff,#c471ed);border:none;border-radius:14px;padding:15px;color:#fff;font-size:15px;font-weight:700;font-family:'Inter',sans-serif;cursor:pointer;margin-bottom:10px;box-shadow:0 4px 20px rgba(124,111,255,0.35)}
  .auth-btn-ghost{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:15px;color:rgba(255,255,255,0.5);font-size:15px;font-weight:600;font-family:'Inter',sans-serif;cursor:pointer}

  @keyframes rip-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  .rip-stone{animation:rip-float 3s ease-in-out infinite}
`;

// ── Small components ──────────────────────────────────────────
function Goggins({phrase,onDone}){useEffect(()=>{const t=setTimeout(onDone,7500);return()=>clearTimeout(t)},[]);return(<><div className="g-flash"/><div className="g-wrap"><div className="g-bubble">{phrase}</div><div className="g-fig">🏃</div></div></>);}
function Ramsay({habitName,onDone}){const[out,setOut]=useState(false);useEffect(()=>{const t=setTimeout(()=>{setOut(true);setTimeout(onDone,400)},5000);return()=>clearTimeout(t)},[]);return(<div className="ramsay-wrap"><div className={`ramsay-card${out?" out":""}`}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><span style={{fontSize:36}}>👨‍🍳</span><div><div style={{fontSize:13,fontWeight:900,color:"#ff4500"}}>GORDON RAMSAY</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>michelin star disappointment</div></div></div><div style={{fontSize:15,fontWeight:800,color:"#fff",lineHeight:1.4}}>THIS <span style={{color:"#ff4500"}}>"{habitName}"</span> IS ABSOLUTELY <span style={{color:"#ff4500"}}>RAW!! 🍳</span></div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:8,fontStyle:"italic"}}>It's past noon and you haven't done anything. DISGUSTING.</div></div></div>);}
function BitchPopup({msg,onDone}){const[out,setOut]=useState(false);useEffect(()=>{const t=setTimeout(()=>{setOut(true);setTimeout(onDone,400)},4000);return()=>clearTimeout(t)},[]);return(<div className="bitch-wrap"><div style={{background:"linear-gradient(135deg,#1a001a,#2d0040)",border:"2px solid rgba(196,113,237,0.5)",borderRadius:24,padding:"24px 22px",maxWidth:320,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.7)",animation:out?"bitch-out .4s ease forwards":"bitch-in .4s cubic-bezier(.34,1.56,.64,1) forwards",textAlign:"center"}}><div style={{fontSize:52,marginBottom:12,animation:"bitch-wobble .5s ease infinite alternate"}}>🫵</div><div style={{fontSize:13,fontWeight:900,color:"#c471ed",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Excuse me??</div><div style={{fontSize:15,fontWeight:700,color:"#fff",lineHeight:1.5}}>{msg}</div></div></div>);}
function ShameToast({name,onDone}){useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t)},[]);return(<div className="shame-toast"><span className="bell-ring">🔔</span><div><div style={{fontSize:13,fontWeight:800,color:"#fff"}}>DING DING — {name} er en skam</div><div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>Shame bell rung 💀</div></div></div>);}
function Toast({msg,onDone}){useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t)},[]);return(<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9995,background:"rgba(20,20,32,0.95)",border:"1px solid rgba(124,111,255,0.4)",borderRadius:14,padding:"11px 20px",fontSize:13,fontWeight:600,color:"#fff",whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",backdropFilter:"blur(16px)",animation:"toast-in .3s cubic-bezier(.34,1.56,.64,1) forwards"}}>{msg}</div>);}

// ── Snap Alert ────────────────────────────────────────────────
function SnapAlert({challenge,onDone,onSnap}){
  const[secs,setSecs]=useState(120);
  const[failed,setFailed]=useState(false);
  useEffect(()=>{
    const iv=setInterval(()=>{setSecs(s=>{if(s<=1){clearInterval(iv);setFailed(true);return 0;}return s-1;})},1000);
    return()=>clearInterval(iv);
  },[]);
  const pct=secs/120*100;
  const urgent=secs<=30;
  if(failed)return(
    <div className="snap-alert" style={{background:"rgba(0,0,0,0.9)",backdropFilter:"blur(20px)"}}>
      <div style={{background:"linear-gradient(135deg,#1a0000,#3d0000)",border:"2px solid #ff4500",borderRadius:24,padding:"32px 24px",width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>💀</div>
        <h2 style={{fontSize:22,fontWeight:900,color:"#ff4500",marginBottom:8}}>TIME'S UP</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:24,lineHeight:1.6}}>You couldn't even do {challenge.task}. Absolutely pathetic. You are going to the Hall of Shame.</p>
        <button onClick={onDone} style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"none",borderRadius:14,padding:14,color:"rgba(255,255,255,0.4)",fontSize:14,fontWeight:600,fontFamily:F,cursor:"pointer"}}>Walk of shame 🚶</button>
      </div>
    </div>
  );
  return(
    <div className="snap-alert" style={{background:"rgba(0,0,0,0.92)",backdropFilter:"blur(20px)"}}>
      <div className={urgent?"snap-shake":""} style={{background:urgent?"linear-gradient(135deg,#1a0000,#2d0010)":"linear-gradient(135deg,#0d0d1a,#1a0d2e)",border:`2px solid ${urgent?"#ff4500":"rgba(124,111,255,0.5)"}`,borderRadius:24,padding:"28px 24px",width:"100%",maxWidth:360,textAlign:"center",boxShadow:urgent?"0 0 40px rgba(255,69,0,0.4)":"0 0 40px rgba(124,111,255,0.2)"}}>
        <div style={{fontSize:64,marginBottom:8,animation:"countdown-pulse .5s ease infinite alternate"}}>{challenge.icon}</div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,color:urgent?"#ff4500":"#a78bfa",textTransform:"uppercase",marginBottom:8}}>⚡ HabitSnap Alert</div>
        <h2 style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:8,lineHeight:1.3}}>NÅ MÅ DU<br/>{challenge.task.toUpperCase()}!</h2>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:20,fontStyle:"italic"}}>{challenge.desc}</p>
        <div style={{position:"relative",width:80,height:80,margin:"0 auto 20px"}}>
          <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={urgent?"#ff4500":"#7c6fff"} strokeWidth="6" strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`} style={{transition:"stroke-dashoffset .9s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:urgent?"#ff4500":"#fff"}}>{secs}</div>
        </div>
        <button onClick={onSnap} style={{width:"100%",background:ACCENT,border:"none",borderRadius:14,padding:15,color:"#fff",fontSize:15,fontWeight:800,fontFamily:F,cursor:"pointer",marginBottom:10,boxShadow:"0 4px 20px rgba(124,111,255,0.4)"}}>📸 Done! Snap it</button>
        <button onClick={onDone} style={{background:"none",border:"none",color:"rgba(255,255,255,0.2)",fontSize:12,fontFamily:F,cursor:"pointer"}}>skip (coward)</button>
      </div>
    </div>
  );
}

// ── Dual Camera ───────────────────────────────────────────────
function DualCamera({habitName,onCapture,onClose}){
  const bigVRef=useRef(),pipVRef=useRef();
  const bigCvRef=useRef(),pipCvRef=useRef();
  const sBig=useRef(null),sPip=useRef(null);
  const cancelRef=useRef(false);

  const[mode,setMode]=useState("starting"); // starting|live|captured
  const[isDual,setIsDual]=useState(false);
  const[liveSwap,setLiveSwap]=useState(false);
  const[captured,setCaptured]=useState(null);
  const[capSwap,setCapSwap]=useState(false);
  const[flash,setFlash]=useState(false);
  const[count,setCount]=useState(null);
  const[errMsg,setErrMsg]=useState("");

  const stopAll=useCallback(()=>{
    const seen=new Set();
    [sBig,sPip].forEach(r=>{if(r.current){r.current.getTracks().forEach(t=>{if(!seen.has(t.id)){seen.add(t.id);t.stop();}});r.current=null;}});
  },[]);

  const bindV=(vEl,stream,mirror)=>{
    if(!vEl||!stream)return Promise.resolve();
    vEl.srcObject=stream;vEl.style.transform=mirror?"scaleX(-1)":"none";
    return new Promise(res=>{const go=()=>vEl.play().then(res).catch(res);if(vEl.readyState>=1)go();else vEl.onloadedmetadata=go;});
  };

  const initCam=useCallback(async()=>{
    cancelRef.current=false;stopAll();setMode("starting");setLiveSwap(false);setErrMsg("");
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera not supported.");
      // Get permission first so device labels populate
      const seed=await navigator.mediaDevices.getUserMedia({video:true,audio:false});
      seed.getTracks().forEach(t=>t.stop());
      if(cancelRef.current)return;
      const tryDualFacing=async()=>{
        let fs=null,bs=null;
        try{fs=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:"user"}},audio:false});}catch{}
        try{bs=await navigator.mediaDevices.getUserMedia({video:{facingMode:{exact:"environment"}},audio:false});}catch{}
        return{fs,bs};
      };
      const tryDualDeviceIds=async()=>{
        const devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput");
        const front=devs.find(d=>/front|user|facetime/i.test(d.label||""))||devs[0];
        const back=devs.find(d=>/back|rear|environment/i.test(d.label||""))||devs.find(d=>front&&d.deviceId!==front.deviceId);
        if(!front||!back||front.deviceId===back.deviceId)return{fs:null,bs:null};
        let fs=null,bs=null;
        try{fs=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:front.deviceId}},audio:false});}catch{}
        try{bs=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:back.deviceId}},audio:false});}catch{}
        return{fs,bs};
      };
      let fs=null,bs=null;
      ({fs,bs}=await tryDualFacing());
      if((!fs||!bs)&&!cancelRef.current){
        fs?.getTracks().forEach(t=>t.stop());bs?.getTracks().forEach(t=>t.stop());
        ({fs,bs}=await tryDualDeviceIds());
      }
      if(cancelRef.current){fs?.getTracks().forEach(t=>t.stop());bs?.getTracks().forEach(t=>t.stop());return;}
      const fId=fs?.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId||"";
      const bId=bs?.getVideoTracks?.()?.[0]?.getSettings?.()?.deviceId||"";
      if(fs&&bs&&fId!==bId){
        sBig.current=bs;sPip.current=fs;
        await bindV(bigVRef.current,bs,false);
        await bindV(pipVRef.current,fs,true);
        setIsDual(true);setMode("live");return;
      }
      fs?.getTracks().forEach(t=>t.stop());bs?.getTracks().forEach(t=>t.stop());
      setIsDual(false);setMode("starting");
      setErrMsg("Dual front+back camera is not available on this device/browser.");
    }catch(e){if(!cancelRef.current)setErrMsg(e?.message||"Camera unavailable.");}
  },[stopAll]);

  useEffect(()=>{initCam();return()=>{cancelRef.current=true;stopAll();};},[]);

  useEffect(()=>{
    if(mode!=="live")return;
    if(isDual){
      bindV(bigVRef.current,liveSwap?sPip.current:sBig.current,liveSwap);
      bindV(pipVRef.current,liveSwap?sBig.current:sPip.current,!liveSwap);
    }else{
      // single: just flip mirror transforms
      const v=bigVRef.current,p=pipVRef.current;
      if(v)v.style.transform=liveSwap?"scaleX(-1)":"none";
      if(p)p.style.transform=liveSwap?"none":"scaleX(-1)";
    }
  },[liveSwap,isDual,mode]);

  const shoot=useCallback(()=>{
    const cap=(vEl,cvEl)=>{
      if(!vEl||!cvEl||vEl.readyState<2||vEl.videoWidth<=0)return null;
      const w=vEl.videoWidth,h=vEl.videoHeight;
      cvEl.width=w;cvEl.height=h;
      const ctx=cvEl.getContext("2d");if(!ctx)return null;
      ctx.drawImage(vEl,0,0,w,h);return cvEl.toDataURL("image/jpeg",.85);
    };
    setFlash(true);setTimeout(()=>setFlash(false),180);
    let bigImg=cap(bigVRef.current,bigCvRef.current);
    let pipImg=cap(pipVRef.current,pipCvRef.current);
    if(!bigImg&&!pipImg){setErrMsg("Capture failed — tap Try again.");return;}
    if(!bigImg)bigImg=pipImg;if(!pipImg)pipImg=bigImg;
    stopAll();setCaptured({big:bigImg,pip:pipImg});setCapSwap(false);setMode("captured");
  },[stopAll]);

  const startCountdown=()=>{
    if(mode!=="live")return;let c=3;setCount(c);
    const iv=setInterval(()=>{c--;if(c<=0){clearInterval(iv);setCount(null);shoot();}else setCount(c);},1000);
  };

  const confirm=()=>{
    if(!captured)return;
    const[main,pip]=capSwap?[captured.pip,captured.big]:[captured.big,captured.pip];
    onCapture(main,pip);
  };

  const capBig=captured?(capSwap?captured.pip:captured.big):null;
  const capPip=captured?(capSwap?captured.big:captured.pip):null;

  return(
    <div className="camera-modal">
      {flash&&<div style={{position:"absolute",inset:0,background:"#fff",zIndex:10,pointerEvents:"none"}}/>}
      {count!=null&&<div style={{position:"absolute",inset:0,zIndex:9,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{fontSize:96,fontWeight:900,color:"#fff",textShadow:"0 4px 24px rgba(0,0,0,0.8)"}}>{count}</div></div>}

      <div style={{padding:"52px 20px 12px",position:"absolute",top:0,left:0,right:0,zIndex:5,display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(to bottom,rgba(0,0,0,0.6),transparent)"}}>
        <button onClick={mode==="captured"?()=>{setCaptured(null);initCam();}:onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,padding:"6px 14px",color:"#fff",fontSize:13,fontFamily:F,cursor:"pointer"}}>
          {mode==="captured"?"↩ Retake":"Cancel"}
        </button>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",textAlign:"center"}}>
          <div>{habitName}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>
            {mode==="captured"?"Tap small photo to swap 👆":"🤳 BeReal dual mode"}
          </div>
          {errMsg&&<div style={{fontSize:10,color:"rgba(255,120,120,0.85)",marginTop:2}}>{errMsg}</div>}
        </div>
        <div style={{width:80}}/>
      </div>

      {/* Live camera preview */}
      <div className="cam-preview" style={{display:mode==="captured"?"none":undefined}}>
        <video ref={bigVRef} className="cam-back" autoPlay playsInline muted/>
        {/* PiP always visible — dual=separate cam, single=same stream mirrored */}
        <div className="cam-front-pip"
          onClick={()=>mode==="live"&&setLiveSwap(s=>!s)}
          style={{cursor:mode==="live"?"pointer":"default",display:mode==="starting"?"none":undefined}}>
          <video ref={pipVRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          <div style={{position:"absolute",bottom:5,right:5,background:"rgba(0,0,0,0.55)",borderRadius:99,padding:"2px 7px",fontSize:9,color:"#fff"}}>tap to swap</div>
        </div>
        {mode==="starting"&&!errMsg&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.8)"}}><div style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>Starting cameras…</div></div>}
        {errMsg&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",gap:12}}><div style={{fontSize:40}}>📷</div><div style={{fontSize:13,color:"rgba(255,120,120,0.9)",textAlign:"center",padding:"0 24px"}}>{errMsg}</div><button onClick={initCam} style={{background:ACCENT,border:"none",borderRadius:12,padding:"10px 20px",color:"#fff",fontSize:13,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Try again</button></div>}
      </div>

      {/* Post-capture preview */}
      {mode==="captured"&&captured&&(
        <div className="cam-preview">
          <img src={capBig} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} alt=""/>
          <div className="cam-front-pip" style={{cursor:"pointer",border:"3px solid rgba(255,255,255,0.95)"}} onClick={()=>setCapSwap(s=>!s)}>
            <img src={capPip} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.25)"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⇄</div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={bigCvRef} style={{display:"none"}}/>
      <canvas ref={pipCvRef} style={{display:"none"}}/>

      <div className="cam-controls">
        {mode==="captured"?(
          <>
            <div style={{width:48}}/>
            <button onClick={confirm} style={{width:72,height:72,borderRadius:"50%",background:ACCENT,border:"5px solid rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 24px rgba(124,111,255,0.5)"}}>✓</button>
            <div style={{width:48}}/>
          </>
        ):(
          <>
            <button className="cam-side-btn" onClick={startCountdown} disabled={mode!=="live"}>⏱</button>
            <button className="cam-shutter" onClick={shoot} disabled={mode!=="live"} style={{opacity:mode!=="live"?0.5:1}}/>
            {isDual?<div style={{width:48}}/>:<div style={{width:48}}/>}
          </>
        )}
      </div>
    </div>
  );
}

function DualPhoto({backPhoto,frontPhoto,lateMin,onClick}){return(<div className="dual-photo" onClick={onClick} style={{cursor:onClick?"pointer":"default"}}><img className="dual-back" src={backPhoto} alt=""/><div className="dual-front"><img src={frontPhoto} alt=""/></div>{lateMin>0&&<div className="late-badge">Posted {lateMin} min late</div>}</div>);}

// ── Auth ──────────────────────────────────────────────────────
function AuthScreen({onAuth}){
  const[mode,setMode]=useState("welcome");const[u,setU]=useState("");const[d,setD]=useState("");const[p,setP]=useState("");const[b,setB]=useState("");const[err,setErr]=useState("");const[loading,setLoading]=useState(false);
  const FUNNY_BIOS=["professional napper 💤","still figuring it out 🤷","certified gym bro 💪","mediocre at everything 🌟","chronically online 📱"];
  async function signup(){if(!u.trim()||!d.trim()||!p.trim()){setErr("Fill everything in, lazy.");return;}if(u.length<3){setErr("Username too short. Put some effort in.");return;}if(p.length<4){setErr("Password under 4 chars? Really?");return;}setLoading(true);const ex=await dbGet(`user:${u.toLowerCase()}`);if(ex){setErr("Username taken. Not very original, are you?");setLoading(false);return;}const user={username:u.toLowerCase(),displayName:d,password:p,bio:b||FUNNY_BIOS[Math.floor(Math.random()*FUNNY_BIOS.length)],avatar:`https://i.pravatar.cc/150?u=${u}`,friends:[],habits:DEFAULT_HABITS,posts:[],graveyard:[],shameLog:[],habitHistory:{}};await dbSet(`user:${u.toLowerCase()}`,user);await dbSet("session",{username:u.toLowerCase()});onAuth(user);setLoading(false);}
  async function login(){if(!u.trim()||!p.trim()){setErr("Both fields. Yes both.");return;}setLoading(true);const user=await dbGet(`user:${u.toLowerCase()}`);if(!user){setErr("Who are you? Sign up first.");setLoading(false);return;}if(user.password!==p){setErr("Wrong password. Did you forget already?");setLoading(false);return;}await dbSet("session",{username:u.toLowerCase()});onAuth(user);setLoading(false);}
  const inp={background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"14px 16px",fontSize:15,fontFamily:F,outline:"none",width:"100%",marginBottom:10,color:"#fff"};
  if(mode==="welcome")return(<div className="auth-bg fade-in"><div style={{position:"absolute",top:-100,right:-80,width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,111,255,0.2),transparent 70%)",pointerEvents:"none"}}/><div style={{textAlign:"center",marginBottom:48}}><div style={{fontSize:64,marginBottom:16}}>📸</div><h1 style={{fontSize:36,fontWeight:900,letterSpacing:-1.5,background:ACCENT,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>HabitSnap</h1><p style={{fontSize:14,color:"rgba(255,255,255,0.35)",lineHeight:1.6,maxWidth:280,margin:"0 auto"}}>The habit app that judges you in real time. With friends. And Gordon Ramsay.</p></div><div style={{width:"100%",maxWidth:320}}><button className="auth-btn" onClick={()=>setMode("signup")}>Create account 🚀</button><button className="auth-btn-ghost" onClick={()=>setMode("login")}>Already a member (good for you)</button></div></div>);
  if(mode==="login")return(<div className="auth-bg fade-in"><button onClick={()=>setMode("welcome")} style={{position:"absolute",top:52,left:24,background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:F}}>← Back</button><div style={{width:"100%",maxWidth:320}}><h2 style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,marginBottom:6}}>Welcome back 👋</h2><p style={{fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:28}}>Hope you actually did your habits today.</p><input style={inp} placeholder="Username" value={u} onChange={e=>setU(e.target.value)} autoCapitalize="none"/><input style={inp} placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)}/>{err&&<p style={{fontSize:12,color:"#ff6b6b",marginBottom:10,fontStyle:"italic"}}>{err}</p>}<button className="auth-btn" onClick={login} disabled={loading}>{loading?"Checking...":"Log in"}</button><button className="auth-btn-ghost" onClick={()=>setMode("signup")}>No account? Sign up</button></div></div>);
  return(<div className="auth-bg fade-in"><button onClick={()=>setMode("welcome")} style={{position:"absolute",top:52,left:24,background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:F}}>← Back</button><div style={{width:"100%",maxWidth:320}}><h2 style={{fontSize:26,fontWeight:800,letterSpacing:-0.5,marginBottom:6}}>Join the chaos 💥</h2><p style={{fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:24}}>Make an account. Do your habits. Don't be a loser.</p><input style={inp} placeholder="Username" value={u} onChange={e=>setU(e.target.value.replace(/\s/g,""))} autoCapitalize="none"/><input style={inp} placeholder="Display name" value={d} onChange={e=>setD(e.target.value)}/><input style={inp} placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)}/><input style={inp} placeholder="Bio (optional, we'll roast you anyway)" value={b} onChange={e=>setB(e.target.value)}/>{err&&<p style={{fontSize:12,color:"#ff6b6b",marginBottom:10,fontStyle:"italic"}}>{err}</p>}<button className="auth-btn" onClick={signup} disabled={loading}>{loading?"Creating...":"Let's go 🔥"}</button><button className="auth-btn-ghost" onClick={()=>setMode("login")}>Already have account</button></div></div>);
}

// ── Add Friend Modal ──────────────────────────────────────────
function AddFriendModal({currentUser,onAdd,onClose}){
  const[q,setQ]=useState("");const[result,setResult]=useState(null);const[searched,setSearched]=useState(false);const[loading,setLoading]=useState(false);
  async function search(){if(!q.trim())return;setLoading(true);setSearched(true);const demo=DEMO_USERS.find(u=>u.username===q.toLowerCase());if(demo){setResult(demo);setLoading(false);return;}const user=await dbGet(`user:${q.toLowerCase()}`);setResult(user||null);setLoading(false);}
  const alreadyFriend=result&&(currentUser.friends||[]).includes(result.username);const isMe=result&&result.username===currentUser.username;
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400,backdropFilter:"blur(12px)"}}><div style={{background:"#141420",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"28px 28px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:430}} className="fade-in"><div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:99,margin:"0 auto 24px"}}/><h2 style={{fontSize:20,fontWeight:800,marginBottom:6}}>Add Friend 🔍</h2><p style={{fontSize:13,color:"rgba(255,255,255,0.3)",marginBottom:20}}>Try: alex_lifts, sara_reads, marcus_mode, jonas_bro</p><div style={{display:"flex",gap:10,marginBottom:20}}><input value={q} onChange={e=>setQ(e.target.value.replace(/\s/g,""))} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Username..." style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",fontSize:14,fontFamily:F,outline:"none",color:"#fff"}} autoCapitalize="none"/><button onClick={search} style={{background:ACCENT,border:"none",borderRadius:12,padding:"12px 18px",color:"#fff",fontSize:13,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Search</button></div>{loading&&<div style={{textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13,padding:"20px 0"}}>Looking them up...</div>}{searched&&!loading&&!result&&<div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>🤷</div><div style={{fontSize:14,color:"rgba(255,255,255,0.3)"}}>No one found. Maybe they don't exist.</div></div>}{result&&!loading&&(<div style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:"16px",display:"flex",alignItems:"center",gap:14}}><img src={result.avatar} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover"}} alt=""/><div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{result.displayName}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>@{result.username}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:3,fontStyle:"italic"}}>{result.bio}</div></div>{isMe?<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",fontStyle:"italic"}}>That's you 💀</div>:alreadyFriend?<div style={{fontSize:12,color:"#0be881",fontWeight:600}}>Already friends ✓</div>:<button onClick={()=>onAdd(result)} style={{background:ACCENT,border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontSize:12,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Add +</button>}</div>)}<button onClick={onClose} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:14,color:"rgba(255,255,255,0.4)",fontSize:14,fontWeight:600,fontFamily:F,cursor:"pointer",marginTop:16}}>Close</button></div></div>);
}

// ── Comment Sheet ─────────────────────────────────────────────
function CommentSheet({post,currentUser,onClose,onAdd}){
  const[text,setText]=useState("");
  function submit(){if(!text.trim())return;onAdd(post.id,{id:`c${Date.now()}`,author:currentUser.username,displayName:currentUser.displayName,text:text.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});setText("");}
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:400,backdropFilter:"blur(12px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div style={{background:"#141420",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"28px 28px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:430,maxHeight:"70vh",display:"flex",flexDirection:"column"}} className="fade-in"><div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:99,margin:"0 auto 20px"}}/><h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Comments 💬</h3><div style={{flex:1,overflowY:"auto",marginBottom:16}}>{(post.comments||[]).length===0&&<p style={{fontSize:13,color:"rgba(255,255,255,0.2)",fontStyle:"italic",textAlign:"center",padding:"20px 0"}}>No comments yet. Be the first to be annoying.</p>}{(post.comments||[]).map(c=>(<div key={c.id} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><img src={`https://i.pravatar.cc/40?u=${c.author}`} style={{width:28,height:28,borderRadius:"50%"}} alt=""/><span style={{fontSize:13,fontWeight:700}}>{c.displayName}</span><span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{c.time}</span></div><div style={{fontSize:14,color:"rgba(255,255,255,0.8)",paddingLeft:36,lineHeight:1.5}}>{c.text}</div></div>))}</div><div style={{display:"flex",gap:10}}><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Say something... (be nice-ish)" style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"11px 14px",fontSize:14,fontFamily:F,outline:"none",color:"#fff"}}/><button onClick={submit} style={{background:ACCENT,border:"none",borderRadius:12,padding:"11px 16px",color:"#fff",fontSize:13,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Post</button></div></div></div>);
}

function HabitHeatmap({habits,habitHistory}){
  const DAYS=14;
  const days=Array.from({length:DAYS},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(DAYS-1-i));return d;});
  if(habits.length===0)return(<div className="glass" style={{borderRadius:20,padding:"26px 18px",textAlign:"center"}}><div style={{fontSize:38,marginBottom:10}}>📋</div><p style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>Add some habits first.</p></div>);
  const rows=habits.map((h,idx)=>{
    const entries=habitHistory[String(h.id)]||[];
    const byDay={};
    entries.forEach(e=>{const k=new Date(e.ts).toDateString();byDay[k]=!!e.done;});
    return{...h,color:CHART_COLORS[idx%CHART_COLORS.length],dayDone:days.map(d=>byDay[d.toDateString()]??null)};
  });
  const dailyPct=days.map((_,di)=>{
    const vals=rows.map(r=>r.dayDone[di]).filter(v=>v!==null);
    return vals.length===0?null:vals.filter(Boolean).length/vals.length;
  });
  const totalDone=rows.flatMap(r=>r.dayDone).filter(v=>v===true).length;
  const totalTracked=rows.flatMap(r=>r.dayDone).filter(v=>v!==null).length;
  const rate=totalTracked>0?Math.round((totalDone/totalTracked)*100):0;
  return(
    <div>
      {/* Overall rate */}
      <div className="glass" style={{borderRadius:20,padding:"16px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`conic-gradient(#7c6fff ${rate*3.6}deg,rgba(255,255,255,0.07) 0deg)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:"#0f0f1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#a78bfa"}}>{rate}%</div>
        </div>
        <div>
          <div style={{fontSize:15,fontWeight:800,marginBottom:3}}>14-day completion rate</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>
            {rate>=80?"Killing it. Seriously. 🔥":rate>=60?"Solid effort. Don't stop now.":rate>=40?"Room to grow. You know it.":"You've been slacking. We all see it. 👀"}
          </div>
        </div>
      </div>
      {/* Daily bars */}
      <div className="glass" style={{borderRadius:20,padding:"16px 14px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:10}}>Daily completion</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:3,height:52}}>
          {dailyPct.map((pct,i)=>(
            <div key={i} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
              <div style={{borderRadius:3,background:pct===null?"rgba(255,255,255,0.05)":pct>=0.8?"#0be881":pct>=0.5?"#7c6fff":"#ff6b6b",height:pct===null?4:Math.max(5,pct*52),transition:"height .3s"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:9,color:"rgba(255,255,255,0.2)"}}>
          <span>{days[0].toLocaleDateString("en",{month:"short",day:"numeric"})}</span>
          <span>Today</span>
        </div>
      </div>
      {/* Habit grid */}
      <div className="glass" style={{borderRadius:20,padding:"16px 14px"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:12}}>Habit grid · last 14 days</div>
        <div style={{display:"flex",marginBottom:6}}>
          <div style={{width:68,flexShrink:0}}/>
          <div style={{flex:1,display:"flex",gap:3}}>
            {days.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:8,color:"rgba(255,255,255,0.25)"}}>{i%3===0?d.toLocaleDateString("en",{day:"numeric"}):""}</div>)}
          </div>
        </div>
        {rows.map(row=>(
          <div key={row.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
            <div style={{width:62,flexShrink:0,fontSize:11,color:"rgba(255,255,255,0.5)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.icon} {row.name}</div>
            <div style={{flex:1,display:"flex",gap:3}}>
              {row.dayDone.map((done,i)=>(
                <div key={i} style={{flex:1,aspectRatio:"1",borderRadius:3,minWidth:0,background:done===true?row.color:done===false?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",boxShadow:done===true?`0 0 6px ${row.color}60`:undefined}}/>
              ))}
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:14,marginTop:10,fontSize:10,color:"rgba(255,255,255,0.25)"}}>
          <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:"#7c6fff",marginRight:5,verticalAlign:"middle"}}/>Done</span>
          <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:"rgba(255,255,255,0.08)",marginRight:5,verticalAlign:"middle"}}/>Missed</span>
          <span><span style={{display:"inline-block",width:9,height:9,borderRadius:2,background:"rgba(255,255,255,0.03)",marginRight:5,verticalAlign:"middle"}}/>No data</span>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App(){
  const[user,setUser]=useState(null);const[appLoading,setAppLoading]=useState(true);
  const[tab,setTab]=useState("habits");
  const[habits,setHabits]=useState([]);const[friendData,setFriendData]=useState([]);const[myPosts,setMyPosts]=useState([]);
  const[habitHistory,setHabitHistory]=useState({});const[selectedTrendHabit,setSelectedTrendHabit]=useState("all");
  const[showAdd,setShowAdd]=useState(false);const[newH,setNewH]=useState({name:"",icon:"⭐",priority:"medium"});
  const[viewPhotos,setViewPhotos]=useState(null);const[undoTarget,setUndoTarget]=useState(null);const[cameraFor,setCameraFor]=useState(null);
  const[showAddFriend,setShowAddFriend]=useState(false);const[commentPost,setCommentPost]=useState(null);
  const[dailyChallenge,setDailyChallenge]=useState(null);const[dcDone,setDcDone]=useState(false);const[snapAlert,setSnapAlert]=useState(null);const[snapFor,setSnapFor]=useState(null);
  const[graveyard,setGraveyard]=useState([]);const[shameLog,setShameLog]=useState([]);
  const[goggins,setGoggins]=useState(null);const[gogginsKey,setGogginsKey]=useState(0);const[ramsay,setRamsay]=useState(null);const[bitchMsg,setBitchMsg]=useState(null);const[shameToast,setShameToast]=useState(null);const[toast,setToast]=useState(null);
  const[quoteIdx]=useState(()=>Math.floor(Math.random()*QUOTES.length));
  const profileInputRef=useRef(null);
  const[showAvatarMenu,setShowAvatarMenu]=useState(false);
  const[profileCameraOpen,setProfileCameraOpen]=useState(false);
  const gogginsTimer=useRef(null);const ramsayTimer=useRef(null);const snapTimer=useRef(null);
  const habitsRef=useRef([]);const coachVisibleRef=useRef(null);

  useEffect(()=>{(async()=>{const session=await dbGet("session");if(session){const u=await dbGet(`user:${session.username}`);if(u){setUser(u);setHabits(u.habits||DEFAULT_HABITS);setMyPosts(u.posts||[]);setGraveyard(u.graveyard||[]);setShameLog(u.shameLog||[]);setHabitHistory(u.habitHistory||{});await loadFriends(u);}}setAppLoading(false);})();},[]);
  useEffect(()=>{habitsRef.current=habits;},[habits]);
  useEffect(()=>{coachVisibleRef.current=goggins||ramsay?"busy":null;},[goggins,ramsay]);
  useEffect(()=>{
    if(selectedTrendHabit==="all")return;
    const exists=habits.some(h=>String(h.id)===String(selectedTrendHabit));
    if(!exists)setSelectedTrendHabit("all");
  },[habits,selectedTrendHabit]);
  useEffect(()=>{
    if(!user||Object.keys(habitHistory||{}).length>0)return;
    const seeded={};
    const base=user.username.split("").reduce((s,c)=>s+c.charCodeAt(0),0);
    for(const h of habits){
      const pts=[];
      for(let i=13;i>=0;i--){
        const d=new Date();d.setDate(d.getDate()-i);
        const wasDone=((base+Number(h.id)+i)%4)!==0;
        const s=Math.max(0,(h.streak||0)-Math.floor(i/2));
        pts.push({ts:d.toISOString(),streak:s,done:wasDone});
      }
      seeded[String(h.id)]=pts;
    }
    setHabitHistory(seeded);
    saveUser({habitHistory:seeded});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user]);

  async function loadFriends(u){const fds=[];for(const fn of(u.friends||[])){const demo=DEMO_USERS.find(d=>d.username===fn);if(demo){fds.push({...demo,shamed:false});continue;}const fd=await dbGet(`user:${fn}`);if(fd)fds.push({...fd,shamed:false});}setFriendData(fds);}

  async function handleAuth(u){setUser(u);setHabits(u.habits||DEFAULT_HABITS);setMyPosts(u.posts||[]);setGraveyard(u.graveyard||[]);setShameLog(u.shameLog||[]);setHabitHistory(u.habitHistory||{});await loadFriends(u);
    const dc=DAILY_CHALLENGES[new Date().getDay()%DAILY_CHALLENGES.length];setDailyChallenge(dc);
    snapTimer.current=setTimeout(()=>{const c=SNAP_CHALLENGES[Math.floor(Math.random()*SNAP_CHALLENGES.length)];setSnapAlert(c);},20000+Math.random()*40000);
  }

  async function saveUser(updates){const updated={...user,...updates};setUser(updated);await dbSet(`user:${user.username}`,updated);}
  function appendHabitHistory(history,habitId,streak,done){
    const key=String(habitId);
    const entry={ts:new Date().toISOString(),streak:Math.max(0,streak||0),done:!!done};
    return {...history,[key]:[...(history[key]||[]),entry]};
  }
  async function addFriend(f){const nf=[...(user.friends||[]),f.username];await saveUser({friends:nf});setFriendData(prev=>[...prev,{...f,shamed:false}]);setShowAddFriend(false);setToast(`${f.displayName} added! They better be grinding. 👀`);}

  useEffect(()=>{
    if(!user)return;
    const cooldown=10*60*1000;
    function schedule(){
      gogginsTimer.current=setTimeout(()=>{
        if(!coachVisibleRef.current){
          setGoggins(GOGGINS[Math.floor(Math.random()*GOGGINS.length)]);
          setGogginsKey(k=>k+1);
        }
        schedule();
      },cooldown);
    }
    schedule();
    return()=>clearTimeout(gogginsTimer.current);
  },[user]);
  useEffect(()=>{
    if(!user)return;
    const cooldown=10*60*1000;
    function schedule(delay){
      ramsayTimer.current=setTimeout(()=>{
        const hour=new Date().getHours();
        const undone=habitsRef.current.filter(x=>!x.done);
        if(hour>=12&&undone.length>0&&!coachVisibleRef.current){
          setRamsay(undone[Math.floor(Math.random()*undone.length)].name);
        }
        schedule(cooldown);
      },delay);
    }
    schedule(5*60*1000);
    return()=>clearTimeout(ramsayTimer.current);
  },[user]);

  const sorted=[...habits].sort((a,b)=>P_ORDER[a.priority]-P_ORDER[b.priority]);
  const done=habits.filter(h=>h.done).length;const pct=habits.length?(done/habits.length)*100:0;
  const roast=ROASTS.find(r=>done<=r.max)?.msg??ROASTS[ROASTS.length-1].msg;
  const today=new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});

  const leaderboard=[
    {name:user?.displayName??"You",avatar:user?.avatar??"",score:habits.reduce((s,h)=>s+h.streak,0),isMe:true},
    ...friendData.map(f=>({name:f.displayName,avatar:f.avatar,score:(f.streakTotal||f.posts?.length*3)||Math.floor(Math.random()*30),isMe:false})),
  ].sort((a,b)=>b.score-a.score);

  async function handleCapture(back,front,forSnap=false){
    const id=forSnap?null:cameraFor;
    const lateMin=new Date().getHours()>=8?Math.floor(Math.random()*45):0;
    const post={id:`${user.username}-${Date.now()}`,habit:forSnap?(snapAlert?.task||"Snap Challenge"):habits.find(x=>x.id===id)?.name??"",icon:forSnap?(snapAlert?.icon||"⚡"):habits.find(x=>x.id===id)?.icon??"",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),lateMin,streak:forSnap?1:(habits.find(x=>x.id===id)?.streak||0)+1,backPhoto:back,frontPhoto:front,reactions:{"🔥":0,"💪":0,"👏":0,"❤️":0},myReaction:null,comments:[]};
    let updatedHabits=habits;
    let updatedHistory=habitHistory;
    if(!forSnap){
      updatedHabits=habits.map(x=>x.id!==id?x:{...x,done:true,backPhoto:back,frontPhoto:front,streak:x.streak+1,best:Math.max(x.best,x.streak+1)});
      const h=updatedHabits.find(x=>x.id===id);
      updatedHistory=appendHabitHistory(habitHistory,id,h?.streak||0,true);
      setHabitHistory(updatedHistory);
    }
    const updatedPosts=[post,...myPosts];
    setHabits(updatedHabits);setMyPosts(updatedPosts);
    await saveUser({habits:updatedHabits,posts:updatedPosts,habitHistory:updatedHistory});
    if(forSnap)setSnapAlert(null);else setCameraFor(null);
  }

  function triggerUndo(id){setBitchMsg("Surprise surprise… you didn't do it, you little bitch 😘");setTimeout(()=>setUndoTarget(id),600);}
  async function confirmUndo(id){
    setBitchMsg("You really are just a bitch, aren't you 🙂");
    const h=habits.find(x=>x.id===id);
    const newShame=[...(shameLog||[]),{name:h?.name,icon:h?.icon,date:new Date().toLocaleDateString(),streak:h?.streak||0}];
    const updatedHabits=habits.map(x=>x.id!==id?x:{...x,done:false,backPhoto:null,frontPhoto:null,streak:Math.max(0,x.streak-1)});
    const undone=updatedHabits.find(x=>x.id===id);
    const updatedHistory=appendHabitHistory(habitHistory,id,undone?.streak||0,false);
    const updatedPosts=myPosts.filter(p=>p.habit!==h?.name);
    setHabits(updatedHabits);setMyPosts(updatedPosts);setShameLog(newShame);setHabitHistory(updatedHistory);
    await saveUser({habits:updatedHabits,posts:updatedPosts,shameLog:newShame,habitHistory:updatedHistory});
    setUndoTarget(null);
  }

  async function deleteHabit(id){
    const h=habits.find(x=>x.id===id);
    const grave=[...(graveyard||[]),{id,name:h?.name,icon:h?.icon,priority:h?.priority||"medium",streak:h?.streak||0,best:h?.best||0,date:new Date().toLocaleDateString(),rip:"RIP"}];
    const updated=habits.filter(x=>x.id!==id);
    setHabits(updated);setGraveyard(grave);
    await saveUser({habits:updated,graveyard:grave});
    setToast(`${h?.icon} ${h?.name} has been laid to rest. RIP 🪦`);
  }

  async function restoreHabit(id){
    const graveItem=(graveyard||[]).find(g=>g.id===id);
    if(!graveItem)return;
    const restored={id:Date.now(),name:graveItem.name,icon:graveItem.icon||"⭐",priority:graveItem.priority||"medium",streak:graveItem.streak||0,best:Math.max(graveItem.best||0,graveItem.streak||0),done:false,backPhoto:null,frontPhoto:null};
    const updatedHabits=[...habits,restored];
    const updatedGrave=(graveyard||[]).filter(g=>g.id!==id);
    const prevHistory=habitHistory[String(id)]||[];
    const updatedHistory={...habitHistory,[String(restored.id)]:prevHistory};
    delete updatedHistory[String(id)];
    setHabits(updatedHabits);setGraveyard(updatedGrave);setHabitHistory(updatedHistory);
    await saveUser({habits:updatedHabits,graveyard:updatedGrave,habitHistory:updatedHistory});
    setToast(`${graveItem.icon} ${graveItem.name} is back from the grave.`);
  }

  function reactFriend(uid,pid,emoji){setFriendData(prev=>prev.map(f=>f.username!==uid?f:{...f,posts:f.posts.map(p=>{if(p.id!==pid)return p;const was=p.myReaction===emoji;return{...p,myReaction:was?null:emoji,reactions:{...p.reactions,[emoji]:p.reactions[emoji]+(was?-1:1),...(p.myReaction&&!was?{[p.myReaction]:p.reactions[p.myReaction]-1}:{})}};})}));}
  async function reactMine(pid,emoji){const updated=myPosts.map(p=>{if(p.id!==pid)return p;const was=p.myReaction===emoji;return{...p,myReaction:was?null:emoji,reactions:{...p.reactions,[emoji]:p.reactions[emoji]+(was?-1:1),...(p.myReaction&&!was?{[p.myReaction]:p.reactions[p.myReaction]-1}:{})}};});setMyPosts(updated);await saveUser({posts:updated});}

  async function addComment(pid,comment){
    const inMine=myPosts.find(p=>p.id===pid);
    if(inMine){const updated=myPosts.map(p=>p.id!==pid?p:{...p,comments:[...(p.comments||[]),comment]});setMyPosts(updated);await saveUser({posts:updated});}
    else setFriendData(prev=>prev.map(f=>({...f,posts:f.posts.map(p=>p.id!==pid?p:{...p,comments:[...(p.comments||[]),comment]})})));
    if(commentPost)setCommentPost(prev=>({...prev,comments:[...(prev.comments||[]),comment]}));
  }

  async function addHabit(){if(!newH.name.trim())return;const h={id:Date.now(),name:newH.name,icon:newH.icon,priority:newH.priority,streak:0,best:0,done:false,backPhoto:null,frontPhoto:null};const updated=[...habits,h];const updatedHistory={...habitHistory,[String(h.id)]:[]};setHabits(updated);setHabitHistory(updatedHistory);await saveUser({habits:updated,habitHistory:updatedHistory});setNewH({name:"",icon:"⭐",priority:"medium"});setShowAdd(false);}
  function ringShame(f){setFriendData(prev=>prev.map(x=>x.username===f.username?{...x,shamed:true}:x));setShameToast(f.displayName);}
  async function updateAvatar(file){
    if(!file)return;
    if(!file.type.startsWith("image/")){setToast("Please choose an image file.");return;}
    try{
      const avatar=await fileToDataUrlCompressed(file,640,0.82);
      if(!avatar)return;
      await saveUser({avatar});
      setToast("Profile picture updated.");
    }catch{
      setToast("Could not update profile picture.");
    }
  }
  async function logout(){await dbSet("session",null);clearTimeout(gogginsTimer.current);clearTimeout(ramsayTimer.current);clearTimeout(snapTimer.current);setUser(null);setHabits([]);setMyPosts([]);setFriendData([]);setHabitHistory({});setSelectedTrendHabit("all");}

  const allFeed=[
    ...myPosts.map(p=>({...p,uid:null,name:user?.displayName??"You",avatar:user?.avatar??"",isMe:true})),
    ...friendData.flatMap(f=>f.posts.map(p=>({...p,uid:f.username,name:f.displayName,avatar:f.avatar,isMe:false}))),
  ].sort((a,b)=>String(b.id).localeCompare(String(a.id)));

  const medals=["🥇","🥈","🥉"];

  if(appLoading)return(<div style={{background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{css}</style><div style={{fontSize:48}}>📸</div></div>);
  if(!user)return(<><style>{css}</style><AuthScreen onAuth={handleAuth}/></>);

  return(
    <>
      <style>{css}</style>
      {goggins&&<Goggins key={gogginsKey} phrase={goggins} onDone={()=>setGoggins(null)}/>}
      {ramsay&&<Ramsay habitName={ramsay} onDone={()=>setRamsay(null)}/>}
      {bitchMsg&&<BitchPopup msg={bitchMsg} onDone={()=>setBitchMsg(null)}/>}
      {shameToast&&<ShameToast name={shameToast} onDone={()=>setShameToast(null)}/>}
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {snapAlert&&!snapFor&&<SnapAlert challenge={snapAlert} onDone={()=>setSnapAlert(null)} onSnap={()=>setSnapFor(true)}/>}
      {snapFor&&<DualCamera habitName={snapAlert?.task||"Snap Challenge"} onCapture={(b,f)=>{setSnapFor(false);handleCapture(b,f,true);}} onClose={()=>{setSnapFor(false);setSnapAlert(null);}}/>}
      {cameraFor&&!snapFor&&<DualCamera habitName={habits.find(h=>h.id===cameraFor)?.name||""} onCapture={(b,f)=>handleCapture(b,f,false)} onClose={()=>setCameraFor(null)}/>}
      {showAddFriend&&<AddFriendModal currentUser={user} onAdd={addFriend} onClose={()=>setShowAddFriend(false)}/>}
      {commentPost&&<CommentSheet post={commentPost} currentUser={user} onClose={()=>setCommentPost(null)} onAdd={addComment}/>}
      {profileCameraOpen&&<DualCamera habitName="Profilbilde" onCapture={async(back,front)=>{setProfileCameraOpen(false);const av=front||back;if(av){await saveUser({avatar:av});setToast("Profilbilde oppdatert! 📸");}}} onClose={()=>setProfileCameraOpen(false)}/>}
      {showAvatarMenu&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:500,backdropFilter:"blur(12px)"}} onClick={e=>{if(e.target===e.currentTarget)setShowAvatarMenu(false);}}>
          <div style={{background:"#141420",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"28px 28px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:430}} className="fade-in">
            <div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:99,margin:"0 auto 24px"}}/>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
              <img src={user.avatar} style={{width:82,height:82,borderRadius:"50%",objectFit:"cover",border:"3px solid rgba(124,111,255,0.5)",marginBottom:10}} alt=""/>
              <div style={{fontSize:16,fontWeight:800}}>{user.displayName}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>@{user.username}</div>
            </div>
            <button onClick={()=>{setShowAvatarMenu(false);setTimeout(()=>profileInputRef.current?.click(),100);}} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:15,color:"#fff",fontSize:14,fontWeight:600,fontFamily:F,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
              🖼️ Add profile picture
            </button>
            <button onClick={()=>{setShowAvatarMenu(false);setProfileCameraOpen(true);}} style={{width:"100%",background:ACCENT,border:"none",borderRadius:14,padding:15,color:"#fff",fontSize:14,fontWeight:700,fontFamily:F,cursor:"pointer",marginBottom:10,boxShadow:"0 4px 20px rgba(124,111,255,0.35)",display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
              📷 Take now
            </button>
            <button onClick={()=>setShowAvatarMenu(false)} style={{width:"100%",background:"none",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:13,color:"rgba(255,255,255,0.3)",fontSize:13,fontFamily:F,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}

      <div className="app">
        {/* HEADER */}
        <div style={{padding:"36px 22px 20px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,111,255,0.15),transparent 70%)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div><p style={{fontSize:11,letterSpacing:2,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:4}}>{today}</p><h1 style={{fontSize:28,fontWeight:900,letterSpacing:-1,background:ACCENT,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>HabitSnap</h1></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setShowAvatarMenu(true)} style={{background:"none",border:"none",padding:0,cursor:"pointer",position:"relative"}}>
                <img src={user.avatar} title="Change profile photo" style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",border:"2px solid rgba(124,111,255,0.4)",display:"block"}} alt=""/>
                <div style={{position:"absolute",bottom:-1,right:-1,width:18,height:18,borderRadius:"50%",background:"linear-gradient(135deg,#7c6fff,#c471ed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,border:"2px solid #0a0a0f"}}>📷</div>
              </button>
              <button onClick={logout} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 12px",color:"rgba(255,255,255,0.3)",fontSize:12,fontFamily:F,cursor:"pointer"}}>Out</button>
            </div>
          </div>
          <input ref={profileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const file=e.target.files?.[0];updateAvatar(file);e.target.value="";}}/>
          <div className="glass" style={{borderRadius:18,padding:"13px 16px"}}>
            <p style={{fontSize:10,letterSpacing:2,color:"rgba(255,255,255,0.25)",textTransform:"uppercase",marginBottom:6,fontWeight:600}}>Daily Wisdom</p>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.6,fontStyle:"italic",fontWeight:300}}>"{QUOTES[quoteIdx]}"</p>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",padding:"0 16px",marginBottom:4,gap:3,overflowX:"auto"}}>
          {[["habits","Habits"],["feed","Feed"],["friends","Friends 👥"],["leaderboard","🏆"],["analyse","Progress 📊"],["graveyard","⚰️ Graveyard"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flexShrink:0,minWidth:98,padding:"10px 12px",background:tab===k?"rgba(124,111,255,0.15)":"none",border:tab===k?"1px solid rgba(124,111,255,0.3)":"1px solid transparent",borderRadius:12,color:tab===k?"#a78bfa":"rgba(255,255,255,0.3)",fontSize:12,fontWeight:tab===k?700:400,fontFamily:F,cursor:"pointer",textAlign:"center"}}>{l}</button>
          ))}
        </div>

        {/* HABITS */}
        {tab==="habits"&&(
          <div style={{padding:"16px 22px"}} className="fade-in">
            {dailyChallenge&&(
              <div style={{background:"linear-gradient(135deg,rgba(124,111,255,0.15),rgba(196,113,237,0.1))",border:"1px solid rgba(124,111,255,0.3)",borderRadius:20,padding:"16px 18px",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#a78bfa",textTransform:"uppercase"}}>Daily Challenge</span>
                  {dcDone&&<span style={{fontSize:11,color:"#0be881",fontWeight:600}}>✓ Completed</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:32}}>{dailyChallenge.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:3}}>{dailyChallenge.task}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontStyle:"italic"}}>{dailyChallenge.desc}</div></div>
                  {!dcDone&&<button onClick={()=>setDcDone(true)} style={{background:ACCENT,border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,fontFamily:F,cursor:"pointer",flexShrink:0}}>Done ✓</button>}
                </div>
              </div>
            )}
            <div className="glass" style={{borderRadius:22,padding:"20px 22px",marginBottom:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
                <div><span style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:0.5,display:"block",marginBottom:2}}>PROGRESS</span><span style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>Hey {user.displayName}, don't be a loser today</span></div>
                <span style={{fontSize:24,fontWeight:900,letterSpacing:-1}}>{done}<span style={{fontSize:14,fontWeight:400,color:"rgba(255,255,255,0.3)"}}>/{habits.length}</span></span>
              </div>
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:99,height:6,marginBottom:14,overflow:"hidden"}}><div style={{background:done===habits.length?"linear-gradient(90deg,#00d2a8,#0be881)":ACCENT,borderRadius:99,height:6,width:`${pct}%`,transition:"width .7s cubic-bezier(.4,0,.2,1)"}}/></div>
              <p style={{fontSize:12,color:done===habits.length?"#0be881":"rgba(255,255,255,0.35)",fontStyle:"italic"}}>{roast}</p>
            </div>
            {sorted.map(h=>(
              <div key={h.id} className={`habit-row glass flame-wrap`} style={{borderRadius:20,padding:"16px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:14,opacity:h.done?0.45:1,position:"relative"}}>
                {h.streak>=7&&<div className="flame">🔥</div>}
                <div style={{width:44,height:44,borderRadius:14,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:h.done?"rgba(255,255,255,0.4)":"#fff",textDecoration:h.done?"line-through":"none",marginBottom:6}}>{h.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontWeight:500,background:"rgba(255,255,255,0.07)",padding:"2px 8px",borderRadius:99}}>🔥 {h.streak}d{h.streak>=7?" 🔥":""}</span>
                    <span style={{fontSize:11,fontWeight:600,background:h.done?"rgba(11,232,129,0.1)":"rgba(255,180,80,0.1)",color:h.done?"#0be881":"rgba(255,180,80,0.85)",padding:"2px 8px",borderRadius:99,border:`1px solid ${h.done?"rgba(11,232,129,0.25)":"rgba(255,180,80,0.2)"}`}}>{h.done?"✓ done, legend.":"⏳ not done, loser."}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  {h.done?(
                    <>
                      <div style={{position:"relative",width:46,height:46,cursor:"pointer"}} onClick={()=>setViewPhotos({back:h.backPhoto,front:h.frontPhoto})}><img src={h.backPhoto} style={{width:46,height:46,borderRadius:10,objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.1)"}} alt=""/><img src={h.frontPhoto} style={{position:"absolute",top:-6,right:-6,width:22,height:22,borderRadius:6,objectFit:"cover",border:"2px solid #0a0a0f"}} alt=""/></div>
                      <button onClick={()=>triggerUndo(h.id)} style={{width:32,height:32,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"rgba(255,255,255,0.3)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>↩</button>
                    </>
                  ):(
                    <>
                      <button onClick={()=>setCameraFor(h.id)} style={{background:ACCENT,border:"none",borderRadius:12,padding:"9px 14px",color:"#fff",fontSize:12,fontWeight:700,fontFamily:F,cursor:"pointer",whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(124,111,255,0.35)"}}>📸 Done</button>
                      <button onClick={()=>deleteHabit(h.id)} style={{width:32,height:32,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,color:"rgba(255,100,100,0.4)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>🪦</button>
                    </>
                  )}
                </div>
              </div>
            ))}
            <button onClick={()=>setShowAdd(!showAdd)} style={{marginTop:4,background:"none",border:"1px dashed rgba(255,255,255,0.1)",borderRadius:20,width:"100%",padding:"15px 0",color:"rgba(255,255,255,0.2)",fontSize:13,fontFamily:F,cursor:"pointer"}}>+ Add habit</button>
            {showAdd&&(
              <div className="glass fade-in" style={{borderRadius:22,padding:"22px 20px",marginTop:10}}>
                <div style={{display:"flex",gap:10,marginBottom:14}}><input value={newH.icon} onChange={e=>setNewH(p=>({...p,icon:e.target.value}))} style={{width:52,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 0",fontSize:20,textAlign:"center",fontFamily:F,outline:"none"}}/><input value={newH.name} onChange={e=>setNewH(p=>({...p,name:e.target.value}))} placeholder="Habit name..." style={{flex:1,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",fontSize:14,fontFamily:F,outline:"none",color:"#fff"}}/></div>
                <div style={{display:"flex",gap:8,marginBottom:18}}>{[["high","High","#ff6b6b"],["medium","Med","#ffd32a"],["low","Low","#0be881"]].map(([v,l,c])=>(<button key={v} onClick={()=>setNewH(p=>({...p,priority:v}))} style={{flex:1,padding:"9px 0",borderRadius:12,border:`1px solid ${newH.priority===v?c+"60":"rgba(255,255,255,0.08)"}`,background:newH.priority===v?c+"18":"none",color:newH.priority===v?c:"rgba(255,255,255,0.25)",fontSize:12,fontWeight:700,fontFamily:F,cursor:"pointer"}}>{l}</button>))}</div>
                <button onClick={addHabit} style={{width:"100%",background:ACCENT,border:"none",borderRadius:14,padding:14,color:"#fff",fontSize:13,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Save habit</button>
              </div>
            )}
          </div>
        )}

        {/* FEED */}
        {tab==="feed"&&(
          <div style={{padding:"16px 0"}} className="fade-in">
            {allFeed.length===0&&<div style={{textAlign:"center",padding:"60px 24px 0"}}><div style={{fontSize:48,marginBottom:12}}>🦥</div><p style={{color:"rgba(255,255,255,0.2)",fontSize:14,fontStyle:"italic"}}>No check-ins yet. Add friends and stop being a hermit.</p></div>}
            {allFeed.map(post=>(
              <div key={post.id} className="glass" style={{borderRadius:22,marginBottom:14,overflow:"hidden",marginLeft:16,marginRight:16}}>
                <div style={{padding:"14px 16px 12px",display:"flex",alignItems:"center",gap:12}}>
                  <img src={post.avatar} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.1)"}} alt=""/>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700}}>{post.name}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>{post.icon} {post.habit} · {post.time} · 🔥 {post.streak}d</div></div>
                </div>
                <DualPhoto backPhoto={post.backPhoto} frontPhoto={post.frontPhoto} lateMin={post.lateMin} onClick={()=>setViewPhotos({back:post.backPhoto,front:post.frontPhoto})}/>
                <div style={{padding:"10px 14px 4px",display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["🔥","💪","👏","❤️"].map(e=>(<button key={e} onClick={()=>post.isMe?reactMine(post.id,e):reactFriend(post.uid,post.id,e)} style={{background:post.myReaction===e?"rgba(124,111,255,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${post.myReaction===e?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:99,padding:"5px 11px",cursor:"pointer",fontSize:12,fontFamily:F,color:post.myReaction===e?"#a78bfa":"rgba(255,255,255,0.5)",fontWeight:post.myReaction===e?700:400}}>{e}{post.reactions[e]>0?` ${post.reactions[e]}`:""}</button>))}
                  <button onClick={()=>setCommentPost(post)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:99,padding:"5px 11px",cursor:"pointer",fontSize:12,fontFamily:F,color:"rgba(255,255,255,0.4)"}}>💬 {(post.comments||[]).length||""}</button>
                </div>
                {(post.comments||[]).length>0&&<div style={{padding:"8px 16px 14px"}}><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:6,cursor:"pointer"}} onClick={()=>setCommentPost(post)}>{(post.comments||[]).slice(-1).map(c=>(<span key={c.id}><span style={{fontWeight:700,color:"rgba(255,255,255,0.6)"}}>{c.displayName}</span> {c.text}</span>))}</div></div>}
              </div>
            ))}
          </div>
        )}

        {/* FRIENDS */}
        {tab==="friends"&&(
          <div style={{padding:"16px 22px"}} className="fade-in">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}><p style={{fontSize:12,color:"rgba(255,255,255,0.2)",fontStyle:"italic"}}>Ring the bell if they're slacking 🔔</p><button onClick={()=>setShowAddFriend(true)} style={{background:ACCENT,border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,fontFamily:F,cursor:"pointer",flexShrink:0}}>+ Add</button></div>
            {friendData.length===0&&<div style={{textAlign:"center",padding:"40px 0"}}><div style={{fontSize:48,marginBottom:12}}>🏝️</div><p style={{color:"rgba(255,255,255,0.2)",fontSize:14,fontStyle:"italic"}}>No friends. Sad. Tap + Add.</p></div>}
            {friendData.map(f=>(
              <div key={f.username} className="glass" style={{borderRadius:20,padding:"16px 18px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{position:"relative",flexShrink:0}}><img src={f.avatar} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:"1.5px solid rgba(255,255,255,0.1)"}} alt=""/><div style={{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:f.posts.length>0?"#0be881":"#ff6b6b",border:"2px solid #0a0a0f"}}/></div>
                  <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{f.displayName}</div><div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:3}}>@{f.username}</div><div style={{fontSize:12,fontWeight:500,color:f.posts.length>0?"rgba(11,232,129,0.7)":"rgba(255,107,107,0.7)"}}>{f.posts.length>0?`${f.posts.length} check-in${f.posts.length>1?"s":""} — not a total loser`:"0 check-ins. Absolute coward."}</div></div>
                  {f.posts.length===0?(f.shamed?<div style={{fontSize:11,color:"rgba(167,139,250,0.6)",fontStyle:"italic",flexShrink:0}}>shamed 💀</div>:<button onClick={()=>ringShame(f)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"8px 12px",fontSize:18,cursor:"pointer",flexShrink:0}}>🔔</button>):(
                    <div style={{display:"flex"}}>{f.posts.slice(0,2).map(p=>(<div key={p.id} style={{position:"relative",width:40,height:40,marginLeft:-8,cursor:"pointer"}} onClick={()=>setViewPhotos({back:p.backPhoto,front:p.frontPhoto})}><img src={p.backPhoto} style={{width:40,height:40,borderRadius:9,objectFit:"cover",border:"2px solid #0a0a0f"}} alt=""/><img src={p.frontPhoto} style={{position:"absolute",top:-4,right:-4,width:18,height:18,borderRadius:5,objectFit:"cover",border:"2px solid #0a0a0f"}} alt=""/></div>))}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD */}
        {tab==="leaderboard"&&(
          <div style={{padding:"16px 22px"}} className="fade-in">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-0.5,marginBottom:4}}>Leaderboard 🏆</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.25)",marginBottom:20,fontStyle:"italic"}}>Who's actually putting in work. And who's embarrassing themselves.</p>
            {leaderboard.map((e,i)=>(
              <div key={e.name} className="glass" style={{borderRadius:18,padding:"14px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:14,border:e.isMe?"1px solid rgba(124,111,255,0.3)":"1px solid rgba(255,255,255,0.08)",background:e.isMe?"rgba(124,111,255,0.08)":"rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:28,width:36,textAlign:"center",flexShrink:0}}>{medals[i]||`#${i+1}`}</div>
                <img src={e.avatar} style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:e.isMe?"#a78bfa":"#fff"}}>{e.name}{e.isMe?" (you)":""}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>{i===0?"carrying the squad 🐐":i===leaderboard.length-1?"bottom of the barrel 💀":"doing okay-ish"}</div></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:20,fontWeight:900,color:i===0?"#ffd32a":i===1?"#c0c0c0":i===2?"#cd7f32":"rgba(255,255,255,0.5)"}}>{e.score}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>streak pts</div></div>
              </div>
            ))}
            {leaderboard.length<=1&&<div style={{textAlign:"center",padding:"30px 0"}}><div style={{fontSize:48,marginBottom:12}}>🏝️</div><p style={{color:"rgba(255,255,255,0.2)",fontSize:14,fontStyle:"italic"}}>Add friends to compete against. Right now you're just competing with yourself. And losing.</p></div>}
          </div>
        )}

        {/* PROGRESS */}
        {tab==="analyse"&&(
          <div style={{padding:"16px 22px"}} className="fade-in">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-0.5,marginBottom:4}}>Progress 📊</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.25)",marginBottom:16,fontStyle:"italic"}}>Your last 14 days. No excuses.</p>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              {[
                {label:"Habits",value:habits.length,icon:"📋"},
                {label:"Best streak",value:Math.max(0,...habits.map(h=>h.best||0))+"d",icon:"🏆"},
                {label:"Done today",value:`${habits.filter(h=>h.done).length}/${habits.length}`,icon:"✅"},
              ].map(s=>(
                <div key={s.label} className="glass" style={{flex:1,borderRadius:16,padding:"14px 10px",textAlign:"center"}}>
                  <div style={{fontSize:20}}>{s.icon}</div>
                  <div style={{fontSize:18,fontWeight:900,marginTop:4}}>{s.value}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            <HabitHeatmap habits={habits} habitHistory={habitHistory}/>
          </div>
        )}

        {/* GRAVEYARD */}
        {tab==="graveyard"&&(
          <div style={{padding:"16px 22px"}} className="fade-in">
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-0.5,marginBottom:4}}>⚰️ Graveyard</h2>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.25)",marginBottom:6,fontStyle:"italic"}}>Habits you gave up on. They deserved better.</p>
            {shameLog.length>0&&(
              <div style={{marginBottom:20}}>
                <p style={{fontSize:11,letterSpacing:2,color:"rgba(255,100,100,0.6)",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Hall of Shame 💀</p>
                {shameLog.map((s,i)=>(
                  <div key={i} className="glass" style={{borderRadius:14,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:"1px solid rgba(255,100,100,0.15)"}}>
                    <span style={{fontSize:22}}>{s.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)"}}>{s.name}</div><div style={{fontSize:11,color:"rgba(255,100,100,0.6)",marginTop:2}}>Gave up with {s.streak}d streak · {s.date}</div></div>
                    <span style={{fontSize:18}}>💀</span>
                  </div>
                ))}
              </div>
            )}
            {graveyard.length===0&&shameLog.length===0&&<div style={{textAlign:"center",padding:"50px 0"}}><div style={{fontSize:48,marginBottom:12}}>🌿</div><p style={{color:"rgba(255,255,255,0.2)",fontSize:14,fontStyle:"italic"}}>Nothing here yet. Good. Don't let anything end up here.</p></div>}
            {graveyard.length>0&&(
              <>
                <p style={{fontSize:11,letterSpacing:2,color:"rgba(255,255,255,0.2)",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Abandoned Habits</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:12}}>
                  {graveyard.map((g,i)=>(
                    <div key={i} className="rip-stone glass" style={{borderRadius:16,padding:"16px 14px",textAlign:"center",width:"calc(50% - 6px)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontSize:28,marginBottom:6}}>🪦</div>
                      <div style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",marginBottom:4}}>RIP</div>
                      <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:4}}>{g.icon} {g.name}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>Streak: {g.streak}d</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.15)",marginTop:2}}>{g.date}</div>
                      <button onClick={()=>restoreHabit(g.id)} style={{marginTop:10,background:"rgba(124,111,255,0.16)",border:"1px solid rgba(124,111,255,0.35)",borderRadius:10,padding:"7px 10px",color:"#c9bbff",fontSize:11,fontWeight:700,fontFamily:F,cursor:"pointer"}}>Gjenopprett</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Lightbox */}
        {viewPhotos&&(<div onClick={()=>setViewPhotos(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,backdropFilter:"blur(20px)"}}><div style={{position:"relative",width:"88%",maxWidth:360,borderRadius:20,overflow:"hidden"}}><img src={viewPhotos.back} style={{width:"100%",display:"block",borderRadius:20}} alt=""/><div style={{position:"absolute",top:14,left:14,width:90,height:116,borderRadius:14,overflow:"hidden",border:"3px solid #fff",boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}><img src={viewPhotos.front} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/></div></div></div>)}

        {/* Undo modal */}
        {undoTarget&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200,backdropFilter:"blur(12px)"}}><div style={{background:"#141420",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"28px 28px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:430}}><div style={{width:36,height:4,background:"rgba(255,255,255,0.12)",borderRadius:99,margin:"0 auto 26px"}}/><h2 style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,marginBottom:10}}>Undo check-in?</h2><p style={{fontSize:14,color:"rgba(255,255,255,0.35)",lineHeight:1.6,marginBottom:28}}>This removes your photos and unchecks the habit. Streak goes down. Goes to Hall of Shame too, btw.</p><button onClick={()=>confirmUndo(undoTarget)} style={{width:"100%",background:"linear-gradient(135deg,#ff6b6b,#ee5a24)",border:"none",borderRadius:16,padding:16,color:"#fff",fontSize:15,fontWeight:700,fontFamily:F,cursor:"pointer",marginBottom:10}}>Yes, undo it</button><button onClick={()=>setUndoTarget(null)} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16,color:"rgba(255,255,255,0.4)",fontSize:15,fontWeight:600,fontFamily:F,cursor:"pointer"}}>Nevermind, I'm not a quitter</button></div></div>)}
      </div>
    </>
  );
}
