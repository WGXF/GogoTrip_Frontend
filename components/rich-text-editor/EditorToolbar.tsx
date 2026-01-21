import React, { useState } from 'react';
import { useEditor } from '@tiptap/react';
import { 
  Undo, Redo, Heading1, Heading2, Heading3, 
  Bold, Italic, Underline, Strikethrough, 
  Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Minus, 
  Link as LinkIcon, Image as ImageIcon 
} from 'lucide-react';
import { ToolbarButton } from './ToolbarButton';

// ✨ TipTap toolbar component
interface EditorToolbarProps {
  editor: ReturnType<typeof useEditor>;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Color options
  const colors = [
    '#000000', '#374151', '#6b7280', '#ef4444', '#f97316', 
    '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50/80">
      {/* Undo / Redo */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Headings */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Text Formatting */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleUnderline().run()} 
        isActive={editor.isActive('underline')}
        title="Underline"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleStrike().run()} 
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Text Color */}
      <div className="relative">
        <ToolbarButton onClick={() => setShowColorPicker(!showColorPicker)} title="Text Color">
          <div className="flex flex-col items-center">
            <Type size={14} />
            <div className="w-3 h-1 rounded-sm mt-0.5" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }} />
          </div>
        </ToolbarButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-50 grid grid-cols-5 gap-2 w-[180px]">
            {colors.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
              className="w-6 h-6 rounded-full border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              title="Reset Color"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <ToolbarButton onClick={() => setShowHighlightPicker(!showHighlightPicker)} isActive={editor.isActive('highlight')} title="Highlight">
          <Palette size={16} />
        </ToolbarButton>
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-50 grid grid-cols-5 gap-2 w-[180px]">
            {['#fef08a', '#bbf7d0', '#bfdbfe', '#ddd6fe', '#fecdd3'].map(color => (
              <button
                key={color}
                type="button"
                onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightPicker(false); }}
                className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
              className="w-6 h-6 rounded-full border border-slate-200 text-xs text-slate-400 hover:bg-slate-100 flex items-center justify-center"
              title="Reset Highlight"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Alignment */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
        isActive={editor.isActive({ textAlign: 'justify' })}
        title="Justify"
      >
        <AlignJustify size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Lists */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Block Elements */}
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <Code size={16} />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus size={16} />
      </ToolbarButton>

      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Link & Image */}
      <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Link">
        <LinkIcon size={16} />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <ImageIcon size={16} />
      </ToolbarButton>
    </div>
  );
};