import React from "react";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Chip,
    Box,
    styled,
    IconButton,
} from "@mui/material";
import {
    ArrowForwardIos,
    PersonOutlined,
    AccessTimeOutlined,
    Circle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/i18n";
import { useLanguage } from "../../../context/LanguageContext";
import { API } from "../../../service/api";
import { toast } from "../../../utils/toast";
import { confirmDelete } from "../../../utils/swal";

const StyledCard = styled(Card)`
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    height: 100%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    background: #ffffff;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    position: relative;

    &:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.1);
        border-color: #cbd5e1;

        & .card-image {
            transform: scale(1.06);
        }
    }
`;

const ImageContainer = styled(Box)`
    height: 200px;
    overflow: hidden;
    position: relative;
    background-color: #f1f5f9;

    @media (max-width: 600px) {
        height: 180px;
    }
`;

const StyledImage = styled(CardMedia)`
    height: 100%;
    width: 100%;
    transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    background-size: cover;
    background-position: center;
`;

const CategoryChip = styled(Chip)`
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    font-weight: 700;
    font-size: 12px;
    color: #e94560;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const BadgeStack = styled(Box)`
    position: absolute;
    top: 16px;
    left: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 2;
`;

const StatusBadge = styled(Box)`
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    color: #fff;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
`;

const Content = styled(CardContent)`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 24px;
    padding-bottom: 16px !important;
`;

const Title = styled(Typography)`
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.38;
    color: #1a1a2e;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;

    &:hover {
        color: #e94560;
    }
`;

const Description = styled(Typography)`
    color: #64748b;
    font-size: 0.875rem;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: auto;
`;

const MetaData = styled(Box)`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
`;

const MetaItem = styled(Box)`
    display: flex;
    align-items: center;
    gap: 5px;
`;

const ActionBar = styled(Box)`
    display: flex;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid #f1f5f9;
    background: #f8fafc;
    border-radius: 0 0 16px 16px;
`;

const ActionBtn = styled("button")`
    flex: 1;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
`;

const EditBtn = styled(ActionBtn)`
    border: none;
    background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
    color: #ffffff;

    &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
`;

const PaymentBtn = styled(ActionBtn)`
    border: none;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: #ffffff;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

    &:hover {
        opacity: 0.92;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }
`;

const DeleteBtn = styled(ActionBtn)`
    background: #ffffff;
    color: #e94560;
    border: 1.5px solid #e94560;

    &:hover {
        background: #fff0f3;
        transform: translateY(-1px);
    }
`;

const getLocalizedValue = (value, lang) => {
    if (!value) return "";
    if (typeof value === "object") return value[lang] || value.en || "";
    return String(value);
};

const Post = ({ post, isDashboard = false, onDelete, categories = [] }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { currentLang, translate } = useLanguage();

    if (!post) return null;

    const imageUrl =
        post.banner ||
        post.picture ||
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=752&q=80";

    const title = typeof post.title === "string" ? post.title : getLocalizedValue(post.title, currentLang);
    const rawDesc = post.short_description || (typeof post.description === "string" ? post.description : getLocalizedValue(post.description, currentLang));
    const description = rawDesc ? rawDesc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

    const matchedCategory = categories.find(
        (category) =>
            category._id === post.category_id ||
            category._id === post.category?._id ||
            category.name === post.categories ||
            category.name?.en === post.categories
    );

    const categoryLabel =
        post.category?.name ||
        (typeof post.categories === "string" ? post.categories : "") ||
        matchedCategory?.name ||
        translate("post.general", "General");

    const authorName = post.author?.name || post.user?.name || post.username || "Admin";

    const postDate = post.createdAt || post.createdDate || post.created_at;

    const handleCardClick = () => {
        navigate(`/blog/${post._id || post.id}`);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        navigate(`/update/${post._id || post.id}`);
    };

    const handlePayment = async (e) => {
        e.stopPropagation();

        try {
            toast.info("Connecting to Stripe checkout...");
            const response = await API.createCheckoutSession({
                postId: post._id || post.id,
            });

            if (response.isSuccess && response.data?.url) {
                window.location.href = response.data.url;
            } else {
                toast.error(response.msg || "Failed to initiate payment session. Please try again.");
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("An error occurred initiating payment. Please try again.");
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation();

        const confirmed = await confirmDelete({
            title: t('post.confirmDeleteTitle', `Delete "${title}"?`),
            text: t('post.confirmDeleteText', 'This action cannot be undone.'),
            confirmButtonText: t('Yes, delete it!'),
            cancelButtonText: t('Cancel')
        });

        if (confirmed) {
            onDelete?.(post._id || post.id);
        }
    };

    return (
        <StyledCard onClick={handleCardClick}>
            <ImageContainer>
                <StyledImage
                    className="card-image"
                    image={imageUrl}
                    title={title}
                />

                <CategoryChip label={categoryLabel} size="small" />

                <BadgeStack>
                    <StatusBadge>
                        <Circle
                            sx={{
                                fontSize: 8,
                                color: post.premium ? "#4caf50" : "#ff9800",
                            }}
                        />
                        {post.premium
                            ? t("post.premium", "Premium")
                            : t("post.not-premium", "Not Premium")}
                    </StatusBadge>

                    {isDashboard && (
                        <StatusBadge>
                            <Circle
                                sx={{
                                    fontSize: 8,
                                    color: (post.published || post.status === 1) ? "#4caf50" : "#ff9800",
                                }}
                            />
                            {(post.published || post.status === 1)
                                ? t("post.published", "Published")
                                : t("post.draft", "Draft")}
                        </StatusBadge>
                    )}
                </BadgeStack>
            </ImageContainer>

            <Content>
                <Title>{title}</Title>
                <Description>{description}</Description>

                <MetaData>
                    <MetaItem>
                        <PersonOutlined sx={{ fontSize: 16 }} />
                        {authorName}
                    </MetaItem>

                    <MetaItem>
                        <AccessTimeOutlined sx={{ fontSize: 16 }} />
                        {postDate
                            ? new Date(postDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : ""}
                    </MetaItem>

                    {!isDashboard && (
                        <IconButton size="small" sx={{ ml: "auto", color: "#e94560" }}>
                            <ArrowForwardIos sx={{ fontSize: 12 }} />
                        </IconButton>
                    )}
                </MetaData>
            </Content>

            {isDashboard && (
                <ActionBar onClick={(e) => e.stopPropagation()}>
                    <EditBtn onClick={handleEdit}>✏️ {t("post.edit", "Edit")}</EditBtn>

                    {!post.premium && (
                        <PaymentBtn onClick={handlePayment}>
                            💳 {t("post.upgrade", "Upgrade ($10)")}
                        </PaymentBtn>
                    )}

                    <DeleteBtn onClick={handleDelete}>
                        🗑️ {t("post.delete", "Delete")}
                    </DeleteBtn>
                </ActionBar>
            )}
        </StyledCard>
    );
};

export default Post;