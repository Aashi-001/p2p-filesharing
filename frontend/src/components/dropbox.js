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
    // <div
    //   onDrop={handleDrop}
    //   onDragOver={handleDragOver}
    //   onClick={() => inputRef.current.click()}
    //   style={{
    //     // border: '2px dashed #000000',
    //     // padding: '2rem',
    //     // textAlign: 'center',
    //     // cursor: 'pointer',
    //     // borderRadius: '8px',
    //     // height: '100px', width: '50%',
    //     // margin: '0 auto',
    //     border: '2px dashed #000000',
    //     width: '600px',
    //     height: '200px',
    //     padding: '2rem',
    //     textAlign: 'center',
    //     cursor: 'pointer',
    //     borderRadius: '8px',
    //     margin: '20px auto',
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center'
    //   }}
    // >
    //   <p>Click or Drag & Drop a file here</p>
    //   <input
    //     type="file"
    //     onChange={handleFileChange}
    //     ref={inputRef}
    //     style={{ display: 'none'}} //, height: '180px', width: '800px',}}
    //   />
    // </div>
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current.click()}
      style={{
        border: '2px dashed #000000',
        // width: '600px',
        height: '200px',
        textAlign: 'center',
        cursor: 'pointer',
        borderRadius: '12px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
  <p>Click or Drag & Drop a file here</p>
  <input
    type="file"
    onChange={handleFileChange}
    ref={inputRef}
    style={{ display: 'none', width: '80%' }}
  />
</div>

  );
};

export default DropBoxUploader;
