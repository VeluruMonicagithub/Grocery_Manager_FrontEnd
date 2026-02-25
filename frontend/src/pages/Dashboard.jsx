import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuickAddModal from "@/components/common/QuickAddModal";
import UsageModal from "@/components/common/UsageModal";
import API from "@/services/api";
import { Plus, Minus, Search, Milk, Wheat, Apple, Snowflake, Package, Droplets, ShoppingBag } from "lucide-react";
import { toast } from "react-toastify";

const categories = [
    { name: "Produce", icon: <Apple className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Dairy", icon: <Droplets className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Grains", icon: <Wheat className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Canned Goods", icon: <Apple className="w-8 h-8 text-green-500 mb-2" /> }, // Consider a different icon if available
    { name: "Frozen", icon: <Snowflake className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Others", icon: <Package className="w-8 h-8 text-green-500 mb-2" /> },
];

const Dashboard = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openUsageModal, setOpenUsageModal] = useState(false);
    const [pantry, setPantry] = useState([]);
    const [groceryItems, setGroceryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemPrices, setItemPrices] = useState({});
    const [estimatingItems, setEstimatingItems] = useState({});

    const fetchPantry = async () => {
        try {
            const [pantryRes, groceryRes] = await Promise.all([
                API.get("/pantry"),
                API.get("/grocery").catch(() => ({ data: { items: [] } }))
            ]);
            setPantry(pantryRes.data);
            setGroceryItems(groceryRes.data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (item, newQty) => {
        if (newQty < 0) return;

        await API.put("/pantry", {
            id: item.id,
            quantity: newQty,
        });

        fetchPantry();
    };

    const deleteItem = async (id) => {
        await API.delete(`/pantry/${id}`);
        fetchPantry();
    };

    useEffect(() => {
        fetchPantry();
    }, []);

    const lowStock = pantry.filter(
        (item) => item.quantity <= item.threshold && !groceryItems.find(gi => gi.name.toLowerCase() === item.name.toLowerCase())
    );

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

    const addToShoppingList = async (item) => {
        const estimatedPrice = Number(itemPrices[item.id]) || 0;
        try {
            await API.post("/grocery", {
                name: item.name,
                quantity: 1,
                price: estimatedPrice,
                coupon: false,
                notes: "From Dashboard Low Stock",
            });
            toast.success(`${item.name} added to Shopping List!`);
            setItemPrices(prev => ({ ...prev, [item.id]: "" }));
            fetchPantry(); // Refresh to hide it from Low Stock
        } catch (err) {
            console.error(err);
            toast.error("Failed to add to Shopping List.");
        }
    };

    return (
        <DashboardLayout>
            {/* Header / Search */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        placeholder="Search your pantry..."
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white shadow-sm border-none focus:ring-2 focus:ring-green-100 text-gray-700"
                    />
                </div>
            </div>

            {/* Low Stock */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Low Stock</h2>
                    <button className="text-xs font-semibold text-green-600">View All</button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                    {lowStock.map((item) => (
                        <div
                            key={item.id}
                            className="bg-green-50 p-5 rounded-[24px] shadow-md border border-green-200 min-w-[140px] flex flex-col items-center flex-shrink-0 relative group"
                        >
                            {/* Delete Button (Visible on hover) */}
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove Item"
                            >
                                x
                            </button>

                            <Milk className="w-8 h-8 text-green-500 mb-3" /> {/* Default icon, ideally mapped based on category */}
                            <h3 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h3>

                            {/* Progress Bar */}
                            <div className="w-full bg-green-50 h-1.5 rounded-full mt-2 mb-1">
                                <div
                                    className="bg-red-400 h-1.5 rounded-full"
                                    style={{
                                        width: `${Math.min(
                                            (item.quantity / item.threshold) * 100,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                                <button
                                    onClick={() => updateQuantity(item, item.quantity - 1)}
                                    className="w-5 h-5 flex flex-col items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-600 font-medium pb-0.5 leading-none"
                                >
                                    -
                                </button>
                                <p className="text-[10px] text-gray-400 font-medium">
                                    {item.quantity} {item.unit} left
                                </p>
                                <button
                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                    className="w-5 h-5 flex flex-col items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-gray-600 font-medium pb-0.5 leading-none"
                                >
                                    +
                                </button>
                            </div>

                            <div className="relative mt-3 w-full">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                                <input
                                    type="number"
                                    placeholder={estimatingItems[item.id] ? "..." : "Est. Price"}
                                    value={itemPrices[item.id] || ""}
                                    onFocus={() => handlePriceFocus(item)}
                                    onChange={(e) => setItemPrices({ ...itemPrices, [item.id]: e.target.value })}
                                    disabled={estimatingItems[item.id]}
                                    className={`w-full pl-6 pr-2 py-1.5 text-[11px] font-bold border border-green-200 rounded-lg outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100 placeholder:font-medium text-center ${estimatingItems[item.id] ? 'animate-pulse bg-gray-50' : ''}`}
                                />
                            </div>

                            <button
                                onClick={() => addToShoppingList(item)}
                                className="mt-2 w-full bg-white border border-green-200 text-green-600 hover:bg-green-50 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                                <ShoppingBag className="w-3 h-3" />
                                To List
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Virtual Pantry Categories */}
            <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold">
                        Virtual Pantry
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setOpenModal(true)}
                            className="bg-green-600 border border-green-600 hover:bg-green-700 text-white transition-colors px-4 py-2 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Quick Add
                        </button>
                        <button
                            onClick={() => setOpenUsageModal(true)}
                            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors px-4 py-2 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2"
                        >
                            <Minus className="w-4 h-4" />
                            Log Usage
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => {
                        const itemsInCategory = pantry.filter(item => item.category === cat.name);
                        return (
                            <div
                                key={cat.name}
                                className="bg-green-50 p-6 rounded-[24px] shadow-md border border-green-200 flex flex-col items-center justify-center min-h-[120px]"
                            >
                                {cat.icon}
                                <h3 className="font-bold text-gray-800 text-sm">{cat.name}</h3>
                                {itemsInCategory.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-400">
                                        {itemsInCategory.length} items
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Buttons Removed */}

            <QuickAddModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={fetchPantry}
            />

            <UsageModal
                open={openUsageModal}
                onClose={() => setOpenUsageModal(false)}
                onSuccess={fetchPantry}
                pantry={pantry}
            />
        </DashboardLayout>
    );
};

export default Dashboard;