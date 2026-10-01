import { readFile, writeFile } from "node:fs/promises";

const tsconfigUrl = new URL(
  "../node_modules/@vercel/analytics/tsconfig.json",
  import.meta.url,
);

try {
  const config = JSON.parse(await readFile(tsconfigUrl, "utf8"));

  // The published package includes its development config, but not its parent
  // config or test dependencies. Keep its runtime files and declarations intact.
  if (config.extends === "../../tsconfig.json") {
    await writeFile(
      tsconfigUrl,
      `${JSON.stringify(
        {
          compilerOptions: {
            module: "esnext",
            moduleResolution: "bundler",
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["dist/**/*.d.ts"],
        },
        null,
        2,
      )}\n`,
    );
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
