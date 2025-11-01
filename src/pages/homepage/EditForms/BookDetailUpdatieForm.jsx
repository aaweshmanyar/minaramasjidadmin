import { useEffect, useState, useRef } from "react";
import { CalendarIcon, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../../component/Layout";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import "react-quill/dist/quill.snow.css";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import Quill from "quill";
import API_BASE_URL from "../../../../config";

/* ---------- Quill Fonts ---------- */
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

/* ---------- Quill Config ---------- */
const modules = {
  toolbar: [
    [
      {
        font: [
          "Amiri",
          "Rubik-Bold",
          "Rubik-Light",
          "Scheherazade-Regular",
          "Scheherazade-Bold",
          "Aslam",
          "Mehr-Nastaliq",
          "serif",
          "sans-serif",
          "monospace",
        ],
      },
      { size: [] },
    ],
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

const formats = [
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

/* ---------- Small UI helpers ---------- */
const Button = ({ children, className = "", variant = "", ...props }) => (
  <button
    type="button"
    className={`px-4 py-2 rounded-lg font-medium shadow-sm transition ${
      variant === "outline"
        ? "border bg-white hover:bg-gray-50"
        : "bg-gray-900 text-white hover:bg-black"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({
  id,
  placeholder,
  type = "text",
  value,
  onChange,
  name,
  required = false,
}) => (
  <input
    id={id}
    name={name}
    type={type}
    placeholder={placeholder}
    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none shadow-sm focus:ring-2 focus:ring-blue-300"
    value={value}
    onChange={onChange}
    required={required}
  />
);

const Label = ({ htmlFor, children, required = false, hint }) => (
  <div className="mb-1">
    <label htmlFor={htmlFor} className="block text-sm font-medium">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
);

const SelectEl = ({ value, onChange, name, children, required = false }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none shadow-sm focus:ring-2 focus:ring-blue-300"
    required={required}
  >
    {children}
  </select>
);

/* ---------- File upload with preview + same PDF progress logic ---------- */
const FileUpload = ({
  type,
  onChange,
  onRemove,
  progress,
  showSuccessMessage,
  required = false,
  initialPreviewUrl = null,
  labelOverride,
}) => {
  const [fileSelected, setFileSelected] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setPreviewUrl(initialPreviewUrl || null);
  }, [initialPreviewUrl]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileSelected(true);
      const file = e.target.files[0];
      setFileName(file.name);
      setFileSize(file.size);

      if (type === "image") {
        if (!file.type.match("image.*")) {
          alert("Please select an image file");
          if (inputRef.current) inputRef.current.value = "";
          setFileSelected(false);
          setFileName("");
          setFileSize(0);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFileSelected(false);
      setPreviewUrl(initialPreviewUrl || null);
      setFileName("");
      setFileSize(0);
    }
    onChange(e);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setFileSelected(false);
    setPreviewUrl(null);
    setFileName("");
    setFileSize(0);
    if (inputRef.current) inputRef.current.value = "";
    if (onRemove) onRemove();
  };

  const prettySize = (s) => {
    if (!s && s !== 0) return "";
    if (s < 1024) return `${s} B`;
    if (s < 1024 * 1024) return `${(s / 1024).toFixed(1)} KB`;
    return `${(s / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div>
      <label
        className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 hover:bg-gray-50 cursor-pointer transition"
        title="Click to select a file"
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={type === "image" ? "image/*" : ".pdf"}
            className="hidden"
            onChange={handleFileChange}
            required={required}
          />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {labelOverride
                ? labelOverride
                : type === "image"
                ? "Select cover image"
                : "Select PDF file"}
            </div>
            <div className="text-xs text-gray-500">
              {type === "image" ? "PNG/JPG up to 5MB" : "PDF up to 200MB"}
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
            Browse
          </span>
        </div>
      </label>

      {/* IMAGE preview + remove */}
      {type === "image" && previewUrl && (
        <div className="mt-3 relative inline-block">
          <div className="rounded-xl border border-gray-200 bg-white p-2 inline-block shadow-sm">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-56 rounded-md object-contain"
              style={{ maxWidth: "72vw" }}
            />
          </div>
          <button
            type="button"
            title="Remove image"
            className="absolute -right-2 -top-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50"
            onClick={handleRemoveImage}
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      )}

      {/* PDF filename + progress + success */}
      {type === "pdf" && fileSelected && (
        <div className="mt-3">
          <div className="text-sm">
            <span className="font-medium">{fileName || "Selected file"}</span>
            {fileSize ? (
              <span className="text-gray-500"> — {prettySize(fileSize)}</span>
            ) : null}
          </div>

          {progress > 0 && progress < 100 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${progress}%`, transition: "width 0.4s ease" }}
                />
              </div>
              <div className="text-center mt-1 text-sm text-gray-600">
                {`${Math.round(progress)}%`}
              </div>
            </div>
          )}

          {progress === 100 && showSuccessMessage && (
            <div className="text-green-600 text-sm mt-2">Upload Successful!</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Date helpers (avoid Invalid Date crashes) ---------- */
const isValidDateObj = (d) => d instanceof Date && !isNaN(d.getTime());

const parseAPIDate = (raw) => {
  if (!raw) return null;
  if (raw === "0000-00-00") return null;

  // Native parse first (handles ISO)
  let d = new Date(raw);
  if (isValidDateObj(d)) return d;

  // Normalize 31-10-2025 -> 2025-10-31
  const norm = String(raw).replace(/\./g, "-").replace(/\//g, "-");
  const m = norm.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isValidDateObj(d)) return d;
  }

  return null;
};

/* ===========================
   EDIT BOOK PAGE
=========================== */
export default function EditBookPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    translator: "",
    language: "",
    bookDate: null, // Date object
    status: "",
    category: "",
    isbn: "",
    isPublished: "true",
    coverImage: null, // file to replace
    attachment: null, // file to replace
  });

  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Existing files (for preview / info)
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState("");
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState("");

  const BOOKS_BASE = `${API_BASE_URL}/api/books`;

  /* ---------- Fetch lists + existing book ---------- */
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [langRes, transRes, bookRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/languages/language`),
          fetch(`${API_BASE_URL}/api/translators`),
          fetch(`${BOOKS_BASE}/${id}`),
        ]);

        if (!bookRes.ok) throw new Error("Failed to fetch book");

        const [langData, transData, book] = await Promise.all([
          langRes.ok ? langRes.json() : [],
          transRes.ok ? transRes.json() : [],
          bookRes.json(),
        ]);

        if (Array.isArray(langData)) setLanguages(langData);
        if (Array.isArray(transData)) setTranslators(transData);

        // Map book -> form state
        setFormData((prev) => ({
          ...prev,
          title: book.title || "",
          description: book.description || "",
          author: book.author || "",
          translator: book.translator || "",
          language: book.language || "",
          bookDate: parseAPIDate(book.bookDate),
          status: book.status || "",
          category: book.category || "",
          isbn: book.isbn || "",
          isPublished:
            typeof book.isPublished === "number"
              ? book.isPublished ? "true" : "false"
              : (book.isPublished ?? "false").toString(),
          coverImage: null,
          attachment: null,
        }));

        // File URLs (ensure your API supports these)
        setExistingCoverUrl(
          book.coverImageUrl || `${BOOKS_BASE}/cover/${id}`
        );
        setExistingAttachmentName(book.attachmentName || "");
        setExistingAttachmentUrl(
          book.attachmentUrl || `${BOOKS_BASE}/attachment/${id}`
        );
      } catch (err) {
        console.error("Error loading edit data:", err);
        Swal.fire("Error", "Failed to load book details", "error");
      }
    };

    loadAll();
  }, [id]);

  /* ---------- Validation ---------- */
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.language) newErrors.language = "Language is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------- Change Handlers ---------- */
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize =
      field === "coverImage" ? 5 * 1024 * 1024 : 200 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
      e.target.value = "";
      setErrors((prev) => ({
        ...prev,
        [field]: `File too large (max ${maxSize / (1024 * 1024)}MB)`,
      }));
      return;
    }

    // Selecting a new cover hides the existing preview
    if (field === "coverImage") {
      setExistingCoverUrl(null);
    }
    // Selecting a new PDF hides old name/url
    if (field === "attachment") {
      setExistingAttachmentName("");
      setExistingAttachmentUrl("");
      // Simulated progress for PDF
      let uploaded = 0;
      const totalSize = file.size;
      setUploadProgress(0);
      setShowSuccessMessage(false);

      const interval = setInterval(() => {
        uploaded += Math.random() * (totalSize / 80);
        const progress = Math.min((uploaded / totalSize) * 100, 100);
        setUploadProgress(progress);

        if (progress === 100) {
          clearInterval(interval);
          setTimeout(() => setShowSuccessMessage(true), 300);
        }
      }, 100);
    }

    setFormData((p) => ({ ...p, [field]: file }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleRemoveCoverImage = () => {
    setFormData((p) => ({ ...p, coverImage: null }));
    setExistingCoverUrl(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  /* ---------- Submit (PATCH) ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    Swal.fire({
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("isbn", formData.isbn || "");
    payload.append("description", formData.description || "");
    payload.append("author", formData.author || "");
    payload.append("translator", formData.translator || "");
    payload.append("language", formData.language || "");
    if (isValidDateObj(formData.bookDate)) {
      payload.append(
        "bookDate",
        formData.bookDate.toISOString().split("T")[0]
      );
    } else {
      payload.append("bookDate", "");
    }
    payload.append("status", formData.status || "");
    payload.append("category", formData.category || "");
    // normalize boolean -> string "true"/"false" or "1"/"0" per your API
    payload.append(
      "isPublished",
      formData.isPublished === "true" ? "1" : "0"
    );

    // Only send files if replacing
    if (formData.coverImage) payload.append("coverImage", formData.coverImage);
    if (formData.attachment) payload.append("attachment", formData.attachment);

    try {
      const res = await fetch(`${BOOKS_BASE}/${id}`, {
        method: "PATCH",
        body: payload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update book");
      }

      Swal.fire({
        icon: "success",
        title: "Book updated successfully!",
        showConfirmButton: false,
        timer: 1800,
      }).then(() => navigate("/booklist"));
    } catch (error) {
      console.error("Error updating book:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error updating book. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <Layout>
      {/* Editor & card tweaks */}
      <style>{`
        .rt-card .ql-toolbar {
          border: 1px solid #e5e7eb !important;
          border-bottom: 0 !important;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: #fff;
        }
        .rt-card .ql-container {
          border: 1px solid #e5e7eb !important;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          background: #fff;
        }
        .rt-card .ql-editor {
          min-height: 260px;
          font-size: 16px;
          line-height: 1.75;
          padding-bottom: 2.5rem;
        }
        .rt-card:focus-within .ql-toolbar,
        .rt-card:focus-within .ql-container {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 4px rgba(59,130,246,.15);
        }
      `}</style>

      <div className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
        {/* Header + Back button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
            <p className="text-sm text-gray-500 mt-1">
              Update details and files below.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/booklist")}>
            ← Back to list
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Book Info Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Book Info</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Basic metadata and files.
                </p>
              </div>

              <div>
                <Label htmlFor="coverImage" hint="PNG/JPG up to 5MB.">
                  Cover Image
                </Label>
                <FileUpload
                  type="image"
                  onChange={(e) => handleFileChange(e, "coverImage")}
                  onRemove={handleRemoveCoverImage}
                  progress={0}
                  showSuccessMessage={false}
                  required={false}
                  initialPreviewUrl={existingCoverUrl}
                  labelOverride="Replace cover image"
                />
                {errors.coverImage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.coverImage}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="attachment" hint="Optional. Replace PDF up to 200MB.">
                  Upload / Replace PDF
                </Label>

                {(existingAttachmentName || existingAttachmentUrl) && (
                  <div className="text-sm text-gray-700 mb-2">
                    Current file:{" "}
                    {existingAttachmentUrl ? (
                      <a
                        href={existingAttachmentUrl}
                        className="text-blue-600 underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {existingAttachmentName || "View current PDF"}
                      </a>
                    ) : (
                      <span>{existingAttachmentName}</span>
                    )}
                  </div>
                )}

                <FileUpload
                  type="pdf"
                  onChange={(e) => handleFileChange(e, "attachment")}
                  progress={uploadProgress}
                  showSuccessMessage={showSuccessMessage}
                  required={false}
                />
              </div>

              <div>
                <Label htmlFor="title" required>
                  Book Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <Label htmlFor="description" hint="Use the toolbar to format the content.">
                Book Description
              </Label>
              <div className="rt-card">
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) =>
                    setFormData({ ...formData, description: value })
                  }
                  modules={modules}
                  formats={formats}
                  className="bg-white"
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* People / Language Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-semibold">People & Language</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Who wrote it and in which language.
                </p>
              </div>

              <div>
                <Label htmlFor="author" required>
                  Author
                </Label>
                <Input
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
                {errors.author && (
                  <p className="text-red-500 text-xs mt-1">{errors.author}</p>
                )}
              </div>

              <div>
                <Label htmlFor="translator">Translator</Label>
                <SelectEl
                  name="translator"
                  value={formData.translator}
                  onChange={handleChange}
                >
                  <option value="">Select translator</option>
                  {translators.map((t) => (
                    <option key={t._id || t.id || t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </SelectEl>
              </div>

              <div>
                <Label htmlFor="language" required>
                  Language
                </Label>
                <SelectEl
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select language</option>
                  {languages.map((lang) => (
                    <option
                      key={lang._id || lang.id || lang.language}
                      value={lang.language}
                    >
                      {lang.language}
                    </option>
                  ))}
                </SelectEl>
                {errors.language && (
                  <p className="text-red-500 text-xs mt-1">{errors.language}</p>
                )}
              </div>
            </div>

            {/* Publishing Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Publishing</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Status, date, and visibility.
                </p>
              </div>

              <div>
                <Label htmlFor="bookDate">Publication Date</Label>
                <div className="relative">
                  <DatePicker
                    selected={isValidDateObj(formData.bookDate) ? formData.bookDate : null}
                    onChange={(date) => setFormData({ ...formData, bookDate: date })}
                    dateFormat="yyyy-MM-dd"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white outline-none shadow-sm focus:ring-2 focus:ring-blue-300"
                    placeholderText="Select date"
                    maxDate={new Date()}
                    isClearable
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <SelectEl
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="">Select status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </SelectEl>
                </div>

                <div>
                  <Label htmlFor="isPublished">Publish?</Label>
                  <SelectEl
                    name="isPublished"
                    value={formData.isPublished}
                    onChange={handleChange}
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </SelectEl>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white font-semibold shadow-sm disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Book"
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
