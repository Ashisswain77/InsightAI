import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
} from "@mui/material";
import { AutoAwesome, Logout } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User section */}
        {isAuthenticated && user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1.25,
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(148,163,184,0.15)"
                    : "rgba(15,23,42,0.08)",
                borderRadius: 3,
                pl: 1,
                pr: 2,
                py: 0.5,
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.01)",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  width: 26,
                  height: 26,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontSize: "0.88rem", color: "text.primary" }}
              >
                {user.name}
              </Typography>
            </Box>
            <Button
              id="logout-btn"
              onClick={handleLogout}
              startIcon={<Logout sx={{ fontSize: 16 }} />}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                fontSize: "0.88rem",
                px: 2,
                py: 0.6,
                border: "1px solid",
                borderColor: "transparent",
                "&:hover": {
                  color: "error.main",
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(248, 113, 113, 0.2)"
                      : "rgba(220, 38, 38, 0.1)",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(248, 113, 113, 0.06)"
                      : "rgba(220, 38, 38, 0.04)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
