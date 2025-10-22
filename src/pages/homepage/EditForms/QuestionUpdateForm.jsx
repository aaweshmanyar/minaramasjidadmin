import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

const modules = {
  toolbar: [
    [{ font: [] }, { size: [] }],
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
  "font", "size",
  "bold", "italic", "underline", "strike",
  "color", "background",
  "script",
  "header", "align",
  "blockquote", "code-block",
  "list", "bullet", "indent",
  "link", "image", "video"
];

const QuestionUpdateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    questionEnglish: "",
    answerEnglish: "",
    questionUrdu: "",
    answerUrdu: "",
    image: null,
  });

  const [originalData, setOriginalData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const res = await axios.get(`https://api.minaramasjid.com/api/questions/${id}`);
        const data = res.data;

        setFormData({
          questionEnglish: data.questionEnglish || "",
          answerEnglish: data.answerEnglish || "",
          questionUrdu: data.questionUrdu || "",
          answerUrdu: data.answerUrdu || "",
          image: null,
        });

        setOriginalData({
          questionEnglish: data.questionEnglish || "",
          questionUrdu: data.questionUrdu || "",
        });

        if (data.imageUrl) {
          setExistingImageUrl(data.imageUrl);
        }

      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to load question details", "error");
      }
    };

    fetchQuestion();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setExistingImageUrl(null);

      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\u0600-\u06FF]+/g, "") // remove Urdu characters
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleUpdate = async () => {
    const { questionEnglish, answerEnglish, questionUrdu, answerUrdu, image } = formData;

    if (!questionEnglish || !answerEnglish || !questionUrdu || !answerUrdu) {
      Swal.fire("Missing Field", "Please fill all question and answer fields!", "warning");
      return;
    }

    const data = new FormData();
    data.append("questionEnglish", questionEnglish);
    data.append("answerEnglish", answerEnglish);
    data.append("questionUrdu", questionUrdu);
    data.append("answerUrdu", answerUrdu);
    data.append("updatedOn", new Date().toISOString());
    if (image) data.append("image", image);

    const englishChanged = questionEnglish !== originalData.questionEnglish;
    const urduChanged = questionUrdu !== originalData.questionUrdu;

    if (englishChanged && urduChanged) {
      data.append("slug", generateSlug(questionEnglish));
    } else if (englishChanged) {
      data.append("slug", generateSlug(questionEnglish));
    } else if (urduChanged) {
      data.append("slug", generateSlug(questionUrdu));
    }

    try {
      Swal.fire({
        title: "Updating Question...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.patch(`https://api.minaramasjid.com/api/questions/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.close();
      Swal.fire("Success", "Question updated successfully!", "success").then(() => {
        navigate("/questionlist");
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update question", "error");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold mb-8">Update Question</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center bg-white">
            <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:underline">
              Click to upload image
            </label>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {(imagePreview || existingImageUrl) && (
              <div className="mt-4 w-full max-w-xs">
                <img
                  src={imagePreview || existingImageUrl}
                  alt="Preview"
                  className="rounded-md"
                />
              </div>
            )}

            {(formData.image || existingImageUrl) && (
              <div className="mt-2 text-sm text-gray-600">
                {formData.image ? `Selected: ${formData.image.name}` : "Existing Image"}
                <button
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, image: null }));
                    setImagePreview(null);
                    setExistingImageUrl(null);
                    document.getElementById("image-upload").value = '';
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-md shadow">
            <label className="block text-gray-700 font-semibold mb-2">
              English Question<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="questionEnglish"
              value={formData.questionEnglish}
              onChange={handleChange}
              placeholder="Enter English Question"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="bg-white p-6 rounded-md shadow">
            <label className="block text-gray-700 font-semibold mb-2">English Answer</label>
            <ReactQuill
              theme="snow"
              value={formData.answerEnglish}
              onChange={(value) => setFormData((prev) => ({ ...prev, answerEnglish: value }))}
              modules={modules}
              formats={formats}
              className="bg-white border border-gray-300 rounded-md min-h-[136px]"
              style={{ direction: "ltr", textAlign: "left" }}
            />
          </div>

          <div className="bg-white p-6 rounded-md shadow">
            <label className="block text-gray-700 font-semibold mb-2">
              Urdu Question<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="questionUrdu"
              value={formData.questionUrdu}
              onChange={handleChange}
              placeholder="اردو سوال درج کریں"
              className="w-full p-3 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-green-400"
              dir="rtl"
            />
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-md shadow">
          <label className="block text-gray-700 font-semibold mb-2">Urdu Answer</label>
          <ReactQuill
            theme="snow"
            value={formData.answerUrdu}
            onChange={(value) => setFormData((prev) => ({ ...prev, answerUrdu: value }))}
            modules={modules}
            formats={formats}
            className="bg-white border border-gray-300 rounded-md min-h-[136px]"
            style={{ direction: "rtl", textAlign: "right" }}
          />
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleUpdate}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            Update Question
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default QuestionUpdateForm;
