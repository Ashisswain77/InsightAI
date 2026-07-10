import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Skeleton,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import { Add, NoteAdd, AutoAwesome, SearchOff } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import NoteCard from "../components/NoteCard";
import SearchBar from "../components/SearchBar";
import api from "../api/axios";

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  // Fetch all notes
  const fetchNotes = async () => {
    try {
      const { data } = await api.get("/notes");
      setNotes(data);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Semantic search
  const handleSearch = async (query) => {
    setSearching(true);
    try {
      const { data } = await api.get(`/notes/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Search failed",
        severity: "error",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults(null);
  };

  // Create note
  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setCreating(true);

    try {
      const { data } = await api.post("/notes", {
        title: newTitle,
        content: newContent,
      });
      setNotes((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewTitle("");
      setNewContent("");
      setSnackbar({
        open: true,
        message: "Note created! AI is processing it in the background...",
        severity: "success",
      });

      // Re-fetch after 4s to get AI-generated fields
      setTimeout(() => fetchNotes(), 4000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to create note",
        severity: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  // Edit note
  const handleEdit = (id) => {
    navigate(`/notes/${id}`);
  };

  // Delete note
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (searchResults) {
        setSearchResults((prev) => prev.filter((n) => n._id !== id));
      }
      setSnackbar({
        open: true,
        message: "Note deleted successfully!",
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

  // Archive/Unarchive note
  const handleArchive = async (id, toArchive) => {
    try {
      await api.put(`/notes/${id}`, { isArchived: toArchive });
      // Remove it from the dashboard notes list
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (searchResults) {
        setSearchResults((prev) => prev.filter((n) => n._id !== id));
      }
      setSnackbar({
        open: true,
        message: toArchive ? "Note archived successfully!" : "Note unarchived successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to archive note",
        severity: "error",
      });
    }
  };

  const displayNotes = searchResults !== null ? searchResults : notes;
  const isSearchMode = searchResults !== null;

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
        <Box sx={{ mb: 4 }}>
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
            My Notes
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {notes.length} note{notes.length !== 1 ? "s" : ""} — powered by AI
          </Typography>
        </Box>

        {/* Create Note Bar */}
        <Box sx={{ mb: 4 }}>
          <Box
            onClick={() => setCreateOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2.2,
              borderRadius: 3,
              cursor: "pointer",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.6)"
                  : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(148, 163, 184, 0.15)"
                  : "rgba(15, 23, 42, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 0 0 3px rgba(129, 140, 248, 0.15)"
                    : "0 0 0 3px rgba(79, 70, 229, 0.1)",
              },
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
              }}
            >
              <Add sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontSize: "1.05rem",
                fontWeight: 500,
                userSelect: "none",
              }}
            >
              Take a note or create new Insights...
            </Typography>
          </Box>
        </Box>

        {/* Notes Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={220}
                  sx={{ borderRadius: 3, bgcolor: "action.hover" }}
                />
              </Grid>
            ))}
          </Grid>
        ) : displayNotes.length === 0 ? (
          <Box
            className="flex flex-col items-center justify-center py-20"
            sx={{ opacity: 0.7 }}
          >
            {isSearchMode ? (
              <>
                <SearchOff sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
                  No matching notes found
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Try a different search query
                </Typography>
              </>
            ) : (
              <>
                <NoteAdd sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
                  No notes yet
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                  Create your first AI-powered note
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateOpen(true)}
                  sx={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #4f46e5, #9333ea)",
                    },
                  }}
                >
                  Create Note
                </Button>
              </>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {displayNotes.map((note, idx) => (
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
                <Box sx={{ position: "relative" }}>
                  {isSearchMode && note.score !== undefined && (
                    <Box
                      className="score-badge"
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        zIndex: 1,
                      }}
                    >
                      {(note.score * 100).toFixed(0)}% match
                    </Box>
                  )}
                  <NoteCard
                    note={note}
                    onClick={() => navigate(`/notes/${note._id}`)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>


      {/* Create Note Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: "blur(20px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>Create New Note</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            AI will automatically generate a summary, tags, and search embeddings.
          </Typography>
          <TextField
            fullWidth
            id="new-note-title"
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{ mb: 2.5 }}
            autoFocus
          />
          <TextField
            fullWidth
            id="new-note-content"
            label="Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            multiline
            rows={6}
            placeholder="Write your note content here..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            id="create-note-submit-btn"
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !newTitle.trim() || !newContent.trim()}
            startIcon={creating ? null : <NoteAdd />}
            sx={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #9333ea)",
              },
            }}
          >
            {creating ? "Creating..." : "Create Note"}
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
