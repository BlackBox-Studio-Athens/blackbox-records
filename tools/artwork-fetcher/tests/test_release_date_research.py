import json
import tempfile
import unittest
from pathlib import Path

from artwork_fetcher.release_date_research import AnalyzedItem, CatalogItem, choose_candidate, conflict_rows, run_release_date_research
from artwork_fetcher.release_dates import (
    ReleaseDateCandidate,
    bandcamp_release_date_candidates_from_html,
    discogs_date_candidate_from_data,
    dsp_date_candidate_from_payload,
    musicbrainz_date_candidates_from_data,
    retailer_date_candidate_from_payload,
)
from artwork_fetcher.text import normalize_release


FIXTURES = Path(__file__).with_name("fixtures") / "release_date"


class ReleaseDateResearchTests(unittest.TestCase):
    def test_source_payloads_classify_release_date_basis(self):
        bandcamp_release = normalize_release(1, "Chronoboros", "Caregivers", "Vinyl 12in")
        bandcamp = bandcamp_release_date_candidates_from_html(
            bandcamp_release,
            (FIXTURES / "bandcamp.html").read_text(encoding="utf-8"),
            "https://chronoboros.bandcamp.com/album/caregivers",
        )[0]
        self.assertEqual((bandcamp.date, bandcamp.basis, bandcamp.source_tier, bandcamp.confidence), ("2026-03-13", "original_release", "official", "high"))

        musicbrainz_release = normalize_release(1, "Russian Circles", "Live at Dunk! Fest 2016", "Vinyl 12in")
        musicbrainz = musicbrainz_date_candidates_from_data(
            musicbrainz_release,
            json.loads((FIXTURES / "musicbrainz.json").read_text(encoding="utf-8")),
        )[0]
        self.assertEqual((musicbrainz.date, musicbrainz.basis, musicbrainz.source_tier), ("2017-04-13", "format_release", "catalog_database"))

        discogs_release = normalize_release(1, "Pelican", "Live at Dunk! Fest 2016", "Vinyl 12in")
        discogs = discogs_date_candidate_from_data(
            discogs_release,
            json.loads((FIXTURES / "discogs.json").read_text(encoding="utf-8")),
        )
        self.assertEqual((discogs.date, discogs.basis, discogs.source_name), ("2016-11-22", "format_release", "Discogs"))

        retailer_release = normalize_release(1, "Retail Band", "Retail Album", "Vinyl 12in")
        retailer = retailer_date_candidate_from_payload(
            retailer_release,
            json.loads((FIXTURES / "retailer.json").read_text(encoding="utf-8")),
        )
        self.assertEqual((retailer.date, retailer.basis, retailer.source_tier), ("2025-05-23", "store_availability", "retailer"))

        dsp_release = normalize_release(1, "Afterwise", "Disintegration", "Vinyl 12in")
        dsp = dsp_date_candidate_from_payload(
            dsp_release,
            json.loads((FIXTURES / "dsp.json").read_text(encoding="utf-8")),
        )
        self.assertEqual((dsp.date, dsp.basis, dsp.confidence), ("2026-09-01", "platform_upload", "low"))

    def test_conflicting_source_dates_require_manual_review(self):
        chosen, status, conflict = choose_candidate(
            [
                ReleaseDateCandidate(
                    date="2026-03-13",
                    precision="day",
                    basis="original_release",
                    source_tier="official",
                    source_name="Bandcamp",
                    confidence="high",
                ),
                ReleaseDateCandidate(
                    date="2026-03-14",
                    precision="day",
                    basis="format_release",
                    source_tier="catalog_database",
                    source_name="MusicBrainz",
                    confidence="medium",
                ),
            ]
        )

        self.assertEqual(status, "manual_review")
        self.assertIn("disagree", conflict)
        self.assertEqual(chosen.date, "2026-03-13")

        rows = conflict_rows(
            [
                AnalyzedItem(
                    item=CatalogItem("distro", "caregivers", Path("caregivers.json"), "Chronoboros", "Caregivers", "Vinyl"),
                    candidates=[
                        ReleaseDateCandidate(
                            date="2026-03-13",
                            precision="day",
                            basis="original_release",
                            source_tier="official",
                            source_name="Bandcamp",
                            confidence="high",
                        ),
                        ReleaseDateCandidate(
                            date="2026-03-14",
                            precision="day",
                            basis="format_release",
                            source_tier="catalog_database",
                            source_name="MusicBrainz",
                            confidence="medium",
                        ),
                    ],
                    chosen=chosen,
                    status=status,
                    conflict=conflict,
                )
            ]
        )
        self.assertIn("2026-03-13 original_release official/Bandcamp", rows[0]["notes"])
        self.assertIn("2026-03-14 format_release catalog_database/MusicBrainz", rows[0]["notes"])

    def test_dry_run_writes_reports_without_content_writes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = make_project(Path(tmp))
            out_dir = root / "reports"

            result = run_release_date_research(project_root=root, out_dir=out_dir, source_limit=0, apply=False)

            self.assertEqual(result["items"], 3)
            self.assertTrue((out_dir / "summary.json").exists())
            self.assertTrue((out_dir / "candidates.tsv").exists())
            self.assertTrue((out_dir / "missing.tsv").exists())
            self.assertTrue((out_dir / "conflicts.tsv").exists())
            self.assertTrue((out_dir / "proposed-updates.tsv").exists())
            self.assertNotIn("2020-01-01", (root / "apps/web/src/content/distro/safe.json").read_text(encoding="utf-8"))

    def test_apply_updates_only_verified_override_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = make_project(Path(tmp))
            overrides = root / "overrides.json"
            overrides.write_text(
                json.dumps(
                    [
                        {
                            "collection": "distro",
                            "item_id": "safe",
                            "chosen_date": "2020-01-01",
                            "basis": "original_release",
                            "source_url": "https://label.example/safe",
                            "reviewer_note": "confirmed label page",
                        }
                    ]
                ),
                encoding="utf-8",
            )

            run_release_date_research(project_root=root, out_dir=root / "reports", source_limit=0, overrides_path=overrides, apply=True)

            safe = json.loads((root / "apps/web/src/content/distro/safe.json").read_text(encoding="utf-8"))
            weak = json.loads((root / "apps/web/src/content/distro/weak.json").read_text(encoding="utf-8"))
            self.assertEqual(safe["release_date"], "2020-01-01")
            self.assertNotIn("release_date", weak)

    def test_verified_overrides_require_day_date_strong_basis_and_provenance(self):
        invalid_overrides = [
            {"chosen_date": "2020-01", "basis": "original_release", "source_url": "https://label.example/safe", "reviewer_note": "confirmed"},
            {"chosen_date": "2020-01-01", "basis": "platform_upload", "source_url": "https://label.example/safe", "reviewer_note": "confirmed"},
            {"chosen_date": "2020-01-01", "basis": "original_release", "reviewer_note": "confirmed"},
            {"chosen_date": "2020-01-01", "basis": "original_release", "source_url": "https://label.example/safe"},
        ]
        for override in invalid_overrides:
            with self.subTest(override=override):
                with tempfile.TemporaryDirectory() as tmp:
                    root = make_project(Path(tmp))
                    overrides = root / "overrides.json"
                    overrides.write_text(json.dumps([{"collection": "distro", "item_id": "safe"} | override]), encoding="utf-8")

                    with self.assertRaises(ValueError):
                        run_release_date_research(project_root=root, out_dir=root / "reports", source_limit=0, overrides_path=overrides, apply=True)

    def test_command_boundaries_do_not_import_each_other(self):
        package = Path(__file__).parents[1] / "src" / "artwork_fetcher"
        self.assertNotIn("release_date_research", (package / "mockup.py").read_text(encoding="utf-8"))
        self.assertNotIn("release_date_research", (package / "cd_mockup.py").read_text(encoding="utf-8"))
        self.assertNotIn("release_date_research", (package / "cassette_mockup.py").read_text(encoding="utf-8"))
        self.assertNotIn("mockup", (package / "release_date_research.py").read_text(encoding="utf-8"))


