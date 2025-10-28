import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import {
  FileText,
  Eye,
  Pencil,
  Trash2,
  Search,
  X,
  Loader2,
  ImageOff,
  RefreshCw,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import API_BASE_URL from "../../../../config";
import Swal from "sweetalert2";

export default function ViewArticle() {
  const navigate = useNavigate();

  // ---------- State ----------
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortKey, setSortKey] = useState("createdOn"); // "title" | "views" | "createdOn"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"
  const [languageFilter, setLanguageFilter] = useState("all");

  const abortRef = useRef(null);

  // ---------- Fetch ----------
  const fetchArticles = async (showSpinner = true) => {
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (showSpinner) setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/api/articles`, {
        signal: ctrl.signal,
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        setArticles(data);
      } else {
        setArticles([]);
        setError("No articles found.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching articles:", err);
        setError("Error loading articles.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchArticles(true);
    // cleanup
    return () => abortRef.current && abortRef.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Debounce search ----------
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---------- Derived: languages ----------
  const languages = useMemo(() => {
    const set = new Set();
    articles.forEach((a) => a?.language && set.add(a.language));
    return Array.from(set).sort();
  }, [articles]);

  // ---------- Filtering + Sorting ----------
  const processed = useMemo(() => {
    let list = articles;

    if (debounced) {
      list = list.filter((a) => {
        const title = (a.title || "").toLowerCase();
        const writers = (a.writers || "").toLowerCase();
        const lang = (a.language || "").toLowerCase();
        const urdu = (a.urduDescription || "").toLowerCase();
        const eng = (a.englishDescription || "").toLowerCase();
        return (
          title.includes(debounced) ||
          writers.includes(debounced) ||
          lang.includes(debounced) ||
          urdu.includes(debounced) ||
          eng.includes(debounced)
        );
      });
    }

    if (languageFilter !== "all") {
      list = list.filter((a) => (a.language || "").toLowerCase() === languageFilter.toLowerCase());
    }

    const sorters = {
      title: (a) => (a.title || "").toLowerCase(),
      views: (a) => Number(a.views || 0),
      createdOn: (a) => new Date(a.createdOn || 0).getTime(),
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
  }, [articles, debounced, languageFilter, sortKey, sortDir]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * itemsPerPage;
  const current = processed.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    // reset to first page when filters/sort/search change
    setCurrentPage(1);
  }, [debounced, languageFilter, itemsPerPage, sortKey, sortDir]);

  // ---------- Actions ----------
  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the article.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        const res = await fetch(`${API_BASE_URL}/api/articles/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to delete article");
        }
        setArticles((prev) => prev.filter((x) => x.id !== id));
        Swal.fire("Deleted", "Article has been deleted.", "success");
      } catch (e) {
        console.error("Delete error:", e);
        Swal.fire("Error", `Failed to delete article. ${e.message}`, "error");
      }
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchArticles(false);
  };

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "title" ? "asc" : "desc");
    }
  };

  // ---------- UI helpers ----------
  const formatDate = (d) => {
    if (!d) return "—";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return "—";
    }
  };

  const ImageCell = ({ id }) => {
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
        src={`${API_BASE_URL}/api/articles/image/${id}`}
        alt="Article"
        className="w-16 h-16 object-cover rounded border"
        onError={() => setOk(false)}
        loading="lazy"
      />
    );
  };

  // ---------- Skeleton ----------
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-6" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-40" />
      </td>
      <td className="py-3 px-4">
        <div className="w-16 h-16 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-64" />
      </td>
      <td className="py-3 px-4 hidden xl:table-cell">
        <div className="h-4 bg-gray-200 rounded w-64" />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="py-3 px-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );

  // ---------- Mobile card ----------
  const MobileCard = ({ a, index }) => (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4">
      <ImageCell id={a.id} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{a.title || "—"}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
            #{(pageSafe - 1) * itemsPerPage + index + 1}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600 line-clamp-2">{a.englishDescription || a.urduDescription || "—"}</div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-gray-100">Writer: {a.writers || "—"}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Lang: {a.language || "—"}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Views: {a.views || 0}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Date: {formatDate(a.createdOn)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => navigate(`/viewarticle/article/${a.id}`)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={() => navigate(`/updatearticle/article/${a.id}`)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => handleDelete(a.id)}
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
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Articles Management</h2>
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
              onClick={() => navigate(`/article`)}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Add New Article
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 mb-5">
          <div className="md:col-span-5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, writer, language, or description…"
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
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring focus:border-[#5a6c17]/40"
              >
                <option value="all">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
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
                <option value="views:desc">Views ↓</option>
                <option value="views:asc">Views ↑</option>
                <option value="title:asc">Title A→Z</option>
                <option value="title:desc">Title Z→A</option>
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
            <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">Loading articles…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["Sr", "Title", "Image", "English Description", "Urdu Description", "Writers", "Translator", "Language", "Views", "Date", "Actions"].map(
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
          <div className="bg-white border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && processed.length === 0 && (
          <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
            No matching articles. Try adjusting your search or filters.
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
                      <th className="py-3 px-4">Sr</th>
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("title")}>
                        Title
                      </th>
                      <th className="py-3 px-4">Image</th>
                      <th className="py-3 px-4">English Description</th>
                      <th className="py-3 px-4 hidden xl:table-cell">Urdu Description</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Writers</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Translator</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Language</th>
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("views")}>
                        Views
                      </th>
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("createdOn")}>
                        Date
                      </th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{startIdx + idx + 1}</td>
                        <td className="py-3 px-4 max-w-[22rem]">
                          <div className="font-semibold text-gray-900 truncate">{a.title || "—"}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {a.englishDescription || a.urduDescription || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <ImageCell id={a.id} />
                        </td>
                        <td className="py-3 px-4 max-w-[20rem]">
                          <div className="truncate" title={a.englishDescription}>
                            {a.englishDescription || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[20rem] hidden xl:table-cell">
                          <div className="truncate" title={a.urduDescription}>
                            {a.urduDescription || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">{a.writers || "—"}</td>
                        <td className="py-3 px-4 hidden lg:table-cell">{a.translator || "—"}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{a.language || "—"}</td>
                        <td className="py-3 px-4">{a.views || 0}</td>
                        <td className="py-3 px-4">{formatDate(a.createdOn)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/viewarticle/article/${a.id}`)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/updatearticle/article/${a.id}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
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
                <div className="flex flex-wrap items-center gap-1">
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
              {current.map((a, idx) => (
                <MobileCard key={a.id} a={a} index={idx} />
              ))}
              {/* Mobile pagination */}
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
      </div>
    </Layout>
  );
}
