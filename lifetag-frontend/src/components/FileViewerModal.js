// src/components/FileViewerModal.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './FileViewerModal.css';

const FileViewerModal = ({ record, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    // This effect runs when the 'record' prop changes
    const fetchFile = async () => {
      if (!record) return;

      setLoading(true);
      setError(null);
      setFileUrl(null);

      try {
        // 1. Call our NEW backend endpoint
        const response = await apiClient.get(
          `/records/view/${record.id}`, 
          {
            headers: { Authorization: `Bearer ${auth.token}` },
            responseType: 'blob', // We expect raw file data
          }
        );

        // 2. Get the file type from the response header
        const contentType = response.headers['content-type'];
        setFileType(contentType);

        // 3. Create a temporary local URL for the browser to display
        const file = new Blob([response.data], { type: contentType });
        const localUrl = URL.createObjectURL(file);
        setFileUrl(localUrl);
        
      } catch (err) {
        console.error('Error fetching file:', err);
        setError('Could not load or access this file.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    // 4. Clean up the temporary URL when the modal closes
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, auth.token]); // Run only when the record changes

  // 5. Decide how to render the file (PDF, image, or text)
  const renderFile = () => {
    if (loading) return <p>Loading file...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!fileUrl) return null;

    if (fileType.includes('pdf')) {
      return <iframe src={fileUrl} title={record.fileName} />;
    }
    if (fileType.startsWith('image/')) {
      return <img src={fileUrl} alt={record.fileName} />;
    }
    if (fileType.startsWith('text/')) {
      // We need to fetch it again, but as text
      return <TextFileViewer url={fileUrl} />;
    }
    
    // Fallback for unsupported types (e.g., .docx)
    return (
      <div className="download-fallback">
        <p>Cannot preview this file type ({fileType}).</p>
        <a href={fileUrl} download={record.fileName} className="primary-button">
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{record.fileName}</h3>
          {/* This is the "small cross on top" */}
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </div>
        <div className="modal-body">
          {renderFile()}
        </div>
      </div>
    </div>
  );
};

// A helper component to display .txt files
const TextFileViewer = ({ url }) => {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch(url)
      .then(response => response.text())
      .then(textContent => setText(textContent));
  }, [url]);

  return <pre className="text-file-content">{text}</pre>;
};

export default FileViewerModal;