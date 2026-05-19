'use client'

import { type ReactNode, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Highlighter,
  Eraser, Undo, Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

const ToolbarButton = ({ 
  onClick, 
  active = false, 
  disabled = false, 
  children,
  title
}: { 
  onClick: () => void; 
  active?: boolean; 
  disabled?: boolean; 
  children: ReactNode;
  title?: string
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    disabled={disabled}
    title={title}
    className={cn(
      "p-1.5 rounded-md transition-all duration-200",
      active 
        ? "bg-brand-100 text-brand-700 shadow-sm" 
        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
      disabled && "opacity-30 cursor-not-allowed"
    )}
  >
    {children}
  </button>
)



export function RichTextEditor({ content, onChange, placeholder, className }: Props) {
  const extensions = useMemo(() => [
    StarterKit,
    Underline,
    Highlight.configure({ multicolor: false }),
    TextStyle,
    Color,
  ], [])

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] p-4 text-slate-700 leading-relaxed font-medium",
          // Force list styles because Tailwind reset can be aggressive
          "[&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
        ),
      },
    },
  })

  if (!editor) return null

  return (
    <div className={cn("border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-brand-300 focus-within:ring-1 focus-within:ring-brand-50 transition-all shadow-sm", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 mr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 mr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 mr-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            active={editor.isActive('highlight')}
            title="Yellow Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 ml-auto">
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear Formatting"
          >
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
          <div className="flex items-center gap-0.5 ml-1.5 border-l border-slate-200 pl-1.5">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      <EditorContent editor={editor} className="min-h-[120px]" />
    </div>
  )
}
