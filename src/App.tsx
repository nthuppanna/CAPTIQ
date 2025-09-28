import React, { useEffect, useMemo, useState } from "react";
import { runCaptionAgent } from './lib/mastraClient';
import { runCedarSpell } from './lib/cedarClient';
import { generateGraphics, modifyGraphic } from './lib/graphicsClient';

// =============================
// Helpers & Mock Services
// =============================
const uid = () => Math.random().toString(36).slice(2, 9);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; } catch { return d; }
};

// Auth (mock one-time social login) ----------------------
const getAuth = () => !!localStorage.getItem("oauth_token");
const connectAuth = () => localStorage.setItem("oauth_token", JSON.stringify({provider:"instagram", ts: Date.now()}));
const disconnectAuth = () => localStorage.removeItem("oauth_token");

// Mock Instagram engagement pull ------------------------
const pullInstagramEngagement = async () => {
  await new Promise(r => setTimeout(r, 400));
  return {
    likes: 1200 + Math.floor(Math.random()*400),
    comments: 160 + Math.floor(Math.random()*80),
    shares: 70 + Math.floor(Math.random()*60)
  };
};

// --- Trendy caption generator (30 options, keyword-aware) ---
const slang = ["let's cook","we outside","vibes","book it","sheeeesh","built different","say less","it hits","lock in","no notes","that part","heater","bananas","ice cold","rim rattler","sprinkle some magic","numbers up","locked","clear the lane","bet","no cap","shooters shoot","dialed","goated","it’s a movie","send it","run it back","heat check","laser","certified"];
const toHashtags = (arr) => (arr && arr.length) ? `\n${arr.map(h => (h.startsWith('#')?h:'#'+h)).join(' ')}` : '';
const buildCaptionPool = ({ keyword, team }) => {
  const kw = keyword.trim();
  const teamTag = team.replace(/\s+/g,'');
  const ideas = [
    `${kw} for ${team} — ${slang[0]}`,
    `${team} ${kw} • ${slang[1]}`,
    `${kw}? say less. ${team}`,
    `${team} ${kw} | ${slang[2]}`,
    `Heat check: ${team} ${kw}`,
    `Dialed in. ${team} ${kw}`,
    `Numbers don't lie — ${team} ${kw}`,
    `Run it back: ${kw} • ${team}`,
    `Locked. ${team} ${kw}.`,
    `Certified: ${team} ${kw}`,
    `All gas: ${team} ${kw}`,
    `Energy up. ${team} ${kw}`,
    `Built different — ${team} ${kw}`,
    `That part. ${team} ${kw}`,
    `We move: ${team} ${kw}`,
    `${kw} with the sauce. ${team}`,
    `${team} ${kw}. no cap`,
    `Big mood → ${team} ${kw}`,
    `Ice cold ${kw} from ${team}`,
    `Bet. ${team} ${kw}`,
    `Laser focus: ${kw} • ${team}`,
    `In our bag: ${team} ${kw}`,
    `Cooked: ${team} ${kw}`,
    `It’s a movie: ${team} ${kw}`,
    `Heat rising — ${team} ${kw}`,
    `Tempo up: ${team} ${kw}`,
    `Chapter: ${kw}. — ${team}`,
    `Signal > noise: ${team} ${kw}`,
    `Blueprint: ${team} ${kw}`,
    `The look: ${kw} #${teamTag}`
  ];
  return ideas;
};
const generateCaptionOptions = ({ keyword, style, platform, team, hashtags, seed=0 }) => {
  const pool = buildCaptionPool({ keyword, team });
  const rotated = [...pool.slice(seed % pool.length), ...pool.slice(0, seed % pool.length)];
  const hashArr = typeof hashtags === 'string' ? hashtags.split(',').map(s=>s.trim()).filter(Boolean) : hashtags;
  const pick = rotated.slice(0, 6).map(line => {
    const suffix = platform === 'Twitter/X' ? ` #${team.replace(/\s+/g,'')}` : '';
    return `${line}${suffix}${toHashtags(hashArr)}`.slice(0, platform === 'Twitter/X' ? 270 : 2200);
  });
  return pick;
};
const generateCaption = (args) => generateCaptionOptions(args)[0];

// --- Dev sanity tests (run in browser only) ---
if (typeof window !== 'undefined') {
  try {
    const testOpts = generateCaptionOptions({ keyword: 'Final Score', style: 'Hype', platform: 'Instagram', team: 'Test Team', hashtags: ['GoTeam'], seed: 2 });
    console.assert(Array.isArray(testOpts) && testOpts.length === 6, 'Caption generator should return 6 options');
  } catch (e) {
    console.warn('Self-test failed:', e);
  }
}

// --- Social Market Index (SMI) ---
const computeSMI = (posts) => {
  const now = Date.now();
  let score = 0;
  posts.forEach(p => {
    const ageHrs = Math.max(1, (now - new Date(p.createdAt).getTime())/ (1000*60*60));
    const engagement = (p.engagement.likes||0) + 2*(p.engagement.comments||0) + 3*(p.engagement.shares||0);
    score += engagement / Math.sqrt(ageHrs);
  });
  return Math.round(score);
};


// --- Simple Canva-style graphic compositor (brand colors) ---
const makeGraphicVariants = async ({ imgUrl, keyword, settings, seed=0, count=4 }) => {
  if (!imgUrl) return [];
  const baseImg = await loadImage(imgUrl);
  const variants = [];
  for (let i=0;i<count;i++){
    const canvas = document.createElement('canvas');
    const w = baseImg.width; const h = baseImg.height;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(baseImg, 0, 0, w, h);
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0, hexToRgba(settings.primary, 0.15 + (i%3)*0.05));
    g.addColorStop(1, hexToRgba(settings.secondary, 0.35));
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    if (i % 2 === 0){
      ctx.fillStyle = hexToRgba('#000', 0.35);
      roundRect(ctx, 24, h*0.75, w-48, h*0.2, 18, true, false);
    } else {
      ctx.fillStyle = hexToRgba(settings.primary, 0.85);
      roundRect(ctx, 24, 24, w*0.6, h*0.16, 16, true, false);
    }
    const headline = keyword.toUpperCase();
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.floor(h*0.08)}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 2;
    const pad = 40;
    const x = i%2===0 ? pad : pad + 8;
    const y = i%2===0 ? h*0.85 : 24 + h*0.08;
    wrapText(ctx, headline, x, y, w - pad*2, h*0.09);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = settings.secondary;
    ctx.font = `${Math.floor(h*0.045)}px Inter, system-ui, sans-serif`;
    ctx.fillText(settings.teamName, x, y + h*0.08);
    ctx.font = `${Math.floor(h*0.06)}px Apple Color Emoji, Segoe UI Emoji`;
    ctx.fillText(settings.logoEmoji || '🏀', w - pad*1.5, pad*1.2);
    variants.push(canvas.toDataURL('image/jpeg', 0.92));
  }
  return variants;
};

