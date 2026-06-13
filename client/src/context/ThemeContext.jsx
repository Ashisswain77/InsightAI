import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";

const ThemeContext = createContext(null);

function getDesignTokens(mode) {
  const isDark = mode === "dark";
  return {
    palette: {
      mode,
      primary: {
        main: isDark ? "#818cf8" : "#4f46e5",
        light: isDark ? "#a5b4fc" : "#6366f1",
        dark: isDark ? "#6366f1" : "#3730a3",
      },
      secondary: {
        main: isDark ? "#c084fc" : "#9333ea",
        light: isDark ? "#d8b4fe" : "#a855f7",
        dark: isDark ? "#9333ea" : "#7e22ce",
      },
      background: {
        default: isDark ? "#0f172a" : "#f1f5f9",
        paper: isDark ? "#1e293b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f1f5f9" : "#0f172a",
        secondary: isDark ? "#94a3b8" : "#475569",
      },
      divider: isDark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)",
      error: {
        main: isDark ? "#f87171" : "#dc2626",
      },
      success: {
        main: isDark ? "#4ade80" : "#16a34a",
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 10,
            padding: "10px 24px",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark
              ? "rgba(30, 41, 59, 0.7)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${
              isDark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"
            }`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 8,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.8)"
              : "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${
              isDark ? "rgba(148,163,184,0.12)" : "rgba(15,23,42,0.08)"
            }`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  };
}

export function ThemeProviderWrapper({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem("theme-mode");
    if (saved) return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "dark"; // Default to dark
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    // Toggle class on <html> for Tailwind dark: variant
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeProviderWrapper");
  }
  return context;
}
