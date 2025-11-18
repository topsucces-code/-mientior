'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapImage from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {children}
  </button>
);

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 flex flex-wrap gap-1">
      {/* Text formatting */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Inline Code"
        >
          <Code size={16} />
        </MenuButton>
      </div>

      {/* Headings */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </MenuButton>
      </div>

      {/* Lists */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </MenuButton>
      </div>

      {/* Insert */}
      <div className="flex gap-1 pr-2 border-r border-gray-300">
        <MenuButton onClick={addLink} isActive={editor.isActive('link')} title="Add Link">
          <LinkIcon size={16} />
        </MenuButton>
        <MenuButton onClick={addImage} title="Insert Image">
          <ImageIcon size={16} />
        </MenuButton>
        <MenuButton onClick={insertTable} isActive={editor.isActive('table')} title="Insert Table">
          <TableIcon size={16} />
        </MenuButton>
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={16} />
        </MenuButton>
      </div>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  maxLength,
  disabled = false,
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  });

  const charCount = editor?.getText().length || 0;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <Toolbar editor={editor} />
      <div className="relative">
        {!value && !editor?.isFocused && (
          <div className="absolute top-3 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
      {maxLength && (
        <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-200 flex justify-end">
          {charCount} / {maxLength} characters
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
