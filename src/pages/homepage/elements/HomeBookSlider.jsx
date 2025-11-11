import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../../component/Layout';
import axios from 'axios';
import { Sliders, Pencil, Eye, Trash2, X } from 'lucide-react';
import API_BASE_URL from '../../../../config';

/* ---------- NEW: preset images ---------- */
import img1 from '../../../assets/Images/img1.jpg';
import img2 from '../../../assets/Images/img2.jpg';
import img3 from '../../../assets/Images/img3.jpg';
import img4 from '../../../assets/Images/img4.jpg';
import img5 from '../../../assets/Images/img5.jpg';
import img6 from '../../../assets/Images/img6.jpg';
import img7 from '../../../assets/Images/img7.jpg';
import img8 from '../../../assets/Images/img8.jpg';
import img9 from '../../../assets/Images/img9.jpg';

const PRESET_IMAGES = [
  { id: 'img1', src: img1, label: 'img1' },
  { id: 'img2', src: img2, label: 'img2' },
  { id: 'img3', src: img3, label: 'img3' },
  { id: 'img4', src: img4, label: 'img4' },
  { id: 'img5', src: img5, label: 'img5' },
  { id: 'img6', src: img6, label: 'img6' },
  { id: 'img7', src: img7, label: 'img7' },
  { id: 'img8', src: img8, label: 'img8' },
  { id: 'img9', src: img9, label: 'img9' },
];

// Turn a bundled asset URL into a File (so backend sees it like an uploaded image)
async function blobFromUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const ext = (url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  return new File([blob], `preset.${ext}`, { type: blob.type || 'image/jpeg' });
}

