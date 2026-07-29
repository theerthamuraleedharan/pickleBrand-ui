export type SpiceLevel = "MILD" | "MEDIUM" | "HOT";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  weightGrams: number;
  spiceLevel: SpiceLevel;
  imageUrl: string | null;
  active: boolean;
}