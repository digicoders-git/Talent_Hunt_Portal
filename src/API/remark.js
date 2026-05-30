import api from "./axios";

// Add a new remark to a student
export const addRemarkApi = async (payload) => {
  // payload: { studentId, text, status }
  const res = await api.post("/admin/remark", payload);
  return res.data;
};

// Get remarks by student ID
export const getRemarksByStudentApi = async (studentId) => {
  const res = await api.get(`/admin/remark/${studentId}`);
  return res.data;
};
