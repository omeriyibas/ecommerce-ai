import React from "react";
import {Link} from "@tanstack/react-router";
import {X} from "lucide-react";

export type SelectedFile = {
    file?: File; // Opsiyonel - düzenleme modunda mevcut resim için undefined olabilir
    preview: string;
    type: string;
    name: string;
};

type FileRowProps = {
    selectedFile: SelectedFile;
    handleRemove: () => void;
};

const FileRow: React.FC<FileRowProps> = ({ selectedFile, handleRemove }) => (
    <div className="mt-1 border border-gray-200 rounded-md bg-white" key={"file"}>
        <div className="p-3">
            <div className="flex items-center">
                {selectedFile.preview && (
                    <div className="mr-3 flex-none">
                        <img
                            data-dz-thumbnail=""
                            className="h-10 w-10 rounded object-cover bg-gray-100"
                            alt={selectedFile.name}
                            src={selectedFile.preview}
                        />
                    </div>
                )}
                {!selectedFile.preview && (
                    <div className="mr-3 flex-none">
                        <div className="h-10 w-10 rounded bg-blue-600 text-white grid place-items-center text-xs font-medium">
                            <span>
                                {selectedFile.type.split("/")[0]}
                            </span>
                        </div>
                    </div>
                )}
                <p className="font-semibold truncate overflow-ellipsis w-full/2">
                    {selectedFile.name}
                </p>
                <div className="ml-3 flex-none text-right">
                    <Link
                        to="#"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={handleRemove}
                    >
                        <X className="ri-close-line text-red-500" />
                    </Link>
                </div>
            </div>
        </div>
    </div>
);

export default FileRow;


