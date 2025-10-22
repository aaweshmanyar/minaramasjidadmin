import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import Layout from '../../../component/Layout';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { HelpCircle, Pencil, Eye, Trash2, Search } from 'lucide-react';
import API_BASE_URL from '../../../../config';

const modules = {
    toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        ['clean']
    ]
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
];

const QuestionList = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showViewPopup, setShowViewPopup] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        id: '',
        questionEnglish: '',
        answerEnglish: '',
        questionUrdu: '',
        answerUrdu: '',
        image: null
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 10;

    useEffect(() => {
        fetchQuestions();
    }, []);

    useEffect(() => {
        // Filter questions whenever searchTerm or questions change
        const filtered = questions.filter(question =>
            question.questionEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.questionUrdu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.answerEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.answerUrdu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            question.writer?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredQuestions(filtered);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm, questions]);


    const fetchQuestions = () => {
        axios.get(`${API_BASE_URL}/api/questions`)
            .then(response => {
                setQuestions(response.data);
                setFilteredQuestions(response.data);
                setLoading(false);
            })
            .catch(() => {
                setError('Error fetching data');
                setLoading(false);
            });
    };

    const handleView = (question) => {
        setSelectedQuestion(question);
        setShowViewPopup(true);
    };

    const handleDelete = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                setLoading(true);
                await axios.delete(`${API_BASE_URL}/api/questions/${id}`);
                await Swal.fire(
                    'Deleted!',
                    'Your question has been deleted.',
                    'success'
                );
                fetchQuestions();
            }
        } catch (error) {
            Swal.fire(
                'Error!',
                'Failed to delete question.',
                'error'
            );
            setLoading(false);
        }
    };

    // Pagination calculations
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-6 py-12">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Question Management</h1>
                    <button
                        onClick={() => navigate(`/createquestion`)}
                        className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
                    >
                        <HelpCircle className="w-5 h-5" />
                        Add New Question
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search questions..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5a6c17] focus:border-[#5a6c17] sm:text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50 text-gray-700 text-sm font-semibold">
                            <tr>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Slug</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Image</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">English Question</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Urdu Question</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Writer</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                                <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentQuestions.length > 0 ? (
                                currentQuestions.map((question) => (
                                    <tr key={question.id} className="border-t border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-6 text-sm text-gray-700">{question.slug}</td>
                                        <td className="py-3 px-6 text-sm text-gray-700">
                                            <img src={`${API_BASE_URL}/api/questions/image/${question.id}`} alt={question.slug} className="w-16 h-16" />
                                        </td>
                                        <td className="py-3 px-6 text-sm text-gray-700">{question.questionEnglish}</td>
                                        <td className="py-3 px-6 text-sm text-gray-700" dir="rtl">{question.questionUrdu}</td>
                                        <td className="py-3 px-6 text-sm text-gray-700">{question.writer}</td>
                                        <td className="py-3 px-6 text-sm text-gray-700">
                                            {new Date(question.date).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-6 flex justify-center gap-2">
                                            <button
                                                onClick={() => handleView(question)}
                                                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/question-update/${question.id}`)}
                                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(question.id)}
                                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-4 text-center text-gray-500">
                                        {loading ? 'Loading questions...' : 'No questions found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {filteredQuestions.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 w-full">
                        {/* Showing range */}
                        <div className="text-sm text-gray-700">
                            Showing {indexOfFirstQuestion + 1} to {Math.min(indexOfLastQuestion, filteredQuestions.length)} of {filteredQuestions.length} results
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex rounded-md shadow-sm -space-x-px">
                            {/* Previous button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50"
                            >
                                <i className="fas fa-chevron-left"></i>
                                 <span className="ml-2">Previous</span>
                            </button>

                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                <button
                                    key={number}
                                    onClick={() => handlePageChange(number)}
                                    className={`px-4 py-2 text-sm font-medium ${currentPage === number
                                            ? 'bg-[#5a6c17] text-white'
                                            : 'text-black hover:bg-[#e4e9d0]'
                                        }`}
                                >
                                    {number}
                                </button>
                            ))}

                            {/* Next button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
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

            {/* View Popup */}
            {showViewPopup && selectedQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">Question Details</h2>

                        <div className="mb-6 flex justify-center">
                            <img
                                src={`${API_BASE_URL}/api/questions/image/${selectedQuestion.id}`}
                                alt={selectedQuestion.slug}
                                className="max-h-64 max-w-full rounded-lg"
                            />
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">English</h3>
                            <div className="bg-gray-50 p-4 rounded-lg prose max-w-none">
                                <p className="font-medium mb-1">Question:</p>
                                <div className="mb-3" dangerouslySetInnerHTML={{ __html: selectedQuestion.questionEnglish }} />
                                <p className="font-medium mb-1">Answer:</p>
                                <div dangerouslySetInnerHTML={{ __html: selectedQuestion.answerEnglish }} />
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Urdu</h3>
                            <div className="bg-gray-50 p-4 rounded-lg prose max-w-none text-right" dir="rtl">
                                <p className="font-medium mb-1">سوال:</p>
                                <div className="mb-3" dangerouslySetInnerHTML={{ __html: selectedQuestion.questionUrdu }} />
                                <p className="font-medium mb-1">جواب:</p>
                                <div dangerouslySetInnerHTML={{ __html: selectedQuestion.answerUrdu }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">Slug:</p>
                                <p className="font-medium">{selectedQuestion.slug}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Writer:</p>
                                <p className="font-medium">{selectedQuestion.writer}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date:</p>
                                <p className="font-medium">
                                    {new Date(selectedQuestion.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowViewPopup(false)}
                                className="px-6 py-2 bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white rounded-lg hover:transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default QuestionList;