import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Layout from '../../../component/Layout';
import axios from 'axios';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';
import API_BASE_URL from '../../../../config';

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



const CreateTopic = () => {
  const [image, setImage] = useState(null);
  const [topic, setTopic] = useState('');
  const [about, setAbout] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!topic) {
      Swal.fire("Missing Field", "Topic is required!", "warning");
      return;
    }

    const formData = new FormData();
    if (image) formData.append('image', image);
    formData.append('topic', topic);
    formData.append('about', about);
    formData.append('createdOn', new Date().toISOString());

    try {
      Swal.fire({
        title: "Creating Topic...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.post(`${API_BASE_URL}/api/topics`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Topic Created!",
        text: `Successfully created at ${new Date().toLocaleString()}`,
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate("/topic");
      });


      // Reset form
      setTopic('');
      setAbout('');
      setImage(null);
      setImagePreview(null);
      document.getElementById('image-upload').value = '';
    } catch (error) {
      console.error('Error creating topic:', error);
      Swal.fire("Error", "Failed to create topic. Please try again.", "error");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-8">Create Topic</h1>

        {/* Form section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Image Upload */}
          <div className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center bg-white">
            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mb-4 rounded-md object-contain"
                />
              ) : (
                <>
                  <div className="text-4xl mb-4 text-blue-500">📷</div>
                  <p>Click to upload image (optional)</p>
                  <p className="text-sm text-gray-500 mt-1">Supported: JPEG, PNG, GIF</p>
                </>
              )}
            </label>
            <input
              type="file"
              id="image-upload"
              accept="image/jpeg, image/png, image/gif"
              className="hidden"
              onChange={handleImageChange}
            />
            {image && (
              <div className="mt-4 text-sm text-gray-600">
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
              required
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
            onClick={handleSubmit}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-semibold py-3 px-8 rounded-md transition"
          >
            Create Topic
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CreateTopic;