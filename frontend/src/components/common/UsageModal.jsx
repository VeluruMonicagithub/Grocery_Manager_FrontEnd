import { useState } from "react";
import API from "@/services/api";
import { toast } from "react-toastify";

const UsageModal = ({ open, onClose, onSuccess, pantry }) => {
    const [selectedItem, setSelectedItem] = useState("");
    const [usedQty, setUsedQty] = useState("");

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const itemToUpdate = pantry.find(item => String(item.id) === String(selectedItem));
        if (!itemToUpdate) return toast.error("Please select an item");

        const qtyToSubtract = Number(usedQty);
        if (qtyToSubtract <= 0) return toast.error("Please enter a valid amount");

        const newQty = itemToUpdate.quantity - qtyToSubtract;

        try {
            if (newQty <= 0) {
                // Completely used up, remove from database
                await API.delete(`/pantry/${itemToUpdate.id}`);
                toast.success(`${itemToUpdate.name} removed from pantry!`);
            } else {
                // Just decrease quantity
                await API.put("/pantry", {
                    id: itemToUpdate.id,
                    quantity: newQty,
                });
                toast.success(`Logged ${qtyToSubtract} ${itemToUpdate.unit} of ${itemToUpdate.name}`);
            }

            // reset form
            setSelectedItem("");
            setUsedQty("");

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to log usage");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-[90%] md:w-[400px] border border-transparent dark:border-slate-800">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Log Usage
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Select an item you just used to update your pantry stock.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <select
                        className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                        value={selectedItem}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        required
                    >
                        <option value="" disabled className="dark:bg-slate-900">Select an item</option>
                        {pantry.length === 0 ? (
                            <option value="" disabled className="dark:bg-slate-900">Pantry is empty</option>
                        ) : (
                            pantry.map((item) => (
                                <option key={item.id} value={item.id} className="dark:bg-slate-900">
                                    {item.name} (Current: {item.quantity} {item.unit})
                                </option>
                            ))
                        )}
                    </select>

                    <input
                        placeholder="Amount used"
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500/20"
                        value={usedQty}
                        onChange={(e) => setUsedQty(e.target.value)}
                        required
                    />

                    <div className="flex justify-between items-center pt-2">
                        {/* Remove Completely Button */}
                        <button
                            type="button"
                            onClick={async () => {
                                if (!selectedItem) return toast.error("Please select an item to remove");
                                const itemToUpdate = pantry.find(item => String(item.id) === String(selectedItem));
                                try {
                                    await API.delete(`/pantry/${itemToUpdate.id}`);
                                    toast.success(`${itemToUpdate.name} completely removed!`);
                                    setSelectedItem("");
                                    setUsedQty("");
                                    onSuccess();
                                    onClose();
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Failed to remove item");
                                }
                            }}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors"
                        >
                            Remove Completely
                        </button>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="bg-[#A4DEB8] dark:bg-green-600 hover:bg-[#8CCB9F] dark:hover:bg-green-700 text-gray-800 dark:text-white font-bold px-5 py-2 rounded-xl transition-colors shadow-sm"
                            >
                                Update
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsageModal;
