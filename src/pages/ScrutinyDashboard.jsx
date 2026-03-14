import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

const APPLICATION_DOCUMENT_BUCKET = "application-documents";
const LOCAL_AI_BACKEND_URL =
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8787";

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
  const { signOut, user } = useAuth();
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState("");
  const [isUpdatingCase, setIsUpdatingCase] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [approvalProgressMessage, setApprovalProgressMessage] = useState("");
  const [approvalErrorMessage, setApprovalErrorMessage] = useState("");

  const currentView = useMemo(() => getViewFromPath(location.pathname), [location.pathname]);

  const underScrutinyCases = useMemo(
    () =>
      cases.filter(
        (item) => item.dbStatus === "under_scrutiny" || item.dbStatus === "submitted",
      ),
    [cases],
  );
  const deficiencyCases = useMemo(
    () => cases.filter((item) => item.dbStatus === "deficiency_raised"),
    [cases],
  );
  const referredCases = useMemo(
    () => cases.filter((item) => item.dbStatus === "referred" || item.dbStatus === "mom_generated"),
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

  const loadScrutinyCases = async () => {
    setCasesLoading(true);
    setCasesError("");

    const { data: applicationRows, error: applicationsError } = await supabase
      .from("applications")
      .select(
        "id, application_code, proponent_id, project_name, sector_category, status, submitted_at, created_at, deficiency_message, document_count",
      )
      .order("created_at", { ascending: false });

    if (applicationsError) {
      setCases([]);
      setCasesError(applicationsError.message || "Failed to load applications.");
      setCasesLoading(false);
      return;
    }

    const applications = applicationRows ?? [];
    if (applications.length === 0) {
      setCases([]);
      setCasesLoading(false);
      return;
    }

    const proponentIds = [...new Set(applications.map((item) => item.proponent_id).filter(Boolean))];
    const applicationIds = applications.map((item) => item.id);

    const [usersResult, docsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, username")
        .in("id", proponentIds),
      supabase
        .from("application_documents")
        .select("id, application_id, file_name, storage_path")
        .in("application_id", applicationIds),
    ]);

    if (usersResult.error) {
      setCases([]);
      setCasesError(usersResult.error.message || "Failed to load applicant details.");
      setCasesLoading(false);
      return;
    }

    if (docsResult.error) {
      setCases([]);
      setCasesError(docsResult.error.message || "Failed to load application documents.");
      setCasesLoading(false);
      return;
    }

    const usersById = new Map((usersResult.data ?? []).map((item) => [item.id, item]));
    const documentsByApplicationId = new Map();

    for (const doc of docsResult.data ?? []) {
      const current = documentsByApplicationId.get(doc.application_id) ?? [];
      current.push({
        id: doc.id,
        fileName: doc.file_name,
        storagePath: doc.storage_path,
      });
      documentsByApplicationId.set(doc.application_id, current);
    }

    const mappedCases = applications.map((item) => {
      const applicant = usersById.get(item.proponent_id);
      const displayName = applicant?.full_name?.trim() || applicant?.username || "Unknown Proponent";
      const uiStatus = getScrutinyStatusLabel(item.status);
      const docs = documentsByApplicationId.get(item.id) ?? [];

      return {
        dbId: item.id,
        id: item.application_code || item.id,
        entity: displayName,
        projectName: item.project_name || "Untitled Project",
        category: item.sector_category || "Not Selected",
        dateSubmitted: toDisplayDate(item.submitted_at || item.created_at),
        status: uiStatus,
        dbStatus: item.status,
        priority: getCasePriority(item, docs),
        notes:
          item.deficiency_message ||
          (uiStatus === "Referred to MoM"
            ? "All documents verified and referred to MoM team."
            : "Under scrutiny review by team."),
        documents: docs,
      };
    });

    setCases(mappedCases);
    setCasesLoading(false);
  };

  useEffect(() => {
    loadScrutinyCases();
  }, []);

  const downloadCaseDocument = async (caseId, documentItem) => {
    if (!documentItem?.storagePath) return;

    const { data, error } = await supabase.storage
      .from(APPLICATION_DOCUMENT_BUCKET)
      .download(documentItem.storagePath);

    if (error || !data) {
      // eslint-disable-next-line no-console
      console.error("Failed to download document", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = documentItem.fileName || `${caseId}-document.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const approveCase = async (caseId) => {
    const currentCase = cases.find((item) => item.id === caseId);
    if (!currentCase?.dbId) return;

    setApprovalErrorMessage("");
    setApprovalProgressMessage("Extracting PDFs and preparing AI gist...");
    setIsUpdatingCase(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(
        `${LOCAL_AI_BACKEND_URL}/api/scrutiny/approve-and-generate-gist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            applicationId: currentCase.dbId,
            reviewNote: reviewNote.trim(),
            scrutinyUserId: user?.id ?? null,
          }),
        },
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error ||
            "Failed to generate AI gist. Application was not referred.",
        );
      }

      setApprovalProgressMessage("Saving gist and updating workflow...");
      await loadScrutinyCases();
      setIsUpdatingCase(false);
      setReviewNote("");
      setApprovalProgressMessage("");
      navigate("/scrutiny-dashboard/referred-cases");
    } catch (error) {
      const message =
        error?.name === "AbortError"
          ? "AI generation timed out. Please try again."
          : error?.message || "Failed to approve application.";
      setApprovalErrorMessage(message);
      setIsUpdatingCase(false);
      setApprovalProgressMessage("");
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const raiseDeficiency = async (caseId) => {
    const currentCase = cases.find((item) => item.id === caseId);
    if (!currentCase?.dbId) return;

    setApprovalProgressMessage("");
    setApprovalErrorMessage("");
    setIsUpdatingCase(true);

    const { error } = await supabase
      .from("applications")
      .update({
        status: "deficiency_raised",
        deficiency_message: reviewNote.trim() || "Deficiency raised during document review.",
      })
      .eq("id", currentCase.dbId);

    if (error) {
      setCasesError(error.message || "Failed to raise deficiency.");
      setIsUpdatingCase(false);
      return;
    }

    await loadScrutinyCases();
    setIsUpdatingCase(false);
    setReviewNote("");
    navigate("/scrutiny-dashboard/deficiencies");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout failed", error);
    }
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
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[22px] font-semibold text-[#445a78] hover:bg-slate-50"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Logout
              </button>
            </div>
          </header>

          <div className="space-y-6 p-6 lg:p-8">
            {casesError ? (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[18px] font-semibold text-rose-700">{casesError}</p>
                <button
                  className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[17px] font-semibold text-rose-700 hover:bg-rose-100"
                  onClick={loadScrutinyCases}
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {casesLoading ? (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 text-[22px] text-[#5c6f89] shadow-sm">
                Loading application data from database...
              </article>
            ) : null}

            {!casesLoading && currentView.type === "dashboard" ? (
              <DashboardSection
                deficiencyCount={deficiencyCases.length}
                highPriorityCases={highPriorityCases}
                onReview={openReviewInNewWindow}
                referredCount={referredCases.length}
                underScrutinyCases={underScrutinyCases}
              />
            ) : null}

            {!casesLoading && currentView.type === "under-scrutiny" ? (
              <CasesPage
                cases={underScrutinyCases}
                description="New applications submitted by proponents are reviewed here."
                onReview={openReviewInNewWindow}
                title="Under Scrutiny"
              />
            ) : null}

            {!casesLoading && currentView.type === "deficiencies" ? (
              <CasesPage
                cases={deficiencyCases}
                description="Cases with missing or invalid documents are listed as deficiencies."
                onReview={openReviewInNewWindow}
                title="Deficiencies"
              />
            ) : null}

            {!casesLoading && currentView.type === "referred-cases" ? (
              <CasesPage
                cases={referredCases}
                description="Approved cases are referred to MoM for meeting and minutes generation."
                onReview={openReviewInNewWindow}
                showAction={false}
                title="Referred Cases"
              />
            ) : null}

            {!casesLoading && currentView.type === "review" ? (
              <ReviewPage
                approvalErrorMessage={approvalErrorMessage}
                approvalProgressMessage={approvalProgressMessage}
                caseItem={selectedCase}
                isUpdatingCase={isUpdatingCase}
                onApprove={approveCase}
                onBack={() => navigate("/scrutiny-dashboard/under-scrutiny")}
                onDownload={downloadCaseDocument}
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
  approvalErrorMessage,
  approvalProgressMessage,
  caseItem,
  onBack,
  onDownload,
  onApprove,
  onRaiseDeficiency,
  isUpdatingCase,
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
            {caseItem.documents.length === 0 ? (
              <p className="text-[20px] text-[#5c6f89]">No uploaded documents found for this application.</p>
            ) : null}
            {caseItem.documents.map((documentItem) => (
              <div
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#fcfdfd] px-3 py-2"
                key={documentItem.id || documentItem.fileName}
              >
                <span className="inline-flex items-center gap-2 text-[19px] text-[#1f3048]">
                  <FileText className="h-4 w-4 text-[#536a87]" />
                  {documentItem.fileName}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[16px] font-semibold text-[#124734] hover:bg-[#f2f8f4]"
                  onClick={() => onDownload(caseItem.id, documentItem)}
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
              disabled={isUpdatingCase}
              onClick={() => onApprove(caseItem.id)}
              type="button"
            >
              <CheckCircle2 className="h-5 w-5" />
              {isUpdatingCase ? "Updating..." : "Approve & Refer to MoM"}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-[20px] font-semibold text-white hover:bg-rose-700"
              disabled={isUpdatingCase}
              onClick={() => onRaiseDeficiency(caseItem.id)}
              type="button"
            >
              <AlertTriangle className="h-5 w-5" />
              {isUpdatingCase ? "Updating..." : "Raise Deficiency"}
            </button>
          </div>

          {approvalProgressMessage ? (
            <p className="mt-3 text-[17px] font-medium text-[#2e5f49]">
              {approvalProgressMessage}
            </p>
          ) : null}
          {approvalErrorMessage ? (
            <p className="mt-2 text-[17px] font-medium text-rose-700">
              {approvalErrorMessage}
            </p>
          ) : null}
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
    Referred: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[16px] font-semibold ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

function getScrutinyStatusLabel(rawStatus) {
  const status = String(rawStatus ?? "")
    .trim()
    .toLowerCase();

  if (status === "submitted") return "Submitted";
  if (status === "under_scrutiny") return "Under Scrutiny";
  if (status === "deficiency_raised") return "Deficiency";
  if (status === "referred" || status === "mom_generated") return "Referred to MoM";
  return "Submitted";
}

function getCasePriority(applicationRow, documents) {
  const documentCount = documents.length || Number(applicationRow.document_count) || 0;
  const createdDate = new Date(applicationRow.created_at || Date.now());
  const ageInDays = Number.isNaN(createdDate.getTime())
    ? 0
    : Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  if (documentCount <= 1 || ageInDays >= 7) return "High";
  return "Normal";
}

function toDisplayDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Not Submitted";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default ScrutinyDashboard;
