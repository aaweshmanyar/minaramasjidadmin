import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarIcon, ImageIcon, Type, FileText, Users, Globe, Hash } from "lucide-react";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from "sweetalert2";
import Select from 'react-select';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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


const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


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


export default function CreateArticlePage() {
  const [publicationDate, setPublicationDate] = useState(getCurrentDate());
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [topics, setTopics] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [writers, setWriters] = useState([]);
  const [englishDescription, setEnglishDescription] = useState("");
  const [urduDescription, setUrduDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [writerDesignation, setWriterDesignation] = useState("");
  const [showCustomWriterInput, setShowCustomWriterInput] = useState(false);
  const [customWriterName, setCustomWriterName] = useState("");

  const fileInputRef = useRef();

  const handleDateChange = (e) => setPublicationDate(e.target.value);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, languagesRes, translatorsRes, writersRes, tagsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/topics`),
          axios.get(`${API_BASE_URL}/api/languages/language`),
          axios.get(`${API_BASE_URL}/api/translators`),
          axios.get(`${API_BASE_URL}/api/writers`),
          axios.get(`${API_BASE_URL}/api/tags`)
        ]);

        setTopics(topicsRes.data);
        setLanguages(languagesRes.data);
        setTranslators(translatorsRes.data);
        setWriters(writersRes.data);
        setTags(tagsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch required data. Please try again later.",
        });
      }
    };

    fetchData();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
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
    reader.onloadend = () => {
      setUploadedImageURL(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const requiredFields = [
      { value: articleTitle, name: "Article Title" },
      { value: selectedTopic, name: "Topic" },
      { value: selectedWriter, name: "Writer" },
      { value: selectedLanguage, name: "Language" },
      { value: publicationDate, name: "Publication Date" }
      // Translator and Tag are removed from required fields
    ];

    const missingFields = requiredFields.filter(field => !field.value);

    if (missingFields.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        html: `The following fields are required:<br><br>${missingFields.map(f => `• ${f.name}`).join('<br>')}`,
      });
      return false;
    }

    if (!uploadedImageFile) {
      const result = window.confirm("Are you sure you want to continue without a featured image?");
      if (!result) return false;
    }

    return true;
  };

  const handleSave = async (isPublish) => {
    if (!validateForm()) return;

    try {
      Swal.fire({
        title: "Processing...",
        text: isPublish ? "Publishing your article" : "Saving your draft",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const formData = new FormData();

      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }

      formData.append("title", articleTitle);
      formData.append("englishDescription", englishDescription || "");
      formData.append("urduDescription", urduDescription || "");
      formData.append("topic", selectedTopic);
      formData.append("writers", showCustomWriterInput ? customWriterName : selectedWriter);
      formData.append("writerDesignation", writerDesignation);
      formData.append("language", selectedLanguage);
      formData.append("date", publicationDate);
      formData.append("isPublished", isPublish);
      formData.append("createdAt", new Date().toISOString());

      // Only append optional fields if they have values
      if (selectedTranslator) {
        formData.append("translator", selectedTranslator);
      }

      if (selectedTag) {
        formData.append("tags", selectedTag);
      }

      await axios.post(`${API_BASE_URL}/api/articles`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        icon: "success",
        title: isPublish ? "Published!" : "Draft Saved!",
        text: isPublish
          ? "Your article has been successfully published."
          : "Your draft has been saved.",
        timer: 3000,
        showConfirmButton: false,
      });

      setTimeout(() => {
        window.location.href = "/viewarticle";
      }, 3000);
    } catch (error) {
      console.error("Error saving article:", error);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };


  const tagOptions = tags.map(tag => ({
    value: tag.tag,
    label: tag.tag
  }));

  const topicOptions = topics.map(topic => ({
    value: topic.topic,
    label: topic.topic
  }));

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-8">Create Article</h1>

          <div className="bg-slate-50 rounded-lg p-8">
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Featured Image</label>
              <div className="max-w-md mx-auto">
                <div
                  className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400 transition"
                  onClick={() => fileInputRef.current.click()}
                >
                  {uploadedImageURL ? (
                    <img
                      src={uploadedImageURL}
                      alt="Uploaded Preview"
                      className="w-60 h-60 object-cover rounded-md"
                    />
                  ) : (
                    <>
                      <div className="w-16 h-16 mb-4 text-muted-foreground">
                        <ImageIcon className="w-full h-full" />
                      </div>
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
                  />
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4" />
                    <label className="text-sm font-medium">Article Title</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your article title"
                    className="border rounded-lg p-2 w-full"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    <label className="text-sm font-medium">English Description</label>
                  </div>
                  <ReactQuill
                    theme="snow"
                    value={englishDescription}
                    onChange={setEnglishDescription}
                    modules={modules}
                    formats={formats}
                    className="bg-white border rounded-lg min-h-[136px] text-left"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    <label className="text-sm font-medium">Urdu Description</label>
                  </div>
                  <ReactQuill
                    theme="snow"
                    value={urduDescription}
                    onChange={setUrduDescription}
                    modules={modules}
                    formats={formats}
                    className="bg-white border rounded-lg min-h-[136px] text-right"
                    style={{ direction: 'rtl', textAlign: 'right' }}
                    placeholder="Enter Urdu description"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4" />
                      <label className="text-sm font-medium">Topic</label>
                    </div>
                    <Select
                      options={topicOptions}
                      value={topicOptions.find(option => option.value === selectedTopic)}
                      onChange={(selectedOption) => setSelectedTopic(selectedOption?.value || '')}
                      placeholder="Select a topic..."
                      isSearchable
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4" />
                    <label className="text-sm font-medium">Language</label>
                  </div>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="border rounded-lg p-2 w-full"
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

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">Writer</label>
                  </div>
                  <select
                    value={showCustomWriterInput ? "custom" : selectedWriter}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setShowCustomWriterInput(true);
                        setSelectedWriter(""); // Reset any previously selected writer
                        setWriterDesignation("");
                      } else {
                        setShowCustomWriterInput(false);
                        setCustomWriterName(""); // Reset custom name if any
                        setSelectedWriter(e.target.value);
                        const selected = writers.find(w => w.name === e.target.value);
                        setWriterDesignation(selected?.designation || "");
                      }
                    }}
                    className="border rounded-lg p-2 w-full"
                    required
                  >
                    <option value="">Select a writer</option>
                    {writers.map((writer) => (
                      <option key={writer.id} value={writer.name}>
                        {writer.name}
                      </option>
                    ))}
                    <option value="custom">+ Add Custom Writer</option>
                  </select>

                  {showCustomWriterInput && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter custom writer name"
                        className="border rounded-lg p-2 w-full"
                        value={customWriterName}
                        onChange={(e) => {
                          setCustomWriterName(e.target.value);
                          setSelectedWriter(e.target.value);
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="text-sm text-blue-500 hover:text-blue-700"
                        onClick={() => {
                          setShowCustomWriterInput(false);
                          setCustomWriterName("");
                          setSelectedWriter("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>


                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">Translator</label>
                  </div>
                  <select
                    value={selectedTranslator}
                    onChange={(e) => setSelectedTranslator(e.target.value)}
                    className="border rounded-lg p-2 w-full"
                    required
                  >
                    <option value="">Select a translator</option>
                    {translators.map((translator) => (
                      <option key={translator.id} value={translator.name}>
                        {translator.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    <label className="text-sm font-medium">Tags</label>
                  </div>
                  <Select
                    options={tagOptions}
                    value={tagOptions.find(option => option.value === selectedTag)}
                    onChange={(selectedOption) => setSelectedTag(selectedOption?.value || '')}
                    placeholder="Select tags..."
                    isSearchable
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    <label className="text-sm font-medium">Publication Date</label>
                  </div>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={handleDateChange}
                    className="border rounded-lg p-2 w-full"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition"
                onClick={() => handleSave(false)}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white px-4 py-2 rounded-md transition"
                onClick={() => handleSave(true)}
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}