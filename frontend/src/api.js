import axios from "axios";

const getBaseUrl = () => {
 if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
 if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
 return "http://127.0.0.1:5000/api";
 }
 return `http://${window.location.hostname}:5000/api`;
};

const api = axios.create({
 baseURL: getBaseUrl()
});

export function setAuthToken(token) {
 if (token) {
 api.defaults.headers.common.Authorization = `Bearer ${token}`;
 } else {
 delete api.defaults.headers.common.Authorization;
 }
}

api.interceptors.response.use(
 (response) => response,
 (error) => {
 if (error.response && (error.response.status === 401 || (error.response.status === 422 && error.response.data?.msg?.includes("Signature")))) {
 localStorage.removeItem("token");
 localStorage.removeItem("user");
 window.location.href = "/";
 }
 return Promise.reject(error);
 }
);

export default api;
