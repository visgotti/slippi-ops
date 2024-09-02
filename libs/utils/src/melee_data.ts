
export const characterPeopleCareOrder = [
  "Fox", "Falco", "Marth", "Sheik", "Captain Falcon",
  "Jigglypuff", "Peach", "Ice Climbers", 
  "Pikachu", "Samus", "Yoshi", "Luigi", "Dr. Mario", "Ganondorf",
  "Mario", "Donkey Kong", "Young Link", "Link", "Roy", "Mewtwo", 
  "Mr. Game & Watch", "Ness", "Pichu", "Bowser", "Kirby", "Zelda"
]

export const characterData : {[index: string]: { name: string, shortName?: string, colors: string[] }} = {
  "0": {
    "name": "Captain Falcon",
    "shortName": "Falcon",
    "colors": ["Black", "Red", "White", "Green", "Blue"]
  },
  "1": {
    "name": "Donkey Kong",
    "shortName": "DK",
    "colors": ["Black", "Red", "Blue", "Green"]
  },
  "2": {
    "name": "Fox",
    "colors": ["Red", "Blue", "Green"]
  },
  "3": {
    "name": "Mr. Game & Watch",
    "shortName": "G&W",
    "colors": ["Red", "Blue", "Green"]
  },
  "4": {
    "name": "Kirby",
    "colors": ["Yellow", "Blue", "Red", "Green", "White"]
  },
  "5": {
    "name": "Bowser",
    "colors": ["Red", "Blue", "Black"]
  },
  "6": {
    "name": "Link",
    "colors": ["Red", "Blue", "Black", "White"]
  },
  "7": {
    "name": "Luigi",
    "colors": ["White", "Blue", "Red"]
  },
  "8": {
    "name": "Mario",
    "colors": ["Yellow", "Black", "Blue", "Green"]
  },
  "9": {
    "name": "Marth",
    "colors": ["Red", "Green", "Black", "White"]
  },
  "10": {
    "name": "Mewtwo",
    "colors": ["Red", "Blue", "Green"]
  },
  "11": {
    "name": "Ness",
    "colors": ["Yellow", "Blue", "Green"]
  },
  "12": {
    "name": "Peach",
    "colors": ["Daisy", "White", "Blue", "Green"]
  },
  "13": {
    "name": "Pikachu",
    "colors": ["Red", "Party Hat", "Cowboy Hat"]
  },
  "14": {
    "name": "Ice Climbers",
    "shortName": "ICs",
    "colors": ["Green", "Orange", "Red"]
  },
  "15": {
    "name": "Jigglypuff",
    "shortName": "Puff",
    "colors": ["Red", "Blue", "Headband", "Crown"]
  },
  "16": {
    "name": "Samus",
    "colors": ["Pink", "Black", "Green", "Purple"]
  },
  "17": {
    "name": "Yoshi",
    "colors": ["Red", "Blue", "Yellow", "Pink", "Cyan"]
  },
  "18": {
    "name": "Zelda",
    "colors": ["Red", "Blue", "Green", "White"]
  },
  "19": {
    "name": "Sheik",
    "colors": ["Red", "Blue", "Green", "White"]
  },
  "20": {
    "name": "Falco",
    "colors": ["Red", "Blue", "Green"]
  },
  "21": {
    "name": "Young Link",
    "shortName": "YLink",
    "colors": ["Red", "Blue", "White", "Black"]
  },
  "22": {
    "name": "Dr. Mario",
    "shortName": "Doc",
    "colors": ["Red", "Blue", "Green", "Black"]
  },
  "23": {
    "name": "Roy",
    "colors": ["Red", "Blue", "Green", "Yellow"]
  },
  "24": {
    "name": "Pichu",
    "colors": ["Red", "Blue", "Green"]
  },
  "25": {
    "name": "Ganondorf",
    "shortName": "Ganon",
    "colors": ["Red", "Blue", "Green", "Purple"]
  },
}

