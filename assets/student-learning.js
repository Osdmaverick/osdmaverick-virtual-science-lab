(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = $("learning-status");
  const setStatus = (message,error=false) => { status.textContent=message; status.dataset.state=error?"error":"success"; };
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    setStatus("Student learning is not connected yet. Configure Supabase and apply migrations 1–8.",true);
    return;
  }
  if(!window.supabase?.createClient){setStatus("The account library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,className,value)=>{const node=document.createElement(tag);if(className)node.className=className;if(value!==undefined)node.textContent=value;return node;};
  const labels={lesson:"Lesson",practical:"Practical activity",resource:"Learning resource"};
  let user=null,classes=[],items=[],progress=new Map(),activeItem=null;
  const lineList=(parent,heading,values,ordered=false)=>{
    if(!values?.length)return;
    parent.append(make("h3","",heading));
    const list=make(ordered?"ol":"ul");
    values.forEach(value=>list.append(make("li","",value)));
    parent.append(list);
  };
  function updateStats(){
    const completed=items.filter(item=>progress.get(item.id)?.status==="completed").length;
    $("learning-total").textContent=String(items.length);
    $("learning-completed").textContent=String(completed);
    $("learning-remaining").textContent=String(items.length-completed);
  }
  function renderList(){
    const root=$("learning-list");root.replaceChildren();
    const term=$("learning-search").value.trim().toLowerCase();
    const classId=$("learning-class-filter").value;
    const type=$("learning-type-filter").value;
    const filtered=items.filter(item=>(!classId||item.class_id===classId)&&(!type||item.content_type===type)&&(!term||(item.title+" "+item.topic+" "+item.summary).toLowerCase().includes(term)));
    if(!filtered.length){root.append(make("p","learning-empty","No matching published content. Try another filter or check back when your teacher publishes new material."));return;}
    filtered.forEach(item=>{
      const card=make("article","learning-card");
      const state=progress.get(item.id);
      const complete=state?.status==="completed";
      card.append(make("span","learning-tag",labels[item.content_type]+(complete?" · Completed":state?" · In progress":" · Not started")));
      card.append(make("h3","",item.title));
      card.append(make("p","learning-meta",(classes.find(c=>c.id===item.class_id)?.name||"Class")+" · Grade "+item.grade_level+" · "+item.subject));
      card.append(make("p","learning-meta",item.topic));
      if(item.summary)card.append(make("p","",item.summary));
      const bar=make("div","learning-progress");bar.setAttribute("role","progressbar");bar.setAttribute("aria-label",item.title+" completion");bar.setAttribute("aria-valuemin","0");bar.setAttribute("aria-valuemax","1");bar.setAttribute("aria-valuenow",complete?"1":"0");
      const fill=make("span");fill.style.width=complete?"100%":"0%";bar.append(fill);card.append(bar);
      const open=make("button","",complete?"Review content":"Open learning item");open.type="button";open.addEventListener("click",()=>openItem(item));card.append(open);
      root.append(card);
    });
  }
  function showDetailSection(id,heading,values,ordered=false){const target=$(id);target.replaceChildren();lineList(target,heading,values,ordered);target.hidden=!values?.length;}
  async function recordProgress(item,complete=false){
    const existing=progress.get(item.id);
    const now=new Date().toISOString();
    if(existing){
      const updates=complete?{status:"completed",completed_at:now}:{status:existing.status==="completed"?"completed":"in_progress",completed_at:existing.completed_at};
      const {data,error}=await client.from("student_content_progress").update(updates).eq("content_item_id",item.id).select("content_item_id,status,started_at,completed_at").maybeSingle();
      if(error)throw error;
      if(data)progress.set(item.id,data);
    }else{
      const payload={content_item_id:item.id,class_id:item.class_id,student_id:user.id,status:complete?"completed":"in_progress",started_at:now,completed_at:complete?now:null};
      const {data,error}=await client.from("student_content_progress").insert(payload).select("content_item_id,status,started_at,completed_at").single();
      if(error)throw error;
      progress.set(item.id,data);
    }
    updateStats();renderList();
  }
  async function openItem(item){
    activeItem=item;
    $("learning-detail").classList.add("active");
    $("detail-type").textContent=labels[item.content_type];
    $("detail-title").textContent=item.title;
    $("detail-meta").textContent=(classes.find(c=>c.id===item.class_id)?.name||"Class")+" · Grade "+item.grade_level+" · "+item.subject+" · "+item.topic;
    $("detail-summary").textContent=item.summary||"";
    showDetailSection("detail-objectives","Learning objectives",item.objectives);
    const body=$("detail-body");body.replaceChildren();
    if(item.content_body){body.append(make("h3","","Learning material"),make("p","learning-body",item.content_body));}
    body.hidden=!item.content_body;
    showDetailSection("detail-materials","Materials",item.materials);
    showDetailSection("detail-procedure","Practical procedure",item.procedure_steps,true);
    const safety=$("detail-safety");safety.replaceChildren();
    if(item.safety_notes)safety.append(make("h3","","Safety notes"),make("p","learning-body",item.safety_notes));
    safety.hidden=!item.safety_notes;
    const resource=$("detail-resource");resource.replaceChildren();
    if(item.resource_url){resource.append(make("h3","","Learning resource"));const link=make("a","","Open resource in a new tab");link.href=item.resource_url;link.target="_blank";link.rel="noopener noreferrer";resource.append(link);}
    resource.hidden=!item.resource_url;
    $("learning-complete").textContent=progress.get(item.id)?.status==="completed"?"Completed ✓":"Mark as completed";
    $("learning-complete").disabled=progress.get(item.id)?.status==="completed";
    $("learning-list").parentElement.hidden=true;
    $("learning-detail").scrollIntoView({behavior:"smooth",block:"start"});
    try{if(progress.get(item.id)?.status!=="completed"){await recordProgress(item,false);setStatus("Learning item opened. Your progress has been saved.");}}
    catch(error){setStatus("Content opened, but progress could not be saved: "+error.message,true);}
  }
  function closeDetail(){
    activeItem=null;$("learning-detail").classList.remove("active");$("learning-list").parentElement.hidden=false;renderList();
  }
  async function initialise(){
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError)return setStatus(sessionError.message,true);
    user=sessionData.session?.user||null;
    if(!user){$("learning-login").hidden=false;return setStatus("Sign in with a student account to access your learning space.");}
    const {data:profile,error:profileError}=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(errorOrMissing(profileError,profile))return;
    $("learning-account").textContent=(profile.full_name||user.email)+" · "+profile.role;
    if(profile.role!=="student"){$("learning-teacher").hidden=false;return setStatus("Teacher account detected. Use the content studio to manage class learning materials.");}
    $("learning-workspace").hidden=false;
    const {data:classData,error:classError}=await client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
    if(classError)return setStatus("Your classes could not be loaded: "+classError.message,true);
    classes=classData||[];
    const filter=$("learning-class-filter");classes.forEach(c=>filter.add(new Option(c.name,c.id)));
    if(!classes.length){$("learning-list").replaceChildren(make("p","learning-empty","You have not joined a class yet. Join a class using the invite code from your teacher."));return setStatus("Join a class to see published learning content.");}
    const ids=classes.map(c=>c.id);
    const [contentResult,progressResult]=await Promise.all([
      client.from("teacher_content_items").select("id,class_id,content_type,title,grade_level,subject,topic,summary,content_body,objectives,materials,procedure_steps,safety_notes,resource_url,status,published_at").in("class_id",ids).eq("status","published").in("content_type",["lesson","practical","resource"]).order("published_at",{ascending:false}),
      client.from("student_content_progress").select("content_item_id,status,started_at,completed_at").eq("student_id",user.id)
    ]);
    if(contentResult.error)return setStatus("Published content could not be loaded: "+contentResult.error.message,true);
    if(progressResult.error)return setStatus("Learning progress could not be loaded: "+progressResult.error.message,true);
    items=contentResult.data||[];progress=new Map((progressResult.data||[]).map(p=>[p.content_item_id,p]));
    updateStats();renderList();setStatus("Your published class learning content is ready.");
  }
  function errorOrMissing(error,profile){if(error||!profile){setStatus("Your account profile is unavailable. Apply the Phase 1 profiles migration and sign in again.",true);return true;}return false;}
  $("learning-search").addEventListener("input",renderList);
  $("learning-class-filter").addEventListener("change",renderList);
  $("learning-type-filter").addEventListener("change",renderList);
  $("learning-back").addEventListener("click",closeDetail);
  $("learning-next").addEventListener("click",closeDetail);
  $("learning-complete").addEventListener("click",async()=>{
    if(!activeItem)return;
    const button=$("learning-complete");button.disabled=true;
    try{await recordProgress(activeItem,true);button.textContent="Completed ✓";setStatus("Nice work — this learning item is marked completed.");}
    catch(error){button.disabled=false;setStatus("Completion could not be saved: "+error.message,true);}
  });
  $("learning-signout").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)return setStatus(error.message,true);window.location.href="auth.html";});
  initialise();
})();
