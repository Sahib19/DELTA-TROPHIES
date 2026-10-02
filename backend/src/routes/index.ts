import { Router } from 'express';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { categoryRouter } from './category.routes.js';
import { inquiryRouter } from './inquiry.routes.js';
import { productRouter } from './product.routes.js';
import { getPublicTheme } from '../controllers/site-theme.controller.js';

export const apiRouter = Router();

apiRouter.get('/site/theme', getPublicTheme);
apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/inquiries', inquiryRouter);
apiRouter.use('/admin', adminRouter);
