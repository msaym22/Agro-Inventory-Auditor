// frontend/src/components/common/RichTextEditor.js
import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const RichTextEditor = ({ value, onChange }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  useEffect(() => {
    if (value) {
      const contentBlock = htmlToDraft(value);
      if (contentBlock) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        setEditorState(EditorState.createWithContent(contentState));
      }
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [value]);

  const onEditorStateChange = (newEditorState) => {
    setEditorState(newEditorState);
    const html = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
    onChange(html);
  };

  return (
    <div className="border rounded">
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        toolbar={{
          options: ['inline', 'blockType', 'list', 'textAlign', 'link', 'history'],
          inline: { inDropdown: true },
          list: { inDropdown: true },
          textAlign: { inDropdown: true },
          link: { inDropdown: true },
          history: { inDropdown: true },
        }}
        // Add these props for RTL support if necessary
        textDirection="auto" // Automatically detect text direction (recommended for mixed content)
        // or explicitly 'rtl' if all content is expected to be RTL
        // textDirection="rtl"
        // You might need to add specific CSS for RTL in the editor area if auto doesn't suffice
        // editorClassName="demo-editor-richtext" // Add a custom class and define styles in index.css
      />
    </div>
  );
};

export default RichTextEditor;