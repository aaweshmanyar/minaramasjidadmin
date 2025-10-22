import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from '../../../component/Layout';
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';

const modules = {
  toolbar: [
    [{ 'font': [] }, { 'size': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']
  ]
};

const formats = [
  'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'header', 'align',
  'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'link', 'image', 'video'
];

const TopicUpdateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [image, setImage] = useState(null);
  const [topic, setTopic] = useState('');
  const [about, setAbout] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await axios.get(`https://api.minaramasjid.com/api/topics/${id}`);
        const data = res.data;
        setTopic(data.topic);
        setAbout(data.about);
        // Do NOT set imagePreview from server
        // setImagePreview(data.image); ❌
      } catch (err) {
        Swal.fire("Error", "Failed to load topic details", "error");
      }
    };

    fetchTopic();
  }, [id]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // ✅ Only for new file
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    if (!topic) {
      Swal.fire("Missing Field", "Topic is required!", "warning");
      return;
    }

    const formData = new FormData();
    if (image) formData.append('image', image);
    formData.append('topic', topic);
    formData.append('about', about);
    formData.append('updatedOn', new Date().toISOString());

    try {
      Swal.fire({
        title: "Updating Topic...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.put(`https://api.minaramasjid.com/api/topics/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.close();
      Swal.fire("Success", "Topic updated successfully!", "success").then(() => {
        navigate('/topic');
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update topic", "error");
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
        <h1 className="text-2xl font-bold mb-8">Update Topic</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Upload */}
          <div className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center bg-white">
            <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:underline">
              Click to upload image
            </label>
            <input
              type="file"
              id="image-upload"
              accept="image/jpeg, image/png, image/gif"
              className="hidden"
              onChange={handleImageChange}
            />

            {imagePreview && (
              <div className="mt-4 w-full max-w-xs">
                <img src={imagePreview} alt="Preview" className="rounded-md" />
              </div>
            )}

            {image && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: {image.name}
                <button
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    document.getElementById('image-upload').value = '';
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Topic Input */}
          <div className="bg-white p-6 rounded-md shadow">
            <label className="block text-gray-700 font-semibold mb-2">
              Topic<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter topic title"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* About Textarea */}
        <div className="mt-8 bg-white p-6 rounded-md shadow">
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">About</label>
            <ReactQuill
              theme="snow"
              value={about}
              onChange={setAbout}
              modules={modules}
              formats={formats}
              className="bg-white border border-gray-300 rounded-md min-h-[136px]"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end mt-8">
          <button
            onClick={handleUpdate}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            Update Topic
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default TopicUpdateForm;
