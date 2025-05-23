import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ImagePreview({ title, type, image }) {
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [error, setError] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const isOriginal = type === "original";

  // Initial upload
  useEffect(() => {
    if (!isOriginal && image) {
      setIsLoading(true);
      setError(null);

      const enhanceImage = async () => {
        try {
          const formData = new FormData();
          
          // Convert base64/URL to blob
          let imageBlob;
          if (image.startsWith('data:')) {
            const base64Data = image.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let i = 0; i < byteCharacters.length; i++) {
              byteArrays.push(byteCharacters.charCodeAt(i));
            }
            
            imageBlob = new Blob([new Uint8Array(byteArrays)], { type: 'image/jpeg' });
          } else {
            imageBlob = await fetch(image).then(r => r.blob());
          }

          // Create file from blob and append to FormData
          const file = new File([imageBlob], 'image.jpg', { type: 'image/jpeg' });
          formData.append('image_file', file); // Changed from 'file' to 'image_file'
          formData.append('sync', '0'); // Async processing
          formData.append('type', 'clean'); // Image Enhancement type
          formData.append('return_type', '1'); // Return image URL

          // Make POST request to start enhancement
          const result = await axios({
            method: 'post',
            url: `${import.meta.env.VITE_PICWISH_API_URL}/api/tasks/visual/scale`,
            data: formData,
            headers: {
              'x-api-key': import.meta.env.VITE_PICWISH_API_KEY,
              'Accept': 'application/json',
            }
          });

          if (result.data?.data?.task_id) {
            setTaskId(result.data.data.task_id);
          } else {
            throw new Error('Invalid response format from API');
          }
        } catch (err) {
          console.error('Upload error:', err);
          let errorMessage = 'Error uploading image';
          if (err.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Please check your internet connection';
          } else if (err.response?.status === 401) {
            errorMessage = 'Invalid API key';
          } else if (err.response?.status === 429) {
            errorMessage = 'Too many requests. Please try again later';
          } else if (err.response) {
            errorMessage = `API Error: ${err.response.data.message || err.message}`;
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      };

      enhanceImage();
    }
  }, [image, isOriginal]);

  // Check task status
  useEffect(() => {
    let pollingTimeout;
    
    const checkTaskStatus = async () => {
      if (taskId) {
        try {
          const result = await axios({
            method: 'get',
            url: `${import.meta.env.VITE_PICWISH_API_URL}/api/tasks/visual/scale/${taskId}`,
            headers: {
              'x-api-key': import.meta.env.VITE_PICWISH_API_KEY,
              'Accept': 'application/json',
            }
          });

          const { data } = result.data;
          
          if (data?.state === 1 && data?.image) {
            setEnhancedImage(data.image);
            setIsLoading(false);
          } else if (data?.progress < 100) {
            // Poll again in 1 second if still processing
            pollingTimeout = setTimeout(checkTaskStatus, 1000);
          } else {
            throw new Error('Invalid response format from API');
          }
        } catch (err) {
          let errorMessage = 'Error checking task status';
          if (err.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Please check your internet connection';
          } else if (err.response) {
            errorMessage = `API Error: ${err.response.data.message || err.message}`;
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    if (taskId) {
      checkTaskStatus();
    }

    // Cleanup polling timeout
    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
    };
  }, [taskId]);

  return (
    <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
      <div className={`px-4 py-2 font-semibold text-white ${isOriginal ? "bg-gray-800" : "bg-blue-700"}`}>
        {title}
      </div>
      <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
        {isOriginal ? (
          image ? (
            <img src={image} alt={title} className="h-full w-full object-contain" />
          ) : (
            "No Image Selected"
          )
        ) : (
          isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-2"></div>
              <span>Processing image...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : enhancedImage ? (
            <img src={enhancedImage} alt={title} className="h-full w-full object-contain" />
          ) : (
            "No Enhanced Image"
          )
        )}
      </div>
    </div>
  );
}
