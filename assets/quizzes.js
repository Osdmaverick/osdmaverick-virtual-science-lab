/* Phase 5: accessible, auto-marked science quizzes with optional class-scoped cloud submission. */
(() => {
  "use strict";
  const bank = [
    { id:"forces-01", grade:"Grade 7", subject:"Physics", topic:"Forces and motion", question:"A net force of 12 N acts on a 3 kg trolley. What is its acceleration?", options:["2 m/s²","4 m/s²","9 m/s²","36 m/s²"], answer:1, explanation:"Newton’s second law gives a = F ÷ m = 12 ÷ 3 = 4 m/s²." },
    { id:"forces-02", grade:"Grade 7", subject:"Physics", topic:"Forces and motion", question:"What happens to an object’s motion when the resultant force on it is zero?", options:["It must stop immediately.","Its speed must increase.","It remains at rest or continues at constant velocity.","Its direction must change."], answer:2, explanation:"With zero resultant force, acceleration is zero; velocity remains constant." },
    { id:"matter-01", grade:"Grade 7", subject:"Chemistry", topic:"States of matter", question:"Which statement best describes particles in a gas?", options:["They are fixed in a regular arrangement.","They vibrate in fixed positions.","They are close together and slide past one another.","They are far apart and move randomly."], answer:3, explanation:"Gas particles are widely spaced and move rapidly in random directions." },
    { id:"matter-02", grade:"Grade 7", subject:"Chemistry", topic:"States of matter", question:"During melting, the temperature of a pure substance remains constant because energy is used to…", options:["increase particle mass.","overcome attractions between particles.","stop all particle motion.","create new atoms."], answer:1, explanation:"Energy supplied during a change of state helps overcome intermolecular attractions." },
    { id:"bio-01", grade:"Grade 7", subject:"Biology", topic:"Cells", question:"Which cell structure controls most activities of a typical plant and animal cell?", options:["Cell membrane","Nucleus","Cytoplasm","Cell wall"], answer:1, explanation:"The nucleus contains genetic material and helps control cell activities." },
    { id:"bio-02", grade:"Grade 7", subject:"Biology", topic:"Photosynthesis", question:"Which raw materials are used in photosynthesis?", options:["Oxygen and glucose","Carbon dioxide and water","Nitrogen and oxygen","Glucose and minerals"], answer:1, explanation:"Plants use carbon dioxide and water, with light energy, to make glucose and oxygen." },
    { id:"earth-01", grade:"Grade 6", subject:"Earth & Space", topic:"Water cycle", question:"Which process changes liquid water into water vapour at the surface?", options:["Condensation","Precipitation","Evaporation","Collection"], answer:2, explanation:"Evaporation occurs when liquid water gains enough energy to enter the gas state." },
    { id:"earth-02", grade:"Grade 6", subject:"Earth & Space", topic:"Water cycle", question:"Cloud droplets form mainly when water vapour…", options:["freezes inside the ground.","condenses as air cools.","evaporates from rocks.","is absorbed by plant roots."], answer:1, explanation:"Cooling air can cause water vapour to condense into tiny liquid droplets or ice crystals." }
  ];
  const $ = id => document.getElementById(id);
  const storageKey = "osdmaverick-quiz-attempts-v1";
  const readAttempts = () => { try { const v = JSON.parse(localStorage.getItem(storageKey) || "[]"); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  let current = null;
  let selected = {};
  let client = null;
  let user = null;
  let classes = [];
  const config = window.SUPABASE_CONFIG;
  const setStatus = (message, error=false) => { $("quiz-status").textContent = message; $("quiz-status").dataset.state = error ? "error" : "success"; };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function renderHistory() {
    const attempts = readAttempts().slice().reverse().slice(0,8);
    $("attempt-history").innerHTML = attempts.length ? attempts.map(a => '<li><strong>'+esc(a.quizTitle)+'</strong><span>'+esc(a.score)+'/'+esc(a.total)+' · '+esc(a.percentage)+'% · '+esc(new Date(a.submittedAt).toLocaleString())+'</span></li>').join("") : "<li>No attempts yet. Complete a quiz to see your results here.</li>";
  }
  function renderQuiz() {
    if (!current) return;
    selected = {};
    $("quiz-title").textContent = current.title;
    $("quiz-description").textContent = current.description;
    $("question-count").textContent = current.questions.length + " questions";
    $("question-list").innerHTML = current.questions.map((q,i) => '<fieldset class="quiz-question"><legend><span class="question-number">Question '+(i+1)+'</span>'+esc(q.question)+'</legend>'+q.options.map((option,j) => '<label class="quiz-option"><input type="radio" name="q-'+i+'" value="'+j+'"><span>'+esc(option)+'</span></label>').join("")+'<p class="answer-feedback" id="feedback-'+i+'" aria-live="polite"></p></fieldset>').join("");
    $("quiz-result").hidden = true;
    $("submit-quiz").disabled = false;
    $("submit-quiz").textContent = "Submit answers";
    $("question-list").querySelectorAll("input").forEach(input => input.addEventListener("change", e => { selected[e.target.name] = Number(e.target.value); $("answered-count").textContent = Object.keys(selected).length + " of " + current.questions.length + " answered"; }));
    $("answered-count").textContent = "0 of " + current.questions.length + " answered";
    $("quiz-workspace").hidden = false;
    $("quiz-picker").hidden = true;
  }
  const quizzes = [
    {id:"grade7-science-core",title:"Grade 7 Science Foundations",description:"A mixed-subject knowledge check covering Physics, Chemistry and Biology.",questions:bank.filter(q=>q.grade==="Grade 7")},
    {id:"grade6-earth-systems",title:"Grade 6 Earth & Space: Water Cycle",description:"Check your understanding of water movement through Earth's systems.",questions:bank.filter(q=>q.grade==="Grade 6")}
  ];
  function renderPicker() {
    $("quiz-options").innerHTML = quizzes.map(q=>'<button class="quiz-choice" type="button" data-quiz="'+q.id+'"><strong>'+esc(q.title)+'</strong><span>'+q.questions.length+' questions · '+esc(q.description)+'</span></button>').join("");
    $("quiz-options").querySelectorAll("[data-quiz]").forEach(b=>b.addEventListener("click",()=>{current=quizzes.find(q=>q.id===b.dataset.quiz);renderQuiz();}));
  }
  async function saveAttempt(attempt) {
    const attempts=readAttempts(); attempts.push(attempt);
    try { localStorage.setItem(storageKey,JSON.stringify(attempts)); } catch (_) { setStatus("Your browser storage is full. Export or clear older attempts before saving.",true); }
    renderHistory();
  }
  $("submit-quiz").addEventListener("click", async () => {
    if (!current) return;
    if (Object.keys(selected).length !== current.questions.length) { setStatus("Please answer every question before submitting.",true); return; }
    const score=current.questions.reduce((sum,q,i)=>sum+(selected["q-"+i]===q.answer?1:0),0);
    const percentage=Math.round(score/current.questions.length*100);
    current.questions.forEach((q,i)=>{const node=$("feedback-"+i);node.textContent=(selected["q-"+i]===q.answer?"Correct. ":"Not quite. Correct answer: "+q.options[q.answer]+". ")+q.explanation;node.dataset.correct=String(selected["q-"+i]===q.answer);});
    const attempt={id:"attempt-"+Date.now(),quizId:current.id,quizTitle:current.title,score,total:current.questions.length,percentage,answers:selected,submittedAt:new Date().toISOString()};
    await saveAttempt(attempt);
    $("quiz-result").hidden=false;
    $("quiz-score").textContent=score+" / "+current.questions.length;
    $("quiz-percent").textContent=percentage+"%";
    $("submit-quiz").disabled=true;
    $("submit-quiz").textContent="Attempt submitted";
    setStatus("Your result has been saved on this device.");
    if (client && user && classes.length) $("cloud-submit").hidden=false;
  });
  $("new-attempt").addEventListener("click",()=>{renderPicker();$("quiz-workspace").hidden=true;$("quiz-picker").hidden=false;$("cloud-submit").hidden=true;setStatus("Choose a quiz to begin.");});
  $("cloud-submit").addEventListener("click",async()=>{
    const classId=$("quiz-class").value;
    const attempt=readAttempts().at(-1);
    if(!classId||!attempt)return setStatus("Choose a class and complete a quiz first.",true);
    const result=await client.from("quiz_attempts").insert({class_id:classId,student_id:user.id,quiz_id:attempt.quizId,quiz_title:attempt.quizTitle,score:attempt.score,total:attempt.total,answers:attempt.answers,submitted_at:attempt.submittedAt});
    if(result.error)return setStatus("Cloud submission failed: "+result.error.message,true);
    $("cloud-submit").disabled=true;
    setStatus("Quiz result submitted to your selected class.");
  });
  async function connectCloud() {
    if(!config?.url||!config?.publishableKey||config.url.includes("YOUR-PROJECT-REF")||config.publishableKey.includes("YOUR-SUPABASE")||!window.supabase?.createClient){$("cloud-note").textContent="Cloud submission is optional and will be available after Supabase is configured. Your practice attempts still save on this device.";return;}
    client=window.supabase.createClient(config.url,config.publishableKey);
    const session=await client.auth.getSession();user=session.data.session?.user||null;
    if(!user){$("cloud-note").textContent="Sign in to submit results to a class. Local practice is available without signing in.";return;}
    const profile=await client.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(profile.error||profile.data?.role!=="student"){$("cloud-note").textContent="Sign in with a student account to submit quiz results to a class.";return;}
    const result=await client.from("classes").select("id,name").order("name");
    if(result.error){$("cloud-note").textContent="Class list unavailable: "+result.error.message;return;}
    classes=result.data||[];
    $("quiz-class").innerHTML='<option value="">Choose an enrolled class</option>'+classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
    $("cloud-note").textContent="Signed in. Choose an enrolled class, complete a quiz, then submit the result to your teacher.";
    $("cloud-class-wrap").hidden=false;
  }
  renderPicker();renderHistory();connectCloud().catch(e=>{$("cloud-note").textContent="Cloud submission unavailable: "+e.message;});
})();