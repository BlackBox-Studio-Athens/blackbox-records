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
   OR "variantId" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');

DELETE FROM "VariantStripeMapping"
WHERE "variantId" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');

DELETE FROM "Stock"
WHERE "variantId" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');

DELETE FROM "ItemAvailability"
WHERE "variantId" IN ('variant_mass-culture-lp_standard', 'variant_barren-point_standard', 'variant_disintegration-black-vinyl-lp_standard');

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
    ('store_item_option_afterglow_tape', 'afterglow-tape', 'distro', 'afterglow-tape', 'variant_afterglow-tape_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_aftermaths', 'aftermaths', 'distro', 'aftermaths', 'variant_aftermaths_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_against_his_story_against_leviathan', 'against-his-story-against-leviathan', 'distro', 'against-his-story-against-leviathan', 'variant_against-his-story-against-leviathan_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anarchotribal_vinyl', 'anarchotribal-vinyl', 'release', 'anarchotribal', 'variant_anarchotribal-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_alone_cd', 'anima-triste-alone-cd', 'distro', 'anima-triste-alone-cd', 'variant_anima-triste-alone-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_anima_triste_cd', 'anima-triste-anima-triste-cd', 'distro', 'anima-triste-anima-triste-cd', 'variant_anima-triste-anima-triste-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_anima_triste_humanity_cd', 'anima-triste-humanity-cd', 'distro', 'anima-triste-humanity-cd', 'variant_anima-triste-humanity-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_atopia_atopia_cd', 'atopia-atopia-cd', 'distro', 'atopia-atopia-cd', 'variant_atopia-atopia-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_barren_point', 'barren-point', 'distro', 'barren-point', 'variant_barren-point_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_big_fish', 'big-fish', 'distro', 'big-fish', 'variant_big-fish_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_bloed_tranen', 'bloed-tranen', 'distro', 'bloed-tranen', 'variant_bloed-tranen_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_caregivers_vinyl', 'caregivers-vinyl', 'release', 'caregivers', 'variant_caregivers-vinyl_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_crawl_eat_them_dead_or_alive_split_7', 'crawl-eat-them-dead-or-alive-split-7', 'distro', 'crawl-eat-them-dead-or-alive-split-7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dead_elephant_heavy_huge_and_rotten_cd', 'dead-elephant-heavy-huge-and-rotten-cd', 'distro', 'dead-elephant-heavy-huge-and-rotten-cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dead_flag_blues_traumatique_cd', 'dead-flag-blues-traumatique-cd', 'distro', 'dead-flag-blues-traumatique-cd', 'variant_dead-flag-blues-traumatique-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_dirty_ol_dogs_dirty_ol_dogs_cd', 'dirty-ol-dogs-dirty-ol-dogs-cd', 'distro', 'dirty-ol-dogs-dirty-ol-dogs-cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_disintegration_black_vinyl_lp', 'disintegration-black-vinyl-lp', 'release', 'disintegration', 'variant_disintegration-black-vinyl-lp_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_endless_searcher', 'endless-searcher', 'distro', 'endless-searcher', 'variant_endless-searcher_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_frakhtal_plima_cd', 'frakhtal-plima-cd', 'distro', 'frakhtal-plima-cd', 'variant_frakhtal-plima-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_full_moon_bonzai_reshaping_the_symbols_cd', 'full-moon-bonzai-reshaping-the-symbols-cd', 'distro', 'full-moon-bonzai-reshaping-the-symbols-cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_granna_s_house_kuro_cd', 'granna-s-house-kuro-cd', 'distro', 'granna-s-house-kuro-cd', 'variant_granna-s-house-kuro-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_hey_stealthy_hey_stealthy_cd', 'hey-stealthy-hey-stealthy-cd', 'distro', 'hey-stealthy-hey-stealthy-cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_in_your_absence', 'in-your-absence', 'distro', 'in-your-absence', 'variant_in-your-absence_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_magic_sleazeball_corrida', 'magic-sleazeball-corrida', 'distro', 'magic-sleazeball-corrida', 'variant_magic-sleazeball-corrida_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_millions_of_dead_tourists_ygiis_cd', 'millions-of-dead-tourists-ygiis-cd', 'distro', 'millions-of-dead-tourists-ygiis-cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_noise_without_decay', 'noise-without-decay', 'distro', 'noise-without-decay', 'variant_noise-without-decay_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_on_the_quiet', 'on-the-quiet', 'distro', 'on-the-quiet', 'variant_on-the-quiet_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_one_leg_mary_i_a_seawolf_a_madman_cd', 'one-leg-mary-i-a-seawolf-a-madman-cd', 'distro', 'one-leg-mary-i-a-seawolf-a-madman-cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_one_leg_mary_on_the_quiet_cd', 'one-leg-mary-on-the-quiet-cd', 'distro', 'one-leg-mary-on-the-quiet-cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_primal_ephemeral', 'primal-ephemeral', 'distro', 'primal-ephemeral', 'variant_primal-ephemeral_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_rehearsal_room_tee', 'rehearsal-room-tee', 'distro', 'rehearsal-room-tee', 'variant_rehearsal-room-tee_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_rise_of_the_black_fang', 'rise-of-the-black-fang', 'distro', 'rise-of-the-black-fang', 'variant_rise-of-the-black-fang_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_rite', 'rite', 'distro', 'rite', 'variant_rite_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_sadhus_the_big_fish_cd', 'sadhus-the-big-fish-cd', 'distro', 'sadhus-the-big-fish-cd', 'variant_sadhus-the-big-fish-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_selenopolis', 'selenopolis', 'distro', 'selenopolis', 'variant_selenopolis_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_spinners', 'spinners', 'distro', 'spinners', 'variant_spinners_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_steelwitch', 'steelwitch', 'distro', 'steelwitch', 'variant_steelwitch_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_stefan_clor_baltica_cd', 'stefan-clor-baltica-cd', 'distro', 'stefan-clor-baltica-cd', 'variant_stefan-clor-baltica-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'sun-of-nothing-the-guilt-of-feeling-alive-cd', 'distro', 'sun-of-nothing-the-guilt-of-feeling-alive-cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_chemical_bath', 'the-chemical-bath', 'distro', 'the-chemical-bath', 'variant_the-chemical-bath_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_feathers_of_oblivion', 'the-feathers-of-oblivion', 'distro', 'the-feathers-of-oblivion', 'variant_the-feathers-of-oblivion_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_the_last_second', 'the-last-second', 'distro', 'the-last-second', 'variant_the-last-second_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_transatlantic_transiberian', 'transatlantic-transiberian', 'distro', 'transatlantic-transiberian', 'variant_transatlantic-transiberian_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_unkraut', 'unkraut', 'distro', 'unkraut', 'variant_unkraut_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('store_item_option_voyage_voyage', 'voyage-voyage', 'distro', 'voyage-voyage', 'variant_voyage-voyage_standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
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
    ('item_availability_afterglow_tape', 'variant_afterglow-tape_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_aftermaths', 'variant_aftermaths_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_against_his_story_against_leviathan', 'variant_against-his-story-against-leviathan_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anarchotribal_vinyl', 'variant_anarchotribal-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_alone_cd', 'variant_anima-triste-alone-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_anima_triste_cd', 'variant_anima-triste-anima-triste-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_anima_triste_humanity_cd', 'variant_anima-triste-humanity-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_atopia_atopia_cd', 'variant_atopia-atopia-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_barren_point', 'variant_barren-point_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_big_fish', 'variant_big-fish_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_bloed_tranen', 'variant_bloed-tranen_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_caregivers_vinyl', 'variant_caregivers-vinyl_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_crawl_eat_them_dead_or_alive_split_7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dead_elephant_heavy_huge_and_rotten_cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dead_flag_blues_traumatique_cd', 'variant_dead-flag-blues-traumatique-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_dirty_ol_dogs_dirty_ol_dogs_cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_endless_searcher', 'variant_endless-searcher_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_frakhtal_plima_cd', 'variant_frakhtal-plima-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_full_moon_bonzai_reshaping_the_symbols_cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_granna_s_house_kuro_cd', 'variant_granna-s-house-kuro-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_hey_stealthy_hey_stealthy_cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_in_your_absence', 'variant_in-your-absence_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_magic_sleazeball_corrida', 'variant_magic-sleazeball-corrida_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_millions_of_dead_tourists_ygiis_cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_noise_without_decay', 'variant_noise-without-decay_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_on_the_quiet', 'variant_on-the-quiet_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_one_leg_mary_i_a_seawolf_a_madman_cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_one_leg_mary_on_the_quiet_cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_primal_ephemeral', 'variant_primal-ephemeral_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_rehearsal_room_tee', 'variant_rehearsal-room-tee_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_rise_of_the_black_fang', 'variant_rise-of-the-black-fang_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_rite', 'variant_rite_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_sadhus_the_big_fish_cd', 'variant_sadhus-the-big-fish-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_selenopolis', 'variant_selenopolis_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_spinners', 'variant_spinners_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_steelwitch', 'variant_steelwitch_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_stefan_clor_baltica_cd', 'variant_stefan-clor-baltica-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_chemical_bath', 'variant_the-chemical-bath_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_feathers_of_oblivion', 'variant_the-feathers-of-oblivion_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_the_last_second', 'variant_the-last-second_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_transatlantic_transiberian', 'variant_transatlantic-transiberian_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_unkraut', 'variant_unkraut_standard', 'available', TRUE, CURRENT_TIMESTAMP),
    ('item_availability_voyage_voyage', 'variant_voyage-voyage_standard', 'available', TRUE, CURRENT_TIMESTAMP),
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
    ('stock_afterglow_tape', 'variant_afterglow-tape_standard', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_aftermaths', 'variant_aftermaths_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_against_his_story_against_leviathan', 'variant_against-his-story-against-leviathan_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anarchotribal_vinyl', 'variant_anarchotribal-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_alone_cd', 'variant_anima-triste-alone-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_anima_triste_cd', 'variant_anima-triste-anima-triste-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_anima_triste_humanity_cd', 'variant_anima-triste-humanity-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_atopia_atopia_cd', 'variant_atopia-atopia-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_barren_point', 'variant_barren-point_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_big_fish', 'variant_big-fish_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_bloed_tranen', 'variant_bloed-tranen_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_caregivers_vinyl', 'variant_caregivers-vinyl_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_crawl_eat_them_dead_or_alive_split_7', 'variant_crawl-eat-them-dead-or-alive-split-7_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dead_elephant_heavy_huge_and_rotten_cd', 'variant_dead-elephant-heavy-huge-and-rotten-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dead_flag_blues_traumatique_cd', 'variant_dead-flag-blues-traumatique-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_dirty_ol_dogs_dirty_ol_dogs_cd', 'variant_dirty-ol-dogs-dirty-ol-dogs-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_disintegration_black_vinyl_lp', 'variant_disintegration-black-vinyl-lp_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_endless_searcher', 'variant_endless-searcher_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_frakhtal_plima_cd', 'variant_frakhtal-plima-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_full_moon_bonzai_reshaping_the_symbols_cd', 'variant_full-moon-bonzai-reshaping-the-symbols-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_granna_s_house_kuro_cd', 'variant_granna-s-house-kuro-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_hey_stealthy_hey_stealthy_cd', 'variant_hey-stealthy-hey-stealthy-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_in_your_absence', 'variant_in-your-absence_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_magic_sleazeball_corrida', 'variant_magic-sleazeball-corrida_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_millions_of_dead_tourists_ygiis_cd', 'variant_millions-of-dead-tourists-ygiis-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_noise_without_decay', 'variant_noise-without-decay_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_on_the_quiet', 'variant_on-the-quiet_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_one_leg_mary_i_a_seawolf_a_madman_cd', 'variant_one-leg-mary-i-a-seawolf-a-madman-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_one_leg_mary_on_the_quiet_cd', 'variant_one-leg-mary-on-the-quiet-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_primal_ephemeral', 'variant_primal-ephemeral_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_rehearsal_room_tee', 'variant_rehearsal-room-tee_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_rise_of_the_black_fang', 'variant_rise-of-the-black-fang_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_rite', 'variant_rite_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_sadhus_the_big_fish_cd', 'variant_sadhus-the-big-fish-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_selenopolis', 'variant_selenopolis_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_spinners', 'variant_spinners_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_steelwitch', 'variant_steelwitch_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_stefan_clor_baltica_cd', 'variant_stefan-clor-baltica-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_sun_of_nothing_the_guilt_of_feeling_alive_cd', 'variant_sun-of-nothing-the-guilt-of-feeling-alive-cd_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_chemical_bath', 'variant_the-chemical-bath_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_feathers_of_oblivion', 'variant_the-feathers-of-oblivion_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_the_last_second', 'variant_the-last-second_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_transatlantic_transiberian', 'variant_transatlantic-transiberian_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_unkraut', 'variant_unkraut_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_voyage_voyage', 'variant_voyage-voyage_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('stock_wreckquiem', 'variant_wreckquiem_standard', 99, 99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT("variantId") DO UPDATE SET
    "quantity" = excluded."quantity",
    "onlineQuantity" = excluded."onlineQuantity",
    "updatedAt" = CURRENT_TIMESTAMP;

