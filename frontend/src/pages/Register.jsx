import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

import AuthLayout from "../components/layout/AuthLayout";
import Loader from "../components/common/Loader";
import { validateEmail, validatePassword } from "../utils/validators";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

const Register = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email))
      return toast.error("Enter valid email");

    if (!validatePassword(password))
      return toast.error("Password must be at least 6 characters");

    const res = await register(email, password);

    if (res.success) {
      toast.success("Account created successfully 🎉");

      //  NAVIGATION HERE
      navigate("/login");

    } else {
      toast.error(res.message);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const inviteId = queryParams.get("invite");
    if (inviteId && inviteId !== "accepted") {
      // Legacy support: if they hit /register?invite=... we treat them as guests automatically
      navigate(`/shared?invite=${inviteId}`);
    }
  }, [location, navigate]);

  return (
    <AuthLayout>
      <Card className="w-[400px] p-8 rounded-2xl shadow-lg dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="space-y-6">
          <h2 className="text-lg font-semibold text-center dark:text-white">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 text-white"
              disabled={loading}
            >
              {loading ? <Loader /> : "Register"}
            </Button>
          </form>

          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              Login
            </Link>
          </p>

        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default Register;