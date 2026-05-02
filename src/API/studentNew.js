import api from "./axios";

export const studentRegisterNewApi = async (payload) => {
  const res = await api.post("/registration/register", payload);
  return res.data;
};
