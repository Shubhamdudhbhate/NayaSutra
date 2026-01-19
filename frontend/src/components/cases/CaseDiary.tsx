import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  History,
  Play,
  Scale,
  Square,
  UserCog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DiaryEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  details: unknown;
  created_at: string;
}

interface CaseDiaryProps {
  caseId: string;
}

const actionConfig: Record<string, {
  icon: typeof History;
  label: string;
  className: string;
}> = {
  SESSION_START: {
    icon: Play,
    label: "Session Started",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  SESSION_END: {
    icon: Square,
    label: "Session Ended",
    className: "bg-muted text-muted-foreground border-muted",
  },
  JUDGE_TRANSFER: {
    icon: UserCog,
    label: "Judge Transferred",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  STATUS_CHANGE: {
    icon: Scale,
    label: "Status Changed",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  CASE_CREATED: {
    icon: FileText,
    label: "Case Created",
    className: "bg-primary/10 text-primary border-primary/20",
  },
};

export const CaseDiary = ({ caseId }: CaseDiaryProps) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // NOTE: case_diary table has been removed. For audit trail, use chain_of_custody table instead.
    // This component shows empty state.
    setIsLoading(false);
    setEntries([]);
  }, [caseId]);

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Case Diary</h3>
          <p className="text-xs text-muted-foreground">
            Timeline of case activities
          </p>
        </div>
      </div>

      {entries.length > 0
        ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {entries.map((entry, index) => {
              const config = actionConfig[entry.action] || {
                icon: History,
                label: entry.action,
                className: "bg-muted text-muted-foreground border-muted",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg border",
                        config.className,
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {index < entries.length - 1 && (
                      <div className="w-px h-full bg-white/10 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-xs", config.className)}
                      >
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      by <span className="font-medium">{entry.actor_name}</span>
                    </p>
                    {entry.details
                      ? (
                        <pre className="mt-2 p-2 rounded bg-secondary/30 text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      )
                      : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
        : (
          <div className="py-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No diary entries yet
            </p>
          </div>
        )}
    </div>
  );
};
