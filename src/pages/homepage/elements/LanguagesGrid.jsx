import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import {
  Globe,
  Languages,
  Plus,
  Pencil,
  Trash2,
  Search,
  CalendarClock,
  Sparkles,
  X,
} from "lucide-react";
import API_BASE_URL from "../../../../config";

export default function LanguagesGrid() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedLangId, setSelectedLangId] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return languages;
    return languages.filter((l) => (l.language || "").toLowerCase().includes(q));
  }, [languages, search]);

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
        await axios.post(`${API_BASE_URL}/api/languages/language`, payload);
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
        await axios.delete(`${API_BASE_URL}/api/languages/language/${id}`);
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
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 px-5 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#e4e9d0] text-[#5a6c17]">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Supported Languages</h1>
              <p className="text-sm text-gray-500">Add, search, and manage app languages.</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditMode(false);
              setNewLanguage("");
            }}
            className="inline-flex items-center gap-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Language
          </button>
        </div>

        {/* Top toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            {/* Stat 1 */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Globe className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-xl font-bold text-gray-800">{languages.length}</div>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <Sparkles className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
              <div>
                <div className="text-xs text-gray-500">After Filter</div>
                <div className="text-xl font-bold text-gray-800">{filtered.length}</div>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <CalendarClock className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
              <div>
                <div className="text-xs text-gray-500">Newest</div>
                <div className="text-sm font-semibold text-gray-800">
                  {languages.length
                    ? new Date(
                        Math.max(
                          ...languages
                            .filter((l) => l.createdOn)
                            .map((l) => new Date(l.createdOn).getTime())
                        )
                      ).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language…"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/30"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border p-6 shadow-sm animate-pulse"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <Languages className="w-6 h-6 text-gray-400" />
            </div>
            <div className="text-lg font-semibold">
              {search ? "No languages match your search" : "No languages yet"}
            </div>
            <div className="text-sm mt-1">
              {search ? "Try a different keyword." : "Add your first language to begin."}
            </div>
            {!search && (
              <button
                onClick={() => {
                  setIsFormOpen(true);
                  setEditMode(false);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Language
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((lang) => (
              <div
                key={lang.id}
                className="group relative bg-white shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl border p-6 flex flex-col items-center text-center"
                onClick={() => setActiveCard(activeCard === lang.id ? null : lang.id)}
              >
                {/* Accent ring */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-transparent group-hover:ring-[#5a6c17]/30 transition" />
                {/* Icon bubble */}
                <div className="text-5xl mb-3">
                  {/* Emoji is friendly; keeping it. Could also switch to icon-only */}
                  🌐
                </div>
                <h2 className="text-lg font-semibold text-gray-800">{lang.language}</h2>
                <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                  <CalendarClock className="w-4 h-4" />
                  {lang.createdOn ? new Date(lang.createdOn).toLocaleDateString() : "—"}
                </p>

                {/* Actions: show on hover OR when active */}
                <div
                  className={`mt-5 flex gap-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition ${
                    activeCard === lang.id ? "!opacity-100 !translate-y-0" : ""
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(lang);
                    }}
                    title="Edit"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(lang.id);
                    }}
                    title="Delete"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
              onClick={resetForm}
            />
            {/* Dialog */}
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
              <button
                onClick={resetForm}
                className="absolute right-3 top-3 p-2 rounded-lg hover:bg-gray-100"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-[#e4e9d0] text-[#5a6c17]">
                  {editMode ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-semibold">
                  {editMode ? "Edit Language" : "Add New Language"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language Name
                  </label>
                  <div className="relative">
                    <Languages className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newLanguage}
                      onChange={(e) => setNewLanguage(e.target.value)}
                      placeholder="e.g., English, Urdu, Hindi"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/30"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white"
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
