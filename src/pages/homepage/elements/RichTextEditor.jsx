import { useRef } from "react"

export default function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null)

  const handleCommand = (command) => {
    document.execCommand(command, false, null)
    onChange(editorRef.current.innerHTML)
  }

  const handleInput = () => {
    onChange(editorRef.current.innerHTML)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleCommand("bold")}
          className="px-2 py-1 border rounded hover:bg-gray-200"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => handleCommand("italic")}
          className="px-2 py-1 border rounded hover:bg-gray-200"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => handleCommand("underline")}
          className="px-2 py-1 border rounded hover:bg-gray-200"
        >
          U
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="border p-2 rounded min-h-[100px]"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
      ></div>
    </div>
  )
}
