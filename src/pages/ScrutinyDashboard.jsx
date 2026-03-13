import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const initialScrutinyCases = [
  {
    id: "APP-29402",
    entity: "GreenWave Energy Corp",
    projectName: "Chemical Plant Upgrade",
    category: "Industrial Waste Sector",
    dateSubmitted: "Oct 12, 2023",
    status: "Under Scrutiny",
    priority: "High",
    notes: "Initial impact study needs cross-check of toxic runoff controls.",
    documents: ["EIA_Report.pdf", "Site_Plan.pdf", "Water_Sampling.pdf"],
  },
  {
    id: "APP-29405",
    entity: "Terraform Dynamics",
    projectName: "Urban Expansion Package",
    category: "Infrastructure Sector",
    dateSubmitted: "Oct 14, 2023",
    status: "Submitted",
    priority: "Normal",
    notes: "Project moved to scrutiny queue after submission verification.",
    documents: ["Layout_MasterPlan.pdf", "Compliance_Checklist.pdf"],
  },
  {
    id: "APP-29408",
    entity: "Solaris Grid Labs",
    projectName: "Solar Farm Delta",
    category: "Renewable Energy Sector",
    dateSubmitted: "Oct 15, 2023",
    status: "Referred to MoM",
    priority: "Normal",
    notes: "All documents verified and referred to MoM team.",
    documents: ["Panel_Specs.pdf", "Site_Survey.pdf", "Impact_Summary.pdf"],
  },
  {
    id: "APP-29412",
    entity: "HydroPure Systems",
    projectName: "Water Treatment Expansion",
    category: "Infrastructure Sector",
    dateSubmitted: "Oct 15, 2023",
    status: "Deficiency",
    priority: "High",
    notes: "Structural certificate and annexures are missing.",
    documents: ["Plant_Overview.pdf"],
  },
];

const sidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/scrutiny-dashboard" },
  {
    key: "under-scrutiny",
    label: "Under Scrutiny",
    icon: Search,
    route: "/scrutiny-dashboard/under-scrutiny",
  },
  {
    key: "deficiencies",
    label: "Deficiencies",
    icon: AlertTriangle,
    route: "/scrutiny-dashboard/deficiencies",
  },
  {
    key: "referred-cases",
    label: "Referred Cases",
    icon: Share2,
    route: "/scrutiny-dashboard/referred-cases",
  },
];

function ScrutinyDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cases, setCases] = useState(initialScrutinyCases);
  const [reviewNote, setReviewNote] = useState("");

  const currentView = useMemo(() => getViewFromPath(location.pathname), [location.pathname]);

  const underScrutinyCases = useMemo(
    () => cases.filter((item) => item.status === "Under Scrutiny" || item.status === "Submitted"),
    [cases],
  );
  const deficiencyCases = useMemo(
    () => cases.filter((item) => item.status === "Deficiency"),
    [cases],
  );
  const referredCases = useMemo(
    () => cases.filter((item) => item.status === "Referred to MoM"),
    [cases],
  );
  const highPriorityCases = useMemo(
    () => underScrutinyCases.filter((item) => item.priority === "High"),
    [underScrutinyCases],
  );

  const selectedCase = useMemo(
    () => cases.find((item) => item.id === currentView.reviewId) ?? null,
    [cases, currentView.reviewId],
  );

  const activeSidebarKey =
    currentView.type === "review" ? "under-scrutiny" : currentView.type;

  const openReviewInNewWindow = (caseId) => {
    window.open(
      `/scrutiny-dashboard/review/${encodeURIComponent(caseId)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const downloadMockPdf = (caseId, fileName) => {
    const mockPdfContent = [
      "%PDF-1.1",
      `EcoClear Mock Document`,
      `Application: ${caseId}`,
      `File: ${fileName}`,
      "Generated for hackathon demo flow.",
    ].join("\n");
    const blob = new Blob([mockPdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const approveCase = (caseId) => {
    setCases((current) =>
      current.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: "Referred to MoM",
              notes: reviewNote.trim() || item.notes,
            }
          : item,
      ),
    );
    setReviewNote("");
    navigate("/scrutiny-dashboard/referred-cases");
  };

  const raiseDeficiency = (caseId) => {
    setCases((current) =>
      current.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: "Deficiency",
              notes: reviewNote.trim() || "Deficiency raised during document review.",
            }
          : item,
      ),
    );
    setReviewNote("");
    navigate("/scrutiny-dashboard/deficiencies");
  };

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
                <p className="text-[40px] leading-[1] tracking-tight text-[#124734]">
                  EcoClear
                </p>
                <p className="-mt-0.5 text-lg text-slate-500">Scrutiny Team Portal</p>
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
            <div className="mt-3 flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-200" />
              <div>
                <p className="text-[28px] font-semibold text-[#1f3048]">Alex Henderson</p>
                <p className="text-lg text-slate-500">Lead Scrutinizer</p>
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
                placeholder="Search applications..."
                type="text"
              />
            </label>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" type="button">
                <Bell className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-white" type="button">
                <Settings className="h-5 w-5" />
              </button>
              <span className="mx-1 h-8 w-px bg-slate-200" />
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[22px] font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
              >
                <Download className="h-[18px] w-[18px]" />
                Export Report
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#124734] px-4 py-2.5 text-[22px] font-semibold text-white shadow-[0_12px_24px_rgba(18,71,52,0.2)] hover:bg-[#0f3a2b]"
                type="button"
              >
                <Plus className="h-[18px] w-[18px]" />
                New Case
              </button>
            </div>
          </header>

          <div className="space-y-6 p-6 lg:p-8">
            {currentView.type === "dashboard" ? (
              <DashboardSection
                deficiencyCount={deficiencyCases.length}
                highPriorityCases={highPriorityCases}
                onReview={openReviewInNewWindow}
                referredCount={referredCases.length}
                underScrutinyCases={underScrutinyCases}
              />
            ) : null}

            {currentView.type === "under-scrutiny" ? (
              <CasesPage
                cases={underScrutinyCases}
                description="New applications submitted by proponents are reviewed here."
                onReview={openReviewInNewWindow}
                title="Under Scrutiny"
              />
            ) : null}

            {currentView.type === "deficiencies" ? (
              <CasesPage
                cases={deficiencyCases}
                description="Cases with missing or invalid documents are listed as deficiencies."
                onReview={openReviewInNewWindow}
                title="Deficiencies"
              />
            ) : null}

            {currentView.type === "referred-cases" ? (
              <CasesPage
                cases={referredCases}
                description="Approved cases are referred to MoM for meeting and minutes generation."
                onReview={openReviewInNewWindow}
                showAction={false}
                title="Referred Cases"
              />
            ) : null}

            {currentView.type === "review" ? (
              <ReviewPage
                caseItem={selectedCase}
                onApprove={approveCase}
                onBack={() => navigate("/scrutiny-dashboard/under-scrutiny")}
                onDownload={downloadMockPdf}
                onRaiseDeficiency={raiseDeficiency}
                reviewNote={reviewNote}
                setReviewNote={setReviewNote}
              />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardSection({
  underScrutinyCases,
  deficiencyCount,
  referredCount,
  highPriorityCases,
  onReview,
}) {
  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">
            Scrutiny Dashboard
          </h1>
          <p className="mt-2 text-[29px] text-[#5a6f8d]">
            Manage and track application review workflows in real-time.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          description="Includes newly submitted applications"
          icon={<Search className="h-5 w-5 text-[#91a5c4]" />}
          title="Under Scrutiny"
          value={underScrutinyCases.length}
        />
        <StatCard
          description="Missing documents or incomplete responses"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          title="Deficiency Raised"
          value={deficiencyCount}
        />
        <StatCard
          description="Approved and sent to MoM team"
          icon={<Share2 className="h-5 w-5 text-[#91a5c4]" />}
          title="Referred Cases"
          value={referredCount}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#f9fbfa] px-6 py-4">
            <h2 className="text-[38px] font-semibold text-[#111827]">
              Recent Scrutiny Reviews
            </h2>
            <label className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[20px] text-[#1f3048] outline-none focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
                placeholder="Search applications..."
                type="text"
              />
            </label>
          </div>
          <CasesTable cases={underScrutinyCases} onReview={onReview} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-[38px] font-semibold text-[#111827]">High Priority Reviews</h3>
          <div className="mt-3 space-y-3">
            {highPriorityCases.length === 0 ? (
              <p className="text-[20px] text-[#5c6f89]">No high priority cases.</p>
            ) : null}
            {highPriorityCases.map((item, index) => (
              <div className="rounded-xl border border-slate-200 bg-[#fcfdfc] p-3" key={item.id}>
                <div
                  className={`h-32 rounded-lg ${
                    index % 2 === 0
                      ? "bg-gradient-to-br from-sky-300 to-sky-600"
                      : "bg-gradient-to-br from-emerald-300 to-emerald-700"
                  }`}
                />
                <p className="mt-3 text-[26px] font-semibold text-[#1f3048]">
                  #{item.id} - {item.projectName}
                </p>
                <p className="mt-1 text-[20px] text-[#5c6f89]">{item.notes}</p>
                <button
                  className="mt-3 w-full rounded-lg bg-[#124734] px-3 py-2 text-[20px] font-semibold text-white hover:bg-[#0f3a2b]"
                  onClick={() => onReview(item.id)}
                  type="button"
                >
                  Open Scrutiny File
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}

function CasesPage({ title, description, cases, onReview, showAction = true }) {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">{title}</h1>
        <p className="mt-2 text-[29px] text-[#5a6f8d]">{description}</p>
      </div>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#f9fbfa] px-6 py-4">
          <h2 className="text-[34px] font-semibold text-[#111827]">{title} List</h2>
        </div>
        <CasesTable cases={cases} onReview={onReview} showAction={showAction} />
      </article>
    </section>
  );
}

function CasesTable({ cases, onReview, showAction = true }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="border-b border-slate-200 bg-[#f6f9f7]">
          <tr>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Application ID
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Applicant Entity
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Date Submitted
            </th>
            <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
              Status
            </th>
            {showAction ? (
              <th className="px-5 py-3 text-left text-[20px] font-semibold text-[#536a87]">
                Action
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {cases.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-[21px] text-[#5c6f89]" colSpan={showAction ? 5 : 4}>
                No applications in this bucket.
              </td>
            </tr>
          ) : null}
          {cases.map((item) => (
            <tr className="border-b border-slate-100 last:border-b-0" key={item.id}>
              <td className="px-5 py-3 text-[22px] font-semibold text-[#1f3048]">#{item.id}</td>
              <td className="px-5 py-3 text-[22px] text-[#1f3048]">{item.entity}</td>
              <td className="px-5 py-3 text-[22px] text-[#5c6f89]">{item.dateSubmitted}</td>
              <td className="px-5 py-3">
                <StatusBadge status={item.status} />
              </td>
              {showAction ? (
                <td className="px-5 py-3">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[20px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                    onClick={() => onReview(item.id)}
                    type="button"
                  >
                    Review
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReviewPage({
  caseItem,
  onBack,
  onDownload,
  onApprove,
  onRaiseDeficiency,
  reviewNote,
  setReviewNote,
}) {
  if (!caseItem) {
    return (
      <section className="space-y-4">
        <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">
          Review Not Found
        </h1>
        <button
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[20px] font-semibold text-[#445a78] hover:bg-slate-50"
          onClick={onBack}
          type="button"
        >
          Back to Under Scrutiny
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight text-[#111f3b]">
            Application Review
          </h1>
          <p className="mt-2 text-[29px] text-[#5a6f8d]">
            Scrutiny review for #{caseItem.id}
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

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[34px] font-semibold text-[#111827]">
            Proponent Submission
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBlock label="Application ID" value={`#${caseItem.id}`} />
            <InfoBlock label="Applicant Entity" value={caseItem.entity} />
            <InfoBlock label="Project Name" value={caseItem.projectName} />
            <InfoBlock label="Category" value={caseItem.category} />
            <InfoBlock label="Date Submitted" value={caseItem.dateSubmitted} />
            <div>
              <p className="text-[18px] font-semibold text-[#536a87]">Current Status</p>
              <div className="mt-1">
                <StatusBadge status={caseItem.status} />
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-[#f9fbfa] p-4">
            <p className="text-[20px] text-[#4f6583]">{caseItem.notes}</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-[34px] font-semibold text-[#111827]">Uploaded Documents</h2>
          <div className="mt-4 space-y-2">
            {caseItem.documents.map((fileName) => (
              <div
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#fcfdfd] px-3 py-2"
                key={fileName}
              >
                <span className="inline-flex items-center gap-2 text-[19px] text-[#1f3048]">
                  <FileText className="h-4 w-4 text-[#536a87]" />
                  {fileName}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[16px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                  onClick={() => onDownload(caseItem.id, fileName)}
                  type="button"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="block text-[18px] font-semibold text-[#536a87]">Review Notes</span>
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[18px] text-[#1f3048] outline-none focus:border-[#124734] focus:ring-2 focus:ring-[#124734]/10"
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="Add findings or comments..."
              value={reviewNote}
            />
          </label>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#124734] px-4 py-2.5 text-[20px] font-semibold text-white hover:bg-[#0f3a2b]"
              onClick={() => onApprove(caseItem.id)}
              type="button"
            >
              <CheckCircle2 className="h-5 w-5" />
              Approve & Refer to MoM
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-[20px] font-semibold text-white hover:bg-rose-700"
              onClick={() => onRaiseDeficiency(caseItem.id)}
              type="button"
            >
              <AlertTriangle className="h-5 w-5" />
              Raise Deficiency
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[27px] text-[#5b6d87]">{title}</p>
        {icon}
      </div>
      <p className="mt-4 text-5xl font-semibold tracking-tight text-[#111827]">{value}</p>
      <p className="mt-2 text-[25px] font-medium text-[#4f6583]">{description}</p>
    </article>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-[18px] font-semibold text-[#536a87]">{label}</p>
      <p className="mt-1 text-[22px] text-[#1f3048]">{value}</p>
    </div>
  );
}

function getViewFromPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "");
  const reviewMatch = normalized.match(/^\/scrutiny-dashboard\/review\/([^/]+)$/);
  if (reviewMatch) {
    return { type: "review", reviewId: decodeURIComponent(reviewMatch[1]) };
  }
  if (normalized === "/scrutiny-dashboard/under-scrutiny") {
    return { type: "under-scrutiny" };
  }
  if (normalized === "/scrutiny-dashboard/deficiencies") {
    return { type: "deficiencies" };
  }
  if (normalized === "/scrutiny-dashboard/referred-cases") {
    return { type: "referred-cases" };
  }
  return { type: "dashboard" };
}

function StatusBadge({ status }) {
  const styles = {
    Submitted: "bg-blue-100 text-blue-700",
    "Under Scrutiny": "bg-amber-100 text-amber-700",
    Deficiency: "bg-rose-100 text-rose-700",
    "Referred to MoM": "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[16px] font-semibold ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export default ScrutinyDashboard;
