// src/lib/graphicsClient.ts
type GraphicsPayload = {
  keyword: string;
  teamName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoEmoji?: string;
  imageData?: string; // Base64 encoded image
  count?: number;
};

type ModifyGraphicsPayload = {
  modificationRequest: string;
  keyword: string;
  teamName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoEmoji?: string;
};

export async function generateGraphics(input: GraphicsPayload): Promise<string[]> {
  // Point to the cedar-backend graphics API
  const base = "http://localhost:3002/api";
  const path = "/graphics/generate";

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`GRAPHICS-ERR: ${res.status} ${txt || res.statusText}`);
  }

  const data = await res.json().catch(() => ({} as any));
  if (Array.isArray(data?.graphics)) return data.graphics;
  return [];
}

export async function modifyGraphic(input: ModifyGraphicsPayload): Promise<string[]> {
  // Point to the cedar-backend graphics modification API
  const base = "http://localhost:3002/api";
  const path = "/graphics/modify";

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`MODIFY-ERR: ${res.status} ${txt || res.statusText}`);
  }

  const data = await res.json().catch(() => ({} as any));
  if (Array.isArray(data?.graphics)) return data.graphics;
  return [];
}
