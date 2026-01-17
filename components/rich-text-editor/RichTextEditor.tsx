import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline as UnderlineExtension } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Link as LinkExtension } from '@tiptap/extension-link';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';

import { EditorToolbar } from './EditorToolbar';
import './tiptap.css';

// ✨ TipTap 编辑器组件接口
interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder = 'Write your article content here...' }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      UnderlineExtension,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // 当 content prop 改变时更新编辑器（用于编辑已存在的文章）
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="tiptap-editor-wrapper bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
};