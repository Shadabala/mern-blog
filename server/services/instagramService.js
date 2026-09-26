import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const INSTAGRAM_API_URL = "https://graph.instagram.com";


export const getInstaMedia = async () => {
    const limit = 10;
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instaFeedEnabled = process.env.INSTA_FEED === "1";

    if (!instaFeedEnabled) {
        return {
            data: [],
        };
    }

    if (!token) {
        throw new Error(
            "Instagram access token is not configured"
        );
    }

    try {
        const response = await axios.get(
            `${INSTAGRAM_API_URL}/me/media`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },

                params: {
                    fields:
                        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
                    limit,
                },
            }
        );

        return {
            data: response.data.data || [],
            paging: response.data.paging || null,
        };
    } catch (error) {
        console.error(
            "Instagram API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};