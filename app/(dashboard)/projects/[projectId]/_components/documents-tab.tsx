import { Download, File, FileImage, FileSpreadsheet, FileText, Plus } from "lucide-react";
import type { DocumentItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { formatDocumentCategory } from "./utils";

type DocumentsTabProps = {
  documents: DocumentItem[];
  onUploadDocument: () => void;
};

const IMAGE_EXTENSION_REGEX = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const SPREADSHEET_EXTENSION_REGEX = /\.(csv|xls|xlsx)$/i;

const resolveFileName = (doc: DocumentItem) => {
  const fromMeta = String(doc.meta?.fileName || "").trim();
  if (fromMeta) {
    return fromMeta;
  }

  const fromUrl = String(doc.document?.url || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean)
    .pop();

  return fromUrl || "document";
};

const getMimeType = (doc: DocumentItem) => String(doc.meta?.mimeType || "").toLowerCase();

const isImageDocument = (doc: DocumentItem, fileName: string, url: string) => {
  const mimeType = getMimeType(doc);
  return (
    mimeType.startsWith("image/") ||
    IMAGE_EXTENSION_REGEX.test(fileName) ||
    IMAGE_EXTENSION_REGEX.test(url)
  );
};

const resolveFileKind = (doc: DocumentItem, fileName: string, url: string) => {
  const mimeType = getMimeType(doc);
  const normalizedName = String(fileName || "").toLowerCase();
  const normalizedUrl = String(url || "").toLowerCase();

  if (isImageDocument(doc, fileName, url)) {
    return "image";
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    SPREADSHEET_EXTENSION_REGEX.test(normalizedName) ||
    SPREADSHEET_EXTENSION_REGEX.test(normalizedUrl)
  ) {
    return "spreadsheet";
  }

  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("text") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }

  return "file";
};

const renderFileIcon = (kind: string) => {
  if (kind === "image") return <FileImage className="h-5 w-5" />;
  if (kind === "spreadsheet") return <FileSpreadsheet className="h-5 w-5" />;
  if (kind === "document") return <FileText className="h-5 w-5" />;
  return <File className="h-5 w-5" />;
};

export function DocumentsTab({ documents, onUploadDocument }: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onUploadDocument}>
          <Plus className="mr-2 h-5 w-5" /> Upload Documents
        </Button>
      </div>

      <div className="space-y-2">
        {documents.length === 0 ? (
          <Card className="bg-white p-4 text-black">
            <p className="text-body-16 text-black/70">No documents uploaded yet.</p>
          </Card>
        ) : (
          documents.map((doc) => {
            const documentUrl = doc.document?.url || "";
            const fileName = resolveFileName(doc);
            const fileKind = resolveFileKind(doc, fileName, documentUrl);

            return (
              <Card
                key={doc._id}
                className="flex items-center justify-between bg-white p-3 text-black"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {documentUrl && isImageDocument(doc, fileName, documentUrl) ? (
                    <img
                      src={documentUrl}
                      alt={doc.title || fileName}
                      className="h-11 w-11 rounded-md border border-black/10 object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-md bg-black/5 text-black/75">
                      {renderFileIcon(fileKind)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-body-16 truncate font-medium">
                      {doc.title || fileName || "-"}
                    </p>
                    <p className="text-body-16 text-black/70">
                      {formatDocumentCategory(doc.category)} | {formatDate(doc.createdAt)}
                    </p>
                    <p className="truncate text-xs text-black/60">{fileName}</p>
                  </div>
                </div>
                {documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8a732e]"
                    aria-label={`Open ${doc.title || fileName || "document"}`}
                  >
                    <Download className="h-5 w-5" />
                  </a>
                ) : (
                  <span className="cursor-not-allowed text-black/30">
                    <Download className="h-5 w-5" />
                  </span>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
