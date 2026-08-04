export type SpiceLevel = "MILD" | "MEDIUM" | "HOT";

export type ProductCategory = "VEG" | "NON_VEG" | "MIXED";

export interface Product {
  id: number | null;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  weightGrams: number;
  spiceLevel: SpiceLevel;
  imageUrl: string | null;
  active: boolean;
  category: ProductCategory;
}