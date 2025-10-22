import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../../component/Layout";
import API_BASE_URL from "../../../../config";

export default function WriterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [writer, setWriter] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/writers/${id}`)
      .then((res) => res.json())
      .then((data) => setWriter(data))
      .catch((err) => console.error("Error fetching writer:", err));
  }, [id]);

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-semibold mb-4">Writer Details</h2>

        {!writer ? (
          <div className="text-gray-500">Loading writer details...</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="w-full min-w-[500px] border border-gray-300">
              <tbody>
                <tr className="border-t bg-gray-50">
                  <th className="text-left p-3 border w-40">Name</th>
                  <td className="p-3 border">{writer.name}</td>
                </tr>
                <tr className="border-t">
                  <th className="text-left p-3 border">Designation</th>
                  <td className="p-3 border">{writer.designation}</td>
                </tr>
                <tr className="border-t bg-gray-50 align-top">
                  <th className="text-left p-3 border">English Description</th>
                  <td className="p-3 border">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: writer.englishDescription }}
                    />
                  </td>
                </tr>

                <tr className="border-t bg-gray-50 align-top">
                  <th className="text-left p-3 border">Urdu Description</th>
                  <td className="p-3 border text-right">
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: writer.urduDescription }}
                    />
                  </td>
                </tr>



                <tr className="border-t bg-gray-50">
                  <th className="text-left p-3 border">Image</th>
                  <td className="p-3 border"> <img
                    src={`${API_BASE_URL}/api/writers/image/${writer.id}`} // 👈 Update API route
                    alt={writer.name}
                    className="w-13 h-13 object-cover"
                  /></td>
                </tr>
                {/* You can add more writer fields here if your API returns them */}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
