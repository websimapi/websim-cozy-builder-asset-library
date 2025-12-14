import React from 'react';
import htm from 'htm';
import { Icon3D } from '../icons.js';

const html = htm.bind(React.createElement);

export function AssetCard({ asset, onClick }) {
    return html`
        <div 
            className="asset-card"
            onClick=${() => onClick(asset)}
            style=${{
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
            onMouseEnter=${e => {
                e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave=${e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}
        >
            <div style=${{ 
                width: '100%', height: '80px', background: '#f8f9fa', 
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', marginBottom: '8px', position: 'relative'
            }}>
                ${(asset.type === 'image' || asset.type === 'texture') ? 
                    html`<img src=${asset.url} style=${{width: '100%', height: '100%', objectFit: 'cover'}} />` :
                    html`<${Icon3D} />`
                }
            </div>
            <div style=${{ fontSize: '13px', fontWeight: '600', color: '#334', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ${asset.name}
            </div>
            <div style=${{ fontSize: '10px', color: '#868e96', marginTop: '2px' }}>
                ${asset.extension ? asset.extension.toUpperCase() : 'FILE'}
            </div>
        </div>
    `;
}

