import React from 'react';

interface ImagePlaceholderProps {
  className?: string;
  height?: string;
  text?: string;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  className = "w-full h-48",
  text = "Resim Yok"
}) => {
  // Küçük boyutlar için farklı layout
  const isSmall = className.includes('h-20') || className.includes('w-20') || className.includes('h-18') || className.includes('w-18') || className.includes('h-16') || className.includes('w-16');
  
  return (
    <div className={`${className} bg-gray-200 rounded-lg flex items-center justify-center`}>
      {isSmall ? (
        <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{text}</p>
        </div>
      )}
    </div>
  );
};

export default ImagePlaceholder;
