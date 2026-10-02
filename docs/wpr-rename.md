# WPR (was “Pro ELO” in the UI)

User-facing copy is **WPR**. Internal `/api/rankings` field remains `elo` (PickleWave `/rankings/all-singles`).

| Board | What it is |
|-------|------------|
| **WPR** | Open mixed rating (all players). Not split by MS/WS/MD/WD. Table chip is “Open mixed” only. |
| **PPA World** | Official PPA category ranking (men / women composite). |
| **GPA** | GPA category tables (MS/WS/MD/WD). |

Right rail: GPA and WPR are stacked (sticky is on the rail, not each card) so WPR no longer sits on top of GPA.

## How the number is shown

The same rating string everywhere a WPR row is painted: **`1842 WPR`** with the category **Open mixed**. The table does not add a second DUPR ranking. On a player page the header badge is that WPR rating (and the WPR place, when the board has one). DUPR, when the public feed includes it, is a separate line on the WPR card only. GPA points use **pts** on the rail and the full table. No board is merged into one world #1.
