import { useEffect, useState } from "react";
import API from "@/services/api";
import { supabase } from "@/services/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Check, MoreVertical, Settings, ShoppingBag, Plus, BookOpen, Edit2, CheckCircle, Tag } from "lucide-react";
import { toast } from "react-toastify";

const ShoppingList = () => {
    const [items, setItems] = useState([]); // Grocery items
    const [pantryItems, setPantryItems] = useState([]); // Pantry items
    const [planningMode, setPlanningMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [budget, setBudget] = useState(0);
    const [budgetInput, setBudgetInput] = useState("");
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [itemPrices, setItemPrices] = useState({}); // Track estimated prices per item ID
    const [estimatingItems, setEstimatingItems] = useState({});

    const fetchItems = async () => {
        try {
            const [groceryRes, pantryRes, couponRes] = await Promise.all([
                API.get("/grocery"),
                API.get("/pantry"),
                API.get("/coupons").catch(() => ({ data: [] }))
            ]);

            setItems(groceryRes.data.items || []);
            setBudget(groceryRes.data.list?.budget_limit || 0);
            setBudgetInput(groceryRes.data.list?.budget_limit || "");

            setPantryItems(pantryRes.data || []);
            setCoupons(couponRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();

        // Real-time synchronization for shared household
        const channel = supabase
            .channel('public:grocery_items')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'grocery_items' },
                () => {
                    // Anytime someone edits a grocery list, refetch
                    fetchItems();
                }
            )
            .subscribe();

        return () => {
            // Delay cleanup slightly to prevent "WebSocket closed before established"
            // warnings caused by React 18 Strict Mode double-mounting immediately.
            setTimeout(() => {
                supabase.removeChannel(channel);
            }, 500);
        };
    }, []);

    const toggleItem = async (item) => {
        // Optimistic UI update
        const newItems = items.map(i => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i);
        setItems(newItems);

        await API.put("/grocery", {
            id: item.id,
            is_checked: !item.is_checked,
        });
        fetchItems(); // Sync with server
    };

    const lowStock = pantryItems.filter(item => item.quantity <= item.threshold);

    const handlePriceFocus = async (item) => {
        // Only estimate if empty
        if (itemPrices[item.id]) return;

        setEstimatingItems(prev => ({ ...prev, [item.id]: true }));
        try {
            const res = await API.post("/ai/estimate-price", { itemName: item.name });
            if (res.data && res.data.price) {
                setItemPrices(prev => ({ ...prev, [item.id]: res.data.price }));
            }
        } catch (err) {
            console.error("Failed to estimate price", err);
        } finally {
            setEstimatingItems(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleAddLowStock = async (item) => {
        const estimatedPrice = Number(itemPrices[item.id]) || 0;
        try {
            await API.post("/grocery", {
                name: item.name,
                quantity: 1,
                price: estimatedPrice,
                coupon: false,
                notes: `From Category: ${item.category || 'Pantry'}`,
            });
            toast.success(`${item.name} added to list!`);

            // clear the input
            setItemPrices(prev => ({ ...prev, [item.id]: "" }));

            fetchItems();
        } catch (err) {
            toast.error("Failed to add low stock item.");
        }
    };

    const handleSaveBudget = async () => {
        try {
            const newBudget = Number(budgetInput) || 0;
            await API.put("/grocery/budget", { budget_limit: newBudget });
            setBudget(newBudget);
            setIsEditingBudget(false);
            toast.success("Budget updated!");
        } catch (err) {
            toast.error("Failed to update budget.");
        }
    };

    const completedItems = items.filter((i) => i.is_checked);
    const completed = completedItems.length;

    // Budget-based progress
    const currentTotal = completedItems.reduce((acc, current) => acc + (Number(current.price) || 0), 0);
    let progress = 0;
    if (budget > 0) {
        progress = (currentTotal / budget) * 100;
    } else if (items.length > 0) {
        // Fallback to item count if no budget is set
        progress = (completed / items.length) * 100;
    }
    const displayProgress = Math.min(progress, 100);

    const finishShoppingTrip = async () => {
        if (completed === 0) {
            toast.info("You haven't checked off any items yet!");
            return;
        }

        // Calculate a rough estimated total based on prices in the database
        const estimatedTotal = completedItems.reduce((acc, current) => acc + (Number(current.price) || 0), 0);
        const totalEstimatedAll = items.reduce((acc, current) => acc + (Number(current.price) || 0), 0);

        try {
            // Assume we are using the first list_id available, since we haven't implemented multi-list selection yet
            const listId = completedItems[0]?.list_id;

            if (!listId) {
                toast.error("Could not determine List ID.");
                return;
            }

            // Post to history API
            await API.post("/history", {
                list_id: listId,
                total_spent: estimatedTotal
            });

            // Restock synced checkoff items into the planning pantry
            for (const item of completedItems) {
                const existingPantry = pantryItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
                if (existingPantry) {
                    await API.put("/pantry", { id: existingPantry.id, quantity: existingPantry.quantity + (Number(item.quantity) || 1) });
                } else {
                    await API.post("/pantry", { name: item.name, category: "Others", quantity: (Number(item.quantity) || 1), unit: item.unit || "Unit", threshold: 1 });
                }
            }

            toast.success(`Check-out Complete! ${completed} items logged into Pantry.`);

            // Usually, here you would delete the checked items or reset the list
            // For now we will just re-fetch
            fetchItems();
        } catch (err) {
            console.error("Error saving trip:", err);
            toast.error("Failed to save shopping trip.");
        }
    };

    // Group by section for Grocery List
    const grouped = items.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {});

    // Group by category for Virtual Pantry (Planning Mode)
    const planningGrouped = pantryItems.reduce((acc, item) => {
        const cat = item.category || "Others";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const totalEstimatedAll = items.reduce((acc, current) => acc + (Number(current.price) || 0), 0);

    return (
        <DashboardLayout>
            {/* Wrap in a white container to match the image's clean background */}
            <div className="bg-white min-h-screen -mx-6 px-6 pt-6 pb-32">

                {/* Header Removed */}

                {/* Mode Toggle */}
                <div className="flex bg-gray-50/80 p-1.5 rounded-xl mb-6 border border-gray-100">
                    <button
                        onClick={() => setPlanningMode(true)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${planningMode
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Planning Mode
                    </button>
                    <button
                        onClick={() => setPlanningMode(false)}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!planningMode
                            ? "bg-white text-green-600 shadow-sm ring-1 ring-green-100"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Shopping Mode
                    </button>
                </div>

                {/* Progress Bar (Only in Shopping Mode) */}
                {!planningMode && (
                    <div className="mb-6 space-y-4">
                        <div className="bg-white rounded-xl">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700 font-medium">Budget Used</span>
                                <span className={`${progress > 100 ? 'text-red-500' : 'text-green-500'} font-bold`}>
                                    {budget > 0 ? `${Math.round(progress)}% of Budget` : `${Math.round(progress)}% Complete`}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-3">
                                <div
                                    className={`${progress > 100 ? 'bg-red-500' : 'bg-green-500'} h-full rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${displayProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Budget Info */}
                        <div className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Curr. Total</p>
                                <p className="text-lg font-black text-gray-800">
                                    ₹{completedItems.reduce((acc, current) => acc + (Number(current.price) || 0), 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget</p>
                                {isEditingBudget ? (
                                    <div className="flex gap-2 items-center justify-end mt-1">
                                        <input
                                            type="number"
                                            value={budgetInput}
                                            onChange={e => setBudgetInput(e.target.value)}
                                            className="w-16 px-2 py-1 text-sm font-bold bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-300"
                                        />
                                        <button onClick={handleSaveBudget} className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm hover:bg-green-700">Save</button>
                                        <button onClick={() => setIsEditingBudget(false)} className="bg-white text-gray-600 text-[10px] font-bold px-2 py-1 rounded border border-gray-200 shadow-sm hover:bg-gray-50">X</button>
                                    </div>
                                ) : (
                                    <p className={`text-lg font-black ${totalEstimatedAll > budget && budget > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {budget > 0 ? `₹${budget}` : "No Limit"}
                                        <button onClick={() => setIsEditingBudget(true)} className="ml-2 text-[10px] bg-white border border-green-200 px-1.5 py-0.5 rounded text-green-600 font-bold uppercase hover:bg-green-100">Edit</button>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Available Coupons Banner */}
                        {coupons.length > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3.5 rounded-xl border border-green-100/50">
                                <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" /> Active Store Deals
                                </h3>
                                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                    {coupons.map(c => (
                                        <div key={c.id} className="flex-shrink-0 bg-white px-3 py-2 rounded-lg border border-green-100 shadow-sm min-w-[140px]">
                                            <p className="text-[11px] font-bold text-gray-800 line-clamp-1">{c.store_name}</p>
                                            <p className="text-[13px] font-black text-green-600 tracking-tight">{c.discount_details}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* List Content */}
                {planningMode ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-4 px-1">
                            <h2 className="text-[14px] font-bold text-gray-800">Complete Virtual Pantry</h2>
                        </div>
                        {Object.keys(planningGrouped).map((section) => (
                            <div key={section} className="mb-6">
                                <div className="flex justify-between items-center bg-gray-50/80 py-2.5 px-4 -mx-4 mb-3 border-y border-gray-100">
                                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{section}</h2>
                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2.5 py-1 rounded-full">
                                        {planningGrouped[section].length} items
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {planningGrouped[section].sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                                        <div key={item.id} className="flex flex-col bg-white border border-gray-100 p-3.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:border-green-200">
                                            <div className="flex justify-between items-center">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[14px] text-gray-800 tracking-tight">{item.name}</span>
                                                    <span className="text-[11px] font-medium text-gray-400 mt-1">Available: <span className="text-gray-600 font-bold">{item.quantity} {item.unit}</span></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder={estimatingItems[item.id] ? "..." : "Est. Price"}
                                                            value={itemPrices[item.id] || ""}
                                                            onFocus={() => handlePriceFocus(item)}
                                                            onChange={(e) => setItemPrices({ ...itemPrices, [item.id]: e.target.value })}
                                                            disabled={estimatingItems[item.id]}
                                                            className={`w-[85px] pl-6 pr-2 py-1.5 text-[11px] font-bold border border-gray-200 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 placeholder:font-medium ${estimatingItems[item.id] ? 'animate-pulse bg-gray-50' : ''}`}
                                                        />
                                                    </div>
                                                    <button onClick={() => handleAddLowStock(item)} className="bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-colors">
                                                        Add to List
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Low Stock Suggestion Box in Shopping Mode */}
                        {lowStock.filter(ls => !items.find(gi => gi.name.toLowerCase() === ls.name.toLowerCase())).length > 0 && (
                            <div className="bg-orange-50/80 p-4 rounded-xl border border-orange-100 mb-6 mt-4">
                                <h3 className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Low Stock Suggestions
                                </h3>
                                <div className="space-y-2">
                                    {lowStock.filter(ls => !items.find(gi => gi.name.toLowerCase() === ls.name.toLowerCase())).map(ls => (
                                        <div key={ls.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg shadow-sm border border-orange-100/50">
                                            <span className="text-[13px] font-semibold text-gray-700">{ls.name} <span className="text-gray-400 font-normal ml-1">({ls.quantity} {ls.unit} left)</span></span>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder={estimatingItems[ls.id] ? "..." : "Est. Price"}
                                                        value={itemPrices[ls.id] || ""}
                                                        onFocus={() => handlePriceFocus(ls)}
                                                        onChange={(e) => setItemPrices({ ...itemPrices, [ls.id]: e.target.value })}
                                                        disabled={estimatingItems[ls.id]}
                                                        className={`w-[70px] pl-5 pr-1 py-1 text-[10px] font-bold border border-orange-200 rounded outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-100 placeholder:font-medium ${estimatingItems[ls.id] ? 'animate-pulse bg-orange-50' : ''}`}
                                                    />
                                                </div>
                                                <button onClick={() => handleAddLowStock(ls)} className="text-[10px] font-bold text-white bg-orange-400 hover:bg-orange-500 px-3 py-1.5 rounded transition-colors shadow-sm uppercase tracking-wide">Add</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {Object.keys(grouped).map((section) => {
                            // In shopping mode, explicitly hide checked items from standard list views to focus on actionable items
                            const sectionItems = grouped[section].filter((item) => !item.is_checked);

                            if (sectionItems.length === 0) return null;

                            return (
                                <div key={section} className="mb-6">
                                    {/* Section Header */}
                                    <div className="flex justify-between items-center bg-gray-50/80 py-2.5 px-4 -mx-4 mb-3 border-y border-gray-100">
                                        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                            {section}
                                        </h2>
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200/50 px-2.5 py-1 rounded-full">
                                            {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
                                        </span>
                                    </div>

                                    {/* Action items with huge tap targets */}
                                    <div className="space-y-1">
                                        {sectionItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between group py-3 bg-white hover:bg-gray-50/50 transition-colors px-1 rounded-xl">
                                                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleItem(item)}>
                                                    {/* High contrast large Checkbox */}
                                                    <div
                                                        className="w-7 h-7 flex-shrink-0 rounded-[8px] border-[2px] flex items-center justify-center transition-all shadow-sm border-gray-300 group-hover:border-green-400 bg-white"
                                                    >
                                                    </div>

                                                    {/* Info with large tap targets and high contrast */}
                                                    <div className="flex-1 pt-0.5">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="font-bold text-[17px] tracking-tight text-gray-900">
                                                                {item.name}
                                                            </p>
                                                            {item.coupon && (
                                                                <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                    Coupon
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[13px] font-medium text-gray-500">
                                                            {item.quantity} {item.unit || 'Unit'} <span className="mx-1.5 text-gray-300">•</span> ~₹{item.price || '0.00'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* More Options */}
                                                <button className="p-3 -mr-2 text-gray-300 hover:text-gray-600 transition-colors">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Completed/Eliminated Items Section at the very bottom */}
                        {completed > 0 && (
                            <div className="mt-10 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-end mb-3 px-1">
                                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        Checked Items ({completed})
                                    </h2>
                                    <button
                                        onClick={finishShoppingTrip}
                                        className="text-[10px] font-black tracking-wide bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-full uppercase transition-colors flex items-center gap-1"
                                    >
                                        <CheckCircle className="w-3 h-3" strokeWidth={3} />
                                        Log Trip
                                    </button>
                                </div>
                                <div className="space-y-1 opacity-60">
                                    {items.filter(i => i.is_checked).map(item => (
                                        <div key={item.id} className="flex items-center gap-4 py-2 px-1">
                                            <div onClick={() => toggleItem(item)} className="w-[26px] h-[26px] flex-shrink-0 rounded-[8px] bg-green-500 border-2 border-green-500 flex items-center justify-center cursor-pointer transition-transform hover:scale-95">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3.5} />
                                            </div>
                                            <p className="font-semibold text-[15px] text-gray-500 line-through flex-1 tracking-tight">{item.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}


            </div>
        </DashboardLayout>
    );
};

export default ShoppingList;