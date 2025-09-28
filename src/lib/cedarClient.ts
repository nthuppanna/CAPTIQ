export type SpellArgs = {
  team: string; keyword: string; style: string; platform: string; hashtags: string[];
};
const C = import.meta.env.VITE_CEDAR_URL as string | undefined;
const SPELL_ID = import.meta.env.VITE_CEDAR_SPELL_ID as string | undefined;
const KEY = import.meta.env.VITE_CEDAR_API_KEY as string | undefined;

function ensure() {
  if (!C || !SPELL_ID) throw new Error('CEDAR-ERR: Missing VITE_CEDAR_URL or VITE_CEDAR_SPELL_ID');
}

/**
 * Invokes a Cedar-OS Spell and returns plain text.
 */
export async function runCedarSpell(args: SpellArgs): Promise<string> {
  ensure();
  const url = `${C!.replace(/\/+$/,'')}/api/spells/${SPELL_ID}/invoke`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(KEY ? { authorization: `Bearer ${KEY}` } : {}) },
    body: JSON.stringify(args)
  });
  if (!res.ok) throw new Error('CEDAR-ERR: ' + (await res.text().catch(()=>String(res.status))));
  const data = await res.json().catch(()=> ({}));
  const text = (typeof data === 'string' && data) || data?.text || (Array.isArray(data) ? data[0] : '');
  return String(text || '').trim();
}



