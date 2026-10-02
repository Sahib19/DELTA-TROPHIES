import { model, Schema } from 'mongoose';

interface SiteSetting {
  key: string;
  theme: 'dark' | 'light';
}

const siteSettingSchema = new Schema<SiteSetting>(
  {
    key: { type: String, required: true, unique: true },
    theme: { type: String, enum: ['dark', 'light'], required: true },
  },
  { collection: 'site_settings', versionKey: false },
);

export const SiteSettingModel = model<SiteSetting>('SiteSetting', siteSettingSchema);
