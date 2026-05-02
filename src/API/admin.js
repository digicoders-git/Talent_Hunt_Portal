import api from "./axios";

export const sendCreateUserOtpApi = async (payload) => {
  try {
    const response = await api.post("/admin/send-create-otp", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to send OTP" };
  }
};

export const createAdminApi = async (payload) => {
  try {
    const response = await api.post("/admin/create", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to create admin" };
  }
};

export const getAdminApi = async (search = '') => {
  try {
    const response = await api.get(`/admin/get${search ? `?search=${search}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch admin data" };
  }
};

export const deleteAdminApi = async (id) => {
  try {
    const response = await api.delete(`/admin/delete/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to delete admin" };
  }
};

export const toggleAdminStatusApi = async (id) => {
  try {
    const response = await api.patch(`/admin/toggle-status/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to toggle status" };
  }
};

export const changeUserPasswordApi = async (id, newPassword) => {
  try {
    const response = await api.patch(`/admin/change-password/${id}`, { newPassword });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to change password" };
  }
};

export const updateAdminApi = async (adminId, payload) => {
  try {
    const formData = new FormData();

    // text fields
    if (payload.userName) formData.append("userName", payload.userName);
    if (payload.email !== undefined) formData.append("email", payload.email);
    if (payload.userId !== undefined) formData.append("userId", payload.userId);
    if (payload.currentPassword) formData.append("currentPassword", payload.currentPassword);
    if (payload.newPassword) formData.append("newPassword", payload.newPassword);
    if (payload.confirmPassword) formData.append("confirmPassword", payload.confirmPassword);

    // image file
    if (payload.image) {
      formData.append("image", payload.image);
    }

    const response = await api.put(
      `/admin/update/${adminId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      }
    );

    return response.data;

  } catch (error) {
    throw error.response?.data || { message: "Something went wrong" };
  }
};

export const getMeApi = async () => {
  try {
    const response = await api.get('/admin/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user info" };
  }
};
