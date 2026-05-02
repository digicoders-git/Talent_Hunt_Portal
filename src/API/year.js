import api from "./axios";

// Create Academic Year
export const createAcademicYearApi = async (payload) => {
  const res = await api.post("/admin/academic-year-add", payload);
  return res.data;
};

// Get All Academic Years
export const getAcademicYearsApi = async () => {
  const res = await api.get("/admin/academic-year-get");
  return res.data;
};

// Update Academic Year
export const updateAcademicYearApi = async (yearId, payload) => {
  const res = await api.put(
    `/admin/academic-year-update/${yearId}`,
    payload
  );
  return res.data;
};

// Delete Academic Year
export const deleteAcademicYearApi = async (yearId) => {
  const res = await api.delete(
    `/admin/academic-year-delete/${yearId}`
  );
  return res.data;
};
