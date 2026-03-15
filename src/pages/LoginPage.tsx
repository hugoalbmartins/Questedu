import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostLoginRoute } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Lock, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        toast.error("Credenciais inválidas. Verifica o email e a palavra-passe.");
        return;
      }
      if (!data.user) {
        toast.error("Sessão inválida. Tenta novamente.");
        return;
      }
      const targetRoute = await resolvePostLoginRoute(data.user);
      navigate(targetRoute);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex flex-col">

      {/* Top bar */}
      <div className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 text-amber-800 hover:text-amber-900 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold">Voltar</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="QuestEduca" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-amber-900 text-base">QuestEduca</span>
        </Link>
      </div>

      {/* Center form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-amber-950 mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-slate-500 text-sm">
              Entra na tua conta e continua a aventura.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-amber-100/60 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="email" className="font-semibold text-slate-700 text-sm flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o-teu@email.com"
                  required
                  autoComplete="email"
                  className="border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 bg-slate-50/50 text-base h-11 rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="password" className="font-semibold text-slate-700 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Palavra-passe
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-amber-600 hover:text-amber-700 font-semibold hover:underline"
                  >
                    Esqueci-me
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="border-slate-200 focus:border-amber-400 focus:ring-amber-400/20 bg-slate-50/50 text-base h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-base h-12 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] mt-2"
              >
                {loading ? "A entrar..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-3">
                Ainda nao tens conta?
              </p>
              <Link to="/register">
                <Button
                  variant="outline"
                  className="w-full border-2 border-green-400 text-green-700 hover:bg-green-50 hover:border-green-500 font-bold h-11 rounded-xl transition-all"
                >
                  Criar Conta Gratis
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
            Ao entrar, aceitas os nossos{" "}
            <Link to="/terms" className="text-amber-600 hover:underline">
              Termos de Utilizacao
            </Link>{" "}
            e a nossa{" "}
            <Link to="/privacy" className="text-amber-600 hover:underline">
              Politica de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
