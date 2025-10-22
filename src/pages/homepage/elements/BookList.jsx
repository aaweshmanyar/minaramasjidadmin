import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, Pencil, Eye, Trash2, Search } from "lucide-react";
import API_BASE_URL from "../../../../config";


const BookList = () => {
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchField, setSearchField] = useState("title");
    const [filteredBooks, setFilteredBooks] = useState([]);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;

    const totalPages = Math.ceil(filteredBooks.length / entriesPerPage);
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentBooks = filteredBooks.slice(indexOfFirstEntry, indexOfLastEntry);

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    const prevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    useEffect(() => {
        filterBooks();
    }, [books, searchTerm]);


    const fetchBooks = () => {
        axios
            .get(`${API_BASE_URL}/api/books`)
            .then((response) => {
                setBooks(response.data);
                setFilteredBooks(response.data);
            })
            .catch((error) => console.error("Error fetching data:", error));
    };

    const filterBooks = () => {
        if (!searchTerm) {
            setFilteredBooks(books);
            setCurrentPage(1);
            return;
        }

        const lowercasedSearch = searchTerm.toLowerCase();
        const filtered = books.filter(book =>
            book.title?.toLowerCase().includes(lowercasedSearch) ||
            book.author?.toLowerCase().includes(lowercasedSearch) ||
            book.category?.toLowerCase().includes(lowercasedSearch)
        );

        setFilteredBooks(filtered);
        setCurrentPage(1);
    };


    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete the book.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                axios
                    .delete(`${API_BASE_URL}/api/books/${id}`)
                    .then(() => {
                        Swal.close();

                        const timestamp = new Date().toLocaleString();
                        Swal.fire({
                            icon: 'success',
                            title: 'Book Deleted!',
                            text: `Deleted at ${timestamp}`,
                        });

                        fetchBooks();
                    })
                    .catch((error) => {
                        Swal.fire('Error', 'Delete failed!', 'error');
                        console.error("Delete failed:", error);
                    });
            }
        });
    };

    return (
        <Layout>
            <div className="min-h-screen py-10 px-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
                        Books Management
                    </h1>

                    <button onClick={() => { navigate(`/book`) }}
                        className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
                    >
                        <BookOpenCheck className="w-5 h-5" />
                        Add New Book
                    </button>

                </div>

                <div className="mb-6 p-4 rounded-lg border-gray-200">
                    <div className="mb-6 p-4 rounded-lg border-gray-200">
                        <div className="relative w-[300px]"> {/* Set width to 300px */}
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5a6c17] focus:border-[#5a6c17] sm:text-sm"
                                placeholder="Search by title, author or category..."
                            />
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                {filteredBooks.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
                        <p className="text-gray-600">No books found</p>
                    </div>
                ) : (
                    <>
                        <div className="w-full overflow-x-auto rounded-lg shadow border border-gray-200 custom-scrollbar">
                            <table className="min-w-[900px] w-full text-left bg-white">
                                <thead className="bg-gray-50 text-gray-700 text-lg font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 text-left">ID</th>
                                        <th className="px-4 py-3 text-left">Cover</th>
                                        <th className="px-4 py-3 text-left">Title</th>
                                        <th className="px-4 py-3 text-left">ISBN</th>
                                        <th className="px-4 py-3 text-left">Description</th>
                                        <th className="px-4 py-3 text-left">Author</th>
                                        <th className="px-4 py-3 text-left">Translator</th>
                                        <th className="px-4 py-3 text-left">Language</th>
                                        <th className="px-4 py-3 text-left">Book Date</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Category</th>
                                        <th className="px-4 py-3 text-left">Created On</th>
                                        <th className="px-4 py-3 text-left">Is Published</th>
                                        <th className="px-4 py-3 text-left">Modified On</th>
                                        <th className="px-4 py-3 text-left">PDF</th>
                                        <th className="px-4 py-3 text-left">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentBooks.map((book) => (
                                        <tr key={book.id} className="border-b">
                                            <td className="px-4 py-3 text-left">{book.id}</td>
                                            <td className="px-4 py-3 text-left">
                                                <img
                                                    src={`${API_BASE_URL}/api/books/cover/${book.id}`}
                                                    alt={book.title}
                                                    className="w-16 h-auto object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/80x120?text=No+Cover';
                                                    }}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-left">{book.title}</td>
                                            <td className="px-4 py-3 text-left">{book.isbn}</td>
                                            <td className="px-4 py-3 text-left">
                                                {book.description?.length > 100
                                                    ? `${book.description.substring(0, 100)}...`
                                                    : book.description || ""}
                                            </td>
                                            <td className="px-4 py-3 text-left">{book.author}</td>
                                            <td className="px-4 py-3 text-left">{book.translator}</td>
                                            <td className="px-4 py-3 text-left">{book.language}</td>
                                            <td className="px-4 py-3 text-left">{book.bookDate}</td>
                                            <td className="px-4 py-3 text-left">{book.status}</td>
                                            <td className="px-4 py-3 text-left">{book.category}</td>
                                            <td className="px-4 py-3 text-left">{new Date(book.createdOn).toLocaleString("en-GB")}</td>
                                            <td className="px-4 py-3 text-left">{book.isPublished ? "Yes" : "No"}</td>
                                            <td className="px-4 py-3 text-left">{new Date(book.modifiedOn).toLocaleString("en-GB")}</td>
                                            <td className="px-4 py-3 text-left">
                                                {book.id && (
                                                    <a
                                                        href={`https://newmmdata-backend.onrender.com/api/books/attachment/${book.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <i className="fas fa-file-pdf text-[#5a6c17] text-xl"></i>
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-left">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/viewbook/book/${book.id}`)}
                                                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigate(`/update-book/book/${book.id}`)
                                                        }}
                                                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(book.id)}
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

                        {filteredBooks.length > entriesPerPage && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                                {/* Showing X to Y of Z */}
                                <div className="text-sm text-gray-600">
                                    Showing{" "}
                                    {filteredBooks.length === 0 ? 0 : indexOfFirstEntry + 1} to{" "}
                                    {Math.min(indexOfLastEntry, filteredBooks.length)} of{" "}
                                    {filteredBooks.length} entries
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center gap-1">
                                    {/* Previous Button */}
                                    <button
                                        onClick={prevPage}
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
                                            onClick={() => setCurrentPage(number)}
                                            className={`px-4 py-2 border border-gray-300 ${currentPage === number
                                                ? "bg-[#5a6c17] text-white"
                                                : "text-black hover:bg-[#e4e9d0]"
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    ))}

                                    {/* Next Button */}
                                    <button
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50"
                                    >
                                        <span className="mr-2">Next</span>
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </div>
                            </div>
                        )}

                    </>
                )}

                {showViewModal && selectedBook && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl max-h-screen overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-4 text-center">📖 Book Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div><strong>Title:</strong> {selectedBook.title}</div>
                                <div><strong>ISBN:</strong> {selectedBook.isbn}</div>
                                <div><strong>Author:</strong> {selectedBook.author}</div>
                                <div><strong>Translator:</strong> {selectedBook.translator}</div>
                                <div><strong>Language:</strong> {selectedBook.language}</div>
                                <div><strong>Book Date:</strong> {selectedBook.bookDate}</div>
                                <div><strong>Status:</strong> {selectedBook.status}</div>
                                <div><strong>Category:</strong> {selectedBook.category}</div>
                                <div><strong>Is Published:</strong> {selectedBook.isPublished ? "Yes" : "No"}</div>
                                <div><strong>Is Deleted:</strong> {selectedBook.isDeleted ? "Yes" : "No"}</div>
                                <div><strong>Created On:</strong> {new Date(selectedBook.createdOn).toLocaleString("en-GB")}</div>
                                <div><strong>Modified On:</strong> {new Date(selectedBook.modifiedOn).toLocaleString("en-GB")}</div>
                                <div className="sm:col-span-2">
                                    <strong>Description:</strong>
                                    <p className="mt-1 text-gray-700">{selectedBook.description}</p>
                                </div>
                                <div className="sm:col-span-2 text-center">
                                    <img
                                        src={`https://newmmdata-backend.onrender.com/api/books/cover/${selectedBook.id}`}
                                        alt={selectedBook.title}
                                        className="w-40 h-auto mx-auto mt-4 rounded border"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/160x240?text=No+Cover';
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="text-center mt-6">
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BookList;