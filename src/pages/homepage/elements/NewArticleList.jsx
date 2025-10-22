import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../../component/Layout";
import { FileText, Eye, Pencil, Trash2 } from "lucide-react";
import API_BASE_URL from "../../../../config";
import Swal from "sweetalert2";

export default function ViewArticle() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/articles`)
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setArticles(data);
                } else {
                    setError("No articles found.");
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching articles:", err);
                setError("Error loading articles.");
                setLoading(false);
            });
    }, []);

    const handleDelete = (id) => {
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

                fetch(`${API_BASE_URL}/api/articles/${id}`, {
                    method: "DELETE",
                })
                    .then((response) => {
                        if (!response.ok) {
                            return response.text().then((text) => {
                                throw new Error(text || "Failed to delete article");
                            });
                        }

                        // Optionally update UI here, e.g., remove from state
                        setArticles((prev) => prev.filter((article) => article.id !== id)); // optional

                        Swal.fire("Deleted!", "Article has been deleted.", "success");
                    })
                    .catch((error) => {
                        console.error("Error deleting article:", error);
                        Swal.fire("Error", `Failed to delete article. ${error.message}`, "error");
                    });
            }
        });
    };


    const filteredArticles = articles.filter((article) => {
        const search = searchTerm.toLowerCase();
        return (
            article.title?.toLowerCase().includes(search) ||
            article.writers?.toLowerCase().includes(search) ||
            article.language?.toLowerCase().includes(search)
        );
    });

    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const paginatedArticles = filteredArticles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const paginate = (page) => {
        setCurrentPage(page);
    };

    return (
        <Layout>
            <div className="p-4 min-h-screen text-gray-800">
                {/* Header and Add Button */}
                <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">
                        Articles Management
                    </h2>
                    <button
                        onClick={() => navigate(`/article`)}
                        className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        Add New Article
                    </button>
                </div>

                {/* Search Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by title, writer or language..."
                        className="w-full sm:max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page
                        }}
                    />
                </div>

                {/* Status messages */}
                {loading && <div className="text-center text-gray-600 mb-4">Loading...</div>}
                {error && <div className="text-center text-red-500 mb-4">{error}</div>}

                {/* Articles Table */}
                {!loading && !error && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300 bg-white shadow-md rounded">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 border-b text-left">Sr</th>
                                        <th className="py-3 px-4 border-b text-left">Title</th>
                                        <th className="py-3 px-4 border-b text-left">Image</th>
                                        <th className="py-3 px-4 border-b text-left">English Description</th>
                                        <th className="py-3 px-4 border-b text-left">Urdu Description</th>
                                        <th className="py-3 px-4 border-b text-left">Writers</th>
                                        <th className="py-3 px-4 border-b text-left">Translators</th>
                                        <th className="py-3 px-4 border-b text-left">Language</th>
                                        <th className="py-3 px-4 border-b text-left">Views</th>
                                        <th className="py-3 px-4 border-b text-left">Date</th>
                                        <th className="py-3 px-4 border-b text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedArticles.map((article, index) => (
                                        <tr key={article.id} className="border-t hover:bg-gray-50">
                                            <td className="py-2 px-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="py-2 px-4">{article.title || "—"}</td>
                                            <td className="py-2 px-4">
                                                <img
                                                    src={`${API_BASE_URL}/api/articles/image/${article.id}`}
                                                    alt="Article"
                                                    className="w-16 h-16 object-cover rounded"
                                                    onError={(e) => (e.target.style.display = "none")}
                                                />
                                            </td>
                                            <td className="py-2 px-4 max-w-xs truncate" title={article.englishDescription}>
                                                {article.englishDescription || "—"}
                                            </td>
                                            <td className="py-2 px-4 max-w-xs truncate" title={article.urduDescription}>
                                                {article.urduDescription || "—"}
                                            </td>
                                            <td className="py-2 px-4">{article.writers || "—"}</td>
                                            <td className="py-2 px-4">{article.translator || "—"}</td>
                                            <td className="py-2 px-4">{article.language || "—"}</td>
                                            <td className="py-2 px-4">{article.views || 0}</td>
                                            <td className="py-2 px-4">{new Date(article.createdOn).toLocaleDateString()}</td>
                                            <td className="py-2 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/viewarticle/article/${article.id}`)}
                                                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/updatearticle/article/${article.id}`)}
                                                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(article.id)}
                                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                {Math.min(currentPage * itemsPerPage, filteredArticles.length)} of {filteredArticles.length} entries
                            </div>
                            <div className="flex flex-wrap gap-1">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-l-md"
                                >
                                    <i className="fas fa-chevron-left" />
                                    <span className="ml-2">Previous</span>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button
                                        key={number}
                                        onClick={() => paginate(number)}
                                        className={`px-4 py-2 text-sm font-medium ${currentPage === number
                                            ? "bg-[#5a6c17] text-white"
                                            : "text-black hover:bg-[#e4e9d0]"
                                            }`}
                                    >
                                        {number}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-r-md"
                                >
                                    <span className="mr-2">Next</span>
                                    <i className="fas fa-chevron-right" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
