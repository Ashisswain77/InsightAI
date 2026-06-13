import { Box, Typography, Skeleton } from "@mui/material";
import { AutoAwesome } from "@mui/icons-material";

export default function SummaryBox({ summary, loading = false }) {
  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(129, 140, 248, 0.06)"
              : "rgba(79, 70, 229, 0.04)",
          border: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(129, 140, 248, 0.12)"
              : "rgba(79, 70, 229, 0.1)",
        }}
      >
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="60%" />
      </Box>
    );
  }

  if (!summary) return null;

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(168, 85, 247, 0.06))"
            : "linear-gradient(135deg, rgba(79, 70, 229, 0.06), rgba(147, 51, 234, 0.04))",
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(129, 140, 248, 0.15)"
            : "rgba(79, 70, 229, 0.12)",
        transition: "all 0.3s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <AutoAwesome
          sx={{
            fontSize: 18,
            color: "primary.light",
            animation: "sparkle 2s ease-in-out infinite",
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "primary.light",
          }}
        >
          AI Summary
        </Typography>
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}
      >
        {summary}
      </Typography>
    </Box>
  );
}
