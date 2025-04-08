import React, { useState, useRef, ChangeEvent } from 'react';
import { uploadFile } from '../lib/firebase/firebaseUtils';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploadProps {
  initialImageUrl?: string;
  onImageUploaded: (url: string) => void;
  folder?: string;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  initialImageUrl,
  onImageUploaded,
  folder = 'profile-images',
  maxSizeMB = 5 // Increased to 5MB default
}) => {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [compressionStatus, setCompressionStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to compress image
  const compressImage = (file: File, maxWidthHeight = 1200, quality = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Create an image element to load the file
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target?.result as string;
        
        img.onload = () => {
          console.log(`Original image dimensions: ${img.width}x${img.height}`);
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // For very large images, use a more aggressive resize
          const maxDimension = Math.max(width, height);
          
          // Scale down approach based on the larger dimension
          if (maxDimension > 2000) {
            const scaleFactor = 1000 / maxDimension; // Reduce to 1000px max dimension
            width = Math.round(width * scaleFactor);
            height = Math.round(height * scaleFactor);
            console.log(`Very large image detected, scaling down to: ${width}x${height}`);
          } else if (width > maxWidthHeight || height > maxWidthHeight) {
            if (width > height) {
              height = Math.round(height * maxWidthHeight / width);
              width = maxWidthHeight;
            } else {
              width = Math.round(width * maxWidthHeight / height);
              height = maxWidthHeight;
            }
            console.log(`Scaling image to: ${width}x${height}`);
          } else {
            console.log(`Image is small enough (${width}x${height}), keeping original dimensions`);
          }
          
          // Create canvas and draw image with new dimensions
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Use a white background to ensure proper JPEG compression
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with specified quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Compressed image size: ${(blob.size / 1024).toFixed(2)}KB`);
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg', // Convert all to JPEG for better compression
            quality
          );
        };
        
        img.onerror = () => {
          reject(new Error('Error loading image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file (png, jpg, jpeg)');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setCompressionStatus('');
      
      let fileToUpload: File | Blob = file;
      
      // Show file details for debugging
      console.log('Original file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Always compress images larger than 100KB
      if (file.size > 100 * 1024) {
        const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setCompressionStatus(`Optimizing image (${originalSizeMB}MB)...`);
        
        try {
          // Aggressive compression for large images
          let compressedBlob;
          if (file.size > 2 * 1024 * 1024) {
            // For very large images (>2MB), use more aggressive compression
            compressedBlob = await compressImage(file, 800, 0.5);
          } else {
            // For medium sized images
            compressedBlob = await compressImage(file, 1200, 0.7);
          }
          
          // Convert blob to file
          fileToUpload = new File([compressedBlob], 'profile_image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          const compressedSizeMB = (fileToUpload.size / (1024 * 1024)).toFixed(2);
          setCompressionStatus(`Optimized from ${originalSizeMB}MB to ${compressedSizeMB}MB`);
          console.log(`Compressed from ${originalSizeMB}MB to ${compressedSizeMB}MB`);
        } catch (compressionError) {
          console.error('Error during compression:', compressionError);
          setCompressionStatus('Compression failed, uploading original file...');
          // Fall back to the original file if compression fails
          fileToUpload = file;
        }
      }
      
      // Create a unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileExt = fileToUpload.type === 'image/jpeg' ? 'jpg' : 'png';
      const filename = `profile_${timestamp}.${fileExt}`;
      const path = `${folder}/${filename}`;
      
      // Upload file to Firebase Storage
      setCompressionStatus('Uploading to server...');
      console.log('Uploading file:', {
        path,
        size: `${(fileToUpload.size / 1024).toFixed(2)} KB`,
        type: fileToUpload.type
      });
      
      try {
        const url = await uploadFile(fileToUpload, path);
        console.log('Upload successful, URL:', url);
        
        // Update state and parent component
        setImageUrl(url);
        onImageUploaded(url);
        setCompressionStatus('');
      } catch (uploadError: any) {
        console.error('Firebase upload error:', uploadError);
        
        // Check for specific Firebase Storage errors
        if (uploadError.code) {
          if (uploadError.code === 'storage/unauthorized') {
            setError('Permission denied: You are not authorized to upload to this location.');
          } else if (uploadError.code === 'storage/canceled') {
            setError('Upload was canceled');
          } else if (uploadError.code === 'storage/unknown') {
            setError(`Unknown error: ${uploadError.message}`);
          } else {
            setError(`Firebase error: ${uploadError.code}`);
          }
        } else {
          setError(`Upload failed: ${uploadError.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setError(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div 
        className="w-full flex flex-col items-center justify-center cursor-pointer"
        onClick={triggerFileInput}
      >
        {imageUrl ? (
          <div className="mb-2 relative">
            <img 
              src={imageUrl} 
              alt="Profile" 
              className="w-24 h-24 rounded-full object-cover border-2 border-orange-500"
            />
            {!isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="text-sm text-center">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center">
                <LoadingSpinner size="small" />
                <span className="ml-2 text-gray-300">
                  {compressionStatus || 'Uploading...'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <span className="text-orange-400 hover:text-orange-300">
                {imageUrl ? 'Change Profile Image' : 'Upload Profile Image'}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Images up to 5MB, will be automatically optimized
              </p>
            </div>
          )}
        </div>
        
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
