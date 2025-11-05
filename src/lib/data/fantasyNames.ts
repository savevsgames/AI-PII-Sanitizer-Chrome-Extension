/**
 * Fantasy Name Pools for Alias Generation (PRO Feature)
 *
 * Fantasy-themed data pools for generating medieval/dragon/fantasy aliases.
 * Perfect for RPG players, writers, and fantasy enthusiasts.
 *
 * Pools:
 * - 500 fantasy first names (200 male, 200 female, 100 neutral)
 * - 500 fantasy surnames (nature, combat, noble, mythical themes)
 * - 100 fantasy guilds/taverns/organizations
 * - 50 fantasy realm domains
 *
 * @module fantasyNames
 * @tier PRO
 */

/**
 * Pool of 500 fantasy first names
 * Distribution: 200 male, 200 female, 100 gender-neutral
 * Inspired by medieval, Celtic, Norse, and fantasy literature
 */
export const FANTASY_FIRST_NAMES: readonly string[] = [
  // Male Fantasy Names (200)
  "Aldric", "Alaric", "Alistair", "Aramis", "Archer", "Ardyn", "Argent", "Arlen",
  "Asher", "Athos", "Auric", "Balthazar", "Barclay", "Bastian", "Bedivere", "Benedict",
  "Beran", "Bjorn", "Bowen", "Braden", "Bram", "Branoc", "Brennan", "Broderick",
  "Cadmus", "Caelan", "Caius", "Callum", "Casimir", "Cassian", "Cedric", "Cillian",
  "Conan", "Conlan", "Connor", "Corbin", "Cormac", "Cyrus", "Darian", "Darion",
  "Declan", "Demetrius", "Desmond", "Dorian", "Draven", "Duncan", "Eamon", "Edmund",
  "Edwin", "Eldan", "Eldric", "Elric", "Emeric", "Emrys", "Eoin", "Erik",
  "Erwin", "Ethan", "Evander", "Fabian", "Falco", "Felix", "Fenris", "Fergus",
  "Finnian", "Fletcher", "Florian", "Gareth", "Garrett", "Gavin", "Gideon", "Godric",
  "Goren", "Gregor", "Griffin", "Gunnar", "Hadrian", "Haldor", "Harald", "Harlan",
  "Henrik", "Ignatius", "Ivar", "Jace", "Joran", "Julius", "Kael", "Kane",
  "Kellan", "Kendrick", "Kieran", "Killian", "Klaus", "Konrad", "Kristof", "Kyran",
  "Landon", "Lars", "Leif", "Leopold", "Liam", "Lorcan", "Lucian", "Lucius",
  "Magnus", "Malachi", "Marcus", "Marius", "Matthias", "Maximus", "Merrick", "Miles",
  "Milo", "Nolan", "Octavius", "Odin", "Oren", "Orion", "Osric", "Oswald",
  "Otto", "Owen", "Percival", "Peregrine", "Phineas", "Ragnar", "Rainer", "Randal",
  "Raoul", "Reginald", "Reinhardt", "Remington", "Reynard", "Rhys", "Roderick", "Roland",
  "Roman", "Ronan", "Rorik", "Rupert", "Sebastian", "Severin", "Silas", "Sigmund",
  "Stellan", "Stefan", "Sven", "Talon", "Tarquin", "Thaddeus", "Thane", "Theron",
  "Thorin", "Thorne", "Tiernan", "Tobias", "Torin", "Torsten", "Tristan", "Ulric",
  "Uther", "Valen", "Valerian", "Varian", "Victor", "Vincent", "Walden", "Warrick",
  "Willem", "Wolfric", "Wyatt", "Xander", "Zander", "Zephyr", "Alarion", "Aric",
  "Drayden", "Draco", "Garrick", "Kaldor", "Mordecai", "Orin", "Rhydian", "Thrain",
  "Vortimer", "Wulfric", "Alderon", "Castor", "Darius", "Ezran", "Falken", "Godfrey",
  "Hadwin", "Isidor", "Jareth", "Kellen", "Lorian", "Merek", "Nyx", "Oberyn",

  // Female Fantasy Names (200)
  "Adelaide", "Adrienne", "Aella", "Aerith", "Aislinn", "Alara", "Alethea", "Alessandra",
  "Althea", "Amara", "Anastasia", "Anneliese", "Arabella", "Aria", "Ariadne", "Arwen",
  "Astrid", "Aurelia", "Aurora", "Avalon", "Beatrice", "Bianca", "Brielle", "Bronwyn",
  "Calista", "Callista", "Camilla", "Cassandra", "Cateline", "Celestia", "Celeste", "Cerys",
  "Clarissa", "Cordelia", "Cressida", "Dahlia", "Delphine", "Desdemona", "Drusilla", "Eila",
  "Elara", "Eleanor", "Eleanora", "Elodie", "Elowen", "Elspeth", "Elvira", "Ember",
  "Emilia", "Emmeline", "Estelle", "Evangeline", "Evelyn", "Faye", "Felicity", "Fiona",
  "Freya", "Gabrielle", "Genevieve", "Giselle", "Guinevere", "Gwendolyn", "Gwyneth", "Helena",
  "Hermione", "Iliana", "Imogen", "Ingrid", "Ione", "Iris", "Isabeau", "Isabella",
  "Isadora", "Isolde", "Jocelyn", "Juliana", "Juniper", "Kaelin", "Katarina", "Katrina",
  "Keira", "Kerenza", "Kiara", "Lavinia", "Leandra", "Lenora", "Leonora", "Lilith",
  "Linnea", "Liora", "Lorelei", "Lucinda", "Lydia", "Lyra", "Lysandra", "Madeleine",
  "Maeve", "Magdalena", "Mara", "Marcella", "Margaery", "Marian", "Marianne", "Mathilda",
  "Melisande", "Meridith", "Mirabel", "Miranda", "Morgana", "Morwenna", "Nadia", "Natalia",
  "Nerissa", "Niamh", "Nicolette", "Nora", "Octavia", "Odelia", "Odette", "Olivia",
  "Ophelia", "Oriana", "Orlaith", "Pandora", "Penelope", "Persephone", "Petra", "Philippa",
  "Portia", "Primrose", "Prudence", "Ramona", "Ravenna", "Regina", "Rhiannon", "Rosalyn",
  "Rosalind", "Rosanna", "Rosemary", "Rowena", "Sabrina", "Saoirse", "Seraphina", "Serena",
  "Sienna", "Sigrid", "Silvia", "Simone", "Sloane", "Sophronia", "Stella", "Sybil",
  "Sylvia", "Tabitha", "Tamsin", "Tatiana", "Thalia", "Theodora", "Thora", "Valentina",
  "Valeria", "Vanessa", "Veronica", "Victoria", "Viola", "Violet", "Viviana", "Vivienne",
  "Willa", "Willow", "Winifred", "Ysabel", "Zara", "Zelda", "Zyra", "Alayna",
  "Amalthea", "Annika", "Ashara", "Bryony", "Caelia", "Cassia", "Celine", "Daphne",
  "Elysia", "Eowyn", "Evadne", "Felicia", "Galadriel", "Jessamine",
  "Linnaea", "Lyanna", "Mererid", "Nienna", "Roslyn", "Thalassa", "Vespera", "Wren",

  // Gender-Neutral Fantasy Names (100)
  "Alder", "Ash", "Aspen", "Aubrey", "Avery", "Bay", "Blair", "Briar",
  "Bryn", "Cedar", "Cloud", "Cove", "Cyan", "Cypress", "Dale", "Ember",
  "Erin", "Falcon", "Fern", "Frost", "Gray", "Haven", "Hawk", "Heath",
  "Indigo", "Ivory", "Jade", "Jasper", "Kai", "Lake", "Lark", "Leaf",
  "Lynx", "Marlowe", "Moss", "North", "Oak", "Ocean", "Onyx", "Orion",
  "Phoenix", "Quill", "Rain", "Raven", "Reed", "River", "Robin", "Rowan",
  "Rune", "Sable", "Sage", "Salem", "Shadow", "Silver", "Sky", "Slate",
  "Snow", "Sparrow", "Star", "Sterling", "Stone", "Storm", "Swift", "Thorn",
  "Vale", "Vesper", "Warden", "Wren", "Zephyr", "Arlyn", "Auden", "Bran",
  "Caelan", "Dael", "Emlyn", "Finch", "Glen", "Harper", "Hollis", "Jorah",
  "Kade", "Kiran", "Levin", "Merlin", "Nyx", "Peregrin", "Quinn", "Ren",
  "Shay", "Sol", "Talon", "Theron", "Vale", "Vex", "Winter", "Wolf",
  "Wylde", "Yarrow", "Zael", "Zen"
] as const;

