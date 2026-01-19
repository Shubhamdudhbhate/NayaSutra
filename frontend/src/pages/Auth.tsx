import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clipboard,
  Gavel,
  Loader2,
  Scale,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { verifyWalletAuthorization } from "@/services/walletVerificationService";
import { toast } from "sonner";

type RoleCategory =
  | "judiciary"
  | "lawyer"
  | "clerk"
  | "public_party"
  | "police";

const roleConfig = {
  judiciary: {
    title: "Judiciary Portal",
    subtitle: "Judges & Administrators",
    icon: Gavel,
    theme: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    gradient: "from-amber-600 to-amber-700",
    description: "Manage cases, review evidence, and issue judgments",
  },
  lawyer: {
    title: "Lawyer Portal",
    subtitle: "Legal Practitioners & Advocates",
    icon: Briefcase,
    theme: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    gradient: "from-blue-600 to-blue-700",
    description: "File cases, manage client matters, and track evidence",
  },
  clerk: {
    title: "Court Staff Portal",
    subtitle: "Clerks & Paralegals",
    icon: Clipboard,
    theme: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    gradient: "from-cyan-600 to-cyan-700",
    description: "Process documents, manage records, and coordinate filings",
  },
  public_party: {
    title: "Public Portal",
    subtitle: "Plaintiffs, Defendants & Citizens",
    icon: Users,
    theme: "text-slate-400",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
    gradient: "from-slate-600 to-slate-700",
    description: "Track your cases and access case documents",
  },
  police: {
    title: "Police Portal",
    subtitle: "Officers & Investigators",
    icon: Shield,
    theme: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    gradient: "from-emerald-600 to-emerald-700",
    description: "File FIRs and manage investigation evidence",
  },
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, __devSetAuth } = useAuth();
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    signMessage,
    isSigning,
  } = useWeb3();
  const [authInitiated, setAuthInitiated] = useState(false);

  const roleParam = searchParams.get("role") as RoleCategory | null;
  const role: RoleCategory = roleParam && roleConfig[roleParam]
    ? roleParam
    : "public_party";
  const config = roleConfig[role];
  const Icon = config.icon;

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (isConnected) return;
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            connect();
          }
        } catch (err) {
          console.error("Error checking existing connection", err);
        }
      }
    };
    checkExistingConnection();
  }, [isConnected, connect]);

  const handleAuth = async () => {
    if (!isConnected || !address) return;
    setAuthInitiated(true);

    try {
      // STEP 1: Verify wallet is authorized for this role
      console.log(`[Auth] Verifying wallet ${address} for role: ${role}`);
      const walletVerification = await verifyWalletAuthorization(address, role);

      if (!walletVerification.isAuthorized) {
        toast.error(
          walletVerification.error ||
            `Your wallet is not authorized for the ${role} role. Please contact an administrator.`,
        );
        setAuthInitiated(false);
        return;
      }

      toast.success(`✓ Wallet verified for ${role} role`);

      // STEP 2: Sign message for wallet verification
      const walletEmail = `${address.toLowerCase()}@wallet.nyaysutra.court`;
      const message =
        `Sign in to NyaySutra\nWallet: ${address}\nRole: ${role}\nTimestamp: ${Date.now()}`;

      const signature = await signMessage(message);
      if (!signature) {
        setAuthInitiated(false);
        return;
      }

      const derivedPassword = `ns_wallet_${signature.slice(0, 32)}`;

      // STEP 3: Authenticate with Supabase
      const { data: signInData, error: signInError } = await supabase.auth
        .signInWithPassword({
          email: walletEmail,
          password: derivedPassword,
        });

      if (!signInError && signInData.session) {
        toast.success("Wallet authenticated successfully!");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role_category")
          .eq("user_id", signInData.user?.id)
          .maybeSingle();

        // Verify the retrieved role matches what we authorized
        if (profileData?.role_category !== role) {
          toast.error("Role mismatch detected. Please try again.");
          setAuthInitiated(false);
          return;
        }

        if (profileData?.role_category === "police") {
          navigate("/police/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      if (signInError?.message?.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth
          .signUp({
            email: walletEmail,
            password: derivedPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: `Wallet ${address.slice(0, 6)}...${
                  address.slice(-4)
                }`,
                role_category: role,
                wallet_address: address,
              },
            },
          });

        if (signUpError) {
          if (import.meta.env.DEV && __devSetAuth) {
            const devUser = { id: `dev-${Date.now()}`, email: walletEmail };
            const devProfile = {
              id: `devp-${Date.now()}`,
              email: walletEmail,
              full_name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
              role_category: role,
              wallet_address: address,
            };
            __devSetAuth(devUser, devProfile as any);
            navigate("/dashboard", { replace: true });
            return;
          }

          toast.error(signUpError.message ?? "Authentication failed");
          setAuthInitiated(false);
          return;
        }

        toast.success("Wallet connected & account created!");

        if (!signUpData.session) {
          const { data: postSignUpData, error: postSignUpError } =
            await supabase.auth
              .signInWithPassword({
                email: walletEmail,
                password: derivedPassword,
              });

          if (postSignUpError) {
            toast.error("Sign-in failed after creation. Please try again.");
            setAuthInitiated(false);
            return;
          }
        }

        if (role === "police") {
          navigate("/police/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else if (signInError) {
        toast.error(signInError.message);
        setAuthInitiated(false);
      }
    } catch (err: any) {
      console.error("Wallet auth error:", err);
      toast.error(err?.message ?? "Authentication failed");
      setAuthInitiated(false);
    }
  };

  const handleConnectWallet = () => {
    connect();
  };

  const buttonClass = cn(
    "w-full h-14 text-lg font-semibold rounded-xl transition-all relative overflow-hidden",
    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
    "shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30",
  );

  const roles: RoleCategory[] = [
    "judiciary",
    "lawyer",
    "clerk",
    "public_party",
    "police",
  ];

  // If no role selected yet, show role selection screen
  if (!roleParam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 grid-background opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                NyaySutra
              </span>
            </h1>
            <p className="text-xl text-slate-300">
              Choose your role to continue
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-6xl grid md:grid-cols-5 gap-4"
          >
            {roles.map((r, index) => {
              const cfg = roleConfig[r];
              const RoleIcon = cfg.icon;
              return (
                <motion.div
                  key={r}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ scale: 1.05, translateY: -5 }}
                  onClick={() => navigate(`/auth?role=${r}`)}
                  className={cn(
                    "glass-card p-6 rounded-2xl border-2 cursor-pointer transition-all",
                    cfg.border,
                    "hover:shadow-lg hover:shadow-blue-500/20",
                  )}
                >
                  <div className="text-center">
                    <div
                      className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-gradient-to-br",
                        cfg.gradient,
                      )}
                    >
                      <RoleIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {cfg.title.split(" ")[0]}
                    </h3>
                    <p className="text-xs text-slate-400 mb-3">
                      {cfg.description}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300">
                      Get Started
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center text-slate-400 mt-12 max-w-2xl"
          >
            Each role has specialized features tailored to your needs. Select
            your role to proceed with secure wallet-based authentication.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-background opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/auth")}
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        <div
          className={cn("glass-card p-8 rounded-2xl border-2", config.border)}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
              >
                <div
                  className={cn(
                    "absolute inset-0 blur-xl rounded-full opacity-50 w-20 h-20",
                    config.bg.replace("bg-", "bg-"),
                  )}
                />
                <div
                  className={cn(
                    "relative w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center border border-white/20",
                    config.gradient,
                  )}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>
              </motion.div>
            </div>
            <h1 className={cn("text-3xl font-bold", config.theme)}>
              {config.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              {config.subtitle}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {config.description}
            </p>
          </div>

          <div className="space-y-6">
            {isConnected && address
              ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Button
                    onClick={handleAuth}
                    disabled={isSigning || authInitiated}
                    className={cn(
                      buttonClass,
                      "border border-blue-400/50 flex justify-between items-center px-6",
                    )}
                  >
                    {isSigning || authInitiated
                      ? (
                        <div className="flex items-center justify-center w-full">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying Identity...
                        </div>
                      )
                      : (
                        <>
                          <span className="font-semibold text-lg">
                            Verify Wallet
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300 font-mono hidden sm:inline-block">
                              {address?.slice(0, 6)}...{address?.slice(-4)}
                            </span>
                            <div className="bg-green-500/20 p-1 rounded-full">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                          </div>
                        </>
                      )}
                  </Button>
                </motion.div>
              )
              : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className={buttonClass}
                  >
                    {isConnecting
                      ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      )
                      : (
                        <>
                          <Wallet className="w-5 h-5 mr-2" />
                          Connect MetaMask Wallet
                        </>
                      )}
                  </Button>
                </motion.div>
              )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-xs text-center text-slate-500"
            >
              🔒 Secure blockchain-based authentication. Your wallet controls
              your identity.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 pt-6 border-t border-white/10 space-y-2 text-xs text-slate-400"
          >
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                No password required - wallet signature authentication
              </span>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Immutable audit trail of all activities</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                Enterprise-grade security with blockchain verification
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
