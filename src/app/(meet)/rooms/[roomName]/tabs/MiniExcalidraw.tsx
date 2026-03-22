'use client';

import { useRef, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/meet/api';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
);

interface MiniExcalidrawProps {
  elements: any[];
  files?: Record<string, any>;
  onChange: (elements: any[], files?: Record<string, any>) => void;
  editable?: boolean;
}

// Track which files have been uploaded to avoid re-uploading
const uploadedFilesCache = new Set<string>();

// Cache for fetched images (MinIO URL -> data URL)
const fetchedImagesCache = new Map<string, string>();

// Convert a MinIO URL to a data URL for Excalidraw to render
async function fetchImageAsDataURL(url: string): Promise<string | null> {
  try {
    // Check cache first
    const cached = fetchedImagesCache.get(url);
    if (cached) return cached;

    const response = await fetch(url);
    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataURL = reader.result as string;
        fetchedImagesCache.set(url, dataURL);
        resolve(dataURL);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Failed to fetch image:', err);
    return null;
  }
}

// Upload a blob/dataURL to MinIO and return the URL
async function uploadImageToServer(fileId: string, dataURL: string): Promise<string | null> {
  try {
    // Skip if already uploaded
    if (uploadedFilesCache.has(fileId)) return null;

    // Convert data URL to blob
    const response = await fetch(dataURL);
    const blob = await response.blob();

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, `whiteboard-${fileId}.png`);

    // Upload to server
    const result = await api.upload<{ data: { url: string } }>('/upload', formData);
    const url = result?.data?.url || (result as any)?.url;

    if (url) {
      uploadedFilesCache.add(fileId);
      return url;
    }
    return null;
  } catch (err) {
    console.error('Failed to upload whiteboard image:', err);
    return null;
  }
}

function MiniExcalidrawInner({
  elements,
  files: initialFiles,
  onChange,
  editable = true,
}: MiniExcalidrawProps) {
  const excalidrawRef = useRef<any>(null);
  const isRemoteRef = useRef(false);
  const lastElementsRef = useRef<string>('');
  const filesRef = useRef<Record<string, any>>(initialFiles || {});
  const apiReadyRef = useRef(false);
  const pendingFilesRef = useRef<Record<string, any> | null>(null);

  // Handle changes from Excalidraw
  const handleChange = useCallback(async (
    newElements: readonly any[],
    appState: any,
    files: Record<string, any>
  ) => {
    if (isRemoteRef.current) return;

    // Only emit if elements actually changed
    const serialized = JSON.stringify(newElements);
    if (serialized === lastElementsRef.current) return;
    lastElementsRef.current = serialized;

    // Check for new image files that need uploading
    const updatedFiles = { ...filesRef.current };
    let hasNewUploads = false;

    for (const [fileId, fileData] of Object.entries(files || {})) {
      if (!updatedFiles[fileId]) {
        // New file - check if it's a local blob/dataURL that needs uploading
        const dataURL = (fileData as any)?.dataURL;
        if (dataURL && (dataURL.startsWith('data:') || dataURL.startsWith('blob:'))) {
          const uploadedUrl = await uploadImageToServer(fileId, dataURL);
          if (uploadedUrl) {
            updatedFiles[fileId] = {
              ...fileData,
              dataURL: uploadedUrl, // Replace with server URL
            };
            hasNewUploads = true;
          } else {
            updatedFiles[fileId] = fileData;
          }
        } else {
          updatedFiles[fileId] = fileData;
        }
      }
    }

    if (hasNewUploads) {
      filesRef.current = updatedFiles;
      // Update scene with new file URLs
      excalidrawRef.current?.updateScene({
        elements: newElements,
        appState: { ...appState, theme: 'dark' },
      });
    }

    onChange([...newElements], updatedFiles);
  }, [onChange]);

  // Update files ref when prop changes
  useEffect(() => {
    if (initialFiles) {
      filesRef.current = { ...filesRef.current, ...initialFiles };
    }
  }, [initialFiles]);

  // Process files helper function - convert HTTP URLs to data URLs for Excalidraw
  const processAndAddFiles = useCallback(async (files: Record<string, any>) => {
    if (!excalidrawRef.current || Object.keys(files).length === 0) return;

    const processedFiles: any[] = [];

    for (const [fileId, fileData] of Object.entries(files)) {
      const dataURL = (fileData as any)?.dataURL;

      // If it's an HTTP URL (from MinIO), fetch and convert to data URL
      if (dataURL && (dataURL.startsWith('http://') || dataURL.startsWith('https://'))) {
        const fetchedDataURL = await fetchImageAsDataURL(dataURL);
        if (fetchedDataURL) {
          processedFiles.push({
            ...fileData,
            id: fileId,
            dataURL: fetchedDataURL,
          });
        }
      } else if (dataURL) {
        // Already a data URL, use as is
        processedFiles.push({ ...fileData, id: fileId });
      }
    }

    if (processedFiles.length > 0 && excalidrawRef.current) {
      excalidrawRef.current.addFiles(processedFiles);
    }
  }, []);

  // Update scene when elements prop changes (from remote)
  useEffect(() => {
    if (!excalidrawRef.current || !apiReadyRef.current) return;

    const serialized = JSON.stringify(elements);
    if (serialized === lastElementsRef.current) return;

    isRemoteRef.current = true;
    lastElementsRef.current = serialized;

    // Update scene with elements
    excalidrawRef.current.updateScene({
      elements,
      appState: { theme: 'dark' },
    });

    // Process and add files
    if (initialFiles && Object.keys(initialFiles).length > 0) {
      processAndAddFiles(initialFiles);
    }

    setTimeout(() => { isRemoteRef.current = false; }, 50);
  }, [elements, initialFiles, processAndAddFiles]);

  // Handle API ready - process any pending files
  const handleAPIReady = useCallback((api: any) => {
    excalidrawRef.current = api;
    apiReadyRef.current = true;

    // Process any files that were passed before API was ready
    if (initialFiles && Object.keys(initialFiles).length > 0) {
      processAndAddFiles(initialFiles);
    }
  }, [initialFiles, processAndAddFiles]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#121212' }}>
      <Excalidraw
        excalidrawAPI={handleAPIReady}
        onChange={handleChange}
        initialData={{
          elements: elements || [],
          appState: { theme: 'dark' },
          // Don't pass files here - they are processed and added via useEffect
          // to handle HTTP URLs from MinIO that need conversion to data URLs
        }}
        viewModeEnabled={!editable}
        theme="dark"
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: false,
            export: false,
            saveAsImage: false,
          },
        }}
      />
    </div>
  );
}

export default memo(MiniExcalidrawInner);
