import api from "./axios";

// Fetch all active statuses
export const getStatusesApi = async () => {
  const res = await api.get("/admin/status");
  return res.data;
};

// Create a new status
export const createStatusApi = async (name) => {
  const res = await api.post("/admin/status", { name });
  return res.data;
};

// Delete a status
export const deleteStatusApi = async (id) => {
  const res = await api.delete(`/admin/status/${id}`);
  return res.data;
};
