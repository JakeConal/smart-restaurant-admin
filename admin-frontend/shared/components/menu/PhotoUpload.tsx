"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Modal, Button } from "@/shared/components/ui";
import { Upload, X, Star, Image as ImageIcon } from "lucide-react";
import type { MenuItem, MenuItemPhoto } from "@/shared/types/menu";
import { menuApi } from "@/shared/lib/api/menu";

export interface PhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onSetPrimary: (photoId: string) => Promise<void>;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  isOpen,
  onClose,
  item,
  onUpload,
  onDelete,
  onSetPrimary,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  // Fetch photo data when modal opens
  useEffect(() => {
    if (isOpen && item.photos) {
      const fetchPhotoUrls = async () => {
        // Clean up previous URLs before fetching new ones
        Object.values(photoUrls).forEach((url) => URL.revokeObjectURL(url));

        const urls: Record<string, string> = {};
        for (const photo of item.photos!) {
          try {
            const blob = await menuApi.getPhotoData(item.id, photo.id);
            urls[photo.id] = URL.createObjectURL(blob);
          } catch (error) {
            console.error(`Failed to load photo ${photo.id}:`, error);
          }
        }
        setPhotoUrls(urls);
      };
      fetchPhotoUrls();
    } else if (!isOpen) {
      // Clean up URLs when modal closes
      Object.values(photoUrls).forEach((url) => URL.revokeObjectURL(url));
      setPhotoUrls({});
    }
  }, [isOpen, item.photos, item.id]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(photoUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload failed:", error);
      // Note: Toast should be passed via props from parent component
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      await onDelete(photoId);
    } catch (error) {
      console.error("Delete failed:", error);
      // Note: Toast should be passed via props from parent component
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await onSetPrimary(photoId);
    } catch (error) {
      console.error("Set primary failed:", error);
      // Note: Toast should be passed via props from parent component
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Photos for ${item.name}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            dragActive
              ? "border-slate-700 bg-slate-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="photo-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, or WebP (max 5MB each)
            </p>
          </label>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-900">
                Selected Files ({selectedFiles.length})
              </h4>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                loading={uploading}
              >
                Upload {selectedFiles.length}{" "}
                {selectedFiles.length === 1 ? "Photo" : "Photos"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-24 object-cover rounded-xl"
                  />
                  <button
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Photos */}
        {item.photos && item.photos.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900">
              Current Photos ({item.photos.length})
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {item.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  {photoUrls[photo.id] ? (
                    <img
                      src={photoUrls[photo.id]}
                      alt="Menu item"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-32 bg-slate-100 rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  {photo.isPrimary && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      Primary
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    {!photo.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(photo.id)}
                        className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">No photos yet</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