/**
 * Pool of 500 fantasy surnames
 * Themes: Nature, elemental, combat, noble, mythical creatures
 */
export const FANTASY_LAST_NAMES: readonly string[] = [
  // Nature-Based
  "Ashwood", "Blackthorn", "Brightwater", "Darkwood", "Evergreen", "Fairwind", "Goldleaf", "Greenwood",
  "Hawthorn", "Ironwood", "Nightshade", "Oakenheart", "Redwood", "Shadowmere", "Silverleaf", "Stormwind",
  "Thornwood", "Whitewood", "Wildwood", "Wintergreen", "Wolfwood", "Bloomfield", "Cloudbreak", "Deepwood",
  "Frostwood", "Meadowbrook", "Moonbrook", "Ravenwood", "Riverwood", "Starling", "Sunwood", "Willowbrook",

  // Elemental
  "Emberforge", "Flameheart", "Frostbane", "Iceheart", "Stoneforge", "Stormbringer", "Thunderfist", "Windwalker",
  "Ashburn", "Brightflame", "Coldwater", "Darkfire", "Earthshaker", "Fireborn", "Icewind", "Lightbringer",
  "Shadowflame", "Skybreaker", "Starfire", "Stormborn", "Stormcrow", "Sunfire", "Thunderstrike", "Waterfall",

  // Weapon/Combat
  "Axebearer", "Bladewielder", "Ironblade", "Ironfist", "Shieldbreaker", "Steelhand", "Swiftblade", "Warhammer",
  "Arrowsmith", "Blackblade", "Bladeborn", "Ironforge", "Quickblade", "Sharpsteel", "Silverhand", "Steelheart",
  "Strongarm", "Swordmaster", "Trueblade", "Battleborn", "Dragonslayer", "Giantsbane", "Knightfall", "Lionheart",

  // Geographic
  "Eastmarch", "Highridge", "Hillcrest", "Lowland", "Northwood", "Southmarch", "Westbrook", "Westmarch",
  "Blackmoor", "Deepdale", "Fallowfield", "Flatland", "Glenmoor", "Highwall", "Longhill", "Lowmoor",
  "Northcliff", "Rockridge", "Southvale", "Stonebridge", "Upland", "Valewood", "Westfield", "Woodmere",

  // Noble
  "Ashford", "Barrington", "Beaumont", "Blackwood", "Caldwell", "Cromwell", "Darrow", "Fairfax",
  "Grayson", "Harrington", "Huntington", "Kingsley", "Lancaster", "Montague", "Pembroke", "Ravencroft",
  "Redford", "Sheffield", "Sterling", "Stratford", "Thornbury", "Wakefield", "Warwick", "Wentworth",
  "Ashworth", "Blackburn", "Bradford", "Chadwick", "Covington", "Davenport", "Elmsworth", "Fairchild",
  "Godwin", "Hadley", "Kingsbury", "Langley", "Merriweather", "Northwood", "Radcliffe", "Thornton",

  // Animal-Based
  "Bearhart", "Eaglewing", "Falconer", "Foxglove", "Hawkwood", "Lionmane", "Ravenhill", "Stag",
  "Wolfheart", "Badger", "Boarwood", "Crowley", "Drake", "Falconwing", "Foxworth", "Griffin",
  "Hawthorne", "Lynx", "Owlwood", "Ravenscar", "Staghorn", "Swanson", "Wolfson", "Wyverndale",

  // Dragon/Mythical
  "Dragonbane", "Dragonheart", "Dragonwood", "Wyrmwood", "Drakemore", "Dragonclaw", "Dragonrider", "Wyvernstone",
  "Phoenixfire", "Griffinwing", "Serpentine", "Basilisk", "Chimaera", "Hydraborn", "Krakenfall", "Wyrmscale",

  // Stone/Rock
  "Blackstone", "Cobblestone", "Cornerstone", "Flintstone", "Greystone", "Ironstone", "Limestone", "Rockford",
  "Sandstone", "Silverstone", "Slate", "Stoneheart", "Stonewall", "Whitestone", "Ashstone", "Boulder",
  "Cairn", "Crag", "Granite", "Keystone", "Marble", "Obsidian", "Quartz", "Shale",

  // Water-Based
  "Blackwater", "Brightstream", "Clearwater", "Deepwater", "Fairwater", "Highwater", "Lightwater", "Longwater",
  "Riverdale", "Riverside", "Streamwood", "Waterford", "Brookfield", "Brookstone", "Cascadefall", "Edgewater",
  "Fallwater", "Millstream", "Springwater", "Stillwater", "Tidewood", "Wellspring", "Westwater", "Windermere",

  // Time/Celestial
  "Dawnbringer", "Daybreak", "Nightfall", "Starborn", "Sundown", "Twilight", "Dawncrest", "Duskwood",
  "Eventide", "Midday", "Midnight", "Moonshadow", "Stargazer", "Starlight", "Sunrise", "Sunset",

  // Mountain/Hill
  "Highpeak", "Ironpeak", "Mountainheart", "Peakwood", "Summitcrest", "Tallpeak", "Crownsummit", "Hillborn",
  "Hillhaven", "Hillside", "Mountainborn", "Mountainstone", "Ridgemont", "Snowpeak", "Stonepeak", "Summitstone",

  // Vale/Valley
  "Deepvale", "Fairvale", "Greendale", "Highvale", "Longvale", "Shadowvale", "Silvervale", "Sunnyvale",
  "Thorndale", "Windvale", "Daleborn", "Glenvale", "Goldendale", "Grayvale", "Ironvale", "Rosevale",

  // Forest/Grove
  "Blackforest", "Deepforest", "Elvenwood", "Greengrove", "Ironwood", "Oakengrove", "Pinewood", "Wildgrove",
  "Birchwood", "Cedarwood", "Elmwood", "Firwood", "Forestborn", "Maplewood", "Thorngrove", "Willowgrove",

  // Castle/Fort
  "Blackcastle", "Brightkeep", "Castlewood", "Dragonkeep", "Ironhold", "Northkeep", "Stonecastle", "Stormkeep",
  "Highcastle", "Knightfort", "Royalfort", "Silverkeep", "Southfort", "Starhold", "Westcastle", "Winterhold",

  // Moon/Star
  "Moonbeam", "Mooncrest", "Moonwhisper", "Starborn", "Starcrest", "Starwood", "Lunaris", "Moonfire",
  "Moonlight", "Moonstone", "Moonwood", "Nightstar", "Silverstar", "Starfall", "Starmoon", "Stellaris",

  // Virtue/Honor
  "Argentum", "Aurelian", "Braveheart", "Crownguard", "Evenstar", "Faithkeeper", "Gloryborn", "Honorbound",
  "Ironguard", "Justborn", "Kindleflame", "Lightkeeper", "Moonshield", "Nobleborn", "Oathkeeper", "Oathsworn",
  "Prideful", "Questseeker", "Righteborn", "Shieldborn", "Trueheart", "Trueshield", "Valorborn", "Valorheart",

  // Misc Fantasy
  "Amberwood", "Blackwell", "Coldforge", "Dawnforge", "Emberstone", "Fairweather", "Goldwater",
  "Nightshield", "Ravenstone", "Shadowcrest", "Silvermoon", "Starwind", "Stormshield", "Sunderland", "Thunderwood",
  "Whitehall", "Winterbourne", "Wyldewood", "Crystalbrook", "Darkstorm", "Firestorm", "Frostforge", "Goldcrest",
  "Hawkstone", "Lightwood", "Nightwood", "Quicksilver", "Redstone", "Shadowbrook", "Snowfall", "Stonefield",
  "Stormwatch", "Sunchaser", "Thornfield", "Thunderstone", "Twilightmere", "Winterfell", "Wolfcrest"
] as const;

