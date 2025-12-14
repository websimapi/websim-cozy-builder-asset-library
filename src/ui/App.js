import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { World } from '../engine/world.js';
import { AssetLibrary } from './components/AssetLibrary.js';
import { SceneControls } from './components/SceneControls.js';

const html = htm.bind(React.createElement);

// removed Icon components -> moved to src/ui/icons.js
// removed AssetCard component -> moved to src/ui/components/AssetCard.js
// removed UploadModal component -> moved to src/ui/components/UploadModal.js
// removed AssetLibrary component -> moved to src/ui/components/AssetLibrary.js
// removed inline scene controls UI -> moved to src/ui/components/SceneControls.js

export function App() {
    const worldRef = useRef(null);
    const [sceneType, setSceneType] = useState('outdoor'); // 'outdoor' | 'indoor'
    const [plotSize, setPlotSize] = useState(10); // min 6

    useEffect(() => {
        const container = document.getElementById('canvas-container');
        if (container && !worldRef.current) {
            worldRef.current = new World(container, { sceneType, plotSize });
        }
    }, []);

    useEffect(() => {
        if (worldRef.current) {
            worldRef.current.updateEnvironment(sceneType, plotSize);
        }
    }, [sceneType, plotSize]);

    const handleSpawn = (asset) => {
        if (worldRef.current) {
            worldRef.current.spawnAsset(asset);
        }
    };

    return html`
        <div>
            <${AssetLibrary} onSpawn=${handleSpawn} />
            <${SceneControls}
                sceneType=${sceneType}
                setSceneType=${setSceneType}
                plotSize=${plotSize}
                setPlotSize=${setPlotSize}
            />
        </div>
    `;
}

