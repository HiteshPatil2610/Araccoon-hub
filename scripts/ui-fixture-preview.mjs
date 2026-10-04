// Isolated browser QA only. Never contacts a database or an external upload/tracking service.
// Run after build: node scripts/ui-fixture-preview.mjs; http://127.0.0.1:5174
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const names = ['Fixture desk object', 'Fixture keyboard accessory', 'Fixture home object with a deliberately long title for responsive checks', 'Fixture missing photo'];
const products = names.map((title,i) => ({ id:`00000000-0000-4000-8000-00000000000${i}`, title, description:'Browser QA fixture only. This is not a real product listing or a business metric.', category: i%2 ? 'Tech & Gadgets':'Desk & Office', rating:0, reviewCount:0, imageUrl:i===3?'/missing-fixture.png':'/favicon.svg', badge:null, featured:i<3, store:'amazon.in', createdAt:'2026-10-03T00:00:00Z', updatedAt:'2026-10-03T00:00:00Z', imagePublicId:null, affiliateUrl:'https://www.amazon.in/dp/B000000000', affiliateTag:null, subId:null, status:'published', sortOrder:i, linkHealthy:true }));
let mode='normal'; let saves=0;
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(u.pathname==='/__qa'){ mode=u.searchParams.get('mode')||'normal'; return json({mode,saves}); }
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/auth/state') return json({owner:mode==='signed-out'?null:{id:'fixture-owner',email:'fixture@example.test',displayName:'QA fixture owner',needsPasskey:false},setupOpen:false,turnstileSiteKey:null,devLogin:false});
  if(u.pathname==='/api/products') return mode==='catalog-failed'?json({error:'QA fixture request failure.'},503):json(mode==='empty'?[]:products.map(p=>({...p,featured:mode==='no-featured'?false:mode==='one-featured'?p.sortOrder===0:p.featured})));
  if(u.pathname==='/api/admin/products' && req.method==='GET') return json(products);
  if(u.pathname.startsWith('/api/admin/products') && req.method!=='GET'){ saves++; return json({error:'QA fixture save failed; values should remain.'},503); }
  if(u.pathname==='/api/admin/analytics/conversions') return mode==='conversion-failed'?json({error:'QA conversion request failure.'},503):json([]);
  if(u.pathname==='/api/admin/analytics'){
   if(mode==='analytics-failed') return json({error:'QA fixture analytics failure.'},503);
   const days=Number(u.searchParams.get('days')||30);
   return json({range:{from:'2026-09-04',to:'2026-10-03',days,timezone:'Asia/Kolkata'},retentionDays:90,generatedAt:'2026-10-03T06:00:00Z',totals:{clicks:0,visitorDays:0,conversions:0,conversionRate:0,clicksToday:0,previousPeriodClicks:0},byDay:Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,9,3-days+1+i)).toISOString().slice(0,10),clicks:0,conversions:0})),topProducts:[],breakdowns:{category:[],device:[],referrer:[],country:[]},recentClicks:[]});
  }
  if(u.pathname.endsWith('/status')) return json({total:10,unused:10});
  if(u.pathname==='/api/admin/me') return json({id:'fixture-owner',email:'fixture@example.test',displayName:'QA fixture owner',needsPasskey:false});
  if(u.pathname==='/api/auth/recover') return json({error:'QA fixture recovery failed.'},400);
  return json([]);
 }
 const candidate=path.resolve(root,`.${decodeURIComponent(u.pathname)}`);
 if(!candidate.startsWith(root+path.sep) && candidate!==root) return res.writeHead(403).end();
 const file=fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(root,'index.html');
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime});res.end(fs.readFileSync(file));
}).listen(5174,'127.0.0.1',()=>console.log('Isolated QA fixtures: http://127.0.0.1:5174 (no database; writes fail deliberately)'));
