import { apiClient } from "./apiClient";

export const communityApi = {
  getCommunityFarms: async (params?: { village?: string; district?: string }) => {
    const res = await apiClient.get("/community/farms", {
      params,
    });
    return res.data;
  },

  getFarmDetail: async (farmId: string) => {
    const res = await apiClient.get(`/community/farms/${farmId}`);
    return res.data;
  },

  getVillageDashboard: async (params?: { village?: string; district?: string }) => {
    const res = await apiClient.get("/community/village-dashboard", {
      params,
    });
    return res.data;
  },

  search: async (query: string) => {
    const res = await apiClient.get("/community/search", {
      params: { q: query },
    });
    return res.data;
  },

  getLeaderboard: async (category: string = "health") => {
    const res = await apiClient.get("/leaderboard", {
      params: { category },
    });
    return res.data;
  },

  getFarmerBadges: async (farmerId: string) => {
    const res = await apiClient.get(`/leaderboard/badges/${farmerId}`);
    return res.data;
  },

  getNotifications: async () => {
    const token = localStorage.getItem("agritwin_token");
    if (!token) return [];
    const res = await apiClient.get("/notifications");
    return res.data;
  },

  markNotificationRead: async (id: number) => {
    const token = localStorage.getItem("agritwin_token");
    if (!token) return;
    await apiClient.put(`/notifications/${id}/read`, {});
  },

  getUnreadCount: async () => {
    const token = localStorage.getItem("agritwin_token");
    if (!token) return { unread_count: 0 };
    const res = await apiClient.get("/notifications/unread-count");
    return res.data;
  },
};
