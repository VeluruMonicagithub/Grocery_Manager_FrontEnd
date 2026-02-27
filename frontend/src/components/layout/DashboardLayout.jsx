import { Bell, Home, CheckSquare, BookOpen, Settings, User, ShoppingBag, Bot, Users, Leaf, Sun, Moon, Check, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import AIChefModal from "../common/AIChefModal";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";

const DashboardLayout = ({ children, hideHeader = false }) => {
    const { theme, toggleTheme } = useTheme();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const location = useLocation();
    const [isAIChefOpen, setIsAIChefOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    // Check if the user is in guest mode
    const isGuest = !!localStorage.getItem("guestInviteId");

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-[#F3F7F4] dark:bg-slate-950 pb-24 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {/* Top Header */}
            {!hideHeader && (
                <div className="flex justify-between items-center p-6 bg-[#F3F7F4] dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-green-600" />
                        <h1 className="text-xl font-bold text-green-800 dark:text-green-400 leading-tight">Pantry Manager</h1>
                    </div>
                    <div className="flex items-center gap-2 relative" ref={notifRef}>
                        <button
                            onClick={toggleTheme}
                            className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 relative"
                            >
                                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden transform origin-top-right transition-all">
                                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                                        <h3 className="font-bold text-sm">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] font-black text-green-600 hover:text-green-700 uppercase tracking-wider"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2 opacity-20" />
                                                <p className="text-xs text-gray-400">No notifications yet</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className={`p-4 border-b border-gray-50 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors relative ${!notif.is_read ? 'bg-green-50/20 dark:bg-green-950/10' : ''}`}
                                                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-gray-100 dark:bg-slate-800' : 'bg-green-100 dark:bg-green-900/40'}`}>
                                                            {notif.is_read ? <Check className="w-4 h-4 text-gray-400" /> : <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`text-xs leading-relaxed ${!notif.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                                {notif.message}
                                                            </p>
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(notif.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {notifications.length > 0 && (
                                        <div className="p-3 bg-gray-50 dark:bg-slate-800/50 text-center border-t border-gray-100 dark:border-slate-800">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">Recent Activity</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="px-6">
                {children}
            </div>

            {/* Floating Action Button for AI Chef */}
            <button
                onClick={() => setIsAIChefOpen(true)}
                className="fixed bottom-20 right-6 z-40 bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg shadow-green-200 dark:shadow-green-900/40 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
            >
                <Bot className="w-6 h-6" />
                <span className="font-bold text-sm tracking-wide hidden sm:block md:hidden lg:block group-hover:block transition-all mr-1">Ask AI Chef</span>
            </button>

            {/* AI Chef Modal */}
            <AIChefModal isOpen={isAIChefOpen} onClose={() => setIsAIChefOpen(false)} />

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-3 flex justify-between items-center z-40">
                <Link to="/dashboard" className={`flex flex-col items-center gap-1 ${location.pathname === '/dashboard' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pantry</span>
                </Link>
                <Link to="/list" className={`flex flex-col items-center gap-1 ${location.pathname === '/list' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                    <CheckSquare className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">List</span>
                </Link>
                <Link to="/recipes" className={`flex flex-col items-center gap-1 ${location.pathname === '/recipes' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                    <BookOpen className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Recipes</span>
                </Link>

                {!isGuest && (
                    <>
                        <Link to="/members" className={`flex flex-col items-center gap-1 ${location.pathname === '/members' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                            <Users className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Members</span>
                        </Link>
                        <Link to="/account" className={`flex flex-col items-center gap-1 ${location.pathname === '/account' ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
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