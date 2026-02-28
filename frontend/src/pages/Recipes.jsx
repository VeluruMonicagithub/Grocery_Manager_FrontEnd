import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen, Search, Flame, Tag, Plus, Check, User, Calendar, X, ChefHat } from "lucide-react";
import API from "@/services/api";

const Recipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [recipeDetails, setRecipeDetails] = useState({});
    const [dietFilter, setDietFilter] = useState("All"); // All, Veg, NonVeg
    const [searchQuery, setSearchQuery] = useState("");
    const [isMatching, setIsMatching] = useState(false);
    const [selectedTag, setSelectedTag] = useState("All");
    const [userPreferences, setUserPreferences] = useState([]);
    const [matchMyDiet, setMatchMyDiet] = useState(false);
    const [pantryItems, setPantryItems] = useState([]);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [mealPlan, setMealPlan] = useState({});
    const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
    const [showIngredientConfirm, setShowIngredientConfirm] = useState(false);
    const [extractedIngredients, setExtractedIngredients] = useState([]);
    const [currentShoppingList, setCurrentShoppingList] = useState([]);

    const fetchData = async () => {
        try {
            const [recipesRes, profileRes, pantryRes, groceryRes] = await Promise.all([
                API.get("/recipes"),
                API.get("/profile"),
                API.get("/pantry"),
                API.get("/grocery").catch(() => ({ data: { items: [] } }))
            ]);
            setRecipes(recipesRes.data);
            if (profileRes.data && profileRes.data.dietary_preferences) {
                setUserPreferences(profileRes.data.dietary_preferences);
            }
            setPantryItems(pantryRes.data || []);
            setCurrentShoppingList(groceryRes.data.items || []);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };



    const handlePantryMatch = async () => {
        setIsMatching(true);
        try {
            // Hit the new local Matcher algorithm
            const res = await API.get("/recipes/matcher");

            // The matcher returns all recipes sorted with a matchPercentage property
            setRecipes(res.data);
        } catch (err) {
            console.error(err);
            alert("Failed to calculate pantry matches. Ensure you have items in your Virtual Pantry.");
        } finally {
            setIsMatching(false);
        }
    };

    const toggleRecipeDetails = async (id, instanceKey) => {
        if (expandedId === instanceKey) {
            setExpandedId(null);
            return;
        }

        setExpandedId(instanceKey);

        // Fetch detailed ingredients if we haven't already
        if (!recipeDetails[id]) {
            try {
                const res = await API.get(`/recipes/${id}`);
                setRecipeDetails(prev => ({ ...prev, [id]: res.data }));
            } catch (err) {
                console.error("Error fetching info:", err);
            }
        }
    };

    const handleSmartAddToList = async (recipeId) => {
        const details = recipeDetails[recipeId];
        if (!details || !details.ingredients) return;

        const pantryNames = pantryItems.map(p => p.name.toLowerCase().trim());
        const missingIngredients = [];

        details.ingredients.forEach(ing => {
            const reqName = ing.ingredient_name.toLowerCase().trim();
            // Same flexible matching as Matcher
            const hasIngredient = pantryNames.some(pantryName =>
                pantryName.includes(reqName) || reqName.includes(pantryName)
            );

            if (!hasIngredient) {
                missingIngredients.push(ing);
            }
        });

        if (missingIngredients.length === 0) {
            alert("Awesome! You already have all the ingredients in your pantry for this recipe.");
            return;
        }

        try {
            // Add missing ingredients to Grocery List
            await Promise.all(missingIngredients.map(ing =>
                API.post("/grocery", {
                    name: ing.ingredient_name,
                    quantity: ing.quantity || 1,
                    unit: ing.unit || "Unit",
                    price: 0,
                    coupon: false,
                    section: "Others",
                    notes: `From Recipe: ${details.title}`
                })
            ));
            alert(`Successfully added ${missingIngredients.length} missing ingredients to your Shopping List!`);
        } catch (err) {
            console.error("Failed to add to list:", err);
            alert("Failed to add ingredients to shopping list.");
        }
    };

    const handleMarkAsPrepared = async (recipeId) => {
        try {
            await API.post("/recipes/prepare", { recipeId, portions: 1 });
            alert("Meal logged! Your nutritional intake has been updated in Analytics.");
        } catch (err) {
            console.error("Failed to log meal:", err);
            alert("Failed to log meal. Please try again.");
        }
    };

    // Meal planning functions
    const handleMealPlanChange = (day, mealType, value) => {
        setMealPlan(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [mealType]: value
            }
        }));
    };

    const generateShoppingListFromMealPlan = async () => {
        setIsGeneratingShoppingList(true);
        try {
            // Collect all meal entries
            const allMeals = [];
            Object.values(mealPlan).forEach(dayMeals => {
                Object.values(dayMeals).forEach(meal => {
                    if (meal && meal.trim()) {
                        allMeals.push(meal.trim());
                    }
                });
            });

            console.log("Meals to process:", allMeals);

            if (allMeals.length === 0) {
                alert("Please add some meals to your plan first!");
                return;
            }

            // Extract ingredients from meals
            const ingredientsToAdd = [];

            // Simple ingredient extraction based on common meal patterns
            allMeals.forEach(meal => {
                // Common ingredients that might be needed
                const commonIngredients = [
                    'eggs', 'milk', 'bread', 'rice', 'chicken', 'vegetables',
                    'onions', 'tomatoes', 'potatoes', 'oil', 'salt', 'pepper',
                    'flour', 'sugar', 'butter', 'cheese', 'pasta', 'beans',
                    'garlic', 'carrots', 'lettuce', 'cucumber', 'yogurt'
                ];

                commonIngredients.forEach(ingredient => {
                    if (meal.toLowerCase().includes(ingredient)) {
                        // Check if ingredient already added
                        const exists = ingredientsToAdd.find(ing =>
                            ing.name.toLowerCase() === ingredient
                        );
                        if (!exists) {
                            ingredientsToAdd.push({
                                name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
                                quantity: 1,
                                unit: 'Unit',
                                meal: meal,
                                isNew: true
                            });
                        }
                    }
                });
            });

            // Fallback: add a general "Meal Ingredients" item if no ingredients found
            if (ingredientsToAdd.length === 0) {
                ingredientsToAdd.push({
                    name: "Meal Ingredients",
                    quantity: allMeals.length,
                    unit: 'Items',
                    meal: "Planned Meals",
                    isNew: true
                });
            }

            // Check for duplicates in current shopping list
            const duplicateCheck = ingredientsToAdd.map(ingredient => {
                const existingItem = currentShoppingList.find(item =>
                    item.name.toLowerCase() === ingredient.name.toLowerCase()
                );

                return {
                    ...ingredient,
                    alreadyExists: !!existingItem,
                    existingItem: existingItem
                };
            });

            // Separate new and existing ingredients
            const newIngredients = duplicateCheck.filter(ing => !ing.alreadyExists);
            const existingIngredients = duplicateCheck.filter(ing => ing.alreadyExists);

            console.log("New ingredients to add:", newIngredients);
            console.log("Already existing ingredients:", existingIngredients);

            // Show confirmation dialog
            setExtractedIngredients({ new: newIngredients, existing: existingIngredients });
            setShowIngredientConfirm(true);

        } catch (err) {
            console.error("Failed to extract ingredients:", err);
            alert("Failed to extract ingredients from meal plan. Please try again.");
        } finally {
            setIsGeneratingShoppingList(false);
        }
    };

    const confirmAddIngredients = async () => {
        try {
            const newIngredients = extractedIngredients.new;
            const existingIngredients = extractedIngredients.existing;

            if (newIngredients.length === 0) {
                alert("All ingredients are already in your shopping list!");
                setShowIngredientConfirm(false);
                setMealPlan({});
                return;
            }

            // Add only new ingredients to shopping list
            await Promise.all(newIngredients.map(ingredient =>
                API.post("/grocery", {
                    name: ingredient.name,
                    quantity: ingredient.quantity || 1,
                    unit: ingredient.unit || "Unit",
                    price: 0,
                    coupon: false,
                    section: "Others",
                    notes: `From Meal Plan: ${ingredient.meal || "Planned Meal"}`
                })
            ));

            const message = existingIngredients.length > 0
                ? `Successfully added ${newIngredients.length} new ingredients to shopping list! ${existingIngredients.length} ingredients were already in your list.`
                : `Successfully added ${newIngredients.length} ingredients from your meal plan to shopping list!`;

            alert(message);
            setShowIngredientConfirm(false);
            setMealPlan({});
            setExtractedIngredients([]);

            // Refresh shopping list
            fetchData();
        } catch (err) {
            console.error("Failed to add ingredients:", err);
            alert("Failed to add ingredients to shopping list. Please try again.");
        }
    };

    // Get week days for calendar
    const getWeekDays = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const today = new Date();
        const currentDay = today.getDay();
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
            const dayIndex = (currentDay + i) % 7;
            weekDays.push(days[dayIndex === 0 ? 6 : dayIndex - 1]);
        }

        return weekDays;
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <DashboardLayout>
            <div className="bg-[#F3F7F4] dark:bg-slate-950 min-h-screen -mx-6 px-6 pt-6 pb-32 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-green-500 hidden" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Search Bar & Matcher Button */}
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            placeholder="Search for recipes or ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900 focus:border-green-300 dark:focus:border-green-700 text-gray-700 dark:text-gray-200 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={handlePantryMatch}
                        disabled={isMatching}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-300 disabled:to-teal-300 text-white shadow-lg shadow-emerald-200 rounded-2xl px-4 font-bold flex flex-col items-center justify-center transition-all min-w-[100px]"
                    >
                        {isMatching ? (
                            <span className="text-xs animate-pulse">Matching...</span>
                        ) : (
                            <>
                                <ChefHat className="w-5 h-5 mb-1" />
                                <span className="text-[10px] uppercase tracking-wider">What can I cook?</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setShowCalendarModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-200 rounded-2xl px-4 font-bold flex flex-col items-center justify-center transition-all min-w-[100px]"
                    >
                        <Calendar className="w-5 h-5 mb-1" />
                        <span className="text-[10px] uppercase tracking-wider">Meal Plan</span>
                    </button>
                </div>

                {/* Veg / Non-Veg Custom Toggle */}
                <div className="flex bg-gray-200/50 dark:bg-slate-900 p-1.5 rounded-xl mb-6 max-w-sm mx-auto shadow-inner border border-gray-100 dark:border-slate-800">
                    <button
                        onClick={() => setDietFilter("Veg")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${dietFilter === "Veg"
                            ? "bg-white dark:bg-slate-800 text-green-600 dark:text-green-400 shadow-sm ring-1 ring-green-100 dark:ring-green-900/30"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${dietFilter === "Veg" ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                        Veg
                    </button>
                    <button
                        onClick={() => setDietFilter("All")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${dietFilter === "All"
                            ? "bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 shadow-sm ring-1 ring-gray-100 dark:ring-slate-700"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setDietFilter("NonVeg")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${dietFilter === "NonVeg"
                            ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-orange-100 dark:ring-orange-950/30"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${dietFilter === "NonVeg" ? "bg-orange-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                        Non-Veg
                    </button>
                </div>

                {/* Categories / Tags Pill Row */}
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6 mb-4 items-center">
                    {userPreferences.length > 0 && (
                        <button
                            onClick={() => setMatchMyDiet(!matchMyDiet)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 ${matchMyDiet ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/20" : "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/40"}`}
                        >
                            <User className="w-3.5 h-3.5" /> Match My Diet
                        </button>
                    )}
                    {["All", "Low-Carb", "High Protein", "Vegetarian", "Vegan", "Gluten-Free", "Quick Meals", "Budget"].map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${selectedTag === tag ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/20" : "bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-gray-500 text-sm mt-10 text-center animate-pulse font-medium">Curating meal intelligence...</div>
                ) : recipes.length === 0 ? (
                    <div className="mt-12 text-center p-6 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <p className="text-gray-400 text-sm font-medium">No recipes found in the database.</p>
                        <p className="text-xs text-gray-300 mt-2">Check back later or add some via Supabase Admin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        {recipes.filter(r => {
                            // Search Filter
                            const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (r.description || "").toLowerCase().includes(searchQuery.toLowerCase());
                            if (!matchesSearch) return false;

                            // Diet Filter (Veg/NonVeg toggle)
                            const isVeg = r.dietary_tags && r.dietary_tags.includes("Vegetarian");
                            if (dietFilter === "Veg" && !isVeg) return false;
                            if (dietFilter === "NonVeg" && isVeg) return false;

                            // Selected Tag Filter
                            if (selectedTag !== "All") {
                                if (!r.dietary_tags || !r.dietary_tags.includes(selectedTag)) return false;
                            }

                            // Match My Diet (User Preferences)
                            if (matchMyDiet && userPreferences.length > 0) {
                                // Lenient matching: Recipe should partially match ANY of the user preferences
                                // We check dietary tags, title, and description for maximum leniency
                                const recipeText = `${(r.dietary_tags || []).join(" ")} ${r.title} ${r.description || ""}`.toLowerCase();
                                const matchesRegimen = userPreferences.some(pref => recipeText.includes(pref.toLowerCase().trim()));
                                if (!matchesRegimen) return false;
                            }

                            return true;
                        }).map((recipe, i) => {
                            // New format may not use |||IMAGE: hack, safely fallback
                            const descParts = (recipe.description || "").split("|||IMAGE:");
                            const cleanDesc = descParts[0];
                            const imageUrl = descParts[1] || null;
                            const instanceKey = `${recipe.id}-${i}`;

                            return (
                                <div key={instanceKey} className="bg-white dark:bg-slate-900 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 overflow-hidden transition-all flex flex-col">
                                    {/* Recipe Image Banner */}
                                    {imageUrl && (
                                        <div
                                            className="w-full h-48 bg-gray-200 dark:bg-slate-800 bg-cover bg-center"
                                            style={{ backgroundImage: `url(${imageUrl})` }}
                                            onClick={() => toggleRecipeDetails(recipe.id, instanceKey)}
                                        />
                                    )}

                                    {/* Recipe Header Card */}
                                    <div
                                        className={`p-5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors flex-1 flex flex-col ${recipe.matchPercentage === 100 ? 'bg-green-50/40 dark:bg-green-950/20 border-l-4 border-l-green-500' : ''}`}
                                        onClick={() => toggleRecipeDetails(recipe.id, instanceKey)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h2 className="text-[17px] font-bold text-gray-800 dark:text-gray-200 leading-tight pr-4">
                                                    {recipe.matchPercentage === 100 && <span className="text-green-600 mr-1">✅</span>}
                                                    {recipe.title}
                                                </h2>

                                                {/* Match Percentage Indicator */}
                                                {recipe.matchPercentage !== undefined && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden max-w-[120px]">
                                                            <div
                                                                className={`h-full rounded-full ${recipe.matchPercentage > 80 ? 'bg-green-500' : recipe.matchPercentage > 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                                style={{ width: `${recipe.matchPercentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                            {recipe.matchedCount}/{recipe.totalRequired} Ingredients
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <span className="flex-shrink-0 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide mt-1">
                                                {Math.floor(Math.random() * (45 - 15 + 1) + 15)} Min
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                                            {cleanDesc || "A delicious and structurally optimized meal plan guaranteed to provide peak efficiency."}
                                        </p>

                                        {/* Nutrition Badges */}
                                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                            {recipe.calories && (
                                                <div className="flex items-center gap-1 bg-orange-50/80 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-md border border-orange-100/50 dark:border-orange-900/30">
                                                    <Flame className="w-3 h-3" /> {recipe.calories} kcal
                                                </div>
                                            )}
                                            {recipe.protein && (
                                                <div className="flex items-center gap-1 bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-md border border-blue-100/50 dark:border-blue-900/30">
                                                    <Tag className="w-3 h-3" /> {recipe.protein}g Protein
                                                </div>
                                            )}
                                            {recipe.dietary_tags?.map(tag => (
                                                <div key={tag} className="flex items-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-md border border-gray-200/50 dark:border-slate-700">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expanded Details Form (Ingredients & Plan) */}
                                    {expandedId === instanceKey && (
                                        <div className="bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800 p-5 pb-6">
                                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Required Ingredients</h3>

                                            {!recipeDetails[recipe.id] ? (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 italic">Analyzing structural components...</div>
                                            ) : recipeDetails[recipe.id].ingredients?.length === 0 ? (
                                                <div className="text-xs text-gray-400 dark:text-gray-500 italic">No isolated ingredients recorded.</div>
                                            ) : (
                                                <div className="space-y-2 mb-6">
                                                    {(recipeDetails[recipe.id]?.ingredients || []).map((ing, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                                            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{ing.ingredient_name}</span>
                                                            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                                                                {ing.quantity} {ing.unit}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Call to Actions */}
                                            <div className="flex gap-3 mt-4">
                                                <button
                                                    onClick={() => handleSmartAddToList(recipe.id)}
                                                    className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" strokeWidth={3} /> Add Missing Ingredients to Shopping List
                                                </button>
                                                <button
                                                    onClick={() => handleMarkAsPrepared(recipe.id)}
                                                    className="flex-1 bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white text-[13px] font-bold py-3 rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Flame className="w-4 h-4" strokeWidth={3} /> I Prepared This Meal!
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Meal Planning Calendar Modal */}
            {showCalendarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Blur Background */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowCalendarModal(false)}
                    />

                    {/* Calendar Modal */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 rounded-t-2xl z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Weekly Meal Planner</h2>
                                <button
                                    onClick={() => setShowCalendarModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getWeekDays().map((day, dayIndex) => (
                                    <div key={day} className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-slate-800">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 text-center">{day}</h3>

                                        {/* Meal Fields */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Breakfast</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter breakfast..."
                                                    value={mealPlan[day]?.breakfast || ''}
                                                    onChange={(e) => handleMealPlanChange(day, 'breakfast', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Lunch</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter lunch..."
                                                    value={mealPlan[day]?.lunch || ''}
                                                    onChange={(e) => handleMealPlanChange(day, 'lunch', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Dinner</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter dinner..."
                                                    value={mealPlan[day]?.dinner || ''}
                                                    onChange={(e) => handleMealPlanChange(day, 'dinner', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-1">Snack</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter snack..."
                                                    value={mealPlan[day]?.snack || ''}
                                                    onChange={(e) => handleMealPlanChange(day, 'snack', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Generate Shopping List Button */}
                            <div className="mt-6 flex justify-center">
                                <button
                                    onClick={generateShoppingListFromMealPlan}
                                    disabled={isGeneratingShoppingList}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                                >
                                    {isGeneratingShoppingList ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Generating List...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Generate Shopping List from Meal Plan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ingredient Confirmation Modal */}
            {showIngredientConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Blur Background */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowIngredientConfirm(false)}
                    />

                    {/* Confirmation Modal */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-6 max-h-[80vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-6 rounded-t-2xl z-10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Extracted Ingredients</h2>
                                <button
                                    onClick={() => setShowIngredientConfirm(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* New Ingredients */}
                            {extractedIngredients.new && extractedIngredients.new.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        New Ingredients to Add ({extractedIngredients.new.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {extractedIngredients.new.map((ingredient, index) => (
                                            <div key={index} className="flex justify-between items-center bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-900/30">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{ingredient.name}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-2 py-1 rounded">
                                                    {ingredient.quantity} {ingredient.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Existing Ingredients */}
                            {extractedIngredients.existing && extractedIngredients.existing.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                                        <Check className="w-5 h-5" />
                                        Already in Shopping List ({extractedIngredients.existing.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {extractedIngredients.existing.map((ingredient, index) => (
                                            <div key={index} className="flex justify-between items-center bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-900/30">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{ingredient.name}</span>
                                                <span className="text-sm text-orange-600 font-medium">Already exists</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center mt-6">
                                <button
                                    onClick={() => setShowIngredientConfirm(false)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAddIngredients}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add {extractedIngredients.new?.length || 0} New Items
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default Recipes;
