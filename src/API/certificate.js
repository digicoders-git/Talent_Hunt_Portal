import api from "./axios";

export const createCertificateApi = async (formData) => {
  const res = await api.post(
    "/admin/certificate/create",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const getAllCertificatesApi = async () => {
  const res = await api.get("/admin/certificate/getAll");
  return res.data;
};

export const getSingleCertificateApi = async (certificateId) => {
  const res = await api.get(`/admin/certificate/get/${certificateId}`);
  return res.data;
};

export const updateCertificateApi = async (certificateId, formData) => {
  const res = await api.put(
    `/admin/certificate/update/${certificateId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const deleteCertificateApi = async (certificateId) => {
  const res = await api.delete(
    `/admin/certificate/delete/${certificateId}`
  );
  return res.data;
};

export const toggleCertificateStatusApi = async (certificateId) => {
  const res = await api.patch(
    `/admin/certificate/toggle-status/${certificateId}`
  );
  return res.data;
};
