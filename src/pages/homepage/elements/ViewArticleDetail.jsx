import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import Layout from '../../../component/Layout';
import API_BASE_URL from '../../../../config';

const ArticleDetail = () => {
  const { id } = useParams();  // get article id from URL params
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetch(`${API_BASE_URL}/api/articles/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setArticle(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching article:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;

  if (!article) return <Layout><div className="p-6 text-red-600">Article not found.</div></Layout>;

  return (
    <Layout>
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        <img
          src={`${API_BASE_URL}/api/articles/image/${article.id}`}
          alt={article.title}
          className="w-full max-w-md mb-4"  // smaller max-width
        />

        <div className="mb-4">
          <strong>Writers:</strong> {article.writers}
        </div>
        <div className="mb-4">
          <strong>Translator:</strong> {article.translator}
        </div>
        <div className="mb-4">
          <strong>Language:</strong> {article.language}
        </div>
        <div className="mb-4">
          <strong>Date:</strong> {new Date(article.date).toLocaleDateString()}
        </div>
        <div className="mb-4">
          <strong>Views:</strong> {article.views}
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">English Description</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.englishDescription }}
          />
        </div>

        <div className="mb-4 text-right">
          <h2 className="text-xl font-semibold">Urdu Description</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.urduDescription }}
          />
        </div>

      </div>
    </Layout>
  );
};

export default ArticleDetail;
