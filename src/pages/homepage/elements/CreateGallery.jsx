import React, { useMemo, useRef, useState } from "react";
import Layout from "../../../component/Layout";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import Swal from "sweetalert2";
import { CornerUpLeft, ImagePlus } from "lucide-react";
import API_BASE_URL from "../../../../config";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(() => {
    // format yyyy-mm-dd for input[type=date]; screenshot shows dd-mm-yyyy, but backend usually prefers ISO
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [files, setFiles] = useState([]); // File[]
  const inputRef = useRef(null);

  const filesInfo = useMemo(() => {
    if (!files.length) return "No files uploaded yet.";
    if (files.length === 1) return files[0].name;
    return `${files.length} files selected.`;
  }, [files]);

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    addFiles(picked);
  };

  const addFiles = (picked) => {
    const combined = [...files, ...picked].slice(0, 50); // max 50
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

  const removeAt = (idx) => {
    const clone = [...files];
    clone.splice(idx, 1);
    setFiles(clone);
  };

  const validate = () => {
    if (!title.trim()) return "Gallery Title is required.";
    if (!eventDate) return "Event Date is required.";
    if (!files.length) return "Please add at least one image (max 50).";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Swal.fire("Missing fields", err, "warning");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description || "");
    fd.append("date", eventDate);
    files.forEach((f) => fd.append("images", f));

    Swal.fire({
      title: "Creating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await axios.post(`${API_BASE_URL}/api/galleries`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        icon: "success",
        title: "Gallery created!",
        timer: 1400,
        showConfirmButton: false,
      }).then(() => navigate("/galleries"));
    } catch (e) {
      console.error(e);
      Swal.fire("Error", e.response?.data?.message || "Failed to create.", "error");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/gallery")}
            className="inline-flex items-center gap-2 text-emerald-700 hover:underline"
          >
            <CornerUpLeft className="w-4 h-4" />
            Back to List
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Create Gallery</h1>

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

          {/* Description (simple Quill bar) */}
          <div className="mb-5">
            <label className="block text-sm font-medium mb-1">
              Gallery Description
            </label>
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

          {/* Gallery Images (dropzone) */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-2">
              Gallery Images <span className="text-red-500">*</span>
            </label>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition"
              onClick={() => inputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2">
                <ImagePlus className="w-8 h-8 text-gray-400" />
                <div className="text-sm">
                  <span className="font-medium">Drop your file(s) here, or click to browse</span>
                </div>
                <div className="text-xs text-gray-500">
                  Upload all images for this gallery. (Max 50 files)
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

            {/* Files footer line like screenshot */}
            <div className="text-center text-sm text-gray-500 mt-3">
              {filesInfo}
            </div>

            {/* Small preview list (optional, neat) */}
            {!!files.length && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
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

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => navigate("/galleries")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={submit}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