export const ELO_THRESHOLDS = {
  GRAND_MASTER_MIN: 2192,
  MASTER_3_MIN: 2350,
  MASTER_2_MIN: 2275,
  MASTER_1_MIN: 2192,
  DIAMOND_3_MIN: 2137,
  DIAMOND_2_MIN: 2074,
  DIAMOND_1_MIN: 2004,
  PLAT_3_MIN: 1928,
  PLAT_2_MIN: 1843,
  PLAT_1_MIN: 1752,
  GOLD_3_MIN: 1654,
  GOLD_2_MIN: 1549,
  GOLD_1_MIN: 1436,
  SILVER_3_MIN: 1316,
  SILVER_2_MIN: 1189,
  SILVER_1_MIN: 1055,
  BRONZE_3_MIN: 914,
  BRONZE_2_MIN: 766,
  BRONZE_1_MIN: 500,
  PLACEMENT_THRESHOLD: 300,
  MAX_ELO: 999999,
};


export const legalStageIds = [2, 3, 8, 28, 31, 32]

export const legalStageIdsToNameLookup = {
  "2": "Fountain of Dreams",
  "3": "Pokémon Stadium",
  "8": "Yoshi's Story",
  "28": "Dream Land N64",
  "31": "Battlefield",
  "32": "Final Destination",
}

export const stageToImageLookup = {
  "2": "fountainofdreams.png",       // Fountain of Dreams
  "3": "pokemonstadium.png",         // Pokémon Stadium
  "4": "princesspeachscastle.png",   // Princess Peach's Castle
  "5": "kongojungle.png",            // Kongo Jungle
  "6": "brinstar.png",               // Brinstar
  "7": "corneria.png",               // Corneria
  "8": "yoshisstory.png",            // Yoshi's Story
  "9": "onett.png",                  // Onett
  "10": "mutecity.png",              // Mute City
  "11": "rainbowcruise.png",         // Rainbow Cruise
  "12": "junglejapes.png",           // Jungle Japes
  "13": "greatbay.png",              // Great Bay
  "14": "hyruletemple.png",          // Hyrule Temple
  "15": "brinstardepths.png",        // Brinstar Depths
  "16": "yoshisisland.png",          // Yoshi's Island
  "17": "greengreens.png",           // Green Greens
  "18": "fourside.png",              // Fourside
  "19": "mushroomkingdom.png",       // Mushroom Kingdom I
  "20": "mushroomkingdomii.png",     // Mushroom Kingdom II
  "22": "venom.png",                 // Venom
  "23": "pokefloats.png",            // Poké Floats
  "24": "bigblue.png",               // Big Blue
  "25": "iciclemountain.png",        // Icicle Mountain
  "26": "icetop.png",                // Icetop
  "27": "flatzone.png",              // Flat Zone
  "28": "dreamlandn64.png",          // Dream Land N64
  "29": "yoshisislandn64.png",       // Yoshi's Island N64
  "30": "kongojunglen64.png",        // Kongo Jungle N64
  "31": "battlefield.png",           // Battlefield
  "32": "finaldestination.png",      // Final Destination

  "Rainbow Cruise": "rainbowcruise.png",
  "Princess Peach's Castle": "princesspeachscastle.png",
  "Kongo Jungle": "kongojungle.png",
  "Jungle Japes": "junglejapes.png",
  "Hyrule Temple": "hyruletemple.png",
  "Great Bay": "greatbay.png",
  "Yoshi's Island N64": "yoshisislandn64.png",
  "Yoshi's Story": "yoshisstory.png",
  "Green Greens": "greengreens.png",
  "Fountain of Dreams": "fountainofdreams.png",
  "Venom": "venom.png",
  "Corneria": "corneria.png",
  "Brinstar Depths": "brinstardepths.png",
  "Brinstar": "brinstar.png",
  "Fourside": "fourside.png",
  "Onett": "onett.png",
  "Big Blue": "bigblue.png",
  "Mute City": "mutecity.png",
  "Poké Floats": "pokefloats.png",
  "Pokémon Stadium": "pokemonstadium.png",
  "Mushroom Kingdom II": "mushroomkingdomii.png",
  "Mushroom Kingdom": "mushroomkingdom.png",
  "Battlefield": "battlefield.png",
  "Final Destination": "finaldestination.png",
  "Icicle Mountain": "iciclemountain.png",
  "Icetop": "icetop.png",
  "Flat Zone": "flatzone.png",
  "Dream Land N64": "dreamlandn64.png",
  "Yoshi's Island": "yoshisisland.png",
  "Kongo Jungle N64": "kongojunglen64.png"
};

