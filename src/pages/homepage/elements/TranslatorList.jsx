import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { UserPlus, Pencil, Eye, Trash2, Search, Users, Filter, FileText, Image as ImageIcon } from "lucide-react";
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
    const q = searchTerm.toLowerCase();
    const filtered = translators.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.designation?.toLowerCase().includes(q)
    );
    setFilteredTranslators(filtered);
    setCurrentPage(1);
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

  const handleSearch = (e) => setSearchTerm(e.target.value);

  // Paging math
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredTranslators.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredTranslators.length / entriesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

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
    const file = e.target.files?.[0];
    if (file) setFormData({ ...formData, image: file });
  };

  const handleAddTranslator = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", formData.name);
    form.append("designation", formData.designation);
    form.append("englishDescription", formData.englishDescription);
    form.append("urduDescription", formData.urduDescription);
    if (formData.image) form.append("image", formData.image);
    form.append("createdAt", new Date().toISOString());

    try {
      Swal.fire({ title: "Adding Translator...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await axios.post(`${API_BASE_URL}/api/translators`, form, { headers: { "Content-Type": "multipart/form-data" } });
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
    if (formData.image) form.append("image", formData.image);

    try {
      Swal.fire({ title: "Updating Translator...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      await axios.put(`${API_BASE_URL}/api/translators/${formData.id}`, form, { headers: { "Content-Type": "multipart/form-data" } });
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
        await axios.delete(`${API_BASE_URL}/api/translators/${id}`);
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

  // helpers for UI text clamp + safe text
  const clampStyle = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-white p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Manage Translators</h1>
            <p className="text-sm text-gray-500 mt-1">Add, search, and manage translator profiles.</p>
          </div>
          <button
            onClick={toggleAddModal}
            className="inline-flex items-center gap-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add New Translator
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Users className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-bold text-gray-800">{translators.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Filter className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">After Filter</div>
              <div className="text-xl font-bold text-gray-800">{filteredTranslators.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <FileText className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">Page Size</div>
              <div className="text-xl font-bold text-gray-800">{entriesPerPage}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or designation..."
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/30 focus:border-[#5a6c17]"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse flex items-center gap-3 text-gray-600">
              <ImageIcon className="w-5 h-5" />
              <span>Loading translators…</span>
            </div>
          </div>
        ) : filteredTranslators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            {searchTerm ? (
              <>
                <div className="text-lg font-semibold">No matching translators found</div>
                <div className="text-sm mt-1">Try adjusting your search.</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold">No translators yet</div>
                <div className="text-sm mt-1">Add your first translator to get started.</div>
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-[1]">
                  <tr className="text-left text-sm font-semibold text-gray-700">
                    <th className="px-4 py-3 border-b">#</th>
                    <th className="px-4 py-3 border-b">Profile</th>
                    <th className="px-4 py-3 border-b">Name</th>
                    <th className="px-4 py-3 border-b">Designation</th>
                    <th className="px-4 py-3 border-b">English Description</th>
                    <th className="px-4 py-3 border-b">Urdu Description</th>
                    <th className="px-4 py-3 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntries.map((translator, index) => {
                    const eng = translator.englishDescription || "";
                    const urd = translator.urduDescription || "";
                    return (
                      <tr
                        key={translator.id ?? index}
                        className={`${(index % 2 === 0) ? "bg-white" : "bg-gray-50"} text-sm text-gray-700 hover:bg-[#f4f6ec] transition-colors`}
                      >
                        <td className="px-4 py-3 border-b align-top">
                          {indexOfFirstEntry + index + 1}
                        </td>

                        <td className="px-4 py-3 border-b align-top">
                          <img
                            src={`${API_BASE_URL}/api/translators/image/${translator.id}`}
                            alt={translator.name}
                            className="w-12 h-12 object-cover rounded-full border border-gray-200"
                          />
                        </td>

                        <td className="px-4 py-3 border-b align-top">
                          <div className="font-semibold text-gray-900">{translator.name}</div>
                          <div className="text-[11px] text-gray-500">ID: {translator.id}</div>
                        </td>

                        <td className="px-4 py-3 border-b align-top">
                          <div className="max-w-[220px] truncate" title={translator.designation}>
                            {translator.designation}
                          </div>
                        </td>

                        <td className="px-4 py-3 border-b align-top" title={eng}>
                          <div className="max-w-[360px] text-gray-700" style={clampStyle}>{eng}</div>
                        </td>

                        <td className="px-4 py-3 border-b align-top text-right" title={urd} dir="rtl">
                          <div className="max-w-[360px] text-gray-700" style={clampStyle}>{urd}</div>
                        </td>

                        <td className="px-4 py-3 border-b align-top">
                          <div className="flex justify-start gap-2">
                            <button
                              onClick={() => handleViewTranslator(translator)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => toggleEditModal(translator)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteTranslator(translator.id)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer: results + pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredTranslators.length)} of {filteredTranslators.length} entries
                {searchTerm && <span> (filtered from {translators.length} total)</span>}
              </div>

              {filteredTranslators.length > entriesPerPage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          currentPage === page
                            ? "bg-[#5a6c17] text-white border-[#5a6c17]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg border text-sm ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                        : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Add New Translator</h2>
              <form onSubmit={handleAddTranslator} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
                    <input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="englishDescription" className="block text-sm font-medium text-gray-700">English Description</label>
                    <textarea
                      id="englishDescription"
                      value={formData.englishDescription}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[96px] focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="urduDescription" className="block text-sm font-medium text-gray-700">Urdu Description</label>
                    <textarea
                      id="urduDescription"
                      value={formData.urduDescription}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[96px] focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={toggleAddModal}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Edit Translator</h2>
              <form onSubmit={handleUpdateTranslator} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700">Designation</label>
                    <input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="englishDescription" className="block text-sm font-medium text-gray-700">English Description</label>
                    <textarea
                      id="englishDescription"
                      value={formData.englishDescription}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[96px] focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="urduDescription" className="block text-sm font-medium text-gray-700">Urdu Description</label>
                    <textarea
                      id="urduDescription"
                      value={formData.urduDescription}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[96px] focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="image" className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4 text-center">Translator Details</h2>
              <div className="flex flex-col items-center gap-4">
                <img
                  src={`${API_BASE_URL}/api/translators/image/${selectedTranslator.id}`}
                  alt={selectedTranslator.name}
                  className="w-24 h-24 object-cover rounded-full border border-gray-200"
                />
                <div className="w-full space-y-2">
                  <p><span className="font-semibold">Name:</span> {selectedTranslator.name}</p>
                  <p><span className="font-semibold">Designation:</span> {selectedTranslator.designation}</p>
                  <div>
                    <span className="font-semibold">English Description:</span>
                    <div className="mt-1 text-gray-700">{selectedTranslator.englishDescription}</div>
                  </div>
                  <div dir="rtl" className="text-right">
                    <span className="font-semibold">Urdu Description:</span>
                    <div className="mt-1 text-gray-700">{selectedTranslator.urduDescription}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewCard(false)}
                  className="mt-2 bg-[#5a6c17] text-white px-4 py-2 rounded-lg hover:bg-[rgba(90,108,23,0.83)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
