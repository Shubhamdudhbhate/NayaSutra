import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Search } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { RegisterCaseForm } from "./RegisterCaseForm";
import { SearchCase } from "./SearchCase";
import { CaseManagementPanel } from "./CaseManagementPanel";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ClerkDashboard = () => {
  const { roleTheme } = useRole();
  const [manageCaseId, setManageCaseId] = useState("");
  const [activeCaseData, setActiveCaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCaseToManage = async () => {
    if (!manageCaseId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .or(`case_number.eq.${manageCaseId},unique_identifier.eq.${manageCaseId}`)
      .maybeSingle();

    if (error || !data) {
      toast.error("Case not found");
      setActiveCaseData(null);
    } else {
      setActiveCaseData(data);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Briefcase className={cn("w-8 h-8", `text-${roleTheme.primary}`)} />
          Clerk Dashboard
        </h1>
      </motion.div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="register">Register Case</TabsTrigger>
          <TabsTrigger value="search">Search Case</TabsTrigger>
          <TabsTrigger value="manage">Case Management</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <RegisterCaseForm />
        </TabsContent>

        <TabsContent value="search">
          <SearchCase />
        </TabsContent>

        <TabsContent value="manage">
          {!activeCaseData
            ? (
              <div className="p-8 border rounded-lg bg-secondary/10 text-center space-y-4">
                <h3 className="text-lg font-medium">Load Case to Manage</h3>
                <div className="flex max-w-md mx-auto gap-2">
                  <Input
                    placeholder="Enter Case Number (e.g. CASE-2026-001)"
                    value={manageCaseId}
                    onChange={(e) => setManageCaseId(e.target.value)}
                  />
                  <Button onClick={fetchCaseToManage} disabled={isLoading}>
                    {isLoading
                      ? <Loader2 className="animate-spin" />
                      : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )
            : (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setActiveCaseData(null)}
                  className="mb-4"
                >
                  Change Case
                </Button>
                <CaseManagementPanel caseData={activeCaseData} />
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
