import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  studentData: any | null;
  isParent: boolean;
  isStudent: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const profileFetchInProgress = useRef(false);

  const fetchProfile = async (userId: string) => {
    if (profileFetchInProgress.current) return;
    profileFetchInProgress.current = true;
    
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      setProfile(profileData);

      if (profileData?.role === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", userId)
          .single();
        setStudentData(student);
      } else {
        setStudentData(null);
      }
    } finally {
      profileFetchInProgress.current = false;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid deadlock with Supabase auth
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setStudentData(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (initialSessionHandled) return;
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setStudentData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        studentData,
        isParent: profile?.role === "parent",
        isStudent: profile?.role === "student",
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
