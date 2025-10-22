import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CloudUploadIcon, FileText } from "lucide-react";
import Layout from '../../../component/Layout'
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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


const WriterUpdateForm = () => {

    const { id } = useParams(); // writer ID from route
    const [isTeamMember, setIsTeamMember] = useState(false);
    const [profilePic, setProfilePic] = useState(null);
    const [preview, setPreview] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        englishDescription: "",
        urduDescription: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchWriter = async () => {
            try {
                const res = await fetch(`https://api.minaramasjid.com/api/writers/${id}`);
                const data = await res.json();
                setFormData({
                    name: data.name || "",
                    designation: data.designation || "",
                    englishDescription: data.englishDescription || "",
                    urduDescription: data.urduDescription || ""
                });
                setIsTeamMember(data.isTeamMember || false);
                setPreview(data.imageUrl); // assuming `imageUrl` is returned
            } catch (err) {
                Swal.fire('Error', 'Failed to load writer data', 'error');
            }
        };

        fetchWriter();
    }, [id]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            Swal.fire('Error', 'Please select an image file (JPEG, PNG, etc.)', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire('Error', 'Image size should be less than 5MB', 'error');
            return;
        }

        setProfilePic(file);

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

    const handleDescriptionChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

   const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
        Swal.fire('Error', 'Please enter the writer name', 'error');
        return;
    }

    Swal.fire({
        title: 'Updating writer...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("designation", formData.designation);
    formDataToSend.append("englishDescription", formData.englishDescription);
    formDataToSend.append("urduDescription", formData.urduDescription);
    formDataToSend.append("isTeamMember", isTeamMember);
    if (profilePic) {
        formDataToSend.append("image", profilePic);
    }

    try {
        const response = await fetch(`https://api.minaramasjid.com/api/writers/${id}`, {
            method: "PUT",
            body: formDataToSend,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update writer");
        }

        Swal.fire({
            icon: 'success',
            title: 'Writer Updated Successfully!',
            text: `Updated at: ${new Date().toLocaleString()}`,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            navigate('/writers');
        });

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || "Something went wrong.",
        });
    }
};



    return (
        <Layout>
            <button
                onClick={() => navigate(-1)}
                className="mb-4 text-blue-600 hover:underline"
            >
                ← Back
            </button>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold tracking-tight">Update Writer</h1>
                    <p className="text-gray-500">Edit the writer’s information</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-md rounded-md overflow-hidden">
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <h3 className="text-base font-medium mb-4">Profile Pic</h3>
                                <label
                                    htmlFor="profile-upload"
                                    className="relative border-2 border-dashed border-gray-300 rounded-full w-48 h-48 flex items-center justify-center cursor-pointer overflow-hidden group"
                                >
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="object-cover w-full h-full rounded-full"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                            <CloudUploadIcon className="h-10 w-10 text-gray-400 mb-2" />
                                            <p className="text-xs text-gray-500">Click to upload</p>
                                        </div>
                                    )}
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </label>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-medium">Team Member</h3>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="isTeamMember"
                                            checked={isTeamMember}
                                            onChange={(e) => setIsTeamMember(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="isTeamMember" className="text-sm text-gray-700">
                                            Check if team member
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Name <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                                        Designation
                                    </label>
                                    <input
                                        id="designation"
                                        value={formData.designation}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        onChange={(value) => handleDescriptionChange("englishDescription", value)}
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
                                        onChange={(value) => handleDescriptionChange("urduDescription", value)}
                                        modules={modules}
                                        formats={formats}
                                        className="bg-white border rounded-lg min-h-[136px] text-right"
                                        style={{ direction: 'rtl', textAlign: 'right' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="submit"
                            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
                        >
                            Update Writer
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    )
}

export default WriterUpdateForm