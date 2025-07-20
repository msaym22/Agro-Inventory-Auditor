// frontend/src/components/common/RichTextEditor.js
import React from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill's snow theme styles

const RichTextEditor = ({ value, onChange }) => {
  // Define the toolbar options for Quill
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      ['link'], // Add link option
      ['clean'] // Remove formatting button
    ],
  };

  // Define the formats that Quill should allow
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
  ];

  return (
    <div className="border rounded">
      <ReactQuill
        theme="snow" // Use the 'snow' theme for a modern look
        value={value}
        onChange={onChange} // ReactQuill's onChange provides the HTML content
        modules={modules}
        formats={formats}
        // Quill.js typically handles LTR text correctly by default.
        // If you encounter RTL issues again, you might need to check Quill's documentation
        // for specific configuration options related to text direction,
        // but it's less common than with draft-js.
      />
    </div>
  );
};

export default RichTextEditor;