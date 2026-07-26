# Public marketing kit

Listed on the website at `/resources`. Files are served from `/kit/...` (separate from the SPA route so downloads never collide with the page).

| Folder | Contents |
|--------|----------|
| `print/` | Window posters (PDF + PNG) |
| `social/` | Instagram / shareable PNGs |
| `brand/` | Logos + share card |

When adding new marketing material:

1. Drop the file here under the right folder.
2. Add a row to `SECTIONS` in `client/src/pages/Resources.tsx`.
3. Keep source masters in `marketing/` (not only here).
