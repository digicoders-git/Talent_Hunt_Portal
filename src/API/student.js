import api from "./axios";

// Send OTP for download
export const sendDownloadOtpApi = async () => {
  const res = await api.post("/admin/send-download-otp");
  return res.data;
};

// Verify OTP for download
export const verifyDownloadOtpApi = async (otp) => {
  const res = await api.post("/admin/verify-download-otp", { otp });
  return res.data;
};

// Student Register
export const studentRegisterApi = async (payload) => {
  const res = await api.post("/registration/create", payload);
  return res.data;
};

// Update Student
export const updateStudentApi = async (id, payload) => {
  const res = await api.put(`/registration/admin/update/${id}`, payload);
  return res.data;
};

// update student certificaet 
export const uploadStudentCertificateApi = async (id, file) => {
  const formData = new FormData();
  formData.append("certificate", file);

  const res = await api.put(
    `/registration/admin/update/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );

  return res.data;
};


// Check Existing Student (by mobile)
export const existStudentApi = async (payload) => {
  const res = await api.post("/registration/exist", payload);
  return res.data;
};

// Get All Students
export const getAllStudentsApi = async ({
  page = 1,
  limit = 10,
  college = "",
  course = "",
  year = "",
  search = ""
}) => {
  const params = { page, limit };
  if (college && college.trim()) params.college = college.trim();
  if (course && course.trim()) params.course = course.trim();
  if (year && year.trim()) params.year = year.trim();
  if (search && search.trim()) params.search = search.trim();

  const res = await api.get("/registration/admin/getAll", { params });
  return res.data;
};


// getSingle
export const getSingleStudentApi = async (id) => {
  const res = await api.get(`/registration/admin/getSingle/${id}`);
  return res.data;
};

// Get Students by Assessment Code
export const getStudentsByAssessmentApi = async ({
  assesmentCode,
  page = 1,
  limit = 10,
  search = "",
  college = "",
  year = "",
  course = ""
}) => {
  const params = {
    page,
    limit
  };

  if (search && search.trim()) params.search = search.trim();
  if (college && college.trim()) params.college = college.trim();
  if (year && year.trim()) params.year = year.trim();
  if (course && course.trim()) params.course = course.trim();

  const res = await api.get(
    `/registration/admin/getByAssesment/${assesmentCode?.trim()}`,
    { params }
  );

  return res.data;
};



// Academic data

export const getAcademicDataApi = async () => {
  const { data } = await api.get("/registration/admin/getAcademicData");
  return data;
};


// download excel studend by assesment

export const downloadStudentsByAssessmentApi = async (
  assesmentCode = null,
  filters = {}
) => {
  try {
    const url = assesmentCode
      ? `/registration/admin/student-excel-byassesment/${assesmentCode}`
      : `/registration/admin/student-excel`;

    const params = {};
    if (filters.college) params.college = filters.college;
    if (filters.course) params.course = filters.course;
    if (filters.year) params.year = filters.year;
    if (filters.search) params.search = filters.search;

    const res = await api.get(url, {
      params,
      responseType: "blob",
      validateStatus: () => true,
    });

    //  Check if response is JSON (no data)
    const contentType = res.headers["content-type"];

    if (contentType.includes("application/json")) {
      const text = await res.data.text();
      const data = JSON.parse(text);

      // Show message instead of download
      throw new Error(data.message || "No data available");
    }

    //  Excel download
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    link.download = assesmentCode
      ? `students-${assesmentCode}.xlsx`
      : `all-students.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    //  Handle no data / error
    console.log(error.message);
    throw error; // Re-throw to handle in component
  }
};

// downlaod pdf
export const downloadStudentsPDFApi = async (assesmentCode = null, options = {}) => {
  try {
    const { college, year, course, search } = options;

    const params = {};
    if (college) params.college = college;
    if (year) params.year = year;
    if (course) params.course = course;
    if (search) params.search = search;

    // Decide endpoint based on assessment code
    const url = assesmentCode
      ? `/registration/admin/student-pdf-byassesment/${assesmentCode}`
      : `/registration/admin/student-pdf`; // null will mean "all students"

    const response = await api.get(url, {
      params,
      responseType: "blob", // important for PDF
      validateStatus: () => true, // handle 404 / JSON gracefully
    });

    const contentType = response.headers["content-type"];

    // Handle "no data" from server
    if (contentType.includes("application/json")) {
      const text = await response.data.text();
      const data = JSON.parse(text);
      throw new Error(data.message || "No data available");
    }

    // Auto-download PDF
    const blob = new Blob([response.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute(
      "download",
      assesmentCode ? `students-${assesmentCode}.pdf` : "all-students.pdf"
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("PDF Download Error:", error.message);
    throw error; // re-throw to handle in component
  }
};




