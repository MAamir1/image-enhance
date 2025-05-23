import { useState } from "react";
import UploadImage from "./UploadImage";
import ImagePreview from "./ImagePreview";

export default function Home() {
  const [originalImage, setOriginalImage] = useState(null);

  const handleImageUpload = (imageData) => {
    if (imageData) {
      setOriginalImage(imageData);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4">
      <h1 className="text-3xl font-bold text-center">AI Image Enhancer</h1>
      <p className="text-gray-500 text-center mt-2 mb-6">
        Upload your image and let AI enhance it in seconds!
      </p>

      <UploadImage onImageUpload={handleImageUpload} />

      <div className="flex flex-col md:flex-row gap-4 mt-10 w-full max-w-4xl">
        <ImagePreview
          title="Original Image"
          type="original"
          image={originalImage}
        />
        <ImagePreview
          title="Enhanced Image"
          type="enhanced"
          image={originalImage}
        />
      </div>

      <p className="text-sm text-gray-400 mt-6">Powered By @AamirsAI</p>
    </div>
  );
}
