import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { backendRoot } from '../src/config/env.js';
import {
  buildCatalogueManifest,
  uploadCatalogueManifest,
} from '../src/services/catalogue-publication.service.js';

async function main(): Promise<void> {
  await connectDatabase();
  try {
    const manifest = await buildCatalogueManifest();
    const outputPath = path.resolve(backendRoot, '../frontend/public/catalogue.json');
    await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    const result = process.argv.includes('--upload')
      ? await uploadCatalogueManifest(manifest)
      : undefined;
    process.stdout.write(
      `${JSON.stringify(
        {
          output: outputPath,
          products: manifest.products.length,
          categories: manifest.categories.length,
          version: manifest.version,
          uploaded: result?.published ?? false,
          url: result?.url,
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    await disconnectDatabase();
  }
}

await main();
