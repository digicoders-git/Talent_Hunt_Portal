import api from "./axios";

export const createCollegeApi = async (payload) => {
  const res = await api.post("/admin/college-add", payload);
  return res.data;
};

export const getAllCollegesApi = async () => {
  const res = await api.get("/admin/college-get");
  return res.data;
};

export const updateCollegeApi = async (collegeId, payload) => {
  const res = await api.put(
    `/admin/college-update/${collegeId}`,
    payload
  );
  return res.data;
};

export const deleteCollegeApi = async (collegeId) => {
  const res = await api.delete(
    `/admin/college-delete/${collegeId}`
  );
  return res.data;
};
