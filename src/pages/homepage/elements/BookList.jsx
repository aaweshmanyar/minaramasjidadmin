import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  BookOpenCheck,
  Pencil,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
  ImageOff,
  RefreshCw,
  ArrowUpDown,
  FileDown,
} from "lucide-react";
import API_BASE_URL from "../../../../config";

export default function BookList() {
  const navigate = useNavigate();

  // ---------- State ----------
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortKey, setSortKey] = useState("createdOn"); // "createdOn" | "bookDate" | "title" | "author" | "id"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  const [selectedBook, setSelectedBook] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const abortRef = useRef(null);

  // ---------- Fetch ----------
  const fetchBooks = async (showSpinner = true) => {
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (showSpinner) setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/books`, { signal: ctrl.signal });
      const data = await res.json();

      if (Array.isArray(data)) setBooks(data);
      else {
        setBooks([]);
        setError("No books found.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching data:", err);
        setError("Error fetching books.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks(true);
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
    let list = books;

    if (debounced) {
      list = list.filter((b) => {
        const se = debounced;
        return (
          (b.title || "").toLowerCase().includes(se) ||
          (b.author || "").toLowerCase().includes(se) ||
          (b.translator || "").toLowerCase().includes(se) ||
          (b.language || "").toLowerCase().includes(se) ||
          (b.category || "").toLowerCase().includes(se) ||
          (b.isbn || "").toLowerCase().includes(se) ||
          stripHtml(b.description || "").toLowerCase().includes(se)
        );
      });
    }

    const sorters = {
      id: (b) => Number(b.id || 0),
      title: (b) => (b.title || "").toLowerCase(),
      author: (b) => (b.author || "").toLowerCase(),
      createdOn: (b) => new Date(b.createdOn || 0).getTime(),
      bookDate: (b) => new Date(b.bookDate || 0).getTime(),
    };

    const dir = sortDir === "asc" ? 1 : -1;
    const keyFn = sorters[sortKey] || sorters.createdOn;

    return [...list].sort((a, b) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [books, debounced, sortKey, sortDir]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * itemsPerPage;
  const current = processed.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounced, itemsPerPage, sortKey, sortDir]);

  // ---------- Actions ----------
  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This will permanently delete the book.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.delete(`${API_BASE_URL}/api/books/${id}`);

      Swal.close();
      const timestamp = new Date().toLocaleString();
      Swal.fire({ icon: "success", title: "Book Deleted!", text: `Deleted at ${timestamp}` });

      await fetchBooks(false);
      if (selectedBook?.id === id) setShowViewModal(false);
    } catch (error) {
      console.error("Delete failed:", error);
      Swal.fire("Error", "Delete failed!", "error");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBooks(false);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  const openView = (book) => {
    setSelectedBook(book);
    setShowViewModal(true);
  };

  // ---------- Cells / Rows ----------
  const ImageCell = ({ id, alt }) => {
    const [ok, setOk] = useState(true);
    if (!ok) {
      return (
        <div className="w-16 h-24 rounded bg-gray-100 border flex items-center justify-center">
          <ImageOff className="w-5 h-5 text-gray-400" />
        </div>
      );
    }
    return (
      <img
        src={`${API_BASE_URL}/api/books/cover/${id}`}
        alt={alt || "Cover"}
        className="w-16 h-24 object-cover rounded border"
        onError={() => setOk(false)}
        loading="lazy"
      />
    );
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-8" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-24 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-56" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4 hidden xl:table-cell">
        <div className="h-4 bg-gray-200 rounded w-72" />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="py-3 px-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );

  const MobileCard = ({ b, index }) => (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4">
      <ImageCell id={b.id} alt={b.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{b.title || "—"}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
            #{(pageSafe - 1) * itemsPerPage + index + 1}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
          {stripHtml(b.description || "") || "—"}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-gray-100">Author: {b.author || "—"}</span>
          {b.translator && <span className="px-2 py-0.5 rounded bg-gray-100">Translator: {b.translator}</span>}
          <span className="px-2 py-0.5 rounded bg-gray-100">Lang: {b.language || "—"}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Date: {formatDate(b.bookDate)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => openView(b)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={() => navigate(`/update-book/book/${b.id}`)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          {b.id && (
            <a
              href={`${API_BASE_URL}/api/books/attachment/${b.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 border rounded-md inline-flex items-center gap-1 hover:bg-gray-50 text-sm"
              title="Open PDF"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="p-4 md:p-6 min-h-screen text-gray-800">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Books Management</h1>
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
              onClick={() => navigate(`/book`)}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <BookOpenCheck className="w-5 h-5" />
              Add New Book
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
                placeholder="Search by title, author, translator, language, category, ISBN…"
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
                <option value="createdOn:desc">Newest (Created)</option>
                <option value="createdOn:asc">Oldest (Created)</option>
                <option value="bookDate:desc">Newest (Book Date)</option>
                <option value="bookDate:asc">Oldest (Book Date)</option>
                <option value="title:asc">Title A→Z</option>
                <option value="title:desc">Title Z→A</option>
                <option value="author:asc">Author A→Z</option>
                <option value="author:desc">Author Z→A</option>
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
            <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">Loading books…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["ID", "Cover", "Title", "ISBN", "Description", "Author", "Translator", "Language", "Book Date", "Status", "Category", "Created On", "Published", "Modified On", "PDF", "Actions"].map(
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
            No matching books. Try adjusting your search or sort.
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
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("id")}>
                        ID
                      </th>
                      <th className="py-3 px-4">Cover</th>
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("title")}>
                        Title
                      </th>
                      <th className="py-3 px-4">ISBN</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleSort("author")}>
                        Author
                      </th>
                      <th className="py-3 px-4 hidden xl:table-cell">Translator</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Language</th>
                      <th className="py-3 px-4 cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleSort("bookDate")}>
                        Book Date
                      </th>
                      <th className="py-3 px-4 hidden xl:table-cell">Status</th>
                      <th className="py-3 px-4 hidden xl:table-cell">Category</th>
                      <th className="py-3 px-4 cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort("createdOn")}>
                        Created On
                      </th>
                      <th className="py-3 px-4 hidden md:table-cell">Published</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Modified On</th>
                      <th className="py-3 px-4">PDF</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{b.id}</td>
                        <td className="py-3 px-4">
                          <ImageCell id={b.id} alt={b.title} />
                        </td>
                        <td className="py-3 px-4 max-w-[22rem]">
                          <div className="font-semibold text-gray-900 truncate">{b.title || "—"}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{b.category || "—"}</div>
                        </td>
                        <td className="py-3 px-4">{b.isbn || "—"}</td>
                        <td className="py-3 px-4 max-w-[30rem]">
                          <div className="truncate" title={stripHtml(b.description || "")}>
                            {stripHtml(b.description || "") || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">{b.author || "—"}</td>
                        <td className="py-3 px-4 hidden xl:table-cell">{b.translator || "—"}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{b.language || "—"}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{formatDate(b.bookDate)}</td>
                        <td className="py-3 px-4 hidden xl:table-cell">{b.status || "—"}</td>
                        <td className="py-3 px-4 hidden xl:table-cell">{b.category || "—"}</td>
                        <td className="py-3 px-4 hidden md:table-cell">{formatDate(b.createdOn)}</td>
                        <td className="py-3 px-4 hidden md:table-cell">{b.isPublished ? "Yes" : "No"}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">{formatDate(b.modifiedOn)}</td>
                        <td className="py-3 px-4">
                          {b.id && (
                            <a
                              href={`${API_BASE_URL}/api/books/attachment/${b.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
                              title="Open PDF"
                            >
                              <FileDown className="w-4 h-4" />
                              PDF
                            </a>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openView(b)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/update-book/book/${b.id}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(b.id)}
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
              {current.map((b, idx) => (
                <MobileCard key={b.id} b={b} index={idx} />
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

        {/* View Modal */}
        {showViewModal && selectedBook && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button
                onClick={() => setShowViewModal(false)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4 text-center">Book Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><strong>Title:</strong> {selectedBook.title || "—"}</div>
                <div><strong>ISBN:</strong> {selectedBook.isbn || "—"}</div>
                <div><strong>Author:</strong> {selectedBook.author || "—"}</div>
                <div><strong>Translator:</strong> {selectedBook.translator || "—"}</div>
                <div><strong>Language:</strong> {selectedBook.language || "—"}</div>
                <div><strong>Book Date:</strong> {formatDate(selectedBook.bookDate)}</div>
                <div><strong>Status:</strong> {selectedBook.status || "—"}</div>
                <div><strong>Category:</strong> {selectedBook.category || "—"}</div>
                <div><strong>Published:</strong> {selectedBook.isPublished ? "Yes" : "No"}</div>
                <div><strong>Deleted:</strong> {selectedBook.isDeleted ? "Yes" : "No"}</div>
                <div><strong>Created On:</strong> {formatDate(selectedBook.createdOn)}</div>
                <div><strong>Modified On:</strong> {formatDate(selectedBook.modifiedOn)}</div>

                <div className="sm:col-span-2">
                  <strong>Description:</strong>
                  <p className="mt-1 text-gray-700">{stripHtml(selectedBook.description || "—")}</p>
                </div>

                <div className="sm:col-span-2 text-center">
                  <img
                    src={`${API_BASE_URL}/api/books/cover/${selectedBook.id}`}
                    alt={selectedBook.title}
                    className="w-40 h-auto mx-auto mt-4 rounded border"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>

                {selectedBook.id && (
                  <div className="sm:col-span-2 flex justify-center mt-2">
                    <a
                      href={`${API_BASE_URL}/api/books/attachment/${selectedBook.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      <FileDown className="w-4 h-4" />
                      Open PDF
                    </a>
                  </div>
                )}
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white px-4 py-2 rounded-md"
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
