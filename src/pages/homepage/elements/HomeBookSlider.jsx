import React, { useEffect, useState } from 'react';
import Layout from '../../../component/Layout';
import axios from 'axios';
import { Sliders, Pencil, Eye, Trash2 } from 'lucide-react';
import API_BASE_URL from '../../../../config';

const HomeBookSlider = () => {
  const [showForm, setShowForm] = useState(false);
  const [bookList, setBookList] = useState([]);
  const [newBook, setNewBook] = useState({
    bookName: '',
    bookImage: null,
  });
  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  const fetchBooks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/homebookslider`);
      if (Array.isArray(res.data)) {
        setBookList(res.data);
      } else if (Array.isArray(res.data.data)) {
        setBookList(res.data.data);
      } else {
        console.error('Unexpected response format:', res.data);
        setBookList([]);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBookList([]);
    }
  };


  const totalPages = Math.ceil(bookList.length / itemsPerPage);
  const paginatedBooks = bookList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBook && showForm) {
      setNewBook({ bookName: selectedBook.bookName, bookImage: null });
    }
  }, [selectedBook, showForm]);

  const handleImageChange = (e) => {
    setNewBook({ ...newBook, bookImage: e.target.files[0] });
  };

  const handleInputChange = (e) => {
    setNewBook({ ...newBook, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bookName', newBook.bookName);
    if (newBook.bookImage) formData.append('bookImage', newBook.bookImage);

    try {
      if (isEditMode && selectedBook) {
        await axios.put(
          `${API_BASE_URL}/api/homebookslider/${selectedBook.id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        alert('Home Book slider updated successfully!');
      } else {
        await axios.post(
          `${API_BASE_URL}/api/homebookslider`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        alert('Home Book slider added successfully!');
      }

      fetchBooks();
      setNewBook({ bookName: '', bookImage: null });
      setShowForm(false);
      setSelectedBook(null);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error submitting book:', error);
      alert('Something went wrong while submitting the book. Please try again.');
    }
  };


  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this book?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/homebookslider/${id}`);
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert("Failed to delete the book. Please try again.");
    }
  };


  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Home Book Slider</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setIsEditMode(false);
              setSelectedBook(null);
              setNewBook({ bookName: '', bookImage: null });
            }}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            <Sliders className="w-5 h-5" />
            Add Book Slider
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="px-4 py-2 border">ID</th>
                <th className="px-4 py-2 border">Book Name</th>
                <th className="px-4 py-2 border">Book Image</th>
                <th className="px-4 py-2 border">Created On</th>
                <th className="px-4 py-2 border">Modified On</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.map((book) => (

                <tr key={book.id} className="text-center">
                  <td className="border px-4 py-2">{book.id}</td>
                  <td className="border px-4 py-2">{book.bookName}</td>
                  <td className="border px-4 py-2">
                    <img
                      src={`${API_BASE_URL}/api/homebookslider/image/${book.id}`}
                      alt={book.bookName}
                      className="w-9 h-12 object-cover mx-auto"
                    />

                  </td>
                  <td className="border px-4 py-2">{book.createdOn}</td>
                  <td className="border px-4 py-2">{book.modifiedOn}</td>
                  <td className="border px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsEditMode(false);
                          setShowForm(true);
                        }}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsEditMode(true);
                          setShowForm(true);
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        onClick={() => handleDelete(book.id)}
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

        <div className="flex justify-end mt-6">
          <div className="flex rounded-md shadow-sm -space-x-px">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-l-md"
            >
              <i className="fas fa-chevron-left"></i>
              <span className="ml-2">Previous</span>
            </button>

            {/* Page Numbers */}
            {/* {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 text-sm font-medium border border-gray-300 ${currentPage === index + 1
                    ? 'bg-[#5a6c17] text-white'
                    : 'text-black hover:bg-[#e4e9d0]'
                  }`}
              >
                {index + 1}
              </button>
            ))} */}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-r-md"
            >
              <span className="mr-2">Next</span>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                {isEditMode ? 'Edit Book' : selectedBook ? 'View Book' : 'Add New Book'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Book Title</label>
                  <input
                    type="text"
                    name="bookName"
                    value={newBook.bookName}
                    onChange={handleInputChange}
                    required
                    className="w-full border px-3 py-2 rounded"
                    readOnly={!isEditMode && selectedBook}
                  />
                </div>

                {selectedBook && !isEditMode && (
                  <div className="mb-4">
                    <label className="block mb-1 font-medium">Book Image</label>
                    <img
                      src={`https://newmmdata-backend.onrender.com/api/homebookslider/image/${selectedBook.id}`}
                      alt={selectedBook.bookName}
                      className="w-32 h-auto object-cover mx-auto border border-gray-300 rounded"
                    />
                  </div>
                )}

                {(!selectedBook || isEditMode) && (
                  <div className="mb-4">
                    <label className="block mb-1 font-medium">Book Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full"
                      disabled={!isEditMode && selectedBook}
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedBook(null);
                      setIsEditMode(false);
                    }}
                    className="mr-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                  {(isEditMode || !selectedBook) && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white rounded"
                    >
                      {isEditMode ? 'Update' : 'Submit'}
                    </button>
                  )}
                </div>
              </form>

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomeBookSlider;
