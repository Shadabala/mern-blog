import { useState, useEffect } from "react";
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Pagination } from "@mui/material";
import { fetchActivityLogs } from "../../api/admin.api";

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await fetchActivityLogs({ page, limit: 15 });
            setLogs(data.logs || []);
            if (data.pagination) {
                setTotalPages(data.pagination.pages || 1);
            }
        } catch (err) {
            console.error("Failed to load activity logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3} color="#0f172a">
                Audit Trail & Activity Logs
            </Typography>

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
                                        <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Module</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <TableRow key={log._id}>
                                                <TableCell sx={{ fontWeight: 600 }}>{log.userName || log.user?.name || "System"}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={(log.userRole || log.user?.role || "admin").toUpperCase()}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{log.action}</TableCell>
                                                <TableCell>
                                                    <Chip label={log.module} size="small" color="secondary" />
                                                </TableCell>
                                                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">No audit logs recorded.</TableCell>
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

export default ActivityLogs;
