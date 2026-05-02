import api from "./axios";

// Create Result
export const createResultApi = async (payload) => {
  const res = await api.post("/admin/result", payload);
  return res.data;
};

// Get Results by Assessment ID
export const getResultsByAssessmentIdApi = async (assessmentId, options = {}) => {
  const { college, year, course, search } = options;

  const params = {};
  if (college) params.college = college;
  if (year) params.year = year;
  if (course) params.course = course;
  if (search) params.search = search;

  const res = await api.get(`/admin/result/${assessmentId}`, { params });
  return res.data;
};


// Get Results by Student ID
export const getResultsByStudentApi = async (studentId) => {
  const res = await api.get(`/admin/result-single/${studentId}`);
  return res.data;
};



// download excel file 

export const downloadResultsByAssessmentIdApi = async (assessmentId, options = {}) => {
  try {
    if (!assessmentId) throw new Error("Assessment ID is required");

    const { college, year, course, search } = options;
    const params = {};
    if (college) params.college = college;
    if (year) params.year = year;
    if (course) params.course = course;
    if (search) params.search = search;

    // Call backend endpoint that returns Excel file as blob
    const res = await api.get(`/admin/result-excel/${assessmentId}`, {
      params,
      responseType: "blob"
    });

    // Create downloadable link
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assessment-results.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("downloadResultsByAssessmentIdApi ERROR:", error);
    throw error;
  }
};

