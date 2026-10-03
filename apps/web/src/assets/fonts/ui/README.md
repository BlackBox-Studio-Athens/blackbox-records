# Public UI fonts

These unmodified WOFF2 subsets were downloaded from the official Google Fonts CSS API on 2026-10-03. The API response and download hash ledger are retained in `.codex-artifacts/performance-resume/` for this implementation. The build reads repository assets and needs no network font dependency.

- Inter normal: weights 400, 500 and 600 share each upstream variable subset. [Project and license](https://github.com/google/fonts/tree/main/ofl/inter); local `inter-OFL.txt`.
- Geist Mono normal: weights 400 and 500 share each upstream variable subset. [Project and license](https://github.com/google/fonts/tree/main/ofl/geistmono); local `geistmono-OFL.txt`.
- Bebas Neue normal: weight 400. [Project and license](https://github.com/google/fonts/tree/main/ofl/bebasneue); local `bebasneue-OFL.txt`.

`styles/fonts.css` retains the upstream unicode ranges and character subsets, including Inter Greek. All faces use `font-display: swap`: a face arriving after the first document's short block period can still be used during the persistent shell session. This choice requires font/layout measurement; it does not establish visual acceptance.

SiteLayout preloads the Latin Inter body face alongside its existing brand Veneer face. Only the Releases index also preloads Geist Mono, for its first-screen catalog eyebrow. Other subsets and Bebas are discovered when their text is used. The standalone 404 preloads Latin Inter and Bebas (body/copy and error code); it does not preload unused Geist Mono or Veneer. Preload performance acceptance remains the three-run mobile A/B gate in OpenSpec.

Download source: [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap), with a Chrome WOFF2 user agent.

| File                          | Bytes | SHA-256                                                          | Official download                                                                   |
| ----------------------------- | ----: | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| bebas-neue-latin-ext.woff2    |  8928 | 16c95ce45a2922f52551d38d565d14c92cf257b8f219c89613407d81fdd21a39 | https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXoo9Wdhyzbi.woff2        |
| bebas-neue-latin.woff2        | 13768 | a7c90c89240c134f7fdd33d40c000ec90b79d675ea53e8cc5a6d423c073de412 | https://fonts.gstatic.com/s/bebasneue/v16/JTUSjIg69CK48gW7PXoo9Wlhyw.woff2          |
| geist-mono-cyrillic-ext.woff2 |  6176 | cd8800999070b729e1cc0bf7a48da6c3ac096a044251171b9a7574b56d96d4b4 | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrodmgPn.woff2         |
| geist-mono-cyrillic.woff2     | 12940 | 4866787fc952dbdbd591d6923d67bc21c2d894b93f34ab69d0cdf25d47bfb2df | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrMdmgPn.woff2         |
| geist-mono-symbols2.woff2     |  5812 | 5bb66d8319ba1602bb2eb67dce8d79c2b4687be8ce183a0574433e949b3c60ad | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFg08vz7ehw.woff2       |
| geist-mono-vietnamese.woff2   |  7696 | d39b60889a94a527a7f73c7988a2d6efb6c081614aef683b0b386c02d74c2175 | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrgdmgPn.woff2         |
| geist-mono-latin-ext.woff2    | 14696 | 1a189eb997c3e2ece68373e387afaec9e8617424186c4b1ab3cff7c54ba6223b | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrkdmgPn.woff2         |
| geist-mono-latin.woff2        | 23128 | 684ad5b531f81d43c1e8c7038262d5db7cdc1f68006e04d6c7769efa8d33c8cc | https://fonts.gstatic.com/s/geistmono/v6/or3nQ6H-1_WfwkMZI_qYFrcdmg.woff2           |
| inter-cyrillic-ext.woff2      | 25960 | ca157063339ac4ad418f214f3abfed119b0798ab4d377386ce5c9e5a7a435ebd | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2JL7SUc.woff2 |
| inter-cyrillic.woff2          | 18748 | 71d5ee93cc1e9f1d520a3a8b66456de18c7879d8df09d57fcd2eaff75fef0075 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa0ZL7SUc.woff2 |
| inter-greek-ext.woff2         | 11232 | 6e9e020a25f9b56d418f2c085b1d3c09725a4da23fe693a5b463064606732190 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7SUc.woff2 |
| inter-greek.woff2             | 18996 | 1be3448e292fbf05ffe176fe1e43f135013d50b1e7d324ad1a558f623d3bb6f6 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1pL7SUc.woff2 |
| inter-vietnamese.woff2        | 10252 | 5c66f9e07e90c6d4ac4922cc68d60de26c17b1858e677fb5e603fce3952b3ff2 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2pL7SUc.woff2 |
| inter-latin-ext.woff2         | 85068 | 34b9c504cab7a73e37b746343a449132e56cf7b5481af2cb81dc74dcff25c956 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa25L7SUc.woff2 |
| inter-latin.woff2             | 48256 | 3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62 | https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2    |
