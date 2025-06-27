import React, { useRef } from 'react';

const DropBoxUploader = ({ onFileSelected }) => {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current.click()}
      style={{
        border: '2px dashed #aaa',
        padding: '2rem',
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '8px',
        height: '100px', width: '50%',
        margin: '0 auto',
      }}
    >
      <p>Click or Drag & Drop a file here</p>
      <input
        type="file"
        onChange={handleFileChange}
        ref={inputRef}
        style={{ display: 'none'}}
      />
    </div>
  );
};

export default DropBoxUploader;
