import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Delete,
  AccessTime,
  Check,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function NoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Fetch note
  const fetchNote = async () => {
    try {
      const { data } = await api.get(`/notes/${id}`);
      setNote(data);
      setTitle(data.title);
      setContent(data.content);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Note not found",
        severity: "error",
      });
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (note) {
      setHasChanges(title !== note.title || content !== note.content);
    }
  }, [title, content, note]);

  // Save note
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    try {
      const { data } = await api.put(`/notes/${id}`, { title, content });
      setNote(data);
      setHasChanges(false);
      setSnackbar({
        open: true,
        message: "Note saved! AI is re-processing in the background...",
        severity: "success",
      });

      // Re-fetch after delay to get updated AI fields
      setTimeout(() => fetchNote(), 4000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to save note",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/notes/${id}`);
      navigate("/dashboard");
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete note",
        severity: "error",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, title, content]);

  const dateStr = note
    ? new Date(note.updatedAt || note.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTime = Math.ceil(wordCount / 200) || 1;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <Box
        className="animate-fade-in"
        sx={{ maxWidth: 950, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              id="back-to-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                color: "text.primary",
                borderColor: "divider",
                px: 2.2,
                py: 0.9,
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "text.secondary",
                },
              }}
            >
              Back
            </Button>
            {note && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                <AccessTime sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>{dateStr}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Tooltip title="Delete note">
              <IconButton
                id="delete-note-btn"
                onClick={() => setDeleteOpen(true)}
                sx={{
                  color: "text.secondary",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  p: 1.1,
                  "&:hover": {
                    color: "error.main",
                    borderColor: "error.main",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(248,113,113,0.1)"
                        : "rgba(220,38,38,0.06)",
                  },
                }}
              >
                <Delete sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Button
              id="save-note-btn"
              variant={hasChanges ? "contained" : "outlined"}
              color={hasChanges ? "primary" : "success"}
              startIcon={saving ? null : hasChanges ? <Save /> : <Check />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderColor: !hasChanges ? "success.main" : undefined,
                color: !hasChanges ? "success.main" : "#fff",
                background: hasChanges
                  ? "linear-gradient(135deg, #6366f1, #a855f7)"
                  : undefined,
                boxShadow: hasChanges ? "0 4px 14px rgba(99, 102, 241, 0.3)" : undefined,
                "&:hover": {
                  background: hasChanges
                    ? "linear-gradient(135deg, #4f46e5, #9333ea)"
                    : undefined,
                  borderColor: !hasChanges ? "success.dark" : undefined,
                  color: !hasChanges ? "success.dark" : "#fff",
                },
                transition: "all 0.3s ease",
              }}
            >
              {saving ? "Saving..." : hasChanges ? "Save Note" : "Saved"}
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box>
            <Skeleton variant="rounded" height={56} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={450} sx={{ borderRadius: 4 }} />
          </Box>
        ) : (
          <Box
            sx={{
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.4)"
                  : "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(12px)",
              borderRadius: 4,
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(148, 163, 184, 0.12)"
                  : "rgba(15, 23, 42, 0.08)",
              p: { xs: 3, md: 4 },
              display: "flex",
              flexDirection: "column",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 8px 32px rgba(0,0,0,0.2)"
                  : "0 8px 32px rgba(0,0,0,0.03)",
            }}
          >
            {/* Title */}
            <TextField
              fullWidth
              id="note-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              variant="standard"
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: "1.8rem", md: "2.2rem" },
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "text.primary",
                  fontFamily: '"Rubik", sans-serif',
                  pb: 1,
                },
              }}
              sx={{ mb: 2 }}
            />

            <Divider sx={{ mb: 3 }} />

            {/* Content */}
            <TextField
              fullWidth
              id="note-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              multiline
              minRows={4}
              maxRows={35}
              variant="outlined"
              sx={{
                flexGrow: 1,
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  padding: 0,
                  fontSize: "1.1rem",
                  lineHeight: 1.8,
                  fontFamily: '"Rubik", sans-serif',
                  color: "text.primary",
                  "& fieldset": { border: "none" },
                  "&:hover fieldset": { border: "none" },
                  "&.Mui-focused fieldset": { border: "none" },
                },
              }}
            />

            {/* Footer Metadata */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pt: 2,
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                color: "text.secondary",
              }}
            >
              <Box sx={{ display: "flex", gap: 3 }}>
                <Typography variant="caption" sx={{ fontSize: "0.85rem", fontWeight: 550 }}>
                  {wordCount} words
                </Typography>
                <Typography variant="caption" sx={{ fontSize: "0.85rem", fontWeight: 550 }}>
                  {charCount} characters
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontSize: "0.85rem", fontWeight: 550 }}>
                {readTime} min read
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to delete this note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-btn"
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
