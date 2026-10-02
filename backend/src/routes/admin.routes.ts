import { Router } from 'express';
import { getStats, publishPublicCatalogue } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { noStore } from '../middleware/no-store.js';
import { setPublicTheme } from '../controllers/site-theme.controller.js';

export const adminRouter = Router();

adminRouter.use(noStore, authenticate);
adminRouter.get('/stats', getStats);
adminRouter.put('/site/theme', setPublicTheme);
adminRouter.post('/catalogue/publish', publishPublicCatalogue);
