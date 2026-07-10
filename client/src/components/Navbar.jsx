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

  return (
    <AppBar
      position="sticky"
      elevation={0}
      id="main-navbar"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 }, gap: 2 }}>
        {/* Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            mr: "auto",
          }}
          onClick={() => navigate("/dashboard")}
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
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
            }}
          >
            <AutoAwesome sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #818cf8, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: { xs: "none", sm: "block" },
            }}
          >
            Insights
          </Typography>
        </Box>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User section */}
        {isAuthenticated && user && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip
              avatar={
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 28,
                    height: 28,
                    fontSize: "0.8rem",
                  }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
              }
              label={user.name}
              variant="outlined"
              sx={{
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(148,163,184,0.2)"
                    : "rgba(15,23,42,0.1)",
                color: "text.primary",
                fontWeight: 500,
                display: { xs: "none", md: "flex" },
              }}
            />
            <Button
              id="logout-btn"
              onClick={handleLogout}
              startIcon={<Logout sx={{ fontSize: 18 }} />}
              size="small"
              sx={{
                color: "text.secondary",
                "&:hover": {
                  color: "error.main",
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(248, 113, 113, 0.1)"
                      : "rgba(220, 38, 38, 0.06)",
                },
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
