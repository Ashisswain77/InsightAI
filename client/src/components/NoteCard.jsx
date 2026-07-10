import { Card, CardContent, CardActionArea, Typography, Box, Chip } from "@mui/material";
import { AccessTime, AutoAwesome } from "@mui/icons-material";
import TagBadge from "./TagBadge";

export default function NoteCard({ note, onClick }) {
  const preview = note.summary || note.content?.substring(0, 120) + (note.content?.length > 120 ? "..." : "");
  const hasAI = !!(note.summary && note.tags?.length > 0);
  const dateStr = new Date(note.updatedAt || note.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      id={`note-card-${note._id}`}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(129, 140, 248, 0.15)"
              : "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(79, 70, 229, 0.1)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #6366f1, #a855f7, #06b6d4)",
          opacity: 0,
          transition: "opacity 0.3s ease",
        },
        "&:hover::before": {
          opacity: 1,
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          p: 0,
        }}
      >
        <CardContent sx={{ flex: 1, p: 2.5, "&:last-child": { pb: 2.5 } }}>
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontSize: "1.15rem",
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {note.title}
          </Typography>

          {/* Summary / Preview */}
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: "0.95rem",
            }}
          >
            {preview}
          </Typography>

          {/* Tags */}
          {note.tags?.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2 }}>
              {note.tags.slice(0, 4).map((tag, i) => (
                <TagBadge key={tag} tag={tag} index={i} />
              ))}
              {note.tags.length > 4 && (
                <Chip
                  label={`+${note.tags.length - 4}`}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    backgroundColor: "action.hover",
                  }}
                />
              )}
            </Box>
          )}

          {/* Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: "auto",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: "0.85rem" }}
              >
                {dateStr}
              </Typography>
            </Box>
            {hasAI && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "primary.light",
                }}
              >
                <AutoAwesome sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                  AI Enhanced
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
