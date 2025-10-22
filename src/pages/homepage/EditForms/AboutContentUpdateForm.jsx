import React, {useState } from 'react'
import Layout from '../../../component/Layout'
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Swal from "sweetalert2";
import axios from "axios";

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

const AboutContentUpdateForm = (props) => {
  const [formData, setFormData] = useState({
    englishTitle: props.content.englishTitle,
    urduTitle: props.content.urduTitle,
    englishDescription: props.content.englishDescription,
    urduDescription: props.content.urduDescription,
    image: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    Swal.fire({
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      await axios.put(
        `${process.env.REACT_APP_BASE_URL || "https://newmmdata-backend.onrender.com"}/api/about/${props.content.id}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      props.onSuccess();
      props.onClose();
      Swal.fire("Success", "Content updated successfully.", "success");
    } catch (err) {
      Swal.fire("Error", "Failed to update the content.", "error");
    }
  };

  return (
    <Layout>
       <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">Edit About Content</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">English Title</label>
            <input
              type="text"
              name="englishTitle"
              value={formData.englishTitle}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Urdu Title</label>
            <input
              type="text"
              name="urduTitle"
              value={formData.urduTitle}
              onChange={handleInputChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">English Description</label>
            <ReactQuill
              theme="snow"
              value={formData.englishDescription}
              onChange={(value) => 
                setFormData({...formData, englishDescription: value})
              }
              modules={modules}
              formats={formats}
              className="bg-white border rounded-lg min-h-[200px]"
              style={{ direction: 'ltr', textAlign: 'left' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Urdu Description</label>
            <ReactQuill
              theme="snow"
              value={formData.urduDescription}
              onChange={(value) => 
                setFormData({...formData, urduDescription: value})
              }
              modules={modules}
              formats={formats}
              className="bg-white border rounded-lg min-h-[200px]"
              style={{ direction: 'rtl', textAlign: 'right' }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 p-2 border border-gray-300 rounded w-full"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </form>
    </div>
    </Layout>
  )
}

export default AboutContentUpdateForm