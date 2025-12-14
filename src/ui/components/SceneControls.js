import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export function SceneControls({ sceneType, setSceneType, plotSize, setPlotSize }) {
    const handlePlotSizeChange = (e) => {
        const value = Math.max(6, parseFloat(e.target.value) || 6);
        setPlotSize(value);
    };

    return html`
        <div
            style=${{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 18px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '999px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                pointerEvents: 'auto',
                fontSize: '12px',
                color: '#4a5568',
                zIndex: 110
            }}
        >
            <div style=${{display:'flex', alignItems:'center', gap:'8px'}}>
                <span style=${{fontWeight:'600'}}>Scene</span>
                <button
                    onClick=${() => setSceneType('outdoor')}
                    style=${{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: sceneType === 'outdoor' ? '#3182ce' : '#e2e8f0',
                        color: sceneType === 'outdoor' ? '#fff' : '#4a5568'
                    }}
                >
                    Outdoor
                </button>
                <button
                    onClick=${() => setSceneType('indoor')}
                    style=${{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: sceneType === 'indoor' ? '#3182ce' : '#e2e8f0',
                        color: sceneType === 'indoor' ? '#fff' : '#4a5568'
                    }}
                >
                    Indoor
                </button>
            </div>
            <div style=${{width:'1px', height:'20px', background:'#cbd5e0'}}></div>
            <div style=${{display:'flex', alignItems:'center', gap:'6px'}}>
                <span style=${{fontWeight:'600'}}>Plot</span>
                <input
                    type="number"
                    min="6"
                    value=${plotSize}
                    onChange=${handlePlotSizeChange}
                    style=${{
                        width: '60px',
                        padding: '4px 6px',
                        borderRadius: '8px',
                        border: '1px solid '#cbd5e0',
                        fontSize: '12px'
                    }}
                />
                <span style=${{color:'#a0aec0'}}>m</span>
            </div>
        </div>
    `;
}

