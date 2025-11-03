import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../../component/Layout";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import Swal from "sweetalert2";
import { CornerUpLeft, ImagePlus, Trash2 } from "lucide-react";

// Backend base URL
const API_BASE_URL = "https://minaramasjid-backend.onrender.com";

const quillModules = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["clean"],
  ],
};

export default function CreateGallery() {
  const navigate = useNavigate();
  const { id } = useParams(); // gallery ID when editing (from "galleries" table)
  const isEdit = Boolean(id);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [files, setFiles] = useState([]); // new files to upload
  const [existingImages, setExistingImages] = useState([]); // images already in DB (gallery_images rows)
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  // Friendly file count
  const filesInfo = useMemo(() => {
    if (!files.length && !existingImages.length) return "No files uploaded yet.";
    const total = files.length + existingImages.length;
    return `${total} file${total > 1 ? "s" : ""} selected/attached.`;
  }, [files, existingImages]);

  // ------- File picking & drag/drop -------
  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    addFiles(picked);
  };

  const addFiles = (picked) => {
    const combined = [...files, ...picked].slice(0, 50);
    setFiles(combined);
  };

  const onDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    addFiles(dropped);
  };
  const onDragOver = (e) => e.preventDefault();

  // Remove a newly added (not yet uploaded) file
  const removeAt = (idx) => {
    const clone = [...files];
    clone.splice(idx, 1);
    setFiles(clone);
  };

  // Remove an existing DB image immediately (calls API)
  const removeExisting = async (imageId) => {
    const confirm = await Swal.fire({
      title: "Remove this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/galleries/image/${imageId}`);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      Swal.fire({ icon: "success", title: "Image removed", timer: 900, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire("Error", e.response?.data?.message || "Failed to remove image.", "error");
    }
  };

  // ------- Prefill when editing -------
  useEffect(() => {
    if (!isEdit) return;
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE_URL}/api/galleries/${id}`);
        // data: { id, title, description, eventDate, images: [{id,imageName,imageType,sort_order,...}] }
        if (!data) {
          Swal.fire("Error", "Gallery not found.", "error");
          navigate("/gallery");
          return;
        }
        setTitle(data.title || "");
        setDescription(data.description || "");
        setEventDate(data.eventDate || "");
        setExistingImages(Array.isArray(data.images) ? data.images : []);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load gallery.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [id, isEdit, navigate]);

  // ------- Validation -------
  const validate = () => {
    if (!title.trim()) return "Gallery Title is required.";
    if (!eventDate) return "Event Date is required.";
    if (!isEdit && !files.length) return "Please add at least one image (max 50).";
    return null;
  };

  // ------- Submit -------
  const submit = async () => {
    const err = validate();
    if (err) {
      Swal.fire("Missing fields", err, "warning");
      return;
    }

    Swal.fire({
      title: isEdit ? "Updating Gallery..." : "Creating Gallery...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      if (isEdit) {
        // 1) Update meta (JSON)
        await axios.put(`${API_BASE_URL}/api/galleries/${id}`, {
          title: title.trim(),
          description: description || "",
          date: eventDate,
        });

        // 2) If there are new files, upload them
        if (files.length) {
          const fd = new FormData();
          files.forEach((f) => fd.append("images", f));
          await axios.post(`${API_BASE_URL}/api/galleries/${id}/images`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        Swal.fire({
          icon: "success",
          title: "Gallery updated successfully!",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => navigate("/gallery"));
      } else {
        // Create new (meta + images together)
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description || "");
        fd.append("date", eventDate);
        files.forEach((f) => fd.append("images", f));

        await axios.post(`${API_BASE_URL}/api/galleries`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Swal.fire({
          icon: "success",
          title: "Gallery created successfully!",
          timer: 1400,
          showConfirmButton: false,
        }).then(() => navigate("/gallery"));
      }
    } catch (e) {
      console.error("Gallery save error:", e);
      Swal.fire(
        "Error",
        e.response?.data?.message ||
          (isEdit ? "Failed to update gallery." : "Failed to create gallery."),
        "error"
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-16 text-gray-500 text-lg">Loading gallery data...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/gallery")}
            className="inline-flex items-center gap-2 text-emerald-700 hover:underline"
          >
            <CornerUpLeft className="w-4 h-4" />
            Back to List
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">
            {isEdit ? "Edit Gallery" : "Create Gallery"}
          </h1>

          {/* Title */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">
              Gallery Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter gallery title"
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">Gallery Description</label>
            <div className="rounded-xl overflow-hidden border">
              <ReactQuill
                value={description}
                onChange={setDescription}
                modules={quillModules}
                className="bg-white"
              />
            </div>
          </div>

          {/* Event Date */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">
              Event Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>

          {/* Existing Images (edit mode) */}
          {isEdit && existingImages.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Existing Images</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative border rounded-xl overflow-hidden group"
                  >
                    <img
                      src={`${API_BASE_URL}/api/galleries/image/${img.id}`}
                      alt={img.imageName || "gallery image"}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(img.id)}
                      className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition inline-flex items-center gap-1"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              {isEdit ? "Add New Images" : "Gallery Images"}{" "}
              {!isEdit && <span className="text-red-500">*</span>}
            </label>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <ImagePlus className="w-8 h-8 text-gray-400" />
                <div className="text-sm">
                  <span className="font-medium">
                    Drop your file(s) here, or click to browse
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Upload all images for this gallery (Max 50 files)
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickFiles}
              />
            </div>

            {/* File Info */}
            <div className="text-center text-sm text-gray-500 mt-3">{filesInfo}</div>

            {/* New File List */}
            {!!files.length && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="border rounded-xl p-2 text-xs flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      className="text-rose-600 hover:underline shrink-0"
                      onClick={() => removeAt(i)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => navigate("/gallery")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={submit}
            >
              {isEdit ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
