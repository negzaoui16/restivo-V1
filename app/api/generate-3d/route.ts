import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { extractImageBlob } from "./image-parser";
import { generateWithTrellis } from "./trellis";
import { applyFallbackModel } from "./fallback";
import { ensureGlbNormals } from "./normals";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("==================================================");
    console.log("[Route: generate-3d] Received new 3D generation request");

    const formData = await req.formData();
    const image = formData.get("image");
    const imageUrl = formData.get("imageUrl") as string | null;

    if (!image && !imageUrl) {
      console.warn("[Route: generate-3d] Validation failed: No image or imageUrl provided.");
      return NextResponse.json(
        { ok: false, error: "Please provide an image file or image URL." },
        { status: 400 }
      );
    }

    const name = ((formData.get("name") as string | null) || "").toLowerCase();
    const category = ((formData.get("category") as string | null) || "").toLowerCase();

    const uniqueId = crypto.randomUUID();
    const outputFilename = `item-3d-${uniqueId}.glb`;
    const modelsDir = path.join(process.cwd(), "public", "models");
    await fs.mkdir(modelsDir, { recursive: true });
    const destinationPath = path.join(modelsDir, outputFilename);

    // ----------------------------------------------------
    // Function 1: extractImageBlob
    // ----------------------------------------------------
    console.log("[Route: generate-3d] [1/3] Calling extractImageBlob()...");
    const imageBlob = await extractImageBlob(image, imageUrl);

    if (!imageBlob) {
      console.error("[Route: generate-3d] extractImageBlob() returned null.");
      return NextResponse.json(
        { ok: false, error: "Failed to read image data." },
        { status: 400 }
      );
    }
    console.log(`[Route: generate-3d] extractImageBlob() succeeded! Blob size: ${imageBlob.size} bytes`);

    let generated = false;

    // ----------------------------------------------------
    // Function 2: generateWithTrellis
    // ----------------------------------------------------
    console.log("[Route: generate-3d] [2/3] Calling generateWithTrellis()...");
    try {
      generated = await generateWithTrellis(imageBlob, destinationPath);
      console.log("[Route: generate-3d] generateWithTrellis() succeeded! Model written to disk.");
    } catch (trellisError: any) {
      console.warn(
        `[Route: generate-3d] generateWithTrellis() failed: ${trellisError?.message || trellisError}`
      );
    }

    // ----------------------------------------------------
    // Function 3: applyFallbackModel (if TRELLIS failed or quota exceeded)
    // ----------------------------------------------------
    if (!generated) {
      console.log("[Route: generate-3d] [3/3] Calling applyFallbackModel()...");
      const fallbackResult = await applyFallbackModel({
        name,
        category,
        modelsDir,
        destinationPath,
      });
      console.log(`[Route: generate-3d] applyFallbackModel() finished using: ${fallbackResult}`);
      generated = true;
    }

    // Ensure GLB has vertex normals for Android Scene Viewer & Filament AR engine
    if (generated) {
      await ensureGlbNormals(destinationPath);
    }

    const publicUrl = `/models/${outputFilename}`;
    console.log(`[Route: generate-3d] Request completed successfully. Public URL: ${publicUrl}`);
    console.log("==================================================");

    return NextResponse.json({
      ok: true,
      model3dUrl: publicUrl,
      message: "3D model generated successfully!",
    });
  } catch (error: any) {
    console.error("[Route: generate-3d] Fatal error during POST:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate 3D model." },
      { status: 500 }
    );
  }
}
