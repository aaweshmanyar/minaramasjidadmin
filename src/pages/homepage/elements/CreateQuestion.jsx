import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FileText, X } from "lucide-react";
import Quill from "quill";
import API_BASE_URL from "../../../../config";

/* ---------- NEW: preset images ---------- */
import img1 from "../../../assets/Images/img1.jpg";
import img2 from "../../../assets/Images/img2.jpg";
import img3 from "../../../assets/Images/img3.jpg";
import img4 from "../../../assets/Images/img4.jpg";
import img5 from "../../../assets/Images/img5.jpg";
import img6 from "../../../assets/Images/img6.jpg";
import img7 from "../../../assets/Images/img7.jpg";
import img8 from "../../../assets/Images/img8.jpg";
import img9 from "../../../assets/Images/img9.jpg";

const PRESET_IMAGES = [
  { id: "img1", src: img1, label: "img1" },
  { id: "img2", src: img2, label: "img2" },
  { id: "img3", src: img3, label: "img3" },
  { id: "img4", src: img4, label: "img4" },
  { id: "img5", src: img5, label: "img5" },
  { id: "img6", src: img6, label: "img6" },
  { id: "img7", src: img7, label: "img7" },
  { id: "img8", src: img8, label: "img8" },
  { id: "img9", src: img9, label: "img9" },
];

// Convert a bundled image URL into a File so backend receives it like an upload
async function blobFromUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = (url.split(".").pop() || "jpg").split("?")[0].toLowerCase();
  return new File([blob], `preset.${ext}`, { type: blob.type || "image/jpeg" });
}

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

