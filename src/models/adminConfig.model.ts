import { Schema, model } from 'mongoose';

export interface AdminConfigEntry {
    value: string;
    comment?: string;
    updatedAt: Date;
}

export interface AdminConfig {
    configs: Map<string, AdminConfigEntry>;
    createdAt?: Date;
    updatedAt?: Date;
}

const adminConfigEntrySchema = new Schema(
    {
        value: { type: String, required: true },
        comment: { type: String },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const adminConfigSchema = new Schema<AdminConfig>(
    {
        configs: {
            type: Map,
            of: adminConfigEntrySchema,
            default: new Map(),
        },
    },
    {
        timestamps: true,
    }
);

// Post-save hook for cache updates
adminConfigSchema.post('save', async function () {
    // Dynamic import to avoid circular dependency
    try {
        const { AdminConfigCache } = await import('#util/adminConfigCache');
        AdminConfigCache.updateCache(this);
    } catch (error) {
        console.error('Failed to update admin config cache:', error);
    }
});

const AdminConfigModel = model<AdminConfig>('AdminConfig', adminConfigSchema);

export default AdminConfigModel;
