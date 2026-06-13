import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { WbSunnyRounded, DarkModeRounded } from "@mui/icons-material";
import { useThemeMode } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 500);
  };

  return (
    <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={handleClick}
        id="theme-toggle-btn"
        sx={{
          position: "relative",
          width: 42,
          height: 42,
          borderRadius: "50%",
          background:
            mode === "dark"
              ? "rgba(129, 140, 248, 0.1)"
              : "rgba(79, 70, 229, 0.1)",
          border: "1px solid",
          borderColor:
            mode === "dark"
              ? "rgba(129, 140, 248, 0.2)"
              : "rgba(79, 70, 229, 0.15)",
          transition: "all 0.3s ease",
          "&:hover": {
            background:
              mode === "dark"
                ? "rgba(129, 140, 248, 0.2)"
                : "rgba(79, 70, 229, 0.2)",
            boxShadow:
              mode === "dark"
                ? "0 0 20px rgba(129, 140, 248, 0.3)"
                : "0 0 20px rgba(79, 70, 229, 0.2)",
            transform: "scale(1.05)",
          },
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: animating
              ? "themeToggleSpin 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          }}
        >
          {mode === "dark" ? (
            <WbSunnyRounded
              sx={{
                fontSize: 22,
                color: "#fbbf24",
                filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))",
              }}
            />
          ) : (
            <DarkModeRounded
              sx={{
                fontSize: 22,
                color: "#6366f1",
                filter: "drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))",
              }}
            />
          )}
        </span>
      </IconButton>
    </Tooltip>
  );
}
