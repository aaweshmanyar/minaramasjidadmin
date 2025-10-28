import { useEffect, useState } from "react";
import Layout from "../../../component/Layout";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UserPlus, Pencil, Eye, Trash2, Search, Users, FileText, Layers, ChevronLeft, ChevronRight } from "lucide-react";
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

        fetch(`${API_BASE_URL}/api/writers/${id}`, { method: "DELETE" })
          .then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                throw new Error(text || "Failed to delete writer");
              });
            }
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

  // ---- derived UI counts (non-intrusive) ----
  const countTotal = writers.length;
  const countTeam = writers.filter((w) => w.isTeamMember === 1 || w.isTeamMember === true).length;
  const countWithBio = writers.filter((w) => (w.englishDescription && w.englishDescription.trim()) || (w.urduDescription && w.urduDescription.trim())).length;

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Writer Management</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add, search, and manage writers. Clean table, quick actions, and crisp pagination.
            </p>
          </div>

          <button
            onClick={() => navigate(`/createwriter`)}
            className="inline-flex items-center gap-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all"
          >
            <UserPlus className="w-5 h-5" />
            Add New Writer
          </button>
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Users className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-bold text-gray-800">{countTotal}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Layers className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">Team Members</div>
              <div className="text-xl font-bold text-gray-800">{countTeam}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <FileText className="w-9 h-9 p-2 rounded-lg bg-gray-100" />
            <div>
              <div className="text-xs text-gray-500">With Bio</div>
              <div className="text-xl font-bold text-gray-800">{countWithBio}</div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="font-medium text-sm text-gray-700">
              Show
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/30"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search writer name, designation, or bio..."
              className="border border-gray-300 pl-10 pr-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#5a6c17]/30"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-gray-50 sticky top-0 z-[1]">
                <tr className="text-left text-sm font-semibold text-gray-700">
                  <th className="p-3 border-b">Image</th>
                  <th className="p-3 border-b">Name</th>
                  <th className="p-3 border-b">Designation</th>
                  <th className="p-3 border-b">English Description</th>
                  <th className="p-3 border-b">Urdu Description</th>
                  <th className="p-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWriters.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-10 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-lg font-semibold">No writers found</div>
                        <div className="text-sm">Try a different search or add a new writer.</div>
                        <button
                          onClick={() => navigate(`/createwriter`)}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Writer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWriters.map((writer, idx) => {
                    const eng = stripHtml(writer.englishDescription || "");
                    const urd = stripHtml(writer.urduDescription || "");
                    const isTeam = writer.isTeamMember === 1 || writer.isTeamMember === true;

                    return (
                      <tr
                        key={writer.id}
                        className={`text-sm ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-[#f4f6ec] transition-colors`}
                      >
                        <td className="p-3 align-top">
                          <div className="flex items-center gap-3">
                            <img
                              src={`${API_BASE_URL}/api/writers/image/${writer.id}`}
                              alt={writer.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                          </div>
                        </td>

                        <td className="p-3 align-top">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">{writer.name}</div>
                            {isTeam && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e4e9d0] text-[#5a6c17] border border-[#5a6c17]/20">
                                Team
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {writer.id}</div>
                        </td>

                        <td className="p-3 align-top">
                          <div className="inline-flex items-center max-w-[220px] truncate" title={writer.designation}>
                            <span className="truncate">{writer.designation}</span>
                          </div>
                        </td>

                        <td className="p-3 align-top" title={eng}>
                          <div
                            className="text-gray-700 max-w-[380px]"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {eng}
                          </div>
                        </td>

                        <td className="p-3 align-top text-right" title={urd} dir="rtl">
                          <div
                            className="text-gray-700 max-w-[380px]"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {urd}
                          </div>
                        </td>

                        <td className="p-3 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/writers/${writer.id}`)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/writers-update/${writer.id}`)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteWriter(writer.id)}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER: RESULTS + PAGINATION */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {filteredWriters.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredWriters.length)} of{" "}
              {filteredWriters.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <button
                  key={number}
                  onClick={() => goToPage(number)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    currentPage === number
                      ? "bg-[#5a6c17] text-white border-[#5a6c17]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white disabled:opacity-50"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- Your existing (commented) modal stays as-is below --- */}
        {/* {editModalOpen && editData && ( ... )} */}
      </div>
    </Layout>
  );
}
