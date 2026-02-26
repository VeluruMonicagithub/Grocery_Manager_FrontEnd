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

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 ml-1">Expiration Date (Optional)</label>
                        <input
                            type="date"
                            className="w-full p-2 border rounded"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
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