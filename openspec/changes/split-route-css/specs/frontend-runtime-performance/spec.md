## ADDED Requirements

### Requirement: Render-blocking CSS is route-proportional

A public document SHALL block first render only on the shared stylesheet and the stylesheets owned by that route. Rules used only by another route or by a dormant surface SHALL NOT be in the render-blocking CSS of the document being loaded. The split SHALL ship only if it meets its measured byte gate without changing rendered appearance.

#### Scenario: Home loads

- **WHEN** Home completes its initial production load
- **THEN** its render-blocking CSS, measured as maximum-quality Brotli bytes of the emitted files, is at least 25% smaller than the `global.*.css` emitted from the change's recorded baseline commit
- **AND** Store collection, Store Item and checkout page rules are absent unless Home renders that markup
- **AND** rules for surfaces the shell can open on any route (detail overlays, Menu, cart drawer, player, gallery) remain available without a document navigation.

#### Scenario: Another route loads

- **WHEN** any public route completes its initial production load
- **THEN** the total size of its render-blocking CSS is no larger than the baseline `global.*.css` plus that route's baseline page CSS
- **AND** the build reports the render-blocking CSS bytes per route.

#### Scenario: Appearance is unchanged

- **WHEN** baseline and changed builds are captured at 390×844 and 1440×900 with reduced motion, on Home, Store, Store Distro, a Store Item, Releases, a Release, an Artist, News, About, Services and checkout
- **THEN** matched top and bottom viewport screenshots differ by 0 pixels after a same-build noise control also shows 0 pixels
- **AND** any differing frame is explained and accepted before release.

#### Scenario: The gate is missed

- **WHEN** the byte gate or the appearance check fails
- **THEN** the split does not ship
- **AND** the measured bytes and the blocking rules are recorded in the change.

#### Scenario: Load is compared

- **WHEN** baseline and changed builds are run with the `mobile-load` profile on Home and Store at least three times each
- **THEN** the report records commit, build, browser, settings and per-run FCP, LCP and CLS
- **AND** no load improvement is claimed from a difference within the runs' spread.