function hexToRgba(hex, a){
  const c = hex.replace('#','');
  const bigint = parseInt(c.length===3 ? c.split('').map(ch=>ch+ch).join('') : c, 16);
  const r=(bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
  return `rgba(${r},${g},${b},${a})`;
}
function roundRect(ctx, x, y, w, h, r, fill, stroke){
  if (w<2*r) r=w/2; if (h<2*r) r=h/2;
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  if (fill) ctx.fill(); if (stroke) ctx.stroke();
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line=''; let yy=y;
  for (let n=0;n<words.length;n++){
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxWidth && n>0){
      ctx.fillText(line, x, yy);
      line = words[n] + ' ';
      yy += lineHeight;
    } else { line = test; }
  }
  ctx.fillText(line, x, yy);
}
function loadImage(src){
  return new Promise((res, rej)=>{
    const img=new Image();
    // Only set crossOrigin for remote http(s) images. For local blob: URLs from file uploads,
    // setting crossOrigin can block rendering in some browsers.
    if (/^https?:/i.test(src)) img.crossOrigin='anonymous';
    img.onload=()=>res(img);
    img.onerror=(e)=>rej(e);
    img.src=src;
  });
}

// --- Seed template packs ---
const TEMPLATE_PACKS = [
  { id: 'pack_gameday', name: 'Game Day Pack', items: [ 'Game Day', 'Final Score', 'Halftime Update', 'Starting Five', 'Thank You Fans' ], style: 'Hype' },
  { id: 'pack_spotlight', name: 'Player Spotlight Pack', items: [ 'Player Spotlight', 'Career High', 'Milestone', 'Rookie Watch', 'Captain Quote' ], style: 'Motivational' },
  { id: 'pack_fan', name: 'Fan Engagement Pack', items: [ 'Predict the Score', 'MVP Poll', 'Caption This', 'Throwback Thursday', 'Fan Photos' ], style: 'Funny' }
];

// =============================
// Main App (single-file demo)
// =============================
export default function App() {
  const [route, setRoute] = useState(load('route', 'home'));
  const [settings, setSettings] = useState(load('settings', {
    teamName: 'Bay City Bears',
    primary: '#1E40AF',
    secondary: '#F59E0B',
    tone: 'Hype',
    hashtags: ['BearDown','GameDay'],
    logoEmoji: '🐻'
  }));
  const [posts, setPosts] = useState(load('posts', []));
  const [scheduled, setScheduled] = useState(load('scheduled', []));
  const [modal, setModal] = useState(null); // {type:'preview', post} | {type:'bulk', posts}
  const [authed, setAuthed] = useState(getAuth());
  const [igStats, setIgStats] = useState(load('ig_stats', null));

  useEffect(() => save('route', route), [route]);
  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('posts', posts), [posts]);
  useEffect(() => save('scheduled', scheduled), [scheduled]);
  useEffect(() => save('ig_stats', igStats), [igStats]);

  const smi = useMemo(() => computeSMI(posts), [posts]);

  const theme = { prim: settings.primary, sec: settings.secondary };
  const navItem = (label, target) => (
    <div className={`px-3 py-2 rounded-xl cursor-pointer hover:bg-white/10`} onClick={() => setRoute(target)}>
      <span className="font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen text-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Top Nav */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center gap-6 px-4 py-3">
          <div className="flex items-center gap-2 text-xl font-bold" style={{color: theme.sec}}>
            <span className="text-2xl">{settings.logoEmoji}</span>
            <span className="text-white">Sports Social Media Copilot</span>
          </div>
          <div className="hidden md:flex gap-2 text-sm">
            {navItem('Home', 'home')}
            {navItem('Create Post', 'create')}
            {navItem('Template Packs', 'packs')}
            {navItem('Schedule', 'schedule')}
            {navItem('Analytics', 'analytics')}
            {navItem('Brand', 'brand')}
            {navItem('Help', 'help')}
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="text-slate-300">Team: <span className="font-semibold text-white">{settings.teamName}</span></div>
            <button
              onClick={() => { if (authed) { disconnectAuth(); setAuthed(false); } else { connectAuth(); setAuthed(true); } }}
              className={`px-3 py-2 rounded-xl border border-white/15 ${authed? 'bg-emerald-600/30 hover:bg-emerald-600/40':'bg-white/5 hover:bg-white/10'}`}
            >{authed? 'Connected' : 'Connect'}</button>
          </div>
        </div>
      </div>

      {/* Page router */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {route === 'home' && <Home smi={smi} settings={settings} setRoute={setRoute} posts={posts} setPosts={setPosts} />}
        {route === 'create' && <CreatePost settings={settings} onCreate={(post) => { setPosts(p=>[post,...p]); setModal({type:'preview', post}); }} />}
        {route === 'packs' && <Packs settings={settings} onBulkCreate={(newPosts)=>{ setPosts(p=>[...newPosts,...p]); setModal({type:'bulk', posts:newPosts}); }} />}
        {route === 'schedule' && <Scheduler scheduled={scheduled} setScheduled={setScheduled} posts={posts} settings={settings} />}
        {route === 'analytics' && <Analytics posts={posts} smi={smi} settings={settings} igStats={igStats} setIgStats={setIgStats} authed={authed} setPosts={setPosts} />}
        {route === 'brand' && <Brand settings={settings} setSettings={setSettings} />}
        {route === 'help' && <Help />}
      </div>

      {modal?.type === 'preview' && <PreviewModal post={modal.post} onClose={()=>setModal(null)} onSchedule={(date)=>{
        setScheduled(s=>[{...modal.post, scheduledAt: date}, ...s]); setModal(null);
      }} />}
      {modal?.type === 'bulk' && <BulkModal posts={modal.posts} onClose={()=>setModal(null)} onScheduleAll={(date)=>{
        const withDates = modal.posts.map(p=>({...p, scheduledAt: date}));
        setScheduled(s=>[...withDates, ...s]); setModal(null);
      }} />}

      <footer className="text-center text-xs text-slate-400 py-8">© {new Date().getFullYear()} Copilot • Built for team PR managers</footer>
    </div>
  );
}

