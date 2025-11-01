import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Pencil,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
  ImageOff,
  RefreshCw,
  Filter,
  ArrowUpDown,
} from "lucide-react";

const API_BASE_URL = "https://minaramasjid-backend.onrender.com/api";

export default function EventList() {
  const navigate = useNavigate();

  // ---------- State ----------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortKey, setSortKey] = useState("eventDate"); // "title" | "eventDate" | "id"
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  const [languageFilter, setLanguageFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  const [selectedEvent, setSelectedEvent] = useState(null);

  const abortRef = useRef(null);

  // ---------- Fetch ----------
  const fetchEvents = async (showSpinner = true) => {
    try {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      if (showSpinner) setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE_URL}/events`, { signal: ctrl.signal });
      const data = await res.json();

      if (Array.isArray(data)) setEvents(data);
      else {
        setEvents([]);
        setError("No events found.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching events:", err);
        setError("Error loading events.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
    return () => abortRef.current && abortRef.current.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Debounce search ----------
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ---------- Derived filter lists ----------
  const languages = useMemo(() => {
    const set = new Set();
    events.forEach((e) => e?.language && set.add(e.language));
    return Array.from(set).sort();
  }, [events]);

  const topics = useMemo(() => {
    const set = new Set();
    events.forEach((e) => e?.topic && set.add(e.topic));
    return Array.from(set).sort();
  }, [events]);

  // ---------- Filtering + Sorting ----------
  const stripHtml = (html = "") => String(html).replace(/<[^>]*>/g, " ");
  const processed = useMemo(() => {
    let list = events;

    if (debounced) {
      list = list.filter((e) => {
        const title = (e.title || "").toLowerCase();
        const content = stripHtml(e.content || "").toLowerCase();
        const topic = (e.topic || "").toLowerCase();
        const language = (e.language || "").toLowerCase();
        const tags = (e.tags || "").toLowerCase();
        const writers = (e.writers || "").toLowerCase();
        const translator = (e.translator || "").toLowerCase();

        return (
          title.includes(debounced) ||
          content.includes(debounced) ||
          topic.includes(debounced) ||
          language.includes(debounced) ||
          tags.includes(debounced) ||
          writers.includes(debounced) ||
          translator.includes(debounced)
        );
      });
    }

    if (languageFilter !== "all") {
      list = list.filter(
        (e) => (e.language || "").toLowerCase() === languageFilter.toLowerCase()
      );
    }

    if (topicFilter !== "all") {
      list = list.filter((e) => (e.topic || "") === topicFilter);
    }

    const sorters = {
      id: (e) => Number(e.id || 0),
      title: (e) => (e.title || "").toLowerCase(),
      eventDate: (e) => new Date(e.eventDate || 0).getTime(),
    };

    const dir = sortDir === "asc" ? 1 : -1;
    const keyFn = sorters[sortKey] || sorters.eventDate;

    return [...list].sort((a, b) => {
      const va = keyFn(a);
      const vb = keyFn(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [events, debounced, languageFilter, topicFilter, sortKey, sortDir]);

  // ---------- Pagination ----------
  const totalPages = Math.max(1, Math.ceil(processed.length / itemsPerPage));
  const pageSafe = Math.min(currentPage, totalPages);
  const startIdx = (pageSafe - 1) * itemsPerPage;
  const current = processed.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounced, languageFilter, topicFilter, itemsPerPage, sortKey, sortDir]);

  // ---------- Actions ----------
  const handleView = (event) => {
    setSelectedEvent(event);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the event.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: "Deleting...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(`${API_BASE_URL}/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");

      Swal.close();
      Swal.fire("Deleted!", "Event has been deleted.", "success");
      await fetchEvents(false);
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch (err) {
      Swal.fire("Error", "Failed to delete event.", "error");
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(false);
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
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  const ImageCell = ({ id, alt }) => {
    const [ok, setOk] = useState(true);
    if (!ok) {
      return (
        <div className="w-20 h-14 rounded bg-gray-100 border flex items-center justify-center mx-auto">
          <ImageOff className="w-5 h-5 text-gray-400" />
        </div>
      );
    }
    return (
      <img
        src={`${API_BASE_URL}/events/image/${id}`}
        alt={alt || "Event"}
        className="w-20 h-14 object-cover rounded border mx-auto"
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
        <div className="w-20 h-14 bg-gray-200 rounded" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-48" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-gray-200 rounded w-64" />
      </td>
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="py-3 px-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
      </td>
    </tr>
  );

  const MobileCard = ({ e, index }) => (
    <div className="border rounded-xl p-4 bg-white shadow-sm flex gap-4">
      <ImageCell id={e.id} alt={e.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{e.title || "—"}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 shrink-0">
            #{(pageSafe - 1) * itemsPerPage + index + 1}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-600 line-clamp-2">
          {stripHtml(e.content || "") || "—"}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-gray-100">Topic: {e.topic || "—"}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100">Lang: {e.language || "—"}</span>
          {e.tags && <span className="px-2 py-0.5 rounded bg-gray-100">Tags: {e.tags}</span>}
          <span className="px-2 py-0.5 rounded bg-gray-100">Date: {formatDate(e.eventDate)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => handleView(e)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button
            onClick={() => navigate(`/event/update-event/${e.id}`)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md inline-flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => handleDelete(e.id)}
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Event List</h1>
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
              onClick={() => navigate(`/createevent`)}
              className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
            >
              <CalendarDays className="w-5 h-5" />
              Add New Event
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
                placeholder="Search by title, topic, language, tags, writer, translator…"
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
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring focus:border-[#5a6c17]/40"
            >
              <option value="all">All topics</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
                <option value="eventDate:desc">Newest first</option>
                <option value="eventDate:asc">Oldest first</option>
                <option value="title:asc">Title A→Z</option>
                <option value="title:desc">Title Z→A</option>
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
            <div className="px-4 py-3 border-b bg-gray-50 sticky top-0 z-10">Loading events…</div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {["ID", "Image", "Title", "Content", "Topic", "Language", "Actions"].map((h, i) => (
                      <th key={i} className="text-left text-sm font-semibold text-gray-700 py-3 px-4">
                        {h}
                      </th>
                    ))}
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
            No matching events. Try adjusting your search or filters.
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
                      <th className="py-3 px-4">Image</th>
                      <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort("title")}>
                        Title
                      </th>
                      <th className="py-3 px-4">Content</th>
                      <th className="py-3 px-4 hidden lg:table-cell">Topic</th>
                      <th className="py-3 px-4 hidden sm:table-cell">Language</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {current.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{e.id}</td>
                        <td className="py-3 px-4">
                          <ImageCell id={e.id} alt={e.title} />
                        </td>
                        <td className="py-3 px-4 max-w-[22rem]">
                          <div className="font-semibold text-gray-900 truncate">{e.title || "—"}</div>
                          <div className="text-xs text-gray-500 truncate mt-0.5">{e.topic || "—"}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[28rem]">
                          <div className="truncate" title={stripHtml(e.content || "")}>
                            {stripHtml(e.content || "") || "—"}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">{e.topic || "—"}</td>
                        <td className="py-3 px-4 hidden sm:table-cell">{e.language || "—"}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(e)}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => navigate(`/event/update-event/${e.id}`)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded inline-flex items-center gap-1"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(e.id)}
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
              {current.map((e, idx) => (
                <MobileCard key={e.id} e={e} index={idx} />
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

        {/* Viewer Modal (no inline edit anymore) */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>

              <div>
                <h3 className="text-xl font-bold mb-4">{selectedEvent.title}</h3>
                <img
                  src={`${API_BASE_URL}/events/image/${selectedEvent.id}`}
                  alt={selectedEvent.title}
                  className="w-full max-h-64 object-contain mb-4 rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div
                  className="prose max-w-none border p-4 bg-gray-50 rounded"
                  dangerouslySetInnerHTML={{ __html: selectedEvent.content }}
                />
                <div className="mt-4 text-sm text-gray-500 space-y-1">
                  <p>Event Date: {formatDate(selectedEvent.eventDate)}</p>
                  {selectedEvent.topic && <p>Topic: {selectedEvent.topic}</p>}
                  {selectedEvent.language && <p>Language: {selectedEvent.language}</p>}
                  {selectedEvent.tags && <p>Tags: {selectedEvent.tags}</p>}
                  {selectedEvent.writers && <p>Writer: {selectedEvent.writers}</p>}
                  {selectedEvent.translator && <p>Translator: {selectedEvent.translator}</p>}
                </div>

                <div className="mt-5 flex gap-2 justify-end">
                  <button
                    onClick={() => navigate(`/event/update-event/${selectedEvent.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedEvent.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 inline-flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
