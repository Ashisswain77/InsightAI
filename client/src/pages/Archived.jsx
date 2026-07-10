import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Alert,
  Snackbar,
  Button,
} from "@mui/material";
import { Archive, ArrowBack } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import api from "../api/axios";

export default function Archived() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  // Fetch archived notes
  const fetchArchivedNotes = async () => {
    try {
      const { data } = await api.get("/notes/archived");
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch archived notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedNotes();
  }, []);

  // Edit note
  const handleEdit = (id) => {
    navigate(`/notes/${id}`);
  };

  // Delete note
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this note?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setSnackbar({
        open: true,
        message: "Note permanently deleted!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to delete note",
        severity: "error",
      });
    }
  };

  // Unarchive note
  const handleUnarchive = async (id, toArchive) => {
    try {
      await api.put(`/notes/${id}`, { isArchived: toArchive });
      // Since toArchive is false (unarchive), it shouldn't be in Archived list anymore
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setSnackbar({
        open: true,
        message: "Note unarchived successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to unarchive note",
        severity: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Navbar />

      <Box
        className="animate-fade-in"
        sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, #f1f5f9, #cbd5e1)"
                    : "linear-gradient(135deg, #0f172a, #334155)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Archived Notes
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {notes.length} archived note{notes.length !== 1 ? "s" : ""} — keeping your workspace tidy
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dashboard")}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Back to Notes
          </Button>
        </Box>

        {/* Notes Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3, bgcolor: "action.hover" }}
                />
              </Grid>
            ))}
          </Grid>
        ) : notes.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 12,
              px: 2,
              textAlign: "center",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.4)"
                  : "rgba(255, 255, 255, 0.5)",
              borderRadius: 4,
              border: "1px dashed",
              borderColor: "divider",
              backdropFilter: "blur(8px)",
            }}
          >
            <Archive sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
              No archived notes
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 400 }}>
              Archive notes from your dashboard to keep them stored safely here, away from your main list.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4f46e5, #9333ea)",
                },
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {notes.map((note, idx) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={note._id}
                sx={{
                  animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 0.06}s both`,
                }}
              >
                <NoteCard
                  note={note}
                  onClick={() => navigate(`/notes/${note._id}`)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onArchive={handleUnarchive}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