// =============================
// Pages
// =============================
function Home({ smi, settings, setRoute, posts, setPosts }) {
  const latest = posts.slice(0, 5);

  const handleDuplicate = (duplicatedPost) => {
    setPosts(p => [duplicatedPost, ...p]);
  };

  const handleUpdateEngagement = (postId, newEngagement) => {
    setPosts(p => p.map(post => 
      post.id === postId ? { ...post, engagement: newEngagement } : post
    ));
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Quick Generate Post" tint={settings.primary}>
        <QuickGenerate settings={settings} setRoute={setRoute} />
      </Card>
      <Card title="Engagement Highlights" tint={settings.secondary}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="Posts" value={posts.length} />
          <Stat label="Likes" value={posts.reduce((a,b)=>a+(b.engagement.likes||0),0)} />
          <Stat label="Comments" value={posts.reduce((a,b)=>a+(b.engagement.comments||0),0)} />
        </div>
      </Card>
      <Card title="Team Engagement Market (SMI)" tint={settings.primary}>
        <SMISparkline posts={posts} smi={smi} />
      </Card>
      <Card title="Recent Posts" tint={settings.secondary}>
        <div className="space-y-3">
          {latest.length === 0 && <div className="text-slate-300">No posts yet. Create your first one!</div>}
          {latest.map(p=> <PostRow key={p.id} post={p} onDuplicate={handleDuplicate} onUpdateEngagement={handleUpdateEngagement} />)}
        </div>
      </Card>
    </div>
  );
}

