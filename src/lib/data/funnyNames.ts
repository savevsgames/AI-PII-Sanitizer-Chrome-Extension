/**
 * Funny Names Alias Generation System - Data Pools
 *
 * PRO tier feature providing hilarious, family-friendly comedic aliases.
 * Names are designed to work in various combinations to create funny results.
 *
 * @module funnyNames
 */

/**
 * Pool of 500 funny first names (200 male, 200 female, 100 neutral)
 */
export const FUNNY_FIRST_NAMES: readonly string[] = [
  // Traditionally Male Funny Names (200)
  'Bingo', 'Bobo', 'Bonkers', 'Bubba', 'Buckaroo', 'Buddy', 'Buster', 'Buzz',
  'Champ', 'Chip', 'Chipper', 'Chunk', 'Clancy', 'Cletus', 'Clover', 'Clyde',
  'Coco', 'Cookie', 'Cooter', 'Corky', 'Cosmo', 'Cracker', 'Cricket', 'Digby',
  'Dingbat', 'Dinky', 'Dipsy', 'Dizzy', 'Dobber', 'Dodger', 'Doodle', 'Doozy',
  'Dopey', 'Dorky', 'Dumpling', 'Dusty', 'Elmo', 'Ezra', 'Fester', 'Fidget',
  'Flapjack', 'Flipper', 'Fluffy', 'Foghorn', 'Fonzie', 'Fozzy', 'Frazzle', 'Fuzzy',
  'Gizmo', 'Goober', 'Goofy', 'Grover', 'Gumbo', 'Gus', 'Happy', 'Hoagie',
  'Hobbit', 'Hobnob', 'Homer', 'Honker', 'Hooch', 'Hoot', 'Hopper', 'Iggy',
  'Jazzy', 'Jester', 'Jiggly', 'Jingles', 'Jitters', 'Jojo', 'Jolly', 'Jughead',
  'Jumbo', 'Junior', 'Kermit', 'Kibbles', 'Kip', 'Knuckles', 'Loopy', 'Lucky',
  'Lumpy', 'Meatball', 'Moose', 'Mopsy', 'Muffin', 'Nibbles', 'Noodle', 'Nugget',
  'Nutty', 'Peanut', 'Pebbles', 'Peppy', 'Pickles', 'Pip', 'Pokey', 'Poodle',
  'Popcorn', 'Poppy', 'Porkchop', 'Puddles', 'Pudgy', 'Puffy', 'Pumpernickel', 'Punky',
  'Scooter', 'Skippy', 'Slappy', 'Slinky', 'Slugger', 'Smokey', 'Snickers', 'Snoopy',
  'Snuffy', 'Sparky', 'Spaz', 'Spud', 'Squiggly', 'Squirt', 'Stinky', 'Stumpy',
  'Taco', 'Tater', 'Tickles', 'Toodles', 'Tootsie', 'Tugboat', 'Twinkie', 'Waddles',
  'Waffles', 'Whiskers', 'Widget', 'Wiggle', 'Winky', 'Wobbles', 'Yappy', 'Zippy',
  'Zonker', 'Zoom', 'Zapper', 'Ziggy', 'Biscuit', 'Banjo', 'Barnaby', 'Beaker',
  'Binky', 'Blabber', 'Blimpo', 'Blinky', 'Blooper', 'Bonzo', 'Booger', 'Boomer',
  'Booper', 'Bootsy', 'Bubbles', 'Buckwheat', 'Buford', 'Bumble', 'Bumper', 'Burrito',
  'Butterbean', 'Buttons', 'Buzzer', 'Cabbage', 'Chubby', 'Chuckles', 'Clunker', 'Cobbler',
  'Crackers', 'Cuddles', 'Cupcake', 'Dingleberry', 'Dodo', 'Dorkus', 'Dribble',
  'Dumbo', 'Fiddlesticks', 'Flubber', 'Frankfurter', 'Fumble', 'Giggles', 'Glitch', 'Goofball',
  'Gulliver', 'Gumball', 'Gummy', 'Hambone', 'Hiccup', 'Hobgoblin', 'Huggy', 'Jazzhands',
  'Jellybeans', 'Jigsaw', 'Jinglejangle', 'Klutz', 'Knobby', 'Kumquat', 'Lollipop', 'Malarkey',

  // Traditionally Female Funny Names (200)
  'Babbles', 'Bambi', 'Bebe', 'Blossom', 'Bobbie', 'Bonbon', 'Bootsie',
  'Buffy', 'Bunny', 'Buttercup', 'Candy', 'Chickie', 'Cinnamon',
  'Cutie', 'Daffy', 'Daffodil', 'Daisy', 'Dimples', 'Dimpsy',
  'Ditsy', 'Dolly', 'Dottie', 'Ducky', 'Fifi',
  'Flossy', 'Frilly', 'Froofy', 'Gabby', 'Gidget',
  'Ginger', 'Glitzy', 'Goldie', 'Gracie', 'Honeybun',
  'Jellybean', 'Jiffy', 'Kiki', 'Kooky',
  'Lacey', 'Ladybug', 'Lolly', 'Lulu', 'Mabel', 'Maisie', 'Mango', 'Marshmallow',
  'Mimi', 'Minnie', 'Missy', 'Mochi', 'Muffy', 'Nana',
  'Nutmeg', 'Olive', 'Pancake', 'Peaches',
  'Pinky', 'Pippa', 'Pixie', 'Polly', 'Pompom',
  'Pookie', 'Precious', 'Pudding', 'Pumpkin', 'Ruffles',
  'Sassy', 'Sherbet', 'Shimmer', 'Skippie', 'Snickerdoodle', 'Snookie', 'Snuggles', 'Sparkle',
  'Sprinkles', 'Squeezy', 'Starlet', 'Sugar', 'Sunny', 'Sweetpea', 'Taffy',
  'Teeny', 'Tiffany', 'Tinker', 'Tinkerbelle', 'Tinsel', 'Tippy',
  'Topsy', 'Trixi', 'Trixie', 'Truffle', 'Tuffy', 'Tutti', 'Twinkle',
  'Tweety', 'Winnie', 'Yoyo', 'Babs', 'Bamboozle', 'Bangle',
  'Beanie', 'Beefy', 'Bellybutton', 'Bertha', 'Betsy', 'Bijou', 'Biscotti', 'Bitsy',
  'Blondie', 'Blueberry', 'Boopsy', 'Breezy', 'Brownie', 'Bubblegum', 'Buttermilk',
  'Buzzy', 'Caramel', 'Chatty', 'Cheery', 'Cherry', 'Chiffon', 'Chipmunk', 'Chirpy',
  'Cloverbelle', 'Clumsy', 'Cobweb', 'Coconut', 'Confetti', 'Cooky', 'Corncob', 'Cottontail',
  'Crinkle', 'Crumpet', 'Dainty', 'Dandelion', 'Darling', 'Dewy', 'Dilly',
  'Dinah', 'Dippy', 'Dixie', 'Dumplin', 'Eclair',
  'Effie', 'Fannie', 'Feather', 'Fern', 'Flapper', 'Flicker', 'Floozy', 'Fluff',
  'Flutter', 'Fondant', 'Freckles', 'Fudge', 'Gabbie', 'Gigi', 'Gingersnap', 'Glimmer',

  // Gender-Neutral Funny Names (100)
  'Bacon', 'Bagel', 'Bananas', 'Beans', 'Bigfoot', 'Blubber',
  'Bobble', 'Boggle', 'Boink', 'Bonk', 'Boop', 'Bootle', 'Boozer', 'Bozo',
  'Brainy', 'Bumpy', 'Bungle', 'Burp', 'Chaos', 'Cheeto', 'Chonk',
  'Clank', 'Clonk', 'Crumbs', 'Crunch', 'Dingus',
  'Doink', 'Donk', 'Dork', 'Fiddle', 'Flabby', 'Flimflam', 'Floop', 'Flop',
  'Fuddle', 'Fuzz', 'Gabber', 'Gaggle', 'Giblet', 'Glop',
  'Goop', 'Guppy', 'Hodgepodge', 'Honk', 'Jelly', 'Jingle', 'Jitter', 'Jumble', 'Ketchup', 'Kibble', 'Knobby',
  'Meatloaf', 'Muddle', 'Mumble', 'Munchkin', 'Nifty', 'Nimble',
  'Oafy', 'Oodle', 'Plop', 'Plump',
  'Puddle', 'Rascal', 'Razzle', 'Sizzle', 'Snorkel', 'Snort', 'Squishy', 'Squonk',
  'Strudel', 'Stumble', 'Tangle', 'Thistle', 'Thump', 'Tumble', 'Waddle', 'Waffle',
  'Whimsy', 'Wobble', 'Yodel',
] as const;

