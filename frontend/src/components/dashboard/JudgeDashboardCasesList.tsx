import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarIcon, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScheduleHearingModal } from "./ScheduleHearingModal";

type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  filing_date: string;
};

interface JudgeDashboardCasesListProps {
  cases: Case[];
  onRefresh: () => void;
}

export function JudgeDashboardCasesList({
  cases,
  onRefresh,
}: JudgeDashboardCasesListProps) {
  const navigate = useNavigate();
  const { roleTheme } = useRole();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScheduleClick = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  const handleSchedule = async (
    caseId: string,
    date: Date,
    _time: string,
  ) => {
    try {
      // Hearing date scheduling planned for future implementation (session_logs table)
      const { error } = await supabase
        .from("cases")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", caseId);

      if (error) {
        throw error;
      }

      // Refresh the cases list
      onRefresh();
    } catch (error) {
      console.error("Error scheduling hearing:", error);
      throw error;
    }
  };

  if (cases.length === 0) {
    return (
      <GlassCard className="p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            No cases assigned yet
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className={cn("w-5 h-5", `text-${roleTheme.primary}`)} />
            Assigned Cases
          </h3>
          <Badge variant="outline">{cases.length}</Badge>
        </div>

        <div className="space-y-3">
          {cases.map((caseItem) => {
            const isScheduled = false; // Hearing scheduling planned for future
            const scheduledDate = null; // Removed - use session_logs table in future

            return (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-white/5 bg-secondary/30 p-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/cases/${caseItem.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm hover:text-primary transition-colors">
                          {caseItem.title}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">
                          {caseItem.case_number}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs ml-2",
                          caseItem.status === "active" ||
                            caseItem.status === "hearing"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : caseItem.status === "closed"
                            ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        )}
                      >
                        {caseItem.status}
                      </Badge>
                    </div>

                    {/* Scheduled Status Display */}
                    {isScheduled && scheduledDate && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 rounded-md p-2 border border-primary/10">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="font-medium">Scheduled:</span>
                        <span>
                          {format(scheduledDate, "PPP")} at{" "}
                          {format(scheduledDate, "h:mm a")}
                        </span>
                      </div>
                    )}

                    {!isScheduled && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>No hearing scheduled</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={isScheduled ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleClick(caseItem);
                      }}
                      className={cn(
                        isScheduled
                          ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          : `bg-${roleTheme.primary} hover:opacity-90`,
                      )}
                    >
                      {isScheduled
                        ? (
                          <>
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Postpone / Reschedule
                          </>
                        )
                        : (
                          <>
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            Schedule Hearing
                          </>
                        )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/cases/${caseItem.id}`)}
                      className="text-xs"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>

      {selectedCase && (
        <ScheduleHearingModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          caseId={selectedCase.id}
          caseNumber={selectedCase.case_number}
          caseTitle={selectedCase.title}
          currentScheduledDate={selectedCase.next_hearing_date}
          onSchedule={handleSchedule}
        />
      )}
    </>
  );
}
