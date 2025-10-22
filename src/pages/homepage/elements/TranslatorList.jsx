import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { UserPlus, Pencil, Eye, Trash2, Search } from "lucide-react";
import API_BASE_URL from "../../../../config";

export default function TranslatorList() {
    const [translators, setTranslators] = useState([]);
    const [filteredTranslators, setFilteredTranslators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        designation: "",
        englishDescription: "",
        urduDescription: "",
        image: null,
    });
    const [selectedTranslator, setSelectedTranslator] = useState(null);
    const [showViewCard, setShowViewCard] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage] = useState(10);

    useEffect(() => {
        fetchTranslators();
    }, []);

    useEffect(() => {
        const filtered = translators.filter(
            (translator) =>
                translator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                translator.designation.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTranslators(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm, translators]);

    const fetchTranslators = () => {
        axios
            .get(`${API_BASE_URL}/api/translators`)
            .then((res) => {
                setTranslators(res.data);
                setFilteredTranslators(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching translators:", err);
                setLoading(false);
            });
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Get current translators
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredTranslators.slice(
        indexOfFirstEntry,
        indexOfLastEntry
    );

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Calculate total pages
    const totalPages = Math.ceil(filteredTranslators.length / entriesPerPage);

    // Previous page
    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Next page
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const toggleAddModal = () => {
        setIsAddModalOpen(!isAddModalOpen);
        if (!isAddModalOpen) {
            setFormData({
                id: null,
                name: "",
                designation: "",
                englishDescription: "",
                urduDescription: "",
                image: null,
            });
        }
    };

    const toggleEditModal = (translator) => {
        setIsEditModalOpen(!isEditModalOpen);
        if (translator) {
            setFormData({
                id: translator.id,
                name: translator.name,
                designation: translator.designation,
                englishDescription: translator.englishDescription,
                urduDescription: translator.urduDescription,
                image: null,
            });
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
        }
    };

    const handleAddTranslator = async (e) => {
        e.preventDefault();

        const form = new FormData();
        form.append("name", formData.name);
        form.append("designation", formData.designation);
        form.append("englishDescription", formData.englishDescription);
        form.append("urduDescription", formData.urduDescription);
        if (formData.image) {
            form.append("image", formData.image);
        }
        form.append("createdAt", new Date().toISOString());

        try {
            const alert = Swal.fire({
                title: "Adding Translator...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            await axios.post(
                `${API_BASE_URL}/api/translators`,
                form,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            toggleAddModal();
            await fetchTranslators();
            Swal.fire("Success", "Translator added successfully!", "success");
        } catch (err) {
            console.error("Error adding translator:", err);
            Swal.fire("Error", "Failed to add translator", "error");
        }
    };

    const handleUpdateTranslator = async (e) => {
        e.preventDefault();

        const form = new FormData();
        form.append("name", formData.name);
        form.append("designation", formData.designation);
        form.append("englishDescription", formData.englishDescription);
        form.append("urduDescription", formData.urduDescription);
        if (formData.image) {
            form.append("image", formData.image);
        }

        try {
            const alert = Swal.fire({
                title: "Updating Translator...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });

            await axios.put(
                `${API_BASE_URL}/api/translators/${formData.id}`,
                form,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            setIsEditModalOpen(false);
            await fetchTranslators();
            Swal.fire("Success", "Translator updated successfully!", "success");
        } catch (err) {
            console.error("Error updating translator:", err);
            Swal.fire("Error", "Failed to update translator", "error");
        }
    };

    const handleDeleteTranslator = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This will permanently delete the translator.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                await axios.delete(
                    `${API_BASE_URL}/api/translators/${id}`
                );
                await fetchTranslators();
                Swal.fire("Deleted!", "Translator has been deleted.", "success");
            } catch (err) {
                console.error("Error deleting translator:", err);
                Swal.fire("Error", "Failed to delete translator", "error");
            }
        }
    };

    const handleViewTranslator = (translator) => {
        setSelectedTranslator(translator);
        setShowViewCard(true);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-white p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
                        Manage Translators
                    </h1>

                    <button
                        onClick={toggleAddModal}
                        className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add New Translator
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or designation..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5a6c17] focus:border-[#5a6c17] sm:text-sm"
                        />
                    </div>
                </div>

                {/* Add Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-md">
                            <h2 className="text-2xl font-semibold mb-4">Add New Translator</h2>
                            <form onSubmit={handleAddTranslator}>
                                <div className="mb-4 flex gap-4">
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="designation"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Designation
                                        </label>
                                        <input
                                            id="designation"
                                            type="text"
                                            value={formData.designation}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4 flex gap-4">
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="englishDescription"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            English Description
                                        </label>
                                        <textarea
                                            id="englishDescription"
                                            value={formData.englishDescription}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="urduDescription"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Urdu Description
                                        </label>
                                        <textarea
                                            id="urduDescription"
                                            value={formData.urduDescription}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="image"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Profile Picture
                                    </label>
                                    <input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleAddModal}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white rounded-lg"
                                    >
                                        Add Translator
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditModalOpen && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-md">
                            <h2 className="text-2xl font-semibold mb-4">Edit Translator</h2>
                            <form onSubmit={handleUpdateTranslator}>
                                <div className="mb-4 flex gap-4">
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="name"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Name
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="designation"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Designation
                                        </label>
                                        <input
                                            id="designation"
                                            type="text"
                                            value={formData.designation}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4 flex gap-4">
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="englishDescription"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            English Description
                                        </label>
                                        <textarea
                                            id="englishDescription"
                                            value={formData.englishDescription}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                    <div className="w-1/2">
                                        <label
                                            htmlFor="urduDescription"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Urdu Description
                                        </label>
                                        <textarea
                                            id="urduDescription"
                                            value={formData.urduDescription}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="image"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Profile Picture
                                    </label>
                                    <input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white rounded-lg"
                                    >
                                        Update Translator
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Card */}
                {showViewCard && selectedTranslator && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-semibold mb-4 text-center">
                                Translator Details
                            </h2>

                            <div className="flex flex-col items-center space-y-4">
                                <img
                                    src={`https://newmmdata-backend.onrender.com/api/translators/image/${selectedTranslator.id}`}
                                    alt={selectedTranslator.name}
                                    className="w-24 h-24 object-cover rounded-full"
                                />
                                <div className="text-center space-y-1">
                                    <p>
                                        <span className="font-semibold">Name:</span>{" "}
                                        {selectedTranslator.name}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Designation:</span>{" "}
                                        {selectedTranslator.designation}
                                    </p>
                                    <p>
                                        <span className="font-semibold">English Description:</span>{" "}
                                        {selectedTranslator.englishDescription}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Urdu Description:</span>{" "}
                                        {selectedTranslator.urduDescription}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowViewCard(false)}
                                    className="mt-4 bg-[#5a6c17] text-white px-4 py-2 rounded hover:bg-[rgba(90,108,23,0.83)]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Display List */}
                {loading ? (
                    <div className="text-center text-lg text-gray-600">Loading...</div>
                ) : filteredTranslators.length === 0 ? (
                    <div className="text-center text-lg text-gray-600">
                        {searchTerm
                            ? "No matching translators found"
                            : "No translators found"}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
                            <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
                                <tr>
                                    <th className="px-4 py-2 border">ID</th>
                                    <th className="px-4 py-2 border">Profile</th>
                                    <th className="px-4 py-2 border">Name</th>
                                    <th className="px-4 py-2 border">Designation</th>
                                    <th className="px-4 py-2 border">English Description</th>
                                    <th className="px-4 py-2 border">Urdu Description</th>
                                    <th className="px-4 py-2 border">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEntries.map((translator, index) => (
                                    <tr
                                        key={index}
                                        className="text-sm text-gray-700 text-center hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-2 border">
                                            {indexOfFirstEntry + index + 1}
                                        </td>
                                        <td className="px-4 py-2 border">
                                            <img
                                                src={`https://newmmdata-backend.onrender.com/api/translators/image/${translator.id}`}
                                                alt={translator.name}
                                                className="w-12 h-12 object-cover rounded-full mx-auto"
                                            />
                                        </td>
                                        <td className="px-4 py-2 border">{translator.name}</td>
                                        <td className="px-4 py-2 border">
                                            {translator.designation}
                                        </td>
                                        <td
                                            className="px-4 py-2 border"
                                            title={translator.englishDescription}
                                        >
                                            {translator.englishDescription?.length > 30
                                                ? `${translator.englishDescription.substring(0, 30)}...`
                                                : translator.englishDescription || ""}
                                        </td>

                                        <td
                                            className="px-4 py-2 border"
                                            title={translator.urduDescription}
                                        >
                                            {translator.urduDescription?.length > 30
                                                ? `${translator.urduDescription.substring(0, 30)}...`
                                                : translator.urduDescription || ""}
                                        </td>

                                        <td className="px-4 py-2 border">
                                            <div className="flex justify-center space-x-2">
                                                <button
                                                    onClick={() => handleViewTranslator(translator)}
                                                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleEditModal(translator)}
                                                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTranslator(translator.id)}
                                                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {filteredTranslators.length > entriesPerPage && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                <div className="text-sm text-gray-600">
                                    Showing {indexOfFirstEntry + 1} to{" "}
                                    {Math.min(indexOfLastEntry, filteredTranslators.length)} of{" "}
                                    {filteredTranslators.length} entries
                                    {searchTerm && (
                                        <span> (filtered from {translators.length} total entries)</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={prevPage}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded ${currentPage === 1
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-[#5a6c17] text-white hover:bg-[rgba(90,108,23,0.83)]"
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                            (page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => paginate(page)}
                                                    className={`px-3 py-1 rounded ${currentPage === page
                                                            ? "bg-[#5a6c17] text-white"
                                                            : "bg-gray-200 hover:bg-gray-300"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <button
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                : "bg-[#5a6c17] text-white hover:bg-[rgba(90,108,23,0.83)]"
                                            }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}