import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircularProgress, Alert } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import api from "../api/axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (!window.google) {
      setError("Google Sign-In is still loading. Please try again in a moment.");
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.");
      console.error("VITE_GOOGLE_CLIENT_ID is missing from the environment.");
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      callback: async (response) => {
        if (response.error) {
          console.error("Google Sign-In error:", response.error);
          setError(`Google Sign-In error: ${response.error_description || response.error}`);
          return;
        }

        const accessToken = response.access_token;
        setLoading(true);
        setError("");

        try {
          const { data } = await api.post("/auth/google", { accessToken });
          login(data.token, data.user);
          navigate("/dashboard");
        } catch (err) {
          setError(err.response?.data?.message || "Google Sign-In failed. Please try again.");
        } finally {
          setLoading(false);
        }
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-slate-950 px-4 transition-colors duration-300 relative overflow-hidden">
      {/* Theme toggle in top-right */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative gradient background animations */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#eb4245]/10 to-[#a855f7]/10 blur-[80px] pointer-events-none z-0 animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#06b6d4]/10 to-[#6366f1]/10 blur-[80px] pointer-events-none z-0 animate-pulse duration-[10000ms] reverse"></div>

      <div className="animate-fade-in w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] p-8 border border-neutral-100 dark:border-slate-800/80 transition-colors duration-300 relative z-10">
        <h1 className="text-[2.2rem] font-black tracking-tight text-neutral-900 dark:text-white text-center font-sans mb-1 leading-tight">
          WELCOME BACK
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm text-center mb-8 font-normal">
          Welcome back! Please enter your details.
        </p>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full h-12 px-4 rounded-[12px] border border-neutral-300 dark:border-slate-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#eb4245]/20 focus:border-[#eb4245] transition-all font-sans"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="**********"
                className="w-full h-12 px-4 rounded-[12px] border border-neutral-300 dark:border-slate-700 bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#eb4245]/20 focus:border-[#eb4245] transition-all font-sans"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.476 8.563 6.911 6 11 6c4.089 0 7.525 2.563 8.964 5.678.145.312.145.644 0 .948C18.525 15.437 15.089 18 11 18c-4.089 0-7.525-2.563-8.964-5.678z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm py-1">
            <label className="flex items-center text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-neutral-300 dark:border-slate-700 text-[#eb4245] focus:ring-[#eb4245]/20 mr-2 cursor-pointer accent-[#eb4245]"
              />
              Remember me
            </label>
            <a
              href="#"
              className="font-semibold text-neutral-700 dark:text-neutral-300 hover:underline"
            >
              Forgot password
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#eb4245] hover:bg-[#d63235] text-white font-bold rounded-[12px] shadow-[0_4px_12px_rgba(235,66,69,0.15)] hover:shadow-[0_6px_16px_rgba(235,66,69,0.25)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full h-12 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-[12px] flex items-center justify-center gap-3 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#ea4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.24 1 3.2 3.74 1.24 7.74l3.86 3C6.02 7.7 8.78 5.04 12 5.04z"
              />
              <path
                fill="#4285f4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.67-5.01 3.67-8.65z"
              />
              <path
                fill="#fbbc05"
                d="M5.1 14.26c-.24-.72-.38-1.49-.38-2.26s.14-1.54.38-2.26L1.24 6.74C.45 8.32 0 10.11 0 12s.45 3.68 1.24 5.26l3.86-3z"
              />
              <path
                fill="#34a853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.76-2.92c-1.1.74-2.52 1.18-4.2 1.18-3.22 0-5.98-2.66-6.9-5.7l-3.86 3C3.2 20.26 7.24 23 12 23z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-[#eb4245] hover:underline">
            Sign up for free!
          </Link>
        </p>
      </div>
    </div>
  );
}

