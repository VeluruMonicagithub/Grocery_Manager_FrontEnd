import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./common/Loader";

const ProtectedRoute = ({ children }) => {
    const { user, sessionLoading } = useAuth();
    const location = useLocation();
    const guestInvite = localStorage.getItem("guestInviteId");

    if (sessionLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#F3F7F4]">
                <Loader />
            </div>
        );
    }

    if (!user && !guestInvite) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
