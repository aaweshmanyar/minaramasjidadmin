import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import Layout from '../../../component/Layout';
import API_BASE_URL from '../../../../config';
const ViewBookDetail = () => {
  const { id } = useParams(); // get book id from URL
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE_URL}/api/books/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setBook(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching book:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;

  if (!book) return <Layout><div className="p-6 text-red-600">Book not found.</div></Layout>;

  return (
    <Layout>
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
        <img
          src={`${API_BASE_URL}/api/books/cover/${book.id}`}
          alt={book.title}
          className="w-full max-w-md mb-4"
        />

        <div className="mb-4">
          <strong>Author:</strong> {book.author}
        </div>
        <div className="mb-4">
          <strong>Language:</strong> {book.language}
        </div>
        <div className="mb-4">
          <strong>Published Date:</strong> {new Date(book.bookDate).toLocaleDateString()}
        </div>
        <div className="mb-4">
          <strong>Category:</strong> {book.category}
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Description</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: book.description }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ViewBookDetail;
