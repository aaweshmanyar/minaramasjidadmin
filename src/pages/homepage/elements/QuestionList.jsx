import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  HelpCircle,
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

// Quill config (kept in case you decide to edit inline later)
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    ["link", "image"],
    ["clean"],
  ],
};
const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
];

export default function QuestionList() {
  const navigate = useNavigate();

  // ---------- State ----------
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortKey, setSortKey] = useState("date"); // "date" | "title" | "id" | "writer"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);

  const abortRef = useRef(null);

  // ---------- Fetch ----------
  const fetchQuestions = async (showSpinner = true) => {
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (showSpinner) setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/questions`, { signal: ctrl.signal });
      const data = await res.json();

      if (Array.isArray(data)) setQuestions(data);
      else {
        setQuestions([]);
        setError("No questions found.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching data:", err);
        setError("Error fetching questions.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuestions(true);
    return () => abortRef.current && abortRef.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Debounce search ----------
  useEffect(() => {
    const t = setTimeout(() => setDebounced((searchTerm || "").trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---------- Helpers ----------
  const stripHtml = (html = "") => String(html).replace(/<[^>]*>/g, " ");
  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  // ---------- Filtering + Sorting ----------
  const processed = useMemo(() => {
    let list = questions;

    if (debounced) {
      list = list.filter((q) => {
        const se = debounced;
        const englishQ = (q.questionEnglish || "").toLowerCase();
        const urduQ = (q.questionUrdu || "").toLowerCase();
        const englishA = stripHtml(q.answerEnglish || "").toLowerCase();
        const urduA = stripHtml(q.answerUrdu || "").toLowerCase();
        const slug = (q.slug || "").toLowerCase();
        const writer = (q.writer || "").toLowerCase();
        return (
          englishQ.includes(se) ||
          urduQ.includes(se) ||
          englishA.includes(se) ||
          urduA.includes(se) ||
          slug.includes(se) ||
          writer.includes(se)
        );
      });
    }

    const sorters = {
      id: (q) => Number(q.id || 0),
      title: (q) => (q.questionEnglish || "").toLowerCase(),
      writer: (q) => (q.writer || "").toLowerCase(),
      date: (q) => new Date(q.date || 0).getTime(),
    };

    const dir = sortDir === "asc" ? 1 : -1;
    const keyFn = sorters[sortKey] || sorters.date;

    return [...list].sort((a, b) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [questions, debounced, sortKey, sortDir]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * itemsPerPage;
  const current = processed.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounced, itemsPerPage, sortKey, sortDir]);

  // ---------- Actions ----------
  const handleView = (question) => {
    setSelectedQuestion(question);
    setShowViewPopup(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This will permanently delete the question.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      });
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.delete(`${API_BASE_URL}/api/questions/${id}`);

      Swal.close();
      Swal.fire("Deleted!", "Question has been deleted.", "success");
      await fetchQuestions(false);
      if (selectedQuestion?.id === id) setShowViewPopup(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete question.", "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions(false);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  // ---------- Cells / Rows ----------
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
        src={`${API_BASE_URL}/api/questions/image/${id}`}
        alt={alt || "Question"}
        className="w-16 h-16 object-cover rounded border"
        onError={() => setOk(false)}
        loading="lazy"
      />
    );
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-16 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-64" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-64" />
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="py-3 px-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );

  const MobileCard = ({ q, index }) => (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4">
      <ImageCell id={q.id} alt={q.slug} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{q.slug || "—"}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
            #{(pageSafe - 1) * itemsPerPage + index + 1}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-700 line-clamp-2">
          {q.questionEnglish || stripHtml(q.answerEnglish || "") || "—"}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-gray-100">Writer: {q.writer || "—"}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Date: {formatDate(q.date)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => handleView(q)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={() => navigate(`/question-update/${q.id}`)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => handleDelete(q.id)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-6 min-h-screen text-gray-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Question Management</h1>
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
              onClick={() => navigate(`/createquestion`)}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <HelpCircle className="w-5 h-5" />
              Add New Question
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 mb-5">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by slug, English/Urdu question or answer, writer…"
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
                <option value="date:desc">Newest first</option>
                <option value="date:asc">Oldest first</option>
                <option value="title:asc">Title A→Z</option>
                <option value="title:desc">Title Z→A</option>
                <option value="writer:asc">Writer A→Z</option>
                <option value="writer:desc">Writer Z→A</option>
                <option value="id:asc">ID ↑</option>
                <option value="id:desc">ID ↓</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
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
            <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">Loading questions…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Slug", "Image", "English Question", "Urdu Question", "Writer", "Date", "Actions"].map(
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
            No matching questions. Try adjusting your search or sort.
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
                      <th className="py-3 px-4">Slug</th>
                      <th className="py-3 px-4">Image</th>
                      <th
                        className="py-3 px-4 cursor-pointer select-none"
                        onClick={() => toggleSort("title")}
                        title="Sort by title"
                      >
                        English Question
                      </th>
                      <th className="py-3 px-4">Urdu Question</th>
                      <th
                        className="py-3 px-4 hidden md:table-cell cursor-pointer select-none"
                        onClick={() => toggleSort("writer")}
                        title="Sort by writer"
                      >
                        Writer
                      </th>
                      <th
                        className="py-3 px-4 hidden sm:table-cell cursor-pointer select-none"
                        onClick={() => toggleSort("date")}
                        title="Sort by date"
                      >
                        Date
                      </th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 max-w-[18rem]">
                          <div className="font-medium text-gray-900 truncate">{q.slug || "—"}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{q.writer || "—"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <ImageCell id={q.id} alt={q.slug} />
                        </td>
                        <td className="py-3 px-4 max-w-[24rem]">
                          <div className="truncate" title={stripHtml(q.questionEnglish || "")}>
                            {q.questionEnglish || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[24rem]">
                          <div className="truncate" dir="rtl" title={stripHtml(q.questionUrdu || "")}>
                            {q.questionUrdu || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">{q.writer || "—"}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{formatDate(q.date)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(q)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/question-update/${q.id}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`px-3 py-1.5 rounded border ${
                        n === pageSafe ? "bg-[#5a6c17] text-white border-[#5a6c17]" : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
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
              {current.map((q, idx) => (
                <MobileCard key={q.id} q={q} index={idx} />
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

        {/* View Popup */}
        {showViewPopup && selectedQuestion && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-lg">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                onClick={() => setShowViewPopup(false)}
              >
                ✕
              </button>

              <h2 className="text-xl font-bold mb-4">Question Details</h2>

              <div className="mb-4 flex justify-center">
                <img
                  src={`${API_BASE_URL}/api/questions/image/${selectedQuestion.id}`}
                  alt={selectedQuestion.slug}
                  className="max-h-64 max-w-full rounded border"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">English</h3>
                <div className="bg-gray-50 p-4 rounded-lg prose max-w-none">
                  <p className="font-medium mb-1">Question:</p>
                  <div className="mb-3">{selectedQuestion.questionEnglish || "—"}</div>
                  <p className="font-medium mb-1">Answer:</p>
                  <div dangerouslySetInnerHTML={{ __html: selectedQuestion.answerEnglish || "" }} />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Urdu</h3>
                <div className="bg-gray-50 p-4 rounded-lg prose max-w-none text-right" dir="rtl">
                  <p className="font-medium mb-1">سوال:</p>
                  <div className="mb-3">{selectedQuestion.questionUrdu || "—"}</div>
                  <p className="font-medium mb-1">جواب:</p>
                  <div dangerouslySetInnerHTML={{ __html: selectedQuestion.answerUrdu || "" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-sm text-gray-600">Slug</p>
                  <p className="font-medium break-all">{selectedQuestion.slug || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Writer</p>
                  <p className="font-medium">{selectedQuestion.writer || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(selectedQuestion.date)}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowViewPopup(false)}
                  className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded-md"
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
