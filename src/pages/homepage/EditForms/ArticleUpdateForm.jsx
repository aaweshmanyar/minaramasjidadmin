import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import Layout from '../../../component/Layout';
import { FiUpload as CloudUploadIcon, FiFileText as FileText } from "react-icons/fi";


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

const ArticleUpdateForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [coverImage, setCoverImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        englishDescription: "",
        urduDescription: "",
    });

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await axios.get(`https://api.minaramasjid.com/api/articles/${id}`);
                const data = res.data;
                setFormData({
                    title: data.title || "",
                    englishDescription: data.englishDescription || "",
                    urduDescription: data.urduDescription || "",
                });
                setPreview(data.coverImageUrl || null);
            } catch (error) {
                Swal.fire("Error", "Failed to load article data", "error");
            }
        };

        fetchArticle();
    }, [id]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            Swal.fire("Error", "Please select a valid image file", "error");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire("Error", "Image must be under 5MB", "error");
            return;
        }

        setCoverImage(file);

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleContentChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            Swal.fire("Error", "Title is required", "error");
            return;
        }

        Swal.fire({
            title: "Updating article...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const formDataToSend = new FormData();
        formDataToSend.append("title", formData.title);
        formDataToSend.append("englishDescription", formData.englishDescription);
        formDataToSend.append("urduDescription", formData.urduDescription);

        if (coverImage) {
            formDataToSend.append("image", coverImage); // Match the backend's expected field name

        }

        try {
            const res = await axios.patch(`https://api.minaramasjid.com/api/articles/${id}`, formDataToSend);

            Swal.close();

            Swal.fire("Success", "Article updated successfully!", "success").then(() => {
                navigate("/viewarticle");
            });

        } catch (error) {
            Swal.close();
            Swal.fire("Error", error.response?.data?.message || error.message || "Something went wrong", "error");
        }
    };

    return (
        <Layout>
            <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">← Back</button>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Update Article</h1>
                    <p className="text-gray-500">Edit the article's information</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-md rounded-md overflow-hidden">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <h3 className="text-base font-medium mb-4">Cover Image</h3>
                                <label
                                    htmlFor="cover-upload"
                                    className="relative border-2 border-dashed border-gray-300 rounded w-48 h-48 flex items-center justify-center cursor-pointer overflow-hidden group"
                                >
                                    {preview ? (
                                        <img src={preview} alt="Cover" className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                            <CloudUploadIcon className="h-10 w-10 text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">Click to upload</p>
                                        </div>
                                    )}
                                    <input
                                        id="cover-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </label>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Title <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        id="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4" />
                                        <label className="text-sm font-medium">English Description</label>
                                    </div>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.englishDescription}
                                        onChange={(val) => handleContentChange("englishDescription", val)}
                                        modules={modules}
                                        formats={formats}
                                        className="bg-white border rounded-lg min-h-[136px]"
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
                                        value={formData.urduDescription}
                                        onChange={(val) => handleContentChange("urduDescription", val)}
                                        modules={modules}
                                        formats={formats}
                                        className="bg-white border rounded-lg min-h-[136px]"
                                        style={{ direction: 'rtl', textAlign: 'right' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
                        >
                            Update Article
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default ArticleUpdateForm;
