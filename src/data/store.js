// Manages data synchronization and asset library

// Ensure WebsimSocket exists or mock it for safety
let room;
try {
    room = new WebsimSocket();
} catch (e) {
    console.error("WebsimSocket not found:", e);
    // Mock for dev safety
    room = {
        collection: () => ({
            filter: () => ({ getList: async () => [], subscribe: () => {} }),
            create: async () => ({}),
            update: async () => {},
            subscribe: () => {}
        })
    };
}

class DataManager {
    constructor() {
        this.assets = [];
        this.listeners = [];
        this.currentUser = null;
        this.userRecord = null;
        this.init();
    }

    async init() {
        try {
            this.currentUser = await window.websim.getCurrentUser();

            // Find existing record for this user
            const records = await room.collection('user_data')
                .filter({ username: this.currentUser.username })
                .getList();

            if (records.length > 0) {
                this.userRecord = records[0];
            } else {
                // Create initial record with requested columns
                this.userRecord = await room.collection('user_data').create({
                    column_1: [], // Assets
                    column_2: { theme: 'default' }, // Settings
                    column_3: {}, 
                    column_4: {},
                    column_5: {},
                    column_6: {},
                    column_7: {},
                    column_8: {},
                    column_9: {},
                    column_10: {},
                });
            }

            this.parseAssets();
            this.subscribeToChanges();
        } catch (e) {
            console.error("DataManager init failed:", e);
        }
    }

    subscribeToChanges() {
        room.collection('user_data').subscribe((records) => {
            if (!this.userRecord) return;

            const myRecord = records.find(r => r.id === this.userRecord.id);
            if (myRecord) {
                this.userRecord = myRecord;
                this.parseAssets();
                this.notify();
            }
        });
    }

    parseAssets() {
        // column_1 contains the asset list
        this.assets = Array.isArray(this.userRecord?.column_1) ? this.userRecord.column_1 : [];
    }

    getAssets() {
        return this.assets;
    }

    subscribe(cb) {
        this.listeners.push(cb);
        // Invoke immediately with current state
        cb({ assets: this.assets });
        return () => {
            this.listeners = this.listeners.filter(l => l !== cb);
        };
    }

    notify() {
        this.listeners.forEach(cb => cb({ assets: this.assets }));
    }

    async uploadAsset(file, type) {
        if (!this.userRecord) {
            console.error("User record not ready");
            return;
        }

        try {
            // 1. Upload to Blob Storage (or fall back to local blob URL)
            let url;
            try {
                if (window.websim && typeof window.websim.upload === 'function') {
                    url = await window.websim.upload(file);
                } else {
                    console.warn("websim.upload not available, using local object URL for asset.");
                    url = URL.createObjectURL(file);
                }
            } catch (uploadError) {
                console.warn("Upload via websim failed, falling back to local object URL.", uploadError);
                url = URL.createObjectURL(file);
            }

            // 2. Generate Metadata (Simulated AI)
            const metadata = {
                id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
                name: file.name.split('.')[0],
                fullName: file.name,
                type: type, // 'model', 'image', 'audio'
                url: url,
                extension: file.name.split('.').pop(),
                size: file.size,
                uploaded_at: new Date().toISOString(),
                description: `Auto-generated: A ${type} file uploaded by ${this.currentUser?.username || 'guest'}`
            };

            // 3. Append to Column 1 (Assets)
            const currentAssets = this.userRecord.column_1 || [];
            const newAssets = [...currentAssets, metadata];

            try {
                await room.collection('user_data').update(this.userRecord.id, {
                    column_1: newAssets
                });
            } catch (remoteError) {
                console.warn("Remote user_data update failed; using local-only asset list.", remoteError);
            }

            // 4. Always update local cache so UI reflects the new asset immediately
            this.userRecord = {
                ...(this.userRecord || {}),
                column_1: newAssets
            };
            this.parseAssets();
            this.notify();
        } catch (e) {
            console.error("Asset upload failed:", e);
        }
    }
}

export const dataManager = new DataManager();