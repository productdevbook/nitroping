import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const checkOnly = Bun.argv.includes("--check");
const generator = "@openapitools/openapi-generator-cli@latest";

const targets = [
  {
    name: "Swift",
    generatorName: "swift5",
    output: join(root, "packages/ios/.generated-openapi"),
    properties: "packageName=NitroPingOpenAPIGenerated",
  },
  {
    name: "Kotlin",
    generatorName: "kotlin",
    output: join(root, "packages/android/.generated-openapi"),
    properties: "packageName=dev.nitroping.openapi.generated,library=multiplatform,serializationLibrary=kotlinx_serialization,dateLibrary=kotlinx-datetime",
  },
];

await mkdir(join(root, ".tmp"), { recursive: true });

for (const target of targets) {
  if (!checkOnly) await rm(target.output, { recursive: true, force: true });
  const output = checkOnly ? join(root, ".tmp", `nitroping-${target.generatorName}`) : target.output;
  await rm(output, { recursive: true, force: true });
  const args = [
    "--bun",
    generator,
    "generate",
    "-i",
    join(root, "openapi.yaml"),
    "-g",
    target.generatorName,
    "-o",
    output,
    "--global-property",
    "models,modelDocs=false,modelTests=false",
    "--additional-properties",
    target.properties,
  ];
  console.log(`${target.name}: generating models from openapi.yaml`);
  const result = Bun.spawnSync(["bunx", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(`${target.name} model generation failed (${result.exitCode})\n${stderr.slice(-4000)}`);
  }
}

if (checkOnly) {
  await rm(join(root, ".tmp"), { recursive: true, force: true });
  console.log("Native OpenAPI model generation check passed.");
}