const HomeBookSlider = () => {
  const [showForm, setShowForm] = useState(false);
  const [bookList, setBookList] = useState([]);
  const [newBook, setNewBook] = useState({
    bookName: '',
    bookImage: null, // File (manual upload)
  });
  const [previewURL, setPreviewURL] = useState(null); // preview for manual upload
  const fileInputRef = useRef(null);

  const [selectedBook, setSelectedBook] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // NEW: selected preset image index (default img1)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);

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
      setPreviewURL(null);
      setSelectedPresetIndex(0); // default suggestion on open
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [selectedBook, showForm]);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      e.target.value = '';
      return;
    }
    if (previewURL) URL.revokeObjectURL(previewURL);
    setNewBook({ ...newBook, bookImage: file });
    setPreviewURL(URL.createObjectURL(file));
    // manual upload overrides preset
    setSelectedPresetIndex(null);
  };

  const clearManualImage = (e) => {
    e?.stopPropagation?.();
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(null);
    setNewBook({ ...newBook, bookImage: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
    // if no preset explicitly selected, restore default img1
    if (!Number.isInteger(selectedPresetIndex)) setSelectedPresetIndex(0);
  };

  const handleInputChange = (e) => {
    setNewBook({ ...newBook, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newBook.bookName.trim()) {
      alert('Please enter a book title.');
      return;
    }

    const formData = new FormData();
    formData.append('bookName', newBook.bookName);

    try {
      // Decide which image to send:
      if (newBook.bookImage) {
        // Manual upload wins
        formData.append('bookImage', newBook.bookImage);
      } else {
        // Use selected preset (default to img1)
        const idx = Number.isInteger(selectedPresetIndex) ? selectedPresetIndex : 0;
        const preset = PRESET_IMAGES[idx] || PRESET_IMAGES[0];
        const presetFile = await blobFromUrl(preset.src);
        formData.append('bookImage', presetFile, `${preset.label || 'preset'}.jpg`);
        formData.append('coverPresetLabel', preset.label || `img${idx + 1}`);
      }

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

      await fetchBooks();
      setNewBook({ bookName: '', bookImage: null });
      setPreviewURL(null);
      setShowForm(false);
      setSelectedBook(null);
      setIsEditMode(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // optional: advance to next preset after submit (comment out if not desired)
      // setSelectedPresetIndex((prev) => Number.isInteger(prev) ? (prev + 1) % PRESET_IMAGES.length : 0);
    } catch (error) {
      console.error('Error submitting book:', error);
      alert('Something went wrong while submitting the book. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this book?');
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/homebookslider/${id}`);
      fetchBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete the book. Please try again.');
    }
  };

  // Current preview to show inside the modal:
  // manual preview first; else selected preset
  const currentPreviewSrc =
    previewURL ||
    (Number.isInteger(selectedPresetIndex)
      ? PRESET_IMAGES[selectedPresetIndex].src
      : PRESET_IMAGES[0].src);

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
              setPreviewURL(null);
              setSelectedPresetIndex(0); // default suggestion
              if (fileInputRef.current) fileInputRef.current.value = '';
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
                    <div className="flex items-center space-x-2 justify-center">
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
              {paginatedBooks.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-gray-500 py-6">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="flex rounded-md shadow-sm -space-x-px">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-l-md"
            >
              <span className="ml-0.5">Previous</span>
            </button>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center px-4 py-2 text-black hover:bg-[#e4e9d0] disabled:opacity-50 rounded-r-md"
            >
              <span className="mr-0.5">Next</span>
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-3">
            {/* SCROLLABLE MODAL CARD */}
            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain">
              <h3 className="text-xl font-semibold mb-4">
                {isEditMode ? 'Edit Book' : selectedBook ? 'View Book' : 'Add New Book'}
              </h3>

              <form onSubmit={handleSubmit}>
                {/* Book Title */}
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

                {/* View-only image */}
                {selectedBook && !isEditMode && (
                  <div className="mb-4">
                    <label className="block mb-1 font-medium">Book Image</label>
                    <img
                      src={`${API_BASE_URL}/api/homebookslider/image/${selectedBook.id}`}
                      alt={selectedBook.bookName}
                      className="w-32 h-auto object-cover mx-auto border border-gray-300 rounded"
                    />
                  </div>
                )}

                {/* Suggestion + Upload (only when adding or editing) */}
                {(!selectedBook || isEditMode) && (
                  <>
                    {/* Suggestion strip */}
                    <div className="mb-3">
                      <label className="block mb-1 font-medium">
                        Suggested Images
                      </label>
                      <p className="text-xs text-gray-600 mb-2">
                        Choose a suggested image or upload your own. If you don’t upload, the selected suggestion will be used.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {PRESET_IMAGES.map((p, idx) => {
                          const active = Number.isInteger(selectedPresetIndex)
                            ? selectedPresetIndex === idx && !newBook.bookImage
                            : idx === 0 && !newBook.bookImage;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className={[
                                'relative aspect-[4/3] rounded-lg overflow-hidden border transition',
                                active ? 'border-[#5a6c17] ring-2 ring-[#5a6c17]' : 'border-gray-200 hover:border-gray-300',
                              ].join(' ')}
                              title={p.label}
                              onClick={() => {
                                // selecting preset clears manual upload
                                clearManualImage();
                                setSelectedPresetIndex(idx);
                              }}
                            >
                              <img src={p.src} alt={p.label} className="w-full h-full object-cover" loading="lazy" />
                              <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                                {p.label}
                              </span>
                              {active && (
                                <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Current preview (preset or manual) */}
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Preview</label>
                      <div className="inline-block border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                        <img
                          src={currentPreviewSrc}
                          alt="Preview"
                          className="w-28 h-36 object-cover rounded"
                        />
                      </div>
                      {/* Remove button only for manual upload */}
                      {newBook.bookImage && (
                        <button
                          type="button"
                          onClick={clearManualImage}
                          className="ml-2 inline-flex items-center px-2 py-1 rounded-md border text-xs hover:bg-gray-50"
                          title="Remove uploaded image"
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Manual upload */}
                    <div className="mb-4">
                      <label className="block mb-1 font-medium">Book Image</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full"
                      />
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex justify-end sticky bottom-0 pt-4 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedBook(null);
                      setIsEditMode(false);
                      if (previewURL) URL.revokeObjectURL(previewURL);
                      setPreviewURL(null);
                      setNewBook({ bookName: '', bookImage: null });
                      if (fileInputRef.current) fileInputRef.current.value = '';
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
