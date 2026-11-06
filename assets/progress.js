(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const config = window.SUPABASE_CONFIG;
  let client, user, role, classes=[], data={};
  const status = (message, error=false) => { $("progress-status").textContent=message; $("progress-status").dataset.state=error?"error":"success"; };
  const relation = value => Array.isArray(value) ? value[0] || {} : value || {};
  const pct = (score,total) => Number(total)>0 ? Math.round(Number(score)/Number(total)*100) : null;
  const average = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
  const fmt = value => value===null || !Number.isFinite(value) ? "—" : value.toFixed(1)+"%";
  const date = value => value ? new Date(value).toLocaleDateString() : "—";
  async function query(table, columns, options={}) {
    let q=client.from(table).select(columns);
    if(options.in && options.in.length) q=q.in(options.in[0],options.in[1]);
    if(options.eq) q=q.eq(options.eq[0],options.eq[1]);
    if(options.order) q=q.order(options.order,{ascending:false});
    const {data:rows,error}=await q;
    if(error) throw new Error(table+": "+error.message);
    return rows||[];
  }
  function metricCard(label,value,detail="") {
    return '<article class="progress-metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(detail)+'</small></article>';
  }
  function renderTeacher() {
    const filter=$("class-filter").value;
    const visibleClasses=classes.filter(c=>!filter||c.id===filter);
    const classIds=visibleClasses.map(c=>c.id);
    const students=data.enrollments.filter(e=>classIds.includes(e.class_id));
    const rows=students.map(e=>{
      const quiz=data.quizzes.filter(x=>x.student_id===e.student_id&&x.class_id===e.class_id);
      const submissions=data.submissions.filter(x=>x.student_id===e.student_id&&data.assignmentMap.get(x.assignment_id)?.class_id===e.class_id);
      const graded=submissions.filter(x=>x.graded_at&&x.score!==null);
      const reports=data.reports.filter(x=>x.student_id===e.student_id&&x.class_id===e.class_id);
      const assessed=reports.filter(x=>relation(x.lab_report_assessments).assessed_at);
      const quizAverage=average(quiz.map(x=>pct(x.score,x.total)).filter(x=>x!==null));
      const assignmentAverage=average(graded.map(x=>pct(x.score,data.assignmentMap.get(x.assignment_id)?.points_possible)));
      const labAverage=average(assessed.map(x=>{const s=relation(x.lab_report_assessments).scores||{};return ["question","method","evidence","conclusion"].reduce((n,k)=>n+Number(s[k]||0),0)/16*100;}));
      return {name:relation(e.profiles).full_name||"Student",className:classes.find(c=>c.id===e.class_id)?.name||"Class",quizAverage,assignmentAverage,labAverage,quizCount:quiz.length,gradedCount:graded.length,reportCount:reports.length,assessedCount:assessed.length};
    }).sort((a,b)=>a.className.localeCompare(b.className)||a.name.localeCompare(b.name));
    const uniqueStudents=new Set(students.map(x=>x.student_id));
    $("progress-metrics").innerHTML=[
      metricCard("Students",String(uniqueStudents.size),"In selected classes"),
      metricCard("Quiz attempts",String(data.quizzes.filter(x=>classIds.includes(x.class_id)).length),"Submitted results"),
      metricCard("Graded assignments",String(data.submissions.filter(x=>data.assignmentMap.get(x.assignment_id)&&classIds.includes(data.assignmentMap.get(x.assignment_id).class_id)&&x.graded_at).length),"Teacher-marked work"),
      metricCard("Assessed lab reports",String(data.reports.filter(x=>classIds.includes(x.class_id)&&relation(x.lab_report_assessments).assessed_at).length),"Rubric reviews")
    ].join("");
    $("progress-table-wrap").innerHTML=rows.length?'<div class="table-scroll"><table class="progress-table"><thead><tr><th>Student</th><th>Class</th><th>Quiz average</th><th>Assignment average</th><th>Lab rubric</th><th>Activity</th></tr></thead><tbody>'+rows.map(r=>'<tr><th>'+esc(r.name)+'</th><td>'+esc(r.className)+'</td><td>'+esc(fmt(r.quizAverage))+' <small>'+r.quizCount+' attempts</small></td><td>'+esc(fmt(r.assignmentAverage))+' <small>'+r.gradedCount+' graded</small></td><td>'+esc(fmt(r.labAverage))+' <small>'+r.assessedCount+'/'+r.reportCount+' assessed</small></td><td>'+r.quizCount+' quizzes · '+r.gradedCount+' graded · '+r.reportCount+' reports</td></tr>').join("")+'</tbody></table></div>':'<p class="progress-empty">No enrolled learners or learning activity in this class yet.</p>';
    const allScores=[...rows.map(r=>r.quizAverage),...rows.map(r=>r.assignmentAverage),...rows.map(r=>r.labAverage)].filter(x=>x!==null);
    $("progress-summary").textContent=allScores.length?"Averages are calculated from submitted quiz attempts, graded assignments and rubric-assessed lab reports. Unmarked work is not treated as zero.":"As students submit work and teachers assess it, class performance summaries will appear here.";
    $("activity-list").innerHTML=recentTeacherActivity(classIds);
  }
  function recentTeacherActivity(classIds) {
    const events=[
      ...data.quizzes.filter(x=>classIds.includes(x.class_id)).map(x=>({when:x.submitted_at,label:"Quiz: "+x.quiz_title,detail:(classes.find(c=>c.id===x.class_id)?.name||"Class")+" · "+x.score+"/"+x.total})),
      ...data.submissions.filter(x=>data.assignmentMap.get(x.assignment_id)&&classIds.includes(data.assignmentMap.get(x.assignment_id).class_id)).map(x=>({when:x.submitted_at||x.graded_at,label:"Assignment: "+(data.assignmentMap.get(x.assignment_id)?.title||"Submission"),detail:x.graded_at?"Graded":"Submitted"})),
      ...data.reports.filter(x=>classIds.includes(x.class_id)).map(x=>({when:x.updated_at,label:"Lab report: "+(x.payload?.title||"Investigation"),detail:relation(x.lab_report_assessments).assessed_at?"Assessed":"Awaiting review"}))
    ].filter(x=>x.when).sort((a,b)=>new Date(b.when)-new Date(a.when)).slice(0,10);
    return events.length?events.map(e=>'<li><strong>'+esc(e.label)+'</strong><span>'+esc(e.detail)+' · '+esc(date(e.when))+'</span></li>').join(""):'<li>No recent activity recorded.</li>';
  }
  function renderStudent() {
    const quizAverage=average(data.quizzes.map(x=>pct(x.score,x.total)).filter(x=>x!==null));
    const graded=data.submissions.filter(x=>x.graded_at&&x.score!==null);
    const assignmentAverage=average(graded.map(x=>pct(x.score,data.assignmentMap.get(x.assignment_id)?.points_possible)).filter(x=>x!==null));
    const assessed=data.reports.filter(x=>relation(x.lab_report_assessments).assessed_at);
    const labAverage=average(assessed.map(x=>{const s=relation(x.lab_report_assessments).scores||{};return ["question","method","evidence","conclusion"].reduce((n,k)=>n+Number(s[k]||0),0)/16*100;}));
    $("progress-metrics").innerHTML=[
      metricCard("Quiz average",fmt(quizAverage),data.quizzes.length+" attempts"),
      metricCard("Assignment average",fmt(assignmentAverage),graded.length+" graded"),
      metricCard("Lab rubric average",fmt(labAverage),assessed.length+" assessed reports"),
      metricCard("Classes",String(classes.length),"Enrolled classes")
    ].join("");
    const classCards=classes.map(c=>{
      const quizzes=data.quizzes.filter(x=>x.class_id===c.id);
      const subs=data.submissions.filter(x=>data.assignmentMap.get(x.assignment_id)?.class_id===c.id);
      const reports=data.reports.filter(x=>x.class_id===c.id);
      return '<article class="progress-class"><h3>'+esc(c.name)+'</h3><p>'+quizzes.length+' quiz attempts · '+subs.length+' assignment records · '+reports.length+' lab reports</p></article>';
    });
    $("progress-table-wrap").innerHTML=classCards.length?'<div class="progress-class-grid">'+classCards.join("")+'</div>':'<p class="progress-empty">Join a class to see your class learning progress here.</p>';
    $("progress-summary").textContent="Only your own results are shown. Unmarked assignments and lab reports are excluded from averages until your teacher assesses them.";
    const events=[
      ...data.quizzes.map(x=>({when:x.submitted_at,label:"Quiz: "+x.quiz_title,detail:x.score+"/"+x.total+" ("+pct(x.score,x.total)+"%)"})),
      ...data.submissions.map(x=>({when:x.submitted_at||x.graded_at,label:"Assignment: "+(data.assignmentMap.get(x.assignment_id)?.title||"Assignment"),detail:x.graded_at?"Score "+x.score+"/"+(data.assignmentMap.get(x.assignment_id)?.points_possible||"?"):"Submitted / awaiting feedback"})),
      ...data.reports.map(x=>({when:x.updated_at,label:"Lab report: "+(x.payload?.title||"Investigation"),detail:relation(x.lab_report_assessments).assessed_at?"Teacher feedback available":"Awaiting teacher review"}))
    ].filter(x=>x.when).sort((a,b)=>new Date(b.when)-new Date(a.when)).slice(0,12);
    $("activity-list").innerHTML=events.length?events.map(e=>'<li><strong>'+esc(e.label)+'</strong><span>'+esc(e.detail)+' · '+esc(date(e.when))+'</span></li>').join(""):'<li>No learning activity yet. Try a quiz or submit an assignment.</li>';
  }
  async function load() {
    if(!config?.url||!config?.publishableKey||!window.supabase?.createClient)throw new Error("Supabase is not configured. Local practice and work remain available in their existing pages.");
    client=window.supabase.createClient(config.url,config.publishableKey);
    const session=await client.auth.getSession();user=session.data.session?.user;
    if(!user){$("progress-login").hidden=false;$("progress-content").hidden=true;return;}
    const profile=await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if(profile.error||!profile.data)throw new Error("Could not load your account profile.");
    role=profile.data.role;
    $("progress-greeting").textContent="Learning progress"+(profile.data.full_name?" · "+profile.data.full_name:"");
    if(role==="teacher"){
      classes=await query("classes","id,name",{eq:["teacher_id",user.id]});
      const ids=classes.map(c=>c.id);
      $("class-filter-wrap").hidden=false;
      $("class-filter").innerHTML='<option value="">All my classes</option>'+classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
      if(!ids.length){data={enrollments:[],quizzes:[],submissions:[],reports:[],assignmentMap:new Map()};}
      else {
        const [enrollments,quizzes,assignments,submissions,reports]=await Promise.all([
          query("enrollments","class_id,student_id,profiles(full_name)",{in:["class_id",ids]}),
          query("quiz_attempts","id,class_id,student_id,quiz_title,score,total,submitted_at",{in:["class_id",ids],order:"submitted_at"}),
          query("assignments","id,class_id,title,points_possible,status,created_at",{in:["class_id",ids]}),
          query("assignment_submissions","id,assignment_id,student_id,status,score,graded_at,submitted_at",{order:"submitted_at"}),
          query("lab_reports","id,class_id,student_id,payload,updated_at,lab_report_assessments(scores,assessed_at)",{in:["class_id",ids],order:"updated_at"})
        ]);
        const assignmentMap=new Map(assignments.map(a=>[a.id,a]));
        data={enrollments,quizzes,submissions,reports,assignmentMap};
      }
      $("progress-content").hidden=false;$("progress-login").hidden=true;
      $("class-filter").addEventListener("change",renderTeacher);
      renderTeacher();
    } else if(role==="student"){
      const [studentClasses,quizzes,assignments,submissions,reports]=await Promise.all([
        query("classes","id,name"),
        query("quiz_attempts","id,class_id,quiz_title,score,total,submitted_at",{eq:["student_id",user.id],order:"submitted_at"}),
        query("assignments","id,class_id,title,points_possible,status,due_at"),
        query("assignment_submissions","id,assignment_id,status,score,graded_at,submitted_at",{eq:["student_id",user.id],order:"submitted_at"}),
        query("lab_reports","id,class_id,payload,updated_at,lab_report_assessments(scores,feedback,assessed_at)",{eq:["student_id",user.id],order:"updated_at"})
      ]);
      classes=studentClasses;
      data={quizzes,submissions,reports,assignmentMap:new Map(assignments.map(a=>[a.id,a]))};
      $("progress-content").hidden=false;$("progress-login").hidden=true;renderStudent();
    } else throw new Error("This account role does not have a progress dashboard.");
    $("progress-refresh").hidden=false;
  }
  $("progress-refresh").addEventListener("click",()=>{ $("progress-refresh").disabled=true;load().catch(e=>status(e.message,true)).finally(()=>$("progress-refresh").disabled=false); });
  load().catch(e=>{status(e.message,true);$("progress-content").hidden=true;$("progress-login").hidden=true;});
})();