/**
 * Pool of 500 funny surnames
 */
export const FUNNY_LAST_NAMES: readonly string[] = [
  // Silly Descriptive Surnames
  'Bigbottom', 'Bigfoot', 'Bighead', 'Bignose', 'Blooper', 'Blubberbutt', 'Bogglewoggle', 'Bonkers',
  'Bottlebottom', 'Bumblebee', 'Bumblesnatch', 'Bumpkin', 'Busybody', 'Butterfingers', 'Butterfuss', 'Caboodle',
  'Cankersore', 'Cattywampus', 'Chatterbox', 'Cheeseball', 'Cheesewiz', 'Chuckleberry', 'Chucklehead', 'Cloghopper',
  'Clodhopper', 'Clockhead', 'Clodpate', 'Clodpoll', 'Clompers', 'Clonkers', 'Clotterbuck', 'Clucksworth',
  'Clumpers', 'Codswallop', 'Crackerjack', 'Crankypants', 'Crinklebottom', 'Crumbcake', 'Crumbsnatcher', 'Crumplebottom',
  'Daffodoodle', 'Dillydally', 'Dimbulb', 'Dimwhistle', 'Dingleberry', 'Dinglehopper', 'Dinklebop', 'Dipstick',
  'Doohickey', 'Doodlebug', 'Doodlewhacker', 'Dorkface', 'Dorkington', 'Dottlepot', 'Dumbleton', 'Dumpling',

  // Food-Based Surnames
  'Applebottom', 'Applewhisker', 'Baconator', 'Bagelbiter', 'Bananafanna', 'Beefcake', 'Beefsquatch', 'Biscuit',
  'Brisket', 'Broccoli', 'Brownie', 'Bubblegum', 'Burrito', 'Butterbean', 'Butterbucket', 'Buttercup',
  'Butterworth', 'Cabbage', 'Cakebread', 'Candyapple', 'Carrotcake', 'Cheesecake', 'Cheesington', 'Cheesemonger',
  'Cheesewheel', 'Chickenfoot', 'Chili', 'Chocolat', 'Cobbler', 'Coconut', 'Cookie', 'Cornbread',
  'Corndog', 'Cornflake', 'Cornpone', 'Cracker', 'Crackpot', 'Crouton', 'Cupcake', 'Custard',
  'Doughboy', 'Doughnut', 'Dumplings', 'Eggroll', 'Fishstick', 'Flapjack', 'Frankfurter', 'Fritter',
  'Fudge', 'Gingerbread', 'Gingersnap', 'Goober', 'Gravy', 'Griddlecake', 'Gumball', 'Gumbo',
  'Gumdrop', 'Hamburger', 'Hashbrown', 'Honeybun', 'Honeycomb', 'Honeydew', 'Hotdog', 'Jambutter',
  'Jellybean', 'Jellyroll', 'Jiggledipple', 'Kumquat', 'Lollipop', 'Macaroni', 'Marshmallow', 'Marzipan',
  'Meatball', 'Meatloaf', 'Muffin', 'Muffinman', 'Mushroom', 'Mustard', 'Nacho', 'Noodle',
  'Noodlebrain', 'Nugget', 'Nutbutter', 'Oatmeal', 'Pancake', 'Peabody', 'Peanut', 'Peanutnoggin',
  'Peppercorn', 'Pickle', 'Picklebottom', 'Picklehead', 'Piecrust', 'Popcorn', 'Porkchop', 'Porkrind',
  'Potato', 'Pretzel', 'Pudding', 'Pumpernickel', 'Pumpkin', 'Ravioli', 'Sausage', 'Schnitzel',
  'Shortcake', 'Snickerdoodle', 'Spaghetti', 'Sprinkles', 'Strudel', 'Sugarbottom', 'Sugarplum', 'Sweetroll',
  'Taco', 'Taffy', 'Tater', 'Taterhead', 'Tatertot', 'Toastie', 'Toffee', 'Tomato',
  'Truffle', 'Turnip', 'Twinkie', 'Waffle', 'Wafflebottom', 'Wafflegobbler', 'Wiener', 'Yogurt',

  // Animal-Based Surnames
  'Badger', 'Beagle', 'Beaverton', 'Birdwhistle', 'Bobblewobble', 'Boobie', 'Buffaloberry', 'Bunny',
  'Bumblebottom', 'Chickenhead', 'Chickenwing', 'Chipmunk', 'Cluckington', 'Cockadoodle', 'Coot', 'Cowpoke',
  'Crabapple', 'Crabgrass', 'Dingbat', 'Dodo', 'Duckworth', 'Duckface', 'Fishbottom', 'Frogbottom',
  'Goose', 'Gooseberry', 'Hamster', 'Henbottom', 'Hippo', 'Hogbottom', 'Hogwash', 'Hootenstein',
  'Jellyfish', 'Kangaroo', 'Kipper', 'Ladybug', 'Lizardbreath', 'Lobster', 'Moose', 'Moosenuckle',
  'Otter', 'Otterpop', 'Owlbottom', 'Peacock', 'Penguin', 'Pigglesworth', 'Pigglywiggly', 'Poodle',
  'Porcupine', 'Quackenbush', 'Rabbit', 'Rabbitfoot', 'Raccoon', 'Rooster', 'Sheepshank', 'Skunk',
  'Snailsworth', 'Snorkelwhacker', 'Squirrel', 'Squirrelman', 'Tadpole', 'Ticklefeather', 'Toad', 'Toadstool',
  'Turkey', 'Turkeyneck', 'Turtle', 'Turtlebottom', 'Walrus', 'Weasel', 'Weaselton', 'Whippoorwill',
  'Wigglesworth', 'Woodchuck', 'Woodpecker', 'Worm', 'Wormwood', 'Yak',

  // Occupation/Action-Based Funny Surnames
  'Balderdash', 'Bamboozle', 'Befuddle', 'Blarney', 'Blatherskite', 'Blunderbuss', 'Bogtrotter', 'Bombast',
  'Boondoggle', 'Brouhaha', 'Buffoon', 'Bumblefudge', 'Cattercorner', 'Claptrap', 'Codpiece', 'Collywobbles',
  'Confuzzle', 'Conniption', 'Crotchety', 'Curmudgeon', 'Discombobulate', 'Dunderhead', 'Fiddle-faddle', 'Fiddlesticks',
  'Finagle', 'Flannel', 'Flibbertigibbet', 'Flimflam', 'Flimp', 'Flobbernocker', 'Flopsworth', 'Flummox',
  'Folderol', 'Fuddy-duddy', 'Gadabout', 'Gallivant', 'Gibberish', 'Gobbledygook', 'Gobsmack', 'Hanky-panky',
  'Harebrained', 'Higgledy-piggledy', 'Hobbledehoy', 'Hocus-pocus', 'Hodgepodge', 'Hogwallop', 'Hoity-toity', 'Hoodwink',
  'Hootenanny', 'Hullabaloo', 'Humbug', 'Jabber', 'Jiggery-pokery', 'Kerfuffle', 'Lickspittle', 'Lollygag',
  'Malarkey', 'Megillah', 'Mishmash', 'Mollycoddle', 'Monkeyshine', 'Muckraker', 'Mugwump', 'Mumbo-jumbo',
  'Namby-pamby', 'Nincompoop', 'Ninnyhammer', 'Noodlebrain', 'Palooka', 'Persnickety', 'Piddlewhacker', 'Piffle',
  'Poppycock', 'Ragamuffin', 'Rambunctious', 'Razzmatazz', 'Rigmarole', 'Ruckus', 'Rumpus', 'Scallywag',
  'Scalawag', 'Shenanigan', 'Skedaddle', 'Skulduggery', 'Slapdash', 'Slapstick', 'Slipshod', 'Snafu',
  'Snickersnack', 'Snobbish', 'Sockdolager', 'Snollygoster', 'Tomfoolery', 'Twaddle', 'Whatchamacallit', 'Whatnot',
  'Whiffenpoof', 'Whippersnapper', 'Whirligig', 'Whoopee', 'Widdershins', 'Wigglefuss', 'Zigzag', 'Zozzle',

  // Body Part Surnames
  'Bigbelly', 'Bignoggin', 'Chubcheeks', 'Cranklebones', 'Dimplecreek', 'Earwiggle', 'Fancypants',
  'Fatbottom', 'Fiveliver', 'Flappyears', 'Funkyfinger', 'Goofyfoot', 'Hairyface', 'Hardhead', 'Heavybottom',
  'Hotfoot', 'Knobbyknee', 'Leadbottom', 'Longnose', 'Loosejaw', 'Mushhead', 'Noodlearms', 'Nosepicker',
  'Pottybottom', 'Rubberlegs', 'Shakehands', 'Sillytoes', 'Squarejaw', 'Stiffneck', 'Swellhead', 'Thickskull',
  'Tightlips', 'Tinytoes', 'Wiggletoes', 'Wobbleknees',

  // Double-Barreled Funny Surnames
  'Bingle-Bongle', 'Dingle-Dangle', 'Flibber-Flobber', 'Giggle-Snort', 'Higgle-Piggle',
  'Jibber-Jabber', 'Knick-Knack', 'Mingle-Mangle', 'Pitter-Patter', 'Razzle-Dazzle', 'Rickety-Rackety',
  'Shilly-Shally', 'Snipper-Snapper', 'Topsy-Turvy', 'Wibble-Wobble', 'Wiggle-Waggle', 'Wishy-Washy',
  'Zigzag-Zoom', 'Zipper-Zapper',

  // Misc Funny Surnames
  'Absurd', 'Awkward', 'Backwards', 'Ballyhoo', 'Barnacle', 'Beanbag', 'Bedazzle', 'Befuddled',
  'Bellyache', 'Berserk', 'Bizarro', 'Blizzard', 'Blockhead', 'Blotch', 'Blunder',
  'Boinkers', 'Bollocks', 'Bonehead', 'Boobytrapped', 'Boomerang', 'Bottleneck', 'Bottoms-up', 'Bramble',
  'Brickbat', 'Bristle', 'Buckboard', 'Buckshot', 'Budgeworth', 'Bullfrog', 'Bumptious',
  'Bunion', 'Burble', 'Burperson', 'Bustle', 'Cabbagehead', 'Caboose', 'Cackle', 'Caddywhompus',
  'Calabash', 'Calamity', 'Canoodle', 'Cantankerous', 'Caper', 'Capsize', 'Carbuncle', 'Careen',
  'Carouse', 'Catastrophe', 'Caterwauling', 'Cavort', 'Cheapskate', 'Cheeky', 'Chintzy',
  'Chompers', 'Clamber', 'Clamor', 'Clanger', 'Clatter', 'Clinker', 'Clodpole', 'Clonkerbonk',
  'Clotterbrain', 'Clusterfudge', 'Cobbledash', 'Cockamamie', 'Coffeepot', 'Colander', 'Confabulate', 'Contraption',
  'Corkscrew', 'Cornucopia', 'Crackpottery', 'Cragglerock', 'Crankshaft', 'Crapshoot', 'Crinkle', 'Crispbottom',
  'Cromulent', 'Crook', 'Crumpet', 'Crustybutt', 'Cuckooclock', 'Currycomb', 'Cyclone', 'Danglemeyer',
] as const;

