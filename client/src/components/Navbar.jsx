import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
  Switch,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import {
  Logout,
  Settings,
  DarkMode,
  KeyboardArrowDown,
  ElectricBolt,
  Lock,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import api from "../api/axios";

export default function Navbar() {
  const { user, logout, isAuthenticated, updateUser } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  // Dropdown Menu State
  const [anchorEl, setAnchorEl] = useState(null);

  // Dialog State for Profile Editing
  const [profileOpen, setProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Dialog State for Vault Settings
  const [vaultSettingsOpen, setVaultSettingsOpen] = useState(false);
  const [vaultHintInput, setVaultHintInput] = useState("");
  const [verificationRecord, setVerificationRecord] = useState(null);
  const [loadingVault, setLoadingVault] = useState(false);
  const [savingVaultHint, setSavingVaultHint] = useState(false);
  const [vaultError, setVaultError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuOpen = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenEditProfile = () => {
    setNameInput(user?.name || "");
    setEmailInput(user?.email || "");
    setErrorMsg("");
    setUpdating(false);
    setProfileOpen(true);
    handleMenuClose();
  };

  const handleUpdateProfile = async () => {
    if (!nameInput.trim() || !emailInput.trim()) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      const { data } = await api.put("/auth/profile", {
        name: nameInput.trim(),
        email: emailInput.trim(),
      });
      updateUser(data);
      setProfileOpen(false);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenVaultSettings = async () => {
    setVaultSettingsOpen(true);
    setLoadingVault(true);
    setVaultError("");
    setVerificationRecord(null);
    setVaultHintInput("");
    handleMenuClose();
    try {
      const { data } = await api.get("/locker");
      const verification = data.find((c) => c.title === "__vault_verification__");
      if (verification) {
        setVerificationRecord(verification);
        setVaultHintInput(verification.username || "");
      } else {
        setVaultError("not_setup");
      }
    } catch (err) {
      setVaultError("failed");
    } finally {
      setLoadingVault(false);
    }
  };

  const handleSaveVaultHint = async () => {
    if (!verificationRecord) return;
    setSavingVaultHint(true);
    try {
      await api.put(`/locker/${verificationRecord._id}`, {
        username: vaultHintInput.trim(),
      });
      setVaultSettingsOpen(false);
      // Trigger a page reload or event to sync hint state in Locker page if active
      if (window.location.pathname === "/locker") {
        window.location.reload();
      }
    } catch (err) {
      setErrorMsg("Failed to update vault hint.");
    } finally {
      setSavingVaultHint(false);
    }
  };

  const isNotesActive = window.location.pathname === "/dashboard";
  const isArchivedActive = window.location.pathname === "/archived";
  const isBinActive = window.location.pathname === "/bin";
  const isLockerActive = window.location.pathname === "/locker";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      id="main-navbar"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(15, 23, 42, 0.75)"
            : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(148, 163, 184, 0.1)"
            : "rgba(15, 23, 42, 0.06)",
        boxShadow: "none",
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, gap: 2 }}>
        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
          }}
          onClick={() => navigate("/dashboard")}
        >
          <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Central vertical pill */}
            <rect x="47" y="32" width="6" height="36" rx="3" fill="#818cf8" />
            {/* Top radiating pill */}
            <rect x="47" y="12" width="6" height="14" rx="3" fill="#818cf8" />
            {/* Bottom radiating pill */}
            <rect x="47" y="74" width="6" height="14" rx="3" fill="#818cf8" />
            {/* Left radiating pill */}
            <rect x="12" y="47" width="14" height="6" rx="3" fill="#818cf8" />
            {/* Right radiating pill */}
            <rect x="74" y="47" width="14" height="6" rx="3" fill="#818cf8" />
            
            {/* Top-Right radiating pill (rotated 45deg around center 50,50) */}
            <rect x="47" y="12" width="6" height="14" rx="3" fill="#818cf8" transform="rotate(45 50 50)" />
            {/* Bottom-Right radiating pill (rotated 135deg around center 50,50) */}
            <rect x="47" y="12" width="6" height="14" rx="3" fill="#818cf8" transform="rotate(135 50 50)" />
            {/* Bottom-Left radiating pill (rotated 225deg around center 50,50) */}
            <rect x="47" y="12" width="6" height="14" rx="3" fill="#818cf8" transform="rotate(225 50 50)" />
            {/* Top-Left radiating pill (rotated 315deg around center 50,50) */}
            <rect x="47" y="12" width="6" height="14" rx="3" fill="#818cf8" transform="rotate(315 50 50)" />
          </svg>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontFamily: '"Outfit", sans-serif',
              fontSize: "1.3rem",
              letterSpacing: "-0.02em",
              color: "text.primary",
              display: { xs: "none", sm: "block" },
            }}
          >
            Insights
          </Typography>
        </Box>

        {/* Navigation Links */}
        {isAuthenticated && (
          <Box sx={{ display: "flex", gap: 1, mr: "auto", ml: { xs: 2, md: 4 } }}>
            <Button
              onClick={() => navigate("/dashboard")}
              sx={{
                color: isNotesActive ? "primary.main" : "text.secondary",
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                border: "1px solid",
                borderColor: isNotesActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                bgcolor: isNotesActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) => theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              Notes
            </Button>
            <Button
              onClick={() => navigate("/archived")}
              sx={{
                color: isArchivedActive ? "primary.main" : "text.secondary",
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                border: "1px solid",
                borderColor: isArchivedActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                bgcolor: isArchivedActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) => theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              Archived
            </Button>
            <Button
              onClick={() => navigate("/locker")}
              sx={{
                color: isLockerActive ? "primary.main" : "text.secondary",
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                border: "1px solid",
                borderColor: isLockerActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                bgcolor: isLockerActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) => theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              Locker
            </Button>
            <Button
              onClick={() => navigate("/bin")}
              sx={{
                color: isBinActive ? "primary.main" : "text.secondary",
                fontWeight: 700,
                fontSize: "0.92rem",
                textTransform: "none",
                borderRadius: "20px",
                px: 2.5,
                py: 0.6,
                border: "1px solid",
                borderColor: isBinActive ? "rgba(99, 102, 241, 0.25)" : "transparent",
                bgcolor: isBinActive ? "rgba(99, 102, 241, 0.08)" : "transparent",
                "&:hover": {
                  color: "text.primary",
                  bgcolor: (theme) => theme.palette.action.hover,
                },
                transition: "all 0.2s ease",
              }}
            >
              Bin
            </Button>
          </Box>
        )}

        {/* User section */}
        {isAuthenticated && user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              id="profile-dropdown-btn"
              onClick={handleMenuOpen}
              endIcon={<KeyboardArrowDown sx={{ fontSize: 18, color: "text.secondary" }} />}
              sx={{
                textTransform: "none",
                borderRadius: 3,
                px: 1.5,
                py: 0.75,
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(148, 163, 184, 0.15)"
                    : "rgba(15, 23, 42, 0.08)",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.01)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                variant="dot"
                sx={{
                  "& .MuiBadge-badge": {
                    backgroundColor: "#10b981",
                    color: "#10b981",
                    boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    width: 28,
                    height: 28,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "text.primary",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {user.name}
              </Typography>
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 4,
                  mt: 1.5,
                  minWidth: 290,
                  padding: 0.5,
                  backgroundImage: "none",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(30, 41, 59, 0.85)"
                      : "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(20px)",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 10px 30px rgba(0,0,0,0.5)"
                      : "0 10px 30px rgba(0,0,0,0.05)",
                  border: "1px solid",
                  borderColor: "divider",
                },
              }}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              {/* Header Profile Info */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, px: 2, py: 2 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  sx={{
                    "& .MuiBadge-badge": {
                      backgroundColor: "#10b981",
                      boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                      width: 44,
                      height: 44,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
                <Box sx={{ overflow: "hidden", flexGrow: 1, mr: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: "0.95rem" }}>
                    {user.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.8rem",
                      mt: 0.25,
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>


              </Box>

              <Divider sx={{ my: 0.5 }} />

              {/* Menu items */}
              <MenuItem
                id="menu-account-settings"
                onClick={handleOpenEditProfile}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1,
                  display: "flex",
                  gap: 1.5,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "text.primary",
                }}
              >
                <Settings sx={{ color: "text.secondary", fontSize: 18 }} />
                Account Settings
              </MenuItem>

              <MenuItem
                id="menu-vault-settings"
                onClick={handleOpenVaultSettings}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1,
                  display: "flex",
                  gap: 1.5,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "text.primary",
                }}
              >
                <Lock sx={{ color: "text.secondary", fontSize: 18 }} />
                Vault Settings
              </MenuItem>

              <MenuItem
                disableRipple
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 0.5,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "text.primary",
                  "&:hover": { bgcolor: "transparent", cursor: "default" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <DarkMode sx={{ color: "text.secondary", fontSize: 18 }} />
                  Dark Mode
                </Box>
                <Switch
                  id="menu-dark-mode-toggle"
                  checked={mode === "dark"}
                  onChange={toggleTheme}
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#10b981",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#10b981",
                    },
                  }}
                />
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              <MenuItem
                id="menu-logout-btn"
                onClick={handleLogout}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  py: 1,
                  display: "flex",
                  gap: 1.5,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "error.main",
                  "&:hover": {
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(248, 113, 113, 0.08)"
                        : "rgba(239, 68, 68, 0.05)",
                  },
                }}
              >
                <Logout sx={{ fontSize: 18, transform: "rotate(180deg)" }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>

      {/* Account Settings Edit Profile Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => !updating && setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', pb: 1 }}>
          Account Settings
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {errorMsg && <Alert severity="error" sx={{ borderRadius: 2 }}>{errorMsg}</Alert>}
          <TextField
            id="profile-edit-name"
            label="Name"
            fullWidth
            required
            size="small"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            InputProps={{ sx: { borderRadius: 2.5 } }}
          />
          <TextField
            id="profile-edit-email"
            label="Email Address"
            fullWidth
            required
            size="small"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            InputProps={{ sx: { borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setProfileOpen(false)}
            color="inherit"
            disabled={updating}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            id="profile-edit-submit-btn"
            onClick={handleUpdateProfile}
            variant="contained"
            disabled={updating || !nameInput.trim() || !emailInput.trim()}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              "&:hover": {
                background: "linear-gradient(135deg, #4f46e5, #9333ea)",
              },
            }}
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vault Settings Dialog */}
      <Dialog
        open={vaultSettingsOpen}
        onClose={() => !savingVaultHint && setVaultSettingsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif', pb: 1 }}>
          Vault Settings
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {vaultError === "failed" && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load vault configuration. Please try again later.
            </Alert>
          )}
          
          {vaultError === "not_setup" && (
            <Box sx={{ py: 1, textAlign: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Your E2EE Password Vault is not initialized yet.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setVaultSettingsOpen(false);
                  navigate("/locker");
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  px: 3,
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                }}
              >
                Initialize Vault
              </Button>
            </Box>
          )}

          {vaultError !== "not_setup" && vaultError !== "failed" && !loadingVault && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Update your E2EE master password recovery hint. This hint is stored in plain text on the server.
              </Typography>
              <TextField
                id="vault-hint-input"
                label="Master Password Hint"
                fullWidth
                size="small"
                value={vaultHintInput}
                onChange={(e) => setVaultHintInput(e.target.value)}
                InputProps={{ sx: { borderRadius: 2.5 } }}
              />
            </Box>
          )}
        </DialogContent>
        {vaultError !== "not_setup" && (
          <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
            <Button
              onClick={() => setVaultSettingsOpen(false)}
              color="inherit"
              disabled={savingVaultHint}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              id="save-vault-hint-btn"
              onClick={handleSaveVaultHint}
              variant="contained"
              disabled={savingVaultHint || loadingVault || vaultError === "failed"}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4f46e5, #9333ea)",
                },
              }}
            >
              {savingVaultHint ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </AppBar>
  );
}
