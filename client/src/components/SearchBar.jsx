import { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { Search, Close } from "@mui/icons-material";

export default function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onClear) onClear();
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <TextField
        fullWidth
        id="semantic-search-bar"
        placeholder="Search notes semantically — find by meaning, not just keywords..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        variant="outlined"
        size="medium"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            fontSize: "1.05rem",
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(30, 41, 59, 0.6)"
                : "rgba(241, 245, 249, 0.8)",
            backdropFilter: "blur(8px)",
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(148,163,184,0.15)"
                  : "rgba(15,23,42,0.1)",
              transition: "border-color 0.3s ease",
            },
            "&:hover fieldset": {
              borderColor: "primary.main",
            },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 0 0 3px rgba(129, 140, 248, 0.15)"
                  : "0 0 0 3px rgba(79, 70, 229, 0.1)",
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </form>
  );
}
