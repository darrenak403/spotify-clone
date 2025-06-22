import { axiosInstance } from '@/lib/axios';
import { create } from 'zustand';

interface ChatStore { 
    users: any[]; // Replace 'any' with a more specific type if available
    fetchUsers: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const useChatStore = create<ChatStore>((set) => ({
    users: [],
    isLoading: false,
    error: null,

    fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/users");
            set({ users: response.data });
        } catch (error: any) {
            set({ error: error.message });
        } finally {
            set({ isLoading: false });
        }
    }

}));

