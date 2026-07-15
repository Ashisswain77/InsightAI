import { useState, useEffect, useCallback } from "react";
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
  Lock,
  LockOpen,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { deriveKey, encryptText, decryptText } from "../utils/crypto";

const CATEGORIES = ["General", "Website", "Work", "Social Media", "Financial", "PIN / Code"];
const VAULT_VERIFICATION_TITLE = "__vault_verification__";
const SESSION_KEY = "vault_master_key";

export default function Locker() {
  // Vault gate states
  const [vaultStatus, setVaultStatus] = useState("loading"); // "loading" | "setup" | "locked" | "unlocked"
  const [vaultKey, setVaultKey] = useState(null);
  const [masterInput, setMasterInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [hintInput, setHintInput] = useState("");
  const [vaultHint, setVaultHint] = useState("");
  const [showMasterInput, setShowMasterInput] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");

  // Main vault states
  const [credentials, setCredentials] = useState([]);
  const [rawCredentials, setRawCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCred, setEditingCred] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Dialog State for Hint Edit
  const [editHintOpen, setEditHintOpen] = useState(false);
  const [newHintInput, setNewHintInput] = useState("");
  const [savingHint, setSavingHint] = useState(false);

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

  // ─── Vault Initialization Check ──────────────────────────────
  useEffect(() => {
    const checkVault = async () => {
      try {
        const { data } = await api.get("/locker");
        const verification = data.find((c) => c.title === VAULT_VERIFICATION_TITLE);
        if (verification) {
          setVaultHint(verification.username || "");
          // Vault has been set up before — check sessionStorage for cached key
          const cachedPassword = sessionStorage.getItem(SESSION_KEY);
          if (cachedPassword) {
            try {
              const key = await deriveKey(cachedPassword);
              await decryptText(verification.encryptedPassword, verification.iv, key);
              setVaultKey(key);
              setRawCredentials(data);
              setVaultStatus("unlocked");
            } catch {
              // Cached key is stale
              sessionStorage.removeItem(SESSION_KEY);
              setRawCredentials(data);
              setVaultStatus("locked");
            }
          } else {
            setRawCredentials(data);
            setVaultStatus("locked");
          }
        } else {
          setVaultStatus("setup");
        }
      } catch (err) {
        console.error("Vault check failed:", err);
        setVaultStatus("setup");
      }
    };
    checkVault();
  }, []);

  // ─── Decrypt all credentials when vault unlocks ──────────────
  const decryptAll = useCallback(
    async (raw, key) => {
      const decrypted = [];
      for (const cred of raw) {
        if (cred.title === VAULT_VERIFICATION_TITLE) continue;
        let plainPassword = "";
        try {
          plainPassword = await decryptText(cred.encryptedPassword, cred.iv, key);
        } catch {
          plainPassword = "[Decryption Failed]";
        }
        decrypted.push({
          _id: cred._id,
          title: cred.title,
          username: cred.username,
          password: plainPassword,
          category: cred.category,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt,
        });
      }
      setCredentials(decrypted);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (vaultStatus === "unlocked" && vaultKey && rawCredentials.length > 0) {
      decryptAll(rawCredentials, vaultKey);
    } else if (vaultStatus === "unlocked" && rawCredentials.length === 0) {
      setCredentials([]);
      setLoading(false);
    }
  }, [vaultStatus, vaultKey, rawCredentials, decryptAll]);

  // ─── Setup vault (first time) ────────────────────────────────
  const handleSetup = async () => {
    if (!masterInput || masterInput.length < 6) {
      setGateError("Master password must be at least 6 characters.");
      return;
    }
    if (masterInput !== confirmInput) {
      setGateError("Passwords do not match.");
      return;
    }

    setGateLoading(true);
    setGateError("");
    try {
      const key = await deriveKey(masterInput);
      const { iv, ciphertext } = await encryptText("vault_ok", key);

      await api.post("/locker", {
        title: VAULT_VERIFICATION_TITLE,
        username: hintInput.trim(),
        encryptedPassword: ciphertext,
        iv,
        category: "General",
      });

      sessionStorage.setItem(SESSION_KEY, masterInput);
      setVaultKey(key);
      setVaultHint(hintInput.trim());
      setRawCredentials([]);
      setVaultStatus("unlocked");
      setLoading(false);
    } catch (err) {
      setGateError("Failed to initialize vault. Please try again.");
      console.error("Vault setup error:", err);
    } finally {
      setGateLoading(false);
    }
  };

  const handleOpenEditHint = () => {
    setNewHintInput(vaultHint);
    setEditHintOpen(true);
  };

  const handleSaveHint = async () => {
    const verification = rawCredentials.find((c) => c.title === VAULT_VERIFICATION_TITLE);
    if (!verification) return;

    setSavingHint(true);
    try {
      const { data } = await api.put(`/locker/${verification._id}`, {
        username: newHintInput.trim(),
      });
      setVaultHint(data.username);
      // Sync rawCredentials list
      setRawCredentials((prev) =>
        prev.map((c) => (c._id === verification._id ? { ...c, username: data.username } : c))
      );
      setSnackbar({ open: true, message: "Vault hint updated!", severity: "success" });
      setEditHintOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to update vault hint", severity: "error" });
    } finally {
      setSavingHint(false);
    }
  };

  // ─── Unlock vault ────────────────────────────────────────────
  const handleUnlock = async () => {
    if (!masterInput) {
      setGateError("Enter your master password.");
      return;
    }

    setGateLoading(true);
    setGateError("");
    try {
      const key = await deriveKey(masterInput);
      const verification = rawCredentials.find((c) => c.title === VAULT_VERIFICATION_TITLE);
      if (!verification) {
        setGateError("Vault verification record not found.");
        setGateLoading(false);
        return;
      }

      await decryptText(verification.encryptedPassword, verification.iv, key);

      // Unlock succeeded
      sessionStorage.setItem(SESSION_KEY, masterInput);
      setVaultKey(key);
      setVaultStatus("unlocked");
    } catch {
      setGateError("Incorrect master password. Please try again.");
    } finally {
      setGateLoading(false);
    }
  };

  // ─── Toggle Visibility ───────────────────────────────────────
  const toggleVisibility = (id) => {
    const newVisible = new Set(visibleIds);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleIds(newVisible);
  };

  // ─── Copy to Clipboard ──────────────────────────────────────
  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: `${label} copied to clipboard!`,
      severity: "success",
    });
  };

  // ─── Open Add Dialog ────────────────────────────────────────
  const handleOpenAdd = () => {
    setEditingCred(null);
    setFormTitle("");
    setFormUsername("");
    setFormPassword("");
    setFormCategory("General");
    setFormShowPassword(false);
    setOpenDialog(true);
  };

  // ─── Open Edit Dialog ───────────────────────────────────────
  const handleOpenEdit = (cred) => {
    setEditingCred(cred);
    setFormTitle(cred.title);
    setFormUsername(cred.username);
    setFormPassword(cred.password);
    setFormCategory(cred.category);
    setFormShowPassword(false);
    setOpenDialog(true);
  };

  // ─── Save Credential (client-side encryption) ───────────────
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
      const { iv, ciphertext } = await encryptText(formPassword, vaultKey);

      const payload = {
        title: formTitle,
        username: formUsername,
        encryptedPassword: ciphertext,
        iv,
        category: formCategory,
      };

      if (editingCred) {
        const { data } = await api.put(`/locker/${editingCred._id}`, payload);
        // Update local state with decrypted version
        setCredentials((prev) =>
          prev.map((c) =>
            c._id === editingCred._id
              ? {
                  ...c,
                  title: data.title,
                  username: data.username,
                  password: formPassword,
                  category: data.category,
                  updatedAt: data.updatedAt,
                }
              : c
          )
        );
        setSnackbar({
          open: true,
          message: "Credential updated successfully!",
          severity: "success",
        });
      } else {
        const { data } = await api.post("/locker", payload);
        setCredentials((prev) => [
          {
            _id: data._id,
            title: data.title,
            username: data.username,
            password: formPassword,
            category: data.category,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          ...prev,
        ]);
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

  // ─── Delete Credential ──────────────────────────────────────
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

  // ─── Filter credentials ─────────────────────────────────────
  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cred.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || cred.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Vault Gate (Setup / Unlock)
  // ═══════════════════════════════════════════════════════════════
  if (vaultStatus === "loading") {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Navbar />
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 4 }}>
          <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3, mb: 3 }} />
          <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
        </Box>
      </Box>
    );
  }

  if (vaultStatus === "setup" || vaultStatus === "locked") {
    const isSetup = vaultStatus === "setup";
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Navbar />
        <Box
          className="animate-fade-in"
          sx={{
            maxWidth: 480,
            mx: "auto",
            px: { xs: 2, md: 4 },
            py: { xs: 8, md: 12 },
          }}
        >
          <Box
            sx={{
              p: 4,
              borderRadius: 4,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.5)"
                  : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(16px)",
              border: "1px solid",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(148, 163, 184, 0.12)"
                  : "rgba(15, 23, 42, 0.08)",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 16px 48px rgba(0,0,0,0.25)"
                  : "0 16px 48px rgba(0,0,0,0.04)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #10b981, #34d399, #06b6d4)",
              },
            }}
          >
            {/* Icon */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)",
                }}
              >
                {isSetup ? (
                  <Shield sx={{ color: "#fff", fontSize: 36 }} />
                ) : (
                  <Lock sx={{ color: "#fff", fontSize: 36 }} />
                )}
              </Box>
            </Box>

            {/* Title */}
            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 800,
                fontFamily: '"Archivo Black", sans-serif',
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #10b981, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
              }}
            >
              {isSetup ? "Setup Your Vault" : "Unlock Vault"}
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{ color: "text.secondary", mb: 3.5, fontWeight: 500 }}
            >
              {isSetup
                ? "Create a master password to encrypt your credentials. This password never leaves your browser."
                : "Enter your master password to decrypt and access your credentials."}
            </Typography>

            {/* Error */}
            {gateError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {gateError}
              </Alert>
            )}

            {/* Password Field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                isSetup ? handleSetup() : handleUnlock();
              }}
            >
              <TextField
                fullWidth
                id="vault-master-password"
                label="Master Password"
                type={showMasterInput ? "text" : "password"}
                value={masterInput}
                onChange={(e) => setMasterInput(e.target.value)}
                autoFocus
                sx={{
                  mb: isSetup ? 2.5 : 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(15, 23, 42, 0.25)"
                        : "rgba(0, 0, 0, 0.015)",
                    "& fieldset": { borderColor: "divider" },
                    "&:hover fieldset": { borderColor: "text.secondary" },
                    "&.Mui-focused fieldset": { borderColor: "#10b981" },
                  },
                  "& .MuiInputLabel-root": {
                    fontWeight: 550,
                    "&.Mui-focused": { color: "#10b981" },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowMasterInput(!showMasterInput)}
                      >
                        {showMasterInput ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {isSetup && (
                <TextField
                  fullWidth
                  id="vault-confirm-password"
                  label="Confirm Master Password"
                  type={showMasterInput ? "text" : "password"}
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  sx={{
                    mb: 2.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(15, 23, 42, 0.25)"
                          : "rgba(0, 0, 0, 0.015)",
                      "& fieldset": { borderColor: "divider" },
                      "&:hover fieldset": { borderColor: "text.secondary" },
                      "&.Mui-focused fieldset": { borderColor: "#10b981" },
                    },
                    "& .MuiInputLabel-root": {
                      fontWeight: 550,
                      "&.Mui-focused": { color: "#10b981" },
                    },
                  }}
                />
              )}

              {isSetup && (
                <TextField
                  fullWidth
                  id="vault-hint"
                  label="Password Hint / Info (Optional)"
                  value={hintInput}
                  onChange={(e) => setHintInput(e.target.value)}
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      bgcolor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(15, 23, 42, 0.25)"
                          : "rgba(0, 0, 0, 0.015)",
                      "& fieldset": { borderColor: "divider" },
                      "&:hover fieldset": { borderColor: "text.secondary" },
                      "&.Mui-focused fieldset": { borderColor: "#10b981" },
                    },
                    "& .MuiInputLabel-root": {
                      fontWeight: 550,
                      "&.Mui-focused": { color: "#10b981" },
                    },
                  }}
                />
              )}

              {!isSetup && vaultHint && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    mb: 2.5,
                    textAlign: "center",
                    color: "text.secondary",
                    fontStyle: "italic",
                  }}
                >
                  💡 Hint: {vaultHint}
                </Typography>
              )}

              <Button
                id="vault-submit-btn"
                type="submit"
                fullWidth
                variant="contained"
                disabled={gateLoading}
                startIcon={isSetup ? <Shield /> : <LockOpen />}
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.5,
                  fontSize: "1rem",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669, #047857)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                {gateLoading
                  ? isSetup
                    ? "Initializing Vault..."
                    : "Unlocking..."
                  : isSetup
                  ? "Create Vault"
                  : "Unlock Vault"}
              </Button>
            </form>

            {/* Security Note */}
            <Typography
              variant="caption"
              align="center"
              sx={{
                display: "block",
                mt: 3,
                color: "text.secondary",
                opacity: 0.7,
                lineHeight: 1.5,
              }}
            >
              🔐 Zero-knowledge encryption — your master password and credentials never leave your browser.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Main Vault UI (Unlocked)
  // ═══════════════════════════════════════════════════════════════
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
                Zero-Knowledge E2E Encrypted Vault
              </Typography>
              {/* Vault hint configuration is managed from the profile dropdown settings */}
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

        {/* Categories and Search bar */}
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
              {saving ? "Encrypting..." : "Save Secret"}
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