/**
 * Pool of 100 hilarious company names
 */
export const FUNNY_COMPANIES: readonly string[] = [
  // Pun-Based Company Names
  "Ain't Broke Don't Fix It Inc", 'All Thumbs Construction', 'Barely Legal Seafood', 'Better Call Maul Legal Services',
  'Bobs Your Uncle Hardware', 'Brewtiful Day Coffee Co', 'Butt Seriously Furniture', 'Cereal Killer Breakfast Bar',
  'Cheaper Than Dirt Gardening', 'Codfather Fish Market', 'Curl Up and Dye Hair Salon', 'Déjà Brew Coffee Shop',
  'Fiddler on the Roof Roofing', 'Florist Gump Flower Shop', 'For Goodness Bakes Bakery', 'Franks A Lot Hot Dogs',
  'Glaze of Glory Doughnut Shop', 'Grin and Bare It Dental', 'Hairway to Heaven Salon', 'Haulin Oats Moving Company',
  'How Dairy You Ice Cream', 'Hugs and Hisses Pet Store', 'Jamaican Me Hungry Restaurant', 'Jesus Chrysler Auto Repair',
  'Just Brews It Coffee House', 'Karmageddon Insurance', 'Knead It Bakery', 'Lawn Order Landscaping', 'Lettuce Turnip the Beet Produce',
  'Life is Brewtiful Café', 'Lord of the Fries Fast Food', 'Major Payne Medical Supplies', 'Mission Impastable Italian Restaurant',
  'Nacho Average Food Truck', 'Oakey Dokey Furniture', 'Outstanding in the Field Farming', 'Pane in the Glass Window Repair',
  'Panera Threat Sandwich Shop', 'Planet of the Grapes Wine Shop', 'Purrfect Paws Pet Grooming', 'Raising the Bar Saloon',
  'Rest Ashured Funeral Home', 'Risky Biscuit Café', 'Romancing the Scone Bakery', 'Sawdust is Man Glitter Workshop',
  'Sealed with a Fish Sushi Bar', 'Shear Madness Hair Salon', 'Ship Happens Shipping Co', 'Sofa King Good Furniture',
  'Son of a Bench Woodworking', 'Sore Thumb Construction', 'Spruce Wayne Tree Service', 'Supreme Cream Ice Cream Parlor',

  // Absurd Business Names
  'Accidental Genius Labs', 'Barely Functioning Adults Inc', 'Chaotic Good Manufacturing', 'Definitely Not a Cult LLC',
  'Extremely Specific Industries', 'Fake it Till You Make it Consulting', 'Generally Confused Services', 'Honest Mistakes Company',
  'Improbable Solutions Ltd', 'Just Winging It Aviation', 'Kinda Sorta Legal Affairs', 'Loosely Organized LLC',
  'Marginally Competent Contractors', 'Mostly Harmless Products', 'Nebulous Concepts Corporation', 'Occasionally Brilliant Ideas',
  'Pandemonium Management Group', 'Questionable Decisions LLC', 'Reasonably Suspicious Security', 'Semiannual Chaos Convention',
  'Tentatively Approved Services', 'Undeniably Confused Consulting', 'Vaguely Professional Services', 'Wildly Unprepared Adventures',
  'Xerox of a Xerox Quality', 'Yesterdays Tomorrow Inc', 'Zealously Average Company',

  // Silly Product/Service Names
  'Ankle Biters Daycare', 'Backyard Circus Productions', 'Bald and the Beautiful Wigs', 'Banana Hammock Swimwear', 'Bellybutton Lint Museum',
  'Bigfoot Detection Agency', 'Bouncy Castle Investments', 'Bubble Wrap Appreciation Society', 'Bubblegum Crisis Management', 'Chicken Dance Studios',
  'Clown College Dropout Services', 'Coconut Bra Emporium', 'Confused Penguin Publishing', 'Dancing Pickle Productions', 'Disco Nap Services',
  'Dramatic Chipmunk Media', 'Evil Genius Supply Co', 'Fancy Pants Gentleman\'s Club', 'Flying Circus Airlines', 'Giggle Fit Comedy Club',
  'Glitter Bomb Factory', 'Goofy Goober Industries', 'Grumpy Cat Productions', 'Inflatable Dartboard Company', 'Invisible Rope Store',
  'Knock Knock Joke Factory', 'Laughing Cow Productions', 'Left Handed Smoke Shifters', 'Moldy Cheese Appreciation Club', 'Mosquito Farming Inc',
  'Ninja Unicorn Studios', 'Nostril Hair Braiding Salon', 'Pants Optional Friday Inc', 'Rubber Chicken Factory', 'Screaming Goat Sanctuary',
  'Silly Walk Ministry', 'Sock Puppet Theater', 'Spaghetti Wrestling League', 'Square Watermelon Importers', 'Superhero Laundry Service',
  'Underwater Basket Weaving Co', 'Unicycle Rodeo Productions', 'Velcro Shoe Corporation', 'Whoopee Cushion Wholesalers', 'Yodeling School',
] as const;

