import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Check, Clock, Gavel, Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CaseData = {
  id: string;
  case_number: string;
  title: string;
};

interface SignatureSectionProps {
  caseData: CaseData;
  judgeSignature: string | null;
  lawyerASignature: string | null;
  lawyerBSignature: string | null;
}

type SignatureRole = "judge" | "lawyerA" | "lawyerB";

const roleConfig = {
  judge: {
    label: "Judge",
    icon: Gavel,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  lawyerA: {
    label: "Lawyer (Party A)",
    icon: Scale,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  lawyerB: {
    label: "Lawyer (Party B)",
    icon: Scale,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
};

export const SignatureSection = ({
  caseData,
  judgeSignature,
  lawyerASignature,
  lawyerBSignature,
}: SignatureSectionProps) => {
  const [sendingNotification, setSendingNotification] = useState<
    SignatureRole | null
  >(null);

  const getSignature = (role: SignatureRole) => {
    switch (role) {
      case "judge":
        return judgeSignature;
      case "lawyerA":
        return lawyerASignature;
      case "lawyerB":
        return lawyerBSignature;
    }
  };

  const getName = (role: SignatureRole) => {
    switch (role) {
      case "judge":
        return "Judge";
      case "lawyerA":
        return "Lawyer (Party A)";
      case "lawyerB":
        return "Lawyer (Party B)";
    }
  };

  const isAssigned = (role: SignatureRole) => {
    // Assignment fields removed - show placeholder
    return false;
  };

  const handleSendNotification = async (role: SignatureRole) => {
    if (!isAssigned(role)) {
      toast.error(`${roleConfig[role].label} not assigned yet`);
      return;
    }

    setSendingNotification(role);

    // Simulate sending notification
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(`Signature request sent to ${getName(role)}`, {
      description: "They will receive a notification to sign the case.",
    });

    setSendingNotification(null);
  };

  const SignatureCard = ({ role }: { role: SignatureRole }) => {
    const config = roleConfig[role];
    const Icon = config.icon;
    const signature = getSignature(role);
    const name = getName(role);
    const assigned = isAssigned(role);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-lg border-2",
          signature ? "border-emerald-500/30 bg-emerald-500/5" : config.border,
          config.bg,
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon
              className={cn(
                "w-5 h-5",
                signature ? "text-emerald-500" : config.color,
              )}
            />
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
          </div>

          {signature
            ? (
              <div className="flex items-center gap-2 text-emerald-500">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Signed</span>
              </div>
            )
            : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Pending</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSendNotification(role)}
                  disabled={!assigned || sendingNotification === role}
                >
                  {sendingNotification === role
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : (
                      <>
                        <Bell className="w-3 h-3 mr-1" />
                        Notify
                      </>
                    )}
                </Button>
              </div>
            )}
        </div>

        {signature && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">
              Digital Signature
            </p>
            <p className="font-serif italic text-lg">{signature}</p>
          </div>
        )}

        {!assigned && !signature && (
          <p className="text-xs text-destructive mt-2">
            ⚠️ Not assigned - please assign before requesting signature
          </p>
        )}
      </motion.div>
    );
  };

  const allSigned = judgeSignature && lawyerASignature && lawyerBSignature;
  const signedCount =
    [judgeSignature, lawyerASignature, lawyerBSignature].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Signature Status</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {signedCount}/3 collected
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Send signature requests to the Judge and Lawyers. They will sign from
        their respective dashboards.
      </p>

      {/* Signature Cards */}
      <div className="space-y-3">
        <SignatureCard role="judge" />
        <SignatureCard role="lawyerA" />
        <SignatureCard role="lawyerB" />
      </div>

      {/* Status */}
      {allSigned && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center"
        >
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-medium text-emerald-500">
            All Signatures Collected
          </p>
          <p className="text-sm text-muted-foreground">
            Ready to submit to IPFS
          </p>
        </motion.div>
      )}
    </div>
  );
};
