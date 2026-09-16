import { useState, useEffect } from "react";
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    CircularProgress, Alert, Pagination, Chip
} from "@mui/material";
import { fetchLoginHistory } from "../../api/admin.api";

const LoginHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await fetchLoginHistory({ page, limit: 15 });
            if (data?.success) {
                setLogs(data.logs || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            setError("Failed to load user login history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3} color="#0f172a">
                User Login History Log
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                        <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Device / User Agent</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Login Timestamp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <TableRow key={log._id}>
                                                <TableCell sx={{ fontWeight: 600 }}>{log.user?.name || log.user?.username || "Unknown"}</TableCell>
                                                <TableCell>{log.user?.email || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={(log.user?.role || "user").toUpperCase()}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{log.ipAddress || "127.0.0.1"}</TableCell>
                                                <TableCell sx={{ maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {log.deviceInfo || "Web Browser"}
                                                </TableCell>
                                                <TableCell>{new Date(log.loginAt || log.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">No user login logs recorded yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {totalPages > 1 && (
                            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                                <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
                            </Box>
                        )}
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default LoginHistory;