/**
 * Pool of 50 funny email domains
 */
export const FUNNY_DOMAINS: readonly string[] = [
  // Silly Domain Extensions
  'giggle.com', 'snort.lol', 'haha.net', 'chuckle.biz', 'guffaw.io',
  'teehee.org', 'rofl.net', 'lmao.co', 'silly.zone', 'goofball.club',

  // Funny Service Domains
  'totally-not-spam.com', 'definitely-real.email', 'legit-business.biz', 'professional-ish.net', 'kinda-official.org',
  'spam-me-maybe.com', 'junk-mail-central.net', 'clickbait-heaven.io', 'suspicious-link.biz', 'phishing-probably-not.com',

  // Ridiculous Domains
  'whoops.oops', 'oopsie-daisy.com', 'my-bad.net', 'awkward.email', 'facepalm.org',
  'cringe.co', 'yikes.zone', 'oof.email', 'bruh.moment', 'big-oof.com',

  // Nonsense Domains
  'boop.beep', 'ding.dong', 'ping.pong', 'flip.flop', 'tick.tock',
  'zip.zap', 'boom.pow', 'snap.crackle', 'wiggle.waggle', 'zigzag.zoom',

  // Joke Domains
  'fake-email.fake', 'not-real.never', 'imaginary.invalid', 'made-up.nope', 'pretend.xyz',
  'banana.phone', 'cheese.wheel', 'potato.salad', 'noodle.soup', 'pickle.jar',
] as const;

// Type definitions
export type FunnyFirstName = typeof FUNNY_FIRST_NAMES[number];
export type FunnyLastName = typeof FUNNY_LAST_NAMES[number];
export type FunnyCompany = typeof FUNNY_COMPANIES[number];
export type FunnyDomain = typeof FUNNY_DOMAINS[number];
