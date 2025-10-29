import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../component/Layout";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import CreatableSelect from "react-select/creatable";
import { CornerUpLeft } from "lucide-react";
import API_BASE_URL from "../../../../config";

const animated = makeAnimated();

export default function CreateTopicsTags() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  const [allTags, setAllTags] = useState([]); // [{value,label}]
  const [selectedTags, setSelectedTags] = useState([]); // multi

  useEffect(() => {
    // load categories & tags
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/categories`),
          axios.get(`${API_BASE_URL}/api/tags`),
        ]);

        const catList = Array.isArray(catRes.data) ? catRes.data : [];
        setCategories(catList.map((c) => c.name || c.category || c));

        const tagList = Array.isArray(tagRes.data) ? tagRes.data : [];
        setAllTags(
          tagList.map((t) => ({
            value: t.tag || t.name || t,
            label: t.tag || t.name || t,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const selectedTagsText = useMemo(() => {
    if (!selectedTags.length) return "No tags selected.";
    return selectedTags.map((t) => t.label).join(", ");
    // Screenshot shows a muted line with current selection.
  }, [selectedTags]);

  const validate = () => {
    if (!title.trim()) return "Topic Title is required.";
    if (!category) return "Category is required.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      Swal.fire("Missing fields", err, "warning");
      return;
    }

    const payload = {
      title: title.trim(),
      category,
      tags: selectedTags.map((t) => t.value),
    };

    Swal.fire({ title: "Creating...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      await axios.post(`${API_BASE_URL}/api/topics`, payload);
      Swal.fire({ icon: "success", title: "Created!", timer: 1400, showConfirmButton: false }).then(
        () => navigate("/topics")
      );
    } catch (e) {
      console.error(e);
      Swal.fire("Error", e.response?.data?.message || "Failed to create.", "error");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate("/topics")}
            className="inline-flex items-center gap-2 text-emerald-700 hover:underline"
          >
            <CornerUpLeft className="w-4 h-4" />
            Back to List
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-6">Create Topics &amp; Tags</h1>

          {/* Row: Title / Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium mb-1">
                Topic Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter topic title"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                components={animated}
                options={categories.map((c) => ({ value: c, label: c }))}
                value={category ? { value: category, label: category } : null}
                onChange={(opt) => setCategory(opt?.value || "")}
                placeholder="Select category"
                className="text-sm"
              />
            </div>
          </div>

          {/* Related Tags */}
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Related Tags</label>
            <div className="w-full border rounded-xl px-3 py-2 text-sm text-gray-500 bg-gray-50">
              {selectedTagsText}
            </div>
          </div>

          <div className="mb-8">
            <CreatableSelect
              isMulti
              components={animated}
              options={allTags}
              value={selectedTags}
              onChange={(vals) => setSelectedTags(vals || [])}
              placeholder="Select or add new tags..."
              className="text-sm"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              onClick={() => navigate("/topics")}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={submit}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
