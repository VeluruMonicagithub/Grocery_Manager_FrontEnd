import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuickAddModal from "@/components/common/QuickAddModal";
import UsageModal from "@/components/common/UsageModal";
import API from "@/services/api";
import { Plus, Minus, Search, Milk, Wheat, Apple, Snowflake, Package, Droplets, ShoppingBag, BookOpen, Tag, ArrowRight, X } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const categories = [
    { name: "Produce", icon: <Apple className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Dairy", icon: <Droplets className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Grains", icon: <Wheat className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Canned Goods", icon: <Apple className="w-8 h-8 text-green-500 mb-2" /> }, // Consider a different icon if available
    { name: "Frozen", icon: <Snowflake className="w-8 h-8 text-green-500 mb-2" /> },
    { name: "Others", icon: <Package className="w-8 h-8 text-green-500 mb-2" /> },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [openModal, setOpenModal] = useState(false);
    const [openUsageModal, setOpenUsageModal] = useState(false);
    const [pantry, setPantry] = useState([]);
    const [groceryItems, setGroceryItems] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemPrices, setItemPrices] = useState({});
    const [estimatingItems, setEstimatingItems] = useState({});

    // Simple search states
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredPantry, setFilteredPantry] = useState([]);

    // Global search states from backup
    const [recipes, setRecipes] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    const fetchPantry = async () => {
        try {
            const [pantryRes, groceryRes, couponRes] = await Promise.all([
                API.get("/pantry"),
                API.get("/grocery").catch(() => ({ data: { items: [] } })),
                API.get("/coupons").catch(() => ({ data: [] }))
            ]);
            setPantry(pantryRes.data);
            setGroceryItems(groceryRes.data.items || []);
            setCoupons(couponRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteItem = async (id) => {
        await API.delete(`/pantry/${id}`);
        fetchPantry();
    };

    useEffect(() => {
        fetchPantry();
        fetchRecipes();
    }, []);

    useEffect(() => {
        setFilteredPantry(pantry);
    }, [pantry]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSearchResults && !event.target.closest('.search-container')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSearchResults]);

    const fetchRecipes = async () => {
        try {
            const res = await API.get("/recipes");
            setRecipes(res.data || []);
        } catch (err) {
            console.error("Failed to fetch recipes:", err);
        }
    };

    const performGlobalSearch = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        const results = [];

        try {
            const searchLower = query.toLowerCase();

            // Search pantry items
            const pantryResults = pantry.filter(item =>
                (item.name || "").toLowerCase().includes(searchLower) ||
                (item.category || "").toLowerCase().includes(searchLower)
            ).map(item => ({
                ...item,
                type: 'pantry',
                page: 'dashboard',
                description: `${item.quantity} ${item.unit} in ${item.category}`,
                icon: <Package className="w-4 h-4 text-green-500" />
            }));

            // Search shopping list items
            const groceryResults = groceryItems.filter(item =>
                (item.name || "").toLowerCase().includes(searchLower) ||
                (item.section || "").toLowerCase().includes(searchLower)
            ).map(item => ({
                ...item,
                type: 'shopping',
                page: 'list',
                description: `Quantity: ${item.quantity} ${item.unit} • Section: ${item.section}`,
                icon: <ShoppingBag className="w-4 h-4 text-blue-500" />
            }));

            // Search recipes
            const recipeResults = recipes.filter(recipe =>
                (recipe.title || "").toLowerCase().includes(searchLower) ||
                (recipe.description && recipe.description.toLowerCase().includes(searchLower)) ||
                (recipe.dietary_tags && recipe.dietary_tags.some(tag => tag.toLowerCase().includes(searchLower)))
            ).map(recipe => ({
                ...recipe,
                type: 'recipe',
                page: 'recipes',
                description: recipe.description ? recipe.description.split('|||IMAGE:')[0].substring(0, 100) + '...' : 'No description available',
                icon: <BookOpen className="w-4 h-4 text-purple-500" />
            }));

            // Search coupons
            const couponResults = coupons.filter(coupon =>
                (coupon.grocery_item_name || "").toLowerCase().includes(searchLower)
            ).map(coupon => ({
                ...coupon,
                type: 'coupon',
                page: 'list',
                description: `${coupon.discount_percentage}% off • Valid till: ${new Date(coupon.valid_till).toLocaleDateString()}`,
                icon: <Tag className="w-4 h-4 text-orange-500" />
            }));

            results.push(...pantryResults, ...groceryResults, ...recipeResults, ...couponResults);
            setSearchResults(results);
            setShowSearchResults(true);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Clear existing timeout
        if (searchTimeout) clearTimeout(searchTimeout);

        // Local pantry filtering (legacy support for immediate UI feedback if needed)
        if (query.trim()) {
            const filtered = pantry.filter(item =>
                (item.name || "").toLowerCase().includes(query.toLowerCase()) ||
                (item.category || "").toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPantry(filtered);
        } else {
            setFilteredPantry(pantry);
        }

        // Global search with debouncing
        const timeout = setTimeout(() => {
            performGlobalSearch(query);
        }, 300);
        setSearchTimeout(timeout);
    };

    const handleResultClick = (result) => {
        setShowSearchResults(false);
        setSearchQuery("");

        switch (result.page) {
            case 'dashboard':
                navigate('/dashboard');
                break;
            case 'list':
                navigate('/list');
                break;
            case 'recipes':
                navigate('/recipes');
                break;
            default:
                navigate('/dashboard');
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setFilteredPantry(pantry);
        setSearchResults([]);
        setShowSearchResults(false);
    };

    // Helper function to check if an item has a coupon
    const getApplicableCoupon = (itemName) => {
        if (!itemName) return null;
        return coupons.find(c => itemName.toLowerCase().includes((c.grocery_item_name || "").toLowerCase()));
    };

    // Function to get names of items on offer in a category
    const getOfferItems = (categoryName) => {
        // Find offers from both pantry items and grocery items
        const pantryItemsInCategory = (searchQuery ? filteredPantry : pantry).filter(item => item.category === categoryName);
        const groceryItemsInCategory = groceryItems.filter(item => {
            // Map grocery item sections to categories
            let category = "Others";
            if (item.section === "Produce") category = "Produce";
            else if (item.section === "Dairy") category = "Dairy";
            else if (item.section === "Grains") category = "Grains";
            else if (item.section === "Canned Goods") category = "Canned Goods";
            else if (item.section === "Frozen") category = "Frozen";

            return category === categoryName;
        });

        const allItems = [...pantryItemsInCategory, ...groceryItemsInCategory];
        const offerItems = allItems
            .filter(item => getApplicableCoupon(item.name))
            .map(item => item.name);

        // Return unique names
        return [...new Set(offerItems)];
    };

    const getDaysRemaining = (expirationDate) => {
        if (!expirationDate) return null;
        const today = new Date();
        const expDate = new Date(expirationDate);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const expiringSoon = pantry
        .filter(item => item.expiration_date)
        .map(item => ({ ...item, daysLeft: getDaysRemaining(item.expiration_date) }))
        .filter(item => item.daysLeft !== null && item.daysLeft <= 7) // Show items expiring within 7 days
        .sort((a, b) => a.daysLeft - b.daysLeft);

    const lowStock = pantry.filter(
        (item) => item.quantity <= item.threshold && !groceryItems.find(gi => gi.name.toLowerCase() === item.name.toLowerCase())
    );

    const updateQuantity = async (item, newQty) => {
        if (newQty < 0) return;

        await API.put("/pantry", {
            id: item.id,
            quantity: newQty,
        });

        fetchPantry();
    };

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
                <div className="relative search-container">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search anything... pantry, recipes, shopping list, coupons"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => searchQuery && setShowSearchResults(true)}
                        className="w-full pl-12 pr-10 py-4 rounded-xl bg-white dark:bg-slate-900 shadow-sm border-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 text-gray-700 dark:text-gray-200 transition-colors"
                    />

                    {/* Clear button */}
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 max-h-96 overflow-y-auto z-50">
                        {isSearching ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                Searching...
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No results found for "{searchQuery}"
                            </div>
                        ) : (
                            <div className="p-2">
                                {searchResults.map((result, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleResultClick(result)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            {result.icon}
                                        </div>
                                        <div className="flex-1 min-w-0 font-medium">
                                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                {result.name || result.title || result.grocery_item_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate font-semibold">
                                                {result.description}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 capitalize bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                    {result.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">
                                                    In {result.page === 'dashboard' ? 'Pantry' :
                                                        result.page === 'list' ? 'Shopping List' :
                                                            result.page === 'recipes' ? 'Recipes' : result.page}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Expiring Soon Section */}
            {expiringSoon.length > 0 && (
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Expiring Soon</h2>
                            <span className="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {expiringSoon.length} items
                            </span>
                        </div>
                        <button className="text-xs font-semibold text-green-600">View All</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {expiringSoon.map((item) => (
                            <div
                                key={item.id}
                                className={`p-5 rounded-[24px] shadow-sm border min-w-[140px] flex flex-col items-center flex-shrink-0 relative group transition-all ${item.daysLeft <= 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30' :
                                    item.daysLeft <= 3 ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/30' : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-100 dark:border-yellow-900/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-full mb-3 ${item.daysLeft <= 0 ? 'bg-red-100' :
                                    item.daysLeft <= 3 ? 'bg-orange-100' : 'bg-yellow-100'
                                    }`}>
                                    <Snowflake className={`w-6 h-6 ${item.daysLeft <= 0 ? 'text-red-500' :
                                        item.daysLeft <= 3 ? 'text-orange-500' : 'text-yellow-600'
                                        }`} />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{item.name}</h3>

                                <p className={`text-[11px] font-bold ${item.daysLeft <= 0 ? 'text-red-600' :
                                    item.daysLeft <= 3 ? 'text-orange-600' : 'text-yellow-700'
                                    }`}>
                                    {item.daysLeft <= 0 ? 'Expired' :
                                        item.daysLeft === 1 ? 'Expires tomorrow' :
                                            `Expires in ${item.daysLeft} days`}
                                </p>

                                <button
                                    onClick={() => deleteItem(item.id)}
                                    className="mt-3 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                >
                                    Used / Removed
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Results Section */}
            {searchQuery.trim() && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            Search Results for "{searchQuery}"
                        </h2>
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                            {filteredPantry.length} items found
                        </span>
                    </div>

                    {filteredPantry.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                            {filteredPantry.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white dark:bg-slate-900 p-5 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-800 min-w-[140px] flex flex-col items-center flex-shrink-0 relative group hover:border-green-200 dark:hover:border-green-900 transition-colors"
                                >
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Item"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>

                                    <div className="bg-green-50 dark:bg-slate-800 p-2 rounded-full mb-3">
                                        <Package className="w-6 h-6 text-green-500" />
                                    </div>

                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1 text-center truncate w-full">{item.name}</h3>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize mb-2">{item.category}</p>

                                    {item.expiration_date && (
                                        <div className={`mb-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${getDaysRemaining(item.expiration_date) <= 3 ? 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                                            }`}>
                                            Exp: {new Date(item.expiration_date).toLocaleDateString()}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mt-auto">
                                        <button
                                            onClick={() => updateQuantity(item, item.quantity - 1)}
                                            className="w-5 h-5 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
                                        >
                                            -
                                        </button>
                                        <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bold">
                                            {item.quantity}
                                        </p>
                                        <button
                                            onClick={() => updateQuantity(item, item.quantity + 1)}
                                            className="w-5 h-5 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-slate-900 rounded-[24px] p-8 text-center border border-dashed border-gray-200 dark:border-slate-800">
                            <Search className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No items found matching your search.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Low Stock */}
            {lowStock.length > 0 && (
                <div className="mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Low Stock</h2>
                            <span className="bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {lowStock.length} items
                            </span>
                        </div>
                        <button className="text-xs font-semibold text-green-600">View All</button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                        {lowStock.map((item) => (
                            <div
                                key={item.id}
                                className="bg-green-50 dark:bg-slate-900 p-5 rounded-[24px] shadow-md border border-green-200 dark:border-green-900/30 min-w-[140px] flex flex-col items-center flex-shrink-0 relative group"
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
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{item.name}</h3>

                                {/* Progress Bar */}
                                <div className="w-full bg-green-50 dark:bg-slate-800 h-1.5 rounded-full mt-2 mb-1">
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
                                        className="w-5 h-5 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 font-medium pb-0.5 leading-none"
                                    >
                                        -
                                    </button>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                        {item.quantity} {item.unit} left
                                    </p>
                                    <button
                                        onClick={() => updateQuantity(item, item.quantity + 1)}
                                        className="w-5 h-5 flex flex-col items-center justify-center bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 font-medium pb-0.5 leading-none"
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
                                        className={`w-full pl-6 pr-2 py-1.5 text-[11px] font-bold border border-green-200 dark:border-green-900/50 bg-white dark:bg-slate-800 rounded-lg outline-none focus:border-green-400 dark:focus:border-green-700 focus:ring-1 focus:ring-green-100 dark:focus:ring-green-900 placeholder:font-medium text-center text-gray-800 dark:text-gray-200 ${estimatingItems[item.id] ? 'animate-pulse bg-gray-50 dark:bg-slate-800' : ''}`}
                                    />
                                </div>

                                <button
                                    onClick={() => addToShoppingList(item)}
                                    className="mt-2 w-full bg-white dark:bg-slate-900 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-slate-800 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                                >
                                    <ShoppingBag className="w-3 h-3" />
                                    To List
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Virtual Pantry Categories */}
            <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
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
                            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors px-4 py-2 rounded-xl shadow-sm text-sm font-bold flex items-center gap-2"
                        >
                            <Minus className="w-4 h-4" />
                            Log Usage
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => {
                        const itemsInCategory = (searchQuery ? filteredPantry : pantry).filter(item => item.category === cat.name);
                        const offerItems = getOfferItems(cat.name);
                        return (
                            <div
                                key={cat.name}
                                className="bg-green-50 dark:bg-slate-900 p-6 rounded-[24px] shadow-md border border-green-200 dark:border-green-900/30 flex flex-col items-center justify-center min-h-[120px]"
                            >
                                {cat.icon}
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{cat.name}</h3>
                                {itemsInCategory.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                        {itemsInCategory.length} items
                                    </div>
                                )}
                                {offerItems.length > 0 && (
                                    <div className="mt-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 text-center">
                                        {offerItems.length} product{offerItems.length > 1 ? 's' : ''} are in offer
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
        </DashboardLayout >
    );
};

export default Dashboard;