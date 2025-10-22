import React, { useEffect, useState } from 'react';
import Layout from '../../../component/Layout';
import API_BASE_URL from '../../../../config';

const ViewArticleList = () => {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [articlesPerPage] = useState(10);
  const [totalArticles, setTotalArticles] = useState(0);
  const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/articles`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setArticles(data.articles || []);
      setTotalArticles(data.articles?.length || 0); // optional if you still want to track count
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchArticles();
}, []); // Empty dependency array = fetch only once on mount


  const totalPages = Math.ceil(totalArticles / articlesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Articles</h1>
        
        {loading ? (
          <p>Loading articles...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
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
                </tr>
              </thead>
              <tbody>
                {articles.length > 0 ? (
                  articles.map((article, index) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{(currentPage - 1) * articlesPerPage + index + 1}</td>
                      <td className="py-3 px-4 border-b">{article.title}</td>
                      <td className="py-3 px-4 border-b">
                        <img
                          src={`${API_BASE_URL}/api/articles/image/${article.id}`}
                          alt={article.title}
                          className="w-13 h-auto object-cover"
                        />
                      </td>
                      <td className="py-3 px-4 border-b">
                        {article.englishDescription?.length > 100
                          ? `${article.englishDescription.substring(0, 100)}...`
                          : article.englishDescription || ""}
                      </td>
                      <td className="py-3 px-4 border-b">
                        {article.urduDescription?.length > 100
                          ? `${article.urduDescription.substring(0, 100)}...`
                          : article.urduDescription || ""}
                      </td>
                      <td className="py-3 px-4 border-b">{article.writers}</td>
                      <td className="py-3 px-4 border-b">{article.translator}</td>
                      <td className="py-3 px-4 border-b">{article.language}</td>
                      <td className="py-3 px-4 border-b">{article.views}</td>
                      <td className="py-3 px-4 border-b">
                        {new Date(article.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-6 text-gray-500">
                      No articles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * articlesPerPage) + 1} to{' '}
            {Math.min(currentPage * articlesPerPage, totalArticles)} of {totalArticles} entries
          </div>

          {totalPages > 0 && (
            <div className="flex space-x-1">
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                &laquo;
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                &lsaquo;
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 rounded border text-sm ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ViewArticleList;