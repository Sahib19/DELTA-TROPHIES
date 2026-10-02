import type { RequestHandler } from 'express';
import { SiteSettingModel } from '../models/site-setting.model.js';
import { ApiError } from '../utils/api-error.js';

const THEME_KEY = 'public-theme';

export const getPublicTheme: RequestHandler = async (_request, response) => {
  const setting = await SiteSettingModel.findOne({ key: THEME_KEY }).lean();
  response.set('Cache-Control', 'no-store');
  response.status(200).json({ success: true, theme: setting?.theme ?? 'dark' });
};

export const setPublicTheme: RequestHandler = async (request, response) => {
  const body: unknown = request.body;
  const theme = body && typeof body === 'object' && 'theme' in body ? body.theme : undefined;
  if (theme !== 'dark' && theme !== 'light') {
    throw new ApiError(422, 'INVALID_THEME', 'Theme must be dark or light');
  }
  const setting = await SiteSettingModel.findOneAndUpdate(
    { key: THEME_KEY },
    { $set: { theme } },
    { upsert: true, new: true, runValidators: true },
  );
  response.status(200).json({ success: true, theme: setting.theme });
};
