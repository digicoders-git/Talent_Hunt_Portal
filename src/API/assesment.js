import api from "./axios";


// Create Assessment
export const createAssessmentApi = async (payload) => {
  const res = await api.post("/admin/assesment/create", payload);
  return res.data;
};

// getAll
export const getAllAssessmentsApi = async () => {
  const res = await api.get(
    `/admin/assesment/get`
  );
  return res.data;
};


// Get Assessment by Status
export const getAssessmentByStatusApi = async (
  status,
  page = 1,
  limit = 10,
  search = "",
  date = ""
) => {
  const params = new URLSearchParams({
    page,
    limit,
  });

  if (search) params.append("search", search);
  if (date) params.append("date", date); // DD/MM/YYYY

  const res = await api.get(
    `/admin/assesment/get/${status}?${params.toString()}`
  );

  return res.data;
};
;


// Update Assessment
export const updateAssessmentApi = async (id, payload) => {
  const res = await api.put(`/admin/assesment/update/${id}`, payload);
  return res.data;
};

// Toggle Assessment Status
export const toggleAssessmentStatusApi = async (id) => {
  const res = await api.patch(`/admin/assesment/statusToggle/${id}`);
  return res.data;
};

// Delete Assessment
export const deleteAssessmentApi = async (id) => {
  const res = await api.delete(`/admin/assesment/delete/${id}`);
  return res.data;
};
