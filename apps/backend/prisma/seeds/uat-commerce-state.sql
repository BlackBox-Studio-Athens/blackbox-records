-- Sandbox-only UAT commerce readiness seed generated from Astro store content.

-- This file contains no Stripe IDs or secrets; Price mappings and Store Offer snapshots are owned by catalog apply.

-- Cleanup for renamed sandbox-only identities from the pre-decoupling Barren Point / Disintegration catalog.
UPDATE "StoreItemOption"
SET "id" = 'store_item_option_disintegration_black_vinyl_lp',
    "sourceKind" = 'release',
    "sourceId" = 'disintegration',
    "variantId" = 'variant_disintegration-black-vinyl-lp_standard',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "storeItemSlug" = 'disintegration-black-vinyl-lp'
  AND "variantId" = 'variant_barren-point_standard';

DELETE FROM "StoreOfferSnapshot"
WHERE "storeItemSlug" = 'mass-culture-lp'
   OR "variantId" = 'variant_mass-culture-lp_standard'
   OR (
       "variantId" = 'variant_barren-point_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_barren-point_standard'
             AND current_store_item."storeItemSlug" = 'barren-point'
             AND current_store_item."sourceKind" = 'distro'
             AND current_store_item."sourceId" = 'barren-point'
       )
)
   OR (
       "variantId" = 'variant_disintegration-black-vinyl-lp_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_disintegration-black-vinyl-lp_standard'
             AND current_store_item."storeItemSlug" = 'disintegration-black-vinyl-lp'
             AND current_store_item."sourceKind" = 'release'
             AND current_store_item."sourceId" = 'disintegration'
       )
)
;

DELETE FROM "VariantStripeMapping"
WHERE "variantId" = 'variant_mass-culture-lp_standard'
   OR (
       "variantId" = 'variant_barren-point_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_barren-point_standard'
             AND current_store_item."storeItemSlug" = 'barren-point'
             AND current_store_item."sourceKind" = 'distro'
             AND current_store_item."sourceId" = 'barren-point'
       )
)
   OR (
       "variantId" = 'variant_disintegration-black-vinyl-lp_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_disintegration-black-vinyl-lp_standard'
             AND current_store_item."storeItemSlug" = 'disintegration-black-vinyl-lp'
             AND current_store_item."sourceKind" = 'release'
             AND current_store_item."sourceId" = 'disintegration'
       )
)
;

DELETE FROM "Stock"
WHERE "variantId" = 'variant_mass-culture-lp_standard'
   OR (
       "variantId" = 'variant_barren-point_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_barren-point_standard'
             AND current_store_item."storeItemSlug" = 'barren-point'
             AND current_store_item."sourceKind" = 'distro'
             AND current_store_item."sourceId" = 'barren-point'
       )
)
   OR (
       "variantId" = 'variant_disintegration-black-vinyl-lp_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_disintegration-black-vinyl-lp_standard'
             AND current_store_item."storeItemSlug" = 'disintegration-black-vinyl-lp'
             AND current_store_item."sourceKind" = 'release'
             AND current_store_item."sourceId" = 'disintegration'
       )
)
;

DELETE FROM "ItemAvailability"
WHERE "variantId" = 'variant_mass-culture-lp_standard'
   OR (
       "variantId" = 'variant_barren-point_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_barren-point_standard'
             AND current_store_item."storeItemSlug" = 'barren-point'
             AND current_store_item."sourceKind" = 'distro'
             AND current_store_item."sourceId" = 'barren-point'
       )
)
   OR (
       "variantId" = 'variant_disintegration-black-vinyl-lp_standard'
       AND NOT EXISTS (
           SELECT 1
           FROM "StoreItemOption" current_store_item
           WHERE current_store_item."variantId" = 'variant_disintegration-black-vinyl-lp_standard'
             AND current_store_item."storeItemSlug" = 'disintegration-black-vinyl-lp'
             AND current_store_item."sourceKind" = 'release'
             AND current_store_item."sourceId" = 'disintegration'
       )
)
;

DELETE FROM "StoreItemOption"
WHERE "storeItemSlug" = 'mass-culture-lp'
   OR "variantId" = 'variant_mass-culture-lp_standard';

