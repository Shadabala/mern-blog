import { Container, Typography, Button, Stack } from "@mui/material";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <Container sx={{ py: 10 }}>
            <Stack spacing={3} sx={{ alignItems: "center" }}>
                <Typography variant="h2" component="h1">
                    MERN Admin Panel
                </Typography>

                <Typography variant="h6" color="text.secondary">
                    Secure MERN Management System
                </Typography>

                <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                >
                    Login
                </Button>
            </Stack>
        </Container>
    );
};

export default Home;