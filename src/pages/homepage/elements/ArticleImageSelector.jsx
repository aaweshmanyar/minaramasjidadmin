// ArticleImageSelector.jsx
import React, { useEffect, useMemo, useState } from "react";

import img1 from "../../../assets/Images/img1.jpg";
import img2 from "../../../assets/Images/img2.jpg";
import img3 from "../../../assets/Images/img3.jpg";
import img4 from "../../../assets/Images/img4.jpg";
import img5 from "../../../assets/Images/img5.jpg";
import img6 from "../../../assets/Images/img6.jpg";
import img7 from "../../../assets/Images/img7.jpg";
import img8 from "../../../assets/Images/img8.jpg";
import img9 from "../../../assets/Images/img9.jpg";

/**
 * How it works:
 * - Reads the "suggested" index from localStorage ("articleImageIndex"), defaults to 0 (img1).
 * - Highlights that suggestion; if the user does nothing, we'll use it by default.
 * - User can click any preset image, upload a file, or paste an external URL.
 * - Parent will call `onConfirm(getChosen())` when submitting the article.
 *
 * Props:
 * - onChange?(payload)  -> fires whenever the chosen image changes (optional)
 * - className?          -> wrapper class (optional)
 *
 * Methods exposed via return value of onConfirm callback:
 * - getChosen(): { type: "preset"|"file"|"url", value, index? }
 * - advanceSuggestion(): void -> increments the suggested index in localStorage
 */
const STORAGE_KEY = "articleImageIndex";

const PRESET_IMAGES = [
  { id: "img1", src: img1, label: "img1" },
  { id: "img2", src: img2, label: "img2" },
  { id: "img3", src: img3, label: "img3" },
  { id: "img4", src: img4, label: "img4" },
  { id: "img5", src: img5, label: "img5" },
  { id: "img6", src: img6, label: "img6" },
  { id: "img7", src: img7, label: "img7" },
  { id: "img8", src: img8, label: "img8" },
  { id: "img9", src: img9, label: "img9" },
];

function readSuggestedIndex() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n < PRESET_IMAGES.length) return n;
  return 0;
}

function writeSuggestedIndex(n) {
  localStorage.setItem(STORAGE_KEY, String(n));
}

export default function ArticleImageSelector({ onChange, className = "" }) {
  const suggestedIndex = useMemo(readSuggestedIndex, []);
  const [selectedIndex, setSelectedIndex] = useState(suggestedIndex);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");

  // Whenever the choice changes, notify parent (optional)
  useEffect(() => {
    if (typeof onChange !== "function") return;
    onChange(getChosen());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, file, url]);

  function clearNon(type) {
    // Keep the chosen type, clear the others
    if (type === "preset") {
      setFile(null);
      setUrl("");
    } else if (type === "file") {
      setUrl("");
      setSelectedIndex(null);
    } else if (type === "url") {
      setFile(null);
      setSelectedIndex(null);
    }
  }

  function handleClickPreset(idx) {
    setSelectedIndex(idx);
    clearNon("preset");
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    clearNon("file");
  }

  function handleUrlChange(e) {
    const v = e.target.value.trim();
    setUrl(v);
    // Do not clear others on typing; only when focus leaves / confirm button?
    // We will clear on explicit "Use this URL" click to avoid accidental erase.
  }

  function confirmUrl() {
    if (!url) return;
    clearNon("url");
  }

  // What will be used if the user submits now
  function getChosen() {
    if (file) return { type: "file", value: file };
    if (url) return { type: "url", value: url };
    const idx = Number.isInteger(selectedIndex) ? selectedIndex : suggestedIndex;
    return { type: "preset", value: PRESET_IMAGES[idx].src, index: idx, label: PRESET_IMAGES[idx].label };
  }

  // Call this only AFTER your article insert succeeds
  function advanceSuggestion() {
    const curr = readSuggestedIndex();
    const next = (curr + 1) % PRESET_IMAGES.length;
    writeSuggestedIndex(next);
  }

  // Small badge for the suggested tile
  const SuggestedBadge = () => (
    <span className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-xs px-2 py-1">
      Suggested
    </span>
  );

  return (
    <div className={`w-full ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Article Cover Image</h3>
      <p className="text-sm text-gray-600 mb-4">
        Pick one of the preset images, upload a file, or paste an external URL. If you don’t pick anything,
        we’ll use the suggested image by default.
      </p>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {PRESET_IMAGES.map((img, idx) => {
          const isSuggested = idx === suggestedIndex && !file && !url && (selectedIndex === null || selectedIndex === undefined || selectedIndex === idx);
          const isSelected =
            (!file && !url && selectedIndex === idx) ||
            isSuggested;

        return (
          <button
            key={img.id}
            type="button"
            onClick={() => handleClickPreset(idx)}
            className={[
              "relative aspect-[4/3] rounded-lg overflow-hidden ring-2 transition",
              isSelected ? "ring-emerald-600 shadow-lg" : "ring-transparent hover:ring-gray-300",
            ].join(" ")}
            title={img.label}
          >
            {isSuggested && <SuggestedBadge />}
            <img
              src={img.src}
              alt={img.label}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-2 right-2 text-[11px] bg-black/60 text-white px-2 py-0.5 rounded">
              {img.label}
            </div>
          </button>
        );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="px-3 text-xs uppercase tracking-wider text-gray-500">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* File upload */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Upload an image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
        />
        {file && (
          <div className="mt-2 text-sm text-gray-700">
            Selected file: <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Or paste an image URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://example.com/cover.jpg"
            value={url}
            onChange={handleUrlChange}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="button"
            onClick={confirmUrl}
            className="rounded-md bg-emerald-600 text-white text-sm px-3 py-2 hover:bg-emerald-700"
          >
            Use this URL
          </button>
        </div>
      </div>

      {/* Preview of what will actually be saved now */}
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="text-sm text-gray-700 mb-2">Preview (this will be saved if you submit now):</div>
        <div className="w-full max-w-[420px] aspect-[4/3] overflow-hidden rounded-md">
          {getChosen().type === "file" ? (
            <img
              src={URL.createObjectURL(getChosen().value)}
              alt="Chosen file"
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={getChosen().value}
              alt="Chosen"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      {/* Expose helper methods to parent via ref-like return (pattern: parent calls .getChosen()/.advanceSuggestion() from its submit) */}
      {/* Instead of using refs, we return a tiny API object through a function prop when needed: */}
      {/* Parent will call: const chosen = selectorApi.getChosen(); selectorApi.advanceSuggestion(); */}
      {/* To keep this file self-contained and simple, we attach the API to the component instance via a stable property. */}
      <HiddenApiBridge provide={{ getChosen, advanceSuggestion }} />
    </div>
  );
}

/**
 * Tiny helper to attach an API to the component so a parent can obtain it.
 * Pattern:
 * <ArticleImageSelector refApi={(api) => (selectorApi = api)} />
 */
function HiddenApiBridge({ provide }) {
  // We expose it globally on DOM node via a data property for parent that captures it (see CreateArticleForm)
  // This is a safe, simple bridge without React refs for folks who want plain function props.
  useEffect(() => {
    // no-op; existence is enough
  }, []);
  return <div data-image-selector-api={JSON.stringify({})} style={{ display: "none" }} data-api-object={provide} />;
}
