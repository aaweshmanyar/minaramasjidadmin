import { useEffect, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import ReactQuill from "react-quill";
import DatePicker from "react-datepicker";
import "react-quill/dist/quill.snow.css";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
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


// Button component (unused in the form but kept for completeness)
const Button = ({ children, className = "", variant = "", ...props }) => (
  <button
    type="button"
    className={`px-4 py-2 rounded ${variant === "outline" ? "border" : ""} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ id, placeholder, type = "text", value, onChange, name, required = false }) => (
  <input
    id={id}
    name={name}
    type={type}
    placeholder={placeholder}
    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
    value={value}
    onChange={onChange}
    required={required}
  />
);

const Label = ({ htmlFor, children, required = false }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const Select = ({ value, onChange, name, children, required = false }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
    required={required}
  >
    {children}
  </select>
);





const FileUpload = ({ type, onChange, progress, showSuccessMessage, required = false }) => {
  const [fileSelected, setFileSelected] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileSelected(true);

      if (type === "image") {
        const file = e.target.files[0];
        if (!file.type.match('image.*')) {
          alert('Please select an image file');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFileSelected(false);
      setPreviewUrl(null);
    }
    onChange(e);
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept={type === "image" ? "image/*" : ".pdf"}
        className="w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        onChange={handleFileChange}
        required={required}
      />

      {type === "image" && previewUrl && (
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-2">Preview:</div>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-60 rounded border object-contain"
            style={{ maxWidth: '70%' }}
          />
        </div>
      )}

      {type === "pdf" && fileSelected && progress > 0 && progress < 100 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${progress}%`,
                transition: "width 0.5s ease-in-out",
              }}
            />
          </div>
          <div className="text-center mt-1 text-sm text-gray-600">{`${Math.round(progress)}%`}</div>
        </div>
      )}

      {type === "pdf" && fileSelected && progress === 100 && showSuccessMessage && (
        <div className="text-green-600 text-sm mt-2 text-center">Upload Successful!</div>
      )}
    </div>
  );
};

export default function CreateBookPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    translator: "",
    language: "",
    bookDate: new Date(), // Set default to current date
    status: "",
    category: "",
    isbn: "",
    coverImage: null,
    attachment: null,
    isPublished: "true",
  });

  const [languages, setLanguages] = useState([]);
  const [translators, setTranslators] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [langRes, transRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/languages/language`),
          fetch(`${API_BASE_URL}/api/translators`)
        ]);

        if (!langRes.ok) throw new Error("Failed to fetch languages");
        if (!transRes.ok) throw new Error("Failed to fetch translators");

        const langData = await langRes.json();
        const transData = await transRes.json();

        if (Array.isArray(langData)) setLanguages(langData);
        if (Array.isArray(transData)) setTranslators(transData);
      } catch (err) {
        console.error("Error fetching data:", err);
        // Consider adding error state to show to user
      }
    };

    fetchData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.author.trim()) newErrors.author = "Author is required";
    if (!formData.language) newErrors.language = "Language is required";
    if (!formData.coverImage) newErrors.coverImage = "Cover image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB for images, 10MB for PDFs)
    const maxSize = field === "coverImage" ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
      e.target.value = "";
      setErrors(prev => ({ ...prev, [field]: `File too large (max ${maxSize / (1024 * 1024)}MB)` }));
      return;
    }

    setFormData({ ...formData, [field]: file });
    setErrors(prev => ({ ...prev, [field]: null }));

    if (field === "attachment") {
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
          setTimeout(() => {
            setShowSuccessMessage(true);
          }, 300);
        }
      }, 100);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Show loader using SweetAlert2
    Swal.fire({
      title: 'Submitting...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("isbn", formData.isbn);
    payload.append("description", formData.description);
    payload.append("author", formData.author);
    payload.append("translator", formData.translator);
    payload.append("language", formData.language);
    if (formData.bookDate) {
      payload.append("bookDate", formData.bookDate.toISOString().split("T")[0]);
    }
    payload.append("status", formData.status);
    payload.append("category", formData.category);
    payload.append("isPublished", formData.isPublished);

    if (formData.coverImage) payload.append("coverImage", formData.coverImage);
    if (formData.attachment) payload.append("attachment", formData.attachment);

    try {
      const response = await fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to create book");
      }

      // Success alert
      // Success alert with redirection
      Swal.fire({
        icon: 'success',
        title: 'Book created successfully!',
        showConfirmButton: false,
        timer: 2000,
      }).then(() => {
        navigate("/booklist");
      });


      // Reset form
      setFormData({
        title: "",
        description: "",
        author: "",
        translator: "",
        language: "",
        bookDate: null,
        status: "",
        category: "",
        isbn: "",
        coverImage: null,
        attachment: null,
        isPublished: "true",
      });
      setUploadProgress(0);
      setShowSuccessMessage(false);
      setErrors({});
    } catch (error) {
      console.error("Error creating book:", error);

      // Error alert
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || "Error creating book. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create Book</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="border rounded-md p-6 space-y-4">
              <h2 className="text-lg font-semibold">Book Info</h2>

              <Label htmlFor="coverImage" required>Cover Image</Label>
              <FileUpload
                type="image"
                onChange={(e) => handleFileChange(e, "coverImage")}
                progress={0}
                showSuccessMessage={false}
                required
              />
              {errors.coverImage && <p className="text-red-500 text-sm">{errors.coverImage}</p>}

              <Label htmlFor="attachment">Upload PDF</Label>
              <FileUpload
                type="pdf"
                onChange={(e) => handleFileChange(e, "attachment")}
                progress={uploadProgress}
                showSuccessMessage={showSuccessMessage}
              />

              <Label htmlFor="title" required>Book Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
              {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}

              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
              />
            </div>

            <div className="border rounded-md p-6">
              <Label htmlFor="description">Book Description</Label>
              <ReactQuill
                theme="snow"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                modules={modules}
                formats={formats}
                className="bg-white border rounded-lg min-h-[136px] text-left"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="border rounded-md p-6 space-y-4">
              <Label htmlFor="author" required>Author</Label>
              <Input
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
              />
              {errors.author && <p className="text-red-500 text-sm">{errors.author}</p>}

              <Label htmlFor="translator">Translator</Label>
              <Select
                name="translator"
                value={formData.translator}
                onChange={handleChange}
              >
                <option value="">Select translator</option>
                {translators.map((t) => (
                  <option key={t._id} value={t.name}>{t.name}</option>
                ))}
              </Select>

              <Label htmlFor="language" required>Language</Label>
              <Select
                name="language"
                value={formData.language}
                onChange={handleChange}
                required
              >
                <option value="">Select language</option>
                {languages.map((lang) => (
                  <option key={lang._id} value={lang.language}>{lang.language}</option>
                ))}
              </Select>
              {errors.language && <p className="text-red-500 text-sm">{errors.language}</p>}

              <Label htmlFor="bookDate">Publication Date</Label>
              <div className="relative">
                <DatePicker
                  selected={formData.bookDate}
                  onChange={(date) => setFormData({ ...formData, bookDate: date })}
                  dateFormat="yyyy-MM-dd"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholderText="Select date"
                  maxDate={new Date()}
                  isClearable
                />
                <CalendarIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>

              <Label htmlFor="status">Status</Label>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="">Select status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>

              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />

              <Label htmlFor="isPublished">Publish?</Label>
              <Select
                name="isPublished"
                value={formData.isPublished}
                onChange={handleChange}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white disabled:bg-blue-400 transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : "Create Book"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}