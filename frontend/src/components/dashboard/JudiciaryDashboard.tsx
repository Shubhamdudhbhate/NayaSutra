import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { NyaySutraSidebar } from "./NyaySutraSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { VitalStatsCards } from "./VitalStatsCards";
import { CauseListItem, LiveCauseList } from "./LiveCauseList";
import { JudgmentItem, JudgmentQueue } from "./JudgmentQueue";
import { QuickJudicialNotes } from "./QuickJudicialNotes";
import { PendingSignatures } from "./PendingSignatures";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Transform database cases to CauseListItem format
const transformCaseToCauseListItem = (
  dbCase: {
    id: string;
    case_number: string;
    title: string;
    status: string;
    case_type: string;
  },
  index: number,
): CauseListItem => {
  const getCaseType = (caseType: string, title: string): string => {
    if (caseType === "criminal") return "Criminal Case";
    if (caseType === "civil") return "Civil Suit";
    if (title.toLowerCase().includes("writ")) return "Writ Petition";
    if (title.toLowerCase().includes("bail")) return "Bail Application";
    return "Miscellaneous";
  };

  const getStage = (status: string): string => {
    switch (status) {
      case "pending":
        return "Filing";
      case "active":
        return "Arguments";
      case "hearing":
        return "Hearing";
      case "verdict_pending":
        return "Reserved";
      default:
        return "Scheduled";
    }
  };

  const mapStatus = (
    status: string,
  ): "scheduled" | "in-progress" | "completed" | "adjourned" => {
    switch (status) {
      case "closed":
        return "completed";
      case "hearing":
        return "in-progress";
      case "appealed":
        return "adjourned";
      default:
        return "scheduled";
    }
  };

  return {
    id: dbCase.id,
    srNo: index + 1,
    caseNumber: dbCase.case_number,
    parties: dbCase.title,
    caseType: getCaseType(dbCase.case_type, dbCase.title),
    stage: getStage(dbCase.status),
    status: mapStatus(dbCase.status),
    time: undefined,
    isUrgent: false,
  };
};

// Mock data for judgment queue (this would come from DB in production)
const mockJudgmentQueue: JudgmentItem[] = [
  {
    id: "j1",
    caseNumber: "WP/0789/2024",
    parties: "Sunrise Pharma vs. DPCO",
    hearingDate: "Dec 28, 2024",
    draftProgress: 75,
    dueDate: "Jan 15, 2025",
  },
  {
    id: "j2",
    caseNumber: "CS/1567/2024",
    parties: "Metro Builders vs. NHAI",
    hearingDate: "Dec 20, 2024",
    draftProgress: 40,
    dueDate: "Jan 10, 2025",
    isOverdue: true,
  },
];

type PendingCase = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  requested_at?: string;
};

export const JudiciaryDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentHearingId, setCurrentHearingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [causeList, setCauseList] = useState<CauseListItem[]>([]);
  const [pendingSignatures, setPendingSignatures] = useState<PendingCase[]>([]);
  const [, setIsLoading] = useState(true);

  const judgeName = profile?.full_name || "Judge";

  // Fetch real cases from database
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data: cases, error } = await supabase
          .from("cases")
          .select("id, case_number, title, status, case_type")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (cases) {
          const transformedCases = cases.map((c, index) =>
            transformCaseToCauseListItem(c, index)
          );
          setCauseList(transformedCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
        toast.error("Failed to load cases");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);

  // Fetch pending signature requests for this judge
  useEffect(() => {
    const fetchPendingSignatures = async () => {
      if (!profile?.id) return;

      try {
        // Fetch cases with statuses that need attention
        const { data: cases } = await supabase
          .from("cases")
          .select("id, case_number, title, status, created_at")
          .in("status", ["active", "hearing", "verdict_pending"])
          .limit(10);

        if (cases) {
          // Show active/hearing cases for judiciary dashboard
          setPendingSignatures(
            cases.map((c) => ({
              ...c,
              requested_at: c.created_at,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching pending signatures:", error);
      }
    };

    fetchPendingSignatures();
  }, [profile?.id]);

  const handleJudgeSign = async (caseId: string, signature: string) => {
    // In a real app, this would update the database
    console.log("Judge signed case:", caseId, "with signature:", signature);

    // Remove from pending list
    setPendingSignatures((prev) => prev.filter((c) => c.id !== caseId));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const currentCase = causeList.find((c) => c.id === currentHearingId);

  const handleStartHearing = useCallback((id: string) => {
    setCurrentHearingId(id);
    const caseItem = causeList.find((c) => c.id === id);
    toast.success(`Hearing started for ${caseItem?.caseNumber}`, {
      description: caseItem?.parties,
    });
  }, [causeList]);

  const handleOpenCaseFile = useCallback((id: string) => {
    navigate(`/cases/${id}`);
  }, [navigate]);

  const handleVideoCall = useCallback((id: string) => {
    toast.info("Video call feature coming soon", {
      description: `Case ID: ${id}`,
    });
  }, []);

  const handlePassOrder = useCallback((id: string) => {
    toast.info("Pass order feature coming soon", {
      description: `Case ID: ${id}`,
    });
  }, []);

  const handleSaveNotes = useCallback((newNotes: string) => {
    setNotes(newNotes);
    if (newNotes.trim()) {
      toast.success("Note saved", {
        description: currentCase
          ? `Added to ${currentCase.caseNumber}`
          : "Saved to drafts",
      });
    }
  }, [currentCase]);

  // Calculate stats
  const urgentMatters = causeList.filter((c) => c.isUrgent).length;

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <NyaySutraSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6 overflow-auto ml-64">
        {/* Header */}
        <DashboardHeader judgeName={judgeName} />

        {/* Vital Stats */}
        <VitalStatsCards
          casesListedToday={causeList.length}
          urgentApplications={urgentMatters}
          judgmentsReserved={mockJudgmentQueue.length}
          monthlyDisposalRate="87%"
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Live Cause List - Takes 2 columns */}
          <div className="xl:col-span-2">
            <LiveCauseList
              items={causeList}
              currentHearingId={currentHearingId}
              onStartHearing={handleStartHearing}
              onOpenCaseFile={handleOpenCaseFile}
              onVideoCall={handleVideoCall}
              onPassOrder={handlePassOrder}
            />
          </div>

          {/* Right Column - Judgment Queue & Notes */}
          <div className="space-y-6">
            <JudgmentQueue
              items={mockJudgmentQueue}
              onOpenJudgment={(id: string) =>
                navigate(`/judgment-writer?case=${id}`)}
            />

            <PendingSignatures
              cases={pendingSignatures}
              role="judge"
              onSign={handleJudgeSign}
            />

            <QuickJudicialNotes
              currentHearingId={currentHearingId}
              currentCaseNumber={currentCase?.caseNumber}
              initialNotes={notes}
              onSaveNotes={handleSaveNotes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
