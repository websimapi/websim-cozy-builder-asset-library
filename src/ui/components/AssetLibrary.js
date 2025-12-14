import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { dataManager } from '../../data/store.js';
import { AssetCard } from './AssetCard.js';
import { UploadModal } from './UploadModal.js';
import { Icon3D, IconImage, IconUpload, IconChevronLeft, IconChevronRight } from '../icons.js';

const html = htm.bind(React.createElement);

export function AssetLibrary({ onSpawn }) {
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
        { id: 'model', label: '3D Models', icon: html`<${Icon3D} />` },
        { id: 'image', label: 'Images', icon: html`<${IconImage} />` },
    ];
    
    const currentIndex = categories.findIndex(c => c.id === category);

    const shiftCategory = (dir) => {
        let newIndex = currentIndex + dir;
        if (newIndex < 0) newIndex = categories.length - 1;
        if (newIndex >= categories.length) newIndex = 0;
        setCategory(categories[newIndex].id);
    };

    return html`
        <div className="top-ui" style=${{
            position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', maxWidth: '900px',
            pointerEvents: 'none', gap: '20px', zIndex: 100
        }}>
            <div 
                style=${{
                    display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto',
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
                    padding: '12px 24px', borderRadius: '50px', 
                    boxShadow: '0 20px 40px -5px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5)'
                }}
            >
                <button onClick=${() => shiftCategory(-1)} style=${{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color:'#4a5568' }}><${IconChevronLeft} /></button>
                
                <div style=${{ display: 'flex', gap: '12px', minWidth: '140px', justifyContent: 'center', alignItems:'center', fontWeight: '600', color: '#2d3748' }}>
                    ${categories[currentIndex].icon}
                    <span>${categories[currentIndex].label}</span>
                </div>

                <button onClick=${() => shiftCategory(1)} style=${{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color:'#4a5568' }}><${IconChevronRight} /></button>
                
                <div style=${{ width: '1px', height: '24px', background: '#cbd5e0', margin: '0 12px' }}></div>
                
                <button 
                    onClick=${() => setShowUpload(true)} 
                    style=${{
                        background: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(49, 130, 206, 0.3)',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown=${e => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp=${e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <${IconUpload} /> Upload New
                </button>
            </div>

            <div 
                style=${{
                    width: '100%', height: '180px', pointerEvents: 'auto',
                    overflowX: 'auto', overflowY: 'hidden', whiteSpace: 'nowrap',
                    padding: '10px 10px 30px 10px', display: 'flex', gap: '20px', alignItems: 'flex-start',
                }}
            >
                ${filteredAssets.length === 0 ? html`
                    <div style=${{ 
                        width: '100%', textAlign: 'center', color: '#718096', background: 'rgba(255,255,255,0.6)', 
                        padding: '40px', borderRadius: '24px', backdropFilter: 'blur(8px)',
                        border: '1px dashed #cbd5e0', fontWeight: '500'
                    }}>
                        Library is empty. Upload a 3D model (.glb) or image to start building!
                    </div>
                ` : html`
                    ${[...filteredAssets].reverse().map(asset => html`
                        <${AssetCard} key=${asset.id} asset=${asset} onClick=${onSpawn} />
                    `)}
                `}
            </div>
        </div>

        ${showUpload ? html`<${UploadModal} onClose=${() => setShowUpload(false)} onUpload=${dataManager.uploadAsset.bind(dataManager)} />` : null}
    `;
}

