import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Heart, Clock, Utensils, LogOut, ChevronRight, PieChart } from "lucide-react";
import API from "@/services/api";
import { useAuth } from "../context/AuthContext";

const ProfileAccount = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [nameInput, setNameInput] = useState("");
    const [preferencesInput, setPreferencesInput] = useState("");

    const fetchData = async () => {
        try {
            const [profileRes, historyRes] = await Promise.all([
                API.get("/profile"),
                API.get("/history")
            ]);

            setProfile(profileRes.data);
            setNameInput(profileRes.data.full_name || "");
            setPreferencesInput((profileRes.data.dietary_preferences || []).join(", "));

            setHistory(historyRes.data || []);
        } catch (err) {
            console.error("Error fetching account data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveProfile = async () => {
        const dietary_preferences = preferencesInput.split(",").map(p => p.trim()).filter(p => p);

        try {
            const res = await API.put("/profile", {
                full_name: nameInput,
                dietary_preferences
            });
            setProfile(res.data);
            setEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    return (
        <DashboardLayout>
            {/* Header Area matches ShoppingList style */}
            <div className="bg-[#F3F7F4] min-h-screen -mx-6 px-6 pt-6 pb-32">
                {/* Header Removed */}

                {loading ? (
                    <div className="text-gray-500 text-sm mt-10 text-center animate-pulse">Loading profile facts...</div>
                ) : (
                    <div className="space-y-6">

                        {/* Profile Card */}
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-[14px] font-bold text-gray-800 flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-green-500" />
                                    Personal Details
                                </h2>
                                <button
                                    onClick={() => editing ? handleSaveProfile() : setEditing(true)}
                                    className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                >
                                    {editing ? "Save" : "Edit"}
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                                    {editing ? (
                                        <input
                                            value={nameInput}
                                            onChange={e => setNameInput(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-green-100 outline-none"
                                            placeholder="E.g., Monica"
                                        />
                                    ) : (
                                        <p className="font-medium text-gray-800">{profile?.full_name || "Not set"}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dietary Preferences</p>
                                    {editing ? (
                                        <input
                                            value={preferencesInput}
                                            onChange={e => setPreferencesInput(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-green-100 outline-none"
                                            placeholder="E.g., Vegetarian, Gluten-Free"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-2 mt-1.5">
                                            {profile?.dietary_preferences?.length > 0 ? (
                                                profile.dietary_preferences.map(pref => (
                                                    <span key={pref} className="bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-1 rounded-md">
                                                        {pref}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="font-medium text-gray-400 italic">None specified</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shopping Analytics/History */}
                        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                            <h2 className="text-[14px] font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <PieChart className="w-4 h-4 text-green-500" />
                                Shopping Summary
                            </h2>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50 flex flex-col items-center justify-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Trips</span>
                                    <span className="text-2xl font-black text-green-600">{history.length}</span>
                                </div>
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex flex-col items-center justify-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Spent</span>
                                    <span className="text-2xl font-black text-blue-600">
                                        ₹{history.reduce((sum, h) => sum + (Number(h.total_spent) || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recent Trips</h3>
                            {history.length === 0 ? (
                                <p className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">No shopping history yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {history.slice(0, 5).map(trip => (
                                        <div key={trip.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">
                                                        {new Date(trip.purchased_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500">
                                                        {trip.grocery_lists?.title || "Grocery Trip"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-2 text-gray-400">
                                                <span className="text-sm font-bold text-gray-800">₹{trip.total_spent || '0.00'}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* System Preferences */}
                        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mt-6">
                            <div
                                className="p-4 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => navigate("/analytics")}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500"><PieChart className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-gray-700">Analytics</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>

                            {/* Standard log out action */}
                            <div
                                onClick={async () => {
                                    await logout();
                                    navigate("/login");
                                }}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-50 group-hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 transition-colors"><LogOut className="w-4 h-4" /></div>
                                    <span className="text-sm font-bold text-red-600">Sign Out</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProfileAccount;