def make_project(root: Path) -> Path:
    releases = root / "apps/web/src/content/releases"
    artists = root / "apps/web/src/content/artists"
    distro = root / "apps/web/src/content/distro"
    inventory = root / "scripts/data"
    releases.mkdir(parents=True)
    artists.mkdir(parents=True)
    distro.mkdir(parents=True)
    inventory.mkdir(parents=True)
    (artists / "artist.md").write_text("---\ntitle: Artist\n---\n", encoding="utf-8")
    (releases / "release.md").write_text(
        "---\ntitle: Release\nartist: artist\nrelease_date: 1999-01-01\nformats:\n  - Digital\n---\n",
        encoding="utf-8",
    )
    (distro / "safe.json").write_text(
        json.dumps({"title": "Safe", "artist_or_label": "Safe Band", "group": "Vinyl 12-inch", "format": "Vinyl", "order": 1}),
        encoding="utf-8",
    )
    (distro / "weak.json").write_text(
        json.dumps({"title": "Weak", "artist_or_label": "Weak Band", "group": "Vinyl 12-inch", "format": "Vinyl", "order": 2}),
        encoding="utf-8",
    )
    (inventory / "distro-inventory-source.json").write_text(
        json.dumps(
            {
                "rows": [
                    {
                        "id": "safe-row",
                        "sourceArtist": "Safe Band",
                        "sourceTitle": "Safe",
                        "itemType": "Vinyl 12-inch",
                        "releaseDate": None,
                        "sourceAliases": [],
                    },
                    {
                        "id": "weak-row",
                        "sourceArtist": "Weak Band",
                        "sourceTitle": "Weak",
                        "itemType": "Vinyl 12-inch",
                        "releaseDate": "2021-02-03",
                        "sourceAliases": [],
                    },
                ]
            }
        ),
        encoding="utf-8",
    )
    return root


if __name__ == "__main__":
    unittest.main()
