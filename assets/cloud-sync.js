/* Phase 4: synchronise the existing browser notebook and teacher gradebook with Supabase. */
(() => {
  const config = window.SUPABASE_CONFIG;
  const status = (node, message, error = false) => {
    node.textContent = message;
    node.dataset.state = error ? "error" : "success";
  };
  const makePanel = (title, description) => {
    const panel = document.createElement("section");
    panel.className = "notebook-panel";
    panel.style.marginTop = "20px";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.className = "field-hint";
    copy.textContent = description;
    const message = document.createElement("p");
    message.className = "notebook-status";
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    panel.append(heading, copy, message);
    return { panel, message };
  };
  if (!config?.url || !config?.publishableKey ||
      config.url.includes("YOUR-PROJECT-REF") ||
      config.publishableKey.includes("YOUR-SUPABASE") ||
      !window.supabase?.createClient) return;

  const isTeacherPage = location.pathname.endsWith("teacher-dashboard.html");
  const main = document.querySelector("main");
  if (!main) return;
  const ui = makePanel(
    isTeacherPage ? "Cloud class reports" : "Cloud backup and class sync",
    isTeacherPage
      ? "Load reports submitted by students in your classes and publish rubric feedback to their accounts."
      : "Back up your investigation reports to an enrolled class so you can access them on another device and your teacher can review them."
  );
  const client = window.supabase.createClient(config.url, config.publishableKey);
  const controls = document.createElement("div");
  controls.className = "notebook-actions";
  ui.panel.append(controls);
  main.append(ui.panel);
  const button = (label, action) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "save-button";
    b.textContent = label;
    b.addEventListener("click", action);
    controls.append(b);
    return b;
  };
  const readJson = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const notebookKey = "osdmaverick-lab-notebook-v1";
  const gradebookKey = "osdmaverick-teacher-gradebook-v1";
  let user = null;
  let role = null;

  async function initialise() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    user = data.session?.user || null;
    if (!user) {
      status(ui.message, "Sign in first to use cloud sync. Your existing browser data remains available.", true);
      return;
    }
    const profileResult = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileResult.error) throw profileResult.error;
    role = profileResult.data?.role;
    if (isTeacherPage && role !== "teacher") {
      status(ui.message, "Sign in with a teacher account to load class reports.", true);
      return;
    }
    if (!isTeacherPage && role !== "student") {
      status(ui.message, "Sign in with a student account to back up notebook reports.", true);
      return;
    }
    if (isTeacherPage) {
      button("Load cloud class reports", loadTeacherReports);
      button("Sync saved grades to cloud", syncTeacherGrades);
    } else {
      const select = document.createElement("select");
      select.setAttribute("aria-label", "Class for cloud backup");
      select.style.maxWidth = "360px";
      select.add(new Option("Loading your classes…", ""));
      controls.prepend(select);
      const classes = await client.from("classes").select("id,name").order("name");
      if (classes.error) throw classes.error;
      select.replaceChildren(new Option("Choose an enrolled class", ""));
      (classes.data || []).forEach(item => select.add(new Option(item.name, item.id)));
      button("Sync notebook to cloud", () => syncStudentReports(select.value));
      button("Restore my cloud reports", () => restoreStudentReports(select.value));
      status(ui.message, "Signed in. Choose a class to sync or restore your reports.");
    }
  }

  async function syncStudentReports(classId) {
    if (!classId) return status(ui.message, "Choose a class first.", true);
    const reports = readJson(notebookKey);
    if (!reports.length) return status(ui.message, "There are no browser reports to sync.", true);
    const rows = reports.map(report => ({
      report_id: String(report.id),
      class_id: classId,
      student_id: user.id,
      payload: report,
      report_created_at: report.createdAt ? new Date(report.createdAt).toISOString() : null
    }));
    const result = await client.from("lab_reports").upsert(rows, { onConflict: "class_id,student_id,report_id" });
    if (result.error) return status(ui.message, "Cloud sync failed: " + result.error.message, true);
    status(ui.message, reports.length + " report(s) synced to your class.");
  }

  async function restoreStudentReports(classId) {
    if (!classId) return status(ui.message, "Choose a class first.", true);
    const result = await client.from("lab_reports").select("payload").eq("class_id", classId).eq("student_id", user.id);
    if (result.error) return status(ui.message, "Restore failed: " + result.error.message, true);
    const current = readJson(notebookKey);
    const merged = new Map(current.map(item => [String(item.id), item]));
    (result.data || []).forEach(row => {
      if (row.payload?.id) merged.set(String(row.payload.id), row.payload);
    });
    try {
      localStorage.setItem(notebookKey, JSON.stringify([...merged.values()]));
      status(ui.message, (result.data || []).length + " cloud report(s) restored. Reload the page to refresh the notebook list.");
    } catch (_) {
      status(ui.message, "Could not restore reports because browser storage is full.", true);
    }
  }

  async function loadTeacherReports() {
    const result = await client.from("lab_reports")
      .select("id,report_id,class_id,student_id,payload,updated_at,profiles(full_name),classes(name),lab_report_assessments(scores,feedback,assessed_at)")
      .order("updated_at", { ascending: false });
    if (result.error) return status(ui.message, "Could not load cloud reports: " + result.error.message, true);
    const entries = readJson(gradebookKey);
    const byCloudId = new Map(entries.map(item => [item.cloudReportId, item]));
    (result.data || []).forEach(row => {
      const prior = byCloudId.get(row.id);
      const assessment = row.lab_report_assessments?.[0] || null;
      byCloudId.set(row.id, {
        id: prior?.id || "cloud-" + row.id,
        cloudReportId: row.id,
        sourceKey: "cloud:" + row.id,
        student: row.profiles?.full_name || "Student",
        className: row.classes?.name || "",
        report: row.payload || {},
        importedAt: prior?.importedAt || Date.now(),
        assessment: assessment ? {
          scores: assessment.scores || {},
          feedback: assessment.feedback || "",
          assessedAt: assessment.assessed_at
        } : prior?.assessment || null
      });
    });
    try {
      localStorage.setItem(gradebookKey, JSON.stringify([...byCloudId.values()]));
      status(ui.message, (result.data || []).length + " cloud report(s) loaded into the teacher dashboard. Reload to view them in the assessment list.");
    } catch (_) {
      status(ui.message, "Could not store cloud reports because browser storage is full.", true);
    }
  }

  async function syncTeacherGrades() {
    const entries = readJson(gradebookKey).filter(item => item.cloudReportId && item.assessment);
    if (!entries.length) return status(ui.message, "No cloud-linked assessments are ready to sync.", true);
    for (const entry of entries) {
      const scores = entry.assessment.scores || {};
      const payload = {
        report_id: entry.cloudReportId,
        teacher_id: user.id,
        scores,
        feedback: entry.assessment.feedback || "",
        assessed_at: entry.assessment.assessedAt || new Date().toISOString()
      };
      const result = await client.from("lab_report_assessments").upsert(payload, { onConflict: "report_id" });
      if (result.error) return status(ui.message, "Grade sync stopped: " + result.error.message, true);
    }
    status(ui.message, entries.length + " assessment(s) synced to student accounts.");
  }

  initialise().catch(error => status(ui.message, "Cloud sync unavailable: " + error.message, true));
})();
