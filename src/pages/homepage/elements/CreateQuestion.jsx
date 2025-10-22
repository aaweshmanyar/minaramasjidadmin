import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileText } from "lucide-react";
import Quill from 'quill';
import API_BASE_URL from "../../../../config";

const Font = Quill.import('formats/font');
Font.whitelist = [
  'sans-serif', 'serif', 'monospace',
  'Amiri', 'Rubik-Bold', 'Rubik-Light',
  'Scheherazade-Regular', 'Scheherazade-Bold',
  'Aslam', 'Mehr-Nastaliq'
];

Quill.register(Font, true);


const modules = {
  toolbar: [
    [
      {
        font: [
          'Amiri',
          'Rubik-Bold',
          'Rubik-Light',
          'Scheherazade-Regular',
          'Scheherazade-Bold',
          'Aslam',
          'Mehr-Nastaliq',
          'serif',
          'sans-serif',
          'monospace'
        ]
      },
      { size: [] }
    ],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

const formats = [
  'font',
  'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'header',
  'align',
  'blockquote', 'code-block',
  'list', 'bullet',
  'indent',
  'link', 'image', 'video',
  'clean'
];


const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CreateQuestionsForm() {
  const [slug, setSlug] = useState("");
  const [questionEnglish, setQuestionEnglish] = useState("");
  const [questionUrdu, setQuestionUrdu] = useState("");
  const [answerEnglish, setAnswerEnglish] = useState("");
  const [answerUrdu, setAnswerUrdu] = useState("");
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
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  useEffect(() => {
    if (questionEnglish) {
      setSlug(generateSlug(questionEnglish));
    } else if (questionUrdu) {
      setSlug(generateSlug(questionUrdu));
    }
  }, [questionEnglish, questionUrdu]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/tags`).then((res) => setTags(res.data));
    axios.get(`${API_BASE_URL}/api/writers`).then((res) => setWriters(res.data));
    axios.get(`${API_BASE_URL}/api/languages/language`).then((res) => setLanguages(res.data));
    axios.get(`${API_BASE_URL}/api/topics`).then((res) => setTopics(res.data));
    axios.get(`${API_BASE_URL}/api/translators`).then((res) => setTranslators(res.data));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isValidFileType = file.type.startsWith("image/");
      if (!isValidFileType) {
        alert("Please upload a valid image file.");
        return;
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setUploadedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (
      !slug ||
      !selectedWriter ||
      !selectedDate ||
      !selectedLanguage ||
      !selectedTopic ||
      !uploadedImageFile
    ) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Fields",
        text: "Please fill all required fields including the image.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", uploadedImageFile);
    formData.append("slug", slug);
    formData.append("questionEnglish", questionEnglish || "");
    formData.append("answerEnglish", answerEnglish || "");
    formData.append("questionUrdu", questionUrdu || "");
    formData.append("answerUrdu", answerUrdu || "");
    formData.append("writer", selectedWriter);
    formData.append("date", selectedDate);
    formData.append("language", selectedLanguage);
    formData.append("topic", selectedTopic);

    if (selectedTag) {
      formData.append("tags", selectedTag);
    }

    if (selectedTranslator) {
      formData.append("translator", selectedTranslator);
    }

    Swal.fire({
      title: "Submitting...",
      text: "Please wait while the question is being saved.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/questions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: response.data.message || "Question created successfully!",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate("/questionlist");
        });


        // Reset form
        setSlug("");
        setQuestionEnglish("");
        setQuestionUrdu("");
        setAnswerEnglish("");
        setAnswerUrdu("");
        setSelectedTag("");
        setSelectedWriter("");
        setSelectedDate(getCurrentDate());
        setSelectedLanguage("");
        setSelectedTopic("");
        setSelectedTranslator("");
        setUploadedImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: "Failed to create question. Please try again.",
        });
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


  const tagOptions = tags.map(tagObj => ({
    value: tagObj.tag,
    label: tagObj.tag
  }));

  const topicOptions = topics.map(topic => ({
    value: topic.topic,
    label: topic.topic
  }));

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Create Questions</h1>

        <div className="border rounded-md shadow-sm">
          {/* Featured Image - Required */}
          <div className="mb-6 p-6">
            <label className="text-sm font-medium mb-2 block">Featured Image<span className="text-red-500">*</span></label>
            <div
              className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400 transition"
              onClick={() => fileInputRef.current.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Uploaded Preview"
                  className="w-40 h-40 object-cover rounded-md"
                />
              ) : (
                <>
                  <div className="w-16 h-16 mb-4 text-muted-foreground">📷</div>
                  <p className="text-base mb-1">Drop your image here, or click to browse</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supported formats: PNG, JPG, GIF (max 5MB)
                  </p>
                  <button
                    type="button"
                    className="border px-4 py-2 rounded-md text-sm bg-transparent border-gray-400 hover:border-gray-500"
                  >
                    Browse Files
                  </button>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleImageUpload}
                required
              />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Slug */}
            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Slug<span className="text-red-500">*</span>
              </label>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Auto-generated from question"
                className="w-full border px-3 py-2 rounded-md"
                required
                readOnly
              />
            </div>

            {/* Question English */}
            <div className="space-y-2">
              <label htmlFor="questionEnglish" className="text-sm font-medium">
                Question (English)
              </label>
              <input
                id="questionEnglish"
                value={questionEnglish}
                onChange={(e) => setQuestionEnglish(e.target.value)}
                placeholder="Enter your question here"
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>

            {/* Answer English */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <label className="text-sm font-medium">
                  Answer (English)
                </label>
              </div>
              <ReactQuill
                value={answerEnglish}
                onChange={setAnswerEnglish}
                theme="snow"
                modules={modules}
                formats={formats}
                className="bg-white border rounded-lg min-h-[136px] text-left"
                style={{ direction: "ltr", textAlign: "left" }}
              />
            </div>

            {/* Question Urdu */}
            <div className="space-y-2">
              <label htmlFor="questionUrdu" className="text-sm font-medium">
                Question (Urdu)
              </label>
              <input
                id="questionUrdu"
                value={questionUrdu}
                onChange={(e) => setQuestionUrdu(e.target.value)}
                placeholder="اردو سوال یہاں درج کریں"
                className="w-full border px-3 py-2 rounded-md text-right"
                dir="rtl"
              />
            </div>

            {/* Answer Urdu */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <label className="text-sm font-medium">
                  Answer (Urdu)
                </label>
              </div>
              <ReactQuill
                value={answerUrdu}
                onChange={setAnswerUrdu}
                theme="snow"
                modules={modules}
                formats={formats}
                className="bg-white border rounded-lg min-h-[136px] text-right"
                style={{ direction: "rtl", textAlign: "right" }}
              />
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Writer */}
              <div className="space-y-2">
                <label htmlFor="writer" className="text-sm font-medium">
                  Writer<span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWriter}
                  onChange={(e) => setSelectedWriter(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Choose Writer</option>
                  {writers.map((writer, index) => (
                    <option key={index} value={writer.name}>
                      {writer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date<span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <label htmlFor="language" className="text-sm font-medium">
                  Language<span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Choose Language</option>
                  {languages.map((lang, index) => (
                    <option key={index} value={lang.language}>
                      {lang.language}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tag */}
              <div className="space-y-2">
                <label htmlFor="tag" className="text-sm font-medium">
                  Tag<span className="text-red-500">*</span>
                </label>
                <Select
                  id="tag"
                  options={tagOptions}
                  value={tagOptions.find(option => option.value === selectedTag)}
                  onChange={(selectedOption) => setSelectedTag(selectedOption?.value || '')}
                  placeholder="Choose Tag"
                  isSearchable
                  className="w-full"
                  required
                />
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <label htmlFor="topic" className="text-sm font-medium">
                  Topic<span className="text-red-500">*</span>
                </label>
                <Select
                  id="topic"
                  options={topicOptions}
                  value={topicOptions.find(option => option.value === selectedTopic)}
                  onChange={(selectedOption) => setSelectedTopic(selectedOption?.value || '')}
                  placeholder="Choose Topic"
                  isSearchable
                  className="w-full"
                  required
                />
              </div>

              {/* Translator */}
              <div className="space-y-2">
                <label htmlFor="translator" className="text-sm font-medium">
                  Translator<span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTranslator}
                  onChange={(e) => setSelectedTranslator(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Choose Translator</option>
                  {translators.map((translator, index) => (
                    <option key={index} value={translator.name}>
                      {translator.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-3 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white rounded-md text-lg font-semibold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}