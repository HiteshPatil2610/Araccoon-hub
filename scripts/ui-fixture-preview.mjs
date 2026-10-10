// Isolated browser QA only. Never contacts a database or an external upload/tracking service.
// Run after build: node scripts/ui-fixture-preview.mjs; http://127.0.0.1:5174
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist/client');
const port = Number(process.env.PORT || 5174);
const names = ['Fixture desk object', 'Fixture keyboard accessory', 'Fixture home object with a deliberately long title for responsive checks', 'Fixture missing photo'];
const products = names.map((title,i) => ({ id:`00000000-0000-4000-8000-00000000000${i}`, title, description:'Browser QA fixture only. This is not a real product listing or a business metric.', category: i%2 ? 'Tech & Gadgets':'Desk & Office', rating:0, reviewCount:0, imageUrl:i===3?'/missing-fixture.png':'/favicon.svg', badge:null, featured:i<3, store:'amazon.in', createdAt:'2026-10-03T00:00:00Z', updatedAt:'2026-10-03T00:00:00Z', imagePublicId:null, affiliateUrl:'https://www.amazon.in/dp/B000000000', affiliateTag:null, subId:null, status:'published', sortOrder:i, linkHealthy:true }));
let mode='normal'; let saves=0;
products[2].description = [
 'Compatibility: QA fixture for a long specification value that wraps over multiple lines on a phone without escaping its container.',
 'Mounting: C-clamp or grommet with the included installation hardware.',
 'Movement: Tilt, swivel and rotation; this is synthetic layout data.',
 'Material: Steel with a deliberately long finish description to test wrapping.',
 'Cable management: Removable clips for an organised desk.',
 'Installation: Included instructions and essential tools.',
 'Dimensions: Check the original listing; these QA values are not a real specification.',
 'Warranty: Synthetic browser QA entry only.',
 'Colour: Fixture red, white and black.',
 'Included: Stand, hardware, cable clips and instructions.',
 'Care: Follow the manufacturer instructions for your actual product.',
 'Availability: Check Amazon for current availability.'
].join('\n');
const at='2026-10-03T06:00:00Z';
const owner={id:'fixture-owner',email:'fixture-owner-with-a-long-address@example.test',displayName:'QA fixture owner',needsPasskey:false};
const importPreview={provider:'amazon-page',identity:{marketplace:'amazon.in',asin:'B0CH4X2FVM',canonicalUrl:'https://www.amazon.in/dp/B0CH4X2FVM'},affiliateUrl:'https://www.amazon.in/dp/B0CH4X2FVM?tag=fixture-21',suggestions:{title:'QA single monitor arm',description:'Compatibility: 13–32 inch screens, 2–9 kg\nMounting: C-clamp or grommet\nMovement: Tilt, swivel and rotation\nMaterial: Steel',category:'Desk & Office'},details:{brand:'QA fixture',features:['Fits 13–32 inch screens weighing 2–9 kg.','Tilt from -45° to 90°, swivel ±90° and rotate 360°.'],specifications:[{name:'Mounting type',value:'C-clamp or grommet mounting with included hardware'},{name:'Material',value:'Alloy steel'}]},provenance:'product-page',sourceUrl:'https://www.amazon.in/dp/B0CH4X2FVM',warnings:['Isolated QA fixture: no Amazon page was fetched.'],duplicate:null};
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(u.pathname==='/__qa'){ mode=u.searchParams.get('mode')||'normal'; return json({mode,saves}); }
 if(u.pathname.startsWith('/api/')){
  if(u.pathname==='/api/auth/state') return json({owner:mode==='signed-out'?null:owner,setupOpen:false,turnstileSiteKey:null,devLogin:false});
  if(u.pathname==='/api/products') return mode==='catalog-failed'?json({error:'QA fixture request failure.'},503):json(mode==='empty'?[]:products.map(p=>({...p,featured:mode==='no-featured'?false:mode==='one-featured'?p.sortOrder===0:p.featured})));
  if(u.pathname==='/api/admin/products' && req.method==='GET') return json(products);
  if(u.pathname==='/api/admin/product-imports/preview') return json(importPreview);
  // No write from this QA server is ever persisted or forwarded.
  if(req.method!=='GET') { saves++; return json({error:'QA fixture write failed; values should remain.'},503); }
  if(u.pathname==='/api/admin/analytics/conversions') return mode==='conversion-failed'?json({error:'QA conversion request failure.'},503):json([]);
  if(u.pathname==='/api/admin/analytics'){
   if(mode==='analytics-failed') return json({error:'QA fixture analytics failure.'},503);
   const days=Number(u.searchParams.get('days')||30);
   return json({range:{from:'2026-09-04',to:'2026-10-03',days,timezone:'Asia/Kolkata'},retentionDays:90,generatedAt:at,totals:{clicks:12345,visitorDays:9876,conversions:123,conversionRate:1,clicksToday:42,previousPeriodClicks:10000},byDay:Array.from({length:days},(_,i)=>({date:new Date(Date.UTC(2026,9,3-days+1+i)).toISOString().slice(0,10),clicks:i%5*20,conversions:i%3})),topProducts:products.map(p=>({productId:p.id,title:p.title,imageUrl:p.imageUrl,clicks:1234,conversions:12,conversionRate:1})),breakdowns:{category:[{key:'Desk & Office',clicks:1234,percentage:100}],device:[{key:'mobile',clicks:1234,percentage:100}],referrer:[{key:'example.test/very-long-referrer-path-for-responsive-testing',clicks:1234,percentage:100}],country:[{key:'IN',clicks:1234,percentage:100}]},recentClicks:products.map((p,i)=>({id:String(i),occurredAt:at,productTitle:p.title,device:'mobile',country:'IN',referrer:'example.test',utmSource:null}))});
  }
  if(u.pathname.endsWith('/status')) return json({total:10,unused:10});
  if(u.pathname==='/api/admin/me') return json(owner);
  if(u.pathname==='/api/admin/activity') return json(products.map((p,i)=>({id:String(i),action:'product.update',result:i%2?'failure':'success',actor:owner.email,target:p.title,occurredAt:at})));
  if(u.pathname==='/api/admin/passkeys') return json([{id:'fixture-key',name:'QA laptop passkey with a long device name',backedUp:true,createdAt:at,lastUsedAt:at}]);
  if(u.pathname==='/api/admin/sessions') return json([{id:'fixture-session',userAgent:'Mozilla/5.0 (QA laptop with a long device description)',current:true,lastSeenAt:at},{id:'fixture-session-2',userAgent:'Mozilla/5.0 (QA phone)',current:false,lastSeenAt:at}]);
  if(u.pathname==='/api/admin/owners') return json([{...owner,you:true,disabled:false,passkeys:1},{id:'fixture-owner-2',email:'another-qa-owner-with-a-long-address@example.test',displayName:'Another QA owner with a deliberately long name',you:false,disabled:false,passkeys:2}]);
  return json([]);
 }
 const candidate=path.resolve(root,`.${decodeURIComponent(u.pathname)}`);
 if(!candidate.startsWith(root+path.sep) && candidate!==root) return res.writeHead(403).end();
 const file=fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(root,'index.html');
 const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.jpg':'image/jpeg'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':mime});res.end(fs.readFileSync(file));
}).listen(port,'127.0.0.1',()=>console.log(`Isolated QA fixtures: http://127.0.0.1:${port} (no database; writes fail deliberately)`));
