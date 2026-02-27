import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "@/services/api";
import { toast } from "react-toastify";
import { CheckCircle, Users } from "lucide-react";

const SharedAccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [inviteId, setInviteId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [guestName, setGuestName] = useState("");

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get("invite");
        if (id) {
            setInviteId(id);
        } else {
            navigate("/login");
        }
    }, [location, navigate]);

    const handleAccept = async () => {
        if (!inviteId) return;

        const finalName = guestName.trim() || "Anonymous Guest";

        setLoading(true);
        try {
            // Save the guest token so the API interceptor can use it immediately
            localStorage.setItem("guestInviteId", inviteId);

            // Explicitly accept the invitation so the owner sees them as 'accepted'
            await API.post("/members/accept", { invitationId: inviteId, guestName: finalName });

            toast.success("Welcome! You now have access to the shared pantry.");
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            toast.error("Failed to accept invitation or you are already an active member.");
            // If it failed because it was already accepted, we should just let them in anyway
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    };

    if (!inviteId) return null;

    return (
        <div className="min-h-screen bg-[#F3F7F4] dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-800 max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">You're Invited!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed text-sm">
                    Someone has invited you to collaborate on their Pantry and Shopping List.
                    Enter your name below to join!
                </p>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Your Name or Email"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:border-green-400 dark:focus:border-green-400 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/40 rounded-xl px-4 py-3 text-sm text-center text-gray-900 dark:text-gray-100 outline-none transition-all"
                    />
                </div>

                <button
                    onClick={handleAccept}
                    disabled={loading || !guestName.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                    {loading ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent"></div>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Accept & Join Pantry
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SharedAccess;
