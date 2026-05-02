import api from "./axios";

// Assign questions to assessment
export const addQuestionsToAssessmentApi = async (assessmentId, payload) => {
  const res = await api.post(
    `/admin/assesment/assign-questions/${assessmentId}`,
    payload
  );
  return res.data;
};

// Get assessment questions by assesmentQuestionId
export const getAssessmentQuestionsApi = async (assesmentCode) => {
  const res = await api.get(
    `/admin/assesment/get-question/${assesmentCode}`
  );
  return res.data;
};

// Get assessment questions by assessment code (for student login)
// Pass course and year to get filtered questions for that student
export const getAssessmentByCodeApi = async (code, course, year) => {
  const params = {};
  if (course) params.course = course;
  if (year) params.year = year;
  const res = await api.get(
    `/admin/assesment/get-question/${code}`,
    { params }
  );
  return res.data;
};


// Delete single question from assessment
export const deleteQuestionFromAssessmentApi = async (
  assesmentQuestionId,
  questionId
) => {
  const res = await api.put(
    `/admin/assesment/delete-questions/${assesmentQuestionId}/${questionId}`
  );
  return res.data;
};
