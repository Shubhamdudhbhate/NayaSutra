import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  History,
  StickyNote,
  Users,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  details: unknown;
  created_at: string;
}

interface SessionNote {
  id: string;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  judge_name?: string;
}

interface Party {
  id: string;
  name: string;
  role: string;
  isOnline?: boolean;
}

interface DocketSidebarProps {
  caseId: string;
  caseNumber: string;
  filingDate: string;
  status: string;
  parties: Party[];
}

const actionLabels: Record<string, string> = {
  SESSION_START: "started session",
  SESSION_END: "ended session",
  EVIDENCE_SEALED: "sealed evidence",
  EVIDENCE_UPLOADED: "uploaded evidence",
  CASE_CREATED: "created the case",
  STATUS_CHANGE: "changed case status",
  JUDGE_TRANSFER: "transferred case",
  UPLOADED: "uploaded file",
  SEALED: "sealed evidence",
};

export const DocketSidebar = ({
  caseId,
  caseNumber,
  filingDate,
  status,
  parties,
}: DocketSidebarProps) => {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  // Fetch session notes - TODO: Implement when session_logs table is populated
  useEffect(() => {
    setIsLoadingNotes(false);
    setSessionNotes([]);
  }, [caseId]);

  // Fetch diary entries - Removed (case_diary table deleted - use chain_of_custody for audit trail)
  useEffect(() => {
    setIsLoading(false);
    setDiaryEntries([]);
  }, [caseId]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    active: {
      label: "Active",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    closed: {
      label: "Closed",
      className: "bg-muted text-muted-foreground border-border",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    archived: {
      label: "Archived",
      className: "bg-muted text-muted-foreground border-border",
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  // Filter sessions that have notes
  const sessionsWithNotes = sessionNotes.filter((s) =>
    s.notes && s.notes.trim() !== ""
  );

  return (
    <div className="h-full border-l border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Case Docket
        </h2>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue="metadata"
        className="w-full"
      >
        {/* Case Metadata Section */}
        <AccordionItem value="metadata" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" />
              Case Metadata
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Case ID</span>
                <code className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                  {caseNumber}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Filing Date
                </span>
                <span className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {format(new Date(filingDate), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs", currentStatus.className)}
                >
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Parties Involved Section */}
        <AccordionItem value="parties" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-muted-foreground" />
              Parties Involved
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {parties.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <Circle
                      className={cn(
                        "w-2 h-2",
                        party.isOnline
                          ? "text-emerald-400 fill-emerald-400"
                          : "text-muted-foreground fill-muted-foreground",
                      )}
                    />
                    <span className="text-sm">{party.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {party.role}
                  </span>
                </div>
              ))}
              {parties.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No parties assigned
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Session Notes Section */}
        <AccordionItem value="notes" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              Session Notes
              {sessionsWithNotes.length > 0 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {sessionsWithNotes.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isLoadingNotes
              ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )
              : sessionsWithNotes.length > 0
              ? (
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-3">
                    {sessionsWithNotes.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg bg-secondary/30 border border-border"
                      >
                        {/* Session Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-medium">
                              {format(
                                new Date(session.started_at),
                                "MMM dd, yyyy",
                              )}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              session.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {session.status === "active" ? "Live" : "Ended"}
                          </Badge>
                        </div>

                        {/* Session Time */}
                        <div className="text-xs text-muted-foreground mb-2">
                          {format(new Date(session.started_at), "h:mm a")}
                          {session.ended_at && (
                            <>
                              — {format(new Date(session.ended_at), "h:mm a")}
                            </>
                          )}
                          <span className="ml-2 text-muted-foreground/60">
                            by {session.judge_name}
                          </span>
                        </div>

                        {/* Notes Content */}
                        <div className="text-sm text-foreground whitespace-pre-wrap bg-background/50 rounded p-2 border border-border/50">
                          {session.notes}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )
              : (
                <div className="text-center py-6">
                  <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No session notes recorded yet
                  </p>
                </div>
              )}
          </AccordionContent>
        </AccordionItem>

        {/* Case Diary & Logs Section */}
        <AccordionItem value="diary" className="border-b border-border">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/50">
            <div className="flex items-center gap-2 text-sm font-medium">
              <History className="w-4 h-4 text-muted-foreground" />
              Case Diary & Logs
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {isLoading
              ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )
              : diaryEntries.length > 0
              ? (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-3">
                    {diaryEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex gap-3 items-start relative"
                      >
                        {/* Timeline dot */}
                        <div className="w-[15px] flex justify-center pt-1.5 relative z-10">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), "h:mm a")}
                            </span>
                            <ChevronRight className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {entry.actor_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {actionLabels[entry.action] ||
                                entry.action.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(entry.created_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
              : (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No activity recorded yet
                </p>
              )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
