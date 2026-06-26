from dataclasses import asdict, dataclass


MANIFEST_COLUMNS = [
    "row_number",
    "artist",
    "title",
    "format",
    "normalized_artist",
    "normalized_title",
    "normalized_format",
    "status",
    "confidence",
    "source",
    "source_page_url",
    "image_url",
    "local_path",
    "mime_type",
    "width",
    "height",
    "sha256",
    "matched_artist",
    "matched_title",
    "matched_format",
    "mbid",
    "discogs_release_id",
    "notes",
]


@dataclass(frozen=True)
class Release:
    row_number: int
    artist: str
    title: str
    format: str
    normalized_artist: str
    normalized_title: str
    normalized_format: str


@dataclass
class Candidate:
    source: str
    confidence: str
    score: int
    source_page_url: str = ""
    image_url: str = ""
    matched_artist: str = ""
    matched_title: str = ""
    matched_format: str = ""
    mbid: str = ""
    discogs_release_id: str = ""
    notes: str = ""


@dataclass
class FetchResult:
    release: Release
    status: str
    confidence: str
    source: str = ""
    source_page_url: str = ""
    image_url: str = ""
    local_path: str = ""
    mime_type: str = ""
    width: int | str = ""
    height: int | str = ""
    sha256: str = ""
    matched_artist: str = ""
    matched_title: str = ""
    matched_format: str = ""
    mbid: str = ""
    discogs_release_id: str = ""
    notes: str = ""

    def manifest_row(self) -> dict[str, object]:
        data = asdict(self)
        release = data.pop("release")
        release["row_number"] = f"{self.release.row_number:03d}"
        return release | data
