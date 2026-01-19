import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RoleCategory =
  | "judiciary"
  | "lawyer"
  | "clerk"
  | "public_party"
  | "police"
  | "legal_practitioner"; // Legacy support

type Profile = {
  id: string;
  email: string;
  full_name: string;
  role_category: RoleCategory;
  phone: string | null;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  __devSetAuth?: (user: Partial<User>, profile: Profile) => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      },
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Development helper to set a fake authenticated user/profile when backend
  // auth/profile creation is failing during local development. This helps
  // frontend work to continue while the backend is being fixed.
  const __devSetAuth = (devUser: Partial<User>, devProfile: Profile) => {
    if (process.env.NODE_ENV !== "development") return;
    const fakeUser = {
      id: devUser.id ?? `dev-${Date.now()}`,
      email: (devUser as any).email ?? devProfile.email,
      ...devUser,
    } as User;

    setUser(fakeUser);
    setSession(null);
    setProfile(devProfile);
    toast.success("Development sign-in: simulated user created");
    console.warn(
      "AuthContext.__devSetAuth used — this should only run in development",
    );
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast.success("Signed out successfully");
  };

  const value = {
    user,
    session,
    profile,
    signOut,
    __devSetAuth,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
