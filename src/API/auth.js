import api from "./axios";

export const adminLoginApi = async ({ email }) => {
  const { data } = await api.post("/admin/login", { email });
  return data;
};

export const verifyAdminLoginOtpApi = async ({ otp }) => {
  const { data } = await api.post("/admin/login-verify-otp", { otp });
  return data;
};

export const userLoginApi = async ({ email, password }) => {
  const { data } = await api.post("/admin/user-login", { email, password });
  return data;
};

export const adminLogout = async () => {
  const { data } = await api.post("/admin/logout");
  return data;
};

export const getDashboardDataApi = async () => {
  const { data } = await api.get("/admin/dashboard-data");
  return data;
};

export const getMeApi = async () => {
  const { data } = await api.get("/admin/me");
  return data;
};
