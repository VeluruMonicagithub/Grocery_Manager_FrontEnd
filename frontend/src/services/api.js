import axios from "axios";
import { supabase } from "./supabase";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
});

// Attach token automatically
API.interceptors.request.use(async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        const guestInvite = localStorage.getItem("guestInviteId");
        if (guestInvite) {
            config.headers.Authorization = `Invite ${guestInvite}`;
        }
    }

    return config;
});

export default API;