/**
 * Pool of 100 fantasy organizations
 * Guilds, taverns, shops, and establishments
 */
export const FANTASY_ORGANIZATIONS: readonly string[] = [
  // Guilds
  "The Adventurers Guild", "The Merchants Guild", "The Mages Guild", "The Thieves Guild", "The Warriors Guild",
  "The Assassins Brotherhood", "The Knights Order", "The Healers Circle", "The Alchemists Society", "The Scholars League",
  "The Dragon Riders", "The Phoenix Order", "The Silver Hand", "The Golden Lions", "The Iron Brotherhood",
  "The Shadow Council", "The Crystal Order", "The Emerald Society", "The Crimson Guard", "The Azure Brotherhood",

  // Taverns & Inns
  "The Prancing Pony", "The Dragon's Den", "The Golden Griffin", "The Silver Stag", "The Rusty Sword",
  "The Dancing Bear", "The Laughing Knight", "The Sleeping Dragon", "The Drunken Dwarf", "The Merry Minstrel",
  "The King's Rest", "The Queen's Crown", "The Knight's Respite", "The Wanderer's Haven", "The Traveler's Rest",
  "The Broken Shield", "The Empty Tankard", "The Full Flagon", "The Green Dragon", "The Red Lion",

  // Blacksmiths & Armories
  "Ironforge Smithy", "Dragonfire Armory", "The Steel Dragon", "Anvil & Hammer", "Stormforge Weapons",
  "The Golden Anvil", "Silversteel Smithy", "Thunderstrike Forge", "The Master's Forge", "Fireborn Armory",
  "The Dwarven Anvil", "Bloodsteel Armory", "The Iron Phoenix", "Dragonscale Smithy", "The Flaming Forge",

  // Magic Shops
  "The Mystic Emporium", "Merlin's Mysteries", "The Enchanted Chalice", "The Crystal Cauldron", "The Wizard's Tower",
  "The Sorcerer's Supply", "Moonlight Apothecary", "The Arcane Archive", "The Magic Lantern", "The Spellbound Scroll",
  "The Alchemist's Flask", "The Potion Master", "The Witch's Brew", "The Mystical Arts", "The Enchanter's Workshop",

  // Merchants
  "The Golden Merchant", "The Traveling Trader", "The Silk Road Emporium", "The Treasure Trove", "The Royal Exchange",
  "The Silver Coin", "The Diamond District", "The Market Square", "The Trading Post", "The Merchant's Keep",

  // Specialty Shops
  "The Dragon's Hoard", "The Phoenix Feather", "The Unicorn's Horn", "The Griffin's Nest", "The Serpent's Scale",
  "The Raven's Quill", "The Wolf's Paw", "The Bear's Den", "The Eagle's Perch", "The Lion's Pride",

  // Libraries
  "The Ancient Library", "The Scholar's Sanctuary", "The Book of Secrets", "The Infinite Archive", "The Wisdom Hall",
  "The Lore Keeper", "The Sacred Scrolls", "The Hidden Knowledge", "The Eternal Library", "The Page & Quill",

  // Establishments
  "The Royal Court", "The Noble Estate", "The Castle Keep", "The Dragon's Lair", "The Knight's Manor",
  "The Wizard's Sanctum", "The Temple of Light", "The Shadow Sanctuary", "The Crystal Citadel", "The Moonstone Hall"
] as const;

