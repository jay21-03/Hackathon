import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

function listFiles(dir: string, extensions: string[]): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return listFiles(path, extensions);
    return extensions.some((extension) => path.endsWith(extension)) ? [path] : [];
  });
}

test("pages read fallback data only through service layer", () => {
  const pageFiles = listFiles(join(repoRoot, "src", "pages"), [".ts", ".tsx"]);
  const violations = pageFiles.filter((file) => {
    const source = readFileSync(file, "utf8");
    return /mocks\/hackathonDemoData|hackathonApi|apiFallback|readModelService/.test(source);
  });

  expect(violations.map((file) => relative(repoRoot, file))).toEqual([]);
});

test("web project excludes app-style runtime and device projects", () => {
  const files = [
    join(repoRoot, "playwright.config.ts"),
    ...listFiles(join(repoRoot, "src"), [".ts", ".tsx"])
  ];
  const forbiddenTerms = [
    "Mob" + "ile",
    "mob" + "ile",
    "Pix" + "el 7",
    "is" + "Mob" + "ile",
    "participant" + "Mob" + "ile" + "Nav",
    "bottom" + "-0",
    "margin-" + "mob" + "ile"
  ];
  const violations = files.filter((file) => {
    const source = readFileSync(file, "utf8");
    return forbiddenTerms.some((term) => source.includes(term));
  });

  expect(violations.map((file) => relative(repoRoot, file))).toEqual([]);
});
