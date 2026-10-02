const ORIGIN='https://vanku0613-cpu.github.io';
const ID=/^[a-f0-9-]{36}$/i;
function database(env){if(!env.DB)throw new Error('Presence database unavailable');return env.DB;}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/health')return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const headers={'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
  if(request.headers.get('Origin')!==ORIGIN)return reply(403,{error:'Origin forbidden'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try{
   const db=database(env),now=Date.now();
   if(url.pathname==='/online'&&request.method==='GET'){
    const row=await db.prepare('SELECT COUNT(DISTINCT visitor) AS online FROM presence WHERE expires > ?').bind(now).first();return reply(200,{online:row.online});
   }
   if(request.method!=='POST'||!['/heartbeat','/leave'].includes(url.pathname))return reply(404,{error:'Not found'});
   if(Number(request.headers.get('Content-Length'))>2048)return reply(413,{error:'Request too large'});
   const text=await request.text();if(text.length>2048)return reply(413,{error:'Request too large'});
   let body;try{body=JSON.parse(text);}catch(_){return reply(400,{error:'Invalid JSON'});}
   if(!ID.test(body.visitor||'')||!ID.test(body.session||''))return reply(400,{error:'Invalid session'});
   if(url.pathname==='/leave'){
    await db.prepare('UPDATE presence SET expires = MIN(expires, ?) WHERE session = ? AND visitor = ?').bind(now+3000,body.session,body.visitor).run();return reply(200,{ok:true});
   }
   await db.batch([
    db.prepare('DELETE FROM presence WHERE expires <= ?').bind(now),
    db.prepare('INSERT INTO presence (session, visitor, expires) VALUES (?, ?, ?) ON CONFLICT(session) DO UPDATE SET expires = excluded.expires WHERE presence.visitor = excluded.visitor').bind(body.session,body.visitor,now+25000)
   ]);
   return reply(200,{ok:true});
  }catch(error){console.error('Presence request failed',error.message);return reply(503,{error:'Presence unavailable'});}
 }
};