export default function CreateQuestionsForm() {
  /* ---------- Base fields ---------- */
  const [slug, setSlug] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState([]);
  const [writers, setWriters] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [topics, setTopics] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [answeredStatus, setAnsweredStatus] = useState(""); // required

  /* ---------- Image ---------- */
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // NEW: selected preset (default img1)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

  /* ---------- Language blocks (Q + A) ---------- */
  const [questionEnglish, setQuestionEnglish] = useState("");
  const [answerEnglish, setAnswerEnglish] = useState("");

  const [questionUrdu, setQuestionUrdu] = useState("");
  const [answerUrdu, setAnswerUrdu] = useState("");

  const [questionRoman, setQuestionRoman] = useState("");
  const [answerRoman, setAnswerRoman] = useState("");

  const [questionHindi, setQuestionHindi] = useState("");
  const [answerHindi, setAnswerHindi] = useState("");

  const navigate = useNavigate();

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  };

  /* ---------- Slug auto from first non-empty Q ---------- */
  useEffect(() => {
    const candidate =
      (questionEnglish || "").trim() ||
      (questionUrdu || "").trim() ||
      (questionRoman || "").trim() ||
      (questionHindi || "").trim();
    if (candidate) setSlug(generateSlug(candidate));
  }, [questionEnglish, questionUrdu, questionRoman, questionHindi]);

  /* ---------- Lists ---------- */
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/tags`).then((res) => setTags(res.data || []));
    axios.get(`${API_BASE_URL}/api/writers`).then((res) => setWriters(res.data || []));
    axios.get(`${API_BASE_URL}/api/languages/language`).then((res) => setLanguages(res.data || []));
    axios.get(`${API_BASE_URL}/api/topics`).then((res) => setTopics(res.data || []));
    axios.get(`${API_BASE_URL}/api/translators`).then((res) => setTranslators(res.data || []));
  }, []);

  /* ---------- Image cleanup ---------- */
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  /* ---------- Image handlers ---------- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Invalid file", text: "Please upload an image." });
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setUploadedImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    // Manual upload overrides preset selection visually
    setSelectedPresetIndex(null);
  };

  const clearImage = (e) => {
    e?.stopPropagation?.();
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setUploadedImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // If no preset explicitly selected, restore default img1
    if (!Number.isInteger(selectedPresetIndex)) setSelectedPresetIndex(0);
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    if (
      !slug ||
      !selectedWriter ||
      !selectedDate ||
      !selectedLanguage ||
      !selectedTopic ||
      !answeredStatus
      // NOTE: image NOT required here; preset covers it.
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please fill all required fields including answered status.",
      });
      return;
    }

    const formData = new FormData();

    try {
      // Decide which image to send:
      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      } else {
        const idx = Number.isInteger(selectedPresetIndex) ? selectedPresetIndex : 0;
        const preset = PRESET_IMAGES[idx] || PRESET_IMAGES[0];
        const fileFromPreset = await blobFromUrl(preset.src);
        formData.append("image", fileFromPreset, `${preset.label || "preset"}.jpg`);
        formData.append("coverPresetLabel", preset.label || `img${idx + 1}`);
      }

      formData.append("slug", slug);

      // EN
      formData.append("questionEnglish", questionEnglish || "");
      formData.append("answerEnglish", answerEnglish || "");
      // UR
      formData.append("questionUrdu", questionUrdu || "");
      formData.append("answerUrdu", answerUrdu || "");
      // Roman Urdu
      formData.append("questionRoman", questionRoman || "");
      formData.append("answerRoman", answerRoman || "");
      // Hindi
      formData.append("questionHindi", questionHindi || "");
      formData.append("answerHindi", answerHindi || "");

      // Meta
      formData.append("writer", selectedWriter);
      formData.append("date", selectedDate);
      formData.append("language", selectedLanguage);
      formData.append("topic", selectedTopic);
      formData.append("answeredStatus", answeredStatus);

      if (selectedTag) formData.append("tags", selectedTag);
      if (selectedTranslator) formData.append("translator", selectedTranslator);

      Swal.fire({
        title: "Submitting...",
        text: "Please wait while the question is being saved.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const response = await axios.post(
        `https://minaramasjid-backend.onrender.com/api/questions`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: response.data.message || "Question created successfully!",
          timer: 1800,
          showConfirmButton: false,
        }).then(() => navigate("/questionlist"));

        // Reset
        setSlug("");
        setQuestionEnglish("");
        setAnswerEnglish("");
        setQuestionUrdu("");
        setAnswerUrdu("");
        setQuestionRoman("");
        setAnswerRoman("");
        setQuestionHindi("");
        setAnswerHindi("");
        setSelectedTag("");
        setSelectedWriter("");
        setSelectedDate(getCurrentDate());
        setSelectedLanguage("");
        setSelectedTopic("");
        setSelectedTranslator("");
        setAnsweredStatus("");
        clearImage();
        setSelectedPresetIndex(0);
      } else {
        Swal.fire({ icon: "error", title: "Submission Failed", text: "Please try again." });
      }
    } catch (err) {
      console.error("Error creating question:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong. Please check your connection.",
      });
    }
  };

  const tagOptions = tags.map((tagObj) => ({ value: tagObj.tag, label: tagObj.tag }));
  const topicOptions = topics.map((t) => ({ value: t.topic, label: t.topic }));

  // Preview source: manual upload first; else preset
  const currentPreviewSrc =
    imagePreview ||
    (Number.isInteger(selectedPresetIndex) ? PRESET_IMAGES[selectedPresetIndex].src : PRESET_IMAGES[0].src);

  return (
    <Layout>
      {/* Editor polish */}
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
          min-height: 220px;
          font-size: 15px;
          line-height: 1.7;
          padding-bottom: 2rem;
        }
        .rt-card:focus-within .ql-toolbar,
        .rt-card:focus-within .ql-container {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 4px rgba(59,130,246,.12);
        }
      `}</style>

      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create Questions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill required fields, add multi-language content, and add a featured image (suggested or uploaded).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Content & Image */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Image (suggest + upload) */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label className="text-sm font-medium mb-3 block">Featured Image</label>

              {/* Suggestion strip */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">
                  Choose a suggested image (or upload your own). If you don’t upload, the selected suggestion will be used.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_IMAGES.map((p, idx) => {
                    const active = Number.isInteger(selectedPresetIndex)
                      ? selectedPresetIndex === idx && !uploadedImageFile
                      : idx === 0 && !uploadedImageFile;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={[
                          "relative aspect-[4/3] rounded-lg overflow-hidden border transition",
                          active ? "border-[#5a6c17] ring-2 ring-[#5a6c17]" : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                        title={p.label}
                        onClick={() => {
                          clearImage(); // clears manual upload if any
                          setSelectedPresetIndex(idx);
                        }}
                      >
                        <img src={p.src} alt={p.label} className="w-full h-full object-cover" loading="lazy" />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          {p.label}
                        </span>
                        {active && (
                          <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload area + preview */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 cursor-pointer relative"
                onClick={() => fileInputRef.current?.click()}
              >
                {currentPreviewSrc ? (
                  <div className="relative inline-block">
                    <img
                      src={currentPreviewSrc}
                      alt="Preview"
                      className="w-56 h-56 object-cover rounded-xl shadow"
                    />
                    {/* Remove button shows only for manual upload */}
                    {uploadedImageFile && (
                      <button
                        type="button"
                        title="Remove image"
                        onClick={clearImage}
                        className="absolute -right-2 -top-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50"
                      >
                        <X className="w-4 h-4 text-gray-700" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-base">Drop your image here, or click to browse</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                    <span className="mt-4 inline-block px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-700">
                      Browse Files
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleImageUpload}
                  /* no required here – preset covers default */
                />
              </div>
            </section>

            {/* Slug */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label htmlFor="slug" className="text-sm font-medium block mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Auto-generated from the first non-empty question"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                required
                readOnly
              />
            </section>

            {/* Language Blocks */}
            <section className="space-y-8">
              {/* English */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold mb-4">English</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Question (English)</label>
                    <input
                      value={questionEnglish}
                      onChange={(e) => setQuestionEnglish(e.target.value)}
                      placeholder="Enter the English question"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <label className="text-sm font-medium">Answer (English)</label>
                    </div>
                    <div className="rt-card">
                      <ReactQuill
                        value={answerEnglish}
                        onChange={setAnswerEnglish}
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Urdu */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold mb-4">Urdu</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Question (Urdu)</label>
                    <input
                      value={questionUrdu}
                      onChange={(e) => setQuestionUrdu(e.target.value)}
                      placeholder="اردو سوال یہاں درج کریں"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <label className="text-sm font-medium">Answer (Urdu)</label>
                    </div>
                    <div className="rt-card">
                      <ReactQuill
                        value={answerUrdu}
                        onChange={setAnswerUrdu}
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "rtl", textAlign: "right" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Roman Urdu */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold mb-4">Roman Urdu</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Question (Roman Urdu)</label>
                    <input
                      value={questionRoman}
                      onChange={(e) => setQuestionRoman(e.target.value)}
                      placeholder="Roman Urdu question"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <label className="text-sm font-medium">Answer (Roman Urdu)</label>
                    </div>
                    <div className="rt-card">
                      <ReactQuill
                        value={answerRoman}
                        onChange={setAnswerRoman}
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hindi */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold mb-4">Hindi</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Question (Hindi)</label>
                    <input
                      value={questionHindi}
                      onChange={(e) => setQuestionHindi(e.target.value)}
                      placeholder="हिंदी में प्रश्न"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <label className="text-sm font-medium">Answer (Hindi)</label>
                    </div>
                    <div className="rt-card">
                      <ReactQuill
                        value={answerHindi}
                        onChange={setAnswerHindi}
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Meta */}
          <aside className="space-y-6">
            {/* Status */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label className="text-sm font-medium block mb-2">
                Answered Status <span className="text-red-500">*</span>
              </label>
              <select
                value={answeredStatus}
                onChange={(e) => setAnsweredStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
                required
              >
                <option value="">Select status</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="in progress">In Progress</option>
              </select>
            </div>

            {/* Writer / Date */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Writer <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWriter}
                  onChange={(e) => setSelectedWriter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                  required
                >
                  <option value="">Choose Writer</option>
                  {writers.map((writer, idx) => (
                    <option key={idx} value={writer.name}>
                      {writer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                  required
                />
              </div>
            </div>

            {/* Language / Topic */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Language <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                  required
                >
                  <option value="">Choose Language</option>
                  {languages.map((lang, idx) => (
                    <option key={idx} value={lang.language}>
                      {lang.language}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <Select
                  options={topicOptions}
                  value={topicOptions.find((o) => o.value === selectedTopic) || null}
                  onChange={(opt) => setSelectedTopic(opt?.value || "")}
                  placeholder="Choose Topic"
                  isSearchable
                  className="text-sm"
                />
              </div>
            </div>

            {/* Tag / Translator */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Tag</label>
                <Select
                  options={tagOptions}
                  value={tagOptions.find((o) => o.value === selectedTag) || null}
                  onChange={(opt) => setSelectedTag(opt?.value || "")}
                  placeholder="Choose Tag"
                  isSearchable
                  className="text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Translator</label>
                <select
                  value={selectedTranslator}
                  onChange={(e) => setSelectedTranslator(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none"
                >
                  <option value="">Choose Translator</option>
                  {translators.map((tr, idx) => (
                    <option key={idx} value={tr.name}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-3 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded-xl text-base font-semibold shadow-sm"
              >
                Submit
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
