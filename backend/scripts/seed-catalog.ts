import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { CategoryModel } from '../src/models/category.model.js';

const categories = [
  ['Plastic Cups (PC)', 'plastic-cups', '1. PLASTIC CUPS ( PC )'],
  ['Metal Cups', 'metal-cups', '2. METAL CUPS'],
  ['Metal Plates with Box', 'metal-plates-with-box', '3. METAL PLATES WITH BOX'],
  ['Plastic Fitted (PF)', 'plastic-fitted', '4. PLASTIC FITTED ( PF )'],
  ['Wooden Models (WPW)', 'wooden-models', '5. WOODEN MODEL ( WPW)'],
  ['Acrylic Models', 'acrylic-models', '6. ACRYLIC MODEL'],
  ['Corporate Awards (CA)', 'corporate-awards', '7. CORPORATE AWARDS ( CA )'],
  ['Wooden Awards', 'wooden-awards', '8. WOODEN AWRDS'],
  ['Special Awards & Frames', 'la-aca-ra-f-models', '9. LA,ACA,RA,F, MODEL'],
  ['Fibre Cups (FC)', 'fibre-cups', '10. FIBRE CUPS (FC )'],
  ['IC Models', 'ic-models', '11. IC MODEL'],
  ['Trophy Bases', 'trophy-bases', '12. BASE AND ACS'],
  ['Medals', 'medals', '12. BASE AND ACS'],
  ['Trophy Accessories', 'trophy-accessories', '12. BASE AND ACS'],
] as const;

async function main(): Promise<void> {
  await connectDatabase();
  await Promise.all(
    categories.map(([name, slug, cloudinaryFolder], index) =>
      CategoryModel.updateOne(
        { slug },
        { $set: { name, cloudinaryFolder, displayOrder: index + 1, isActive: true } },
        { upsert: true, runValidators: true },
      ).exec(),
    ),
  );
  logger.info({ count: categories.length }, 'Catalogue categories seeded');
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Catalogue seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
