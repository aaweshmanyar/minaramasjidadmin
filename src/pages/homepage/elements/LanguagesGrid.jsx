import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { Globe, Pencil, Eye, Trash2, Search } from "lucide-react";
import API_BASE_URL from "../../../../config";

export default function LanguagesGrid() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedLangId, setSelectedLangId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = () => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/api/languages/language`)
      .then((res) => {
        setLanguages(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching languages:", err);
        setLoading(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLanguage.trim()) return;

    const payload = {
      language: newLanguage.trim(),
      createdOn: new Date().toISOString(),
    };

    try {
      Swal.fire({
        title: editMode ? "Updating language..." : "Creating language...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      if (editMode) {
        await axios.put(
          `${API_BASE_URL}/api/languages/language/${selectedLangId}`,
          payload
        );
        Swal.close();
        Swal.fire("Updated!", `Language updated at ${new Date().toLocaleString()}`, "success");
      } else {
        await axios.post(
          `${API_BASE_URL}/api/languages/language`,
          payload
        );
        Swal.close();
        Swal.fire("Created!", `Language created at ${new Date().toLocaleString()}`, "success");
      }

      resetForm();
      fetchLanguages();
    } catch (err) {
      console.error("Error submitting language:", err);
      Swal.close();
      Swal.fire("Error", "Something went wrong while submitting.", "error");
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setNewLanguage("");
    setEditMode(false);
    setSelectedLangId(null);
  };

  const handleEdit = (lang) => {
    setNewLanguage(lang.language);
    setSelectedLangId(lang.id);
    setEditMode(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the language.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Deleting language...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        await axios.delete(
          `${API_BASE_URL}/api/languages/language/${id}`
        );
        Swal.close();
        fetchLanguages();
        Swal.fire("Deleted!", "Language has been deleted.", "success");
      } catch (err) {
        console.error("Error deleting language:", err);
        Swal.fire("Error", "Failed to delete language", "error");
      }
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 px-4 py-10 relative">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Supported Languages</h1>
          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditMode(false);
              setNewLanguage("");
            }}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            <Globe className="w-5 h-5" />
            Add New Language
          </button>
        </div>

        {loading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {languages.map((lang) => (
              <div
                key={lang.id}
                className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-xl border p-6 text-center flex flex-col items-center relative"
                onClick={() => setActiveCard(activeCard === lang.id ? null : lang.id)}
              >
                <div className="text-5xl mb-2">🌐</div>
                <h2 className="text-xl font-semibold text-gray-700">{lang.language}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Created on:{" "}
                  {lang.createdOn
                    ? new Date(lang.createdOn).toLocaleDateString()
                    : "N/A"}
                </p>

                {activeCard === lang.id && (
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(lang);
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lang.id);
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Popup Form */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-40">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <h2 className="text-xl font-bold mb-4">
                {editMode ? "Edit Language" : "Add New Language"}
              </h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Enter language"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                  required
                />
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white px-4 py-2 rounded-lg"
                  >
                    {editMode ? "Update" : "Submit"}
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
