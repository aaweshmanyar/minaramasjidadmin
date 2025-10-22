import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import Layout from "../../../component/Layout";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../../../config";

// Custom fonts for Urdu/English text
const Font = Quill.import("formats/font");
Font.whitelist = [
    "sans-serif", "serif", "monospace",
    "Amiri", "Rubik-Bold", "Rubik-Light",
    "Scheherazade-Regular", "Scheherazade-Bold",
    "Aslam", "Mehr-Nastaliq"
];
Quill.register(Font, true);

const modules = {
    toolbar: [
        [{ font: Font.whitelist }, { size: [] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["link", "image", "video"],
        ["clean"]
    ]
};

const formats = [
    "font", "size", "bold", "italic", "underline", "strike",
    "color", "background", "script", "header", "align",
    "blockquote", "code-block", "list", "bullet",
    "indent", "link", "image", "video", "clean"
];

const CreateAboutContent = () => {
    const [formData, setFormData] = useState({
        englishTitle: "",
        urduTitle: "",
        englishDescription: "",
        urduDescription: "",
        image: null
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();

        if (!formData.image) {
            Swal.fire("Error", "Image is required.", "error");
            return;
        }

        const form = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            form.append(key, value);
        });

        Swal.fire({
            title: "Submitting...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            await axios.post(`${API_BASE_URL}/api/about`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setFormData({
                englishTitle: "",
                urduTitle: "",
                englishDescription: "",
                urduDescription: "",
                image: null,
            });

            Swal.fire("Success", "Content added successfully.", "success");
        } catch (err) {
            Swal.fire("Error", "Failed to add the content.", "error");
        }
    };

    return (
        <Layout>
            <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">← Back</button>
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6">Create About Content</h2>
                <form onSubmit={handleAddSubmit} className="space-y-6">
                    {/* Image Upload */}
                    <div className="border border-dashed border-gray-300 p-6 text-center rounded-lg">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex flex-col items-center space-y-2">
                                <i className="fas fa-image text-2xl text-gray-500"></i>
                                <p className="text-gray-500">Drop your image here, or click to browse</p>
                                <p className="text-sm text-gray-400">Supported formats: PNG, JPG, GIF (max 5MB)</p>
                                <button type="button" className="mt-2 px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200">
                                    Browse Files
                                </button>
                            </div>
                        </label>
                    </div>

                    {/* English Title */}
                    <input
                        type="text"
                        name="englishTitle"
                        value={formData.englishTitle}
                        onChange={handleChange}
                        placeholder="Enter your English Title"
                        className="w-full p-3 border rounded"
                        required
                    />

                    {/* English Description */}
                    <div>
                        <label className="block text-sm font-medium">English Description</label>
                        <ReactQuill
                            value={formData.englishDescription}
                            onChange={value => setFormData(prev => ({ ...prev, englishDescription: value }))}
                            modules={modules}
                            formats={formats}
                            className="bg-white border rounded"
                        />
                    </div>

                    {/* Urdu Title */}
                    <input
                        type="text"
                        name="urduTitle"
                        value={formData.urduTitle}
                        onChange={handleChange}
                        placeholder="Enter your Urdu Title"
                        className="w-full p-3 border rounded text-right"
                        required
                    />

                    {/* Urdu Description */}
                    <div>
                        <label className="block text-sm font-medium text-right">Urdu Description</label>
                        <ReactQuill
                            value={formData.urduDescription}
                            onChange={value => setFormData(prev => ({ ...prev, urduDescription: value }))}
                            modules={modules}
                            formats={formats}
                            className="bg-white border rounded"
                            style={{ direction: 'rtl', textAlign: 'right' }}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="reset"
                            onClick={() => setFormData({
                                englishTitle: "",
                                urduTitle: "",
                                englishDescription: "",
                                urduDescription: "",
                                image: null
                            })}
                            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CreateAboutContent;
