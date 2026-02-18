export async function createTrelloCard(input: { name: string; desc: string }) {
  const key = process.env.TRELLO_KEY ?? "";
  const token = process.env.TRELLO_TOKEN ?? "";
  const listId = process.env.TRELLO_LIST_ID ?? "";
  if (!key || !token || !listId) throw new Error("Missing Trello env vars.");

  console.log("TRELLO ENV:", {
    keyTail: key.slice(-4), 
    tokenTail: token.slice(-4),
    listTail: listId.slice(-6),
  });

  const params = new URLSearchParams({
    idList: listId,
    key,
    token,
    name: input.name,
    desc: input.desc,
  });

  const url = `https://api.trello.com/1/cards?${params.toString()}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Trello error: ${res.status} ${res.statusText} | ${body.slice(0, 500)}`);
  }

  return res.json().catch(() => null);
}
