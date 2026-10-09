import React from "react";
import FileRow, { type SelectedFile } from "./FileRow";

type SingleFileInputProps = {
    setSelectedFile: React.Dispatch<React.SetStateAction<SelectedFile | null>>;
    selectedFile: SelectedFile | null;
    text: string;
    hasError?: boolean;
    errorMessage?: string;
};

const SingleFileInput: React.FC<SingleFileInputProps> = ({ setSelectedFile, selectedFile, text, hasError = false, errorMessage: propErrorMessage }) => {
    const [errorMessage, setErrorMessage] = React.useState<string>("");
    const [isDragging, setIsDragging] = React.useState<boolean>(false);
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const MAX_SIZE_MB = 5;
    const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

    const validateAndSetFile = (file: File) => {
        const isAcceptedType = ACCEPTED_TYPES.includes(file.type);
        const isUnderSize = file.size <= MAX_SIZE_MB * 1024 * 1024;

        if (!isAcceptedType) {
            setErrorMessage("Sadece PNG veya JPEG dosyaları yükleyebilirsiniz.");
            return;
        }
        if (!isUnderSize) {
            setErrorMessage(`Dosya boyutu en fazla ${MAX_SIZE_MB}MB olmalı.`);
            return;
        }

        setErrorMessage("");
        const filePreview = URL.createObjectURL(file);
        const fileType = file.type;
        const fileName = file.name;
        setSelectedFile({ file: file, preview: filePreview, type: fileType, name: fileName });
    };

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        validateAndSetFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setErrorMessage("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) return;
        validateAndSetFile(file);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const openFileDialog = () => {
        inputRef.current?.click();
    };

    return (
        <>
            <div className="">
                <label htmlFor="file" className="mb-1 block text-sm font-medium text-gray-700">{text}</label>
                {selectedFile ? (
                    <div className="space-y-2">
                        <FileRow selectedFile={selectedFile} handleRemove={handleRemoveFile} />
                    </div>
                ) : (
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={openFileDialog}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openFileDialog(); }}
                        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
                            hasError 
                                ? "border-red-500 bg-red-50" 
                                : isDragging 
                                    ? "bg-gray-50" 
                                    : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                    >
                        <div className="mb-2 text-sm text-gray-700">
                            Sürükleyip bırakın ya da <span className="font-medium text-secondary underline">dosya seçin</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            PNG veya JPEG, en fazla {MAX_SIZE_MB}MB
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    id="file"
                    type="file"
                    accept={"image/png, image/jpeg"}
                    onChange={handleFileInput}
                    className="hidden"
                />

                {!selectedFile && (errorMessage || propErrorMessage) && (
                    <p className="mt-2 text-sm text-red-600">{propErrorMessage || errorMessage}</p>
                )}
            </div>
        </>
    );
};

export default SingleFileInput;


