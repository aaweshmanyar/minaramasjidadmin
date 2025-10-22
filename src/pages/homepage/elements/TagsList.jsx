import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import { Tags, Pencil, Trash2 } from 'lucide-react';
import API_BASE_URL from "../../../../config";

export default function TagList() {
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Search state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [editingTagId, setEditingTagId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= Math.ceil(filteredTags.length / itemsPerPage)) {
      setCurrentPage(pageNumber);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // ✅ Filter tags based on search term
  const filteredTags = tags.filter(tag =>
    tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTags = filteredTags.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/tags`);
      setTags(response.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to fetch tags. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setTagName("");
    setEditingTagId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tag) => {
    setTagName(tag.tag);
    setEditingTagId(tag.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTagName("");
    setEditingTagId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTagId) {
        await axios.put(`${API_BASE_URL}/api/tags/${editingTagId}`, { tag: tagName });
      } else {
        await axios.post(`${API_BASE_URL}/api/tags`, { tag: tagName });
      }
      fetchTags();
      closeModal();
    } catch (err) {
      console.error(editingTagId ? "Error updating tag:" : "Error creating tag:", err);
      setError(`Failed to ${editingTagId ? 'update' : 'create'} tag. Please try again.`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/tags/${id}`);
        fetchTags();
      } catch (err) {
        console.error("Error deleting tag:", err);
        setError("Failed to delete tag. Please try again.");
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-tr from-gray-100 to-white p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Tags List</h1>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* ✅ Search Input */}
            <input
              type="text"
              placeholder="Search tag..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to first page on search
              }}
              className="border px-4 py-2 rounded-lg w-64 text-sm"
            />
            <button
              onClick={openAddModal}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <Tags className="w-5 h-5" />
              Add Tag
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : filteredTags.length === 0 ? (
          <div className="text-center text-lg text-gray-600">
            No tags found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
                <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Tag</th>
                    <th className="px-4 py-2 border">Created On</th>
                    <th className="px-4 py-2 border">Modified On</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTags.map((tag) => (
                    <tr key={tag.id} className="text-sm text-gray-700 text-center hover:bg-gray-50">
                      <td className="px-4 py-2 border">{tag.id}</td>
                      <td className="px-4 py-2 border">{tag.tag}</td>
                      <td className="px-4 py-2 border">{new Date(tag.createdOn).toLocaleDateString()}</td>
                      <td className="px-4 py-2 border">{new Date(tag.modifiedOn).toLocaleDateString()}</td>
                      <td className="px-4 py-2 border flex justify-center gap-2">
                        <button onClick={() => openEditModal(tag)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleDelete(tag.id)} className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredTags.length > itemsPerPage && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTags.length)} of {filteredTags.length} entries
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-l-md border ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                  >
                    Prev
                  </button>

                  {Array.from({ length: Math.ceil(filteredTags.length / itemsPerPage) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`px-3 py-1 border ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(filteredTags.length / itemsPerPage)}
                    className={`px-3 py-1 rounded-r-md border ${currentPage === Math.ceil(filteredTags.length / itemsPerPage) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <h2 className="text-2xl font-bold mb-4">{editingTagId ? "Edit Tag" : "Add Tag"}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Enter tag name"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="border px-4 py-2 rounded w-full"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white px-4 py-2 rounded transition"
                  >
                    {editingTagId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
