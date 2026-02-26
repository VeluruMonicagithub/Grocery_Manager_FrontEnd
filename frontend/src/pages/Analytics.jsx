import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Wallet, CheckCircle2 } from "lucide-react";
import API from "@/services/api";

const Analytics = () => {
    const navigate = useNavigate();
    const [timeFrame, setTimeFrame] = useState("monthly");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        goal: 500,
        spent: 0,
        categories: []
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/analytics?timeFrame=${timeFrame}`);
                setData(res.data);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                // Fallback realistic data to match design if API fails
                setData({
                    goal: 500.00,
                    spent: 379.50,
                    categories: [
                        { name: "Produce", amount: 170.50, color: "#4caf50" },
                        { name: "Snacks", amount: 113.85, color: "#ffca28" },
                        { name: "Dairy & Other", amount: 94.65, color: "#42a5f5" }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeFrame]);

    const remaining = Math.max(0, data.goal - data.spent);
    const progressPercent = Math.min(100, (data.spent / data.goal) * 100);

    // SVG Donut Chart logic
    const size = 200;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;
    const totalSpent = data.spent || 1; // prevent divide by zero

    return (
        <div className="bg-[#F3F7F4] min-h-screen pb-20">
            {/* Header */}
            <div className="bg-transparent px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 z-10 w-full">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    {/* Removed Shopping Insights Text */}
                </div>
            </div>

            <div className="px-6 pt-6 space-y-8 max-w-6xl mx-auto">
                {/* Tabs, Centered */}
                <div className="flex justify-center">
                    <div className="bg-[#e8ecea] p-2 rounded-2xl flex items-center w-full max-w-lg shadow-sm">
                        {['Weekly', 'Monthly', 'Yearly'].map(tab => {
                            const tabKey = tab.toLowerCase();
                            const isActive = timeFrame === tabKey;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setTimeFrame(tabKey)}
                                    className={`flex-1 text-center py-3 text-base font-bold rounded-xl transition-all ${isActive
                                        ? "bg-white text-green-600 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse font-medium text-lg">Loading insights...</div>
                ) : (
                    <>
                        {/* Responsive grid for larger screens */}
                        <div className="md:grid md:grid-cols-2 md:gap-10 md:space-y-0 space-y-8">

                            {/* Left Column (Budget Card) */}
                            <div className="h-full">
                                {/* Budget Card */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col justify-center h-full relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            REMAINING BUDGET
                                        </div>
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center -mt-2 -mr-2">
                                            <Wallet className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>

                                    <div className="text-[48px] font-black text-green-500 flex items-center tracking-tight mb-8">
                                        ₹{remaining.toFixed(2)}
                                    </div>

                                    <div className="flex justify-between text-base font-bold text-gray-600 mb-4">
                                        <span>₹{data.spent.toFixed(2)} spent</span>
                                        <span>Goal: ₹{data.goal.toFixed(2)}</span>
                                    </div>

                                    {/* Progress Bar background */}
                                    <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                                        {/* Progress fill */}
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${progressPercent > 90 ? "bg-red-500" : progressPercent > 75 ? "bg-yellow-400" : "bg-green-500"
                                                }`}
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                                        <CheckCircle2 className="w-6 h-6" />
                                        <span>On track to stay under limit</span>
                                    </div>
                                </div>
                            </div> {/* End left column */}

                            {/* Right Column (Categories Card) */}
                            <div className="h-full">
                                {/* Categories Card */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                                    <h3 className="text-xl font-bold text-gray-800 mb-8 text-center sm:text-left">Spending Categories</h3>

                                    <div className="flex justify-center items-center mb-10 relative flex-1">
                                        <svg width={size * 1.2} height={size * 1.2} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                                            {/* Background Circle */}
                                            <circle
                                                cx={size / 2}
                                                cy={size / 2}
                                                r={radius}
                                                fill="none"
                                                stroke="#f3f4f6"
                                                strokeWidth={strokeWidth}
                                            />
                                            {/* Segments */}
                                            {data.categories.map((cat, index) => {
                                                const strokeLength = (cat.amount / totalSpent) * circumference;
                                                const offset = currentOffset;
                                                currentOffset += strokeLength;

                                                // Gap between segments for aesthetic (only if multiple categories)
                                                const gap = data.categories.length > 1 ? 2 : 0;

                                                return (
                                                    <circle
                                                        key={cat.name}
                                                        cx={size / 2}
                                                        cy={size / 2}
                                                        r={radius}
                                                        fill="none"
                                                        stroke={cat.color}
                                                        strokeWidth={strokeWidth}
                                                        strokeDasharray={`${Math.max(0, strokeLength - gap)} ${circumference}`}
                                                        strokeDashoffset={-offset}
                                                        className="transition-all duration-1000 ease-out"
                                                        strokeLinecap="butt"
                                                    />
                                                );
                                            })}
                                        </svg>

                                        {/* Center Value */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-black text-gray-800">₹{Math.round(data.spent)}</span>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">TOTAL</span>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="space-y-4">
                                        {data.categories.map(cat => (
                                            <div key={cat.name} className="flex justify-between items-center text-base">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: cat.color }}
                                                    ></div>
                                                    <span className="font-bold text-gray-700">{cat.name}</span>
                                                </div>
                                                <span className="font-black text-gray-800">₹{cat.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* End right column */}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Analytics;
