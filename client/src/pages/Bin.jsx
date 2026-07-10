import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Snackbar,
  Button,
} from "@mui/material";
import { Delete, ArrowBack, DeleteForever } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import api from "../api/axios";

export default function Bin() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [emptying, setEmptying] = useState(false);
  const navigate = useNavigate();

  // Fetch binned notes
  const fetchBinnedNotes = async () => {
    try {
      const { data } = await api.get("/notes/binned");
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch binned notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBinnedNotes();
  }, []);

  // Permanent Delete note
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this note? This action cannot be undone.")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setSnackbar({
        open: true,
        message: "Note permanently deleted from database!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to permanently delete note",
        severity: "error",
      });
    }
  };

  // Restore note
  const handleRestore = async (id) => {
    try {
      await api.put(`/notes/${id}`, { isBinned: false });
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setSnackbar({
        open: true,
        message: "Note restored successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to restore note",
        severity: "error",
      });
    }
  };

  // Empty all binned notes
  const handleEmptyBin = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all notes in the bin? This action cannot be undone.")) return;
    setEmptying(true);
    try {
      await api.delete("/notes/binned/empty");
      setNotes([]);
      setSnackbar({
        open: true,
        message: "Bin emptied successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to empty bin",
        severity: "error",
      });
    } finally {
      setEmptying(false);
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
        {/* Premium Archived Header Dock */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 3,
            mb: 5,
            p: 3,
            borderRadius: 4,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.4)"
                : "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(148, 163, 184, 0.12)"
                : "rgba(15, 23, 42, 0.08)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.15)"
                : "0 8px 32px rgba(0,0,0,0.02)",
          }}
        >
          {/* Title and stats */}
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                fontFamily: '"Archivo Black", sans-serif',
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              Trash Bin
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 555 }}>
                {notes.length} deleted note{notes.length !== 1 ? "s" : ""}
              </Typography>
              <Typography variant="caption" sx={{ color: "divider", fontWeight: 900 }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 555 }}>
                Recycle Center
              </Typography>
            </Box>
          </Box>

          {/* Actions Bar */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}>
            {notes.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={handleEmptyBin}
                disabled={emptying}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 3,
                  py: 1.1,
                  fontSize: "0.88rem",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(248, 113, 113, 0.1)"
                        : "rgba(220, 38, 38, 0.06)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {emptying ? "Emptying..." : "Empty Bin"}
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/dashboard")}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                color: "text.primary",
                borderColor: "divider",
                px: 3,
                py: 1.1,
                fontSize: "0.88rem",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "text.primary",
                },
                transition: "all 0.2s ease",
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {/* Notes Grid */}
        {loading ? (
          <Box className="masonry-grid">
            {[1, 2, 3].map((i) => (
              <Box key={i} className="masonry-item">
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3, bgcolor: "action.hover" }}
                />
              </Box>
            ))}
          </Box>
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
            <Delete sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.7 }} />
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
              Trash is empty
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 400 }}>
              Notes you delete will appear here. You can restore them to your active dashboard anytime.
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
          <Box className="masonry-grid">
            {notes.map((note, idx) => (
              <Box
                key={note._id}
                className="masonry-item"
                sx={{
                  animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 0.06}s both`,
                }}
              >
                <NoteCard
                  note={note}
                  isBinPage={true}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                />
              </Box>
            ))}
          </Box>
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
