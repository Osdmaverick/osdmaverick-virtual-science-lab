(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = (message,error=false) => { $("learn-status").textContent=message; $("learn-status").dataset.state=error?"error":"success"; };
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    status("My learning is not connected yet. Configure Supabase and apply migrations 1–8.",true);
    return;
  }
  if(!window.supabase?.createClient){status("The sign-in library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  const lines=value=>Array.isArray(value)?value:[];
  let user=null,classes=[],content=[],progress=new Map(),openedId=null;
  const typeName=t=>({lesson:"Lesson",practical:"Practical activity",resource:"Learning resource"}[t]||t);
  const selected=()=> $("learn-class-filter").value;
  function visibleContent(){return content.filter(item=>!selected()||item.class_id===selected());}
  function renderSummary(){
    const rows=visibleContent(),completed=rows.filter(x=>progress.get(x.id)?.status==="completed").length;
    const started=rows.filter(x=>progress.has(x.id)).length;
    const percent=rows.length?Math.round(completed/rows.length*100):0;
    $("learn-summary").replaceChildren();
    [["Published items",rows.length,"Available in selected classes"],["In progress",Math.max(0,started-completed),"Started but not completed"],["Completed",completed,percent+"% completion"]].forEach(([label,value,detail])=>{
      const card=make("article","learn-stat");card.append(make("span","",label),make("strong","",String(value)),make("small","",detail));$("learn-summary").append(card);
    });
  }
  function addList(parent,title,values){
    if(!values.length)return;
    parent.append(make("h4","",title));
    const ul=make("ul");values.forEach(v=>ul.append(make("li","",v)));parent.append(ul);
  }
  async function saveProgress(item,state){
    const completed=state==="completed";
    const payload={class_id:item.class_id,content_item_id:item.id,student_id:user.id,status:state,completed_at:completed?new Date().toISOString():null};
    const {data,error}=await client.from("student_content_progress").upsert(payload,{onConflict:"student_id,content_item_id"}).select("id,class_id,content_item_id,status,started_at,completed_at,updated_at").single();
    if(error){status("Progress could not be saved: "+error.message,true);return false;}
    progress.set(item.id,data);status(completed?"Lesson marked as completed.":"Learning activity saved as in progress.");
    render();return true;
  }
  function openItem(item,detail){
    const existing=detail.querySelector(".learn-detail");
    if(existing){existing.remove();openedId=null;return;}
    detail.querySelectorAll(".learn-detail").forEach(x=>x.remove());
    openedId=item.id;
    const panel=make("section","learn-detail");
    if(item.summary)panel.append(make("p","",item.summary));
    if(item.content_body)panel.append(make("h4","","Study notes"),make("p","",item.content_body));
    addList(panel,"Learning objectives",lines(item.objectives));
    addList(panel,"Materials",lines(item.materials));
    addList(panel,"Procedure",lines(item.procedure_steps));
    if(item.safety_notes)panel.append(make("h4","","Safety notes"),make("p","",item.safety_notes));
    if(item.resource_url){const link=make("a","","Open learning resource");link.href=item.resource_url;link.target="_blank";link.rel="noopener noreferrer";panel.append(link);}
    const actions=make("div","learn-actions");
    const state=progress.get(item.id)?.status;
    if(state==="completed") {
      actions.append(make("p","learn-meta","Completed "+new Date(progress.get(item.id).completed_at).toLocaleDateString()));
      const undo=make("button","secondary","Mark as in progress");undo.addEventListener("click",()=>saveProgress(item,"in_progress"));actions.append(undo);
    } else {
      const complete=make("button","","Mark as complete");complete.addEventListener("click",()=>saveProgress(item,"completed"));actions.append(complete);
      if(state!=="in_progress"){const start=make("button","secondary","Save as in progress");start.addEventListener("click",()=>saveProgress(item,"in_progress"));actions.append(start);}
    }
    panel.append(actions);detail.append(panel);
    if(!state)saveProgress(item,"in_progress");
  }
  function render(){
    renderSummary();
    const library=$("learn-library");library.replaceChildren();
    const rows=visibleContent();
    if(!rows.length){library.append(make("p","learn-empty",classes.length?"No published learning content in this class yet. Your teacher's new lessons will appear here.":"Join a class to access your teacher's published science lessons and activities."));return;}
    rows.forEach(item=>{
      const card=make("article","learn-card");
      const className=classes.find(c=>c.id===item.class_id)?.name||"Class";
      card.append(make("p","learn-meta",className+" · Grade "+item.grade_level+" · "+item.subject));
      card.append(make("span","learn-tag",typeName(item.content_type)));
      card.append(make("h3","",item.title),make("p","learn-meta",item.topic));
      if(item.summary)card.append(make("p","",item.summary));
      const state=progress.get(item.id)?.status||"not_started";
      card.append(make("p","learn-meta",state==="completed"?"Completed":state==="in_progress"?"In progress":"Not started"));
      const bar=make("div","learn-progress"),fill=make("span");fill.style.width=state==="completed"?"100%":state==="in_progress"?"35%":"0%";bar.append(fill);card.append(bar);
      const toggle=make("button","secondary",openedId===item.id?"Close activity":"Open activity");
      toggle.addEventListener("click",()=>{openItem(item,card);openedId=card.querySelector(".learn-detail")?item.id:null;toggle.textContent=openedId===item.id?"Close activity":"Open activity";});
      card.append(toggle);
      if(openedId===item.id){openedId=null;openItem(item,card);openedId=item.id;toggle.textContent="Close activity";}
      library.append(card);
    });
  }
  async function load(){
    const {data:session,error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    user=session.session?.user;
    if(!user){$("learn-login").hidden=false;$("learn-workspace").hidden=true;status("Sign in to see your class learning.");return;}
    const {data:profile,error:profileError}=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(profileError||!profile)throw new Error("Your account profile could not be loaded.");
    if(profile.role!=="student"){throw new Error("This learning area is for student accounts. Teachers can manage content in the content studio.");}
    const [classResult,contentResult,progressResult]=await Promise.all([
      client.from("classes").select("id,name").order("created_at",{ascending:false}),
      client.from("teacher_content_items").select("id,class_id,content_type,title,grade_level,subject,topic,summary,content_body,objectives,materials,procedure_steps,safety_notes,resource_url,published_at").eq("status","published").in("content_type",["lesson","practical","resource"]).order("published_at",{ascending:false}),
      client.from("student_content_progress").select("id,class_id,content_item_id,status,started_at,completed_at,updated_at").eq("student_id",user.id)
    ]);
    if(classResult.error)throw classResult.error;if(contentResult.error)throw contentResult.error;if(progressResult.error)throw progressResult.error;
    classes=classResult.data||[];content=contentResult.data||[];progress=new Map((progressResult.data||[]).map(x=>[x.content_item_id,x]));
    const filter=$("learn-class-filter");filter.replaceChildren(new Option("All my classes",""));classes.forEach(c=>filter.add(new Option(c.name,c.id)));
    $("learn-workspace").hidden=false;$("learn-login").hidden=true;
    filter.addEventListener("change",()=>{openedId=null;render();});
    render();status("Your published class learning content is ready.");
  }
  $("learn-refresh").addEventListener("click",async()=>{const b=$("learn-refresh");b.disabled=true;try{await load();}catch(e){status(e.message||"Could not refresh learning.",true);}finally{b.disabled=false;}});
  load().catch(e=>status(e.message||"Could not load learning content.",true));
})();
