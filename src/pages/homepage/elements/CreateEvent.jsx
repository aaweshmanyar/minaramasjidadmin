import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, ImageIcon, Type, FileText, Users, Globe, Hash } from "lucide-react";
import Layout from "../../../component/Layout";
import axios from "axios";
import Swal from 'sweetalert2';
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

export default function CreateEvent() {
  const [publicationDate, setPublicationDate] = useState(getCurrentDate());
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedWriter, setSelectedWriter] = useState("");
  const [selectedTranslator, setSelectedTranslator] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [topics, setTopics] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [writers, setWriters] = useState([]);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [articleTitle, setArticleTitle] = useState("");
  const [writerDesignation, setWriterDesignation] = useState("");
  const navigate = useNavigate();



  const fileInputRef = useRef();

  const handleDateChange = (e) => setPublicationDate(e.target.value);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/topics`);
        setTopics(response.data);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/languages/language`);
        setLanguages(response.data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    const fetchTranslators = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/translators`);
        setTranslators(response.data);
      } catch (error) {
        console.error("Error fetching translators:", error);
      }
    };
    fetchTranslators();
  }, []);

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/writers`);
        setWriters(response.data);
      } catch (error) {
        console.error("Error fetching writers:", error);
      }
    };
    fetchWriters();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tags`);
        setTags(response.data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  const handleContentChange = (e) => {
    setContent(e.target.innerHTML);
  };

  const applyStyle = (style) => {
    document.execCommand(style, false, null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageURL(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedImageFile(null);
      setUploadedImageURL("");
    }
  };

  const validateForm = () => {
    if (!articleTitle || !content || !selectedTopic || !selectedLanguage || !publicationDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'All fields except Writer, Image, Translator, and Tags are required.',
      });
      return false;
    }
    return true;
  };

  const handleSave = async (isPublish) => {
    if (!validateForm()) return;

    try {
      // Show loading
      Swal.fire({
        title: isPublish ? 'Publishing Event...' : 'Saving Draft...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formData = new FormData();

      if (uploadedImageFile) {
        formData.append("image", uploadedImageFile);
      }

      formData.append("title", articleTitle);
      formData.append("slug", articleTitle);
      formData.append("content", content);
      formData.append("topic", selectedTopic);
      formData.append("language", selectedLanguage);
      formData.append("eventDate", publicationDate);
      formData.append("isPublished", isPublish ? "true" : "false");

      // Optional fields
      if (selectedTranslator) {
        formData.append("translator", selectedTranslator);
      }

      if (selectedTag) {
        formData.append("tags", selectedTag);
      }

      if (selectedWriter) {
        formData.append("writers", selectedWriter);
      }

      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Swal.fire({
        icon: 'success',
        title: isPublish ? 'Published!' : 'Draft Saved!',
        text: isPublish ? 'Event Published Successfully!' : 'Draft Saved Successfully!',
      }).then(() => {
        navigate("/event");
      });


    } catch (error) {
      console.error("Error saving event:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong. Please try again.',
      });
    }
  };


  const topicOptions = topics.map(topic => ({
    value: topic.topic,
    label: topic.topic
  }));

  const tagOptions = tags.map(tag => ({
    value: tag.tag,
    label: tag.tag
  }));

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">← Back</button> */}
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <h1 className="text-2xl font-bold mb-8">Create Event</h1>

          <div className="bg-slate-50 rounded-lg p-8">
            {/* Featured Image */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Featured Image <span className="text-gray-500">(Optional)</span>
              </label>
              <div
                className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400 transition"
                onClick={() => fileInputRef.current.click()}
              >
                {uploadedImageFile ? (
                  <>
                    <img
                      src={uploadedImageURL}
                      alt="Uploaded Preview"
                      className="w-40 h-40 object-cover rounded-md mb-2"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedImageFile(null);
                        setUploadedImageURL(null);
                      }}
                      className="text-red-500 text-sm mt-2"
                    >
                      Remove Image
                    </button>
                  </>
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

            {/* Form Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Article Title */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Type className="w-4 h-4" />
                    <label className="text-sm font-medium">Event Title</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your Event Title"
                    className="border rounded-lg p-2 w-full"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                  />
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    <label className="text-sm font-medium">Content</label>
                  </div>
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={modules}
                    formats={formats}
                    className="bg-white border rounded-lg min-h-[136px]"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
              </div>

              {/* Right Panel */}
              <div className="space-y-6">
                {/* Topic Dropdown */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4" />
                    <label className="text-sm font-medium">Topic</label>
                  </div>
                  <Select
                    options={topicOptions}
                    value={topicOptions.find(option => option.value === selectedTopic)}
                    onChange={(selectedOption) => setSelectedTopic(selectedOption?.value || '')}
                    placeholder="Select a topic"
                    isSearchable
                    className="w-full"
                  />
                </div>

                {/* Language Dropdown */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4" />
                    <label className="text-sm font-medium">Language</label>
                  </div>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="border rounded-lg p-2 w-full"
                  >
                    <option value="">Select a language</option>
                    {languages.map((language) => (
                      <option key={language.id} value={language.language}>
                        {language.language}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Writer Dropdown */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">Writer</label>
                  </div>
                  <select
                    value={selectedWriter}
                    onChange={(e) => setSelectedWriter(e.target.value)}
                    className="border rounded-lg p-2 w-full"
                  >
                    <option value="">Select a writer</option>
                    {writers.map((writer) => (
                      <option key={writer.id} value={writer.name}>
                        {writer.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Translator Dropdown */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <label className="text-sm font-medium">Translator</label>
                  </div>
                  <select
                    value={selectedTranslator}
                    onChange={(e) => setSelectedTranslator(e.target.value)}
                    className="border rounded-lg p-2 w-full"
                  >
                    <option value="">Select a translator</option>
                    {translators.map((translator) => (
                      <option key={translator.id} value={translator.name}>
                        {translator.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Dropdown */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4" />
                    <label className="text-sm font-medium">Tags</label>
                  </div>
                  <Select
                    options={tagOptions}
                    value={tagOptions.find(option => option.value === selectedTag)}
                    onChange={(selectedOption) => setSelectedTag(selectedOption?.value || '')}
                    placeholder="Select tags"
                    isSearchable
                    className="w-full"
                  />
                </div>

                {/* Publication Date */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-4 h-4" />
                    <label className="text-sm font-medium">Event Date</label>
                  </div>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={handleDateChange}
                    className="border rounded-lg p-2 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
                onClick={() => handleSave(false)}
              >
                Save as Draft
              </button>
              <button
                className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
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
