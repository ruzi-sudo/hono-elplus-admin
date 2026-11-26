import { http } from "@/utils/http";
import type { AsyncRoute, Result } from "./schema";

export const getAsyncRoutes = () => {
  return http.request<Result<AsyncRoute[]>>("get", "/api/get-async-routes");
};
