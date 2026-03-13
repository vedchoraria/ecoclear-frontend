import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Download,
  FilePenLine,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MOM_STORAGE_KEY = "ecoclear_mom_cases";

const initialMomCases = [
  {
    id: "EC-2023-994",
    meetingTitle: "North Basin Cleanup Review",
    assignee: "Alex Rivera",
    date: "Oct 24, 2023",
    status: "Referred",
    department: "Water Quality Dept.",
    gist:
      "Scrutiny approved. Focus on discharge control, containment zone monitoring, and compliance timeline alignment.",
    minutes: {},
  },
  {
    id: "EC-2023-991",
    meetingTitle: "Carbon Credit Allocation Q4",
    assignee: "Alex Rivera",
    date: "Oct 23, 2023",
    status: "Meeting Scheduled",
    department: "Strategic Planning",
    gist:
      "Scrutiny approved with complete documents. Committee should validate allocation methodology and reporting boundaries.",
    minutes: {},
  },
  {
    id: "EC-2023-885",
    meetingTitle: "Annual Sustainability Audit",
    assignee: "Alex Rivera",
    date: "Oct 22, 2023",
    status: "Minutes Draft",
    department: "Governance & Ethics",
    gist:
      "Committee discussion expected around variance notes and corrective action ownership.",
    minutes: {
      meetingTitle: "Annual Sustainability Audit",
      meetingType: "Audit Review",
      date: "2023-10-22",
      time: "11:00",
      location: "Main Committee Hall",
      chairperson: "R. Nair",
      minuteTaker: "Alex Rivera",
      participants: "R. Nair\nA. Sharma\nD. Gupta",
      agendaItems: "Audit scope confirmation\nVariance review\nCorrective timeline",
      discussionSummary:
        "Committee reviewed submitted audit documents and noted two unresolved variance records.",
      decisionsTaken:
        "Accept core audit report\nRequest variance closure note before final issue",
      actionItems:
        "Variance closure note - Quality Team - 2023-10-28 - Open",
      risks: "Delay in closure may impact statutory reporting.",
      nextSteps: "Collect closure note and circulate revised minutes.",
      nextMeetingSchedule: "2023-10-30 10:30 AM",
    },
  },
  {
    id: "EC-2023-882",
    meetingTitle: "Solar Farm Zoning Board",
    assignee: "Alex Rivera",
    date: "Oct 21, 2023",
    status: "Finalized",
    department: "External Relations",
    gist:
      "All required files validated by scrutiny. Zoning risk marked low with standard mitigation checklist.",
    minutes: {},
  },
];

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/mom-dashboard" },
  {
    key: "referred-cases",
    label: "Referred Cases",
    icon: FileText,
    route: "/mom-dashboard/referred-cases",
  },
  {
    key: "meeting-scheduled",
    label: "Meeting Scheduled",
    icon: CalendarClock,
    route: "/mom-dashboard/meeting-scheduled",
  },
  {
    key: "finalized",
    label: "Finalized MoM",
    icon: CheckCircle2,
    route: "/mom-dashboard/finalized",
  },
];

function MoMDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState(() => loadMomCases());

  const currentView = useMemo(() => parseMomView(location.pathname), [location.pathname]);
  const referredCases = useMemo(() => cases.filter((item) => item.status === "Referred"), [cases]);
  const meetingScheduledCases = useMemo(
    () => cases.filter((item) => item.status === "Meeting Scheduled" || item.status === "Minutes Draft"),
    [cases],
  );
  const finalizedCases = useMemo(() => cases.filter((item) => item.status === "Finalized"), [cases]);
  const editingCase = useMemo(
    () => cases.find((item) => item.id === currentView.editorId) ?? null,
    [cases, currentView.editorId],
  );
  const gistEditingCase = useMemo(
    () => cases.find((item) => item.id === currentView.gistId) ?? null,
    [cases, currentView.gistId],
  );

  useEffect(() => {
    window.localStorage.setItem(MOM_STORAGE_KEY, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    const syncFromStorage = (event) => {
      if (event.key !== MOM_STORAGE_KEY) return;
      const next = loadMomCases();
      setCases(next);
    };
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const openMinutesEditor = (caseId) => {
    window.open(`/mom-dashboard/editor/${encodeURIComponent(caseId)}`, "_blank", "noopener,noreferrer");
  };

  const openGistEditor = (caseId) => {
    window.open(`/mom-dashboard/gist/${encodeURIComponent(caseId)}`, "_blank", "noopener,noreferrer");
  };

  const scheduleMeeting = (caseId) => {
    setCases((current) =>
      current.map((item) =>
        item.id === caseId ? { ...item, status: "Meeting Scheduled" } : item,
      ),
    );
    navigate("/mom-dashboard/meeting-scheduled");
  };

  const saveDraftMinutes = (caseId, minutesPayload) => {
    setCases((current) =>
      current.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: "Minutes Draft",
              minutes: minutesPayload,
            }
          : item,
      ),
    );
  };

  const finalizeMinutes = (caseId, minutesPayload) => {
    setCases((current) =>
      current.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: "Finalized",
              minutes: minutesPayload,
            }
          : item,
      ),
    );
    navigate("/mom-dashboard/finalized");
  };

  const exportMinutesRecord = (caseId, format) => {
    const record = cases.find((item) => item.id === caseId);
    if (!record) return;

    const minutesPayload = record.minutes ?? {};
    const body = [
      `Case Ref: ${record.id}`,
      `Meeting Title: ${record.meetingTitle}`,
      `Department: ${record.department}`,
      `Status: ${record.status}`,
      "",
      `AI Gist: ${record.gist}`,
      "",
      `Minutes Summary: ${minutesPayload.discussionSummary || "Not provided"}`,
      `Decisions: ${minutesPayload.decisionsTaken || "Not provided"}`,
      `Action Items: ${minutesPayload.actionItems || "Not provided"}`,
    ].join("\n");

    const fileName =
      `${record.id}-minutes.${format === "word" ? "doc" : "pdf"}`.replace(/\s+/g, "_");
    const mimeType = format === "word" ? "application/msword" : "application/pdf";

    const blob = new Blob([body], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportGistRecord = (caseId, format) => {
    const record = cases.find((item) => item.id === caseId);
    if (!record) return;

    const fileName = `${record.id}-meeting-gist.${format === "word" ? "doc" : "pdf"}`;
    const mimeType = format === "word" ? "application/msword" : "application/pdf";
    const body = [
      `Case Ref: ${record.id}`,
      `Meeting Title: ${record.meetingTitle}`,
      `Department: ${record.department}`,
      "",
      "AI Generated Meeting Gist:",
      record.gist || "No gist available.",
    ].join("\n");

    const blob = new Blob([body], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const saveGistChanges = (caseId, gistText) => {
    setCases((current) =>
      current.map((item) => (item.id === caseId ? { ...item, gist: gistText.trim() } : item)),
    );
    navigate("/mom-dashboard/referred-cases");
  };

  const activeSidebarKey =
    currentView.type === "editor"
      ? "meeting-scheduled"
      : currentView.type === "gist-editor"
        ? "referred-cases"
        : currentView.type;

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-[#111827]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[300px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-[#f7faf8] lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#124734] text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[40px] leading-[1] tracking-tight text-[#124734]">EcoClear</p>
                <p className="-mt-0.5 text-lg text-slate-500">MoM Team Portal</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeSidebarKey;
              return (
                <button
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[28px] ${
                    isActive
                      ? "bg-[#124734] text-white shadow-[0_12px_25px_rgba(18,71,52,0.2)]"
                      : "text-[#2e4665] hover:bg-white"
                  }`}
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  type="button"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-200" />
              <div>
                <p className="text-[28px] font-semibold text-[#1f3048]">Alex Rivera</p>
                <p className="text-lg text-slate-500">MoM Specialist</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-[#f4f7f6]/95 px-6 py-4 backdrop-blur lg:px-8">
            <label className="relative hidden max-w-xl flex-1 sm:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 pl-12 pr-4 text-lg text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
                placeholder="Search cases, meetings or documents..."
                type="text"
              />
            </label>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" type="button">
                <Settings className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" type="button">
                <Bell className="h-5 w-5" />
              </button>
              <span className="mx-1 h-8 w-px bg-slate-200" />
              <div className="hidden text-right sm:block">
                <p className="text-[19px] font-semibold text-[#1f3048]">Alex Rivera</p>
                <p className="text-sm text-slate-500">MoM Specialist</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-200" />
            </div>
          </header>

          <div className="space-y-6 p-6 lg:p-8">
            {currentView.type === "dashboard" ? (
              <MomDashboardView
                finalizedCount={finalizedCases.length}
                meetingCount={meetingScheduledCases.length}
                onEditGist={openGistEditor}
                onEditMinutes={openMinutesEditor}
                onExportGist={exportGistRecord}
                onExportMinutes={exportMinutesRecord}
                onScheduleMeeting={scheduleMeeting}
                recentCases={cases.slice(0, 6)}
                referredCount={referredCases.length}
              />
            ) : null}

            {currentView.type === "referred-cases" ? (
              <MomCasesPage
                description="Cases approved by scrutiny and referred with AI-generated gist."
                onEditGist={openGistEditor}
                onEditMinutes={openMinutesEditor}
                onExportGist={exportGistRecord}
                onExportMinutes={exportMinutesRecord}
                onScheduleMeeting={scheduleMeeting}
                rows={referredCases}
                title="Referred Cases"
              />
            ) : null}

            {currentView.type === "meeting-scheduled" ? (
              <MomCasesPage
                description="Meetings are scheduled; MoM team can edit formal minutes after completion."
                onEditGist={openGistEditor}
                onEditMinutes={openMinutesEditor}
                onExportGist={exportGistRecord}
                onExportMinutes={exportMinutesRecord}
                onScheduleMeeting={scheduleMeeting}
                rows={meetingScheduledCases}
                title="Meeting Scheduled"
              />
            ) : null}

            {currentView.type === "finalized" ? (
              <MomCasesPage
                description="Finalized minutes are the last stage in this workflow."
                onEditGist={openGistEditor}
                onEditMinutes={openMinutesEditor}
                onExportGist={exportGistRecord}
                onExportMinutes={exportMinutesRecord}
                onScheduleMeeting={scheduleMeeting}
                rows={finalizedCases}
                title="Finalized MoM"
              />
            ) : null}

            {currentView.type === "editor" ? (
              <MinutesEditorPage
                caseItem={editingCase}
                onBack={() => navigate("/mom-dashboard/meeting-scheduled")}
                onFinalize={finalizeMinutes}
                onSaveDraft={saveDraftMinutes}
              />
            ) : null}

            {currentView.type === "gist-editor" ? (
              <GistEditorPage
                caseItem={gistEditingCase}
                onBack={() => navigate("/mom-dashboard/referred-cases")}
                onSave={saveGistChanges}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function MomDashboardView({
  referredCount,
  meetingCount,
  finalizedCount,
  recentCases,
  onScheduleMeeting,
  onEditGist,
  onEditMinutes,
  onExportGist,
  onExportMinutes,
}) {
  const gistsReceived = referredCount + meetingCount + finalizedCount;
  return (
    <>
      <section>
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">Team Dashboard</h1>
        <p className="mt-2 text-[29px] text-[#5a6f8d]">
          Manage and finalize meeting documentation for environmental compliance committee.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MomStatCard
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          label="Referred Cases"
          tone="bg-blue-100"
          value={referredCount}
        />
        <MomStatCard
          icon={<Sparkles className="h-5 w-5 text-violet-600" />}
          label="AI Gists Received"
          tone="bg-violet-100"
          value={gistsReceived}
        />
        <MomStatCard
          icon={<CalendarClock className="h-5 w-5 text-amber-700" />}
          label="Meeting Scheduled"
          tone="bg-amber-100"
          value={meetingCount}
        />
        <MomStatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-700" />}
          label="Finalized MoMs"
          tone="bg-emerald-100"
          value={finalizedCount}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#f9fbfa] px-6 py-4">
          <div>
            <h2 className="text-[38px] font-semibold text-[#111827]">Recent Meetings & Cases</h2>
            <p className="text-[22px] text-[#5a6f8d]">
              Gists are auto-created when scrutiny approves and refers cases.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-slate-700 hover:bg-slate-50"
            type="button"
          >
            Filter
          </button>
        </div>
        <MomCasesTable
          onEditGist={onEditGist}
          onEditMinutes={onEditMinutes}
          onExportGist={onExportGist}
          onExportMinutes={onExportMinutes}
          onScheduleMeeting={onScheduleMeeting}
          rows={recentCases}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-[34px] font-semibold text-[#1f3048]">Workflow Summary</h3>
        <ul className="mt-3 space-y-2 text-[22px] text-[#4f6583]">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-1 h-5 w-5 text-[#124734]" />
            Scrutiny-approved cases come with AI-generated meeting gist.
          </li>
          <li className="flex gap-2">
            <CalendarClock className="mt-1 h-5 w-5 text-[#124734]" />
            Case moves to Meeting Scheduled before minutes editing.
          </li>
          <li className="flex gap-2">
            <FilePenLine className="mt-1 h-5 w-5 text-[#124734]" />
            MoM team edits Formal Minutes template and sets final status.
          </li>
        </ul>
      </section>
    </>
  );
}

function MomCasesPage({
  title,
  description,
  rows,
  onScheduleMeeting,
  onEditGist,
  onEditMinutes,
  onExportGist,
  onExportMinutes,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">{title}</h1>
        <p className="mt-2 text-[29px] text-[#5a6f8d]">{description}</p>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f9fbfa] px-6 py-4">
          <h2 className="text-[34px] font-semibold text-[#111827]">{title} List</h2>
        </div>
        <MomCasesTable
          onEditGist={onEditGist}
          onEditMinutes={onEditMinutes}
          onExportGist={onExportGist}
          onExportMinutes={onExportMinutes}
          onScheduleMeeting={onScheduleMeeting}
          rows={rows}
        />
      </article>
    </section>
  );
}

function MomCasesTable({
  rows,
  onScheduleMeeting,
  onEditGist,
  onEditMinutes,
  onExportGist,
  onExportMinutes,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-slate-200 bg-[#f6f9f7]">
          <tr>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Case Ref
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Meeting Title
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Date
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Status
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Assignee
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-[21px] text-[#5c6f89]" colSpan={6}>
                No cases in this stage.
              </td>
            </tr>
          ) : null}
          {rows.map((row) => (
            <tr className="border-b border-slate-100 last:border-b-0" key={row.id}>
              <td className="px-5 py-3">
                <span className="rounded-md bg-[#e8f2eb] px-2.5 py-1 text-[20px] font-semibold text-[#124734]">
                  {row.id}
                </span>
              </td>
              <td className="px-5 py-3">
                <p className="text-[24px] font-semibold text-[#1f3048]">{row.meetingTitle}</p>
                <p className="text-[20px] text-[#5a6f8d]">{row.department}</p>
              </td>
              <td className="px-5 py-3 text-[22px] text-[#5c6f89]">{row.date}</td>
              <td className="px-5 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-5 py-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f2f6f5] px-2.5 py-1">
                  <div className="h-6 w-6 rounded-full bg-slate-300" />
                  <span className="text-[18px] font-semibold text-[#2e4665]">{row.assignee}</span>
                </div>
              </td>
              <td className="px-5 py-3">
                {row.status === "Referred" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[20px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                      onClick={() => onEditGist(row.id)}
                      type="button"
                    >
                      View / Edit Gist
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[20px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                      onClick={() => onScheduleMeeting(row.id)}
                      type="button"
                    >
                      Schedule Meeting
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                {row.status === "Meeting Scheduled" || row.status === "Minutes Draft" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {row.status === "Meeting Scheduled" ? (
                      <details className="relative inline-block text-left">
                        <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[18px] font-semibold text-[#124734] hover:bg-[#f2f8f4]">
                          <Download className="h-4 w-4" />
                          Download Gist
                        </summary>
                        <div className="absolute right-0 z-10 mt-2 min-w-[190px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#1f3048] hover:bg-slate-50"
                            onClick={() => onExportGist(row.id, "word")}
                            type="button"
                          >
                            Export as Word
                          </button>
                          <button
                            className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#1f3048] hover:bg-slate-50"
                            onClick={() => onExportGist(row.id, "pdf")}
                            type="button"
                          >
                            Export as PDF
                          </button>
                        </div>
                      </details>
                    ) : null}

                    {row.status === "Minutes Draft" ? (
                      <button
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[20px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                        onClick={() => onEditMinutes(row.id)}
                        type="button"
                      >
                        Edit Minutes
                        <FilePenLine className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {row.status === "Finalized" ? (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-slate-200 bg-white p-2 text-[#567091] hover:bg-slate-50"
                      type="button"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <details className="relative inline-block text-left">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[18px] font-semibold text-[#124734] hover:bg-[#f2f8f4]">
                        <Download className="h-4 w-4" />
                        Download
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 min-w-[190px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                        <button
                          className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#1f3048] hover:bg-slate-50"
                          onClick={() => onExportMinutes(row.id, "word")}
                          type="button"
                        >
                          Export as Word
                        </button>
                        <button
                          className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#1f3048] hover:bg-slate-50"
                          onClick={() => onExportMinutes(row.id, "pdf")}
                          type="button"
                        >
                          Export as PDF
                        </button>
                      </div>
                    </details>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GistEditorPage({ caseItem, onBack, onSave }) {
  const [gistText, setGistText] = useState(caseItem?.gist ?? "");

  useEffect(() => {
    setGistText(caseItem?.gist ?? "");
  }, [caseItem]);

  if (!caseItem) {
    return (
      <section className="space-y-4">
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">Gist Not Found</h1>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-[#445a78] hover:bg-slate-50"
          onClick={onBack}
          type="button"
        >
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">
            Edit AI Generated Gist
          </h1>
          <p className="mt-2 text-[29px] text-[#5a6f8d]">
            Referred case {caseItem.id} - {caseItem.meetingTitle}
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-[#445a78] hover:bg-slate-50"
          onClick={onBack}
          type="button"
        >
          Back
        </button>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-xl border border-slate-200 bg-[#f9fbfa] p-4">
          <p className="text-[18px] font-semibold text-[#536a87]">Case Ref</p>
          <p className="text-[22px] font-semibold text-[#1f3048]">{caseItem.id}</p>
          <p className="mt-2 text-[18px] font-semibold text-[#536a87]">Department</p>
          <p className="text-[22px] text-[#1f3048]">{caseItem.department}</p>
        </div>

        <label className="mt-4 block">
          <span className="block text-[18px] font-semibold text-[#536a87]">Meeting Gist</span>
          <textarea
            className="mt-1 min-h-[220px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[19px] text-[#1f3048] outline-none focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
            onChange={(event) => setGistText(event.target.value)}
            value={gistText}
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#124734] px-4 py-2.5 text-[20px] font-semibold text-white shadow-[0_12px_24px_rgba(18,71,52,0.2)] hover:bg-[#0f3a2b]"
            onClick={() => onSave(caseItem.id, gistText)}
            type="button"
          >
            Save Gist Changes
          </button>
        </div>
      </article>
    </section>
  );
}

function MinutesEditorPage({ caseItem, onBack, onSaveDraft, onFinalize }) {
  const [form, setForm] = useState(() => buildTemplateState(caseItem));

  useEffect(() => {
    setForm(buildTemplateState(caseItem));
  }, [caseItem]);

  if (!caseItem) {
    return (
      <section className="space-y-4">
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">Editor Not Found</h1>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-[#445a78] hover:bg-slate-50"
          onClick={onBack}
          type="button"
        >
          Back
        </button>
      </section>
    );
  }

  const onFieldChange = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">
            Edit Minutes
          </h1>
          <p className="mt-2 text-[29px] text-[#5a6f8d]">
            Formal Minutes of Meeting Template for {caseItem.id}
          </p>
        </div>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-[#445a78] hover:bg-slate-50"
          onClick={onBack}
          type="button"
        >
          Back
        </button>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <TemplateInput label="Meeting Title" onChange={onFieldChange("meetingTitle")} value={form.meetingTitle} />
          <TemplateInput label="Meeting Type" onChange={onFieldChange("meetingType")} value={form.meetingType} />
          <TemplateInput label="Date" onChange={onFieldChange("date")} type="date" value={form.date} />
          <TemplateInput label="Time" onChange={onFieldChange("time")} type="time" value={form.time} />
          <TemplateInput label="Location" onChange={onFieldChange("location")} value={form.location} />
          <TemplateInput label="Chairperson" onChange={onFieldChange("chairperson")} value={form.chairperson} />
          <TemplateInput label="Minute Taker" onChange={onFieldChange("minuteTaker")} value={form.minuteTaker} />
        </div>

        <div className="mt-4 grid gap-3">
          <TemplateTextArea label="Participants" onChange={onFieldChange("participants")} value={form.participants} />
          <TemplateTextArea label="Agenda Items" onChange={onFieldChange("agendaItems")} value={form.agendaItems} />
          <TemplateTextArea
            label="Summary of Discussion"
            onChange={onFieldChange("discussionSummary")}
            value={form.discussionSummary}
          />
          <TemplateTextArea
            label="Decisions Taken"
            onChange={onFieldChange("decisionsTaken")}
            value={form.decisionsTaken}
          />
          <TemplateTextArea label="Action Items" onChange={onFieldChange("actionItems")} value={form.actionItems} />
          <TemplateTextArea label="Risks / Concerns Raised" onChange={onFieldChange("risks")} value={form.risks} />
          <TemplateTextArea label="Next Steps" onChange={onFieldChange("nextSteps")} value={form.nextSteps} />
          <TemplateInput
            label="Next Meeting Schedule"
            onChange={onFieldChange("nextMeetingSchedule")}
            value={form.nextMeetingSchedule}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[20px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
            onClick={() => onSaveDraft(caseItem.id, form)}
            type="button"
          >
            Save Draft
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-[#124734] px-4 py-2.5 text-[20px] font-semibold text-white shadow-[0_12px_24px_rgba(18,71,52,0.2)] hover:bg-[#0f3a2b]"
            onClick={() => onFinalize(caseItem.id, form)}
            type="button"
          >
            Finalize Minutes
          </button>
        </div>
      </article>
    </section>
  );
}

function MomStatCard({ label, value, icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          {icon}
        </span>
        <span className="text-[22px] font-semibold text-emerald-600">+6%</span>
      </div>
      <p className="mt-3 text-[29px] text-[#5b6d87]">{label}</p>
      <p className="text-5xl font-semibold tracking-tight text-[#111827]">{value}</p>
    </article>
  );
}

function TemplateInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[18px] font-semibold text-[#536a87]">{label}</span>
      <input
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[19px] text-[#1f3048] outline-none focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
        onChange={onChange}
        type={type}
        value={value}
      />
    </label>
  );
}

function TemplateTextArea({ label, value, onChange }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[18px] font-semibold text-[#536a87]">{label}</span>
      <textarea
        className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[19px] text-[#1f3048] outline-none focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
        onChange={onChange}
        value={value}
      />
    </label>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Referred: "bg-amber-100 text-amber-700",
    "Meeting Scheduled": "bg-blue-100 text-blue-700",
    "Minutes Draft": "bg-violet-100 text-violet-700",
    Finalized: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[16px] font-semibold ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

function parseMomView(pathname) {
  const normalized = pathname.replace(/\/+$/, "");
  const gistMatch = normalized.match(/^\/mom-dashboard\/gist\/([^/]+)$/);
  if (gistMatch) {
    return { type: "gist-editor", gistId: decodeURIComponent(gistMatch[1]) };
  }
  const editorMatch = normalized.match(/^\/mom-dashboard\/editor\/([^/]+)$/);
  if (editorMatch) {
    return { type: "editor", editorId: decodeURIComponent(editorMatch[1]) };
  }
  if (normalized === "/mom-dashboard/referred-cases") {
    return { type: "referred-cases" };
  }
  if (normalized === "/mom-dashboard/meeting-scheduled") {
    return { type: "meeting-scheduled" };
  }
  if (normalized === "/mom-dashboard/finalized") {
    return { type: "finalized" };
  }
  return { type: "dashboard" };
}

function buildTemplateState(caseItem) {
  if (!caseItem) {
    return {
      meetingTitle: "",
      meetingType: "",
      date: "",
      time: "",
      location: "",
      chairperson: "",
      minuteTaker: "",
      participants: "",
      agendaItems: "",
      discussionSummary: "",
      decisionsTaken: "",
      actionItems: "",
      risks: "",
      nextSteps: "",
      nextMeetingSchedule: "",
    };
  }

  const base = caseItem.minutes ?? {};
  return {
    meetingTitle: base.meetingTitle ?? caseItem.meetingTitle,
    meetingType: base.meetingType ?? "Committee Review",
    date: base.date ?? "",
    time: base.time ?? "",
    location: base.location ?? "",
    chairperson: base.chairperson ?? "",
    minuteTaker: base.minuteTaker ?? caseItem.assignee,
    participants: base.participants ?? "",
    agendaItems: base.agendaItems ?? caseItem.gist,
    discussionSummary: base.discussionSummary ?? caseItem.gist,
    decisionsTaken: base.decisionsTaken ?? "",
    actionItems: base.actionItems ?? "",
    risks: base.risks ?? "",
    nextSteps: base.nextSteps ?? "",
    nextMeetingSchedule: base.nextMeetingSchedule ?? "",
  };
}

function loadMomCases() {
  try {
    const raw = window.localStorage.getItem(MOM_STORAGE_KEY);
    if (!raw) return initialMomCases;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialMomCases;
    return parsed;
  } catch {
    return initialMomCases;
  }
}

export default MoMDashboard;
