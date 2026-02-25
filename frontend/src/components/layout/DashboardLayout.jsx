import { Bell, Home, CheckSquare, BookOpen, Settings, User, ShoppingBag, Bot, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import AIChefModal from "../common/AIChefModal";

const DashboardLayout = ({ children, hideHeader = false }) => {
    const location = useLocation();
    const [isAIChefOpen, setIsAIChefOpen] = useState(false);

    // Check if the user is in guest mode (i.e. using a guestInviteId without a full session)
    const isGuest = !!localStorage.getItem("guestInviteId");
    return (
        <div className="min-h-screen bg-[#F3F7F4] pb-24 font-sans text-gray-800">
            {/* Top Header */}
            {!hideHeader && (
                <div className="flex justify-between items-center p-6 bg-[#F3F7F4]">
                    <div className="flex items-center gap-3">
                        <img
                            src="https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=fbe2ca"
                            alt="Profile"
                            className="w-10 h-10 rounded-full border border-gray-200"
                        />
                        <div>
                            <p className="text-xs text-gray-500">Welcome back,</p>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">Pantry Manager</h1>
                        </div>
                    </div>
                    <button className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                        <Bell className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            <div className="px-6">
                {children}
            </div>

            {/* Floating Action Button for AI Chef */}
            <button
                onClick={() => setIsAIChefOpen(true)}
                className="fixed bottom-20 right-6 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg shadow-green-200 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
            >
                <Bot className="w-6 h-6" />
                <span className="font-bold text-sm tracking-wide hidden sm:block md:hidden lg:block group-hover:block transition-all mr-1">Ask AI Chef</span>
            </button>

            {/* AI Chef Modal */}
            <AIChefModal isOpen={isAIChefOpen} onClose={() => setIsAIChefOpen(false)} />

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-40">
                <Link to="/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/dashboard' ? 'text-green-600' : 'text-gray-400'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pantry</span>
                </Link>
                <Link to="/list" className={`flex flex-col items-center gap-1 ${location.pathname === '/list' ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckSquare className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">List</span>
                </Link>
                <Link to="/recipes" className={`flex flex-col items-center gap-1 ${location.pathname === '/recipes' ? 'text-green-600' : 'text-gray-400'}`}>
                    <BookOpen className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Recipes</span>
                </Link>

                {!isGuest && (
                    <>
                        <Link to="/members" className={`flex flex-col items-center gap-1 ${location.pathname === '/members' ? 'text-green-600' : 'text-gray-400'}`}>
                            <Users className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Members</span>
                        </Link>
                        <Link to="/account" className={`flex flex-col items-center gap-1 ${location.pathname === '/account' ? 'text-green-600' : 'text-gray-400'}`}>
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Account</span>
                        </Link>
                    </>
                )}

                {isGuest && (
                    <div className="flex flex-col items-center gap-1 text-orange-500">
                        <Users className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Guest Mode</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;