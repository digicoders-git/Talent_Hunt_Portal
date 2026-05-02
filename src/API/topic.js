import api from "./axios";

// Create Topic
export const createTopicApi = async (payload) => {
  const res = await api.post("/admin/topic/create", payload);
  return res.data;
};

// Get All Topics
export const getAllTopicsApi = async (status) => {
  if(status) {
    const res = await api.get(`/admin/topic/get?status=${status}`);
    return res.data;
  }const res = await api.get("/admin/topic/get");
  return res.data;
};

// Toggle Topic Status
export const toggleTopicStatusApi = async (id) => {
  const res = await api.patch(`/admin/topic/${id}`);
  return res.data;
};

// Update Topic
export const updateTopicApi = async (id, payload) => {
  const res = await api.put(`/admin/topic/update/${id}`, payload);
  return res.data;
};

// Delete Topic
export const deleteTopicApi = async (id) => {
  const res = await api.delete(`/admin/topic/delete/${id}`);
  return res.data;
};
