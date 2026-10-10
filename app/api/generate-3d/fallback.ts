import { promises as fs } from "fs";
import path from "path";

export interface FallbackOptions {
  name: string;
  category: string;
  modelsDir: string;
  destinationPath: string;
}

export async function applyFallbackModel({
  name,
  category,
  modelsDir,
  destinationPath,
}: FallbackOptions): Promise<string> {
  let chosenModel = "pizza-pepperoni.glb";

  const isPizza =
    name.includes("pizza") ||
    category.includes("pizza") ||
    name.includes("saison") ||
    name.includes("margherita") ||
    name.includes("calzone") ||
    name.includes("reine") ||
    name.includes("4");

  if (isPizza) {
    chosenModel = "pizza-pepperoni.glb";
  } else {
    chosenModel = "pizza.glb";
  }

  const fallbackSource = path.join(modelsDir, chosenModel);
  console.log(`[Fallback] Selected contextual model: ${chosenModel}`);

  try {
    await fs.copyFile(fallbackSource, destinationPath);
    console.log(`[Fallback] Successfully copied ${chosenModel} to destination.`);
    return chosenModel;
  } catch (err) {
    console.warn(`[Fallback] Primary fallback failed, falling back to default pizza.glb...`);
    const defaultSource = path.join(modelsDir, "pizza.glb");
    await fs.copyFile(defaultSource, destinationPath);
    console.log(`[Fallback] Successfully copied default pizza.glb to destination.`);
    return "pizza.glb";
  }
}
