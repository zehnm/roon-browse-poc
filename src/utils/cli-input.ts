import prompts from "prompts";

export async function selectItemInteractive(
  items: Array<{ title: string; itemKey?: string }>,
  message: string
): Promise<number> {
  const choices = items.map((item, idx) => ({
    title: item.title,
    value: idx
  }));

  const response = await prompts({
    type: "select",
    name: "index",
    message,
    choices
  });

  if (response.index === undefined) {
    throw new Error("Selection cancelled");
  }

  return response.index as number;
}

export async function selectZoneInteractive(
  zones: Array<{ zone_id: string; display_name: string }>,
  message: string
): Promise<string> {
  const choices = zones.map((zone) => ({
    title: zone.display_name,
    value: zone.zone_id
  }));

  const response = await prompts({
    type: "select",
    name: "zoneId",
    message,
    choices
  });

  if (!response.zoneId) {
    throw new Error("Zone selection cancelled");
  }

  return response.zoneId as string;
}
