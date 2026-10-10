import { promises as fs } from "fs";
import crypto from "crypto";

const BASE = "https://trellis-community-trellis.hf.space/gradio_api";

export async function generateWithTrellis(
  imageBlob: Blob,
  destinationPath: string
): Promise<boolean> {
  const hfToken = process.env.HUGGINGFACE_TOKEN || "";
  const authHeaders: Record<string, string> = hfToken
    ? { Authorization: `Bearer ${hfToken}` }
    : {};

  const sessionHash = crypto.randomBytes(6).toString("hex");

  const queueCall = async (fnIndex: number, data: any[]) => {
    const joinRes = await fetch(`${BASE}/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ data, fn_index: fnIndex, session_hash: sessionHash }),
    });
    const joinData = await joinRes.json();
    if (!joinData.event_id) {
      throw new Error(`join fn ${fnIndex} failed: ${JSON.stringify(joinData)}`);
    }

    const streamRes = await fetch(
      `${BASE}/queue/data?session_hash=${sessionHash}`,
      { headers: authHeaders }
    );
    const text = await streamRes.text();

    for (const block of text.split("\n\n")) {
      const line = block.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        const msg = JSON.parse(line.substring(6));
        if (msg.event_id && msg.event_id !== joinData.event_id) continue;
        if (msg.msg === "process_completed") {
          if (!msg.success) {
            throw new Error(
              `fn ${fnIndex} error: ${JSON.stringify(msg.output).slice(0, 500)}`
            );
          }
          return msg.output.data as any[];
        }
      } catch (e: any) {
        if (e?.message?.startsWith("fn ")) throw e;
      }
    }
    throw new Error(`fn ${fnIndex} no completion: ${text.slice(-500)}`);
  };

  // 1. Upload image to Space
  console.log("[TRELLIS] 1/4 Uploading input image to Hugging Face Space...");
  const upForm = new FormData();
  upForm.append("files", imageBlob, "input.png");
  const upRes = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: authHeaders,
    body: upForm,
  });
  const uploaded = (await upRes.json()) as string[];
  if (!uploaded || !uploaded[0]) {
    throw new Error("Failed to upload image to TRELLIS space.");
  }

  const fileData = (p: string) => ({
    path: p,
    meta: { _type: "gradio.FileData" },
  });

  // 2. Start session
  console.log("[TRELLIS] 2/4 Starting session (fn 4)...");
  await queueCall(4, []);

  // 3. Preprocess image
  console.log("[TRELLIS] 3/4 Preprocessing image (fn 8)...");
  const pre = await queueCall(8, [fileData(uploaded[0])]);
  const processed = pre[0];

  // 4. Generate & Extract GLB
  console.log("[TRELLIS] 4/4 Generating 3D model & extracting GLB (fn 11)...");
  const result = await queueCall(11, [
    processed,
    [],
    false,
    0,
    7.5,
    12,
    3,
    12,
    "stochastic",
    0.95,
    1024,
  ]);

  // Find GLB file URL in outputs
  let fileUrl: string | undefined;
  for (const item of result) {
    const u =
      typeof item === "string" ? item : (item as any)?.url || (item as any)?.path;
    if (typeof u === "string" && u.toLowerCase().includes(".glb")) {
      fileUrl = (item as any)?.url || u;
      if (!fileUrl!.startsWith("http")) fileUrl = `${BASE}/file=${fileUrl}`;
      break;
    }
  }

  console.log("[TRELLIS] Retrieved GLB URL:", fileUrl);
  if (!fileUrl) {
    throw new Error("TRELLIS generation completed but no .glb file URL found.");
  }

  // Download & write to destination
  console.log("[TRELLIS] Downloading GLB to local public/models...");
  const fileRes = await fetch(fileUrl, { headers: authHeaders });
  const arrayBuf = await fileRes.arrayBuffer();
  await fs.writeFile(destinationPath, Buffer.from(arrayBuf));
  console.log("[TRELLIS] Saved GLB successfully to:", destinationPath);

  return true;
}
