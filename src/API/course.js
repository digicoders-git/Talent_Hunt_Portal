import api  from "./axios";

export const createCourseApi = async (payload) => {
  const res = await api.post("/admin/course-add", payload);
  return res.data;
};

export const getCoursesApi = async () => {
  const res = await api.get("/admin/course-get");
  return res.data;
};

export const updateCourseApi = async (courseId, payload) => {
  const res = await api.put(
    `/admin/course-update/${courseId}`,
    payload
  );
  return res.data;
};

export const deleteCourseApi = async (courseId) => {
  const res = await api.delete(
    `/admin/course-delete/${courseId}`
  );
  return res.data;
};
