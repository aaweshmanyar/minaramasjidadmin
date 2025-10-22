import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Layout from '../../../component/Layout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useNavigate } from "react-router-dom";
import { BookMarked, Pencil, Eye, Trash2, Search } from "lucide-react";
import API_BASE_URL from '../../../../config';

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

const TopicList = () => {
  const [topics, setTopics] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState({});
  const [updatedTopic, setUpdatedTopic] = useState({
    topic: '',
    about: '',
    image: null,
  });
  const navigate = useNavigate();

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/topics`);
        setTopics(response.data);
      } catch (error) {
        Swal.fire('Error', 'Failed to fetch topics', 'error');
      }
    };

    fetchTopics();
  }, []);

  // Calculate current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = topics.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(topics.length / itemsPerPage);

  const handleEdit = (topic) => {
    setCurrentTopic(topic);
    setUpdatedTopic({
      topic: topic.topic,
      about: topic.about,
      image: null,
    });
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedTopic((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setUpdatedTopic((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You will not be able to recover this topic!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      try {
        await axios.delete(`${API_BASE_URL}/api/topics/${id}`);
        setTopics((prev) => prev.filter((topic) => topic.id !== id));
        const now = new Date().toLocaleString();
        Swal.fire('Deleted!', `Topic deleted at ${now}`, 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete topic', 'error');
      }
    }
  };

  const handleView = (topic) => {
    setSelectedTopic(topic);
    setShowViewModal(true);
  };

  const closeViewModal = () => setShowViewModal(false);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Topics List</h1>
          <button onClick={() => navigate(`/create-topic`)} className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Add New Topic
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="w-full flex justify-center overflow-x-auto py-4">
            <table className="min-w-[1000px] bg-gray-50 text-gray-700 text-sm font-semibold">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">S.No</th>
                  <th className="py-2 px-4 border-b">Topic</th>
                  <th className="py-2 px-4 border-b">About</th>
                  <th className="py-2 px-4 border-b">Image</th>
                  <th className="py-2 px-4 border-b">Created On</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((topic, index) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{indexOfFirstItem + index + 1}</td>
                    <td className="py-2 px-4 border-b">{topic.topic}</td>
                    <td
                      className="py-2 px-4 border-b"
                      title={topic.about ? topic.about.replace(/<[^>]+>/g, '') : '-'}
                    >
                      {topic.about
                        ? topic.about.replace(/<[^>]+>/g, '').length > 100
                          ? topic.about.replace(/<[^>]+>/g, '').substring(0, 100) + "..."
                          : topic.about.replace(/<[^>]+>/g, '')
                        : '-'}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <img
                        src={`${API_BASE_URL}/api/topics/image/${topic.id}`}
                        alt={topic.topic}
                        className="w-12 h-12 object-cover"
                      />
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(topic.createdOn).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(topic)}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/topic-update/${topic.id}`)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(topic.id)}
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
          {topics.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 px-4">
              {/* Showing range text */}
              <div className="text-sm text-gray-600">
                Showing{" "}
                {topics.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, topics.length)} of{" "}
                {topics.length} entries
              </div>

              {/* Pagination Buttons */}
              <div className="flex rounded-md shadow-sm -space-x-px">
                {/* Previous */}
                <button
                  onClick={() => paginate(currentPage - 1)}
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
                    onClick={() => paginate(number)}
                    className={`px-4 py-2 text-sm font-medium ${currentPage === number
                      ? "bg-[#5a6c17] text-white"
                      : "text-black hover:bg-[#e4e9d0]"
                      }`}
                  >
                    {number}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50"
                >
                  <span className="mr-2">Next</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedTopic && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-md w-1/3">
            <h2 className="text-xl font-bold mb-4">Topic Details</h2>
            <p><strong>ID:</strong> {selectedTopic.id}</p>
            <p><strong>Topic:</strong> {selectedTopic.topic}</p>
            <p><strong>About:</strong> {selectedTopic.about}</p>
            <img
              src={`${API_BASE_URL}/api/topics/image/${selectedTopic.id}`}
              alt={selectedTopic.topic}
              className="w-24 h-24 mt-2 object-cover"
            />
            <button
              onClick={closeViewModal}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TopicList;