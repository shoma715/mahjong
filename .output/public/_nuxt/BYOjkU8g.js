import{E as P}from"./B3DUSKkZ.js";const v=()=>{const t=P();return{fetchHanchans:async(e=50)=>{const{data:r,error:n}=await t.from("hanchans").select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `).order("played_at",{ascending:!1}).limit(e);return n?(console.error("[useHanchans] fetchHanchans:",n),[]):r},fetchHanchansBySeason:async(e,r)=>{const{data:n,error:s}=await t.from("hanchans").select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `).gte("played_at",`${e}T00:00:00`).lte("played_at",`${r}T23:59:59.999`).order("played_at",{ascending:!1});return s?(console.error("[useHanchans] fetchHanchansBySeason:",s),[]):n},fetchHanchanById:async e=>{const{data:r,error:n}=await t.from("hanchans").select(`
        *,
        scores (
          *,
          user:users (*)
        )
      `).eq("id",e).maybeSingle();return n?(console.error("[useHanchans] fetchHanchanById:",n),null):r||null},saveHanchan:async(e,r)=>{const{data:n,error:s}=await t.from("hanchans").insert({played_at:new Date(`${e}T12:00:00`).toISOString()}).select().single();if(s||!n)return console.error("[useHanchans] insert hanchan:",s),null;const h=r.map(u=>({hanchan_id:n.id,user_id:u.user_id,raw_score:u.raw_score,placement:u.placement,point:u.point})),{error:o}=await t.from("scores").insert(h);return o?(console.error("[useHanchans] insert scores:",o),await t.from("hanchans").delete().eq("id",n.id),null):n},deleteHanchan:async e=>{const{error:r}=await t.from("hanchans").delete().eq("id",e);return r?(console.error("[useHanchans] deleteHanchan:",r),!1):!0},updateScores:async(e,r,n)=>{const{error:s}=await t.from("hanchans").update({played_at:new Date(`${r}T12:00:00`).toISOString()}).eq("id",e);if(s)return console.error("[useHanchans] update hanchan:",s),!1;const h=n.map(u=>({hanchan_id:e,user_id:u.user_id,raw_score:u.raw_score,placement:u.placement,point:u.point})),{error:o}=await t.from("scores").upsert(h,{onConflict:"hanchan_id,user_id"});return o?(console.error("[useHanchans] upsert scores:",o),!1):!0}}},E=()=>{const t={kaeshi:3e4,oka:20,uma:[30,10,-10,-30]};return{DEFAULT_RULES:t,calcPoints:(c,e)=>{const r=e?.rule_oka??t.oka,n=e?[e.rule_uma_1,e.rule_uma_2,e.rule_uma_3,e.rule_uma_4]:[...t.uma],s=[...c].map((a,l)=>({...a,originalIndex:l})).sort((a,l)=>(l.raw_score??0)-(a.raw_score??0)),h=new Array(4).fill(0);let o=0;for(;o<4;){let a=o;for(;a<4&&s[a].raw_score===s[o].raw_score;)a++;let l=0;for(let i=o;i<a;i++){const d=i+1,f=n[i];l+=f+(d===1?r:0)}const _=l/(a-o);for(let i=o;i<a;i++)h[i]=_;o=a}return s.map((a,l)=>{const i=((a.raw_score??0)-t.kaeshi)/1e3+h[l],d=Math.trunc(i*10)/10,f=s.filter((k,p)=>p<l&&(s[p].raw_score??0)>(a.raw_score??0)).length+1;return{user_id:a.user_id,raw_score:a.raw_score??0,placement:f,point:d}})},validateTotal:c=>c.reduce((r,n)=>r+(n.raw_score??0),0)===1e5,currentTotal:c=>c.reduce((e,r)=>e+(r.raw_score??0),0),formatPoint:c=>`${c>0?"+":""}${c.toFixed(1)}`,pointClass:c=>c>0?"point-positive":c<0?"point-negative":"point-zero"}};export{E as a,v as u};
