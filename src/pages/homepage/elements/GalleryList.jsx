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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../../config";

/* --------------------------
   Helpers
--------------------------- */
const stripHtml = (html) => String(html || "").replace(/<[^>]*>?/gm, "");
const coverUrl = (imageId) =>
  imageId ? `${API_BASE_URL}/api/galleries/image/${imageId}` : "";

/* =========================================================
   Component
========================================================= */
export default function GalleryList() {
  const navigate = useNavigate();

  const [galleries, setGalleries] = useState([]); // [{id,title,description,eventDate}]
  const [imagesByGallery, setImagesByGallery] = useState({}); // { [galleryId]: [{id,...}] }
  const [loading, setLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);

  // search + column filters
  const [q, setQ] = useState("");
  const [f, setF] = useState({ id: "", title: "", description: "", date: "" });

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // view modal state
  const [viewer, setViewer] = useState(null); // { id, title, date, description, images: [], index }

  /* ----------------------------
     Fetch galleries (meta list)
  ----------------------------- */
  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/galleries`);
      const rows = Array.isArray(data) ? data : [];
      // normalize
      const normalized = rows.map((g) => ({
        id: g.id,
        title: g.title || "",
        description: g.description || "",
        eventDate: g.eventDate || "",
        created_at: g.created_at,
      }));
      setGalleries(normalized);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Unable to load galleries.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------
     Fetch images for all galleries (covers, etc.)
     (Do it after meta is loaded; safe for small lists)
  ---------------------------------------------- */
  const fetchAllImages = async (rows) => {
    setLoadingImages(true);
    try {
      const map = {};
      await Promise.all(
        rows.map(async (g) => {
          try {
            const { data } = await axios.get(
              `${API_BASE_URL}/api/galleries/${g.id}`
            );
            map[g.id] = Array.isArray(data.images) ? data.images : [];
          } catch (e) {
            map[g.id] = [];
          }
        })
      );
      setImagesByGallery(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchGalleries();
    })();
  }, []);

  // when galleries change, fetch their images
  useEffect(() => {
    if (!galleries.length) return;
    fetchAllImages(galleries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleries.length]);

  /* ----------------------------
     Delete a gallery
  ----------------------------- */
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
      // refresh both meta + images
      await fetchGalleries();
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to delete gallery.", "error");
    }
  };

  /* ----------------------------
     Open viewer modal
  ----------------------------- */
  const onView = (row) => {
    const imgs = imagesByGallery[row.id] || [];
    setViewer({
      id: row.id,
      title: row.title,
      date: row.eventDate,
      description: row.description,
      images: imgs,
      index: 0,
    });
  };

  const closeViewer = () => setViewer(null);

  const nextImage = () =>
    setViewer((v) =>
      !v || !v.images?.length
        ? v
        : { ...v, index: (v.index + 1) % v.images.length }
    );

  const prevImage = () =>
    setViewer((v) =>
      !v || !v.images?.length
        ? v
        : { ...v, index: (v.index - 1 + v.images.length) % v.images.length }
    );

  const jumpTo = (i) =>
    setViewer((v) => (!v ? v : { ...v, index: Math.max(0, Math.min(i, v.images.length - 1)) }));

  /* ----------------------------
     Filtering + pagination
  ----------------------------- */
  const filtered = useMemo(() => {
    const norm = (s) => String(s || "").toLowerCase();

    let rows = [...galleries];

    if (q.trim()) {
      const needle = norm(q);
      rows = rows.filter(
        (r) =>
          norm(r.title).includes(needle) ||
          norm(stripHtml(r.description)).includes(needle) ||
          norm(r.eventDate).includes(needle) ||
          String(r.id).includes(needle)
      );
    }

    if (f.id) rows = rows.filter((r) => String(r.id).includes(f.id.trim()));
    if (f.title) rows = rows.filter((r) => norm(r.title).includes(norm(f.title)));
    if (f.description)
      rows = rows.filter((r) =>
        norm(stripHtml(r.description)).includes(norm(f.description))
      );
    if (f.date) rows = rows.filter((r) => norm(r.eventDate).includes(norm(f.date)));

    return rows;
  }, [galleries, q, f]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filtered.length, totalPages, page]);

  /* ----------------------------
     Render
  ----------------------------- */
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
            <p className="text-sm text-gray-500">
              Manage and preview all gallery entries.
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

        {/* Search + Filters Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Global search..."
                  className="w-full pl-10 pr-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <input
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Filter by ID..."
                value={f.id}
                onChange={(e) => setF({ ...f, id: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Filter by Title..."
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Filter by Date (YYYY-MM-DD)..."
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
            </div>
          </div>

          {/* Loading state */}
          {(loading || loadingImages) && (
            <div className="px-4 py-3 text-sm text-gray-500">
              {loading ? "Loading galleries..." : "Loading images..."}
            </div>
          )}

          {/* Cards Grid */}
          <div className="p-4">
            {(!loading && !filtered.length) ? (
              <div className="text-center text-gray-500 py-12">No entries found.</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {pageRows.map((row) => {
                  const imgs = imagesByGallery[row.id] || [];
                  const firstId = imgs[0]?.id;
                  const imgSrc = coverUrl(firstId);
                  const count = imgs.length;

                  return (
                    <div
                      key={row.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Cover */}
                      <div className="relative aspect-[16/10] bg-gray-50">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={row.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No Image
                          </div>
                        )}
                        <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-black/60 text-white flex items-center gap-1">
                          <Images className="w-3.5 h-3.5" />
                          {count}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold line-clamp-1">{row.title}</h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {row.eventDate || "—"}
                          </span>
                        </div>
                        {row.description ? (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {stripHtml(row.description)}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-400">No description.</p>
                        )}
                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-between">
                          <button
                            title="View"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-gray-50"
                            onClick={() => onView(row)}
                          >
                            <Eye className="w-4 h-4 text-emerald-700" />
                            <span className="text-sm">View</span>
                          </button>
                          <div className="flex items-center gap-1.5">
                            <button
                              title="Edit"
                              className="p-2 rounded-lg hover:bg-gray-100"
                              onClick={() => navigate(`/gallery/${row.id}/edit`)}
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          <div className="flex items-center justify-between p-4 text-sm text-gray-600 border-t">
            <div>
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
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

      {/* Viewer Modal */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Images className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-lg leading-tight">{viewer.title}</h3>
                  <div className="text-xs text-gray-500">{viewer.date || "—"}</div>
                </div>
              </div>
              <button
                onClick={closeViewer}
                className="px-3 py-1 rounded-lg border hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {/* Description */}
              {viewer.description ? (
                <div
                  className="prose max-w-none text-sm mb-3"
                  dangerouslySetInnerHTML={{ __html: viewer.description }}
                />
              ) : null}

              {/* Main image area */}
              <div className="relative bg-gray-50 rounded-xl border overflow-hidden">
                <div className="aspect-[16/9] w-full flex items-center justify-center">
                  {viewer.images?.length ? (
                    <img
                      src={coverUrl(viewer.images[viewer.index]?.id)}
                      alt={viewer.images[viewer.index]?.imageName || ""}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">No images.</div>
                  )}
                </div>

                {/* Prev/Next */}
                {viewer.images?.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                      title="Previous"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                      title="Next"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {viewer.images?.length > 1 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {viewer.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => jumpTo(i)}
                      className={`relative aspect-square rounded-lg overflow-hidden border ${i === viewer.index ? "ring-2 ring-emerald-500" : ""
                        }`}
                      title={img.imageName || `Image ${i + 1}`}
                    >
                      <img
                        src={coverUrl(img.id)}
                        alt={img.imageName || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
