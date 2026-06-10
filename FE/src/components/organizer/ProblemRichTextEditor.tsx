import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  Bold,
  ClassicEditor,
  Essentials,
  Heading,
  Italic,
  Link,
  List,
  Paragraph,
  Table,
  TableToolbar,
  Undo
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

interface ProblemRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function ProblemRichTextEditor({ value, onChange, disabled }: ProblemRichTextEditorProps) {
  return (
    <div className="problem-editor rounded-lg border border-outline-variant bg-surface-container-lowest [&_.ck-editor__editable]:min-h-48">
      <CKEditor
        editor={ClassicEditor}
        disabled={disabled}
        data={value}
        config={{
          licenseKey: "GPL",
          plugins: [Essentials, Bold, Italic, Heading, Link, List, Paragraph, Table, TableToolbar, Undo],
          toolbar: [
            "undo",
            "redo",
            "|",
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "|",
            "bulletedList",
            "numberedList",
            "|",
            "insertTable"
          ],
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"]
          }
        }}
        onChange={(_event, editor) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
