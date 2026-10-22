import { getCategories as fetchCategories } from "./api/shiny-carpet";

export type Category = {
  id: number;
  name: string;
  image: string | null;
};

function categoryImage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "admin.shinycarpet-sa.com" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith("/storage/categories/") &&
      url.search === ""
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const body: unknown = await fetchCategories(signal);
  if (
    !body ||
    typeof body !== "object" ||
    !("success" in body) ||
    body.success !== true ||
    !("data" in body) ||
    !Array.isArray(body.data)
  ) {
    throw new Error("Invalid categories response");
  }

  return body.data.map((item: unknown) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("id" in item) ||
      typeof item.id !== "number" ||
      !Number.isInteger(item.id) ||
      item.id <= 0 ||
      !("name" in item) ||
      typeof item.name !== "string" ||
      !item.name.trim()
    ) {
      throw new Error("Invalid category");
    }
    return {
      id: item.id,
      name: item.name.trim(),
      image: categoryImage("image" in item ? item.image : null),
    };
  });
}
