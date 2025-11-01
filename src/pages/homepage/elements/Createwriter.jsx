import React, { useState } from "react";
import { UploadCloud, FileText, CalendarDays, Mail, User, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import API_BASE_URL from "../../../../config";

/* ---------- Quill font whitelist ---------- */
const Font = Quill.import("formats/font");
Font.whitelist = [
  "sans-serif",
  "serif",
  "monospace",
  "Amiri",
  "Rubik-Bold",
  "Rubik-Light",
  "Scheherazade-Regular",
  "Scheherazade-Bold",
  "Aslam",
  "Mehr-Nastaliq",
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
    ["clean"],
  ],
};

const formats = [
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "header",
  "align",
  "blockquote",
  "code-block",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "clean",
];

export default function CreateWriterForm() {
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    email: "",
    joinedDate: "",    // YYYY-MM-DD
    status: "Active",  // "Active" | "InActive"
    englishDescription: "",
    urduDescription: "",
  });

  const navigate = useNavigate();

  /* ---------- Handlers ---------- */
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\//)) {
      Swal.fire("Error", "Please select an image file (JPEG, PNG, etc.)", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire("Error", "Image size should be less than 5MB", "error");
      return;
    }

    setProfilePic(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleDescriptionChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return "Please enter the writer name.";
    if (!formData.email.trim()) return "Please enter an email.";
    // simple email check
    const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
    if (!okEmail) return "Please enter a valid email address.";
    if (!formData.joinedDate) return "Please select the joined date.";
    if (!["Active", "InActive"].includes(formData.status)) return "Please select a valid status.";
    return null;
    // (designation and descriptions are optional by design)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      Swal.fire("Error", err, "error");
      return;
    }

    setSubmitting(true);
    Swal.fire({
      title: "Creating writer...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("designation", formData.designation);
      payload.append("email", formData.email);
      payload.append("joinedDate", formData.joinedDate);
      payload.append("status", formData.status);
      payload.append("englishDescription", formData.englishDescription);
      payload.append("urduDescription", formData.urduDescription);
      payload.append("isTeamMember", isTeamMember ? "true" : "false");
      if (profilePic) payload.append("image", profilePic);

      const res = await fetch(`http://localhost:5000/api/writers`, { method: "POST", body: payload });
      if (!res.ok) {
        let msg = "Failed to create writer";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch (_) {}
        throw new Error(msg);
      }

      Swal.fire({
        icon: "success",
        title: "Writer Created Successfully!",
        text: `Created at: ${new Date().toLocaleString()}`,
        timer: 1800,
        showConfirmButton: false,
      }).then(() => navigate("/writers"));

      // reset
      setFormData({
        name: "",
        designation: "",
        email: "",
        joinedDate: "",
        status: "Active",
        englishDescription: "",
        urduDescription: "",
      });
      setIsTeamMember(false);
      setProfilePic(null);
      setPreview(null);
    } catch (error) {
      Swal.fire("Error!", error.message || "Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const clearImage = () => {
    setProfilePic(null);
    setPreview(null);
  };

  /* ---------- UI ---------- */
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Create Writer</h1>
          <p className="text-gray-500">Add a new writer/ulema profile with details and bio.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-sm border rounded-2xl overflow-hidden">
          {/* Top grid */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar */}
            <div>
              <h3 className="text-base font-semibold mb-3">Profile Picture</h3>
              <label
                htmlFor="profile-upload"
                className="relative border-2 border-dashed border-gray-300 rounded-2xl w-48 h-48 flex items-center justify-center cursor-pointer overflow-hidden group mx-auto"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="object-cover w-full h-full" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Click to upload (max 5MB)</p>
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
              {preview && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={clearImage}
                    className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="lg:col-span-2 space-y-5">
              {/* Team Member + Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 flex items-center justify-between border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Team Member</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="isTeamMember"
                      checked={isTeamMember}
                      onChange={(e) => setIsTeamMember(e.target.checked)}
                      className="h-4 w-4 text-[#5a6c17] border-gray-300 rounded"
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/50"
                  >
                    <option value="Active">Active</option>
                    <option value="InActive">InActive</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="joinedDate" className="block text-sm font-medium text-gray-700">
                    Joined Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="joinedDate"
                      type="date"
                      value={formData.joinedDate}
                      onChange={handleChange}
                      className="mt-1 w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/50"
                    />
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/50"
                    required
                  />
                </div>
              </div>

              {/* Email + Designation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                    Designation
                  </label>
                  <input
                    id="designation"
                    placeholder="Enter designation (optional)"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editors */}
          <div className="px-6 pb-6 space-y-6">
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
                className="bg-white border rounded-xl min-h-[220px]"
                style={{ direction: "ltr", textAlign: "left" }}
                placeholder="Short bio, achievements, publications, etc."
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
                className="bg-white border rounded-xl min-h-[220px]"
                style={{ direction: "rtl", textAlign: "right" }}
                placeholder="اردو میں مختصر تعارف، کارنامے، تصانیف وغیرہ"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  name: "",
                  designation: "",
                  email: "",
                  joinedDate: "",
                  status: "Active",
                  englishDescription: "",
                  urduDescription: "",
                });
                setIsTeamMember(false);
                clearImage();
              }}
              className="px-4 py-2 border rounded-lg hover:bg-white"
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.9)] text-white rounded-lg disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create Writer"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
