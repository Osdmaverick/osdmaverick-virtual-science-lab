(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const status = $("content-status");
  const setStatus = (message, error = false) => {
    status.textContent = message;
    status.dataset.state = error ? "error" : "success";
  };
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey ||
      config.url.includes("YOUR-PROJECT-REF") ||
      config.publishableKey.includes("YOUR-SUPABASE")) {
    $("content-workspace").hidden = true;
    setStatus("Content studio is not connected yet. Configure Supabase and apply migrations 1–7.", true);
    return;
  }
  if (!window.supabase?.createClient) {
    setStatus("The authentication library could not load. Check your connection and reload.", true);
    return;
  }

  const client = window.supabase.createClient(config.url, config.publishableKey);
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };
  const button = (parent, label, className, action) => {
    const node = make("button", className, label);
    node.type = "button";
    node.addEventListener("click", action);
    parent.append(node);
    return node;
  };
  const lines = value => String(value || "").split("\n").map(v => v.trim()).filter(Boolean);
  const join = value => Array.isArray(value) ? value.join("\n") : "";
  const typeLabel = value => ({lesson:"Lesson",practical:"Practical activity",resource:"Learning resource",question:"Question-bank item"}[value] || value);
  let user = null;
  let role = null;
  let classes = [];
  let classMap = new Map();
  let editingId = null;
  let items = [];

  function updateTypeFields() {
    const type = $("content-type").value;
    $("field-body").hidden = type === "resource";
    $("field-objectives").hidden = type === "resource" || type === "question";
    $("field-materials").hidden = type !== "practical";
    $("field-procedure").hidden = type !== "practical";
    $("field-safety").hidden = type !== "practical";
    $("field-url").hidden = type !== "resource";
    $("field-options").hidden = type !== "question";
    $("content-body-label").textContent = type === "question" ? "Question prompt" : "Lesson / activity content";
    $("content-body").required = type !== "resource";
    $("content-options").required = type === "question";
    $("content-correct").required = type === "question";
  }

  function resetForm() {
    editingId = null;
    $("content-form").reset();\n    $("content-class").disabled = false;
    $("content-form-heading").textContent = "Create teaching content";
    $("content-cancel-edit").hidden = true;
    updateTypeFields();
  }

  function formPayload(intent) {
    const type = $("content-type").value;
    const options = lines($("content-options").value);
    const url = $("content-url").value.trim();
    if (url && !/^https?:\/\//i.test(url)) throw new Error("Resource links must begin with https:// or http://.");
    if (type === "practical" && !lines($("content-procedure").value).length) throw new Error("Add at least one practical procedure step.");
    if (type === "question" && (options.length < 2 || options.length > 6)) throw new Error("Add between two and six answer options.");\n    if (type === "question" && Number($("content-correct").value) > options.length) throw new Error("Choose a correct option that exists in your answer list.");\n    if (type === "question" && $("content-body").value.trim().length > 3000) throw new Error("Question prompts must be 3,000 characters or fewer.");
    return {
      class_id: $("content-class").value,
      teacher_id: user.id,
      content_type: type,
      title: $("content-title").value.trim(),
      grade_level: Number($("content-grade").value),
      subject: $("content-subject").value,
      topic: $("content-topic").value.trim(),
      summary: $("content-summary").value.trim(),
      content_body: type === "resource" ? "" : $("content-body").value.trim(),
      objectives: type === "lesson" || type === "practical" ? lines($("content-objectives").value) : [],
      materials: type === "practical" ? lines($("content-materials").value) : [],
      procedure_steps: type === "practical" ? lines($("content-procedure").value) : [],
      safety_notes: type === "practical" ? $("content-safety").value.trim() : "",
      resource_url: type === "resource" ? url : "",
      question_options: type === "question" ? options : [],
      correct_option: type === "question" ? Number($("content-correct").value) : null,
      explanation: type === "question" ? $("content-explanation").value.trim() : "",
      status: intent,
      published_at: intent === "published" ? new Date().toISOString() : null
    };
  }

  function addLines(parent, heading, values) {
    if (!values?.length) return;
    parent.append(make("h4", "", heading));
    const list = make("ul");
    values.forEach(value => list.append(make("li", "", value)));
    parent.append(list);
  }

  function renderCard(item, teacherView) {
    const card = make("article", "content-card");
    card.append(make("p", "content-meta", (classMap.get(item.class_id)?.name || "Class") + " · Grade " + item.grade_level + " · " + item.subject));
    card.append(make("span", "content-tag", typeLabel(item.content_type) + " · " + item.status));
    card.append(make("h3", "", item.title));
    card.append(make("p", "content-meta", item.topic));
    if (item.summary) card.append(make("p", "", item.summary));
    if (item.content_body) card.append(make("p", "", item.content_body));
    addLines(card, "Learning objectives", item.objectives);
    addLines(card, "Materials", item.materials);
    addLines(card, "Procedure", item.procedure_steps);
    if (item.safety_notes) {
      card.append(make("h4", "", "Safety notes"), make("p", "", item.safety_notes));
    }
    if (item.resource_url) {
      const link = make("a", "content-link", "Open learning resource");
      link.href = item.resource_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      card.append(link);
    }
    if (item.content_type === "question" && teacherView) {
      addLines(card, "Answer options", item.question_options.map((v,i)=>(i+1)+". "+v));
      card.append(make("p", "content-meta", "Correct option: " + item.correct_option));
      if (item.explanation) card.append(make("p", "", "Explanation: " + item.explanation));
    }
    if (teacherView) {
      const actions = make("div", "content-actions");
      button(actions, "Edit", "secondary", () => beginEdit(item));
      if (item.status === "draft") button(actions, "Publish", "", () => changeStatus(item, "published"));
      if (item.status === "published") button(actions, "Unpublish", "secondary", () => changeStatus(item, "draft"));
      if (item.status !== "archived") button(actions, "Archive", "secondary", () => changeStatus(item, "archived"));
      button(actions, "Delete", "danger", () => removeItem(item));
      card.append(actions);
    }
    return card;
  }

  async function loadItems() {
    const list = $("content-list");
    list.replaceChildren();
    const selectedClass = $("content-filter").value;
    const ids = selectedClass ? [selectedClass] : classes.map(item => item.id);
    if (!ids.length) {
      list.append(make("p", "content-empty", role === "teacher" ? "Create a class first to organise teaching content." : "Join a class to view its published lessons and activities."));
      return;
    }
    let query = client.from("teacher_content_items")
      .select("id,class_id,teacher_id,content_type,title,grade_level,subject,topic,summary,content_body,objectives,materials,procedure_steps,safety_notes,resource_url,question_options,correct_option,explanation,status,published_at,updated_at")
      .in("class_id", ids).order("updated_at", {ascending:false});
    if (role === "student") query = query.eq("status", "published").in("content_type", ["lesson","practical","resource"]);
    const {data,error} = await query;
    if (error) {
      list.append(make("p","content-empty","Content could not be loaded: "+error.message));
      return;
    }
    items = data || [];
    if (!items.length) {
      list.append(make("p","content-empty",role === "teacher" ? "No content yet. Create a lesson, practical, resource or question-bank item." : "No published learning content is available in this class yet."));
      return;
    }
    items.forEach(item => list.append(renderCard(item, role === "teacher")));
  }

  function beginEdit(item) {
    editingId = item.id;
    $("content-class").value = item.class_id;\n    $("content-class").disabled = true;
    $("content-type").value = item.content_type;
    $("content-grade").value = String(item.grade_level);
    $("content-subject").value = item.subject;
    $("content-title").value = item.title;
    $("content-topic").value = item.topic;
    $("content-summary").value = item.summary || "";
    $("content-body").value = item.content_body || "";
    $("content-objectives").value = join(item.objectives);
    $("content-materials").value = join(item.materials);
    $("content-procedure").value = join(item.procedure_steps);
    $("content-safety").value = item.safety_notes || "";
    $("content-url").value = item.resource_url || "";
    $("content-options").value = join(item.question_options);
    $("content-correct").value = String(item.correct_option || 1);
    $("content-explanation").value = item.explanation || "";
    $("content-form-heading").textContent = "Edit teaching content";
    $("content-cancel-edit").hidden = false;
    updateTypeFields();
    $("content-form-heading").scrollIntoView({behavior:"smooth",block:"start"});
  }

  async function changeStatus(item, nextStatus) {
    const updates = {status:nextStatus,published_at:nextStatus === "published" ? new Date().toISOString() : null};
    const {error} = await client.from("teacher_content_items").update(updates).eq("id",item.id);
    if (error) return setStatus("Content status could not be changed: "+error.message,true);
    setStatus(typeLabel(item.content_type)+" "+(nextStatus === "published" ? "published." : nextStatus === "archived" ? "archived." : "returned to drafts."));
    await loadItems();
  }

  async function removeItem(item) {
    if (!window.confirm("Delete “"+item.title+"”? This cannot be undone.")) return;
    const {error} = await client.from("teacher_content_items").delete().eq("id",item.id);
    if (error) return setStatus("Content could not be deleted: "+error.message,true);
    setStatus("Content deleted.");
    await loadItems();
  }

  async function initialise() {
    const {data:sessionData,error:sessionError} = await client.auth.getSession();
    if (sessionError) return setStatus(sessionError.message,true);
    user = sessionData.session?.user || null;
    if (!user) {
      $("content-workspace").hidden = true;
      $("content-login-prompt").hidden = false;
      return setStatus("Sign in with a teacher account to access the content studio.");
    }
    const {data:profile,error:profileError} = await client.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
    if (profileError || !profile) return setStatus("Your account profile is unavailable. Apply the Phase 1 profiles migration and sign in again.",true);
    role = profile.role;
    $("content-account").textContent = (profile.full_name || user.email)+" · "+(role === "teacher" ? "Teacher" : "Student");
    $("content-workspace").hidden = false;
    $("content-login-prompt").hidden = true;
    $("content-create-panel").hidden = role !== "teacher";
    const classQuery = client.from("classes").select("id,name,teacher_id").order("created_at",{ascending:false});
    const {data:classData,error:classError} = role === "teacher" ? await classQuery.eq("teacher_id",user.id) : await classQuery;
    if (classError) return setStatus("Classes could not be loaded: "+classError.message,true);
    classes = classData || [];
    classMap = new Map(classes.map(item=>[item.id,item]));
    const select = $("content-class");
    select.replaceChildren(new Option("Choose a class",""));
    classes.forEach(item=>select.add(new Option(item.name,item.id)));
    const filter = $("content-filter");
    filter.replaceChildren(new Option("All your classes",""));
    classes.forEach(item=>filter.add(new Option(item.name,item.id)));
    $("content-list-heading").textContent = role === "teacher" ? "Your teaching content" : "Published class content";
    $("content-filter").addEventListener("change",loadItems);
    await loadItems();
    setStatus(role === "teacher" ? "Content studio ready. Drafts are private until published." : "Showing published learning content for your classes.");
  }

  $("content-type").addEventListener("change",updateTypeFields);
  $("content-cancel-edit").addEventListener("click",resetForm);
  $("content-form").addEventListener("submit",async event=>{
    event.preventDefault();
    const intent = event.submitter?.value === "published" ? "published" : "draft";
    const saveButtons = [$("content-save-draft"),$("content-publish")];
    saveButtons.forEach(node=>node.disabled=true);
    try {
      const payload = formPayload(intent);
      const result = editingId
        ? await client.from("teacher_content_items").update(payload).eq("id",editingId)
        : await client.from("teacher_content_items").insert(payload);
      if (result.error) throw result.error;
      setStatus(typeLabel(payload.content_type)+(intent === "published" ? " published for enrolled students." : " saved as a draft."));
      resetForm();
      await loadItems();
    } catch(error) {
      setStatus(error.message || "Content could not be saved.",true);
    } finally {
      saveButtons.forEach(node=>node.disabled=false);
    }
  });
  $("content-signout").addEventListener("click",async()=>{
    const {error} = await client.auth.signOut();
    if (error) return setStatus(error.message,true);
    window.location.href="auth.html";
  });
  updateTypeFields();
  initialise();
})();
