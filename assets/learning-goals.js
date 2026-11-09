(() => {
"use strict";
const $=id=>document.getElementById(id);
const status=(message,error=false)=>{$("goals-status").textContent=message;$("goals-status").dataset.state=error?"error":"success";};
const config=window.SUPABASE_CONFIG;
if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){status("Learning goals are not connected yet. Configure Supabase and apply migrations 1–15.",true);return;}
if(!window.supabase?.createClient){status("The sign-in library could not load. Check your connection and reload.",true);return;}
const client=window.supabase.createClient(config.url,config.publishableKey);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
let user=null,role=null,classes=[],goals=[],reviews=[];
const className=id=>classes.find(c=>c.id===id)?.name||"Class";
const filter=()=>$("goals-class-filter").value;
const dateText=value=>value?new Date(value+"T00:00:00").toLocaleDateString(undefined,{dateStyle:"medium"}):"No target date";
function render(){
 const visible=goals.filter(g=>!filter()||g.class_id===filter());
 const summary=$("goals-summary");summary.replaceChildren();
 const metrics=role==="teacher"?[["Goals",visible.length],["In progress",visible.filter(g=>g.status==="in_progress").length],["Achieved",visible.filter(g=>g.status==="achieved").length]]:[["My goals",visible.length],["In progress",visible.filter(g=>g.status==="in_progress").length],["Achieved",visible.filter(g=>g.status==="achieved").length]];
 metrics.forEach(([label,value])=>{const box=el("span","goal-meta",label+": "+value);summary.append(box);});
 const root=$("goals-list");root.replaceChildren();
 if(!visible.length){root.append(el("p","goal-empty",role==="teacher"?"No student goals have been added to this class yet.":"Set your first learning goal to get started."));return;}
 visible.forEach(goal=>{
  const card=el("article","goal-card");card.append(el("h3","",goal.title));
  card.append(el("p","goal-meta",className(goal.class_id)+(role==="teacher"?" · Student "+goal.student_id.slice(0,8):"")+" · Target: "+dateText(goal.target_date)));
  if(goal.description)card.append(el("p","",goal.description));
  card.append(el("p","goal-meta",goal.status.replaceAll("_"," ")+" · "+goal.progress_percent+"% complete"));
  const bar=el("div","goal-progress");const fill=el("span");fill.style.width=goal.progress_percent+"%";bar.append(fill);card.append(bar);
  const goalReviews=reviews.filter(r=>r.goal_id===goal.id);
  if(goalReviews.length){const section=el("div","goal-review");section.append(el("strong","","Teacher feedback"));goalReviews.forEach(r=>{section.append(el("p","",r.feedback),el("small","goal-meta",new Date(r.created_at).toLocaleString()));});card.append(section);}
  if(role==="student"){
   const controls=el("div","goal-controls"),statusWrap=el("div"),progressWrap=el("div"),actionWrap=el("div");
   statusWrap.append(el("label","","Status"));const state=document.createElement("select");
   [["not_started","Not started"],["in_progress","In progress"],["achieved","Achieved"],["paused","Paused"]].forEach(([v,t])=>state.add(new Option(t,v)));state.value=goal.status;statusWrap.append(state);
   progressWrap.append(el("label","","Progress (%)"));const amount=document.createElement("input");amount.type="number";amount.min="0";amount.max="100";amount.step="5";amount.value=goal.progress_percent;progressWrap.append(amount);
   const save=el("button","secondary","Save progress");save.type="button";save.addEventListener("click",async()=>{save.disabled=true;try{const n=Number(amount.value);if(!Number.isInteger(n)||n<0||n>100)throw new Error("Progress must be a whole number from 0 to 100.");const result=await client.from("learning_goals").update({status:state.value,progress_percent:n}).eq("id",goal.id);if(result.error)throw result.error;await load();status("Goal progress updated.");}catch(e){status(e.message,true);}finally{save.disabled=false;}});
   actionWrap.append(save);controls.append(statusWrap,progressWrap,actionWrap);card.append(controls);
  }else{
   const form=el("form","goal-review-form"),label=el("label","","Add teacher feedback"),input=document.createElement("textarea"),button=el("button","","Send feedback");
   input.maxLength=2000;input.required=true;input.placeholder="Recognise progress and suggest a practical next step.";label.append(input);button.type="submit";form.append(label,button);
   form.addEventListener("submit",async e=>{e.preventDefault();button.disabled=true;try{const result=await client.from("learning_goal_reviews").insert({goal_id:goal.id,class_id:goal.class_id,student_id:goal.student_id,teacher_id:user.id,feedback:input.value.trim()});if(result.error)throw result.error;await load();status("Feedback saved for the learner.");}catch(err){status(err.message,true);}finally{button.disabled=false;}});
   card.append(form);
  }
  root.append(card);
 });
}
async function load(){
 const ids=classes.map(c=>c.id);if(!ids.length){goals=[];reviews=[];render();return;}
 let q=client.from("learning_goals").select("id,class_id,student_id,title,description,target_date,status,progress_percent,created_at,updated_at").in("class_id",ids).order("updated_at",{ascending:false});
 if(role==="student")q=q.eq("student_id",user.id);
 const result=await q;if(result.error)throw result.error;goals=result.data||[];
 if(!goals.length){reviews=[];render();return;}
 const rr=await client.from("learning_goal_reviews").select("id,goal_id,class_id,student_id,teacher_id,feedback,created_at").in("goal_id",goals.map(g=>g.id)).order("created_at",{ascending:false});
 if(rr.error)throw rr.error;reviews=rr.data||[];render();
}
$("goals-create-form").addEventListener("submit",async e=>{
 e.preventDefault();const button=$("goal-create-button");button.disabled=true;
 try{const result=await client.from("learning_goals").insert({class_id:$("goal-class").value,student_id:user.id,title:$("goal-title").value.trim(),description:$("goal-description").value.trim(),target_date:$("goal-date").value||null});if(result.error)throw result.error;$("goals-create-form").reset();await load();status("Your learning goal has been created.");}
 catch(err){status(err.message||"Could not create the goal.",true);}finally{button.disabled=false;}
});
$("goals-class-filter").addEventListener("change",render);
$("goals-refresh").addEventListener("click",async()=>{const b=$("goals-refresh");b.disabled=true;try{await load();status("Learning goals refreshed.");}catch(e){status(e.message,true);}finally{b.disabled=false;}});
async function init(){
 const {data:s,error}=await client.auth.getSession();if(error)throw error;user=s.session?.user;
 if(!user){$("goals-login").hidden=false;status("Sign in to access learning goals.");return;}
 const p=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();if(p.error||!p.data)throw new Error("Your account profile could not be loaded.");
 role=p.data.role;if(!["teacher","student"].includes(role))throw new Error("This account role cannot access learning goals.");
 $("goals-account").textContent=(p.data.full_name||user.email)+" · "+(role==="teacher"?"Teacher":"Student");
 $("goals-create-panel").hidden=role!=="student";$("goals-list-heading").textContent=role==="teacher"?"Student learning goals":"My learning goals";
 const base=client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
 const result=role==="teacher"?await base.eq("teacher_id",user.id):await base;if(result.error)throw result.error;classes=result.data||[];
 [ $("goal-class"),$("goals-class-filter") ].forEach((select,i)=>{select.replaceChildren(new Option(i===0?"Choose a class":"All classes",""));classes.forEach(c=>select.add(new Option(c.name,c.id)));});
 $("goals-workspace").hidden=false;$("goals-login").hidden=true;await load();
 status(role==="teacher"?"Review learner goals and provide feedback.":"Create a goal for one of your enrolled classes.");
}
init().catch(e=>status(e.message||"Could not load learning goals.",true));
})();