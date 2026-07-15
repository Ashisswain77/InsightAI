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

  // Move note to Bin
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notes/${id}`, { isBinned: true });
      setNotes((prev) => prev.filter((n) => n._id !== id));
      if (searchResults) {
        setSearchResults((prev) => prev.filter((n) => n._id !== id));
      }
      setSnackbar({
        open: true,
        message: "Note moved to Bin!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to move note to Bin",
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
        {/* Premium Dashboard Header Dock */}
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
              My Insights
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 550 }}>
                {notes.length} active note{notes.length !== 1 ? "s" : ""}
              </Typography>
              <Typography variant="caption" sx={{ color: "divider", fontWeight: 900 }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 550 }}>
                Workspace Dashboard
              </Typography>
            </Box>
          </Box>

          {/* Interactive Create Note Bar */}
          <Box
            onClick={() => setCreateOpen(true)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 1.8,
              borderRadius: 3.5,
              cursor: "pointer",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(15, 23, 42, 0.4)"
                  : "rgba(255, 255, 255, 0.9)",
              border: "1px solid",
              borderColor: "divider",
              width: { xs: "100%", md: "480px" },
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "inset 0 2px 4px rgba(0,0,0,0.2)"
                  : "inset 0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                borderColor: "primary.light",
                transform: "translateY(-1px)",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 20px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.2)"
                    : "0 4px 20px rgba(79, 70, 229, 0.08), 0 0 0 1px rgba(79, 70, 229, 0.15)",
              },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}
            >
              <Add sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontSize: "0.95rem",
                fontWeight: 500,
                userSelect: "none",
              }}
            >
              Take a note or write a new Insight...
            </Typography>
          </Box>
        </Box>

        {/* Search Bar Container */}
        <Box sx={{ mb: 4 }}>
          <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
        </Box>

        {/* Notes Grid */}
        {loading || searching ? (
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
          <Box className="masonry-grid">
            {displayNotes.map((note, idx) => (
              <Box
                key={note._id}
                className="masonry-item"
                sx={{
                  animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 0.06}s both`,
                }}
              >
                <Box sx={{ position: "relative", width: "100%" }}>
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
              </Box>
            ))}
          </Box>
        )}
      </Box>


      {/* Create Note Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(15, 23, 42, 0.5)"
                : "rgba(15, 23, 42, 0.3)",
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.75)"
                : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(25px)",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(148, 163, 184, 0.12)"
                : "rgba(15, 23, 42, 0.08)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 24px 64px rgba(0,0,0,0.5)"
                : "0 24px 64px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 850,
            fontFamily: '"Archivo Black", sans-serif',
            fontSize: "1.35rem",
            letterSpacing: "0.01em",
            pt: 4,
            pb: 1,
          }}
        >
          Create New Note
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            fullWidth
            id="new-note-title"
            label="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(15, 23, 42, 0.25)"
                    : "rgba(0, 0, 0, 0.015)",
                transition: "all 0.3s ease",
                "& fieldset": { borderColor: "divider" },
                "&:hover fieldset": { borderColor: "text.secondary" },
                "&.Mui-focused fieldset": { borderColor: "primary.light" },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 550,
                "&.Mui-focused": { color: "primary.light" },
              },
            }}
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
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(15, 23, 42, 0.25)"
                    : "rgba(0, 0, 0, 0.015)",
                transition: "all 0.3s ease",
                "& fieldset": { borderColor: "divider" },
                "&:hover fieldset": { borderColor: "text.secondary" },
                "&.Mui-focused fieldset": { borderColor: "primary.light" },
              },
              "& .MuiInputLabel-root": {
                fontWeight: 550,
                "&.Mui-focused": { color: "primary.light" },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 4, pt: 2, gap: 1.5 }}>
          <Button
            onClick={() => setCreateOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              fontSize: "0.88rem",
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "text.primary",
                color: "text.primary",
              },
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </Button>
          <Button
            id="create-note-submit-btn"
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !newTitle.trim() || !newContent.trim()}
            startIcon={creating ? null : <NoteAdd />}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              py: 1,
              fontSize: "0.88rem",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #9333ea)",
              },
              transition: "all 0.3s ease",
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
