import { Card, CardContent, CardActionArea, CardActions, Button, Typography, Box, Chip } from "@mui/material";
import { AccessTime, AutoAwesome, Edit, Delete, Archive, Unarchive, RestoreFromTrash, DeleteForever } from "@mui/icons-material";
import TagBadge from "./TagBadge";

export default function NoteCard({ note, onClick, onEdit, onDelete, onArchive, onRestore, isBinPage }) {
  const preview = note.summary || note.content?.substring(0, 180) + (note.content?.length > 180 ? "..." : "");
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
        width: "100%",
        height: "auto",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0,0,0,0.25)"
            : "0 4px 20px rgba(0,0,0,0.05)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(129, 140, 248, 0.25)"
              : "0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(79, 70, 229, 0.15)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
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
        disabled={isBinPage}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          p: 0,
          flexGrow: 1,
        }}
      >
        <CardContent sx={{ flex: 1, p: 3, "&:last-child": { pb: 2.5 } }}>
          {/* Title */}
          <Typography
            variant="h6"
            sx={{
              fontSize: "1.2rem",
              fontWeight: 700,
              mb: 1.5,
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
              mb: 2.5,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: "0.98rem",
            }}
          >
            {preview}
          </Typography>

          {/* Tags */}
          {note.tags?.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 2.5 }}>
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

          {/* Footer Metadata */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: "auto",
              pt: 1,
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 15, color: "text.secondary" }} />
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
                <AutoAwesome sx={{ fontSize: 15 }} />
                <Typography variant="caption" sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                  AI Enhanced
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Action Buttons below the content */}
      <CardActions
        sx={{
          px: 2,
          pb: 2.5,
          pt: 1.5,
          gap: 1.25,
          display: "flex",
          justifyContent: "space-between",
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        {isBinPage ? (
          <>
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<RestoreFromTrash sx={{ fontSize: 15 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onRestore) onRestore(note._id);
              }}
              sx={{
                flex: 1,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
              }}
            >
              Restore
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteForever sx={{ fontSize: 15 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(note._id);
              }}
              sx={{
                flex: 1.2,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
              }}
            >
              Delete
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Edit sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onEdit) onEdit(note._id);
              }}
              sx={{
                flex: 1,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={note.isArchived ? <Unarchive sx={{ fontSize: 14 }} /> : <Archive sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onArchive) onArchive(note._id, !note.isArchived);
              }}
              sx={{
                flex: 1.3,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
              }}
            >
              {note.isArchived ? "Unarchive" : "Archive"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete(note._id, e);
              }}
              sx={{
                flex: 1,
                py: 0.75,
                px: 1,
                borderRadius: 2,
                fontWeight: 600,
                fontSize: "0.82rem",
                textTransform: "none",
              }}
            >
              Bin
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
}
