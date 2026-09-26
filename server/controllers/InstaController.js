import { getInstaMedia } from "../services/instagramService.js";

export const getInstaFeeds = async (req, res) => {
    try {
        const result = await getInstaMedia();

        return res.status(200).json({
            success: true,
            data: result.data,
            paging: result.paging || null,
        });
    } catch (error) {
        return res.status(
            error.response?.status || 500
        ).json({
            success: false,
            message:
                error.response?.data?.error?.message ||
                error.message ||
                "Failed to fetch Instagram feeds",
        });
    }
}



