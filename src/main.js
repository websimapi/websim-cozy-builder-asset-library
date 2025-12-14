import React from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import { App } from './ui/App.js';

// Bind htm to React
const html = htm.bind(React.createElement);

console.log("Cozy Builder: Main module loaded.");

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("Root element not found");
    }
    const root = createRoot(rootElement);
    // Use html template literal instead of JSX
    root.render(html`<${App} />`);
    console.log("Cozy Builder: UI Mounted successfully.");
} catch (error) {
    console.error("Cozy Builder: Failed to mount UI", error);
    document.body.innerHTML += `<div style="position:fixed;top:10px;left:10px;background:red;color:white;padding:10px;z-index:9999">UI Error: ${error.message}</div>`;
}