export const stageIdsToNameLookup :  { [key: string]: string } = {
  "2": "Fountain of Dreams",
  "3": "Pokémon Stadium",
  "4": "Princess Peach's Castle",
  "5": "Kongo Jungle",
  "6": "Brinstar",
  "7": "Corneria",
  "8": "Yoshi's Story",
  "9": "Onett",
  "10": "Mute City",
  "11": "Rainbow Cruise",
  "12": "Jungle Japes",
  "13": "Great Bay",
  "14": "Hyrule Temple",
  "15": "Brinstar Depths",
  "16": "Yoshi's Island",
  "17": "Green Greens",
  "18": "Fourside",
  "19": "Mushroom Kingdom I",
  "20": "Mushroom Kingdom II",
  "22": "Venom",
  "23": "Poké Floats",
  "24": "Big Blue",
  "25": "Icicle Mountain",
  "26": "Icetop",
  "27": "Flat Zone",
  "28": "Dream Land N64",
  "29": "Yoshi's Island N64",
  "30": "Kongo Jungle N64",
  "31": "Battlefield",
  "32": "Final Destination"
};

export const characterArray : Array<{ id: number, name: string }> = Object.keys(characterData).map(key => ({
  id: parseInt(key),
  name: characterData[key].name,
}));
export const tieredCharacterArray= ([...characterArray].sort((a, b) => characterPeopleCareOrder.indexOf(a.name) - characterPeopleCareOrder.indexOf(b.name)));

export const characterRanges = [
  { name: 'drmario', colors: 5, start: 0, end: 4 },
  { name: 'mario', colors: 5, start: 5, end: 9 },
  { name: 'luigi', colors: 4, start: 10, end: 13 },
  { name: 'bowser', colors: 4, start: 14, end: 17 },
  { name: 'peach', colors: 5, start: 18, end: 22 },
  { name: 'yoshi', colors: 6, start: 23, end: 28 },
  { name: 'donkeykong', colors: 5, start: 29, end: 33 },
  { name: 'captainfalcon', colors: 6, start: 34, end: 39 },
  { name: 'ganondorf', colors: 5, start: 40, end: 44 },
  { name: 'falco', colors: 4, start: 45, end: 48 },
  { name: 'fox', colors: 4, start: 49, end: 52 },
  { name: 'ness', colors: 4, start: 53, end: 56 },
  { name: 'iceclimbers', colors: 4, start: 57, end: 60 },
  { name: 'kirby', colors: 6, start: 61, end: 66 },
  { name: 'samus', colors: 5, start: 67, end: 71 },
  { name: 'zelda', colors: 5, start: 72, end: 76 },
  { name: 'sheik', colors: 5, start: 77, end: 81 },
  { name: 'link', colors: 5, start: 82, end: 86 },
  { name: 'younglink', colors: 5, start: 87, end: 91 },
  { name: 'pichu', colors: 4, start: 92, end: 95 },
  { name: 'pikachu', colors: 4, start: 96, end: 99 },
  { name: 'jigglypuff', colors: 5, start: 100, end: 104 },
  { name: 'mewtwo', colors: 4, start: 105, end: 108 },
  { name: 'gameandwatch', colors: 4, start: 109, end: 112 },
  { name: 'marth', colors: 5, start: 113, end: 117 },
  { name: 'roy', colors: 5, start: 118, end: 122 }
];


export const characters = [
  ["drmario", 5], ["mario", 5], ["luigi", 4], ["bowser", 4], ["peach", 5],
  ["yoshi", 6], ["donkeykong", 5], ["captainfalcon", 6], ["ganondorf", 5], 
  ["falco", 4], ["fox", 4], ["ness", 4], ["iceclimbers", 4], ["kirby", 6],
  ["samus", 5], ["zelda", 5], ["sheik", 5], ["link", 5], ["younglink", 5],
  ["pichu", 4], ["pikachu", 4], ["jigglypuff", 5], ["mewtwo", 4], 
  ["gameandwatch", 4], ["marth", 5], ["roy", 5]
];

