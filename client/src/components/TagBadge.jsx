import { Chip } from "@mui/material";
import { LocalOffer } from "@mui/icons-material";

const tagColors = [
  { bg: "rgba(99, 102, 241, 0.15)", color: "#818cf8", border: "rgba(99, 102, 241, 0.3)" },
  { bg: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "rgba(168, 85, 247, 0.3)" },
  { bg: "rgba(236, 72, 153, 0.15)", color: "#f472b6", border: "rgba(236, 72, 153, 0.3)" },
  { bg: "rgba(34, 211, 238, 0.15)", color: "#22d3ee", border: "rgba(34, 211, 238, 0.3)" },
  { bg: "rgba(52, 211, 153, 0.15)", color: "#34d399", border: "rgba(52, 211, 153, 0.3)" },
  { bg: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", border: "rgba(251, 191, 36, 0.3)" },
];

export default function TagBadge({ tag, index = 0 }) {
  const colorSet = tagColors[index % tagColors.length];

  return (
    <Chip
      icon={<LocalOffer sx={{ fontSize: 15, color: `${colorSet.color} !important` }} />}
      label={tag}
      size="small"
      sx={{
        backgroundColor: colorSet.bg,
        color: colorSet.color,
        border: `1px solid ${colorSet.border}`,
        fontWeight: 500,
        fontSize: "0.85rem",
        height: 26,
        transition: "all 0.2s ease",
        "& .MuiChip-icon": {
          marginLeft: "6px",
        },
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: `0 4px 12px ${colorSet.bg}`,
        },
      }}
    />
  );
}
