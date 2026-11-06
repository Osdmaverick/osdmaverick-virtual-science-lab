(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const status=(message,error=false)=>{$("cq-status").textContent=message;$("cq-status").dataset.state=error?"error":"success";};
  const config=window.SUPABASE_CONFIG;
  if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")){
    status("Class quizzes are not connected yet. Configure Supabase and apply migrations 1–9.",true);return;
  }
  if(!window.supabase?.createClient){status("The account library could not load. Check your connection and reload.",true);return;}
  const client=window.supabase.createClient(config.url,config.publishableKey);
  const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n;};
  const btn=(parent,label,cls,fn)=>{const b=make("button",cls,label);b.type="button";b.addEventListener("click",fn);parent.append(b);return b;};
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let user=null,role=null,classes=[],bank=[],quizzes=[],attempts=[],activeQuiz=null;
  const className=id=>classes.find(c=>c.id===id)?.name||"Class";
  async function loadBank(){
    const classId=$("cq-class").value,select=$("cq-bank");
    select.replaceChildren();select.disabled=true;bank=[];
    if(!classId){select.disabled=true;return;}
    const {data,error}=await client.from("teacher_content_items").select("id,title,topic,content_body,question_options,correct_option,explanation").eq("class_id",classId).eq("content_type","question").order("updated_at",{ascending:false});
    if(error){status("Question bank could not be loaded: "+error.message,true);return;}
    bank=data||[];select.disabled=false;
    bank.forEach(q=>select.add(new Option(q.title+" — "+q.topic,q.id)));
    if(!bank.length)select.add(new Option("No question-bank items in this class yet",""));
  }
  function renderTeacherCard(quiz){
    const card=make("article","cq-card");
    card.append(make("span","cq-tag",quiz.status));
    card.append(make("h3","",quiz.title));
    card.append(make("p","cq-meta",className(quiz.class_id)+" · "+(quiz.class_quiz_questions?.length||0)+" questions"));
    if(quiz.description)card.append(make("p","",quiz.description));
    const rows=attempts.filter(a=>a.quiz_id===quiz.id);
    card.append(make("p","cq-meta",rows.length+" student attempt(s)"));
    if(rows.length){
      const list=make("ul");
      rows.forEach(a=>list.append(make("li","",(a.profiles?.full_name||"Student")+" — "+a.score+"/"+a.total+" · "+new Date(a.submitted_at).toLocaleString())));
      card.append(list);
    }
    const actions=make("div","cq-actions");
    if(quiz.status==="draft")btn(actions,"Publish","",()=>setQuizStatus(quiz,"published"));
    if(quiz.status==="published")btn(actions,"Unpublish","secondary",()=>setQuizStatus(quiz,"draft"));
    if(quiz.status!=="archived")btn(actions,"Archive","secondary",()=>setQuizStatus(quiz,"archived"));
    btn(actions,"Delete","secondary",()=>deleteQuiz(quiz));
    card.append(actions);return card;
  }
  function renderStudentCard(quiz){
    const card=make("article","cq-card");
    card.append(make("span","cq-tag","Published"));
    card.append(make("h3","",quiz.title));
    card.append(make("p","cq-meta",className(quiz.class_id)+" · "+(quiz.class_quiz_questions?.length||0)+" questions"));
    if(quiz.description)card.append(make("p","",quiz.description));
    const mine=attempts.filter(a=>a.quiz_id===quiz.id);
    card.append(make("p","cq-meta",mine.length+" previous attempt(s)"));
    if(mine.length){const latest=mine[0];card.append(make("p","", "Latest result: "+latest.score+"/"+latest.total+" ("+Math.round(latest.score/latest.total*100)+"%)"));}
    btn(card,mine.length?"Retake quiz":"Start quiz","",()=>openQuiz(quiz));
    return card;
  }
  function renderList(){
    const root=$("cq-list");root.replaceChildren();
    if(!quizzes.length){root.append(make("p","cq-empty",role==="teacher"?"No class quizzes yet. Create one using your question bank.":"No published quizzes are available in your classes yet."));return;}
    quizzes.forEach(q=>root.append(role==="teacher"?renderTeacherCard(q):renderStudentCard(q)));
  }
  async function loadAll(){
    const ids=classes.map(c=>c.id);
    if(!ids.length){quizzes=[];attempts=[];renderList();return;}
    const [quizResult,attemptResult]=await Promise.all([
      client.from("class_quizzes").select("id,class_id,title,description,status,published_at,created_at,class_quiz_questions(id,position,prompt,options)").in("class_id",ids).order("created_at",{ascending:false}),
      client.from("class_quiz_attempts").select("id,quiz_id,class_id,student_id,score,total,submitted_at,profiles(full_name)").in("class_id",ids).order("submitted_at",{ascending:false})
    ]);
    if(quizResult.error)throw quizResult.error;
    if(attemptResult.error)throw attemptResult.error;
    quizzes=(quizResult.data||[]).filter(q=>role==="teacher"||q.status==="published");
    attempts=attemptResult.data||[];
    renderList();
  }
  async function setQuizStatus(quiz,next){
    if(next==="published"&&!(quiz.class_quiz_questions?.length))return status("Add at least one question before publishing.",true);
    const {error}=await client.from("class_quizzes").update({status:next,published_at:next==="published"?new Date().toISOString():null}).eq("id",quiz.id);
    if(error)return status("Quiz status could not be updated: "+error.message,true);
    status("Quiz "+(next==="published"?"published":next==="archived"?"archived":"returned to drafts")+".");await loadAll();
  }
  async function deleteQuiz(quiz){
    if(!window.confirm("Delete this quiz and its attempts? This cannot be undone."))return;
    const {error}=await client.from("class_quizzes").delete().eq("id",quiz.id);
    if(error)return status("Quiz could not be deleted: "+error.message,true);
    status("Quiz deleted.");await loadAll();
  }
  async function createQuiz(event){
    event.preventDefault();
    const classId=$("cq-class").value;
    const selected=[...$("cq-bank").selectedOptions].map(o=>bank.find(q=>q.id===o.value)).filter(Boolean);
    if(!classId)return status("Choose a class.",true);
    if(!selected.length)return status("Select at least one question from the bank.",true);
    if(selected.length>100)return status("A quiz can contain no more than 100 questions.",true);
    $("cq-create").disabled=true;
    let quizId=null;
    try{
      const {data:quiz,error:quizError}=await client.from("class_quizzes").insert({class_id:classId,teacher_id:user.id,title:$("cq-title").value.trim(),description:$("cq-description").value.trim(),status:"draft"}).select("id").single();
      if(quizError)throw quizError;quizId=quiz.id;
      const questionRows=selected.map((q,i)=>({quiz_id:quizId,source_question_id:q.id,position:i+1,prompt:q.content_body,options:q.question_options}));
      const {data:created,error:questionError}=await client.from("class_quiz_questions").insert(questionRows).select("id,position");
      if(questionError)throw questionError;
      const byPosition=new Map(created.map(q=>[q.position,q.id]));
      const keys=selected.map((q,i)=>({question_id:byPosition.get(i+1),correct_option:q.correct_option,explanation:q.explanation||""}));
      const {error:keyError}=await client.from("class_quiz_answer_keys").insert(keys);
      if(keyError)throw keyError;
      $("cq-form").reset();$("cq-bank").replaceChildren();$("cq-bank").disabled=true;
      status("Draft quiz created with "+selected.length+" question(s). Review it below and publish when ready.");
      await loadAll();
    }catch(error){
      if(quizId)await client.from("class_quizzes").delete().eq("id",quizId);
      status(error.message||"Quiz could not be created.",true);
    }finally{$("cq-create").disabled=false;}
  }
  function openQuiz(quiz){
    activeQuiz=quiz;
    $("cq-take-title").textContent=quiz.title;
    $("cq-take-description").textContent=quiz.description||"Answer every question, then submit once you are ready.";
    const root=$("cq-questions");root.replaceChildren();
    [...(quiz.class_quiz_questions||[])].sort((a,b)=>a.position-b.position).forEach((q,i)=>{
      const field=make("fieldset","cq-question");field.append(make("legend","", "Question "+(i+1)+": "+q.prompt));
      q.options.forEach((option,j)=>{
        const label=make("label");
        const input=document.createElement("input");input.type="radio";input.name="answer-"+q.id;input.value=String(j+1);input.required=true;
        label.append(input,make("span","",option));field.append(label);
      });
      root.append(field);
    });
    $("cq-result").hidden=true;$("cq-submit").disabled=false;
    $("cq-list").parentElement.hidden=true;$("cq-take").classList.add("active");
    $("cq-take").scrollIntoView({behavior:"smooth",block:"start"});
  }
  async function submitQuiz(event){
    event.preventDefault();if(!activeQuiz)return;
    const answers={};
    for(const q of activeQuiz.class_quiz_questions||[]){
      const selected=document.querySelector('input[name="answer-'+q.id+'"]:checked');
      if(!selected)return status("Answer every question before submitting.",true);
      answers[q.id]=Number(selected.value);
    }
    $("cq-submit").disabled=true;
    const {data,error}=await client.rpc("submit_class_quiz",{p_quiz_id:activeQuiz.id,p_answers:answers});
    if(error){$("cq-submit").disabled=false;return status(error.message,true);}
    const result=Array.isArray(data)?data[0]:data;
    $("cq-score").textContent=result.score+" / "+result.total+" ("+result.percentage+"%)";
    $("cq-result").hidden=false;$("cq-submit").textContent="Attempt submitted";
    status("Your answers were marked securely and the result was saved.");
    await loadAll();
  }
  function closeQuiz(){
    activeQuiz=null;$("cq-take").classList.remove("active");$("cq-list").parentElement.hidden=false;
    $("cq-take-form").reset();$("cq-submit").textContent="Submit answers";renderList();
  }
  async function initialise(){
    const {data:sessionData,error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    user=sessionData.session?.user||null;
    if(!user){$("cq-login").hidden=false;return status("Sign in to access class quizzes.");}
    const {data:profile,error:profileError}=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(profileError||!profile)throw new Error("Your account profile is unavailable.");
    role=profile.role;$("cq-account").textContent=(profile.full_name||user.email)+" · "+role;
    if(role==="teacher"){
      $("cq-teacher").hidden=false;$("cq-list-title").textContent="Your class quizzes";
      const {data,error}=await client.from("classes").select("id,name").eq("teacher_id",user.id).order("name");
      if(error)throw error;classes=data||[];
      classes.forEach(c=>$("cq-class").add(new Option(c.name,c.id)));
      $("cq-class").addEventListener("change",loadBank);
      $("cq-form").addEventListener("submit",createQuiz);
    }else if(role==="student"){
      $("cq-student").hidden=false;$("cq-list-title").textContent="Published quizzes";
      const {data,error}=await client.from("classes").select("id,name").order("name");
      if(error)throw error;classes=data||[];
    }else throw new Error("This account role cannot access class quizzes.");
    await loadAll();status("Class quiz workspace ready.");
  }
  $("cq-take-form").addEventListener("submit",submitQuiz);
  $("cq-back").addEventListener("click",closeQuiz);
  initialise().catch(error=>status(error.message||"Class quizzes could not be loaded.",true));
})();
