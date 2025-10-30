import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Eye,
  Pencil,
  Trash2,
  PlusCircle,
  Search as SearchIcon,
  Images,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Use localhost backend

const API_BASE_URL = "http://api.minaramasjid.com";

export default function GalleryList() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [f, setF] = useState({
    id: "",
    title: "",
    description: "",
    date: "",
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [view, setView] = useState(null);

  // ----------------------------
  // Fetch galleries from backend
  // ----------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/galleries`);
      // Normalize data
      const normalized = (Array.isArray(data) ? data : []).map((g) => ({
        id: g.id,
        title: g.title || "",
        description: g.description || "",
        date: g.eventDate || "",
        imageName: g.imageName || "",
      }));
      setGalleries(normalized);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Unable to load galleries.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------
  // View gallery (fetch actual image)
  // ----------------------------
  const onView = async (row) => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/galleries/image/${row.id}`,
        { responseType: "arraybuffer" }
      );
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const imageUrl = URL.createObjectURL(blob);
      setView({
        ...row,
        imageUrl,
      });
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Unable to load image.", "error");
    }
  };

  // ----------------------------
  // Delete gallery
  // ----------------------------
  const onDelete = async (row) => {
    const ok = await Swal.fire({
      icon: "warning",
      title: "Delete gallery?",
      text: `This will permanently remove "${row.title}".`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
    }).then((r) => r.isConfirmed);

    if (!ok) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/galleries/${row.id}`);
      Swal.fire("Deleted", "Gallery has been deleted.", "success");
      fetchData();
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete gallery.", "error");
    }
  };

  // ----------------------------
  // Filtering + pagination
  // ----------------------------
  const filtered = useMemo(() => {
    const norm = (s) => String(s || "").toLowerCase();
    let rows = [...galleries];

    // global search
    if (q.trim()) {
      const needle = norm(q);
      rows = rows.filter(
        (r) =>
          norm(r.title).includes(needle) ||
          norm(r.description).includes(needle) ||
          norm(r.date).includes(needle)
      );
    }

    // column filters
    if (f.id) rows = rows.filter((r) => norm(r.id).includes(norm(f.id)));
    if (f.title)
      rows = rows.filter((r) => norm(r.title).includes(norm(f.title)));
    if (f.description)
      rows = rows.filter((r) =>
        norm(r.description).includes(norm(f.description))
      );
    if (f.date) rows = rows.filter((r) => norm(r.date).includes(norm(f.date)));

    return rows;
  }, [galleries, q, f]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages, page]);

  // ----------------------------
  // Render UI
  // ----------------------------
  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
            <p className="text-sm text-gray-500">
              Manage entries in the Gallery section.
            </p>
          </div>
          <button
            onClick={() => navigate("/creategallery")}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Gallery
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search across all fields..."
                className="w-full pl-10 pr-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left font-semibold p-3">ID</th>
                  <th className="text-left font-semibold p-3">Title</th>
                  <th className="text-left font-semibold p-3">Description</th>
                  <th className="text-left font-semibold p-3">Date</th>
                  <th className="text-right font-semibold p-3">Actions</th>
                </tr>
                {/* Filter Row */}
                <tr className="border-b">
                  <th className="p-2">
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      placeholder="Search ID..."
                      value={f.id}
                      onChange={(e) => setF({ ...f, id: e.target.value })}
                    />
                  </th>
                  <th className="p-2">
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      placeholder="Search Title..."
                      value={f.title}
                      onChange={(e) => setF({ ...f, title: e.target.value })}
                    />
                  </th>
                  <th className="p-2">
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      placeholder="Search Description..."
                      value={f.description}
                      onChange={(e) =>
                        setF({ ...f, description: e.target.value })
                      }
                    />
                  </th>
                  <th className="p-2">
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      placeholder="Search Date..."
                      value={f.date}
                      onChange={(e) => setF({ ...f, date: e.target.value })}
                    />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-3">{row.id}</td>
                      <td className="p-3">{row.title}</td>
                      <td className="p-3 line-clamp-1">
                        {row.description?.replace(/<[^>]*>?/gm, "")}
                      </td>
                      <td className="p-3">{row.date || "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="View"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => onView(row)}
                          >
                            <Eye className="w-5 h-5 text-emerald-700" />
                          </button>
                          <button
                            title="Edit"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() =>
                              navigate(`/gallery/${row.id}/edit`)
                            }
                          >
                            <Pencil className="w-5 h-5 text-indigo-600" />
                          </button>
                          <button
                            title="Delete"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="w-5 h-5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={5}>
                      No entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 text-sm text-gray-600">
            <div>
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} of{" "}
              {filtered.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <span className="px-3 py-1 rounded-lg border bg-white">{page}</span>
              <button
                className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {view && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-emerald-700" />
                <h3 className="font-semibold text-lg">{view.title}</h3>
              </div>
              <button
                onClick={() => {
                  URL.revokeObjectURL(view.imageUrl);
                  setView(null);
                }}
                className="px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {view.date || "—"}
              </div>
              {view.description ? (
                <div
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: view.description }}
                />
              ) : null}
              {view.imageUrl ? (
                <img
                  src={view.imageUrl}
                  alt={view.title}
                  className="w-full h-80 object-contain rounded-lg border"
                />
              ) : (
                <div className="text-gray-500 text-sm">No image available.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