//todo have chatgpt write a script to split these and download them then change map to point to image url
export const characterStockIconRects = 
[
    [36, 1, 21, 24],
    [62, 1, 21, 24],
    [88, 1, 21, 24],
    [114, 1, 21, 24],
    [140, 1, 21, 24],
    [177, 1, 22, 24],
    [204, 1, 22, 24],
    [231, 1, 22, 24],
    [258, 1, 22, 24],
    [285, 1, 22, 24],
    [329, 1, 22, 24],
    [356, 1, 22, 24],
    [383, 1, 22, 24],
    [410, 1, 22, 24],
    [454, 1, 24, 24],
    [483, 1, 24, 24],
    [512, 1, 24, 24],
    [541, 1, 24, 24],
    [56, 38, 24, 24],
    [85, 38, 24, 24],
    [114, 38, 24, 24],
    [143, 38, 24, 24],
    [172, 38, 24, 24],
    [218, 38, 24, 24],
    [247, 38, 24, 24],
    [276, 38, 24, 24],
    [305, 38, 24, 24],
    [334, 38, 24, 24],
    [363, 38, 24, 24],
    [407, 38, 23, 24],
    [436, 38, 23, 24],
    [465, 38, 23, 24],
    [494, 38, 23, 24],
    [523, 38, 23, 24],
    [1, 74, 23, 24],
    [29, 74, 23, 24],
    [57, 74, 23, 24],
    [85, 74, 23, 24],
    [113, 74, 23, 24],
    [141, 74, 23, 24],
    [188, 74, 23, 24],
    [217, 74, 23, 24],
    [246, 74, 23, 24],
    [275, 74, 23, 24],
    [304, 74, 23, 24],
    [354, 74, 24, 24],
    [383, 74, 24, 24],
    [412, 74, 24, 24],
    [441, 74, 24, 24],
    [490, 74, 24, 24],
    [519, 74, 24, 24],
    [548, 74, 24, 24],
    [577, 74, 24, 24],
    [14, 110, 23, 23],
    [42, 110, 23, 23],
    [70, 110, 23, 23],
    [98, 110, 23, 23],
    [142, 109, 24, 24],
    [171, 109, 24, 24],
    [200, 109, 24, 24],
    [229, 109, 24, 24],
    [270, 111, 22, 22],
    [297, 111, 22, 22],
    [324, 111, 22, 22],
    [351, 111, 22, 22],
    [378, 111, 22, 22],
    [405, 111, 22, 22],
    [445, 111, 24, 22],
    [474, 111, 24, 22],
    [503, 111, 24, 22],
    [532, 111, 24, 22],
    [561, 111, 24, 22],
    [62, 146, 24, 24],
    [91, 146, 24, 24],
    [120, 146, 24, 24],
    [149, 146, 24, 24],
    [178, 146, 24, 24],
    [224, 146, 24, 24],
    [253, 146, 24, 24],
    [282, 146, 24, 24],
    [311, 146, 24, 24],
    [340, 146, 24, 24],
    [386, 146, 24, 24],
    [415, 146, 24, 24],
    [444, 146, 24, 24],
    [473, 146, 24, 24],
    [502, 146, 24, 24],
    [22, 182, 24, 24],
    [51, 182, 24, 24],
    [80, 182, 24, 24],
    [109, 182, 24, 24],
    [138, 182, 24, 24],
    [182, 184, 24, 22],
    [211, 183, 24, 23],
    [240, 184, 24, 22],
    [269, 183, 24, 23],
    [310, 182, 21, 24],
    [339, 182, 21, 24],
    [368, 182, 21, 24],
    [397, 182, 21, 24],
    [441, 182, 22, 24],
    [468, 182, 23, 24],
    [496, 182, 23, 24],
    [524, 182, 22, 24],
    [551, 182, 22, 24],
    [25, 217, 20, 24],
    [50, 217, 20, 24],
    [75, 217, 20, 24],
    [100, 217, 20, 24],
    [140, 220, 24, 21],
    [169, 220, 24, 21],
    [198, 220, 24, 21],
    [227, 220, 24, 21],
    [273, 217, 23, 24],
    [301, 217, 23, 24],
    [329, 217, 23, 24],
    [357, 217, 23, 24],
    [385, 217, 23, 24],
    [434, 217, 24, 24],
    [463, 217, 24, 24],
    [492, 217, 24, 24],
    [521, 217, 24, 24],
    [550, 217, 24, 24],
]
