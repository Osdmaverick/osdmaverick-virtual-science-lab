(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const status=(message,error=false)=>{$("notice-status").textContent=message;$("notice-status").dataset.state=error?"error":"success";};
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    status("Notifications are not connected yet. Configure Supabase and apply migrations 1–12.",true);return;
  }
  if(!window.supabase?.createClient){status("The sign-in library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  let user=null,notifications=[];
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  function render(){
    const unread=notifications.filter(n=>!n.read_at).length;
    $("notice-summary").replaceChildren(make("span","",String(notifications.length)+" total"),make("strong","",String(unread)+" unread"));
    const list=$("notice-list");list.replaceChildren();
    if(!notifications.length){list.append(make("p","notice-empty","You're all caught up. New class announcements will appear here."));return;}
    notifications.forEach(n=>{
      const card=make("article","notice-card"+(n.read_at?"":" unread"));
      const kind={class_announcement:"Class announcement",assignment_graded:"Assignment graded",lab_report_assessed:"Lab report assessed"}[n.source_type]||"Learning update";
      card.append(make("p","notice-meta",kind+" · "+(n.read_at?"Read":"Unread")+" · "+new Date(n.created_at).toLocaleString()));
      card.append(make("h3","",n.title),make("p","",n.message));
      const actions=make("div","notice-actions");
      const destination=n.destination||"class-announcements.html";
      const linkLabel=destination==="assignments.html"?"Open assignments":destination==="student-lab-notebook.html"?"Open lab notebook":"Open class announcements";
      const open=make("a","",linkLabel);open.href=destination;actions.append(open);
      if(!n.read_at){const button=make("button","secondary","Mark as read");button.type="button";button.addEventListener("click",()=>markRead(n));actions.append(button);}
      card.append(actions);list.append(card);
    });
  }
  async function load(){
    const {data,error}=await client.from("notifications").select("id,title,message,destination,read_at,created_at,source_type").eq("recipient_id",user.id).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;notifications=data||[];render();
  }
  async function markRead(n){
    const {error}=await client.from("notifications").update({read_at:new Date().toISOString()}).eq("id",n.id).is("read_at",null);
    if(error)return status("Could not update notification: "+error.message,true);
    status("Notification marked as read.");await load();
  }
  async function markAllRead(){
    const unread=notifications.filter(n=>!n.read_at);
    if(!unread.length)return status("There are no unread notifications.");
    const {error}=await client.from("notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",user.id).is("read_at",null);
    if(error)return status("Could not update notifications: "+error.message,true);
    status("All notifications marked as read.");await load();
  }
  async function init(){
    const {data,error}=await client.auth.getSession();if(error)throw error;
    user=data.session?.user;
    if(!user){$("notice-login").hidden=false;$("notice-workspace").hidden=true;status("Sign in to view your notifications.");return;}
    const {data:profile,error:profileError}=await client.from("profiles").select("full_name").eq("id",user.id).maybeSingle();
    if(profileError||!profile)throw new Error("Your account profile could not be loaded.");
    $("notice-account").textContent=(profile.full_name||user.email)+" · Notifications";
    $("notice-workspace").hidden=false;$("notice-login").hidden=true;
    await load();status("Your notifications are up to date.");
  }
  $("notice-read-all").addEventListener("click",()=>markAllRead().catch(e=>status(e.message,true)));
  $("notice-refresh").addEventListener("click",async()=>{const b=$("notice-refresh");b.disabled=true;try{await load();status("Notifications refreshed.");}catch(e){status(e.message,true);}finally{b.disabled=false;}});
  init().catch(e=>status(e.message||"Could not load notifications.",true));
})();