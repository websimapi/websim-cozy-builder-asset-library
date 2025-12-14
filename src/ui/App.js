import React, { useState, useEffect, useRef } from 'react';
import { dataManager } from '../data/store.js';
import { World } from '../engine/world.js';

// --- Icons (Simple SVGs) ---
const Icon3D = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const IconImage = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const IconUpload = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const IconChevronLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconChevronRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>;

// --- Components ---

function AssetCard({ asset, onClick }) {
    return (
        <div 
            className="asset-card"
            onClick={() => onClick(asset)}
            style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                minWidth: '120px',
                height: '140px',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}
        >
            <div style={{ 
                width: '100%', height: '80px', background: '#f8f9fa', 
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: '8px', position: 'relative'
            }}>
                {asset.type === 'image' || asset.type === 'texture' ? 
                    <img src={asset.url} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> :
                    <Icon3D />
                }
            </div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#334', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {asset.name}
            </div>
            <div style={{ fontSize: '10px', color: '#868e96', marginTop: '2px' }}>
                {asset.extension ? asset.extension.toUpperCase() : 'FILE'}
            </div>
        </div>
    );
}

function UploadModal({ onClose, onUpload }) {
    const [isDragging, setIsDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [statusText, setStatusText] = useState("Drag & Drop or Click");

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

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, backdropFilter: 'blur(5px)'
        }}>
            <div 
                style={{
                    width: '400px', background: 'white', borderRadius: '32px', padding: '32px',
                    display: 'flex', flexDirection: 'column', gap: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
            >
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2 style={{ margin: 0, color: '#1a202c', fontSize: '24px' }}>Add Asset</h2>
                    <button onClick={onClose} style={{background:'none',border:'none',fontSize:'24px', cursor:'pointer', color: '#a0aec0'}}>&times;</button>
                </div>
                
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                    }}
                    style={{
                        height: '220px', border: `3px dashed ${isDragging ? '#4299e1' : '#cbd5e0'}`,
                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', color: '#718096', gap: '16px',
                        background: isDragging ? '#ebf8ff' : '#f7fafc',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onClick={() => !processing && document.getElementById('file-input').click()}
                >
                    {processing ? (
                        <>
                            <div className="spinner" style={{
                                width: '32px', height: '32px', border: '4px solid #cbd5e0', 
                                borderTop: '4px solid #4299e1', borderRadius: '50%', animation: 'spin 1s linear infinite'
                            }} />
                            <span style={{fontWeight:'500'}}>{statusText}</span>
                        </>
                    ) : (
                        <>
                            <div style={{padding:'16px', background:'white', borderRadius:'50%', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.1)'}}>
                                <IconUpload />
                            </div>
                            <span style={{fontWeight:'500'}}>Click or Drop file</span>
                            <span style={{fontSize:'12px', color:'#a0aec0'}}>.glb, .png, .jpg</span>
                            <input type="file" style={{display: 'none'}} id="file-input" onChange={(e) => {
                                if(e.target.files[0]) handleFile(e.target.files[0]);
                            }} />
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
}

function AssetLibrary({ onSpawn }) {
    const [assets, setAssets] = useState([]);
    const [category, setCategory] = useState('all'); 
    const [showUpload, setShowUpload] = useState(false);

    useEffect(() => {
        setAssets(dataManager.getAssets());
        const unsub = dataManager.subscribe((data) => {
            if (data && data.assets) setAssets(data.assets);
        });
        return unsub;
    }, []);

    const filteredAssets = category === 'all' ? assets : assets.filter(a => {
        if (category === 'model') return a.type === 'model';
        if (category === 'image') return a.type === 'image' || a.type === 'texture';
        return true;
    });

    const categories = [
        { id: 'all', label: 'All Assets', icon: null },
        { id: 'model', label: '3D Models', icon: <Icon3D /> },
        { id: 'image', label: 'Images', icon: <IconImage /> },
    ];
    
    const currentIndex = categories.findIndex(c => c.id === category);

    const shiftCategory = (dir) => {
        let newIndex = currentIndex + dir;
        if (newIndex < 0) newIndex = categories.length - 1;
        if (newIndex >= categories.length) newIndex = 0;
        setCategory(categories[newIndex].id);
    };

    return (
        <>
            <div className="top-ui" style={{
                position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', maxWidth: '900px',
                pointerEvents: 'none', gap: '20px', zIndex: 100
            }}>
                {/* Header / Nav */}
                <div 
                    style={{
                        display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto',
                        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
                        padding: '12px 24px', borderRadius: '50px', 
                        boxShadow: '0 20px 40px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5)'
                    }}
                >
                    <button onClick={() => shiftCategory(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color:'#4a5568' }}><IconChevronLeft /></button>
                    
                    <div style={{ display: 'flex', gap: '12px', minWidth: '140px', justifyContent: 'center', alignItems:'center', fontWeight: '600', color: '#2d3748' }}>
                        {categories[currentIndex].icon}
                        <span>{categories[currentIndex].label}</span>
                    </div>

                    <button onClick={() => shiftCategory(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color:'#4a5568' }}><IconChevronRight /></button>
                    
                    <div style={{ width: '1px', height: '24px', background: '#cbd5e0', margin: '0 12px' }}></div>
                    
                    <button 
                        onClick={() => setShowUpload(true)} 
                        style={{
                            background: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600',
                            boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <IconUpload /> Upload New
                    </button>
                </div>

                {/* Asset List */}
                <div 
                    style={{
                        width: '100%', height: '180px', pointerEvents: 'auto',
                        overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap',
                        padding: '10px 10px 30px 10px', display: 'flex', gap: '20px', alignItems: 'flex-start',
                        // Mask can cause issues in some browsers if not careful, removing for simplicity or using standard css
                    }}
                >
                    {filteredAssets.length === 0 ? (
                        <div style={{ 
                            width: '100%', textAlign: 'center', color: '#718096', background: 'rgba(255,255,255,0.6)', 
                            padding: '40px', borderRadius: '24px', backdropFilter: 'blur(8px)',
                            border: '1px dashed #cbd5e0', fontWeight: '500'
                        }}>
                            Library is empty. Upload a 3D model (.glb) or image to start building!
                        </div>
                    ) : (
                        [...filteredAssets].reverse().map(asset => (
                            <AssetCard key={asset.id} asset={asset} onClick={onSpawn} />
                        ))
                    )}
                </div>
            </div>

            {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUpload={dataManager.uploadAsset.bind(dataManager)} />}
        </>
    );
}

export function App() {
    const worldRef = useRef(null);

    useEffect(() => {
        const container = document.getElementById('canvas-container');
        if (container && !worldRef.current) {
            worldRef.current = new World(container);
        }
    }, []);

    const handleSpawn = (asset) => {
        if (worldRef.current) {
            worldRef.current.spawnAsset(asset);
        }
    };

    return (
        <AssetLibrary onSpawn={handleSpawn} />
    );
}

