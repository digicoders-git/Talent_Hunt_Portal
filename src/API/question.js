import api from "./axios";

// Create Questions (manual)
export const createQuestionsApi = async (id, payload) => {
  const res = await api.post(`/admin/question/create/${id}`, payload);
  return res.data;
};

// Get Questions by Topic (with optional course+year filter)
export const getQuestionsByTopicApi = async (id, courseId, yearId) => {
  const params = {};
  if (courseId) params.courseId = courseId;
  if (yearId) params.yearId = yearId;
  const res = await api.get(`/admin/question/get/${id}`, { params });
  return res.data;
};

// Update Question
export const updateQuestionApi = async (id, payload) => {
  const res = await api.put(`/admin/question/update/${id}`, payload);
  return res.data;
};

// Delete Question
export const deleteQuestionApi = async (id) => {
  const res = await api.delete(`/admin/question/delete/${id}`);
  return res.data;
};

// Import Questions from Excel
export const importQuestionsFromExcelApi = async (id, file, courseId, yearId) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("courseId", courseId);
  formData.append("yearId", yearId);

  const res = await api.post(
    `/admin/question/excel/import/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

// export excel
export const exportQuestionsByTopicApi = async (topicId, courseId, yearId) => {
  const params = {};
  if (courseId) params.courseId = courseId;
  if (yearId) params.yearId = yearId;
  const res = await api.get(`/admin/question/export/${topicId}`, {
    params,
    responseType: "blob",
  });
  return res;
};
