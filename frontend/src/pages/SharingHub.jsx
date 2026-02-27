import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Settings, UserPlus, Check, X, Link as LinkIcon, Edit, Eye, ShoppingCart, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "@/services/api";
import { supabase } from "@/services/supabase";
import { toast } from "react-toastify";

const SharingHub = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [generatedLinks, setGeneratedLinks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [copied, setCopied] = useState(false);

    const fetchMembersData = async () => {
        setIsLoading(true);
        try {
            const [membersRes, linksRes] = await Promise.all([
                API.get("/members"),
                API.get("/members/links")
            ]);
            setMembers(membersRes.data.members || []);
            setGeneratedLinks(linksRes.data || []);
        } catch (error) {
            console.error("Failed to fetch sharing data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembersData();

        // Real-time synchronization for invitations
        const channel = supabase
            .channel('public:invitations')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'invitations' },
                () => {
                    // Refetch if anyone invites us or someone accepts our invite
                    fetchMembersData();
                }
            )
            .subscribe();

        return () => {
            // Delay cleanup slightly to prevent "WebSocket closed before established"
            // warnings caused by React 18 Strict Mode double-mounting.
            setTimeout(() => {
                supabase.removeChannel(channel);
            }, 500);
        };
    }, []);

    const handleGenerateLink = async () => {
        setIsInviting(true);
        setGeneratedLink("");
        setCopied(false);
        try {
            const res = await API.post("/members/generate-link");
            if (res.data?.data?.link) {
                setGeneratedLink(res.data.data.link);
            }
            fetchMembersData();
        } catch (error) {
            console.error("Failed to generate link", error);
            alert("Failed to generate link.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleCopy = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemoveMember = async (email) => {
        if (!window.confirm("Are you sure you want to remove this member? They will lose access to your pantry.")) return;

        try {
            await API.delete(`/members/${email}`);
            toast.success("Member removed successfully");
            fetchMembersData();
        } catch (error) {
            console.error("Failed to remove member", error);
            toast.error("Failed to remove member");
        }
    };

    return (
        <DashboardLayout hideHeader={true}>
            <div className="bg-[#F3F7F4] dark:bg-slate-950 min-h-screen -mx-6 px-6 pt-6 pb-24 transition-colors duration-300">
                {/* Custom Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">Sharing Hub</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage pantry access</p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors">
                        <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Invite Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Collaborate with Family &<br /> Friends</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                        Keep your kitchen organized together. Shared<br /> lists update instantly for everyone.
                    </p>

                    <div className="w-full flex gap-2 justify-center">
                        <button
                            onClick={handleGenerateLink}
                            disabled={isInviting}
                            className="w-full bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 font-bold px-6 py-3.5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                        >
                            {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LinkIcon className="w-5 h-5 mr-2" /> Generate Link</>}
                        </button>
                    </div>

                    {generatedLink && (
                        <div className="w-full mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-100 dark:border-green-900/40 flex flex-col gap-2 relative shadow-sm">
                            <span className="text-xs font-bold text-green-800 dark:text-green-400 text-left uppercase tracking-wider">Share this unique link:</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedLink}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-green-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-300 outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="bg-white dark:bg-slate-800 border border-green-200 dark:border-slate-700 hover:bg-green-100 dark:hover:bg-green-950/40 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-w-[85px] shadow-sm"
                                >
                                    {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><LinkIcon className="w-3.5 h-3.5" /> Copy</>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Unused Invite Links Section */}
                {generatedLinks.filter(l => !l.is_used).length > 0 && (
                    <div className="mt-8 mb-4">
                        <h3 className="text-xs font-bold text-orange-500 dark:text-orange-400 tracking-wider uppercase mb-3">Unused Invite Links</h3>
                        <div className="space-y-3">
                            {generatedLinks.filter(l => !l.is_used).map((linkObj) => (
                                <div key={linkObj.token} className="bg-orange-50 dark:bg-orange-950/20 rounded-2xl p-4 shadow-sm border border-orange-100 dark:border-orange-900/30 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                                            <LinkIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div className="truncate">
                                            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">Link: ...{linkObj.token.substring(0, 8)}</div>
                                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">Ready to be shared</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/shared?invite=${linkObj.token}`);
                                            toast.success("Link copied!");
                                        }}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors shadow-sm shrink-0 flex items-center gap-1"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" /> Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Family Members Section */}
                <div className="mt-8 mb-4">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-3">Family Members</h3>
                    <div className="space-y-3">
                        {/* Current User */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Aneka&backgroundColor=fbe2ca" alt="User Avatar" className="w-12 h-12 rounded-full border border-gray-100 dark:border-slate-800" />
                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 dark:text-gray-100">You</span>
                                        <span className="bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">ADMIN</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                        Active now
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="text-center py-4 text-sm text-gray-400 animate-pulse">
                                Syncing members...
                            </div>
                        )}

                        {/* Other Members */}
                        {!isLoading && members.length === 0 && (
                            <div className="text-center py-6 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                                You haven't invited anyone yet.
                            </div>
                        )}

                        {!isLoading && members.map((member, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border border-gray-100 dark:border-slate-800 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center shrink-0">
                                            <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">
                                                {member.email?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {/* Status Dot */}
                                        {member.role === 'admin' && (
                                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full ${member.status === 'accepted' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-700'}`}></div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1 break-all pr-4">{member.email}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{member.status} • {member.role}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {member.role === 'member' && (
                                        <button
                                            onClick={() => handleRemoveMember(member.email)}
                                            className="p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default SharingHub;
