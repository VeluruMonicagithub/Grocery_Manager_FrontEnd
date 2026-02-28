import { useState } from "react";
import API from "@/services/api";

const categories = [
    "Produce",
    "Dairy",
    "Grains",
    "Canned Goods",
    "Frozen",
    "Pantry Staples",
];

const QuickAddModal = ({ open, onClose, onSuccess }) => {
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [threshold, setThreshold] = useState("");
    const [expirationDate, setExpirationDate] = useState("");

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await API.post("/pantry", {
                name,
                quantity: Number(quantity),
                unit,
                threshold: Number(threshold),
                expiration_date: expirationDate || null,
                price: 0, // Default to 0 since input was removed
            });

            // reset form
            setName("");
            setQuantity("");
            setUnit("");
            setThreshold("");
            setExpirationDate("");

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-[90%] md:w-[400px] border border-transparent dark:border-slate-800">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Add Pantry Item
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        placeholder="Item name"
                        className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <div className="flex gap-2">
                        <input
                            placeholder="Quantity"
                            type="number"
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />

                        <input
                            placeholder="Unit (kg, L, pcs)"
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Expiration Date (Optional)</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            placeholder="Low stock threshold"
                            type="number"
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
                        >
                            Add
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickAddModal;