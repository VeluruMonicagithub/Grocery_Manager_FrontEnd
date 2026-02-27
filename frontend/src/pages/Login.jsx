import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

import AuthLayout from "../components/layout/AuthLayout";
import Loader from "../components/common/Loader";
import { validateEmail, validatePassword } from "../utils/validators";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import API from "../services/api";

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email))
      return toast.error("Please enter a valid email address");

    if (!validatePassword(password))
      return toast.error("Password must be at least 6 characters");

    const res = await login(email, password);

    if (res.success) {
      toast.success("Welcome back!");

      const pendingInvite = localStorage.getItem("pendingInvite");
      if (pendingInvite) {
        try {
          await API.post("/members/accept", { invitationId: pendingInvite });
          localStorage.removeItem("pendingInvite");
        } catch (error) {
          console.error("Failed to accept pending invite", error);
        }
      }

      navigate("/dashboard");
    } else {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const inviteId = queryParams.get("invite");
    if (inviteId && inviteId !== "accepted") {
      // Legacy support: if they hit /login?invite=... we treat them as guests automatically
      navigate(`/shared?invite=${inviteId}`);
    }
  }, [location, navigate]);

  return (
    <AuthLayout>
      <Card className="w-[400px] p-8 rounded-2xl shadow-lg dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="space-y-6">

          <div className="flex flex-col items-center space-y-2">
            <div className="bg-green-100 dark:bg-green-950/40 p-4 rounded-full">
              <Leaf className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-semibold dark:text-white">My Pantry</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize your kitchen, reduce waste.
            </p>
          </div>

          <h2 className="text-lg font-semibold dark:text-white">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? <Loader /> : "Sign In"}
            </Button>
          </form>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>

        </CardContent>

      </Card>
    </AuthLayout>
  );
};

export default Login;
