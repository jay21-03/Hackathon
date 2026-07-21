import { CKEditor } from "@ckeditor/ckeditor5-react";
import { Bold, Italic } from "@ckeditor/ckeditor5-basic-styles";
import { ClassicEditor } from "@ckeditor/ckeditor5-editor-classic";
import { Essentials } from "@ckeditor/ckeditor5-essentials";
import { Heading } from "@ckeditor/ckeditor5-heading";
import { Link } from "@ckeditor/ckeditor5-link";
import { List } from "@ckeditor/ckeditor5-list";
import { Paragraph } from "@ckeditor/ckeditor5-paragraph";
import { Table, TableToolbar } from "@ckeditor/ckeditor5-table";
import { Undo } from "@ckeditor/ckeditor5-undo";
import type { ProblemRichTextEditorProps } from "./ProblemRichTextEditor";
import "ckeditor5/ckeditor5.css";

export default function ProblemRichTextEditorImpl({ value, onChange, disabled }: ProblemRichTextEditorProps) {
  return (
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
  );
}
