import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FileText, X } from "lucide-react";
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

const getCurrentDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const slugify = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function EditQuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* ---------- Dropdown data ---------- */
  const [tags, setTags] = useState([]);
  const [writers, setWriters] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [topics, setTopics] = useState([]);
  const [translators, setTranslators] = useState([]);

  /* ---------- Required/meta fields ---------- */
  const [slug, setSlug] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [answeredStatus, setAnsweredStatus] = useState("");

  /* ---------- Image ---------- */
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [serverImageURL, setServerImageURL] = useState(null);
  const fileRef = useRef(null);

  /* ---------- Language blocks (Q + A) ---------- */
  const [questionEnglish, setQuestionEnglish] = useState("");
  const [answerEnglish, setAnswerEnglish] = useState("");

  const [questionUrdu, setQuestionUrdu] = useState("");
  const [answerUrdu, setAnswerUrdu] = useState("");

  const [questionRoman, setQuestionRoman] = useState("");
  const [answerRoman, setAnswerRoman] = useState("");

  const [questionHindi, setQuestionHindi] = useState("");
  const [answerHindi, setAnswerHindi] = useState("");

  /* ---------- Load dropdown lists ---------- */
  useEffect(() => {
    (async () => {
      try {
        const [tagsR, writersR, langsR, topicsR, transR] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/tags`),
          axios.get(`${API_BASE_URL}/api/writers`),
          axios.get(`${API_BASE_URL}/api/languages/language`),
          axios.get(`${API_BASE_URL}/api/topics`),
          axios.get(`${API_BASE_URL}/api/translators`),
        ]);
        setTags(tagsR.data || []);
        setWriters(writersR.data || []);
        setLanguages(langsR.data || []);
        setTopics(topicsR.data || []);
        setTranslators(transR.data || []);
      } catch (e) {
        console.error("Dropdown fetch error:", e);
      }
    })();
  }, []);

  /* ---------- Fetch existing question ---------- */
  useEffect(() => {
    (async () => {
      try {
        Swal.fire({ title: "Loading…", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const { data } = await axios.get(`https://minaramasjid-backend.onrender.com/api/questions/${id}`);

        // Meta
        setSlug(data.slug || "");
        setSelectedWriter(data.writer || "");
        setSelectedLanguage(data.language || "");
        setSelectedTopic(data.topic || "");
        setSelectedTranslator(data.translator || "");
        setSelectedDate(
          data.date ? new Date(data.date).toISOString().slice(0, 10) : getCurrentDate()
        );
        setAnsweredStatus(data.answeredStatus || "");

        // tags may be string/array
        const tagValue = Array.isArray(data.tags) ? data.tags[0] : data.tags;
        setSelectedTag(tagValue || "");

        // Content
        setQuestionEnglish(data.questionEnglish || "");
        setAnswerEnglish(data.answerEnglish || "");

        setQuestionUrdu(data.questionUrdu || "");
        setAnswerUrdu(data.answerUrdu || "");

        setQuestionRoman(data.questionRoman || "");
        setAnswerRoman(data.answerRoman || "");

        setQuestionHindi(data.questionHindi || "");
        setAnswerHindi(data.answerHindi || "");

        // Image
        setServerImageURL(`https://minaramasjid-backend.onrender.com/api/questions/image/${id}`);
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "Failed to load question.", "error");
      } finally {
        Swal.close();
      }
    })();
  }, [id]);

  /* ---------- Auto-slug if primary question text changes ---------- */
  useEffect(() => {
    // keep behavior close to "Add" page: slug from first non-empty
    const candidate =
      (questionEnglish || "").trim() ||
      (questionUrdu || "").trim() ||
      (questionRoman || "").trim() ||
      (questionHindi || "").trim();
    if (candidate) setSlug((prev) => (prev ? prev : slugify(candidate)));
    // if you want to ALWAYS regenerate when question changes, replace line above with:
    // setSlug(slugify(candidate));
  }, [questionEnglish, questionUrdu, questionRoman, questionHindi]);

  /* ---------- Image handlers ---------- */
  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "Invalid file", text: "Please upload an image." });
      return;
    }
    if (previewURL) URL.revokeObjectURL(previewURL);
    setImageFile(file);
    setPreviewURL(URL.createObjectURL(file));
    setServerImageURL(null);
  };

  const clearImage = () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    setImageFile(null);
    setPreviewURL(null);
    if (fileRef.current) fileRef.current.value = "";
    // restore server image if it exists
    setServerImageURL(`https://minaramasjid-backend.onrender.com/api/questions/image/${id}`);
  };

  /* ---------- Submit update ---------- */
  const handleUpdate = async () => {
    // Validate minimal required fields like Add component
    if (
      !slug ||
      !selectedWriter ||
      !selectedDate ||
      !selectedLanguage ||
      !selectedTopic ||
      !answeredStatus
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please fill all required fields including answered status.",
      });
      return;
    }

    try {
      const fd = new FormData();

      // Image (only if changed)
      if (imageFile) fd.append("image", imageFile);

      // Meta
      fd.append("slug", slug);
      fd.append("writer", selectedWriter);
      fd.append("date", selectedDate);
      fd.append("language", selectedLanguage);
      fd.append("topic", selectedTopic);
      fd.append("answeredStatus", answeredStatus);
      if (selectedTag) fd.append("tags", selectedTag);
      if (selectedTranslator) fd.append("translator", selectedTranslator);

      // Language blocks
      fd.append("questionEnglish", questionEnglish || "");
      fd.append("answerEnglish", answerEnglish || "");
      fd.append("questionUrdu", questionUrdu || "");
      fd.append("answerUrdu", answerUrdu || "");
      fd.append("questionRoman", questionRoman || "");
      fd.append("answerRoman", answerRoman || "");
      fd.append("questionHindi", questionHindi || "");
      fd.append("answerHindi", answerHindi || "");

      Swal.fire({
        title: "Updating question…",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.patch(`https://minaramasjid-backend.onrender.com/api/questions/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Updated!",
        timer: 1400,
        showConfirmButton: false,
      }).then(() => navigate("/questionlist"));
    } catch (err) {
      console.error("Update error:", err);
      Swal.close();
      Swal.fire("Error", err.response?.data?.message || "Failed to update question.", "error");
    }
  };

  /* ---------- Options ---------- */
  const tagOptions = useMemo(
    () => (tags || []).map((t) => ({ value: t.tag, label: t.tag })),
    [tags]
  );
  const topicOptions = useMemo(
    () => (topics || []).map((t) => ({ value: t.topic, label: t.topic })),
    [topics]
  );

  return (
    <Layout>
      {/* Quill polish */}
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
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Question</h1>
            <p className="text-sm text-gray-500 mt-1">Update any field and save your changes.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Content & Image */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label className="text-sm font-medium mb-3 block">
                Featured Image <span className="text-gray-500">(optional)</span>
              </label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 cursor-pointer relative"
                onClick={() => fileRef.current?.click()}
              >
                {previewURL ? (
                  <div className="relative inline-block">
                    <img src={previewURL} alt="Preview" className="w-56 h-56 object-cover rounded-xl shadow" />
                    <button
                      type="button"
                      title="Remove image"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                      className="absolute -right-2 -top-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                ) : serverImageURL ? (
                  <div className="relative inline-block">
                    <img
                      src={serverImageURL}
                      alt="Question"
                      className="w-56 h-56 object-cover rounded-xl shadow"
                      onError={() => setServerImageURL(null)}
                    />
                    <p className="text-xs text-gray-600 mt-2">(Click to replace)</p>
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
                  ref={fileRef}
                  onChange={onPickImage}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </section>

            {/* Slug (read-only like Add) */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <label className="text-sm font-medium block mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                value={slug}
                readOnly
                className="w-full border border-gray-200 rounded-xl px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-blue-300"
              />
            </section>

            {/* Language Blocks */}
            <section className="space-y-8">
              {/* EN */}
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
                        modules={quillModules}
                        formats={quillFormats}
                        className="bg-white"
                        style={{ direction: "ltr", textAlign: "left" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* UR */}
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
                        modules={quillModules}
                        formats={quillFormats}
                        className="bg-white"
                        style={{ direction: "rtl", textAlign: "right" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Roman */}
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
                        modules={quillModules}
                        formats={quillFormats}
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
                        modules={quillModules}
                        formats={quillFormats}
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
            {/* Answered Status */}
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
                  {writers.map((w, idx) => (
                    <option key={idx} value={w.name}>
                      {w.name}
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
                  {translators.map((t, idx) => (
                    <option key={idx} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <button
                type="button"
                onClick={handleUpdate}
                className="w-full py-3 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded-xl text-base font-semibold shadow-sm"
              >
                Update Question
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
