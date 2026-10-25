import { getCategories as fetchCategories } from "./api/shiny-carpet";
import { ApiResponseError } from "./api/client";
import { catalogImage, isPositiveId, isRecord, responseData } from "./api/validation";

export type Category = {
  id: number;
  name: string;
  image: string | null;
};

export function parseCategories(body: unknown): Category[] {
  const data = responseData(body);
  if (!Array.isArray(data)) throw new ApiResponseError("Invalid categories response");

  return data.map((item: unknown) => {
    if (
      !isRecord(item) ||
      !isPositiveId(item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim()
    ) {
      throw new ApiResponseError("Invalid category");
    }
    return {
      id: item.id,
      name: item.name.trim(),
      image: catalogImage(item.image, "categories"),
    };
  });
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  return parseCategories(await fetchCategories(signal));
}