INSERT INTO "StoreItemOption" (
    "id",
    "storeItemSlug",
    "sourceKind",
    "sourceId",
    "variantId",
    "createdAt",
    "updatedAt"
)
VALUES
    ('store_item_option_adolf_plays_the_jazz_form_follows_function_cd', 'adolf-plays-the-jazz-form-follows-function-cd', 'distro', 'adolf-plays-the-jazz-form-follows-function-cd', 'variant_adolf-plays-the-jazz-form-follows-function-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_aflmsmp_i_went_to_the_mountain_vinyl', 'aflmsmp-i-went-to-the-mountain-vinyl', 'distro', 'aflmsmp-i-went-to-the-mountain-vinyl', 'variant_aflmsmp-i-went-to-the-mountain-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_aftermaths', 'aftermaths', 'distro', 'aftermaths', 'variant_aftermaths_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_against_his_story_against_leviathan', 'against-his-story-against-leviathan', 'distro', 'against-his-story-against-leviathan', 'variant_against-his-story-against-leviathan_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_agia_monaxia_analekta_cd', 'agia-monaxia-analekta-cd', 'distro', 'agia-monaxia-analekta-cd', 'variant_agia-monaxia-analekta-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_allochiria_commotion_vinyl', 'allochiria-commotion-vinyl', 'distro', 'allochiria-commotion-vinyl', 'variant_allochiria-commotion-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_allochiria_omonoia_vinyl', 'allochiria-omonoia-vinyl', 'distro', 'allochiria-omonoia-vinyl', 'variant_allochiria-omonoia-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_allochiria_throes_vinyl', 'allochiria-throes-vinyl', 'distro', 'allochiria-throes-vinyl', 'variant_allochiria-throes-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anarchotribal_vinyl', 'anarchotribal-vinyl', 'release', 'anarchotribal', 'variant_anarchotribal-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_alone_cd', 'anima-triste-alone-cd', 'distro', 'anima-triste-alone-cd', 'variant_anima-triste-alone-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_anima_triste_cd', 'anima-triste-anima-triste-cd', 'distro', 'anima-triste-anima-triste-cd', 'variant_anima-triste-anima-triste-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_humanity_cd', 'anima-triste-humanity-cd', 'distro', 'anima-triste-humanity-cd', 'variant_anima-triste-humanity-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_atopia_atopia_cd', 'atopia-atopia-cd', 'distro', 'atopia-atopia-cd', 'variant_atopia-atopia-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_aufhebung_luchtbegrafenis_vinyl', 'aufhebung-luchtbegrafenis-vinyl', 'distro', 'aufhebung-luchtbegrafenis-vinyl', 'variant_aufhebung-luchtbegrafenis-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_band_in_the_pit_2016_cassette', 'band-in-the-pit-2016-cassette', 'distro', 'band-in-the-pit-2016-cassette', 'variant_band-in-the-pit-2016-cassette_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_barren_point', 'barren-point', 'distro', 'barren-point', 'variant_barren-point_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_big_fish', 'big-fish', 'distro', 'big-fish', 'variant_big-fish_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_bipolar_architecture_depressionland_vinyl', 'bipolar-architecture-depressionland-vinyl', 'distro', 'bipolar-architecture-depressionland-vinyl', 'variant_bipolar-architecture-depressionland-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_blame_the_trees_synapses_cd', 'blame-the-trees-synapses-cd', 'distro', 'blame-the-trees-synapses-cd', 'variant_blame-the-trees-synapses-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_bloed_tranen', 'bloed-tranen', 'distro', 'bloed-tranen', 'variant_bloed-tranen_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_broken_fingers_ego_cassette', 'broken-fingers-ego-cassette', 'distro', 'broken-fingers-ego-cassette', 'variant_broken-fingers-ego-cassette_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_calf_vinyl_10_inch', 'calf-vinyl-10-inch', 'distro', 'calf-vinyl-10-inch', 'variant_calf-vinyl-10-inch_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_caregivers_vinyl', 'caregivers-vinyl', 'distro', 'chronoboros-caregivers-vinyl', 'variant_caregivers-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_celuta_red_agia_monaxia_escape_the_blaze_only_to_find_another_vinyl', 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl', 'distro', 'celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl', 'variant_celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_celuta_red_amoeba_cd', 'celuta-red-amoeba-cd', 'distro', 'celuta-red-amoeba-cd', 'variant_celuta-red-amoeba-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_celuta_red_idle_frenzy_cd', 'celuta-red-idle-frenzy-cd', 'distro', 'celuta-red-idle-frenzy-cd', 'variant_celuta-red-idle-frenzy-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_cisnienie_angry_noises_vinyl', 'cisnienie-angry-noises-vinyl', 'distro', 'cisnienie-angry-noises-vinyl', 'variant_cisnienie-angry-noises-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_coyotes_arrow_medicine_vinyl', 'coyotes-arrow-medicine-vinyl', 'distro', 'coyotes-arrow-medicine-vinyl', 'variant_coyotes-arrow-medicine-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_crawl_eat_them_dead_or_alive_split_7', 'crawl-eat-them-dead-or-alive-split-7', 'distro', 'crawl-eat-them-dead-or-alive-split-7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dead_elephant_heavy_huge_and_rotten_cd', 'dead-elephant-heavy-huge-and-rotten-cd', 'distro', 'dead-elephant-heavy-huge-and-rotten-cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dead_flag_blues_traumatique_cd', 'dead-flag-blues-traumatique-cd', 'distro', 'dead-flag-blues-traumatique-cd', 'variant_dead-flag-blues-traumatique-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_deus_x_machina_time_expires_cd', 'deus-x-machina-time-expires-cd', 'distro', 'deus-x-machina-time-expires-cd', 'variant_deus-x-machina-time-expires-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_devided_light_will_shine_vinyl', 'devided-light-will-shine-vinyl', 'distro', 'devided-light-will-shine-vinyl', 'variant_devided-light-will-shine-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dirty_ol_dogs_dirty_ol_dogs_cd', 'dirty-ol-dogs-dirty-ol-dogs-cd', 'distro', 'dirty-ol-dogs-dirty-ol-dogs-cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_disintegration_black_vinyl_lp', 'disintegration-black-vinyl-lp', 'release', 'disintegration', 'variant_disintegration-black-vinyl-lp_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_endless_searcher', 'endless-searcher', 'distro', 'endless-searcher', 'variant_endless-searcher_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_frakhtal_plima_cd', 'frakhtal-plima-cd', 'distro', 'frakhtal-plima-cd', 'variant_frakhtal-plima-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_from_another_mother_atatoa_cd', 'from-another-mother-atatoa-cd', 'distro', 'from-another-mother-atatoa-cd', 'variant_from-another-mother-atatoa-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_from_another_mother_atatoa_vinyl', 'from-another-mother-atatoa-vinyl', 'distro', 'from-another-mother-atatoa-vinyl', 'variant_from-another-mother-atatoa-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_full_moon_bonzai_reshaping_the_symbols_cd', 'full-moon-bonzai-reshaping-the-symbols-cd', 'distro', 'full-moon-bonzai-reshaping-the-symbols-cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_granna_s_house_kuro_cd', 'granna-s-house-kuro-cd', 'distro', 'granna-s-house-kuro-cd', 'variant_granna-s-house-kuro-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_gun_fever_no_easy_way_vinyl', 'gun-fever-no-easy-way-vinyl', 'distro', 'gun-fever-no-easy-way-vinyl', 'variant_gun-fever-no-easy-way-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_hedvika_the_evidence_of_absence_cd', 'hedvika-the-evidence-of-absence-cd', 'distro', 'hedvika-the-evidence-of-absence-cd', 'variant_hedvika-the-evidence-of-absence-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_hey_stealthy_hey_stealthy_cd', 'hey-stealthy-hey-stealthy-cd', 'distro', 'hey-stealthy-hey-stealthy-cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_huracan_2025_ep_vinyl', 'huracan-2025-ep-vinyl', 'distro', 'huracan-2025-ep-vinyl', 'variant_huracan-2025-ep-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_in_your_absence', 'in-your-absence', 'distro', 'in-your-absence', 'variant_in-your-absence_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_kokomo_whip_vinyl', 'kokomo-whip-vinyl', 'distro', 'kokomo-whip-vinyl', 'variant_kokomo-whip-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_krav_boca_sanatorium_cd', 'krav-boca-sanatorium-cd', 'distro', 'krav-boca-sanatorium-cd', 'variant_krav-boca-sanatorium-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_living_under_drones_knot_on_knot_vinyl', 'living-under-drones-knot-on-knot-vinyl', 'distro', 'living-under-drones-knot-on-knot-vinyl', 'variant_living-under-drones-knot-on-knot-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_magic_sleazeball_corrida', 'magic-sleazeball-corrida', 'distro', 'magic-sleazeball-corrida', 'variant_magic-sleazeball-corrida_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_magmarus_cassette_sessions_cassette', 'magmarus-cassette-sessions-cassette', 'distro', 'magmarus-cassette-sessions-cassette', 'variant_magmarus-cassette-sessions-cassette_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_malammar_mazza_vinyl', 'malammar-mazza-vinyl', 'distro', 'malammar-mazza-vinyl', 'variant_malammar-mazza-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_malammar_vendetta_vinyl', 'malammar-vendetta-vinyl', 'distro', 'malammar-vendetta-vinyl', 'variant_malammar-vendetta-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_mammock_itch_vinyl', 'mammock-itch-vinyl', 'distro', 'mammock-itch-vinyl', 'variant_mammock-itch-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_maserati_live_at_dunk_fest_2024_vinyl', 'maserati-live-at-dunk-fest-2024-vinyl', 'distro', 'maserati-live-at-dunk-fest-2024-vinyl', 'variant_maserati-live-at-dunk-fest-2024-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_millions_of_dead_tourists_ygiis_cd', 'millions-of-dead-tourists-ygiis-cd', 'distro', 'millions-of-dead-tourists-ygiis-cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_mpugio_dirty_johnny_blues_ntertia_cd', 'mpugio-dirty-johnny-blues-ntertia-cd', 'distro', 'mpugio-dirty-johnny-blues-ntertia-cd', 'variant_mpugio-dirty-johnny-blues-ntertia-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_nausea_bomb_slap_punkabilly_cd', 'nausea-bomb-slap-punkabilly-cd', 'distro', 'nausea-bomb-slap-punkabilly-cd', 'variant_nausea-bomb-slap-punkabilly-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_noise_raid_cosmic_radiation_cd', 'noise-raid-cosmic-radiation-cd', 'distro', 'noise-raid-cosmic-radiation-cd', 'variant_noise-raid-cosmic-radiation-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_noise_without_decay', 'noise-without-decay', 'distro', 'noise-without-decay', 'variant_noise-without-decay_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_nothing_thrives_tales_of_disgrace_vinyl', 'nothing-thrives-tales-of-disgrace-vinyl', 'distro', 'nothing-thrives-tales-of-disgrace-vinyl', 'variant_nothing-thrives-tales-of-disgrace-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_nyos_navigation_cd', 'nyos-navigation-cd', 'distro', 'nyos-navigation-cd', 'variant_nyos-navigation-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_okwaho_okwaho_cd', 'okwaho-okwaho-cd', 'distro', 'okwaho-okwaho-cd', 'variant_okwaho-okwaho-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_olaf_olafsonn_and_the_big_bad_trip_chakra_meditations_vinyl', 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl', 'distro', 'olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl', 'variant_olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_on_the_quiet', 'on-the-quiet', 'distro', 'on-the-quiet', 'variant_on-the-quiet_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_one_leg_mary_i_a_seawolf_a_madman_cd', 'one-leg-mary-i-a-seawolf-a-madman-cd', 'distro', 'one-leg-mary-i-a-seawolf-a-madman-cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_one_leg_mary_on_the_quiet_cd', 'one-leg-mary-on-the-quiet-cd', 'distro', 'one-leg-mary-on-the-quiet-cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_onrust_van_woede_tot_wanhoop_vinyl', 'onrust-van-woede-tot-wanhoop-vinyl', 'distro', 'onrust-van-woede-tot-wanhoop-vinyl', 'variant_onrust-van-woede-tot-wanhoop-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_pelican_live_at_dunk_fest_2016_vinyl', 'pelican-live-at-dunk-fest-2016-vinyl', 'distro', 'pelican-live-at-dunk-fest-2016-vinyl', 'variant_pelican-live-at-dunk-fest-2016-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_pirate_city_fortunate_isles_vinyl', 'pirate-city-fortunate-isles-vinyl', 'distro', 'pirate-city-fortunate-isles-vinyl', 'variant_pirate-city-fortunate-isles-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_pirate_city_lovi_vinyl', 'pirate-city-lovi-vinyl', 'distro', 'pirate-city-lovi-vinyl', 'variant_pirate-city-lovi-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_pirate_city_piratia_vinyl', 'pirate-city-piratia-vinyl', 'distro', 'pirate-city-piratia-vinyl', 'variant_pirate-city-piratia-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_primal_ephemeral', 'primal-ephemeral', 'distro', 'primal-ephemeral', 'variant_primal-ephemeral_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_puta_volcano_represent_victory_below_eye_cd', 'puta-volcano-represent-victory-below-eye-cd', 'distro', 'puta-volcano-represent-victory-below-eye-cd', 'variant_puta-volcano-represent-victory-below-eye-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_rise_of_the_black_fang', 'rise-of-the-black-fang', 'distro', 'rise-of-the-black-fang', 'variant_rise-of-the-black-fang_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_rite', 'rite', 'distro', 'rite', 'variant_rite_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_russian_circles_live_at_dunk_fest_2016_vinyl', 'russian-circles-live-at-dunk-fest-2016-vinyl', 'distro', 'russian-circles-live-at-dunk-fest-2016-vinyl', 'variant_russian-circles-live-at-dunk-fest-2016-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_sadhus_the_big_fish_cd', 'sadhus-the-big-fish-cd', 'distro', 'sadhus-the-big-fish-cd', 'variant_sadhus-the-big-fish-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_salto_mortale_ateles_to_on_cd', 'salto-mortale-ateles-to-on-cd', 'distro', 'salto-mortale-ateles-to-on-cd', 'variant_salto-mortale-ateles-to-on-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_selenopolis', 'selenopolis', 'distro', 'selenopolis', 'variant_selenopolis_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_spinners', 'spinners', 'distro', 'spinners', 'variant_spinners_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_steelwitch', 'steelwitch', 'distro', 'steelwitch', 'variant_steelwitch_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_stefan_clor_baltica_cd', 'stefan-clor-baltica-cd', 'distro', 'stefan-clor-baltica-cd', 'variant_stefan-clor-baltica-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'sun-of-nothing-the-guilt-of-feeling-alive-cd', 'distro', 'sun-of-nothing-the-guilt-of-feeling-alive-cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_chemical_bath', 'the-chemical-bath', 'distro', 'the-chemical-bath', 'variant_the-chemical-bath_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_curf_death_and_love_cd', 'the-curf-death-and-love-cd', 'distro', 'the-curf-death-and-love-cd', 'variant_the-curf-death-and-love-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_curf_i_cd', 'the-curf-i-cd', 'distro', 'the-curf-i-cd', 'variant_the-curf-i-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_earthbound_la_guerra_final_cd', 'the-earthbound-la-guerra-final-cd', 'distro', 'the-earthbound-la-guerra-final-cd', 'variant_the-earthbound-la-guerra-final-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_feathers_of_oblivion', 'the-feathers-of-oblivion', 'distro', 'the-feathers-of-oblivion', 'variant_the-feathers-of-oblivion_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_last_second', 'the-last-second', 'distro', 'the-last-second', 'variant_the-last-second_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_vagina_lips_random_tapes_cassette', 'the-vagina-lips-random-tapes-cassette', 'distro', 'the-vagina-lips-random-tapes-cassette', 'variant_the-vagina-lips-random-tapes-cassette_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_three_way_plane_your_kingdom_my_life_cd', 'three-way-plane-your-kingdom-my-life-cd', 'distro', 'three-way-plane-your-kingdom-my-life-cd', 'variant_three-way-plane-your-kingdom-my-life-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_three_way_plane_your_kingdom_my_life_vinyl', 'three-way-plane-your-kingdom-my-life-vinyl', 'distro', 'three-way-plane-your-kingdom-my-life-vinyl', 'variant_three-way-plane-your-kingdom-my-life-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_toundra_iv_cd', 'toundra-iv-cd', 'distro', 'toundra-iv-cd', 'variant_toundra-iv-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_transatlantic_transiberian', 'transatlantic-transiberian', 'distro', 'transatlantic-transiberian', 'variant_transatlantic-transiberian_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_turpentine_valley_veuel_vinyl', 'turpentine-valley-veuel-vinyl', 'distro', 'turpentine-valley-veuel-vinyl', 'variant_turpentine-valley-veuel-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_ukryte_zalety_systemu_s_t_cd', 'ukryte-zalety-systemu-s-t-cd', 'distro', 'ukryte-zalety-systemu-s-t-cd', 'variant_ukryte-zalety-systemu-s-t-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_unkraut', 'unkraut', 'distro', 'unkraut', 'variant_unkraut_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_unshaped_ahead_8_cantons_vinyl', 'unshaped-ahead-8-cantons-vinyl', 'distro', 'unshaped-ahead-8-cantons-vinyl', 'variant_unshaped-ahead-8-cantons-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_voyage_voyage', 'voyage-voyage', 'distro', 'voyage-voyage', 'variant_voyage-voyage_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_we_lost_the_sea_a_single_flower_vinyl', 'we-lost-the-sea-a-single-flower-vinyl', 'distro', 'we-lost-the-sea-a-single-flower-vinyl', 'variant_we-lost-the-sea-a-single-flower-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_we_lost_the_sea_departure_songs_vinyl', 'we-lost-the-sea-departure-songs-vinyl', 'distro', 'we-lost-the-sea-departure-songs-vinyl', 'variant_we-lost-the-sea-departure-songs-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_we_lost_the_sea_triumph_disaster_vinyl', 'we-lost-the-sea-triumph-disaster-vinyl', 'distro', 'we-lost-the-sea-triumph-disaster-vinyl', 'variant_we-lost-the-sea-triumph-disaster-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_wreckquiem', 'wreckquiem', 'distro', 'wreckquiem', 'variant_wreckquiem_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("storeItemSlug") DO UPDATE SET
    "sourceKind" = excluded."sourceKind",
    "sourceId" = excluded."sourceId",
    "variantId" = excluded."variantId",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ItemAvailability" (
    "id",
    "variantId",
    "status",
    "canBuy",
    "updatedAt"
)
VALUES
    ('item_availability_adolf_plays_the_jazz_form_follows_function_cd', 'variant_adolf-plays-the-jazz-form-follows-function-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_aflmsmp_i_went_to_the_mountain_vinyl', 'variant_aflmsmp-i-went-to-the-mountain-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_aftermaths', 'variant_aftermaths_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_against_his_story_against_leviathan', 'variant_against-his-story-against-leviathan_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_agia_monaxia_analekta_cd', 'variant_agia-monaxia-analekta-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_allochiria_commotion_vinyl', 'variant_allochiria-commotion-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_allochiria_omonoia_vinyl', 'variant_allochiria-omonoia-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_allochiria_throes_vinyl', 'variant_allochiria-throes-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anarchotribal_vinyl', 'variant_anarchotribal-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_alone_cd', 'variant_anima-triste-alone-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_anima_triste_cd', 'variant_anima-triste-anima-triste-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_humanity_cd', 'variant_anima-triste-humanity-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_atopia_atopia_cd', 'variant_atopia-atopia-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_aufhebung_luchtbegrafenis_vinyl', 'variant_aufhebung-luchtbegrafenis-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_band_in_the_pit_2016_cassette', 'variant_band-in-the-pit-2016-cassette_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_barren_point', 'variant_barren-point_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_big_fish', 'variant_big-fish_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_bipolar_architecture_depressionland_vinyl', 'variant_bipolar-architecture-depressionland-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_blame_the_trees_synapses_cd', 'variant_blame-the-trees-synapses-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_bloed_tranen', 'variant_bloed-tranen_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_broken_fingers_ego_cassette', 'variant_broken-fingers-ego-cassette_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_calf_vinyl_10_inch', 'variant_calf-vinyl-10-inch_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_caregivers_vinyl', 'variant_caregivers-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_celuta_red_agia_monaxia_escape_the_blaze_only_to_find_another_vinyl', 'variant_celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_celuta_red_amoeba_cd', 'variant_celuta-red-amoeba-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_celuta_red_idle_frenzy_cd', 'variant_celuta-red-idle-frenzy-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_cisnienie_angry_noises_vinyl', 'variant_cisnienie-angry-noises-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_coyotes_arrow_medicine_vinyl', 'variant_coyotes-arrow-medicine-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_crawl_eat_them_dead_or_alive_split_7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dead_elephant_heavy_huge_and_rotten_cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dead_flag_blues_traumatique_cd', 'variant_dead-flag-blues-traumatique-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_deus_x_machina_time_expires_cd', 'variant_deus-x-machina-time-expires-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_devided_light_will_shine_vinyl', 'variant_devided-light-will-shine-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dirty_ol_dogs_dirty_ol_dogs_cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_endless_searcher', 'variant_endless-searcher_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_frakhtal_plima_cd', 'variant_frakhtal-plima-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_from_another_mother_atatoa_cd', 'variant_from-another-mother-atatoa-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_from_another_mother_atatoa_vinyl', 'variant_from-another-mother-atatoa-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_full_moon_bonzai_reshaping_the_symbols_cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_granna_s_house_kuro_cd', 'variant_granna-s-house-kuro-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_gun_fever_no_easy_way_vinyl', 'variant_gun-fever-no-easy-way-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_hedvika_the_evidence_of_absence_cd', 'variant_hedvika-the-evidence-of-absence-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_hey_stealthy_hey_stealthy_cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_huracan_2025_ep_vinyl', 'variant_huracan-2025-ep-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_in_your_absence', 'variant_in-your-absence_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_kokomo_whip_vinyl', 'variant_kokomo-whip-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_krav_boca_sanatorium_cd', 'variant_krav-boca-sanatorium-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_living_under_drones_knot_on_knot_vinyl', 'variant_living-under-drones-knot-on-knot-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_magic_sleazeball_corrida', 'variant_magic-sleazeball-corrida_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_magmarus_cassette_sessions_cassette', 'variant_magmarus-cassette-sessions-cassette_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_malammar_mazza_vinyl', 'variant_malammar-mazza-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_malammar_vendetta_vinyl', 'variant_malammar-vendetta-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_mammock_itch_vinyl', 'variant_mammock-itch-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_maserati_live_at_dunk_fest_2024_vinyl', 'variant_maserati-live-at-dunk-fest-2024-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_millions_of_dead_tourists_ygiis_cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_mpugio_dirty_johnny_blues_ntertia_cd', 'variant_mpugio-dirty-johnny-blues-ntertia-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_nausea_bomb_slap_punkabilly_cd', 'variant_nausea-bomb-slap-punkabilly-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_noise_raid_cosmic_radiation_cd', 'variant_noise-raid-cosmic-radiation-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_noise_without_decay', 'variant_noise-without-decay_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_nothing_thrives_tales_of_disgrace_vinyl', 'variant_nothing-thrives-tales-of-disgrace-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_nyos_navigation_cd', 'variant_nyos-navigation-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_okwaho_okwaho_cd', 'variant_okwaho-okwaho-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_olaf_olafsonn_and_the_big_bad_trip_chakra_meditations_vinyl', 'variant_olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_on_the_quiet', 'variant_on-the-quiet_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_one_leg_mary_i_a_seawolf_a_madman_cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_one_leg_mary_on_the_quiet_cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_onrust_van_woede_tot_wanhoop_vinyl', 'variant_onrust-van-woede-tot-wanhoop-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_pelican_live_at_dunk_fest_2016_vinyl', 'variant_pelican-live-at-dunk-fest-2016-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_pirate_city_fortunate_isles_vinyl', 'variant_pirate-city-fortunate-isles-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_pirate_city_lovi_vinyl', 'variant_pirate-city-lovi-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_pirate_city_piratia_vinyl', 'variant_pirate-city-piratia-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_primal_ephemeral', 'variant_primal-ephemeral_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_puta_volcano_represent_victory_below_eye_cd', 'variant_puta-volcano-represent-victory-below-eye-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_rise_of_the_black_fang', 'variant_rise-of-the-black-fang_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_rite', 'variant_rite_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_russian_circles_live_at_dunk_fest_2016_vinyl', 'variant_russian-circles-live-at-dunk-fest-2016-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_sadhus_the_big_fish_cd', 'variant_sadhus-the-big-fish-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_salto_mortale_ateles_to_on_cd', 'variant_salto-mortale-ateles-to-on-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_selenopolis', 'variant_selenopolis_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_spinners', 'variant_spinners_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_steelwitch', 'variant_steelwitch_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_stefan_clor_baltica_cd', 'variant_stefan-clor-baltica-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_chemical_bath', 'variant_the-chemical-bath_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_curf_death_and_love_cd', 'variant_the-curf-death-and-love-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_curf_i_cd', 'variant_the-curf-i-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_earthbound_la_guerra_final_cd', 'variant_the-earthbound-la-guerra-final-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_feathers_of_oblivion', 'variant_the-feathers-of-oblivion_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_last_second', 'variant_the-last-second_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_vagina_lips_random_tapes_cassette', 'variant_the-vagina-lips-random-tapes-cassette_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_three_way_plane_your_kingdom_my_life_cd', 'variant_three-way-plane-your-kingdom-my-life-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_three_way_plane_your_kingdom_my_life_vinyl', 'variant_three-way-plane-your-kingdom-my-life-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_toundra_iv_cd', 'variant_toundra-iv-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_transatlantic_transiberian', 'variant_transatlantic-transiberian_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_turpentine_valley_veuel_vinyl', 'variant_turpentine-valley-veuel-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_ukryte_zalety_systemu_s_t_cd', 'variant_ukryte-zalety-systemu-s-t-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_unkraut', 'variant_unkraut_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_unshaped_ahead_8_cantons_vinyl', 'variant_unshaped-ahead-8-cantons-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_voyage_voyage', 'variant_voyage-voyage_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_we_lost_the_sea_a_single_flower_vinyl', 'variant_we-lost-the-sea-a-single-flower-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_we_lost_the_sea_departure_songs_vinyl', 'variant_we-lost-the-sea-departure-songs-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_we_lost_the_sea_triumph_disaster_vinyl', 'variant_we-lost-the-sea-triumph-disaster-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_wreckquiem', 'variant_wreckquiem_standard', 'available', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT("variantId") DO UPDATE SET
    "status" = excluded."status",
    "canBuy" = excluded."canBuy",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "Stock" (
    "id",
    "variantId",
    "quantity",
    "onlineQuantity",
    "createdAt",
    "updatedAt"
)
VALUES
    ('stock_adolf_plays_the_jazz_form_follows_function_cd', 'variant_adolf-plays-the-jazz-form-follows-function-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_aflmsmp_i_went_to_the_mountain_vinyl', 'variant_aflmsmp-i-went-to-the-mountain-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_aftermaths', 'variant_aftermaths_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_against_his_story_against_leviathan', 'variant_against-his-story-against-leviathan_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_agia_monaxia_analekta_cd', 'variant_agia-monaxia-analekta-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_allochiria_commotion_vinyl', 'variant_allochiria-commotion-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_allochiria_omonoia_vinyl', 'variant_allochiria-omonoia-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_allochiria_throes_vinyl', 'variant_allochiria-throes-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anarchotribal_vinyl', 'variant_anarchotribal-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_alone_cd', 'variant_anima-triste-alone-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_anima_triste_cd', 'variant_anima-triste-anima-triste-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_humanity_cd', 'variant_anima-triste-humanity-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_atopia_atopia_cd', 'variant_atopia-atopia-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_aufhebung_luchtbegrafenis_vinyl', 'variant_aufhebung-luchtbegrafenis-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_band_in_the_pit_2016_cassette', 'variant_band-in-the-pit-2016-cassette_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_barren_point', 'variant_barren-point_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_big_fish', 'variant_big-fish_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_bipolar_architecture_depressionland_vinyl', 'variant_bipolar-architecture-depressionland-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_blame_the_trees_synapses_cd', 'variant_blame-the-trees-synapses-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_bloed_tranen', 'variant_bloed-tranen_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_broken_fingers_ego_cassette', 'variant_broken-fingers-ego-cassette_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_calf_vinyl_10_inch', 'variant_calf-vinyl-10-inch_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_caregivers_vinyl', 'variant_caregivers-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_celuta_red_agia_monaxia_escape_the_blaze_only_to_find_another_vinyl', 'variant_celuta-red-agia-monaxia-escape-the-blaze-only-to-find-another-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_celuta_red_amoeba_cd', 'variant_celuta-red-amoeba-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_celuta_red_idle_frenzy_cd', 'variant_celuta-red-idle-frenzy-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_cisnienie_angry_noises_vinyl', 'variant_cisnienie-angry-noises-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_coyotes_arrow_medicine_vinyl', 'variant_coyotes-arrow-medicine-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_crawl_eat_them_dead_or_alive_split_7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dead_elephant_heavy_huge_and_rotten_cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dead_flag_blues_traumatique_cd', 'variant_dead-flag-blues-traumatique-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_deus_x_machina_time_expires_cd', 'variant_deus-x-machina-time-expires-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_devided_light_will_shine_vinyl', 'variant_devided-light-will-shine-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dirty_ol_dogs_dirty_ol_dogs_cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_endless_searcher', 'variant_endless-searcher_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_frakhtal_plima_cd', 'variant_frakhtal-plima-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_from_another_mother_atatoa_cd', 'variant_from-another-mother-atatoa-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_from_another_mother_atatoa_vinyl', 'variant_from-another-mother-atatoa-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_full_moon_bonzai_reshaping_the_symbols_cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_granna_s_house_kuro_cd', 'variant_granna-s-house-kuro-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_gun_fever_no_easy_way_vinyl', 'variant_gun-fever-no-easy-way-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_hedvika_the_evidence_of_absence_cd', 'variant_hedvika-the-evidence-of-absence-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_hey_stealthy_hey_stealthy_cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_huracan_2025_ep_vinyl', 'variant_huracan-2025-ep-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_in_your_absence', 'variant_in-your-absence_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_kokomo_whip_vinyl', 'variant_kokomo-whip-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_krav_boca_sanatorium_cd', 'variant_krav-boca-sanatorium-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_living_under_drones_knot_on_knot_vinyl', 'variant_living-under-drones-knot-on-knot-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_magic_sleazeball_corrida', 'variant_magic-sleazeball-corrida_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_magmarus_cassette_sessions_cassette', 'variant_magmarus-cassette-sessions-cassette_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_malammar_mazza_vinyl', 'variant_malammar-mazza-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_malammar_vendetta_vinyl', 'variant_malammar-vendetta-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_mammock_itch_vinyl', 'variant_mammock-itch-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_maserati_live_at_dunk_fest_2024_vinyl', 'variant_maserati-live-at-dunk-fest-2024-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_millions_of_dead_tourists_ygiis_cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_mpugio_dirty_johnny_blues_ntertia_cd', 'variant_mpugio-dirty-johnny-blues-ntertia-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_nausea_bomb_slap_punkabilly_cd', 'variant_nausea-bomb-slap-punkabilly-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_noise_raid_cosmic_radiation_cd', 'variant_noise-raid-cosmic-radiation-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_noise_without_decay', 'variant_noise-without-decay_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_nothing_thrives_tales_of_disgrace_vinyl', 'variant_nothing-thrives-tales-of-disgrace-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_nyos_navigation_cd', 'variant_nyos-navigation-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_okwaho_okwaho_cd', 'variant_okwaho-okwaho-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_olaf_olafsonn_and_the_big_bad_trip_chakra_meditations_vinyl', 'variant_olaf-olafsonn-and-the-big-bad-trip-chakra-meditations-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_on_the_quiet', 'variant_on-the-quiet_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_one_leg_mary_i_a_seawolf_a_madman_cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_one_leg_mary_on_the_quiet_cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_onrust_van_woede_tot_wanhoop_vinyl', 'variant_onrust-van-woede-tot-wanhoop-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_pelican_live_at_dunk_fest_2016_vinyl', 'variant_pelican-live-at-dunk-fest-2016-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_pirate_city_fortunate_isles_vinyl', 'variant_pirate-city-fortunate-isles-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_pirate_city_lovi_vinyl', 'variant_pirate-city-lovi-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_pirate_city_piratia_vinyl', 'variant_pirate-city-piratia-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_primal_ephemeral', 'variant_primal-ephemeral_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_puta_volcano_represent_victory_below_eye_cd', 'variant_puta-volcano-represent-victory-below-eye-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_rise_of_the_black_fang', 'variant_rise-of-the-black-fang_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_rite', 'variant_rite_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_russian_circles_live_at_dunk_fest_2016_vinyl', 'variant_russian-circles-live-at-dunk-fest-2016-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_sadhus_the_big_fish_cd', 'variant_sadhus-the-big-fish-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_salto_mortale_ateles_to_on_cd', 'variant_salto-mortale-ateles-to-on-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_selenopolis', 'variant_selenopolis_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_spinners', 'variant_spinners_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_steelwitch', 'variant_steelwitch_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_stefan_clor_baltica_cd', 'variant_stefan-clor-baltica-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_chemical_bath', 'variant_the-chemical-bath_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_curf_death_and_love_cd', 'variant_the-curf-death-and-love-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_curf_i_cd', 'variant_the-curf-i-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_earthbound_la_guerra_final_cd', 'variant_the-earthbound-la-guerra-final-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_feathers_of_oblivion', 'variant_the-feathers-of-oblivion_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_last_second', 'variant_the-last-second_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_vagina_lips_random_tapes_cassette', 'variant_the-vagina-lips-random-tapes-cassette_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_three_way_plane_your_kingdom_my_life_cd', 'variant_three-way-plane-your-kingdom-my-life-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_three_way_plane_your_kingdom_my_life_vinyl', 'variant_three-way-plane-your-kingdom-my-life-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_toundra_iv_cd', 'variant_toundra-iv-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_transatlantic_transiberian', 'variant_transatlantic-transiberian_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_turpentine_valley_veuel_vinyl', 'variant_turpentine-valley-veuel-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_ukryte_zalety_systemu_s_t_cd', 'variant_ukryte-zalety-systemu-s-t-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_unkraut', 'variant_unkraut_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_unshaped_ahead_8_cantons_vinyl', 'variant_unshaped-ahead-8-cantons-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_voyage_voyage', 'variant_voyage-voyage_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_we_lost_the_sea_a_single_flower_vinyl', 'variant_we-lost-the-sea-a-single-flower-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_we_lost_the_sea_departure_songs_vinyl', 'variant_we-lost-the-sea-departure-songs-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_we_lost_the_sea_triumph_disaster_vinyl', 'variant_we-lost-the-sea-triumph-disaster-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_wreckquiem', 'variant_wreckquiem_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("variantId") DO UPDATE SET
    "quantity" = excluded."quantity",
    "onlineQuantity" = excluded."onlineQuantity",
    "updatedAt" = CURRENT_TIMESTAMP;

