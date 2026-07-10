import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Skeleton,
  Alert,
  Snackbar,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ContentCopy,
  VpnKey,
  Add,
  Edit,
  Delete,
  Search,
  ArrowBack,
  Shield,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const CATEGORIES = ["General", "Website", "Work", "Social Media", "Financial", "PIN / Code"];

export default function Locker() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Password Visibility Map (Set of visible credential IDs)
  const [visibleIds, setVisibleIds] = useState(new Set());
  
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  // Fetch credentials
  const fetchCredentials = async () => {
    try {
      const { data } = await api.get("/locker");
      setCredentials(data);
    } catch (err) {
      console.error("Failed to fetch credentials:", err);
      setSnackbar({
        open: true,
        message: "Failed to fetch secure credentials",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  // Toggle Visibility
  const toggleVisibility = (id) => {
    const newVisible = new Set(visibleIds);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleIds(newVisible);
  };

  // Copy to Clipboard
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: `${label} copied to clipboard!`,
      severity: "success",
    });
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingCred(null);
    setFormTitle("");
    setFormUsername("");
    setFormPassword("");
    setFormCategory("General");
    setFormShowPassword(false);
    setOpenDialog(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (cred) => {
    setEditingCred(cred);
    setFormTitle(cred.title);
    setFormUsername(cred.username);
    setFormPassword(cred.password);
    setFormCategory(cred.category);
    setFormShowPassword(false);
    setOpenDialog(true);
  };

  // Save Credential
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle || !formPassword) {
      setSnackbar({
        open: true,
        message: "Title and Password/Code are required",
        severity: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        username: formUsername,
        password: formPassword,
        category: formCategory,
      };

      if (editingCred) {
        // Edit existing
        const { data } = await api.put(`/locker/${editingCred._id}`, payload);
        setCredentials((prev) =>
          prev.map((c) => (c._id === editingCred._id ? data : c))
        );
        setSnackbar({
          open: true,
          message: "Credential updated successfully!",
          severity: "success",
        });
      } else {
        // Add new
        const { data } = await api.post("/locker", payload);
        setCredentials((prev) => [data, ...prev]);
        setSnackbar({
          open: true,
          message: "Credential saved securely!",
          severity: "success",
        });
      }
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to save credential",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Credential
  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/locker/${deletingId}`);
      setCredentials((prev) => prev.filter((c) => c._id !== deletingId));
      setSnackbar({
        open: true,
        message: "Credential deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to delete credential",
        severity: "error",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  };

  // Filter credentials
  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || cred.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
        {/* Glassmorphic Header Vault Panel */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 3,
            mb: 4,
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Shield sx={{ color: "#fff", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontFamily: '"Archivo Black", sans-serif',
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #10b981, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 0.5,
                }}
              >
                Password Vault
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                End-to-End Encrypted Secure Locker
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                px: 3,
                py: 1.2,
                fontSize: "0.88rem",
                background: "linear-gradient(135deg, #10b981, #059669)",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #047857)",
                },
              }}
            >
              Add Credential
            </Button>
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
                px: 2.5,
                py: 1.2,
                fontSize: "0.88rem",
                "&:hover": {
                  bgcolor: "action.hover",
                  borderColor: "text.primary",
                },
                transition: "all 0.2s ease",
              }}
            >
              Back
            </Button>
          </Box>
        </Box>

        {/* Categories and Search bar bar */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2.5,
            alignItems: "center",
            mb: 4,
          }}
        >
          {/* Category Tabs */}
          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <Tabs
              value={selectedCategory === "All" ? 0 : CATEGORIES.indexOf(selectedCategory) + 1}
              onChange={(e, val) =>
                setSelectedCategory(val === 0 ? "All" : CATEGORIES[val - 1])
              }
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "emerald.main",
                  height: 3,
                  borderRadius: "3px",
                },
              }}
            >
              <Tab
                label="All Vaults"
                sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.92rem" }}
              />
              {CATEGORIES.map((cat) => (
                <Tab
                  key={cat}
                  label={cat}
                  sx={{ fontWeight: 700, textTransform: "none", fontSize: "0.92rem" }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Search box */}
          <TextField
            placeholder="Search credentials..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 },
            }}
            sx={{ width: { xs: "100%", md: 320 } }}
          />
        </Box>

        {/* Vault Cards Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rounded"
                  height={180}
                  sx={{ borderRadius: 3, bgcolor: "action.hover" }}
                />
              </Grid>
            ))}
          </Grid>
        ) : filteredCredentials.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 10,
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
            <Shield sx={{ fontSize: 64, color: "text.secondary", mb: 2, opacity: 0.6 }} />
            <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
              No Credentials Found
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 400 }}>
              Store passwords, database login strings, security tokens, or credit card PIN codes safely here.
            </Typography>
            <Button
              variant="contained"
              onClick={handleOpenAdd}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 600,
                background: "linear-gradient(135deg, #10b981, #059669)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #047857)",
                },
              }}
            >
              Add Your First Secret
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredCredentials.map((cred) => {
              const isVisible = visibleIds.has(cred._id);
              return (
                <Grid item xs={12} sm={6} md={4} key={cred._id}>
                  <Card
                    sx={{
                      borderRadius: 3.5,
                      border: "1px solid",
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(148, 163, 184, 0.12)"
                          : "rgba(15, 23, 42, 0.06)",
                      background: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(30, 41, 59, 0.4)"
                          : "rgba(255, 255, 255, 0.65)",
                      backdropFilter: "blur(12px)",
                      boxShadow: (theme) =>
                        theme.palette.mode === "dark"
                          ? "0 4px 20px rgba(0,0,0,0.1)"
                          : "0 4px 20px rgba(0,0,0,0.01)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent sx={{ p: 3, pb: 1.5 }}>
                      {/* Card Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <VpnKey sx={{ color: "primary.main", fontSize: 18 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                            {cred.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={cred.category}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            borderRadius: "6px",
                            bgcolor: "action.hover",
                          }}
                        />
                      </Box>

                      {/* Username Section */}
                      {cred.username && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            Username / Email
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mt: 0.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 550, fontFamily: "monospace" }}>
                              {cred.username}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(cred.username, "Username")}
                              sx={{ color: "text.secondary" }}
                            >
                              <ContentCopy sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      )}

                      {/* Password Section */}
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                          Password / Code
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mt: 0.5,
                            bgcolor: "action.hover",
                            p: 1,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontFamily: isVisible ? "monospace" : "sans-serif",
                              fontSize: isVisible ? "0.95rem" : "1.2rem",
                              letterSpacing: isVisible ? "normal" : "0.15em",
                            }}
                          >
                            {isVisible ? cred.password : "••••••••"}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleVisibility(cred._id)}
                              sx={{ color: "text.secondary" }}
                            >
                              {isVisible ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(cred.password, "Password")}
                              sx={{ color: "text.secondary" }}
                            >
                              <ContentCopy sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>

                    {/* Card Actions */}
                    <CardActions
                      sx={{
                        px: 3,
                        pb: 2.5,
                        pt: 1,
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Button
                        size="small"
                        startIcon={<Edit sx={{ fontSize: 14 }} />}
                        onClick={() => handleOpenEdit(cred)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          borderRadius: 2,
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete sx={{ fontSize: 14 }} />}
                        onClick={() => handleDeleteClick(cred._id)}
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          borderRadius: 2,
                        }}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Add / Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => !saving && setOpenDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1.5,
            width: "100%",
            maxWidth: 460,
          },
        }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
            {editingCred ? "Edit Secure Credential" : "Add Secure Credential"}
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1.5 }}>
            <TextField
              label="Item Title (e.g. Google, WiFi router)"
              required
              fullWidth
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
            <TextField
              label="Username / Login ID"
              fullWidth
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{ sx: { borderRadius: 2.5 } }}
            />
            <TextField
              label="Password / Security Code"
              required
              fullWidth
              type={formShowPassword ? "text" : "password"}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                sx: { borderRadius: 2.5 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setFormShowPassword(!formShowPassword)}
                    >
                      {formShowPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              label="Category"
              fullWidth
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{ sx: { borderRadius: 2.5 } }}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button
              onClick={() => setOpenDialog(false)}
              color="inherit"
              disabled={saving}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                background: "linear-gradient(135deg, #10b981, #059669)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669, #047857)",
                },
              }}
            >
              {saving ? "Saving..." : "Save Secret"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Credential</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Are you sure you want to delete this credential? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: "text.secondary" }}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-btn"
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
