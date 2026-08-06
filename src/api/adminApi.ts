import { apiClient } from "./apiClient";

export interface AdminDashboardResponse {
  message: string;
  userId: number;
  email: string;
  role: "ADMIN";
}

export interface AdminDashboardSummary {
  totalCustomers: number;
  totalProducts: number;
}

export async function getAdminDashboard():Promise<AdminDashboardResponse> {
  const response =await apiClient.get<AdminDashboardResponse>( "/admin/dashboard");

  return response.data;
}

export async function getAdminDashboardSummary():Promise<AdminDashboardSummary> {
    const response = await apiClient.get<AdminDashboardSummary>("/admin/dashboard/summary");

    return response.data;
}