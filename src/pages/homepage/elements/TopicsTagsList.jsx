import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import { PlusCircle, Eye, Pencil, Trash2, Search as SearchIcon, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../../config";

export default function TopicsTagsList() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // global search
  const [q, setQ] = useState("");

  // column filters (as in the screenshot)
  const [f, setF] = useState({
    id: "",
    title: "",
    tags: "",
  });

  // pagination (client-side), footer like: Previous | 1 | Next
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/topics`);
      // normalize
      const list = (Array.isArray(data) ? data : []).map((t, i) => ({
        id: t.id ?? t._id ?? i + 1,
        title: t.title || t.topic || "",
        tags: Array.isArray(t.tags) ? t.tags : Array.isArray(t.relatedTags) ? t.relatedTags : [],
        category: t.category || "",
        description: t.description || "",
      }));
      setRows(list);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Unable to load topics.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); // eslint-disable-next-line
  }, []);

  const norm = (s) => String(s || "").toLowerCase();

  const filtered = useMemo(() => {
    let out = [...rows];

    if (q.trim()) {
      const needle = norm(q);
      out = out.filter(
        (r) =>
          norm(r.id).includes(needle) ||
          norm(r.title).includes(needle) ||
          norm(r.tags.join(" ")).includes(needle)
      );
    }

    if (f.id) out = out.filter((r) => norm(r.id).includes(norm(f.id)));
    if (f.title) out = out.filter((r) => norm(r.title).includes(norm(f.title)));
    if (f.tags) out = out.filter((r) => norm(r.tags.join(" ")).includes(norm(f.tags)));

    return out;
  }, [rows, q, f]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages, page]);

  // VIEW modal
  const [viewRow, setViewRow] = useState(null);

  const onDelete = async (row) => {
    const go = await Swal.fire({
      icon: "warning",
      title: "Delete topic?",
      text: `This will remove "${row.title}".`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#ef4444",
    }).then((r) => r.isConfirmed);
    if (!go) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/topics/${row.id}`);
      Swal.fire("Deleted", "Topic deleted.", "success");
      fetchData();
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete topic.", "error");
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Topics &amp; Tags</h1>
            <p className="text-sm text-gray-500">Manage entries in the Topics &amp; Tags section.</p>
          </div>
          <button
            onClick={() => navigate("/createtopictags")}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Topics
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Global search */}
          <div className="p-4 border-b">
            <div className="relative">
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search across all visible fields..."
                className="w-full pl-10 pr-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left font-semibold p-3 w-24">ID</th>
                  <th className="text-left font-semibold p-3">Topic Title</th>
                  <th className="text-left font-semibold p-3">Related Tags</th>
                  <th className="text-right font-semibold p-3 w-56">Actions</th>
                </tr>
                {/* filter row */}
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
                      placeholder="Search Topic Title..."
                      value={f.title}
                      onChange={(e) => setF({ ...f, title: e.target.value })}
                    />
                  </th>
                  <th className="p-2">
                    <input
                      className="w-full border rounded-lg px-2 py-1"
                      placeholder="Search Related Tags..."
                      value={f.tags}
                      onChange={(e) => setF({ ...f, tags: e.target.value })}
                    />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={4}>
                      Loading…
                    </td>
                  </tr>
                ) : pageRows.length ? (
                  pageRows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">{r.id}</td>
                      <td className="p-3">{r.title}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          {(r.tags || []).map((t, i) => (
                            <span
                              key={`${t}-${i}`}
                              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            title="View"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => setViewRow(r)}
                          >
                            <Eye className="w-5 h-5 text-emerald-700" />
                          </button>
                          <button
                            title="Edit"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => navigate(`/topics/${r.id}/edit`)}
                          >
                            <Pencil className="w-5 h-5 text-indigo-600" />
                          </button>
                          <button
                            title="Delete"
                            className="p-2 rounded-lg hover:bg-gray-100"
                            onClick={() => onDelete(r)}
                          >
                            <Trash2 className="w-5 h-5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={4}>
                      No entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between p-4 text-sm text-gray-600">
            <div>
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} of {filtered.length} entries
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

      {/* View modal (listing also displays view) */}
      {viewRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-lg overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Topic Details</h3>
              <button
                onClick={() => setViewRow(null)}
                className="px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm">
                <span className="font-medium text-gray-600">Title: </span>
                {viewRow.title}
              </div>
              {viewRow.category ? (
                <div className="text-sm">
                  <span className="font-medium text-gray-600">Category: </span>
                  {viewRow.category}
                </div>
              ) : null}
              <div className="text-sm">
                <span className="font-medium text-gray-600">Related Tags:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(viewRow.tags || []).map((t, i) => (
                    <span
                      key={`${t}-${i}`}
                      className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {t}
                    </span>
                  ))}
                  {!viewRow.tags?.length && <span className="text-gray-500">None</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
