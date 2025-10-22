import React, { useEffect, useState } from 'react';
import Layout from '../../../component/Layout';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Eye, Trash2 } from 'lucide-react';

const API_BASE_URL = 'https://newmmdata-backend.onrender.com/api';

const modules = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ align: [] }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
};

const formats = [
  'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'header', 'align',
  'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'link', 'image', 'video',
];

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current events
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvents = events.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(events.length / itemsPerPage);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {

      const res = await fetch(`${API_BASE_URL}/events`);
      const data = await res.json();
      setEvents(data);
      Swal.close();
    } catch (err) {
      Swal.fire('Error', 'Failed to fetch events.', 'error');
      console.error('Error:', err);
    }
  };

  const handleView = (event) => {
    setSelectedEvent(event);
    setEditMode(false);
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      content: event.content,
    });
    setEditMode(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const form = new FormData();
    if (formData.title) form.append('title', formData.title);
    if (formData.content) form.append('content', formData.content);
    if (formData.image) form.append('image', formData.image);

    try {
      Swal.fire({
        title: 'Updating...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await axios.patch(`${API_BASE_URL}/events/${selectedEvent.id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.close();
      Swal.fire('Updated!', 'Event updated successfully', 'success');
      fetchEvents();
      setSelectedEvent(null);
    } catch (error) {
      Swal.fire('Error', 'Failed to update event.', 'error');
      console.error('Update Error:', error);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the event.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const res = await fetch(`${API_BASE_URL}/events/${id}`, {
          method: 'DELETE',
        });

        if (res.ok) {
          Swal.close();
          Swal.fire('Deleted!', 'Event has been deleted.', 'success');
          fetchEvents();
        } else {
          throw new Error('Failed to delete event');
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to delete event.', 'error');
        console.error(err);
      }
    }
  };

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Event List</h1>
          <button
            onClick={() => navigate(`/createevent`)}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
            <CalendarDays className="w-5 h-5" />
            Add New Event
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="border px-4 py-2">ID</th>
                <th className="border px-4 py-2">Image</th>
                <th className="border px-4 py-2">Title</th>
                <th className="border px-4 py-2">Content</th>
                <th className="border px-4 py-2">Topic</th>
                <th className="border px-4 py-2">Language</th>
                <th className="border px-4 py-2">Writer</th>
                <th className="border px-4 py-2">Translator</th>
                <th className="border px-4 py-2">Tags</th>
                <th className="border px-4 py-2">Event Date</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 text-center">{event.id}</td>
                  <td className="border px-4 py-2">
                    <img
                      src={`${API_BASE_URL}/events/image/${event.id}`}
                      alt={event.title}
                      className="w-20 h-auto object-cover mx-auto"
                    />
                  </td>
                  <td className="border px-4 py-2">{event.title}</td>
                  <td className="border px-4 py-2 max-w-xs truncate" title={event.content}>
                    {event.content?.length > 100
                      ? `${event.content.substring(0, 100)}...`
                      : event.content || ""}
                  </td>
                  <td className="border px-4 py-2">{event.topic}</td>
                  <td className="border px-4 py-2">{event.language}</td>
                  <td className="border px-4 py-2">{event.writers}</td>
                  <td className="border px-4 py-2">{event.translator}</td>
                  <td className="border px-4 py-2">{event.tags}</td>
                  <td className="border px-4 py-2">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleView(event)}
                        className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/event/update-event/${event.id}`)}
                        className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                        title="Edit"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        title="Delete"
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
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, events.length)} of {events.length} entries
          </div>

          {/* Custom Prev/Next Button Group */}
          <div className="flex rounded-md shadow-sm -space-x-px">
            {/* Previous Button */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-black hover:bg-[#e4e9d0]"
            >
            <i className="fas fa-chevron-left"></i>
            </button>

            {/* Next Button */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-black hover:bg-[#e4e9d0]"
            >
             <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>




        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-lg p-6 rounded shadow-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                onClick={() => setSelectedEvent(null)}
              >
                ✕
              </button>

              {!editMode ? (
                <div>
                  <h3 className="text-xl font-bold mb-4">{selectedEvent.title}</h3>
                  <img
                    src={`${API_BASE_URL}/events/image/${selectedEvent.id}`}
                    alt={selectedEvent.title}
                    className="w-full max-h-64 object-contain mb-4"
                  />
                  <div
                    className="prose max-w-none border p-4 bg-gray-50 rounded"
                    dangerouslySetInnerHTML={{ __html: selectedEvent.content }}
                  />
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Event Date: {new Date(selectedEvent.eventDate).toLocaleDateString()}</p>
                    {selectedEvent.topic && <p>Topic: {selectedEvent.topic}</p>}
                    {selectedEvent.language && <p>Language: {selectedEvent.language}</p>}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <label className="block">
                    <span className="text-gray-700">Title:</span>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-gray-700">Content:</span>
                    <ReactQuill
                      value={formData.content}
                      onChange={(value) => setFormData({ ...formData, content: value })}
                      theme="snow"
                      modules={modules}
                      formats={formats}
                      className="bg-white border rounded-lg min-h-[200px] mb-12"
                      style={{ direction: 'ltr', textAlign: 'left' }}
                    />
                  </label>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(null)}
                      className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventList;