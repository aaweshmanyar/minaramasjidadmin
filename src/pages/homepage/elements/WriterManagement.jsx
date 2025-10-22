import { useEffect, useState } from "react";
import Layout from "../../../component/Layout";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { UserPlus, Pencil, Eye, Trash2 } from "lucide-react";
import API_BASE_URL from "../../../../config";


export default function WriterManagement() {
  const [writers, setWriters] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // const [editModalOpen, setEditModalOpen] = useState(false);
  // const [editData, setEditData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/writers`)
      .then((res) => res.json())
      .then((data) => setWriters(data))
      .catch((error) => console.error("Error fetching writers:", error));
  }, []);

  const filteredWriters = writers.filter(
    (writer) =>
      writer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      writer.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (writer.englishDescription &&
        writer.englishDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (writer.urduDescription &&
        writer.urduDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredWriters.length / pageSize);
  const paginatedWriters = filteredWriters.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const openEditModal = (writer) => {
    setEditData(writer);
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      setEditData((prev) => ({ ...prev, newImage: files[0] }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // const handleSaveEdit = () => {
  //   const formData = new FormData();
  //   formData.append('name', editData.name);
  //   formData.append('designation', editData.designation);
  //   formData.append('englishDescription', editData.englishDescription);
  //   formData.append('urduDescription', editData.urduDescription);
  //   formData.append('isTeamMember', editData.isTeamMember || 0);

  //   if (editData.newImage) {
  //     formData.append('image', editData.newImage);
  //   }

  //   Swal.fire({
  //     title: 'Updating...',
  //     allowOutsideClick: false,
  //     didOpen: () => {
  //       Swal.showLoading();
  //     },
  //   });

  //   fetch(`https://newmmdata-backend.onrender.com/api/writers/${editData.id}`, {
  //     method: "PUT",
  //     body: formData,
  //   })
  //     .then((res) => {
  //       if (!res.ok) throw new Error("Failed to update writer");
  //       return res.json();
  //     })
  //     .then((updatedWriter) => {
  //       setWriters((prev) =>
  //         prev.map((w) => (w.id === updatedWriter.id ? updatedWriter : w))
  //       );
  //       setEditModalOpen(false);

  //       Swal.fire("Success", "Writer updated successfully!", "success")
  //         .then(() => {
  //           window.location.reload(); // Reload the page after confirmation
  //         });
  //     })
  //     .catch((error) => {
  //       console.error("Error updating writer:", error);
  //       Swal.fire("Error", "An error occurred while updating.", "error");
  //     });
  // };

  const handleDeleteWriter = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Deleting...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        fetch(`${API_BASE_URL}/api/writers/${id}`, {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                throw new Error(text || "Failed to delete writer");
              });
            }

            // Remove writer from state
            setWriters((prev) => prev.filter((w) => w.id !== id));

            Swal.fire("Deleted!", "Writer has been deleted.", "success");
          })
          .catch((error) => {
            console.error("Error deleting writer:", error);
            Swal.fire("Error", `Failed to delete writer. ${error.message}`, "error");
          });
      }
    });
  };

  const stripHtml = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };


  return (
    <Layout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Top controls */}


        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          {/* Left: Heading */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-8000">Writer Management</h2>

          {/* Right: Add Button */}
          <button
            onClick={() => navigate(`/createwriter`)}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add New Writer
          </button>

        </div>

        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="font-medium">
              Show:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border px-2 py-1 rounded focus:outline-none focus:ring"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search writer..."
            className="border px-3 py-1 rounded w-full sm:w-64 focus:outline-none focus:ring"
            style={{ borderColor: '#5a6c17' }}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />

        </div>


        {/* Table */}
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full min-w-[900px] border border-gray-300">
            <thead className="bg-gray-50 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="text-left p-3 border text-lg">Image</th> {/* 👈 New Column */}
                <th className="text-left p-3 border text-lg">Name</th>
                <th className="text-left p-3 border text-lg">Designation</th>
                <th className="text-left p-3 border text-lg">English Description</th>
                <th className="text-left p-3 border text-lg">Urdu Description</th>
                <th className="text-left p-3 border text-lg">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedWriters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500"> {/* 👈 changed colSpan to 6 */}
                    No writers found
                  </td>
                </tr>
              ) : (
                paginatedWriters.map((writer) => (
                  <tr key={writer.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 border text-lg">
                      <img
                        src={`${API_BASE_URL}/api/writers/image/${writer.id}`} // 👈 Update API route
                        alt={writer.name}
                        className="w-12 h-12 object-cover"
                      />
                    </td>
                    <td className="p-3 border text-lg">{writer.name}</td>
                    <td className="p-3 border text-lg">{writer.designation}</td>
                    <td className="p-3 border text-lg" title={stripHtml(writer.englishDescription)}>
                      {stripHtml(writer.englishDescription).length > 300
                        ? `${stripHtml(writer.englishDescription).substring(0, 300)}...`
                        : stripHtml(writer.englishDescription)}
                    </td>

                    <td className="p-3 border text-lg text-right" title={stripHtml(writer.urduDescription)}>
                      {stripHtml(writer.urduDescription).length > 300
                        ? `${stripHtml(writer.urduDescription).substring(0, 300)}...`
                        : stripHtml(writer.urduDescription)}
                    </td>


                    <td className="p-3 border text-lg">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/writers/${writer.id}`)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/writers-update/${writer.id}`)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteWriter(writer.id)}
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing{" "}
            {filteredWriters.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}{" "}
            to{" "}
            {Math.min(currentPage * pageSize, filteredWriters.length)} of{" "}
            {filteredWriters.length} entries
          </div>

          {/* Pagination Controls */}
          <div className="flex rounded-md shadow-sm -space-x-px">
            {/* Previous Button */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50"
            >
              <i className="fas fa-chevron-left"></i>
               <span className="ml-2">Previous</span>
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => goToPage(number)}
                className={`px-4 py-2 text-sm font-medium ${currentPage === number
                    ? "bg-[#5a6c17] text-white"
                    : "text-black hover:bg-[#e4e9d0]"
                  }`}
              >
                {number}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50"
            >
              <span className="mr-2">Next</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>



        {/* {editModalOpen && editData && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div
              className="bg-white rounded-lg w-full max-w-lg shadow-lg transition-all duration-300 ease-out transform scale-100 opacity-100"
            >
              <div className="max-h-[90vh] overflow-y-auto p-6">
                <h2 className="text-xl font-semibold mb-4">Edit Writer</h2>
                <div className="space-y-4">
                
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="image">Image</label>
                    <input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          newImage: e.target.files[0],
                        }))
                      }
                      className="w-full border px-3 py-2 rounded focus:ring"
                    />
                  </div>

             
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                        className="w-full border px-3 py-2 rounded focus:ring"
                        placeholder="Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" htmlFor="designation">Designation</label>
                      <input
                        id="designation"
                        type="text"
                        name="designation"
                        value={editData.designation}
                        onChange={handleEditChange}
                        className="w-full border px-3 py-2 rounded focus:ring"
                        placeholder="Designation"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">English Description</label>
                    <ReactQuill
                      value={editData.englishDescription}
                      onChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          englishDescription: value,
                        }))
                      }
                      theme="snow"
                      modules={modules}
                      formats={formats}
                      className="bg-white border rounded-lg min-h-[136px]"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                    />
                  </div>

        
                  <div>
                    <label className="block text-sm font-medium mb-1">Urdu Description</label>
                    <ReactQuill
                      value={editData.urduDescription}
                      onChange={(value) =>
                        setEditData((prev) => ({
                          ...prev,
                          urduDescription: value,
                        }))
                      }
                      theme="snow"
                      modules={modules}
                      formats={formats}
                      className="bg-white border rounded-lg min-h-[136px]"
                      style={{ direction: 'rtl', textAlign: 'right' }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )} */}

      </div>
    </Layout>
  );
}
