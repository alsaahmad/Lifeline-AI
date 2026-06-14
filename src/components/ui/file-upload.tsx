import * as React from "react";
import { UploadCloud, File, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: File | null | string;
  onChange: (file: File | null) => void;
  className?: string;
}

export function FileUpload({
  label,
  description = "PDF, DOCX, PNG, or JPG (max 5MB)",
  accept = ".pdf,.docx,.png,.jpg,.jpeg",
  maxSizeMB = 5,
  value,
  onChange,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize previews if default string value (e.g. existing mockup URL) is supplied
  React.useEffect(() => {
    if (typeof value === "string") {
      setFileName(value.split("/").pop() || "Accreditation_Doc.pdf");
      if (value.match(/\.(jpeg|jpg|gif|png)$/i)) {
        setFilePreview(value);
      }
    } else if (value instanceof File) {
      setFileName(value.name);
      if (value.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(value);
      } else {
        setFilePreview(null);
      }
    } else {
      setFileName(null);
      setFilePreview(null);
    }
  }, [value]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return false;
    }

    // Check extension / mimetype
    const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    
    if (accept && !acceptedTypes.includes(fileExt) && !acceptedTypes.some(type => file.type.includes(type.replace('*', '')))) {
      setError(`Invalid file type. Supported types: ${accept}`);
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onChange(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onChange(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center cursor-pointer transition-all hover:bg-gray-50/50 hover:border-gray-300",
          dragActive && "border-primary bg-primary/5",
          error && "border-red-400 bg-red-50/20",
          fileName && "border-solid border-green-200 bg-green-50/10"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
        />

        {fileName ? (
          <div className="w-full flex items-center justify-between gap-3 animate-fade-up">
            <div className="flex items-center gap-3 min-w-0">
              {filePreview ? (
                <div className="h-12 w-12 rounded-lg border border-gray-150 overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                  <img src={filePreview} alt="Preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
                  <File className="h-6 w-6" />
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate max-w-[200px] sm:max-w-[280px]">
                  {fileName}
                </p>
                <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" /> Ready for upload
                </span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={removeFile}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">
                Drag & drop or <span className="text-primary hover:underline">browse file</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">{description}</p>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1 animate-fade-in">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
