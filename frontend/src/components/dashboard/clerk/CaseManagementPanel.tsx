import { useEffect, useState } from "react";
import {
  Bell,
  Briefcase,
  Check,
  FileText,
  Gavel,
  Loader2,
  MessageSquare,
  Send,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConversationSection } from "./ConversationSection";
import { JudgeStatementSection } from "./JudgeStatementSection";
import { DocumentUploadSection } from "./DocumentUploadSection";
import { SignatureSection } from "./SignatureSection";

type CaseData = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  assigned_judge_id: string | null;
  lawyer_party_a_id: string | null;
  lawyer_party_b_id: string | null;
  assigned_judge?: { full_name: string } | null;
  lawyer_party_a?: { full_name: string } | null;
  lawyer_party_b?: { full_name: string } | null;
};

type Profile = {
  id: string;
  full_name: string;
  role_category: string;
};

interface CaseManagementPanelProps {
  caseData: CaseData;
  onCaseUpdate?: () => void;
}

export const CaseManagementPanel = (
  { caseData, onCaseUpdate }: CaseManagementPanelProps,
) => {
  const [activeTab, setActiveTab] = useState("conversation");
  const [judges, setJudges] = useState<Profile[]>([]);
  const [selectedJudge, setSelectedJudge] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  // Signature states (read-only - signatures come from respective dashboards)
  const [judgeSignature] = useState<string | null>(null);
  const [lawyerASignature] = useState<string | null>(null);
  const [lawyerBSignature] = useState<string | null>(null);

  // IPFS state
  const [isReadyForIPFS, setIsReadyForIPFS] = useState(false);
  const [isSendingToIPFS, setIsSendingToIPFS] = useState(false);

  useEffect(() => {
    const fetchJudges = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role_category")
        .eq("role_category", "judiciary");
      setJudges(data || []);
    };
    fetchJudges();
  }, []);

  useEffect(() => {
    // Check if all signatures are present
    if (judgeSignature && lawyerASignature && lawyerBSignature) {
      setIsReadyForIPFS(true);
    } else {
      setIsReadyForIPFS(false);
    }
  }, [judgeSignature, lawyerASignature, lawyerBSignature]);

  const handleAssignJudge = async () => {
    if (!selectedJudge) return;
    setIsAssigning(true);

    try {
      // Judge assignment column has been removed from cases table
      // Assignment now handled through session_logs table for future implementation
      toast.info("Judge assignment feature planned for future release");
      onCaseUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to assign judge");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSendNotification = async () => {
    if (!caseData.assigned_judge_id) {
      toast.error("Please assign a judge first");
      return;
    }

    setIsSendingNotification(true);

    // Simulate notification sending
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Notification sent to assigned judge!");
    setIsSendingNotification(false);
  };

  const handleSendToIPFS = async () => {
    if (!isReadyForIPFS) {
      toast.error("All signatures are required before sending to IPFS");
      return;
    }

    setIsSendingToIPFS(true);

    // Prepare data for IPFS
    const ipfsPayload = {
      caseId: caseData.id,
      caseNumber: caseData.case_number,
      title: caseData.title,
      signatures: {
        judge: judgeSignature,
        lawyerPartyA: lawyerASignature,
        lawyerPartyB: lawyerBSignature,
      },
      timestamp: new Date().toISOString(),
    };

    // Simulate IPFS preparation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("IPFS Payload ready:", ipfsPayload);
    toast.success("Case package prepared for IPFS submission!");
    setIsSendingToIPFS(false);
  };

  return (
    <GlassCard className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Case Management</h2>
            <p className="text-sm text-muted-foreground font-mono">
              {caseData.case_number}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {caseData.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Judge Assignment Section */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4 text-amber-500" />
          <h3 className="font-medium">Judge Assignment</h3>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedJudge}
            onChange={(e) => setSelectedJudge(e.target.value)}
            className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Select a judge...</option>
            {judges.map((judge) => (
              <option key={judge.id} value={judge.id}>
                {judge.full_name}
              </option>
            ))}
          </select>

          <Button
            onClick={handleAssignJudge}
            disabled={!selectedJudge || isAssigning}
            size="sm"
          >
            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Assign
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleSendNotification}
            disabled={!caseData.assigned_judge_id || isSendingNotification}
            size="sm"
          >
            {isSendingNotification
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : (
                <>
                  <Bell className="w-4 h-4 mr-1" />
                  Notify
                </>
              )}
          </Button>
        </div>

        {caseData.assigned_judge && (
          <p className="text-sm text-muted-foreground mt-2">
            Currently assigned:{" "}
            <span className="text-foreground font-medium">
              {caseData.assigned_judge.full_name}
            </span>
          </p>
        )}
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="conversation" className="text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4 mr-1 hidden sm:inline" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="statement" className="text-xs sm:text-sm">
            <FileText className="w-4 h-4 mr-1 hidden sm:inline" />
            Statement
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">
            <Upload className="w-4 h-4 mr-1 hidden sm:inline" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="signatures" className="text-xs sm:text-sm">
            <Check className="w-4 h-4 mr-1 hidden sm:inline" />
            Signatures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation">
          <ConversationSection caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="statement">
          <JudgeStatementSection caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentUploadSection caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="signatures">
          <SignatureSection
            caseData={caseData}
            judgeSignature={judgeSignature}
            lawyerASignature={lawyerASignature}
            lawyerBSignature={lawyerBSignature}
          />
        </TabsContent>
      </Tabs>

      {/* IPFS Submit Button */}
      <div className="mt-6 pt-6 border-t border-border">
        <Button
          className="w-full"
          size="lg"
          onClick={handleSendToIPFS}
          disabled={!isReadyForIPFS || isSendingToIPFS}
        >
          {isSendingToIPFS
            ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing for IPFS...
              </>
            )
            : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {isReadyForIPFS
                  ? "Send to IPFS"
                  : "Collect All Signatures to Enable IPFS"}
              </>
            )}
        </Button>
        {!isReadyForIPFS && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Requires signatures from Judge and both Lawyers
          </p>
        )}
      </div>
    </GlassCard>
  );
};
