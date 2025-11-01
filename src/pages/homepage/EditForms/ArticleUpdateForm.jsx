import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import {
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Type,
  FileText,
  Users,
  Globe,
  Hash,
  X,
} from "lucide-react";
import API_BASE_URL from "../../../../config";

/* ---------- Quill font whitelist (match Add Article) ---------- */
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

/* ---------- Quill Config (match Add Article) ---------- */
const quillModules = {
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

const quillFormats = [
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

const getYMD = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export default function EditArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ---------- Reference lists ---------- */
  const [topics, setTopics] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [writers, setWriters] = useState([]);
  const [tags, setTags] = useState([]);

  /* ---------- Meta / selects ---------- */
  const [publicationDate, setPublicationDate] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [writerDesignation, setWriterDesignation] = useState("");

  /* custom writer toggle (parity with Add) */
  const [showCustomWriterInput, setShowCustomWriterInput] = useState(false);
  const [customWriterName, setCustomWriterName] = useState("");

  /* ---------- Image ---------- */
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const fileInputRef = useRef(null);

  /* ---------- Upload progress (during submit) ---------- */
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ---------- Titles & content ---------- */
  const [articleTitle, setArticleTitle] = useState("");

  const [englishTitle, setEnglishTitle] = useState("");
  const [englishDescription, setEnglishDescription] = useState("");

  const [urduTitle, setUrduTitle] = useState("");
  const [urduDescription, setUrduDescription] = useState("");

  const [romanTitle, setRomanTitle] = useState("");
  const [romanDescription, setRomanDescription] = useState("");

  const [hindiTitle, setHindiTitle] = useState("");
  const [hindiDescription, setHindiDescription] = useState("");

  const [loading, setLoading] = useState(true);

  /* ---------- Load lookups + article ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [topicsRes, languagesRes, translatorsRes, writersRes, tagsRes] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/api/topics`),
            axios.get(`${API_BASE_URL}/api/languages/language`),
            axios.get(`${API_BASE_URL}/api/translators`),
            axios.get(`${API_BASE_URL}/api/writers`),
            axios.get(`${API_BASE_URL}/api/tags`),
          ]);

        setTopics(topicsRes.data || []);
        setLanguages(languagesRes.data || []);
        setTranslators(translatorsRes.data || []);
        setWriters(writersRes.data || []);
        setTags(tagsRes.data || []);

        // Fetch article
        const artRes = await axios.get(`https://api.minaramasjid.com/api/articles/${id}`);
        const a = artRes.data || {};

        // Core
        setArticleTitle(a.title || "");
        setSelectedTopic(a.topic || "");
        setSelectedWriter(a.writers || "");
        setWriterDesignation(a.writerDesignation || "");
        setSelectedLanguage(a.language || "");
        setPublicationDate(getYMD(a.date) || "");
        setSelectedTranslator(a.translator || "");
        setSelectedTag(a.tags || "");

        // Language fields
        setEnglishTitle(a.englishTitle || "");
        setEnglishDescription(a.englishDescription || "");
        setUrduTitle(a.urduTitle || "");
        setUrduDescription(a.urduDescription || "");
        setRomanTitle(a.romanUrduTitle || "");
        setRomanDescription(a.romanUrduDescription || "");
        setHindiTitle(a.hindiTitle || "");
        setHindiDescription(a.hindiDescription || "");

        // If writer is not in list -> treat as custom
        const knownWriter = (writersRes.data || []).some(
          (w) => w.name === (a.writers || "")
        );
        if (!knownWriter && a.writers) {
          setShowCustomWriterInput(true);
          setCustomWriterName(a.writers);
        }

        // Image preview from server if exists
        // (adjust to your backend route if different)
        const imgUrl = `${API_BASE_URL}/api/articles/image/${id}?ts=${Date.now()}`;
        const tester = new Image();
        tester.onload = () => setUploadedImageURL(imgUrl);
        tester.onerror = () => setUploadedImageURL(null);
        tester.src = imgUrl;
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load article / lookups", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ---------- Image select/preview ---------- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File too large",
        text: "Please select an image smaller than 5MB",
      });
      return;
    }
    if (!file.type.match(/^image\//)) {
      Swal.fire({
        icon: "error",
        title: "Invalid file",
        text: "Please select an image file",
      });
      return;
    }

    setUploadedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImageURL(reader.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImageFile(null);
    setUploadedImageURL(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------- Validation ---------- */
  const validateForm = () => {
    const required = [
      { value: articleTitle, name: "Article Title" },
      { value: selectedTopic, name: "Topic" },
      { value: showCustomWriterInput ? customWriterName : selectedWriter, name: "Writer" },
      { value: selectedLanguage, name: "Language" },
      { value: publicationDate, name: "Publication Date" },
    ];
    const missing = required.filter((f) => !f.value);
    if (missing.length) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        html: `Please fill:<br><br>${missing
          .map((m) => `• ${m.name}`)
          .join("<br>")}`,
      });
      return false;
    }
    return true;
  };

  /* ---------- Update (Save/Publish) ---------- */
  const handleUpdate = async (publish) => {
    if (!validateForm()) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      if (uploadedImageFile) formData.append("image", uploadedImageFile);

      // Core
      formData.append("title", articleTitle);
      formData.append("topic", selectedTopic);
      formData.append(
        "writers",
        showCustomWriterInput ? customWriterName : selectedWriter
      );
      formData.append("writerDesignation", writerDesignation || "");
      formData.append("language", selectedLanguage);
      formData.append("date", publicationDate);
      formData.append("isPublished", publish);

      // Language payloads
      formData.append("englishTitle", englishTitle || "");
      formData.append("englishDescription", englishDescription || "");

      formData.append("urduTitle", urduTitle || "");
      formData.append("urduDescription", urduDescription || "");

      formData.append("romanUrduTitle", romanTitle || "");
      formData.append("romanUrduDescription", romanDescription || "");

      formData.append("hindiTitle", hindiTitle || "");
      formData.append("hindiDescription", hindiDescription || "");

      // Optional
      if (selectedTranslator) formData.append("translator", selectedTranslator);
      if (selectedTag) formData.append("tags", selectedTag);

      await axios.patch(`${API_BASE_URL}/api/articles/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded * 100) / evt.total);
          setUploadProgress(percent);
        },
      });

      setIsUploading(false);
      setUploadProgress(100);

      Swal.fire({
        icon: "success",
        title: publish ? "Updated & Published!" : "Draft Updated",
        timer: 1600,
        showConfirmButton: false,
      }).then(() => navigate("/viewarticle"));
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong.",
      });
    }
  };

  /* ---------- Options ---------- */
  const tagOptions = (tags || []).map((t) => ({ value: t.tag, label: t.tag }));
  const topicOptions = (topics || []).map((t) => ({
    value: t.topic,
    label: t.topic,
  }));

  return (
    <Layout>
      {/* Scoped styling identical to Add page */}
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

      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Edit Article
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Keep structure in sync with Create Article.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-sm px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>

          {loading ? (
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              Loading…
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT: Content Workspace */}
              <div className="lg:col-span-2 space-y-8">
                {/* Featured Image */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <label className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Featured Image
                  </label>

                  <div
                    className="mt-2 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:bg-gray-50 transition relative"
                    onClick={(e) => {
                      if (e.target.closest?.(".btn-remove-image")) return;
                      fileInputRef.current?.click();
                    }}
                  >
                    {uploadedImageURL ? (
                      <div className="relative inline-block">
                        <img
                          src={uploadedImageURL}
                          alt="Preview"
                          className="mx-auto w-64 h-64 object-cover rounded-xl shadow"
                        />

                        {/* Remove image (only clears local selection/preview) */}
                        <button
                          type="button"
                          title="Remove image"
                          className="btn-remove-image absolute -right-3 -top-3 bg-white/90 border border-gray-300 rounded-full p-1 shadow hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearImage();
                          }}
                        >
                          <X className="w-4 h-4 text-gray-700" />
                        </button>

                        {isUploading && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex flex-col justify-end">
                            <div className="px-4 pb-4 text-white text-sm">
                              <div className="mb-2 flex items-center justify-between">
                                <span>Uploading…</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-white rounded-full transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="text-base">
                          Drop your image here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                        <button
                          type="button"
                          className="mt-4 px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                          Browse Files
                        </button>

                        {isUploading && (
                          <div className="mt-6 w-full max-w-sm text-left">
                            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                              <span>Uploading…</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-gray-600 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </section>

                {/* Article Title */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Type className="w-4 h-4" />
                    <label className="text-sm font-medium">Article Title</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter main article title"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    required
                  />
                </section>

                {/* Language Blocks */}
                <section className="space-y-8">
                  {/* English */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" />
                      <h2 className="text-sm font-semibold">English</h2>
                    </div>
                    <div className="grid gap-4">
                      <input
                        type="text"
                        placeholder="English Title"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={englishTitle}
                        onChange={(e) => setEnglishTitle(e.target.value)}
                      />
                      <div className="rt-card">
                        <ReactQuill
                          theme="snow"
                          value={englishDescription}
                          onChange={setEnglishDescription}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                          style={{ direction: "ltr", textAlign: "left" }}
                          placeholder="Write English content..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Urdu */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" />
                      <h2 className="text-sm font-semibold">Urdu</h2>
                    </div>
                    <div className="grid gap-4">
                      <input
                        type="text"
                        placeholder="Urdu Title"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={urduTitle}
                        onChange={(e) => setUrduTitle(e.target.value)}
                      />
                      <div className="rt-card">
                        <ReactQuill
                          theme="snow"
                          value={urduDescription}
                          onChange={setUrduDescription}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                          style={{ direction: "rtl", textAlign: "right" }}
                          placeholder="اردو متن تحریر کریں..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Roman Urdu */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" />
                      <h2 className="text-sm font-semibold">Roman Urdu</h2>
                    </div>
                    <div className="grid gap-4">
                      <input
                        type="text"
                        placeholder="Roman Urdu Title"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={romanTitle}
                        onChange={(e) => setRomanTitle(e.target.value)}
                      />
                      <div className="rt-card">
                        <ReactQuill
                          theme="snow"
                          value={romanDescription}
                          onChange={setRomanDescription}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                          style={{ direction: "ltr", textAlign: "left" }}
                          placeholder="Roman Urdu content..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hindi */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4" />
                      <h2 className="text-sm font-semibold">Hindi</h2>
                    </div>
                    <div className="grid gap-4">
                      <input
                        type="text"
                        placeholder="Hindi Title"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={hindiTitle}
                        onChange={(e) => setHindiTitle(e.target.value)}
                      />
                      <div className="rt-card">
                        <ReactQuill
                          theme="snow"
                          value={hindiDescription}
                          onChange={setHindiDescription}
                          modules={quillModules}
                          formats={quillFormats}
                          className="bg-white"
                          style={{ direction: "ltr", textAlign: "left" }}
                          placeholder="हिंदी सामग्री लिखें..."
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT: Article Settings */}
              <aside className="space-y-6">
                {/* Topic */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" />
                    <label className="text-sm font-medium">Topic</label>
                  </div>
                  <Select
                    options={topicOptions}
                    value={
                      topicOptions.find((o) => o.value === selectedTopic) || null
                    }
                    onChange={(opt) => setSelectedTopic(opt?.value || "")}
                    placeholder="Select a topic..."
                    isSearchable
                    className="text-sm"
                  />
                </div>

                {/* Language */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4" />
                    <label className="text-sm font-medium">
                      Primary Language
                    </label>
                  </div>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  >
                    <option value="">Select a language</option>
                    {languages.map((l) => (
                      <option key={l.id || l._id || l.language} value={l.language}>
                        {l.language}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Writer */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">Writer</label>
                  </div>
                  <select
                    value={showCustomWriterInput ? "custom" : selectedWriter}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setShowCustomWriterInput(true);
                        setSelectedWriter("");
                        setWriterDesignation("");
                        setCustomWriterName(customWriterName || "");
                      } else {
                        setShowCustomWriterInput(false);
                        setCustomWriterName("");
                        setSelectedWriter(e.target.value);
                        const sel = writers.find(
                          (w) => w.name === e.target.value
                        );
                        setWriterDesignation(sel?.designation || "");
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  >
                    <option value="">Select a writer</option>
                    {writers.map((w) => (
                      <option key={w.id || w._id || w.name} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Writer</option>
                  </select>

                  {showCustomWriterInput && (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Custom writer name"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                        value={customWriterName}
                        onChange={(e) => {
                          setCustomWriterName(e.target.value);
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          setShowCustomWriterInput(false);
                          setSelectedWriter("");
                          setCustomWriterName("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Writer Designation (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Senior Scholar, Editor"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                      value={writerDesignation}
                      onChange={(e) => setWriterDesignation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Translator */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">
                      Translator (optional)
                    </label>
                  </div>
                  <select
                    value={selectedTranslator}
                    onChange={(e) => setSelectedTranslator(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Select a translator</option>
                    {translators.map((t) => (
                      <option key={t.id || t._id || t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-4 h-4" />
                    <label className="text-sm font-medium">Tags</label>
                  </div>
                  <Select
                    options={tagOptions}
                    value={
                      tagOptions.find((o) => o.value === selectedTag) || null
                    }
                    onChange={(opt) => setSelectedTag(opt?.value || "")}
                    placeholder="Select a tag..."
                    isSearchable
                    className="text-sm"
                  />
                </div>

                {/* Publication Date */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-4 h-4" />
                    <label className="text-sm font-medium">
                      Publication Date
                    </label>
                  </div>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="w-1/2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-xl font-medium transition shadow-sm disabled:opacity-60"
                      onClick={() => handleUpdate(false)}
                      disabled={isUploading}
                    >
                      Update as Draft
                    </button>
                    <button
                      type="button"
                      className="w-1/2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white px-4 py-3 rounded-xl font-semibold transition shadow-sm disabled:opacity-60"
                      onClick={() => handleUpdate(true)}
                      disabled={isUploading}
                    >
                      Update & Publish
                    </button>
                  </div>
                  {isUploading && (
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      Please wait—upload in progress…
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
