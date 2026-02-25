import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BookOpen, Search, Flame, Tag, Plus, Check } from "lucide-react";
import API from "@/services/api";

const Recipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [recipeDetails, setRecipeDetails] = useState({});
    const [dietFilter, setDietFilter] = useState("All"); // All, Veg, NonVeg
    const [searchQuery, setSearchQuery] = useState("");
    const [isMatching, setIsMatching] = useState(false);

    const fetchRecipes = async () => {
        try {
            const res = await API.get("/recipes");
            setRecipes(res.data);
        } catch (err) {
            console.error("Error fetching recipes:", err);
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

    const toggleRecipeDetails = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);

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

    useEffect(() => {
        fetchRecipes();
    }, []);

    return (
        <DashboardLayout>
            <div className="bg-[#F3F7F4] min-h-screen -mx-6 px-6 pt-6 pb-32">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-green-500 hidden" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Search Bar & Matcher Button */}
                <div className="flex gap-2 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            placeholder="Search for recipes or ingredients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white shadow-sm border border-gray-100 focus:ring-2 focus:ring-green-100 focus:border-green-300 text-gray-700 outline-none transition-all"
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
                                <span className="text-lg leading-none mb-0.5">🎯</span>
                                <span className="text-[10px] uppercase tracking-wider">What can I cook?</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Veg / Non-Veg Custom Toggle */}
                <div className="flex bg-gray-200/50 p-1.5 rounded-xl mb-6 max-w-sm mx-auto shadow-inner border border-gray-100">
                    <button
                        onClick={() => setDietFilter("Veg")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${dietFilter === "Veg"
                            ? "bg-white text-green-600 shadow-sm ring-1 ring-green-100"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${dietFilter === "Veg" ? "bg-green-500" : "bg-gray-400"}`}></div>
                        Veg
                    </button>
                    <button
                        onClick={() => setDietFilter("All")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${dietFilter === "All"
                            ? "bg-white text-gray-800 shadow-sm ring-1 ring-gray-100"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setDietFilter("NonVeg")}
                        className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all flex justify-center items-center gap-2 ${dietFilter === "NonVeg"
                            ? "bg-white text-red-500 shadow-sm ring-1 ring-red-100"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full ${dietFilter === "NonVeg" ? "bg-red-400" : "bg-gray-400"}`}></div>
                        Non-Veg
                    </button>
                </div>

                {/* Categories / Tags Pill Row */}
                <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6 mb-4">
                    {["All", "Low-Carb", "High Protein", "Vegetarian", "Quick Meals", "Budget"].map((tag, i) => (
                        <button key={tag} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold transition-colors ${i === 0 ? "bg-green-600 text-white shadow-md shadow-green-200" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}>
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
                    <div className="space-y-5">
                        {recipes.filter(r => {
                            // Search Filter
                            const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (r.description || "").toLowerCase().includes(searchQuery.toLowerCase());
                            if (!matchesSearch) return false;

                            // Diet Filter
                            if (dietFilter === "All") return true;
                            const isVeg = r.dietary_tags && r.dietary_tags.includes("Vegetarian");
                            if (dietFilter === "Veg") return isVeg;
                            if (dietFilter === "NonVeg") return !isVeg;

                            return true;
                        }).map((recipe) => {
                            const descParts = (recipe.description || "").split("|||IMAGE:");
                            const cleanDesc = descParts[0];
                            const imageUrl = descParts[1] || null;

                            return (
                                <div key={recipe.id} className="bg-white rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden transition-all">
                                    {/* Recipe Image Banner */}
                                    {imageUrl && (
                                        <div
                                            className="w-full h-48 bg-gray-200 bg-cover bg-center"
                                            style={{ backgroundImage: `url(${imageUrl})` }}
                                            onClick={() => toggleRecipeDetails(recipe.id)}
                                        />
                                    )}

                                    {/* Recipe Header Card */}
                                    <div
                                        className={`p-5 cursor-pointer hover:bg-gray-50/50 transition-colors ${recipe.matchPercentage === 100 ? 'bg-green-50/40 border-l-4 border-l-green-500' : ''}`}
                                        onClick={() => toggleRecipeDetails(recipe.id)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h2 className="text-[17px] font-bold text-gray-800 leading-tight pr-4">
                                                    {recipe.matchPercentage === 100 && <span className="text-green-600 mr-1">✅</span>}
                                                    {recipe.title}
                                                </h2>

                                                {/* Match Percentage Indicator */}
                                                {recipe.matchPercentage !== undefined && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                                                            <div
                                                                className={`h-full rounded-full ${recipe.matchPercentage > 80 ? 'bg-green-500' : recipe.matchPercentage > 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                                style={{ width: `${recipe.matchPercentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500">
                                                            {recipe.matchedCount}/{recipe.totalRequired} Ingredients
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <span className="flex-shrink-0 bg-green-50 text-green-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wide mt-1">
                                                {Math.floor(Math.random() * (45 - 15 + 1) + 15)} Min
                                            </span>
                                        </div>
                                        <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                                            {cleanDesc || "A delicious and structurally optimized meal plan guaranteed to provide peak efficiency."}
                                        </p>

                                        {/* Nutrition Badges */}
                                        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                            {recipe.calories && (
                                                <div className="flex items-center gap-1 bg-orange-50/80 text-orange-600 px-2.5 py-1 rounded-md border border-orange-100/50">
                                                    <Flame className="w-3 h-3" /> {recipe.calories} kcal
                                                </div>
                                            )}
                                            {recipe.protein && (
                                                <div className="flex items-center gap-1 bg-blue-50/80 text-blue-600 px-2.5 py-1 rounded-md border border-blue-100/50">
                                                    <Tag className="w-3 h-3" /> {recipe.protein}g Protein
                                                </div>
                                            )}
                                            {recipe.dietary_tags?.map(tag => (
                                                <div key={tag} className="flex items-center bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200/50">
                                                    {tag}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Expanded Details Form (Ingredients & Plan) */}
                                    {expandedId === recipe.id && (
                                        <div className="bg-gray-50 border-t border-gray-100 p-5 pb-6">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Required Ingredients</h3>

                                            {!recipeDetails[recipe.id] ? (
                                                <div className="text-xs text-gray-400 italic">Analyzing structural components...</div>
                                            ) : recipeDetails[recipe.id].ingredients?.length === 0 ? (
                                                <div className="text-xs text-gray-400 italic">No isolated ingredients recorded.</div>
                                            ) : (
                                                <div className="space-y-2 mb-6">
                                                    {(recipeDetails[recipe.id]?.ingredients || []).map((ing, idx) => (
                                                        <div key={ing.id || idx} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                                                            <span className="text-[13px] font-semibold text-gray-700">{ing.ingredient_name}</span>
                                                            <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                                                                {ing.quantity} {ing.unit}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Call to Actions */}
                                            <div className="flex gap-3">
                                                <button className="flex-1 bg-[#4CAF50] hover:bg-[#45a049] text-white text-[13px] font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2">
                                                    <Plus className="w-4 h-4" strokeWidth={3} /> Add to List
                                                </button>
                                                <button className="bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 text-[13px] font-bold py-3 px-4 rounded-xl transition-all">
                                                    Plan Meal
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
        </DashboardLayout>
    );
};

export default Recipes;
