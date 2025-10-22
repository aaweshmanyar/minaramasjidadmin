import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import API_BASE_URL from "../../../../config";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/feedback`);
        const filtered = res.data.filter(item => item.isDeleted?.data?.[0] === 0);
        setFeedbacks(filtered);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to fetch feedback.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFeedbacks = feedbacks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(feedbacks.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-center mb-8">User Feedback</h2>

        {loading && <p className="text-center text-gray-500">Loading feedbacks...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && feedbacks.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border rounded-lg shadow-md">
                <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-left">Feedback</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Submitted</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentFeedbacks.map((feedback) => (
                    <tr key={feedback.id}>
                      <td className="px-6 py-4 text-sm text-gray-600">{feedback.feedback}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{feedback.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{feedback.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(feedback.createdOn).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              {/* Showing X to Y of Z */}
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, feedbacks.length)} of {feedbacks.length} entries
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-l ${currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  <i className="fas fa-chevron-left"></i>
                  <span className="ml-2">Previous</span>
                </button>

                {/* Page Numbers */}
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-4 py-2 text-sm font-medium ${currentPage === pageNumber
                      ? 'bg-[#5a6c17] text-white'
                      : 'text-black hover:bg-[#e4e9d0]'
                      }`}
                  >
                    {pageNumber}
                  </button>
                ))}


                {/* Next Button */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-r ${currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  <span className="mr-2">Next</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

          </>
        )}

        {!loading && !error && feedbacks.length === 0 && (
          <p className="text-center text-gray-500">No feedback found.</p>
        )}
      </div>
    </Layout>
  );
};

export default FeedbackList;
