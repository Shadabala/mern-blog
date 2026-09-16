import {
    Box,
    Container,
    Paper
} from "@mui/material";

const AuthLayout = ({ children }) => {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f5f7fb",
                py: 4
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={4}
                    sx={{
                        p: {
                            xs: 3,
                            sm: 5
                        },
                        borderRadius: 3
                    }}
                >
                    {children}
                </Paper>
            </Container>
        </Box>
    );
};

export default AuthLayout;