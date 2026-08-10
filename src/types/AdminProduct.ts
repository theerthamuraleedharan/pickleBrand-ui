export type ProductCategory =
  | "VEG"
  | "NON_VEG"
  | "MIXED";

export type SpiceLevel =
  | "MILD"
  | "MEDIUM"
  | "HOT";

export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  weightGrams: number;
  spiceLevel: SpiceLevel;
  category: ProductCategory;
  active: boolean;
  imageUrl: string | null;
}

export interface AdminProductRequest {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  weightGrams: number;
  spiceLevel: SpiceLevel;
  category: ProductCategory;
  active: boolean;
}