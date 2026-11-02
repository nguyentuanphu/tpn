// (v1.08 science, owner's plan 3 Nov 2026 AEDT) where each science experiment happens in the valley: the 📍 button in
// the Games hub walks the child to this place (js/main/talks.ts G.gameSpot). Only places that already stand in the
// valley are used (nothing on the map is moved or added); each is chosen to fit the experiment.
export const SCIENCE_PLACES: Record<string, string> = {
  sci_plant: 'plot0',        // the garden plots: plant a seed
  sci_water: 'tw_lake',      // Lake Tower, above the water
  sci_daynight: 'tw_plateau',// Dawn Tower, where the sun comes up
  sci_seasons: 'apple7',     // an apple tree near the village
  sci_homes: 'pen',          // the farm animals' pen
  sci_body: 'dacau',         // shuttlecock kicking: a body on the move
  sci_colours: 'sh_colors',  // the Rainbow Paints shrine
  sci_ice: 'pot0',           // the cooking pot: heat melts and boils
  sci_rainbow: 'bubbles',    // the bubble machine: soap-film rainbows
  sci_bulb: 'theatre',       // the shadow-puppet lamp
  sci_gears: 'blocks',       // building blocks: making things work
  sci_recycle: 'bear',       // Mr. Bear's market: what is left after shopping
  // the first six experiments (Học vui, 1 Nov 2026) had no place yet
  sci_float: 'feedfish', sci_magnet: 'chest', sci_ramp: 'balloon', sci_seesaw: 'hay', sci_shadow: 'theatre', sci_sound: 'xylo'
};
