import React, { useState, useRef } from 'react';
import htm from 'htm';
import { IconUpload } from '../icons.js';

const html = htm.bind(React.createElement);

export function UploadModal({ onClose, onUpload }) {
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState("Drag & Drop or Click");
    const fileInputRef = useRef(null);

    const handleFile = async (file) => {
        setProcessing(true);
        setStatusText("Detecting File Type...");
        
        let type = 'unknown';
        const ext = file.name.split('.').pop().toLowerCase();
        if (['glb', 'gltf', 'obj', 'fbx'].includes(ext)) type = 'model';
        else if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) type = 'image';
        else if (['mp3', 'wav'].includes(ext)) type = 'audio';

        setStatusText("AI Generating Metadata...");
        await onUpload(file, type);
        
        setStatusText("Upload Complete!");
        setTimeout(() => onClose(), 1000);
    };

    return html`
        <div style=${{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, backdropFilter: 'blur(5px)'
        }}>
            <div 
                style=${{
                    width: '400px', background: 'white', borderRadius: '32px', padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <div style=${{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2 style=${{ margin: 0, color: '#1a202c', fontSize: '24px' }}>Add Asset</h2>
                    <button onClick=${onClose} style=${{background:'none',border:'none',fontSize:'24px', cursor:'pointer', color: '#a0aec0'}}>&times;</button>
                </div>
                
                <div 
                    onDragOver=${(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave=${() => setIsDragging(false)}
                    onDrop=${(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                    }}
                    style=${{
                        height: '220px', border: `3px dashed ${isDragging ? '#4299e1' : '#cbd5e0'}`,
                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', color: '#718096', gap: '16px',
                        background: isDragging ? '#ebf8ff' : '#f7fafc',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onClick=${() => {
                        if (!processing && fileInputRef.current) {
                            fileInputRef.current.click();
                        }
                    }}
                >
                    ${processing ? html`
                        <div className="spinner" style=${{
                            width: '32px', height: '32px', border: '4px solid #cbd5e0', 
                            borderTop: '4px solid #4299e1', borderRadius: '50%', animation: 'spin 1s linear infinite'
                        }} />
                        <span style=${{fontWeight:'500'}}>${statusText}</span>
                    ` : html`
                        <div style=${{padding:'16px', background:'white', borderRadius:'50%', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                            <${IconUpload} />
                        </div>
                        <span style=${{fontWeight:'500'}}>Click or Drop file</span>
                        <span style=${{fontSize:'12px', color:'#a0aec0'}}>.glb, .png, .jpg</span>
                        <input 
                            type="file" 
                            style=${{display: 'none'}} 
                            ref=${fileInputRef} 
                            onClick=${(e) => e.stopPropagation()} 
                            onChange=${(e) => {
                                if(e.target.files[0]) handleFile(e.target.files[0]);
                                e.target.value = '';
                            }} 
                        />
                    `}
                </div>
            </div>
        </div>
    `;
}

