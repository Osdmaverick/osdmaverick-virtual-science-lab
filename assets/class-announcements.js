(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const status=(message,error=false)=>{$("announce-status").textContent=message;$("announce-status").dataset.state=error?"error":"success";};
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    status("Class announcements are not connected yet. Configure Supabase and apply migrations 1–10.",true);return;
  }
  if(!window.supabase?.createClient){status("The sign-in library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  const addButton=(parent,label,cls,action)=>{const b=make("button",cls,label);b.type="button";b.addEventListener("click",action);parent.append(b);return b;};
  let user=null,role=null,classes=[],classMap=new Map(),announcements=[],reads=[],editingId=null;
  const selected=()=>$("announce-filter").value;
  const visible=()=>announcements.filter(a=>!selected()||a.class_id===selected());
  function resetForm(){editingId=null;$("announce-form").reset();$("announce-class").disabled=false;$("announce-form-heading").textContent="Create announcement";$("announce-cancel").hidden=true;}
  function summary(){
    const rows=visible(),unread=role==="student"?rows.filter(a=>!reads.has(a.id)).length:0;
    const values=role==="teacher"?[["Announcements",rows.length],["Published",rows.filter(a=>a.status==="published").length],["Drafts",rows.filter(a=>a.status==="draft").length]]:[["Notices",rows.length],["Unread",unread],["Read",rows.length-unread]];
    $("announce-summary").replaceChildren();
    values.forEach(([label,value])=>{const card=make("article","announce-stat");card.append(make("strong","",String(value)),make("span","",label));$("announce-summary").append(card);});
  }
  async function load(){
    const ids=classes.map(c=>c.id);
    if(!ids.length){announcements=[];reads=new Set();render();return;}
    const {data,error}=await client.from("class_announcements").select("id,class_id,teacher_id,title,body,status,is_pinned,published_at,expires_at,created_at,updated_at").in("class_id",ids).order("published_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false});
    if(error)throw error;
    announcements=data||[];
    if(role==="student"){
      const result=await client.from("class_announcement_reads").select("announcement_id,read_at").eq("student_id",user.id);
      if(result.error)throw result.error;
      reads=new Map((result.data||[]).map(x=>[x.announcement_id,x.read_at]));
    }else{
      const result=await client.from("class_announcement_reads").select("announcement_id,student_id,read_at").in("class_id",ids);
      if(result.error)throw result.error;
      reads=result.data||[];
    }
    render();
  }
  function renderTeacherCard(a){
    const card=make("article","announce-card"+(a.is_pinned?" pinned":""));
    card.append(make("p","announce-meta",(classMap.get(a.class_id)?.name||"Class")+" · "+(a.status==="published"?"Published":a.status==="draft"?"Draft":"Archived")));
    card.append(make("h3","",a.title),make("p","",a.body));
    if(a.is_pinned)card.append(make("span","announce-tag","Pinned"));
    if(a.published_at)card.append(make("p","announce-meta","Published "+new Date(a.published_at).toLocaleString()));
    if(a.expires_at)card.append(make("p","announce-meta","Expires "+new Date(a.expires_at).toLocaleDateString()));
    const receiptRows=reads.filter(x=>x.announcement_id===a.id);
    const enrolledCount=classMap.get(a.class_id)?.student_count;
    card.append(make("p","announce-meta",receiptRows.length+" student read receipt(s)"+(enrolledCount===undefined?"":" · "+enrolledCount+" students in class")));
    const actions=make("div","announce-actions");
    addButton(actions,"Edit","secondary",()=>edit(a));
    if(a.status==="draft")addButton(actions,"Publish","",()=>changeStatus(a,"published"));
    if(a.status==="published")addButton(actions,"Unpublish","secondary",()=>changeStatus(a,"draft"));
    if(a.status!=="archived")addButton(actions,"Archive","secondary",()=>changeStatus(a,"archived"));
    addButton(actions,"Delete","danger",()=>remove(a));
    card.append(actions);return card;
  }
  function renderStudentCard(a){
    const card=make("article","announce-card"+(a.is_pinned?" pinned":""));
    const readAt=reads.get(a.id);
    card.append(make("p","announce-meta",(classMap.get(a.class_id)?.name||"Class")+" · "+(readAt?"Read":"Unread")));
    if(a.is_pinned)card.append(make("span","announce-tag","Pinned"));
    card.append(make("h3","",a.title),make("p","","Posted "+(a.published_at?new Date(a.published_at).toLocaleDateString():"")));
    card.append(make("p","",a.body));
    if(!readAt){const actions=make("div","announce-actions");addButton(actions,"Mark as read","",()=>markRead(a));card.append(actions);}
    else card.append(make("p","announce-meta","Read on "+new Date(readAt).toLocaleString()));
    return card;
  }
  function render(){
    summary();const list=$("announce-list");list.replaceChildren();
    const rows=visible().sort((a,b)=>Number(b.is_pinned)-Number(a.is_pinned)||new Date(b.published_at||b.created_at)-new Date(a.published_at||a.created_at));
    if(!rows.length){list.append(make("p","announce-empty",role==="teacher"?"No announcements yet. Create a notice for one of your classes.":"There are no current announcements for this class. Your teacher's updates will appear here."));return;}
    rows.forEach(a=>list.append(role==="teacher"?renderTeacherCard(a):renderStudentCard(a)));
  }
  function edit(a){
    editingId=a.id;$("announce-class").value=a.class_id;$("announce-class").disabled=true;
    $("announce-title").value=a.title;$("announce-body").value=a.body;$("announce-pinned").checked=a.is_pinned;
    $("announce-expiry").value=a.expires_at?new Date(a.expires_at).toISOString().slice(0,10):"";
    $("announce-form-heading").textContent="Edit announcement";$("announce-cancel").hidden=false;
    $("announce-form-heading").scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function changeStatus(a,next){
    const updates={status:next,published_at:next==="published"?(a.published_at||new Date().toISOString()):null};
    const {error}=await client.from("class_announcements").update(updates).eq("id",a.id);
    if(error)return status("Announcement could not be updated: "+error.message,true);
    status(next==="published"?"Announcement published.":next==="archived"?"Announcement archived.":"Announcement returned to drafts.");await load();
  }
  async function remove(a){
    if(!window.confirm("Delete this announcement? This also removes its read receipts."))return;
    const {error}=await client.from("class_announcements").delete().eq("id",a.id);
    if(error)return status("Announcement could not be deleted: "+error.message,true);
    status("Announcement deleted.");await load();
  }
  async function markRead(a){
    const {error}=await client.from("class_announcement_reads").upsert({announcement_id:a.id,class_id:a.class_id,student_id:user.id,read_at:new Date().toISOString()},{onConflict:"announcement_id,student_id"});
    if(error)return status("Read receipt could not be saved: "+error.message,true);
    status("Announcement marked as read.");await load();
  }
  $("announce-form").addEventListener("submit",async e=>{
    e.preventDefault();const intent=e.submitter?.value==="published"?"published":"draft";
    const expiry=$("announce-expiry").value;
    const payload={class_id:$("announce-class").value,teacher_id:user.id,title:$("announce-title").value.trim(),body:$("announce-body").value.trim(),is_pinned:$("announce-pinned").checked,status:intent,published_at:intent==="published"?new Date().toISOString():null,expires_at:expiry?new Date(expiry+"T23:59:59").toISOString():null};
    const buttons=[$("announce-save-draft"),$("announce-publish")];buttons.forEach(b=>b.disabled=true);
    try{
      if(payload.expires_at&&payload.published_at&&new Date(payload.expires_at)<=new Date(payload.published_at))throw new Error("Choose an expiry date after today.");
      let result;
      if(editingId){const {class_id,teacher_id,...updates}=payload;result=await client.from("class_announcements").update(updates).eq("id",editingId);}
      else result=await client.from("class_announcements").insert(payload);
      if(result.error)throw result.error;
      resetForm();status(intent==="published"?"Announcement published to the selected class.":"Announcement saved as a draft.");await load();
    }catch(err){status(err.message||"Announcement could not be saved.",true);}
    finally{buttons.forEach(b=>b.disabled=false);}
  });
  $("announce-cancel").addEventListener("click",resetForm);
  $("announce-filter").addEventListener("change",render);
  $("announce-refresh").addEventListener("click",async()=>{const b=$("announce-refresh");b.disabled=true;try{await load();status("Announcements refreshed.");}catch(e){status(e.message,true);}finally{b.disabled=false;}});
  async function init(){
    const {data:session,error}=await client.auth.getSession();if(error)throw error;
    user=session.session?.user;
    if(!user){$("announce-login").hidden=false;$("announce-workspace").hidden=true;status("Sign in to see your class announcements.");return;}
    const {data:profile,error:profileError}=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(profileError||!profile)throw new Error("Your account profile could not be loaded.");
    role=profile.role;if(role!=="teacher"&&role!=="student")throw new Error("This account role cannot access class announcements.");
    $("announce-account").textContent=(profile.full_name||user.email)+" · "+(role==="teacher"?"Teacher":"Student");
    $("announce-create-panel").hidden=role!=="teacher";$("announce-list-heading").textContent=role==="teacher"?"Manage class announcements":"Class notices";
    const classQuery=client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
    const {data:classRows,error:classError}=role==="teacher"?await classQuery.eq("teacher_id",user.id):await classQuery;
    if(classError)throw classError;classes=classRows||[];classMap=new Map(classes.map(c=>[c.id,c]));
    const classSelect=$("announce-class");classSelect.replaceChildren(new Option("Choose a class",""));classes.forEach(c=>classSelect.add(new Option(c.name,c.id)));
    const filter=$("announce-filter");filter.replaceChildren(new Option("All classes",""));classes.forEach(c=>filter.add(new Option(c.name,c.id)));
    $("announce-workspace").hidden=false;$("announce-login").hidden=true;
    await load();status(role==="teacher"?"Manage notices and review student read receipts.":"Your class announcements are ready.");
  }
  init().catch(e=>status(e.message||"Could not load announcements.",true));
})();
