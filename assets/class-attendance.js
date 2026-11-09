(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const setStatus=(message,error=false)=>{$("attendance-status").textContent=message;$("attendance-status").dataset.state=error?"error":"success";};
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    setStatus("Class attendance is not connected yet. Configure Supabase and apply migrations 1–14.",true);return;
  }
  if(!window.supabase?.createClient){setStatus("The sign-in library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  let user=null,role=null,classes=[],sessions=[],records=[],activeSession=null,roster=[];
  const className=id=>classes.find(c=>c.id===id)?.name||"Class";
  const selectedClass=()=>$("attendance-class-filter").value;
  const dateLabel=value=>new Date(value+"T00:00:00").toLocaleDateString(undefined,{dateStyle:"medium"});
  function summary(){
    const relevant=records.filter(r=>!selectedClass()||r.class_id===selectedClass());
    const count=status=>relevant.filter(r=>r.status===status).length;
    const values=role==="teacher"?[["Registers",sessions.filter(s=>!selectedClass()||s.class_id===selectedClass()).length],["Present",count("present")],["Absent",count("absent")],["Late",count("late")]]:[["Recorded",relevant.length],["Present",count("present")],["Absent",count("absent")],["Late",count("late")]];
    $("attendance-summary").replaceChildren();
    values.forEach(([label,value])=>{const el=make("article","attendance-stat");el.append(make("strong","",String(value)),make("span","",label));$("attendance-summary").append(el);});
  }
  async function load(){
    const ids=classes.map(c=>c.id);
    if(!ids.length){sessions=[];records=[];render();return;}
    const s=await client.from("attendance_sessions").select("id,class_id,teacher_id,session_date,title,notes,created_at").in("class_id",ids).order("session_date",{ascending:false});
    if(s.error)throw s.error;sessions=s.data||[];
    const r=role==="teacher"
      ?await client.from("attendance_records").select("id,session_id,class_id,student_id,status,note,marked_at").in("class_id",ids)
      :await client.from("attendance_records").select("id,session_id,class_id,student_id,status,note,marked_at").eq("student_id",user.id);
    if(r.error)throw r.error;records=r.data||[];render();
  }
  function render(){
    const filter=selectedClass(),visible=sessions.filter(s=>!filter||s.class_id===filter);
    summary();const root=$("attendance-session-list");root.replaceChildren();
    if(!visible.length){root.append(make("p","attendance-empty",role==="teacher"?"Create a register to record attendance for a class.":"No attendance records are available yet."));return;}
    visible.forEach(session=>{
      const card=make("article","attendance-session"),heading=make("h3","",session.title);
      card.append(heading,make("p","attendance-meta",className(session.class_id)+" · "+dateLabel(session.session_date)));
      if(session.notes)card.append(make("p","",session.notes));
      const rows=records.filter(r=>r.session_id===session.id);
      if(role==="student"){
        const own=rows.find(r=>r.student_id===user.id);
        card.append(make("span","attendance-tag",own?own.status[0].toUpperCase()+own.status.slice(1):"Not recorded"));
        if(own?.note)card.append(make("p","attendance-meta",own.note));
      }else{
        const tally=["present","absent","late","excused","unmarked"].map(status=>status[0].toUpperCase()+status.slice(1)+" "+rows.filter(r=>r.status===status).length).join(" · ");
        card.append(make("p","attendance-meta",tally));
        const actions=make("div","attendance-actions"),button=make("button","secondary","Open register");
        button.type="button";button.addEventListener("click",()=>openRegister(session));actions.append(button);card.append(actions);
      }
      root.append(card);
    });
  }
  async function openRegister(session){
    activeSession=session;$("attendance-register-panel").hidden=false;
    $("attendance-register-heading").textContent=session.title;
    $("attendance-register-meta").textContent=className(session.class_id)+" · "+dateLabel(session.session_date);
    const e=await client.from("enrollments").select("student_id").eq("class_id",session.class_id);
    if(e.error)return setStatus(e.error.message,true);
    const ids=(e.data||[]).map(x=>x.student_id);
    let profiles=[];
    if(ids.length){const p=await client.from("profiles").select("id,full_name").in("id",ids);if(p.error)return setStatus(p.error.message,true);profiles=p.data||[];}
    const old=records.filter(r=>r.session_id===session.id),oldMap=new Map(old.map(r=>[r.student_id,r]));
    roster=profiles.map(p=>({id:p.id,name:p.full_name||"Student",record:oldMap.get(p.id)}));
    const root=$("attendance-roster");root.replaceChildren();
    if(!roster.length){root.append(make("p","attendance-empty","No students are enrolled in this class yet."));return;}
    roster.forEach(student=>{
      const row=make("div","attendance-learner"),name=make("strong","",student.name),select=document.createElement("select"),note=document.createElement("input");
      select.setAttribute("aria-label","Attendance status for "+student.name);
      [["unmarked","Not marked"],["present","Present"],["absent","Absent"],["late","Late"],["excused","Excused"]].forEach(([value,label])=>select.add(new Option(label,value)));
      select.value=student.record?.status||"unmarked";note.maxLength=500;note.placeholder="Optional note";note.setAttribute("aria-label","Note for "+student.name);note.value=student.record?.note||"";
      row.append(name,select,note);row.dataset.studentId=student.id;root.append(row);
    });
  }
  $("attendance-create-form").addEventListener("submit",async e=>{
    e.preventDefault();const button=$("attendance-create");button.disabled=true;
    try{
      const payload={class_id:$("attendance-class").value,teacher_id:user.id,session_date:$("attendance-date").value,title:$("attendance-title").value.trim(),notes:$("attendance-notes").value.trim()};
      const result=await client.from("attendance_sessions").insert(payload).select("id,class_id,teacher_id,session_date,title,notes").single();
      if(result.error)throw result.error;
      $("attendance-create-form").reset();$("attendance-class-filter").value=payload.class_id;
      await load();setStatus("Attendance register created. Open it to mark the class roster.");await openRegister(result.data);
    }catch(err){setStatus(err.message||"Could not create the register.",true);}
    finally{button.disabled=false;}
  });
  $("attendance-register-form").addEventListener("submit",async e=>{
    e.preventDefault();if(!activeSession)return;
    const button=e.submitter;button.disabled=true;
    try{
      const payload=[...$("attendance-roster").querySelectorAll(".attendance-learner")].map(row=>{
        const controls=row.querySelectorAll("select,input");
        return {session_id:activeSession.id,class_id:activeSession.class_id,student_id:row.dataset.studentId,status:controls[0].value,note:controls[1].value.trim(),marked_at:new Date().toISOString()};
      }).filter(row=>row.status!=="unmarked");
      const existing=records.filter(r=>r.session_id===activeSession.id);
      const selectedIds=new Set(payload.map(r=>r.student_id));
      const removeIds=existing.filter(r=>!selectedIds.has(r.student_id)).map(r=>r.id);
      if(removeIds.length){const del=await client.from("attendance_records").delete().in("id",removeIds);if(del.error)throw del.error;}
      if(payload.length){const save=await client.from("attendance_records").upsert(payload,{onConflict:"session_id,student_id"});if(save.error)throw save.error;}
      await load();setStatus("Attendance saved for "+payload.length+" learner(s).");
    }catch(err){setStatus(err.message||"Could not save attendance.",true);}
    finally{button.disabled=false;}
  });
  $("attendance-close-register").addEventListener("click",()=>{$("attendance-register-panel").hidden=true;activeSession=null;});
  $("attendance-class-filter").addEventListener("change",render);
  $("attendance-refresh").addEventListener("click",async()=>{const b=$("attendance-refresh");b.disabled=true;try{await load();setStatus("Attendance refreshed.");}catch(e){setStatus(e.message,true);}finally{b.disabled=false;}});
  async function init(){
    const {data:session,error}=await client.auth.getSession();if(error)throw error;user=session.session?.user;
    if(!user){$("attendance-login").hidden=false;setStatus("Sign in to view class attendance.");return;}
    const p=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(p.error||!p.data)throw new Error("Your account profile could not be loaded.");
    role=p.data.role;if(!["teacher","student"].includes(role))throw new Error("This account role cannot access attendance.");
    $("attendance-account").textContent=(p.data.full_name||user.email)+" · "+(role==="teacher"?"Teacher":"Student");
    $("attendance-create-panel").hidden=role!=="teacher";$("attendance-register-panel").hidden=true;
    $("attendance-list-heading").textContent=role==="teacher"?"Class registers":"Your attendance history";
    const q=client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
    const c=role==="teacher"?await q.eq("teacher_id",user.id):await q;
    if(c.error)throw c.error;classes=c.data||[];
    [ $("attendance-class"),$("attendance-class-filter") ].forEach((select,index)=>{
      select.replaceChildren(new Option(index===0?"Choose a class":"All classes",""));
      classes.forEach(item=>select.add(new Option(item.name,item.id)));
    });
    const now=new Date();$("attendance-date").value=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
    $("attendance-workspace").hidden=false;$("attendance-login").hidden=true;
    await load();setStatus(role==="teacher"?"Create a register and record attendance for your classes.":"Your personal attendance history is ready.");
  }
  init().catch(e=>setStatus(e.message||"Could not load class attendance.",true));
})();