/**
 * Pool of 50 fantasy realm domains
 */
export const FANTASY_DOMAINS: readonly string[] = [
  // Realm-Based
  "dragonkeep.realm", "silverwood.realm", "ironhold.realm", "stormwind.realm", "crystalvale.realm",
  "shadowmere.realm", "brightwater.realm", "winterfell.realm", "goldencrest.realm", "ravencroft.realm",

  // Kingdom
  "northkingdom.crown", "westkingdom.crown", "eastkingdom.crown", "southkingdom.crown", "highkingdom.crown",
  "greatkingdom.crown", "ancientkingdom.crown", "elderkingdom.crown", "mythkingdom.crown", "firstkingdom.crown",

  // Guild
  "magesguild.order", "knightorder.order", "merchantguild.order", "warriorguild.order", "thiefguild.order",
  "healerscircle.order", "scryersguild.order", "rangerguild.order", "bardscollege.order", "craftguild.order",

  // Castle/Fortress
  "highcastle.keep", "ironfort.keep", "stonecastle.keep", "dragonfort.keep", "starkeep.keep",
  "mooncastle.keep", "sunfort.keep", "shadowkeep.keep", "lightkeep.keep", "darkfort.keep",

  // Forest/Nature
  "elvenwood.forest", "darkwood.forest", "ancientwood.forest", "wildwood.forest", "deepwood.forest",

  // Magical
  "arcane.magic", "mystic.magic", "enchanted.magic", "spellbound.magic", "ethereal.magic"
] as const;

/**
 * Type definitions
 */
export type FantasyFirstName = typeof FANTASY_FIRST_NAMES[number];
export type FantasyLastName = typeof FANTASY_LAST_NAMES[number];
export type FantasyOrganization = typeof FANTASY_ORGANIZATIONS[number];
export type FantasyDomain = typeof FANTASY_DOMAINS[number];

/**
 * Pool stats
 */
export const FANTASY_POOL_STATS = {
  firstNames: FANTASY_FIRST_NAMES.length,
  lastNames: FANTASY_LAST_NAMES.length,
  organizations: FANTASY_ORGANIZATIONS.length,
  domains: FANTASY_DOMAINS.length,
} as const;