function CreatePost({ settings, onCreate }) {
  const [keyword, setKeyword] = useState("");
  const [platform, setPlatform] = useState('Instagram');
  const [style, setStyle] = useState(settings.tone || 'Hype');
  const [hashtags, setHashtags] = useState(settings.hashtags.join(', '));
  const [seed, setSeed] = useState(0);
  const [media, setMedia] = useState([]); // [{id,name,url,type}]
  const [captionOptions, setCaptionOptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState('');
  const [gfx, setGfx] = useState([]); // dataURL variants
  const [selectedGfx, setSelectedGfx] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState('');
  const [cedarBusy, setCedarBusy] = useState(false);
  const [previewGraphic, setPreviewGraphic] = useState(null);
  const [graphicModificationRequest, setGraphicModificationRequest] = useState('');

  // Helper function to get text box configuration based on AI instructions
  const getTextBoxConfig = (instruction, w, h, settings) => {
    const pad = 40;
    const textBoxHeight = h * 0.2;
    
    switch (instruction.textBoxPosition) {
      case 'top':
        return {
          x: 24,
          y: 24,
          w: w * 0.6,
          h: textBoxHeight,
          fillStyle: instruction.textBoxStyle === 'transparent' 
            ? 'rgba(0,0,0,0.3)' 
            : instruction.textBoxStyle === 'solid' 
              ? hexToRgba(settings.primary, 0.85)
              : 'rgba(0,0,0,0.35)'
        };
      case 'bottom':
        return {
          x: 24,
          y: h * 0.75,
          w: w - 48,
          h: textBoxHeight,
          fillStyle: instruction.textBoxStyle === 'transparent'
            ? 'rgba(0,0,0,0.3)'
            : instruction.textBoxStyle === 'solid'
              ? hexToRgba(settings.primary, 0.85)
              : 'rgba(0,0,0,0.35)'
        };
      case 'center':
        return {
          x: w * 0.1,
          y: h * 0.4,
          w: w * 0.8,
          h: textBoxHeight,
          fillStyle: instruction.textBoxStyle === 'transparent'
            ? 'rgba(0,0,0,0.3)'
            : instruction.textBoxStyle === 'solid'
              ? hexToRgba(settings.primary, 0.85)
              : 'rgba(0,0,0,0.35)'
        };
      default:
        return null;
    }
  };

  // Helper function to get text configuration based on AI instructions
  const getTextConfig = (instruction, settings, h) => {
    const fontSize = instruction.textStyle === 'large' ? h * 0.1 : 
                     instruction.textStyle === 'small' ? h * 0.06 : h * 0.08;
    
    const fontWeight = instruction.textStyle === 'bold' ? 'bold' : 'normal';
    
    const color = instruction.textColor === 'primary' ? settings.primary :
                  instruction.textColor === 'secondary' ? settings.secondary :
                  instruction.textColor === 'black' ? '#000' :
                  instruction.textColor === 'blue' ? '#3B82F6' :
                  instruction.textColor === 'red' ? '#EF4444' :
                  instruction.textColor === 'green' ? '#10B981' :
                  instruction.textColor === 'yellow' ? '#F59E0B' :
                  instruction.textColor === 'purple' ? '#8B5CF6' :
                  instruction.textColor === 'orange' ? '#F97316' :
                  '#fff';
    
    return {
      font: `${fontWeight} ${Math.floor(fontSize)}px Inter, system-ui, sans-serif`,
      color: color,
      x: 40,
      y: instruction.textBoxPosition === 'top' ? 24 + h * 0.08 : 
         instruction.textBoxPosition === 'bottom' ? h * 0.85 : h * 0.5
    };
  };

  // Simple text color modification
  const modifyTextColor = async ({ originalGraphic, newColor, keyword, settings }) => {
    if (!originalGraphic) return [];
    
    const baseImg = await loadImage(originalGraphic);
    const canvas = document.createElement('canvas');
    const w = baseImg.width; const h = baseImg.height;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(baseImg, 0, 0, w, h);
    
    // Find the text area and redraw with new color
    // We'll redraw the text box and text with the new color
    const textBoxHeight = h * 0.2;
    const textBoxY = h * 0.75; // Bottom position
    const textBoxX = 24;
    const textBoxW = w - 48;
    
    // Redraw text box (keep original style)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, textBoxX, textBoxY, textBoxW, textBoxHeight, 18, true, false);
    
    // Set new text color
    const colorMap = {
      'blue': '#3B82F6',
      'red': '#EF4444', 
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'orange': '#F97316',
      'white': '#FFFFFF',
      'black': '#000000'
    };
    
    const textColor = colorMap[newColor] || '#3B82F6';
    
    // Draw text with new color
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.floor(h * 0.08)}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    
    // Draw main text
    const textX = 40;
    const textY = textBoxY + textBoxHeight / 2;
    wrapText(ctx, keyword.toUpperCase(), textX, textY, w - 80, h * 0.09);
    
    // Add team name (keep original color)
    ctx.fillStyle = settings.secondary;
    ctx.font = `${Math.floor(h * 0.045)}px Inter, system-ui, sans-serif`;
    ctx.fillText(settings.teamName, textX, textY + h * 0.08);
    
    // Add logo emoji (keep original)
    ctx.font = `${Math.floor(h * 0.06)}px Apple Color Emoji, Segoe UI Emoji`;
    ctx.fillText(settings.logoEmoji || '🏀', w - 40, 40);
    
    return [canvas.toDataURL('image/jpeg', 0.92)];
  };

  // AI-Enhanced graphic compositor using design instructions
  const createEnhancedGraphics = async ({ imgUrl, keyword, settings, designInstructions }) => {
    if (!imgUrl) return [];
    const baseImg = await loadImage(imgUrl);
    const variants = [];
    
    for (let i = 0; i < designInstructions.length; i++) {
      const instruction = designInstructions[i];
      const canvas = document.createElement('canvas');
      const w = baseImg.width; const h = baseImg.height;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      
      // Draw the original image
      ctx.drawImage(baseImg, 0, 0, w, h);
      
      // Apply background style based on AI instructions
      if (instruction.backgroundStyle === 'gradient') {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, hexToRgba(settings.primary, 0.2));
        g.addColorStop(1, hexToRgba(settings.secondary, 0.4));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else if (instruction.backgroundStyle === 'solid') {
        ctx.fillStyle = hexToRgba(settings.primary, 0.3);
        ctx.fillRect(0, 0, w, h);
      }
      
      // Create text box based on AI instructions
      const textBoxConfig = getTextBoxConfig(instruction, w, h, settings);
      if (textBoxConfig) {
        ctx.fillStyle = textBoxConfig.fillStyle;
        if (instruction.textBoxStyle === 'rounded') {
          roundRect(ctx, textBoxConfig.x, textBoxConfig.y, textBoxConfig.w, textBoxConfig.h, 18, true, false);
        } else {
          ctx.fillRect(textBoxConfig.x, textBoxConfig.y, textBoxConfig.w, textBoxConfig.h);
        }
      }
      
      // Apply text styling based on AI instructions
      const textConfig = getTextConfig(instruction, settings, h);
      ctx.fillStyle = textConfig.color;
      ctx.font = textConfig.font;
      ctx.textBaseline = 'middle';
      
      // Apply additional effects
      if (instruction.additionalEffects === 'shadow') {
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 2;
      } else if (instruction.additionalEffects === 'glow') {
        ctx.shadowColor = settings.primary;
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 0;
      }
      
       // Position and draw text
       const textX = textConfig.x;
       const textY = textConfig.y;
       
       // Generate different text variations for each graphic
       const textVariations = [
         keyword.toUpperCase(),
         `${keyword} • ${settings.teamName}`,
         `${settings.teamName} ${keyword}`,
         `${keyword} ${settings.logoEmoji}`,
         `#${keyword.replace(/\s+/g, '')}`,
         `${keyword} GAME DAY`
       ];
       
       const displayText = instruction.displayText || textVariations[i] || keyword.toUpperCase();
       wrapText(ctx, displayText, textX, textY, w - 80, h * 0.09);
      
      // Reset shadow effects
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Add team name
      ctx.fillStyle = settings.secondary;
      ctx.font = `${Math.floor(h * 0.045)}px Inter, system-ui, sans-serif`;
      ctx.fillText(settings.teamName, textX, textY + h * 0.08);
      
      // Add logo emoji
      ctx.font = `${Math.floor(h * 0.06)}px Apple Color Emoji, Segoe UI Emoji`;
      ctx.fillText(settings.logoEmoji || '🏀', w - 40, 40);
      
      variants.push(canvas.toDataURL('image/jpeg', 0.92));
    }
    
    return variants;
  };

  // Draft autosave functionality
  const [draftTimeout, setDraftTimeout] = useState(null);
  
  const saveDraft = () => {
    const draft = {
      keyword,
      platform,
      style,
      hashtags,
      selectedGfx,
      media: media.map(m => ({ id: m.id, name: m.name, url: m.url, type: m.type }))
    };
    localStorage.setItem('draft_post', JSON.stringify(draft));
  };

  const clearDraft = () => {
    localStorage.removeItem('draft_post');
    setKeyword("");
    setPlatform('Instagram');
    setStyle(settings.tone || 'Hype');
    setHashtags(settings.hashtags.join(', '));
    setMedia([]);
    setSelectedGfx(null);
  };

  const debouncedSaveDraft = () => {
    if (draftTimeout) clearTimeout(draftTimeout);
    const timeout = setTimeout(saveDraft, 1000);
    setDraftTimeout(timeout);
  };

  const handleAgentRegenerate = async () => {
    if (!keyword.trim()) return;
    setAgentLoading(true);
    try {
      const agentCaptions = await runCaptionAgent({
        team: settings.teamName,
        keyword,
        style,
        platform,
        hashtags: hashtags.split(',').map(s=>s.trim()).filter(Boolean)
      });
      if (agentCaptions.length > 0) {
        setCaptionOptions(agentCaptions);
        setSelectedCaption(agentCaptions[0]);
      }
    } catch (e) {
      alert('Agent error: ' + e.message);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleGraphicsRegenerate = async () => {
    if (!keyword.trim()) return;
    setAgentLoading(true);
    try {
      console.log('🎨 Generating graphics with Gemini for keyword:', keyword);
      
      const graphics = await generateGraphics({
        keyword,
        teamName: settings.teamName,
        primaryColor: settings.primary,
        secondaryColor: settings.secondary,
        logoEmoji: settings.logoEmoji,
        count: 4
      });

      if (graphics.length > 0) {
        console.log('🎨 Using AI-generated design instructions:', graphics);
        
        // Use the AI-generated design instructions to create enhanced graphics
        const uploadedImage = media.find(m => m.type === 'image');
        if (uploadedImage) {
          const enhancedGraphics = await createEnhancedGraphics({
            imgUrl: uploadedImage.url,
            keyword,
            settings,
            designInstructions: graphics
          });
          setGfx(enhancedGraphics);
          setSelectedGfx(enhancedGraphics[0] || null);
          console.log('✅ Generated', enhancedGraphics.length, 'AI-enhanced graphics');
        } else {
          console.log('⚠️ No uploaded image, falling back to canvas method');
          setSeed(s => s + 1);
        }
      } else {
        console.log('⚠️ No graphics generated, falling back to canvas method');
        // Fallback to original canvas method
        setSeed(s => s + 1);
      }
    } catch (e) {
      console.error('Graphics generation error:', e);
      alert('Graphics error: ' + e.message);
      // Fallback to original canvas method
      setSeed(s => s + 1);
    } finally {
      setAgentLoading(false);
    }
  };

  const handleModifyGraphic = async () => {
    if (!graphicModificationRequest.trim() || !selectedGfx) return;
    setCedarBusy(true);
    try {
      console.log('🎨 Modifying text color with request:', graphicModificationRequest);
      
      // Get the current graphic's index
      const currentGraphicIndex = gfx.findIndex(g => g === selectedGfx);
      if (currentGraphicIndex === -1) {
        throw new Error('Selected graphic not found');
      }

      // Call the modification API to get the color
      const modificationResult = await modifyGraphic({
        modificationRequest: graphicModificationRequest,
        keyword,
        teamName: settings.teamName,
        primaryColor: settings.primary,
        secondaryColor: settings.secondary,
        logoEmoji: settings.logoEmoji
      });

      if (modificationResult.length > 0) {
        const newColor = modificationResult[0].textColor || 'blue';
        console.log('🎨 Changing text color to:', newColor);
        
        // Apply the color change to the existing graphic
        const modifiedGraphics = await modifyTextColor({
          originalGraphic: selectedGfx,
          newColor,
          keyword,
          settings
        });

        if (modifiedGraphics.length > 0) {
          // Replace the current graphic with the modified version
          const newGfx = [...gfx];
          newGfx[currentGraphicIndex] = modifiedGraphics[0];
          setGfx(newGfx);
          setSelectedGfx(modifiedGraphics[0]);
          console.log('✅ Text color changed successfully to:', newColor);
        } else {
          throw new Error('Failed to apply color change');
        }
      } else {
        throw new Error('No color instruction returned');
      }
    } catch (e) {
      console.error('Text color modification error:', e);
      alert('Color change error: ' + e.message);
    } finally {
      setCedarBusy(false);
    }
  };

  const handleAskCedar = async () => {
    if (!keyword.trim()) return;
    setCedarBusy(true);
    try {
      const suggestion = await runCedarSpell({
        team: settings.teamName,
        keyword,
        style,
        platform,
        hashtags: hashtags.split(',').map(s=>s.trim()).filter(Boolean)
      });
      setAgentSuggestion(suggestion);
    } catch (e) {
      alert('Cedar error: ' + e.message);
    } finally {
      setCedarBusy(false);
    }
  };

  const handleUseSuggestion = () => {
    if (!agentSuggestion) return;
    if (!captionOptions.includes(agentSuggestion)) {
      setCaptionOptions(prev => [agentSuggestion, ...prev]);
    }
    setSelectedCaption(agentSuggestion);
  };

  useEffect(()=>{ const q=localStorage.getItem('quick_kw'); if(q){ setKeyword(q); localStorage.removeItem('quick_kw'); } },[]);

  // Load draft on mount
  useEffect(() => {
    const draft = load('draft_post', null);
    if (draft) {
      setKeyword(draft.keyword || "");
      setPlatform(draft.platform || 'Instagram');
      setStyle(draft.style || settings.tone || 'Hype');
      setHashtags(draft.hashtags || settings.hashtags.join(', '));
      setSelectedGfx(draft.selectedGfx || null);
      setMedia(draft.media || []);
    }
  }, [settings.tone, settings.hashtags]);

  useEffect(()=>{
    if(!keyword) { setCaptionOptions([]); setSelectedCaption(''); return; }
    const opts = generateCaptionOptions({ keyword, style, platform, team: settings.teamName, hashtags: hashtags.split(',').map(s=>s.trim()).filter(Boolean), seed });
    setCaptionOptions(opts); setSelectedCaption(opts[0]||'');
  }, [keyword, style, platform, hashtags, seed, settings.teamName]);

  // Autosave draft when fields change
  useEffect(() => {
    debouncedSaveDraft();
  }, [keyword, platform, style, hashtags, selectedGfx, media]);

  useEffect(()=>{
    (async ()=>{
      const img = media.find(m=>m.type==='image');
      if (!img || !keyword){ setGfx([]); setSelectedGfx(null); return; }
      
      try {
        // Try Gemini API first for graphics generation
        console.log('🎨 Auto-generating graphics with Gemini...');
        
        const graphics = await generateGraphics({
          keyword,
          teamName: settings.teamName,
          primaryColor: settings.primary,
          secondaryColor: settings.secondary,
          logoEmoji: settings.logoEmoji,
          count: 4
        });

        if (graphics.length > 0) {
          console.log('🎨 Using AI-generated design instructions for auto-generation:', graphics);
          
          // Use the AI-generated design instructions to create enhanced graphics
          const enhancedGraphics = await createEnhancedGraphics({
            imgUrl: img.url,
            keyword,
            settings,
            designInstructions: graphics
          });
          setGfx(enhancedGraphics);
          setSelectedGfx(enhancedGraphics[0]||null);
          console.log('✅ Auto-generated', enhancedGraphics.length, 'AI-enhanced graphics');
        } else {
          throw new Error('No graphics returned from API');
        }
      } catch (error) {
        console.log('⚠️ Gemini graphics failed, falling back to canvas method:', error.message);
        // Fall back to original canvas method
        try {
          const variants = await makeGraphicVariants({ imgUrl: img.url, keyword, settings, seed, count:4 });
          setGfx(variants); setSelectedGfx(variants[0]||null);
        } catch (canvasError) {
          setGfx([]); setSelectedGfx(null);
        }
      }
    })();
  }, [media, keyword, settings.primary, settings.secondary, settings.teamName, settings.logoEmoji]);

  const handleCreate = () => {
    if (!keyword.trim()) return;
    const text = selectedCaption || (captionOptions[0]||'');
    const post = { id: uid(), platform, style, text, keyword, media: selectedGfx ? [{id: uid(), name:'graphic.jpg', url:selectedGfx, type:'image'}] : media, createdAt: new Date().toISOString(), engagement: { likes: 0, comments: 0, shares: 0 } };
    onCreate(post);
    clearDraft();
    setGfx([]);
  };

  const onFiles = (files) => {
    if (!files) return;
    const next = [];
    let hasHeic = false;
    for (const f of Array.from(files)){
      const url = URL.createObjectURL(f);
      const type = f.type.startsWith('video') ? 'video' : 'image';
      next.push({ id: uid(), name: f.name, url, type });
      if (f.name.toLowerCase().endsWith('.heic')) hasHeic = true;
    }
    setMedia(m=>[...m, ...next]);
    if (hasHeic) {
      // Show inline note for HEIC files
      const note = document.createElement('div');
      note.className = 'text-xs text-amber-400 mt-2';
      note.textContent = 'Use PNG/JPG for graphics.';
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput && !fileInput.parentNode.querySelector('.heic-note')) {
        note.className += ' heic-note';
        fileInput.parentNode.appendChild(note);
        setTimeout(() => note.remove(), 5000);
      }
    }
  };

  return (
    <>
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Compose" tint={settings.primary}>
        <label className="block text-sm mb-1 text-slate-300">Keyword / idea</label>
        <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g., Game Day, Final score, Player spotlight" className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Platform</label>
            <select value={platform} onChange={e=>setPlatform(e.target.value)} className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Instagram</option>
              <option>TikTok</option>
              <option>Twitter/X</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Style</label>
            <select value={style} onChange={e=>setStyle(e.target.value)} className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Hype</option>
              <option>Motivational</option>
              <option>Analytical</option>
              <option>Funny</option>
            </select>
          </div>
        </div>

        <label className="block text-sm mb-1 text-slate-300">Hashtags (comma-separated)</label>
        <input value={hashtags} onChange={e=>setHashtags(e.target.value)} className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

        <div className="flex gap-2 mb-4">
          <button onClick={handleAgentRegenerate} disabled={agentLoading || !keyword.trim()} className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Regenerate Captions</button>
          <button onClick={handleGraphicsRegenerate} disabled={agentLoading || !keyword.trim()} className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Regenerate Graphics</button>
          <button onClick={clearDraft} className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">Clear Draft</button>
          <button onClick={handleCreate} disabled={!keyword.trim()} className={`px-4 py-2 rounded-xl text-white font-semibold ${keyword.trim() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-500 cursor-not-allowed'}`}>Save Post</button>
        </div>

        {/* Caption chooser */}
        {captionOptions.length>0 && (
          <div className="mb-5">
            <div className="text-sm text-slate-300 mb-2">Pick a caption</div>
            <div className="grid gap-2">
              {captionOptions.map((c,i)=> (
                <label key={i} className={`p-3 rounded-xl border cursor-pointer ${selectedCaption===c? 'border-emerald-400 bg-white/10':'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                  <input type="radio" className="mr-2" checked={selectedCaption===c} onChange={()=>setSelectedCaption(c)} />
                  <span className="align-middle">{c}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm text-slate-300">Attach images or videos (optional)</div>
          <input type="file" accept="image/*,video/*" multiple onChange={(e)=>onFiles(e.target.files)} className="block w-full text-sm file:mr-3 file:rounded-xl file:border file:border-white/20 file:bg-white/10 file:px-3 file:py-2 file:text-white hover:file:bg-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Upload images or videos" />
          {media.length>0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {media.map(m=> (
                <div key={m.id} className="rounded-xl overflow-hidden border border-white/10">
                  {m.type==='image' ? <img src={m.url} alt={m.name} className="w-full h-28 object-cover"/> : <video src={m.url} className="w-full h-28 object-cover" muted controls/>}
                  <div className="text-[11px] px-2 py-1 text-slate-300 truncate">{m.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card title="Graphic Preview" tint={settings.secondary}>
        {gfx.length===0 && <div className="text-slate-300">Upload at least one image and add keywords to generate branded mockups.</div>}
        {gfx.length>0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gfx.map((src,idx)=> (
              <div 
                key={idx} 
                className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 ${selectedGfx===src? 'border-emerald-400':'border-white/10 hover:border-white/30'}`} 
                onClick={()=>setSelectedGfx(src)}
                onDoubleClick={()=>setPreviewGraphic(src)}
                title="Click to select, double-click for full preview"
              >
                <img src={src} alt={`variant-${idx}`} className="w-full h-48 object-cover"/>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-sm font-medium text-slate-300 mb-2">Change Text Color</div>
          <div className="mb-3">
            <input 
              type="text"
              value={graphicModificationRequest}
              onChange={(e) => setGraphicModificationRequest(e.target.value)}
              placeholder="e.g., 'make the text blue', 'change to red', 'green text'"
              className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleModifyGraphic} 
              disabled={cedarBusy || !graphicModificationRequest.trim() || !selectedGfx} 
              className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cedarBusy ? 'Changing...' : 'Change Color'}
            </button>
            <button 
              onClick={() => setGraphicModificationRequest('')} 
              className="px-3 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Clear
            </button>
          </div>
        </div>
      </Card>
    </div>

    {/* Graphic Preview Modal */}
    {previewGraphic && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setPreviewGraphic(null)}>
        <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <div className="text-lg font-semibold text-white">Graphic Preview</div>
            <button 
              onClick={() => setPreviewGraphic(null)} 
              className="text-slate-300 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="p-6 flex justify-center">
            <img 
              src={previewGraphic} 
              alt="Graphic preview" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <div className="p-4 border-t border-white/10 flex justify-center">
            <button 
              onClick={() => {
                setSelectedGfx(previewGraphic);
                setPreviewGraphic(null);
              }}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              Select This Graphic
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function Packs({ settings, onBulkCreate }) {
  const [selectedPack, setSelectedPack] = useState(TEMPLATE_PACKS[0].id);
  const [platform, setPlatform] = useState('Instagram');
  const pack = TEMPLATE_PACKS.find(p=>p.id===selectedPack);

  const handleCreate = () => {
    const posts = pack.items.map(it => ({
      id: uid(),
      platform,
      style: pack.style,
      keyword: it,
      text: generateCaption({ keyword: it, style: pack.style, platform, team: settings.teamName, hashtags: settings.hashtags }),
      createdAt: new Date().toISOString(),
      engagement: { likes: 0, comments: 0, shares: 0 }
    }));
    onBulkCreate(posts);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Template Packs" tint={settings.primary}>
        <div className="grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            {TEMPLATE_PACKS.map(p=> (
              <div key={p.id} onClick={()=>setSelectedPack(p.id)} className={`p-4 rounded-xl cursor-pointer border ${selectedPack===p.id?'border-indigo-400 bg-white/10':'border-white/10 bg-white/5'}`}>
                <div className="font-semibold mb-1">{p.name}</div>
                <div className="text-xs text-slate-300">Default style: {p.style}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1 text-slate-300">Platform</label>
              <select value={platform} onChange={e=>setPlatform(e.target.value)} className="w-full p-3 rounded-xl bg-slate-800/60 border border-white/10">
                <option>Instagram</option>
                <option>TikTok</option>
                <option>Twitter/X</option>
              </select>
            </div>
          </div>

          <button onClick={handleCreate} className="px-4 py-3 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700">Generate Pack</button>
        </div>
      </Card>

      <Card title="Preview" tint={settings.secondary}>
        <ul className="list-disc pl-6 text-sm text-slate-200">
          {pack.items.map(it=> <li key={it}>{it} • <span className="italic opacity-70">{pack.style}</span></li>)}
        </ul>
      </Card>
    </div>
  );
}

function Scheduler({ scheduled, setScheduled, posts, settings }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [postId, setPostId] = useState(posts[0]?.id || "");

  const scheduleItem = () => {
    if (!date || !postId) return;
    const dt = new Date(`${date}T${time || '09:00'}`);
    if (isNaN(dt.getTime())) return;
    const post = posts.find(p=>p.id===postId);
    if (!post) return;
    setScheduled(s=>[{...post, scheduledAt: dt.toISOString()}, ...s]);
  };

  const remove = (id) => setScheduled(s=> s.filter(x=>x.id!==id));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Add to Calendar" tint={settings.primary}>
        <div className="grid gap-3">
          <label className="text-sm text-slate-300">Select post</label>
          <select value={postId} onChange={e=>setPostId(e.target.value)} className="p-3 rounded-xl bg-slate-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="Select post to schedule">
            {posts.map(p=> <option value={p.id} key={p.id}>{p.platform}: {p.keyword}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300">Date</label>
              <input type="date" className="p-3 rounded-xl w-full bg-slate-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={date} onChange={e=>setDate(e.target.value)} aria-label="Select date" />
            </div>
            <div>
              <label className="text-sm text-slate-300">Time</label>
              <input type="time" className="p-3 rounded-xl w-full bg-slate-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={time} onChange={e=>setTime(e.target.value)} aria-label="Select time" />
            </div>
          </div>
          <button onClick={scheduleItem} className="px-4 py-3 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">Schedule</button>
        </div>
      </Card>

      <Card title="Upcoming Scheduled" tint={settings.secondary}>
        <div className="space-y-3">
          {scheduled.length===0 && <div className="text-slate-300">No scheduled posts yet.</div>}
          {scheduled.sort((a,b)=> new Date(b.scheduledAt)-new Date(a.scheduledAt)).map(item => (
            <div key={item.id} className="p-4 bg-slate-800/60 border border-white/10 rounded-xl">
              <div className="text-xs text-slate-300 mb-1">{item.platform} • {new Date(item.scheduledAt).toLocaleString()}</div>
              <div className="font-medium mb-2">{item.keyword}</div>
              <div className="text-sm whitespace-pre-wrap">{item.text}</div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>remove(item.id)} className="px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Analytics({ posts, smi, settings, igStats, setIgStats, authed, setPosts }) {
  const [filter, setFilter] = useState('All');
  const filtered = posts.filter(p => filter==='All' || p.style===filter);

  const totals = {
    likes: filtered.reduce((a,b)=>a+(b.engagement.likes||0),0),
    comments: filtered.reduce((a,b)=>a+(b.engagement.comments||0),0),
    shares: filtered.reduce((a,b)=>a+(b.engagement.shares||0),0)
  };

  const handleDuplicate = (duplicatedPost) => {
    setPosts(p => [duplicatedPost, ...p]);
  };

  const handleUpdateEngagement = (postId, newEngagement) => {
    setPosts(p => p.map(post => 
      post.id === postId ? { ...post, engagement: newEngagement } : post
    ));
  };

  const refreshIG = async () => {
    if (!authed) return alert('Connect Instagram (mock) first in the navbar.');
    const data = await pullInstagramEngagement();
    setIgStats(data);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Team Engagement Market (SMI)" tint={settings.primary}>
        <div className="text-3xl font-bold" style={{color: settings.secondary}}>{smi}</div>
        <div className="text-sm text-slate-300 mb-4">Composite score from recent post engagement, with time decay.</div>
        <SMISparkline posts={posts} smi={smi} height={140} />
      </Card>

      <Card title="Engagement Totals" tint={settings.secondary}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm text-slate-300">Filter:</span>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="p-2 rounded-lg bg-slate-800/60 border border-white/10">
            <option>All</option>
            <option>Hype</option>
            <option>Motivational</option>
            <option>Analytical</option>
            <option>Funny</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="Likes" value={totals.likes} />
          <Stat label="Comments" value={totals.comments} />
          <Stat label="Shares" value={totals.shares} />
        </div>
        <div className="mt-6 space-y-3">
          {filtered.slice(0,8).map(p=> <PostRow key={p.id} post={p} onDuplicate={handleDuplicate} onUpdateEngagement={handleUpdateEngagement} />)}
        </div>
        <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Instagram (pulled)</div>
              <div className="text-sm text-slate-300">{igStats? `Likes ${igStats.likes} • Comments ${igStats.comments} • Shares ${igStats.shares}` : '— not connected —'}</div>
            </div>
            <button onClick={refreshIG} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm">{igStats? 'Refresh' : 'Pull from Instagram'}</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Brand({ settings, setSettings }) {
  const [local, setLocal] = useState(settings);
  const update = (k,v)=> setLocal(s=>({...s,[k]:v}));
  const saveAll = ()=> setSettings(local);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="Team Branding" tint={settings.primary}>
        <div className="grid gap-3">
          <Labeled label="Team name"><input className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.teamName} onChange={e=>update('teamName', e.target.value)} /></Labeled>
          <Labeled label="Primary color"><input type="color" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.primary} onChange={e=>update('primary', e.target.value)} /></Labeled>
          <Labeled label="Secondary color"><input type="color" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.secondary} onChange={e=>update('secondary', e.target.value)} /></Labeled>
          <Labeled label="Default tone">
            <select className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.tone} onChange={e=>update('tone', e.target.value)}>
              <option>Hype</option>
              <option>Motivational</option>
              <option>Analytical</option>
              <option>Funny</option>
            </select>
          </Labeled>
          <Labeled label="Default hashtags (comma-separated)"><input className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.hashtags.join(', ')} onChange={e=>update('hashtags', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} /></Labeled>
          <Labeled label="Logo emoji"><input className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={local.logoEmoji} onChange={e=>update('logoEmoji', e.target.value)} /></Labeled>
          <button onClick={saveAll} className="px-4 py-3 rounded-xl text-white font-semibold mt-2 bg-indigo-600 hover:bg-indigo-700">Save brand</button>
        </div>
      </Card>

      <Card title="Live Preview" tint={settings.secondary}>
        <div className="p-6 rounded-xl border border-white/10">
          <div className="text-xl font-bold mb-2" style={{color: local.primary}}>{local.logoEmoji} {local.teamName}</div>
          <div className="text-sm text-slate-300 mb-4">Tone: {local.tone}</div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-white" style={{background: local.primary}}>Primary</span>
            <span className="px-3 py-1 rounded-full text-white" style={{background: local.secondary}}>Secondary</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Help(){
  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-3">Help & Tips</h2>
      <ul className="list-disc pl-6 space-y-2 text-slate-300">
        <li>Use <span className="font-semibold text-white">Create Post</span> for one-offs. Keyword → platform → style → <i>Regenerate</i> for fresh captions + graphics.</li>
        <li><span className="font-semibold text-white">Template Packs</span> can fill your calendar fast. Generate then schedule.</li>
        <li><span className="font-semibold text-white">SMI</span> goes up as posts earn likes, comments, and shares. Fresh posts count more.</li>
        <li>Use the navbar button to <span className="font-semibold text-white">Connect</span> Instagram once; we auto-remember.</li>
      </ul>
    </div>
  );
}

// =============================
// Reusable UI
// =============================
function Card({ title, children, tint }){
  return (
    <div className="bg-slate-900/70 border border-white/10 rounded-2xl shadow-lg">
      <div className="px-5 py-3 border-b border-white/10 font-semibold" style={{color: tint}}>{title}</div>
      <div className="p-5">{children}</div>
    </div>
  );
}
function Stat({label, value}){
  return (
    <div className="p-4 bg-slate-800/60 border border-white/10 rounded-xl">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-300">{label}</div>
    </div>
  );
}
function Labeled({label, children}){
  return (
    <div>
      <label className="block text-sm mb-1 text-slate-300">{label}</label>
      {children}
    </div>
  );
}
function PostRow({ post, onDuplicate, onUpdateEngagement }){
  const [showAdjust, setShowAdjust] = useState(false);
  const [engagement, setEngagement] = useState(post.engagement);

  const handleDuplicate = () => {
    const duplicated = {
      ...post,
      id: uid(),
      createdAt: new Date().toISOString(),
      engagement: { likes: 0, comments: 0, shares: 0 }
    };
    onDuplicate(duplicated);
  };

  const handleEngagementChange = (field, value) => {
    const newEngagement = { ...engagement, [field]: parseInt(value) || 0 };
    setEngagement(newEngagement);
    onUpdateEngagement(post.id, newEngagement);
  };

  const slugify = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleExportPNG = async () => {
    const imageMedia = post.media?.[0];
    if (!imageMedia || imageMedia.type !== 'image') return;

    const filename = `${slugify(post.keyword)}.png`;
    
    try {
      if (imageMedia.url.startsWith('data:')) {
        // Handle data URLs directly
        const link = document.createElement('a');
        link.href = imageMedia.url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle blob URLs by converting to canvas
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        img.onerror = () => {
          // Fallback: try direct download
          const link = document.createElement('a');
          link.href = imageMedia.url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        img.src = imageMedia.url;
      }
    } catch (error) {
      console.warn('Export failed:', error);
    }
  };

  return (
    <div className="p-4 bg-slate-800/60 border border-white/10 rounded-xl">
      <div className="text-xs text-slate-300 mb-1">{post.platform} • {new Date(post.createdAt).toLocaleString()} • {post.style}</div>
      <div className="font-medium mb-2 text-white">{post.keyword}</div>
      <div className="text-sm whitespace-pre-wrap">{post.text}</div>
      {post.media?.length>0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {post.media.map(m => (
            <div key={m.id} className="rounded-lg overflow-hidden border border-white/10">
              {m.type==='image' ? <img src={m.url} alt={m.name} className="w-full h-24 object-cover"/> : <video src={m.url} className="w-full h-24 object-cover" muted controls/>}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 text-xs text-slate-300">❤ {engagement.likes} 💬 {engagement.comments} ↗ {engagement.shares}</div>
      <div className="mt-3 flex gap-2">
        <button onClick={handleDuplicate} className="px-3 py-1 rounded-lg border border-white/15 hover:bg-white/10 text-xs">Duplicate</button>
        <button onClick={()=>setShowAdjust(!showAdjust)} className="px-3 py-1 rounded-lg border border-white/15 hover:bg-white/10 text-xs">Adjust Engagement</button>
        {post.media?.[0]?.type === 'image' && (
          <button onClick={handleExportPNG} className="px-3 py-1 rounded-lg border border-white/15 hover:bg-white/10 text-xs">Export PNG</button>
        )}
      </div>
      {showAdjust && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Likes</label>
            <input type="number" value={engagement.likes} onChange={e=>handleEngagementChange('likes', e.target.value)} className="w-full p-2 rounded-lg bg-slate-800/60 border border-white/10 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Comments</label>
            <input type="number" value={engagement.comments} onChange={e=>handleEngagementChange('comments', e.target.value)} className="w-full p-2 rounded-lg bg-slate-800/60 border border-white/10 text-xs" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Shares</label>
            <input type="number" value={engagement.shares} onChange={e=>handleEngagementChange('shares', e.target.value)} className="w-full p-2 rounded-lg bg-slate-800/60 border border-white/10 text-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
function QuickGenerate({ settings, setRoute }){
  const [kw, setKw] = useState("");
  const handle = () => { localStorage.setItem('quick_kw', kw); setRoute('create'); };
  useEffect(()=>{ const q=localStorage.getItem('quick_kw'); if(q){ setKw(q); localStorage.removeItem('quick_kw'); } },[]);
  return (
    <div className="flex gap-3">
      <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="Enter keywords or phrase" className="flex-1 p-3 rounded-xl bg-slate-800/60 border border-white/10" />
      <button onClick={handle} className="px-4 py-3 rounded-xl text-white font-semibold" style={{background: settings.primary}}>Generate</button>
    </div>
  );
}
function SMISparkline({ posts, smi, height=180 }){
  const points = useMemo(()=>{
    const arr = posts.slice().reverse().map((p)=>{
      const val = (p.engagement.likes||0) + 2*(p.engagement.comments||0) + 3*(p.engagement.shares||0);
      return Math.max(2, Math.min(100, val));
    });
    if(arr.length===0) return [10, 12, 14, 16, 18];
    return arr;
  }, [posts]);

  return (
    <div className="w-full">
      <div className="text-sm text-slate-300 mb-2">Current SMI: <span className="font-semibold text-white">{smi}</span></div>
      <div className="w-full bg-slate-800/60 rounded-xl p-2" style={{height}}>
        <div className="flex items-end gap-1 h-full">
          {points.map((v,i)=> <div key={i} className="flex-1 bg-indigo-500/70 rounded" style={{height: `${(v/100)* (height-16)}px`}} />)}
        </div>
      </div>
    </div>
  );
}
function PreviewModal({ post, onClose, onSchedule }){
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold text-white">Post Preview</div>
          <button onClick={onClose} className="text-slate-300">✕</button>
        </div>
        <div className="p-4 border border-white/10 rounded-xl whitespace-pre-wrap bg-slate-800/60">{post.text}</div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <input type="date" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={date} onChange={e=>setDate(e.target.value)} />
          <input type="time" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/10">Close</button>
          <button onClick={()=> onSchedule(new Date(`${date}T${time||'09:00'}`))} className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700">Approve & Schedule</button>
        </div>
      </div>
    </div>
  );
}
function BulkModal({ posts, onClose, onScheduleAll }){
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-6 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-semibold text-white">Pack Generated ({posts.length})</div>
          <button onClick={onClose} className="text-slate-300">✕</button>
        </div>
        <div className="max-h-64 overflow-auto space-y-2">
          {posts.map(p=> <div key={p.id} className="p-3 border border-white/10 rounded-xl text-sm bg-slate-800/40"><span className="font-medium text-white">{p.keyword}</span> — {p.platform} • {p.style}</div>)}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <input type="date" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={date} onChange={e=>setDate(e.target.value)} />
          <input type="time" className="p-3 rounded-xl bg-slate-800/60 border border-white/10" value={time} onChange={e=>setTime(e.target.value)} />
        </div>
        <div className="mt-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/10">Close</button>
          <button onClick={()=> onScheduleAll(new Date(`${date}T${time||'09:00'}`))} className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700">Schedule All</button>
        </div>
      </div>
    </div>
  );
}
