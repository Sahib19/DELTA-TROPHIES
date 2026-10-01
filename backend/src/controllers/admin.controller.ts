import type { RequestHandler } from 'express';
import { getAdminStats } from '../services/admin.service.js';
import { publishCatalogue } from '../services/catalogue-publication.service.js';

export const getStats: RequestHandler = async (_request, response) => {
  response.status(200).json({ success: true, stats: await getAdminStats() });
};

export const publishPublicCatalogue: RequestHandler = async (_request, response) => {
  response.status(200).json({
    success: true,
    catalogue: await publishCatalogue(),
  });
};
