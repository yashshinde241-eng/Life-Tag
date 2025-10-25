// src/components/FileViewerModal.js
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./FileViewerModal.css";

// 1. Accept the new isReadOnly prop (default to false)
const FileViewerModal = ({ record, onClose, isReadOnly = false }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState("");
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
        const response = await apiClient.get(`/records/view/${record.id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
          responseType: "blob", // We expect raw file data
        });

        // 2. Get the file type from the response header
        const contentType = response.headers["content-type"];
        setFileType(contentType);

        // 3. Create a temporary local URL for the browser to display
        const file = new Blob([response.data], { type: contentType });
        const localUrl = URL.createObjectURL(file);
        setFileUrl(localUrl);
      } catch (err) {
        console.error("Error fetching file:", err);
        setError("Could not load or access this file.");
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

    if (fileType.includes("pdf")) {
      // --- USE <object> INSTEAD ---
      return (
        <object
          data={fileUrl}
          type="application/pdf"
          width="100%"
          height="100%"
        >
          {/* Fallback if object doesn't load */}
          <p>Unable to display PDF. You can try downloading it.</p>
          {!isReadOnly && (
            <a
              href={fileUrl}
              download={record.fileName}
              className="primary-button"
            >
              Download PDF
            </a>
          )}
        </object>
      );
      // --- END <object> ---
    }
    if (fileType.startsWith("image/")) {
      // Images are usually view-only anyway
      return <img src={fileUrl} alt={record.fileName} />;
    }
    if (fileType.startsWith("text/")) {
      return <TextFileViewer url={fileUrl} />;
    }

    // 3. Conditionally show the Download button
    return (
      <div className="download-fallback">
        <p>Cannot preview this file type ({fileType}).</p>
        {!isReadOnly && ( // Only show if NOT read-only
          <a
            href={fileUrl}
            download={record.fileName}
            className="primary-button"
          >
            Download File
          </a>
        )}
      </div>
    );
  };

  return ReactDOM.createPortal(
    <div className="file-modal-backdrop" onClick={onClose}>
      <div className="file-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="file-modal-header">
          <h3>{record.fileName}</h3>
          {/* This is the "small cross on top" */}
          <button onClick={onClose} className="file-modal-close-button">
            &times;
          </button>
        </div>
        <div className="file-modal-body">{renderFile()}</div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

// A helper component to display .txt files
const TextFileViewer = ({ url }) => {
  const [text, setText] = useState("");
  useEffect(() => {
    fetch(url)
      .then((response) => response.text())
      .then((textContent) => setText(textContent));
  }, [url]);

  return <pre className="file-text-file-content">{text}</pre>;
};

export default FileViewerModal;
