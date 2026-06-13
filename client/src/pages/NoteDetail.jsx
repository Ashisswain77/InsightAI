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
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Delete,
  AccessTime,
  AutoAwesome,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import SummaryBox from "../components/SummaryBox";
import TagBadge from "../components/TagBadge";
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

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar />

      <Box
        className="animate-fade-in"
        sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              id="back-to-dashboard-btn"
              onClick={() => navigate("/dashboard")}
              sx={{
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <ArrowBack />
            </IconButton>
            {note && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                <AccessTime sx={{ fontSize: 16 }} />
                <Typography variant="caption">{dateStr}</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Delete note">
              <IconButton
                id="delete-note-btn"
                onClick={() => setDeleteOpen(true)}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "error.main",
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(248,113,113,0.1)"
                        : "rgba(220,38,38,0.06)",
                  },
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
            <Button
              id="save-note-btn"
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={saving || !hasChanges}
              sx={{
                background: hasChanges
                  ? "linear-gradient(135deg, #6366f1, #a855f7)"
                  : undefined,
                "&:hover": hasChanges
                  ? {
                      background: "linear-gradient(135deg, #4f46e5, #9333ea)",
                    }
                  : undefined,
              }}
            >
              {saving ? "Saving..." : hasChanges ? "Save" : "Saved"}
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box>
            <Skeleton variant="rounded" height={56} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={300} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <>
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
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  pb: 1,
                },
              }}
              sx={{ mb: 2 }}
            />

            {/* Content */}
            <TextField
              fullWidth
              id="note-content-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              multiline
              minRows={12}
              maxRows={30}
              variant="outlined"
              sx={{
                mb: 4,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: "1rem",
                  lineHeight: 1.8,
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(30, 41, 59, 0.4)"
                      : "rgba(241, 245, 249, 0.5)",
                },
              }}
            />

            {/* AI Section */}
            {(note?.summary || note?.tags?.length > 0) && (
              <>
                <Divider sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}>
                    <AutoAwesome sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.05em" }}>
                      AI INSIGHTS
                    </Typography>
                  </Box>
                </Divider>

                {/* Summary */}
                <Box sx={{ mb: 3 }}>
                  <SummaryBox summary={note.summary} />
                </Box>

                {/* Tags */}
                {note.tags?.length > 0 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "text.secondary",
                        mb: 1.5,
                        display: "block",
                      }}
                    >
                      Auto-generated Tags
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {note.tags.map((tag, i) => (
                        <TagBadge key={tag} tag={tag} index={i} />
                      ))}
                    </Box>
                  </Box>
                )}
              </>
            )}

            {/* AI Processing indicator */}
            {note && !note.summary && !note.tags?.length && (
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  textAlign: "center",
                }}
              >
                <AutoAwesome
                  sx={{
                    fontSize: 24,
                    color: "primary.light",
                    mb: 1,
                    animation: "sparkle 1.5s ease-in-out infinite",
                  }}
                />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  AI is analyzing your note — summary and tags will appear shortly...
                </Typography>
              </Box>
            )}
          </>
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
