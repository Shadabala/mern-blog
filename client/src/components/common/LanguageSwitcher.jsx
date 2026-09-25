import { useState, useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Button, IconButton, Avatar, Tooltip, Menu, MenuItem, ListItemText, Typography, Box } from "@mui/material";
import { Language as LanguageIcon, Check as CheckIcon } from "@mui/icons-material";
import { getFlagUrl } from "../../utils/languageFlags";

const LanguageSwitcher = ({ variant = "light" }) => {
    const { currentLang, languages, changeLanguage } = useLanguage();
    const [anchorEl, setAnchorEl] = useState(null);

    // Active languages strictly fetched from MongoDB
    const displayLanguages = useMemo(() => {
        if (!languages || !Array.isArray(languages)) return [];
        return languages.filter(l => l.isActive !== false);
    }, [languages]);

    // Active selected language dynamically matched against database languages
    const activeLanguage = useMemo(() => {
        if (!displayLanguages || displayLanguages.length === 0) return null;
        return (
            displayLanguages.find(
                (l) => l.code === currentLang || l.app_code === currentLang
            ) ||
            displayLanguages.find((l) => l.isDefault) ||
            displayLanguages[0]
        );
    }, [displayLanguages, currentLang]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelectLanguage = (code) => {
        changeLanguage(code);
        handleClose();
    };

    const isDark = variant === "dark";

    return (
        <>
            <Tooltip title={activeLanguage?.name || "Language"}>
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{
                        p: 0,
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: isDark ? "1.5px solid rgba(255, 255, 255, 0.2)" : "1.5px solid rgba(0, 0, 0, 0.12)",
                        bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                            bgcolor: isDark ? "rgba(255, 255, 255, 0.15)" : "#f8f9fa",
                            borderColor: isDark ? "#ffffff" : "#64748b",
                            transform: "scale(1.05)"
                        }
                    }}
                >
                    <Avatar
                        src={activeLanguage ? getFlagUrl(activeLanguage.flag || activeLanguage.code) : "/assets/img/flags/us.png"}
                        alt={activeLanguage?.name || "Flag"}
                        imgProps={{
                            onError: (e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/img/flags/us.png";
                            },
                            style: { objectFit: "cover" }
                        }}
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%"
                        }}
                    >
                        <LanguageIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        mt: 1,
                        minWidth: 190,
                        borderRadius: 2,
                        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)"
                    }
                }}
            >
                {displayLanguages.map((lang) => {
                    const isSelected =
                        currentLang === lang.code || currentLang === lang.app_code;
                    return (
                        <MenuItem
                            key={lang.code || lang._id}
                            selected={isSelected}
                            onClick={() => handleSelectLanguage(lang.code)}
                            sx={{
                                py: 1,
                                px: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5
                            }}
                        >
                            <Box
                                component="img"
                                src={getFlagUrl(lang.flag || lang.code)}
                                alt=""
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/assets/img/flags/us.png";
                                }}
                                sx={{
                                    width: 20,
                                    height: 14,
                                    borderRadius: "2px",
                                    objectFit: "cover"
                                }}
                            />
                            <ListItemText
                                primary={lang.name}
                                primaryTypographyProps={{
                                    fontSize: "0.85rem",
                                    fontWeight: isSelected ? 700 : 500
                                }}
                            />
                            {isSelected && (
                                <CheckIcon
                                    fontSize="small"
                                    color="primary"
                                    sx={{ ml: "auto" }}
                                />
                            )}
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;
