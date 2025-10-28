import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Layout from "../../../component/Layout";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Info,
  Pencil,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
  ImageOff,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import API_BASE_URL from "../../../../config";

/* -------------------- Quill font whitelist -------------------- */
import Quill from "quill";
const Font = Quill.import("formats/font");
Font.whitelist = [
  "sans-serif",
  "serif",
  "monospace",
  "Amiri",
  "Rubik-Bold",
  "Rubik-Light",
  "Scheherazade-Regular",
  "Scheherazade-Bold",
  "Aslam",
  "Mehr-Nastaliq",
];
Quill.register(Font, true);

const quillModules = {
  toolbar: [
    [{ font: Font.whitelist }, { size: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

const quillFormats = [
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "header",
  "align",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "clean",
];

export default function AboutContent() {
  /* -------------------- State -------------------- */
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sortKey, setSortKey] = useState("createdOn"); // "createdOn" | "englishTitle" | "id"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedContent, setSelectedContent] = useState(null);

  const [addFormData, setAddFormData] = useState({
    englishTitle: "",
    urduTitle: "",
    englishDescription: "",
    urduDescription: "",
    image: null,
  });

  const [editFormData, setEditFormData] = useState({
    englishTitle: "",
    urduTitle: "",
    englishDescription: "",
    urduDescription: "",
    image: null,
  });

  const abortRef = useRef(null);

  /* -------------------- Fetch -------------------- */
  const fetchContent = async (showSpinner = true) => {
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (showSpinner) setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/about`, { signal: ctrl.signal });
      const data = await res.json();
      setContents(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to load about content.");
        console.error(err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContent(true);
    return () => abortRef.current && abortRef.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------- Debounce search -------------------- */
  useEffect(() => {
    const t = setTimeout(() => setDebounced((searchTerm || "").trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  /* -------------------- Helpers -------------------- */
  const stripHtml = (html = "") => String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  /* -------------------- Filtering + Sorting -------------------- */
  const processed = useMemo(() => {
    let list = contents;

    if (debounced) {
      list = list.filter((c) => {
        const q = debounced;
        return (
          (c.englishTitle || "").toLowerCase().includes(q) ||
          (c.urduTitle || "").toLowerCase().includes(q) ||
          stripHtml(c.englishDescription || "").toLowerCase().includes(q) ||
          stripHtml(c.urduDescription || "").toLowerCase().includes(q)
        );
      });
    }

    const sorters = {
      id: (c) => Number(c.id || 0),
      englishTitle: (c) => (c.englishTitle || "").toLowerCase(),
      createdOn: (c) => new Date(c.createdOn || 0).getTime(), // safe even if missing
    };
    const keyFn = sorters[sortKey] || sorters.createdOn;
    const dir = sortDir === "asc" ? 1 : -1;

    return [...list].sort((a, b) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [contents, debounced, sortKey, sortDir]);

  /* -------------------- Pagination -------------------- */
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * itemsPerPage;
  const current = processed.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounced, itemsPerPage, sortKey, sortDir]);

  /* -------------------- Actions -------------------- */
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAddFormData((p) => ({ ...p, image: file }));
  };
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setEditFormData((p) => ({ ...p, image: file }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.image) {
      Swal.fire("Error", "Image is required.", "error");
      return;
    }
    const form = new FormData();
    Object.entries(addFormData).forEach(([k, v]) => form.append(k, v));

    Swal.fire({ title: "Submitting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.post(`${API_BASE_URL}/api/about`, form, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchContent(false);
      setAddFormData({
        englishTitle: "",
        urduTitle: "",
        englishDescription: "",
        urduDescription: "",
        image: null,
      });
      setIsAddModalOpen(false);
      Swal.fire("Success", "Content added successfully.", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to add the content.", "error");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the content.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: "Deleting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.delete(`${API_BASE_URL}/api/about/${id}`);
      await fetchContent(false);
      if (selectedContent?.id === id) setIsViewModalOpen(false);
      Swal.close();
      Swal.fire("Deleted!", "Content has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to delete the content.", "error");
      console.error(err);
    }
  };

  const openEditModal = (item) => {
    setSelectedContent(item);
    setEditFormData({
      englishTitle: item.englishTitle || "",
      urduTitle: item.urduTitle || "",
      englishDescription: item.englishDescription || "",
      urduDescription: item.urduDescription || "",
      image: null,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(editFormData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") form.append(key, value);
    });

    Swal.fire({ title: "Updating...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      await axios.put(`${API_BASE_URL}/api/about/${selectedContent.id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchContent(false);
      setIsEditModalOpen(false);
      Swal.fire("Success", "Content updated successfully.", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to update the content.", "error");
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchContent(false);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "englishTitle" ? "asc" : "desc");
    }
  };

  /* -------------------- Cells / skeletons -------------------- */
  const ImageCell = ({ id, alt }) => {
    const [ok, setOk] = useState(true);
    if (!ok) {
      return (
        <div className="w-16 h-16 rounded bg-gray-100 border flex items-center justify-center">
          <ImageOff className="w-5 h-5 text-gray-400" />
        </div>
      );
    }
    return (
      <img
        src={`${API_BASE_URL}/api/about/image/${id}`}
        alt={alt || "About"}
        className="w-16 h-16 object-cover rounded border"
        onError={() => setOk(false)}
        loading="lazy"
      />
    );
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="py-3 px-4">
        <div className="w-16 h-16 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-56" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-72" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-72" />
      </td>
      <td className="py-3 px-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );

  const MobileCard = ({ c, index }) => (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex gap-4">
        <ImageCell id={c.id} alt={c.englishTitle} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{c.englishTitle || "—"}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
              #{(pageSafe - 1) * itemsPerPage + index + 1}
            </span>
          </div>
          {c.urduTitle && (
            <div className="text-sm text-gray-600 mt-0.5" dir="rtl">
              {c.urduTitle}
            </div>
          )}
          <div className="mt-2 text-sm text-gray-600 line-clamp-2">
            {stripHtml(c.englishDescription || "") || "—"}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedContent(c);
                setIsViewModalOpen(true);
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md inline-flex items-center gap-1"
            >
              <Eye className="w-4 h-4" /> View
            </button>
            <button
              onClick={() => openEditModal(c)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md inline-flex items-center gap-1"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md inline-flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* -------------------- Render -------------------- */
  return (
    <Layout>
      <div className="p-4 md:p-6 min-h-screen text-gray-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">About Us</h2>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-2 rounded-lg transition-all"
              disabled={refreshing || loading}
              title="Refresh"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <Info className="w-5 h-5" />
              Add New About Content
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 mb-5">
          <div className="md:col-span-7">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by titles or description (English/Urdu)…"
                className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2.5 focus:outline-none focus:ring focus:border-[#5a6c17]/40"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
                  title="Clear"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={`${sortKey}:${sortDir}`}
                onChange={(e) => {
                  const [k, d] = e.target.value.split(":");
                  setSortKey(k);
                  setSortDir(d);
                }}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring focus:border-[#5a6c17]/40"
              >
                <option value="createdOn:desc">Newest first</option>
                <option value="createdOn:asc">Oldest first</option>
                <option value="englishTitle:asc">Title A→Z</option>
                <option value="englishTitle:desc">Title Z→A</option>
                <option value="id:asc">ID ↑</option>
                <option value="id:desc">ID ↓</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring focus:border-[#5a6c17]/40"
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status */}
        {loading && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">Loading content…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Image", "English Title", "Urdu Title", "English Description", "Urdu Description", "Actions"].map(
                      (h, i) => (
                        <th key={i} className="text-left text-sm font-semibold text-gray-700 py-3 px-4">
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
        )}

        {!loading && !error && processed.length === 0 && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
            No matching content. Try adjusting your search or sort.
          </div>
        )}

        {/* Data */}
        {!loading && !error && processed.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <strong>{processed.length ? startIdx + 1 : 0}</strong>–
                  <strong>{Math.min(startIdx + current.length, processed.length)}</strong> of{" "}
                  <strong>{processed.length}</strong>
                </div>
                <button
                  onClick={() => toggleSort(sortKey)}
                  className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-2"
                  title="Toggle sort direction"
                >
                  Sort: <span className="font-medium capitalize">{sortKey}</span>
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="uppercase">{sortDir}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-sm font-semibold text-gray-700">
                      <th className="py-3 px-4">Image</th>
                      <th
                        className="py-3 px-4 cursor-pointer select-none"
                        onClick={() => toggleSort("englishTitle")}
                        title="Sort by title"
                      >
                        English Title
                      </th>
                      <th className="py-3 px-4">Urdu Title</th>
                      <th className="py-3 px-4">English Description</th>
                      <th className="py-3 px-4">Urdu Description</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <ImageCell id={item.id} alt={item.englishTitle} />
                        </td>
                        <td className="py-3 px-4 max-w-[22rem]">
                          <div className="font-semibold text-gray-900 truncate">{item.englishTitle || "—"}</div>
                          {item.createdOn && (
                            <div className="text-xs text-gray-500 mt-0.5">Created: {formatDate(item.createdOn)}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-[18rem]" dir="rtl">
                          <div className="truncate">{item.urduTitle || "—"}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[28rem]">
                          <div className="truncate" title={stripHtml(item.englishDescription || "")}>
                            {stripHtml(item.englishDescription || "") || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[28rem]" dir="rtl">
                          <div className="truncate" title={stripHtml(item.urduDescription || "")}>
                            {stripHtml(item.urduDescription || "") || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedContent(item);
                                setIsViewModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  Showing <strong>{processed.length ? startIdx + 1 : 0}</strong>–
                  <strong>{Math.min(startIdx + current.length, processed.length)}</strong> of{" "}
                  <strong>{processed.length}</strong>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={pageSafe === 1}
                    className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.max(1, Math.ceil(processed.length / itemsPerPage)) }, (_, i) => i + 1).map(
                    (n) => (
                      <button
                        key={n}
                        onClick={() => setCurrentPage(n)}
                        className={`px-3 py-1.5 rounded border ${
                          n === pageSafe ? "bg-[#5a6c17] text-white border-[#5a6c17]" : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={pageSafe === totalPages}
                    className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {current.map((c, idx) => (
                <MobileCard key={c.id} c={c} index={idx} />
              ))}
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pageSafe === 1}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="text-sm text-gray-700">
                  Page {pageSafe} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={pageSafe === totalPages}
                  className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4">Add About Content</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">English Title</label>
                    <input
                      type="text"
                      name="englishTitle"
                      value={addFormData.englishTitle}
                      onChange={handleAddInputChange}
                      required
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Urdu Title</label>
                    <input
                      type="text"
                      name="urduTitle"
                      value={addFormData.urduTitle}
                      onChange={handleAddInputChange}
                      required
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">English Description</label>
                  <ReactQuill
                    theme="snow"
                    value={addFormData.englishDescription}
                    onChange={(v) => setAddFormData((p) => ({ ...p, englishDescription: v }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white border rounded-lg min-h-[200px]"
                    style={{ direction: "ltr", textAlign: "left" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Urdu Description</label>
                  <ReactQuill
                    theme="snow"
                    value={addFormData.urduDescription}
                    onChange={(v) => setAddFormData((p) => ({ ...p, urduDescription: v }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white border rounded-lg min-h-[200px]"
                    style={{ direction: "rtl", textAlign: "right" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImageChange}
                    required
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 border rounded">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && selectedContent && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold mb-4">View Content</h3>
              <div className="flex justify-center mb-4">
                <img
                  src={`${API_BASE_URL}/api/about/image/${selectedContent.id}`}
                  alt="About"
                  className="w-40 h-40 object-cover rounded border"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">English Title</p>
                  <p className="font-medium break-words">{selectedContent.englishTitle || "—"}</p>
                </div>
                <div dir="rtl">
                  <p className="text-sm text-gray-600">عنوان (اردو)</p>
                  <p className="font-medium break-words">{selectedContent.urduTitle || "—"}</p>
                </div>
                {selectedContent.createdOn && (
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">{formatDate(selectedContent.createdOn)}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-800">English</h4>
                <div className="bg-gray-50 p-4 rounded-lg prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: selectedContent.englishDescription || "" }} />
                </div>
              </div>

              <div className="mb-2">
                <h4 className="text-lg font-semibold mb-2 text-gray-800">Urdu</h4>
                <div className="bg-gray-50 p-4 rounded-lg prose max-w-none text-right" dir="rtl">
                  <div dangerouslySetInnerHTML={{ __html: selectedContent.urduDescription || "" }} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && selectedContent && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4">Edit About Content</h3>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">English Title</label>
                    <input
                      type="text"
                      name="englishTitle"
                      value={editFormData.englishTitle}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Urdu Title</label>
                    <input
                      type="text"
                      name="urduTitle"
                      value={editFormData.urduTitle}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">English Description</label>
                  <ReactQuill
                    theme="snow"
                    value={editFormData.englishDescription}
                    onChange={(v) => setEditFormData((p) => ({ ...p, englishDescription: v }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white border rounded-lg min-h-[200px]"
                    style={{ direction: "ltr", textAlign: "left" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Urdu Description</label>
                  <ReactQuill
                    theme="snow"
                    value={editFormData.urduDescription}
                    onChange={(v) => setEditFormData((p) => ({ ...p, urduDescription: v }))}
                    modules={quillModules}
                    formats={quillFormats}
                    className="bg-white border rounded-lg min-h-[200px]"
                    style={{ direction: "rtl", textAlign: "right" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="mt-1 p-2 border border-gray-300 rounded w-full"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded">
                    Update
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
