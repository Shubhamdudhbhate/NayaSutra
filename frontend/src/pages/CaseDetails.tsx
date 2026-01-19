import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCourtSession } from "@/hooks/useCourtSession";
// cn import removed - not used
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Match the actual database schema for cases table
type DbCase = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string;
  case_type: string;
  party_a_name: string;
  party_b_name: string;
  court_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  unique_identifier: string;
};

const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Court session management
  const courtSession = useCourtSession(id || "");
  const [caseData, setCaseData] = useState<DbCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [lawyerAName, setLawyerAName] = useState<string | null>(null);
  const [lawyerBName, setLawyerBName] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      // Fetch case data
      const { data: caseResult, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (caseError) {
        console.error("Error fetching case:", caseError);
        toast.error("Failed to load case");
        return;
      }

      if (!caseResult) {
        toast.error("Case not found");
        return;
      }

      setCaseData(caseResult);
    } catch (error) {
      console.error("Error loading case:", error);
      toast.error("Failed to load case data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const isJudge = profile?.role_category === "judiciary";
  const isCriminal = caseData?.case_type === "criminal";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Case not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "closed":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "hearing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "verdict_pending":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,4%)] flex flex-col">
      {/* Simple Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-8 w-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div>
            <code className="text-sm font-mono text-muted-foreground">
              {caseData.case_number}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isJudge && !courtSession.isSessionActive && (
            <Button
              onClick={courtSession.startSession}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Court Session
            </Button>
          )}
          {isJudge && courtSession.isSessionActive && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Session Active
            </Badge>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Case Overview Card */}
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{caseData.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {caseData.unique_identifier}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusColor(caseData.status)}
                >
                  {caseData.status.charAt(0).toUpperCase() +
                    caseData.status.slice(1).replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.description && (
                <p className="text-muted-foreground">{caseData.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Case Type</p>
                  <p className="font-medium capitalize">{caseData.case_type}</p>
                </div>
                {caseData.court_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Court</p>
                    <p className="font-medium">{caseData.court_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parties Card */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isCriminal ? "Complainant" : "Plaintiff"}
                  </p>
                  <p className="font-medium">{caseData.party_a_name}</p>
                  {lawyerAName && (
                    <p className="text-sm text-muted-foreground">
                      Lawyer:{" "}
                      <span className="text-foreground">{lawyerAName}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {isCriminal ? "Accused" : "Defendant"}
                  </p>
                  <p className="font-medium">{caseData.party_b_name}</p>
                  {lawyerBName && (
                    <p className="text-sm text-muted-foreground">
                      Lawyer:{" "}
                      <span className="text-foreground">{lawyerBName}</span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Judge Card */}
          {judgeName && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Assigned Judge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{judgeName}</p>
              </CardContent>
            </Card>
          )}

          {/* Evidence Section (Placeholder) */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-secondary"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="evidence"
                className="data-[state=active]:bg-secondary"
              >
                <Shield className="w-4 h-4 mr-2" />
                Evidence
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="border-border/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>Case overview and timeline will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence">
              <Card className="border-border/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">
                    Evidence management will be available soon.
                  </p>
                  <p className="text-sm">
                    The evidence table needs to be created first.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Timestamps */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Created: {new Date(caseData.created_at).toLocaleString("en-IN")}
            </span>
            <span>
              Updated: {new Date(caseData.updated_at).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetails;
