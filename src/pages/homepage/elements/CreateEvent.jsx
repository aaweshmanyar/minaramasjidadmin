import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, Image as ImageIcon, Type, FileText, Users, Globe, Hash, X } from "lucide-react";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function CreateEvent() {
  const navigate = useNavigate();

  /* ---------- Meta / selects ---------- */
  const [publicationDate, setPublicationDate] = useState(getCurrentDate());
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const [topics, setTopics] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [writers, setWriters] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");

  /* ---------- Required event fields ---------- */
  const [eventTitle, setEventTitle] = useState("");
  const [venue, setVenue] = useState(""); // Location/Venue*
  const [writerDesignation, setWriterDesignation] = useState("");

  /* ---------- Image ---------- */
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ---------- 4x Language sections (Title + Description) ---------- */
  const [englishTitle, setEnglishTitle] = useState("");
  const [englishDescription, setEnglishDescription] = useState("");

  const [urduTitle, setUrduTitle] = useState("");
  const [urduDescription, setUrduDescription] = useState("");

  const [romanTitle, setRomanTitle] = useState("");
  const [romanDescription, setRomanDescription] = useState("");

  const [hindiTitle, setHindiTitle] = useState("");
  const [hindiDescription, setHindiDescription] = useState("");

  /* ---------- Fetch lists ---------- */
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/topics`).then(r => setTopics(r.data || [])).catch(console.error);
    axios.get(`${API_BASE_URL}/api/languages/language`).then(r => setLanguages(r.data || [])).catch(console.error);
    axios.get(`${API_BASE_URL}/api/translators`).then(r => setTranslators(r.data || [])).catch(console.error);
    axios.get(`${API_BASE_URL}/api/writers`).then(r => setWriters(r.data || [])).catch(console.error);
    axios.get(`${API_BASE_URL}/api/tags`).then(r => setTags(r.data || [])).catch(console.error);
  }, []);

  /* ---------- Image handlers ---------- */
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
      { v: eventTitle, n: "Event Title" },
      { v: selectedTopic, n: "Topic" },
      { v: selectedLanguage, n: "Language" },
      { v: publicationDate, n: "Event Date" },
      { v: venue, n: "Location/Venue" },
    ];
    const missing = required.filter((x) => !x.v);
    if (missing.length) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        html: missing.map((m) => `• ${m.n}`).join("<br>"),
      });
      return false;
    }
    return true;
  };

  /* ---------- Save / Publish with upload progress ---------- */
  const handleSave = async (isPublish) => {
    if (!validateForm()) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();

      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }

      // Core event fields
      formData.append("title", eventTitle);
      formData.append("slug", eventTitle); // adjust if you have a slugify on backend
      formData.append("topic", selectedTopic);
      formData.append("language", selectedLanguage);
      formData.append("eventDate", publicationDate);
      formData.append("venue", venue);
      formData.append("isPublished", isPublish ? "true" : "false");
      formData.append("createdAt", new Date().toISOString());

      // Optional meta
      if (selectedTranslator) formData.append("translator", selectedTranslator);
      if (selectedTag) formData.append("tags", selectedTag);
      if (selectedWriter) formData.append("writers", selectedWriter);
      if (writerDesignation) formData.append("writerDesignation", writerDesignation);

      // Language payloads (Title + Description)
      formData.append("englishTitle", englishTitle || "");
      formData.append("englishDescription", englishDescription || "");

      formData.append("urduTitle", urduTitle || "");
      formData.append("urduDescription", urduDescription || "");

      formData.append("romanUrduTitle", romanTitle || "");
      formData.append("romanUrduDescription", romanDescription || "");

      formData.append("hindiTitle", hindiTitle || "");
      formData.append("hindiDescription", hindiDescription || "");

      await axios.post(`${API_BASE_URL}/api/events`, formData, {
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
        title: isPublish ? "Published!" : "Draft Saved!",
        text: isPublish ? "Event Published Successfully!" : "Draft Saved Successfully!",
        timer: 1800,
        showConfirmButton: false,
      }).then(() => navigate("/event"));
    } catch (error) {
      console.error("Error saving event:", error);
      setIsUploading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  /* ---------- Options ---------- */
  const topicOptions = topics.map((t) => ({ value: t.topic, label: t.topic }));
  const tagOptions = tags.map((tg) => ({ value: tg.tag, label: tg.tag }));

  return (
    <Layout>
      {/* Editor look & feel */}
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
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Event</h1>
            <p className="text-sm text-gray-500 mt-1">Details on the right, content below.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT: Content Workspace */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Image */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <label className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Featured Image <span className="text-gray-500">(Optional)</span>
                </label>

                <div
                  className="mt-2 border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:bg-gray-50 transition relative"
                  onClick={(e) => {
                    if ((e.target).closest?.(".btn-remove-image")) return;
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

                      {/* Remove image */}
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

                      {/* Upload progress overlay during submit */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex flex-col justify-end">
                          <div className="px-4 pb-4 text-white text-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <span>Uploading image…</span>
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
                      <p className="text-base">Drop your image here, or click to browse</p>
                      <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      <button
                        type="button"
                        className="mt-4 px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
                      >
                        Browse Files
                      </button>

                      {/* Progress bar even if no preview */}
                      {isUploading && (
                        <div className="mt-6 w-full max-w-sm text-left">
                          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                            <span>Uploading image…</span>
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

              {/* Event Title */}
              <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4" />
                  <label className="text-sm font-medium">Event Title</label>
                </div>
                <input
                  type="text"
                  placeholder="Enter your Event Title"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
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
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                        placeholder="English event description..."
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
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "rtl", textAlign: "right" }}
                        placeholder="اردو میں ایونٹ کی تفصیل..."
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
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                        placeholder="Roman Urdu event description..."
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
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                        placeholder="हिंदी में कार्यक्रम का विवरण..."
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT: Settings */}
            <aside className="space-y-6">
              {/* Topic */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" />
                  <label className="text-sm font-medium">Topic</label>
                </div>
                <Select
                  options={topicOptions}
                  value={topicOptions.find((o) => o.value === selectedTopic) || null}
                  onChange={(opt) => setSelectedTopic(opt?.value || "")}
                  placeholder="Select a topic"
                  isSearchable
                  className="text-sm"
                />
              </div>

              {/* Language */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4" />
                  <label className="text-sm font-medium">Primary Language</label>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                  required
                >
                  <option value="">Select a language</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.language}>
                      {language.language}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location / Venue (required) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4" />
                  <label className="text-sm font-medium">Location/Venue<span className="text-red-500">*</span></label>
                </div>
                <input
                  type="text"
                  placeholder="e.g., Masjid-e-Noor Hall, Aurangabad"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>

              {/* Writer */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  <label className="text-sm font-medium">Writer (optional)</label>
                </div>
                <select
                  value={selectedWriter}
                  onChange={(e) => setSelectedWriter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Select a writer</option>
                  {writers.map((writer) => (
                    <option key={writer.id} value={writer.name}>
                      {writer.name}
                    </option>
                  ))}
                </select>

                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Writer Designation (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Senior Scholar"
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
                  <label className="text-sm font-medium">Translator (optional)</label>
                </div>
                <select
                  value={selectedTranslator}
                  onChange={(e) => setSelectedTranslator(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="">Select a translator</option>
                  {translators.map((translator) => (
                    <option key={translator.id} value={translator.name}>
                      {translator.name}
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
                  value={tagOptions.find((o) => o.value === selectedTag) || null}
                  onChange={(opt) => setSelectedTag(opt?.value || "")}
                  placeholder="Select tags"
                  isSearchable
                  className="text-sm"
                />
              </div>

              {/* Event Date */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4" />
                  <label className="text-sm font-medium">Event Date</label>
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
                    onClick={() => handleSave(false)}
                    disabled={isUploading}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="w-1/2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white px-4 py-3 rounded-xl font-semibold transition shadow-sm disabled:opacity-60"
                    onClick={() => handleSave(true)}
                    disabled={isUploading}
                  >
                    Publish
                  </button>
                </div>
                {isUploading && (
                  <p className="mt-3 text-xs text-gray-500 text-center">Uploading… please wait</p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
}
