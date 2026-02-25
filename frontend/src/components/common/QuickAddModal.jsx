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
    const [price, setPrice] = useState("");
    const [isEstimating, setIsEstimating] = useState(false);

    if (!open) return null;

    const handleNameBlur = async () => {
        if (!name.trim() || price) return;

        setIsEstimating(true);
        try {
            const res = await API.post("/ai/estimate-price", { itemName: name });
            if (res.data && res.data.price) {
                setPrice(res.data.price);
            }
        } catch (err) {
            console.error("Failed to estimate price", err);
        } finally {
            setIsEstimating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await API.post("/pantry", {
                name,
                quantity: Number(quantity),
                unit,
                threshold: Number(threshold),
                price: Number(price) || 0,
            });

            // reset form
            setName("");
            setQuantity("");
            setUnit("");
            setThreshold("");
            setPrice("");

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl w-[90%] md:w-[400px]">
                <h2 className="text-lg font-semibold mb-4">
                    Add Pantry Item
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        placeholder="Item name"
                        className="w-full p-2 border rounded"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleNameBlur}
                        required
                    />

                    <div className="flex gap-2">
                        <input
                            placeholder="Quantity"
                            type="number"
                            className="w-full p-2 border rounded"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />

                        <input
                            placeholder="Unit (kg, L, pcs)"
                            className="w-full p-2 border rounded"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            placeholder="Low stock threshold"
                            type="number"
                            className="w-full p-2 border rounded"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            required
                        />
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                            <input
                                placeholder={isEstimating ? "Estimating..." : "Est. Price"}
                                type="number"
                                className={`w-full pl-8 py-2 pr-2 border rounded ${isEstimating ? 'animate-pulse bg-gray-50' : ''}`}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isEstimating}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-500"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bg-green-500 text-white px-4 py-2 rounded"
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