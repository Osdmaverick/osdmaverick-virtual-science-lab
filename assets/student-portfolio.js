(() => {
"use strict";
const $=id=>document.getElementById(id);
const status=(message,error=false)=>{$("portfolio-status").textContent=message;$("portfolio-status").dataset.state=error?"error":"success";};
const config=window.SUPABASE_CONFIG;
if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){status("Student portfolio is not connected yet. Configure Supabase and apply migrations 1–16.",true);return;}
if(!window.supabase?.createClient){status("The sign-in library could not load. Check your connection and reload.",true);return;}
const client=window.supabase.createClient(config.url,config.publishableKey);
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
let user=null,role=null,classes=[],entries=[],reviews=[],certificates=[];
const className=id=>classes.find(c=>c.id===id)?.name||"Class";
const filter=()=>$("portfolio-class-filter").value;
const safeLink=value=>{try{const u=new URL(value);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch(_){return "";}};
function render(){
 const visible=entries.filter(e=>!filter()||e.class_id===filter());
 $("portfolio-summary").textContent=visible.length+" portfolio entr"+(visible.length===1?"y":"ies")+" · "+certificates.filter(c=>!filter()||c.class_id===filter()).length+" certificate(s)";
 const root=$("portfolio-list");root.replaceChildren();
 if(!visible.length)root.append(el("p","portfolio-empty",role==="teacher"?"No portfolio entries have been shared in this class yet.":"Add your first investigation or project to begin your portfolio."));
 visible.forEach(entry=>{
  const card=el("article","portfolio-card");card.append(el("h3","",entry.title));
  card.append(el("p","portfolio-meta",className(entry.class_id)+" · "+entry.category.replaceAll("_"," ")+" · "+new Date(entry.created_at).toLocaleDateString()));
  card.append(el("p","",entry.summary));
  const link=safeLink(entry.evidence_url);if(link){const a=el("a","", "Open evidence");a.href=link;a.target="_blank";a.rel="noopener noreferrer";card.append(a);}
  const entryReviews=reviews.filter(r=>r.entry_id===entry.id);
  if(entryReviews.length){const section=el("div","portfolio-review");section.append(el("strong","","Teacher feedback"));entryReviews.forEach(r=>section.append(el("p","",r.feedback),el("small","portfolio-meta",new Date(r.created_at).toLocaleString())));card.append(section);}
  if(role==="teacher"){
   const form=el("form","portfolio-review"),label=el("label","","Add feedback"),input=document.createElement("textarea"),button=el("button","","Send feedback");
   input.required=true;input.maxLength=2000;input.placeholder="Recognise the student's work and suggest a next step.";label.append(input);button.type="submit";form.append(label,button);
   form.addEventListener("submit",async e=>{e.preventDefault();button.disabled=true;try{const r=await client.from("student_portfolio_reviews").insert({entry_id:entry.id,class_id:entry.class_id,student_id:entry.student_id,teacher_id:user.id,feedback:input.value.trim()});if(r.error)throw r.error;await load();status("Feedback saved.");}catch(err){status(err.message||"Could not save feedback.",true);}finally{button.disabled=false;}});
   card.append(form);
   const issue=el("form","portfolio-review"),titleLabel=el("label","","Issue an achievement certificate"),titleInput=document.createElement("input"),desc=document.createElement("textarea"),issueButton=el("button","","Issue certificate");
   titleInput.required=true;titleInput.minLength=3;titleInput.maxLength=160;titleInput.placeholder="e.g. Outstanding Scientific Investigation";
   desc.maxLength=1000;desc.placeholder="Optional recognition details.";titleLabel.append(titleInput,desc);issueButton.type="submit";issue.append(titleLabel,issueButton);
   issue.addEventListener("submit",async e=>{e.preventDefault();issueButton.disabled=true;try{const r=await client.from("achievement_certificates").insert({class_id:entry.class_id,student_id:entry.student_id,issued_by:user.id,title:titleInput.value.trim(),description:desc.value.trim()});if(r.error)throw r.error;await load();status("Achievement certificate issued to the student.");}catch(err){status(err.message||"Could not issue certificate.",true);}finally{issueButton.disabled=false;}});
   card.append(issue);
  }else{
   const remove=el("button","secondary","Remove entry");remove.type="button";remove.addEventListener("click",async()=>{if(!window.confirm("Remove this portfolio entry and its feedback?"))return;remove.disabled=true;try{const r=await client.from("student_portfolio_entries").delete().eq("id",entry.id);if(r.error)throw r.error;await load();status("Portfolio entry removed.");}catch(err){status(err.message,true);}finally{remove.disabled=false;}});card.append(remove);
  }
  root.append(card);
 });
 const certRoot=$("certificate-list");certRoot.replaceChildren();
 const certs=certificates.filter(c=>!filter()||c.class_id===filter());
 if(!certs.length)certRoot.append(el("p","portfolio-empty",role==="teacher"?"No certificates have been issued in this class yet.":"Certificates awarded by your teachers will appear here."));
 certs.forEach(cert=>{
  const card=el("article","certificate");card.append(el("p","portfolio-meta","OSDMAVERICK VIRTUAL SCIENCE LAB"));
  card.append(el("h3","","Certificate of Achievement"));card.append(el("p","","This certificate is proudly presented to"));
  card.append(el("h2","",role==="teacher"?("Student "+cert.student_id.slice(0,8)):($("portfolio-account").dataset.name||"Student")));
  card.append(el("p","","in recognition of"));card.append(el("h3","",cert.title));
  if(cert.description)card.append(el("p","",cert.description));
  card.append(el("p","portfolio-meta",className(cert.class_id)+" · "+new Date(cert.issued_at).toLocaleDateString()));
  card.append(el("p","cert-code","Certificate code: "+cert.certificate_code));
  if(role==="teacher")card.append(el("p","portfolio-meta","Issued by you"));
  certRoot.append(card);
 });
}
async function load(){
 const ids=classes.map(c=>c.id);if(!ids.length){entries=[];reviews=[];certificates=[];render();return;}
 let q=client.from("student_portfolio_entries").select("id,class_id,student_id,title,category,summary,evidence_url,created_at").in("class_id",ids).order("created_at",{ascending:false});
 if(role==="student")q=q.eq("student_id",user.id);
 const result=await q;if(result.error)throw result.error;entries=result.data||[];
 if(entries.length){const rr=await client.from("student_portfolio_reviews").select("id,entry_id,class_id,student_id,teacher_id,feedback,created_at").in("entry_id",entries.map(e=>e.id)).order("created_at",{ascending:false});if(rr.error)throw rr.error;reviews=rr.data||[];}else reviews=[];
 let cq=client.from("achievement_certificates").select("id,class_id,student_id,issued_by,title,description,certificate_code,issued_at").in("class_id",ids).order("issued_at",{ascending:false});
 if(role==="student")cq=cq.eq("student_id",user.id);
 const cr=await cq;if(cr.error)throw cr.error;certificates=cr.data||[];render();
}
$("portfolio-form").addEventListener("submit",async e=>{
 e.preventDefault();const button=$("portfolio-submit");button.disabled=true;
 try{const r=await client.from("student_portfolio_entries").insert({class_id:$("portfolio-class").value,student_id:user.id,title:$("portfolio-title").value.trim(),category:$("portfolio-category").value,summary:$("portfolio-summary-input").value.trim(),evidence_url:$("portfolio-evidence").value.trim()});if(r.error)throw r.error;$("portfolio-form").reset();await load();status("Portfolio entry saved.");}
 catch(err){status(err.message||"Could not save portfolio entry.",true);}finally{button.disabled=false;}
});
$("portfolio-class-filter").addEventListener("change",render);
$("portfolio-refresh").addEventListener("click",async()=>{const b=$("portfolio-refresh");b.disabled=true;try{await load();status("Portfolio refreshed.");}catch(e){status(e.message,true);}finally{b.disabled=false;}});
$("portfolio-print").addEventListener("click",()=>window.print());
async function init(){
 const {data:s,error}=await client.auth.getSession();if(error)throw error;user=s.session?.user;
 if(!user){$("portfolio-login").hidden=false;status("Sign in to access your portfolio.");return;}
 const p=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();if(p.error||!p.data)throw new Error("Your account profile could not be loaded.");
 role=p.data.role;if(!["teacher","student"].includes(role))throw new Error("This account role cannot access portfolios.");
 $("portfolio-account").textContent=(p.data.full_name||user.email)+" · "+(role==="teacher"?"Teacher":"Student");$("portfolio-account").dataset.name=p.data.full_name||"Student";
 $("portfolio-form-panel").hidden=role!=="student";$("portfolio-list-heading").textContent=role==="teacher"?"Student portfolio entries":"My portfolio entries";
 const base=client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
 const result=role==="teacher"?await base.eq("teacher_id",user.id):await base;if(result.error)throw result.error;classes=result.data||[];
 [ $("portfolio-class"),$("portfolio-class-filter") ].forEach((select,i)=>{select.replaceChildren(new Option(i===0?"Choose a class":"All classes",""));classes.forEach(c=>select.add(new Option(c.name,c.id)));});
 $("portfolio-workspace").hidden=false;$("portfolio-login").hidden=true;await load();status(role==="teacher"?"Review student evidence and recognise achievements.":"Add evidence of your science learning.");
}
init().catch(e=>status(e.message||"Could not load portfolio.",true));
})();
