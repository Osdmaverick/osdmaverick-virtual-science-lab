(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const setStatus=(message,error=false)=>{$("calendar-status").textContent=message;$("calendar-status").dataset.state=error?"error":"success";};
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    setStatus("Class calendar is not connected yet. Configure Supabase and apply migrations 1–13.",true);return;
  }
  if(!window.supabase?.createClient){setStatus("The sign-in library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  const addButton=(parent,label,cls,action)=>{const b=make("button",cls,label);b.type="button";b.addEventListener("click",action);parent.append(b);return b;};
  const types={lesson:"Lesson",practical:"Practical activity",assessment:"Assessment",meeting:"Meeting",other:"Other"};
  let user=null,role=null,classes=[],classMap=new Map(),events=[],deadlines=[],editingId=null;
  const monthValue=()=> $("calendar-month").value;
  const selectedClass=()=> $("calendar-filter").value;
  const inSelectedMonth=value=>{if(!monthValue())return true;const d=new Date(value);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")===monthValue();};
  const rows=()=>[
    ...events.filter(e=>(!selectedClass()||e.class_id===selectedClass())&&inSelectedMonth(e.starts_at)).map(e=>({...e,kind:"event",sortDate:e.starts_at})),
    ...deadlines.filter(a=>(!selectedClass()||a.class_id===selectedClass())&&inSelectedMonth(a.due_at)).map(a=>({...a,kind:"deadline",sortDate:a.due_at}))
  ].sort((a,b)=>new Date(a.sortDate)-new Date(b.sortDate));
  const dateLabel=value=>new Date(value).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
  const localInputValue=value=>{const d=new Date(value);const pad=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());};
  function resetForm(){editingId=null;$("calendar-form").reset();$("calendar-class").disabled=false;$("calendar-form-heading").textContent="Add class event";$("calendar-cancel").hidden=true;}
  function summary(){
    const list=rows(),now=Date.now();
    const values=[["Items this month",list.length],["Upcoming",list.filter(x=>new Date(x.sortDate).getTime()>=now).length],["Assignment deadlines",list.filter(x=>x.kind==="deadline").length]];
    $("calendar-summary").replaceChildren();
    values.forEach(([label,value])=>{const card=make("article","calendar-stat");card.append(make("strong","",String(value)),make("span","",label));$("calendar-summary").append(card);});
  }
  async function load(){
    const ids=classes.map(c=>c.id);
    if(!ids.length){events=[];deadlines=[];render();return;}
    const eventResult=await client.from("class_events").select("id,class_id,teacher_id,title,description,event_type,starts_at,ends_at,all_day,created_at").in("class_id",ids).order("starts_at",{ascending:true});
    if(eventResult.error)throw eventResult.error;
    events=eventResult.data||[];
    const assignmentResult=await client.from("assignments").select("id,class_id,title,due_at,status,points_possible").in("class_id",ids).not("due_at","is",null).order("due_at",{ascending:true});
    if(assignmentResult.error)throw assignmentResult.error;
    deadlines=assignmentResult.data||[];
    render();
  }
  function renderCard(item){
    const card=make("article","calendar-event");
    const when=make("div","calendar-date");
    when.append(make("div","",new Date(item.sortDate).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})));
    when.append(make("div","calendar-meta",item.kind==="deadline"?"Assignment deadline":item.all_day?"All day":dateLabel(item.sortDate)));
    const body=make("div","");
    const className=classMap.get(item.class_id)?.name||"Class";
    body.append(make("span","calendar-tag",item.kind==="deadline"?"Assignment":types[item.event_type]||"Class event"));
    body.append(make("h3","",item.title));
    body.append(make("p","calendar-meta",className+(item.kind==="deadline"?" · Due "+dateLabel(item.due_at):"")));
    if(item.description)body.append(make("p","",item.description));
    if(item.kind==="deadline"){
      const link=make("a","","Open assignment →");link.href="assignments.html";body.append(link);
    }else if(role==="teacher"){
      const actions=make("div","calendar-actions");
      addButton(actions,"Edit","secondary",()=>edit(item));
      addButton(actions,"Delete","danger",()=>remove(item));
      body.append(actions);
    }
    card.append(when,body);return card;
  }
  function render(){
    summary();const root=$("calendar-list");root.replaceChildren();const list=rows();
    if(!list.length){root.append(make("p","calendar-empty","No class events or assignment deadlines in this month. Choose another month or check back later."));return;}
    list.forEach(item=>root.append(renderCard(item)));
  }
  function edit(item){
    editingId=item.id;$("calendar-class").value=item.class_id;$("calendar-class").disabled=true;
    $("calendar-title").value=item.title;$("calendar-description").value=item.description||"";
    $("calendar-type").value=item.event_type;$("calendar-start").value=localInputValue(item.starts_at);
    $("calendar-end").value=item.ends_at?localInputValue(item.ends_at):"";
    $("calendar-all-day").checked=Boolean(item.all_day);
    $("calendar-form-heading").textContent="Edit class event";$("calendar-cancel").hidden=false;
    $("calendar-form-heading").scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function remove(item){
    if(!window.confirm("Delete this class calendar event?"))return;
    const {error}=await client.from("class_events").delete().eq("id",item.id);
    if(error)return setStatus("Event could not be deleted: "+error.message,true);
    setStatus("Class event deleted.");await load();
  }
  $("calendar-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const start=new Date($("calendar-start").value),endValue=$("calendar-end").value,end=endValue?new Date(endValue):null;
    if(!Number.isFinite(start.getTime()))return setStatus("Choose a valid start date and time.",true);
    if(end&&(!Number.isFinite(end.getTime())||end<=start))return setStatus("The end time must be later than the start time.",true);
    const payload={class_id:$("calendar-class").value,teacher_id:user.id,title:$("calendar-title").value.trim(),description:$("calendar-description").value.trim(),event_type:$("calendar-type").value,starts_at:start.toISOString(),ends_at:end?end.toISOString():null,all_day:$("calendar-all-day").checked};
    $("calendar-save").disabled=true;
    try{
      const wasEditing=Boolean(editingId);
      let result;
      if(wasEditing){const {class_id,teacher_id,...updates}=payload;result=await client.from("class_events").update(updates).eq("id",editingId);}
      else result=await client.from("class_events").insert(payload);
      if(result.error)throw result.error;
      resetForm();setStatus(wasEditing?"Class event updated.":"Class event added.");await load();
    }catch(err){setStatus(err.message||"Event could not be saved.",true);}
    finally{$("calendar-save").disabled=false;}
  });
  $("calendar-cancel").addEventListener("click",resetForm);
  $("calendar-filter").addEventListener("change",render);$("calendar-month").addEventListener("change",render);
  $("calendar-refresh").addEventListener("click",async()=>{const b=$("calendar-refresh");b.disabled=true;try{await load();setStatus("Class calendar refreshed.");}catch(e){setStatus(e.message,true);}finally{b.disabled=false;}});
  async function init(){
    const {data:session,error}=await client.auth.getSession();if(error)throw error;user=session.session?.user;
    if(!user){$("calendar-login").hidden=false;setStatus("Sign in to view your class calendar.");return;}
    const {data:profile,error:profileError}=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(profileError||!profile)throw new Error("Your account profile could not be loaded.");
    role=profile.role;if(!["teacher","student"].includes(role))throw new Error("This account role cannot access the class calendar.");
    $("calendar-account").textContent=(profile.full_name||user.email)+" · "+(role==="teacher"?"Teacher":"Student");
    $("calendar-create-panel").hidden=role!=="teacher";$("calendar-list-heading").textContent=role==="teacher"?"Manage class events and deadlines":"Your class schedule";
    const classQuery=client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
    const {data:classRows,error:classError}=role==="teacher"?await classQuery.eq("teacher_id",user.id):await classQuery;
    if(classError)throw classError;classes=classRows||[];classMap=new Map(classes.map(c=>[c.id,c]));
    const options=(select,first)=>{select.replaceChildren(new Option(first,""));classes.forEach(c=>select.add(new Option(c.name,c.id)));};
    options($("calendar-class"),"Choose a class");options($("calendar-filter"),"All classes");
    const now=new Date();$("calendar-month").value=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
    $("calendar-workspace").hidden=false;$("calendar-login").hidden=true;
    await load();setStatus(role==="teacher"?"Add and manage events for your classes.":"Your class events and assignment deadlines are ready.");
  }
  init().catch(e=>setStatus(e.message||"Could not load the class calendar.",true));
})();
