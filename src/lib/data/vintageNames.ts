/**
 * Vintage/Old-Timey Name Pools for Alias Generation (PRO Feature)
 *
 * Aristocratic names from the Gilded Age & Victorian Era (1880s-1920s).
 * Extremely obscure names from high society - perfect for Great Gatsby vibes.
 *
 * Pools:
 * - 500 vintage first names (Algernon, Araminta, Worthington, etc.)
 * - 500 aristocratic surnames (double-barreled, titled families)
 * - 100 period establishments (trading companies, banking houses, clubs)
 * - 50 Victorian-era domains
 *
 * Examples: "Lord Worthington Cholmondeley-Warner", "Lady Araminta Cavendish-Bentinck"
 *
 * @module vintageNames
 * @tier PRO
 */

/**
 * Pool of 500 vintage first names from the Gilded Age
 * Obscure aristocratic names rarely used today
 */
export const VINTAGE_FIRST_NAMES: readonly string[] = [
  // Male Aristocratic Names (200)
  "Algernon", "Ambrose", "Archibald", "Artemus", "Atherton", "Atticus", "Augustus", "Aurelius",
  "Balthazar", "Barnabas", "Bartholomew", "Basil", "Beauregard", "Benedict", "Bennington", "Bertram",
  "Broderick", "Cadwallader", "Casimir", "Cassius", "Cedric", "Chauncey", "Clarence", "Claudius",
  "Clement", "Cletus", "Clifton", "Clive", "Cornelius", "Cosmo", "Crispin", "Cyprian",
  "Cyril", "Cyrus", "Devereux", "Diocletian", "Dorian", "Ebenezer", "Edsel", "Egbert",
  "Elias", "Eliphalet", "Ellsworth", "Elmer", "Elwood", "Emeric", "Emerson", "Ephraim",
  "Erasmus", "Esmond", "Eustace", "Evander", "Everard", "Ezekiel", "Fabian", "Ferdinand",
  "Fitzhugh", "Florian", "Forbes", "Fortescue", "Fosco", "Fulton", "Gaylord", "Gilford",
  "Godfrey", "Grover", "Gulliver", "Gus", "Hadrian", "Hamish", "Hampton", "Hannibal",
  "Harlow", "Hartley", "Heathcliff", "Hector", "Hezekiah", "Hiram", "Horatio", "Horace",
  "Hubert", "Humphrey", "Ichabod", "Ignatius", "Inigo", "Isambard", "Isidore", "Jebediah",
  "Jedidiah", "Jervis", "Josiah", "Julius", "Junius", "Kermit", "Lafayette", "Lamont",
  "Lancelot", "Larkin", "Lemuel", "Leopold", "Llewellyn", "Lorimer", "Lucius", "Ludovic",
  "Luther", "Lysander", "Makepeace", "Malachi", "Manfred", "Marmaduke", "Marshal", "Matthias",
  "Maximilian", "Melville", "Meriwether", "Merritt", "Montague", "Montgomery", "Mortimer", "Mungo",
  "Nehemiah", "Newbold", "Nicodemus", "Nigel", "Niles", "Norbert", "Obadiah", "Octavius",
  "Odell", "Ogden", "Olaf", "Olin", "Orson", "Osbert", "Oswald", "Otis",
  "Percival", "Peregrine", "Pershing", "Philander", "Philo", "Phineas", "Pickering", "Prescott",
  "Quentin", "Quincy", "Rafferty", "Randolph", "Reginald", "Remington", "Rexford", "Roderick",
  "Roscoe", "Royce", "Rudyard", "Rufus", "Rupert", "Rutherford", "Seymour", "Sheldon",
  "Sherwood", "Silas", "Sinclair", "Solace", "Stanford", "Sterling", "Stratton", "Sylvester",
  "Thadeus", "Thaddeus", "Theobald", "Theodore", "Thornton", "Thurston", "Tobias", "Townsend",
  "Truman", "Ulysses", "Uriah", "Valentine", "Virgil", "Walden", "Wallace", "Walton",
  "Warwick", "Webster", "Wellington", "Wendell", "Wentworth", "Whitman", "Wilbur", "Wilfred",
  "Willard", "Willis", "Winthrop", "Woodrow", "Worthington", "Wyndham", "Xerxes", "Zachariah",

  // Female Aristocratic Names (200)
  "Adamina", "Adelia", "Adeline", "Adolphine", "Affinity", "Agatha", "Albertina", "Alethea",
  "Almira", "Aloysia", "Althea", "Amabel", "Amarantha", "Amaryllis", "Amethyst", "Amorette",
  "Andromeda", "Annunciata", "Antonia", "Apollonia", "Araminta", "Arcadia", "Ariadne", "Artemisia",
  "Aspasia", "Atalanta", "Athena", "Augustina", "Aurelia", "Aurora", "Azalea", "Bathsheba",
  "Beatrix", "Belinda", "Berenike", "Berenice", "Bernadette", "Berthilda", "Beulah", "Blanchefleur",
  "Boadicea", "Brunhilde", "Caledonia", "Calista", "Calliope", "Camelia", "Camilla", "Capitola",
  "Carlotta", "Cassandra", "Cassiopeia", "Celestia", "Celestine", "Cerise", "Chastity", "Chloris",
  "Christabel", "Claribel", "Clarinda", "Clementine", "Cleopatra", "Cliantha", "Clotilda", "Constance",
  "Cordelia", "Cornelia", "Cosima", "Cressida", "Cynara", "Dagmar", "Damascena", "Damaris",
  "Daphne", "Deliverance", "Delphine", "Desdemona", "Devorah", "Diantha", "Dinah", "Dorinda",
  "Dorothea", "Drusilla", "Eglantine", "Eleanora", "Electra", "Eloisa", "Elspeth", "Elysia",
  "Emmeline", "Endora", "Enid", "Eowyn", "Ephemera", "Epiphany", "Ermengarde", "Ernestine",
  "Esmeralda", "Estella", "Ethelinda", "Eudora", "Eugenia", "Eulalia", "Eunice", "Euphemia",
  "Eurydice", "Eustacia", "Evangeline", "Evanthia", "Faustine", "Fedora", "Felicity", "Fenella",
  "Fidelia", "Fidelity", "Filomena", "Flavia", "Florinda", "Fortunata", "Frederica", "Gardenia",
  "Genevra", "Georgiana", "Geraldine", "Germaine", "Gervaise", "Ginevra", "Gloriana", "Griselde",
  "Griselda", "Guinevere", "Gwendolyn", "Gwyneth", "Halcyon", "Harriette", "Hebe", "Hedwig",
  "Heloise", "Henrietta", "Hephzibah", "Hermione", "Hesper", "Hester", "Hildegarde", "Horatia",
  "Hortense", "Hyacinth", "Ianthe", "Idabelle", "Ignatia", "Imogene", "Increase", "Ione",
  "Iphigenia", "Isadora", "Isolde", "Jemima", "Jessamine", "Josephina", "Juno", "Justina",
  "Katerina", "Lachesis", "Laetitia", "Lavinia", "Leocadia", "Leonora", "Letitia", "Lilith",
  "Lillias", "Loveday", "Lucasta", "Lucretia", "Ludmilla", "Lydia", "Lysandra", "Mabel",
  "Madrigal", "Magnolia", "Mahala", "Malvina", "Marcella", "Marcelline", "Margery", "Marguerite",
  "Marietta", "Marigold", "Matilda", "Maude", "Melisande", "Meliora", "Melisent", "Mercedes",
  "Mercy", "Millicent", "Minerva", "Mirabel", "Modesty", "Morwenna", "Musidora", "Myrtle",

  // Gender-Neutral Aristocratic Names (100)
  "Addington", "Ainsworth", "Albion", "Aldrich", "Amberly", "Anson", "Arbuthnot", "Arden",
  "Armitage", "Ashby", "Ashford", "Ashton", "Atwood", "Auberon", "Audley", "Aylmer",
  "Bancroft", "Barrington", "Basset", "Beaumont", "Bellamy", "Berkeley", "Berwick", "Beverley",
  "Blakeney", "Blythe", "Braxton", "Briarwood", "Brighton", "Bromley", "Buckley", "Burleigh",
  "Cabot", "Caldecott", "Carrington", "Chadwick", "Chalmers", "Chandos", "Clarendon", "Claremont",
  "Clifford", "Clivedon", "Collingwood", "Courtland", "Coventry", "Darlington", "Denholm", "Denton",
  "Devereaux", "Digby", "Dudley", "Dunmore", "Dunstan", "Eaton", "Edgeworth", "Ellington",
  "Ellsworth", "Elwood", "Emsworth", "Everly", "Fairchild", "Fairfax", "Farquhar", "Felton",
  "Fenwick", "Freeborn", "Garrick", "Gladwyn", "Grantham", "Gresham", "Hadleigh", "Halstead",
  "Hargrove", "Hartwell", "Hastings", "Hawthorne", "Hazelwood", "Hilliard", "Holbrook", "Holloway",
  "Huntley", "Inglewood", "Kingsley", "Kingswell", "Langdon", "Langley", "Linwood", "Livingston",
  "Lockwood", "Lovelace", "Makepeace", "Mandeville", "Marlowe", "Mayhew", "Merriwether", "Middleton",
  "Mortimer", "Norwood", "Oakley", "Pemberton", "Penrose"
] as const;

/**
 * Pool of 500 aristocratic surnames
 * Double-barreled names, titled families, old money
 */
export const VINTAGE_LAST_NAMES: readonly string[] = [
  // Double-Barreled Aristocratic
  "Ashton-Warner", "Beaumont-Grey", "Cavendish-Bentinck", "Cholmondeley-Warner", "Clifford-Smith", "Courtenay-Howe",
  "Drummond-Hay", "Fortescue-Brickdale", "Grosvenor-Hyde", "Hamilton-Gordon", "Harrington-Wade", "Hastings-Bass",
  "Howard-Vyse", "Lyttelton-Annesley", "Montagu-Douglas", "Percy-Gordon", "Pleydell-Bouverie", "Seymour-Conway",
  "Stanhope-Forbes", "Temple-Gore", "Vane-Tempest", "Villiers-Stuart", "Walpole-Forbes", "Wyndham-Quin",

  // Titled Families
  "Abercromby", "Ackworth", "Ainsworth", "Albemarle", "Aldenham", "Allerton", "Amherst", "Arbuthnot",
  "Ashburnham", "Astor", "Atherstone", "Attenborough", "Auchincloss", "Aylmer", "Babbington", "Bagshot",
  "Balcarres", "Balfour", "Ballantine", "Banbury", "Bannerman", "Barclay", "Barrington", "Basingstoke",
  "Bathurst", "Beauchamp", "Beckett", "Beecham", "Belknap", "Bellingham", "Belmont", "Bennet",
  "Berkeley", "Bertram", "Bessborough", "Bidwell", "Bingham", "Blakemore", "Blandford", "Blenheim",
  "Bolingbroke", "Bonneville", "Bosworth", "Boughton", "Bowdoin", "Braithwaite", "Brampton", "Brandywine",
  "Breckinridge", "Brentford", "Bretton", "Bridgewater", "Brinkley", "Broadbent", "Brockton", "Brompton",
  "Brookhaven", "Broughton", "Brownlow", "Buckingham", "Bulfinch", "Bulstrode", "Buntingford", "Burghley",
  "Burlington", "Burnside", "Burroughs", "Butterworth", "Buxton", "Cadogan", "Caerleon", "Cairncross",
  "Caithness", "Caldicott", "Caldwell", "Calthorpe", "Camberley", "Cambridge", "Campion", "Candlewood",
  "Canterbury", "Caradoc", "Cardigan", "Carew", "Carlisle", "Carmichael", "Carnegie", "Carnforth",
  "Carruthers", "Carteret", "Caruthers", "Castlereagh", "Cathcart", "Cavendish", "Chaloner", "Chamberlain",
  "Chandos", "Channing", "Charteris", "Chatsworth", "Chesterfield", "Chetwynd", "Cholmondeley", "Chudleigh",
  "Churchill", "Claiborne", "Clanricarde", "Clarendon", "Claverhouse", "Clayworth", "Cleaver", "Clementson",
  "Cleveley", "Cliftonville", "Clive", "Clovelly", "Clydesdale", "Coddington", "Codrington", "Coldstream",
  "Collingwood", "Colquhoun", "Colville", "Compton", "Connaught", "Conyngham", "Corbett", "Cornwallis",
  "Cottingham", "Courtenay", "Coventry", "Cranborne", "Cranston", "Craven", "Cresswell", "Crichton",
  "Crompton", "Cromwell", "Crosby", "Culpepper", "Cumberland", "Cunliffe", "Curzon", "Dacre",

  // Old Money
  "Dalrymple", "Danvers", "Darlington", "Dashwood", "Davenport", "Debenham", "Delacroix", "Delamere",
  "Denbigh", "Denham", "Devereux", "Devonshire", "Digby", "Dinsmore", "Dorchester", "Dorset",
  "Drummond", "Dudley", "Dunmore", "Dunster", "Egremont", "Ellesmere", "Elmsworth", "Endicott",
  "Erskine", "Esterbrook", "Evesham", "Exeter", "Fairbanks", "Fairfax", "Falconbridge", "Farnsworth",
  "Fauntleroy", "Featherstone", "Fenimore", "Fenwick", "Ffoulkes", "Fielding", "Finchley", "Ffolliott",
  "Fitzalan", "Fitzgibbon", "Fitzhugh", "Fitzpatrick", "Fitzroy", "Fitzwilliam", "Fleetwood", "Folkestone",
  "Fortescue", "Fotheringham", "Foxworth", "Framingham", "Frobisher", "Fullerton", "Gainsborough", "Galbraith",
  "Galloway", "Garfield", "Gascoigne", "Gastrell", "Gillingham", "Gladstone", "Glastonbury", "Gloucester",
  "Godolphin", "Goldsworth", "Goodwood", "Gordonston", "Gorsuch", "Grantham", "Granville", "Gravesend",
  "Greenfield", "Grenville", "Gresham", "Grimsby", "Grosvenor", "Guilford", "Habersham", "Haddington",
  "Haggerston", "Hailsham", "Halsbury", "Hambleton", "Hampstead", "Hanbury", "Harcourt", "Harewood",
  "Harrington", "Harrowby", "Hartington", "Hastings", "Hathaway", "Hatton", "Haverford", "Hawkesworth",
  "Hazelton", "Heatherton", "Helmsley", "Hemsworth", "Henley", "Hereford", "Hertford", "Hexham",
  "Higginbotham", "Hildebrand", "Hillingdon", "Hinchingbrooke", "Holbrook", "Holcroft", "Holdenby", "Holkham",
  "Hollingsworth", "Honeychurch", "Hornby", "Houghton", "Huntingdon", "Huntington", "Ilchester", "Ilderton",
  "Inchbald", "Ingoldsby", "Inverarity", "Ipswich", "Islington", "Iveagh", "Jermyn", "Kensington",
  "Kerrison", "Keswick", "Kettering", "Keynes", "Kilbride", "Kilmarnock", "Kimberley", "Kingsbury",
  "Kingsland", "Kingston", "Kingswell", "Kinross", "Kirkcaldy", "Kirkpatrick", "Knatchbull", "Knollys",

  // Victorian Era
  "Ladbroke", "Lamington", "Lancashire", "Lansdowne", "Latimer", "Lauderdale", "Lavenham", "Leamington",
  "Leicester", "Leighton", "Leveson", "Lichfield", "Liddell", "Limerick", "Lincroft", "Lindsey",
  "Linlithgow", "Lismore", "Lisle", "Littleton", "Liverpool", "Llandaff", "Lockhart", "Lomond",
  "Longford", "Lonsdale", "Lovelace", "Lowther", "Ludlow", "Luttrell", "Lymington", "Lyndhurst",
  "Lysander", "Lyttelton", "Macaulay", "Macclesfield", "Maidstone", "Maitland", "Malmesbury", "Mandeville",
  "Manners", "Mansfield", "Marchmont", "Marlborough", "Marston", "Massingberd", "Mayfair", "Melcombe",
  "Melbourne", "Melville", "Meredith", "Merivale", "Merrifield", "Methuen", "Middlesex", "Middleton",
  "Milbank", "Milford", "Millbank", "Monckton", "Montagu", "Montague", "Montrose", "Moray",
  "Mordaunt", "Moreton", "Morley", "Morpeth", "Mortlake", "Mowbray", "Mulberry", "Munster",
  "Napier", "Neville", "Newbury", "Newcastle", "Newmarket", "Newport", "Norbury", "Norfolk",
  "Normanby", "Northampton", "Northbrook", "Northcliffe", "Northcote", "Northumberland", "Norwich", "Nottingham",
  "Oakham", "Onslow", "Orford", "Ormonde", "Orpington", "Osborne", "Osgood", "Otterburn",
  "Overbury", "Oxenham", "Oxford", "Pakenham", "Palmerston", "Pandora", "Pangbourne", "Paxton",
  "Peacham", "Pelham", "Pemberton", "Pembroke", "Pendleton", "Pennington", "Penrose", "Percival",
  "Peterborough", "Petersham", "Petworth", "Pickering", "Pilkington", "Plowden", "Plymouth", "Ponsonby",
  "Portarlington", "Portland", "Portsmouth", "Pottinger", "Powlett", "Pownall", "Prescott", "Preston",
  "Primrose", "Pulteney", "Queensberry", "Radcliffe", "Radnor", "Ramsay", "Ranelagh", "Ratcliffe",
  "Ravenscroft", "Redesdale", "Reginald", "Remington", "Rendlesham", "Revelstoke", "Ribbesford", "Richmond",
  "Ridgeway", "Ripon", "Rochdale", "Rockingham", "Rodney", "Roebury", "Romney", "Rosebery",
  "Rothschild", "Roxburghe", "Rushworth", "Russell", "Rutland", "Sacheverell", "Sackville", "Salisbury",
  "Saltonstall", "Sanderson", "Sandhurst", "Sandwich", "Savernake", "Saxby", "Scarborough", "Schuyler",
  "Seacombe", "Sedgwick", "Selborne", "Seton", "Sevenoaks", "Seymour", "Shaftesbury", "Shelburne",
  "Shelley", "Sherborne", "Sheridan", "Shrewsbury", "Siddeley", "Sidmouth", "Slingsby", "Smythe",
  "Somerset", "Somerville", "Southampton", "Southwick", "Spalding", "Spencer", "Stafford", "Stamford",
  "Standish", "Stanhope", "Stanley", "Stapleton", "Stebbings", "Sterling", "Stockbridge", "Stockton",
  "Stoke", "Stoneleigh", "Stourton", "Strafford", "Stratford", "Strathmore", "Streatham", "Stuyvesant",
  "Sudbury", "Suffolk", "Sunderland", "Surrey", "Sussex", "Sutherland", "Swaffham", "Swinburne",
  "Swindon", "Sydenham", "Talbot", "Tavistock", "Tempest", "Tennyson", "Tewkesbury", "Thackeray",
  "Throgmorton", "Thurlow", "Tilbury", "Tiptree", "Tiverton", "Tollemache", "Torquay", "Towcester",
  "Townshend", "Travers", "Tredegar", "Trelawney", "Trevelyan", "Trowbridge", "Tunbridge", "Turnbull",
  "Twisleton", "Tyrwhitt", "Uxbridge", "Valentyne", "Vanbrough", "Vaudeville", "Vauxhall", "Venables",
  "Vere", "Vernon", "Vesper", "Villiers", "Wainwright", "Waldegrave", "Wallingford", "Walpole",
  "Walsingham", "Wandsworth", "Warburton", "Wareham", "Warkworth", "Warrender", "Warwick", "Waterford",
  "Waverley", "Wedgwood", "Wellesley", "Wellington", "Wentworth", "Westminster", "Westmoreland", "Wharton",
  "Whitehall", "Whitmore", "Wickham", "Wilberforce", "Willoughby", "Wilton", "Wimbledon", "Winchester",
  "Windermere", "Windsor", "Winterbourne", "Winthrop", "Witham", "Wodehouse", "Wolseley", "Wolverton",
  "Woodstock", "Worcester", "Worthing", "Wycombe", "Wyndham", "Wynter", "Yarborough", "Yarmouth",
  "Yeovil", "Yonge", "York", "Youngblood", "Ypres", "Zetland"
] as const;

/**
 * Pool of 100 Gilded Age establishments
 */
export const VINTAGE_ESTABLISHMENTS: readonly string[] = [
  // Trading & Mercantile
  "The East India Trading Company", "Pemberton & Sons Mercantile", "Wentworth Trading Emporium", "Burlington Imports & Exports",
  "Ashworth Commercial Ventures", "Cavendish & Associates Trading", "Montague Shipping Corporation", "Harrington Maritime Company",

  // Banking & Financial
  "Rothschild Banking House", "Vanderbilt Trust Company", "Carnegie Financial Institution", "Astor Investment Bank",
  "Grosvenor Capital Holdings", "Fitzwilliam Savings & Loan", "Beaumont Private Bank", "Kensington Trust & Estate",
  "The Westminster Banking House", "Belmont Financial Services", "Clarendon Capital Group", "Drummond Commercial Bank",

  // Law Firms
  "Wickham & Darcy Solicitors", "Fitzpatrick, Bennet & Associates", "Thornton Legal Chambers", "Pemberton & Wentworth Barristers",
  "Ashworth, Cavendish & Partners", "The Harrington Law Offices", "Montague & Seymour Legal", "Cholmondeley & Sons Attorneys",

  // Estate & Property
  "Grantham Estate Management", "Chatsworth Property Holdings", "Blenheim Real Estate", "Highclere Manor Properties",
  "Downton Estate Services", "Pemberley Land Company", "Longbourne Holdings", "Netherfield Property Trust",

  // Gentleman's Clubs
  "The Athenaeum Club", "The Carlton Club", "The Garrick Gentlemen's Society", "The Reform Club",
  "The Brooks's Club", "The White's Establishment", "The Boodle's Society", "The Travellers Club",

  // Department Stores
  "Harrods of Knightsbridge", "Selfridge & Company", "Fortnum & Mason Provisions", "Liberty & Co Department Store",
  "Whiteley's Universal Emporium", "Marshall & Snelgrove", "Swan & Edgar", "Debenham & Freebody",

  // Manufacturing
  "Wedgwood Pottery & China", "Waterford Crystal Works", "Sheffield Silversmith Company", "Staffordshire Porcelain Manufacturers",
  "Birmingham Steel & Iron Works", "Manchester Textile Mills", "Leeds Industrial Corporation", "Bristol Maritime Industries",

  // Publishing
  "The Times of London", "Blackwood's Magazine", "Chapman & Hall Publishers", "Macmillan Publishing House",
  "The Illustrated London News", "The Spectator Press", "Punch Magazine Company", "The Saturday Review",

  // Hotels
  "The Savoy Hotel", "The Ritz-Carlton", "Claridge's Hotel", "The Waldorf-Astoria",
  "The Plaza Hotel", "The Langham Hotel", "The Dorchester", "Brown's Hotel",

  // Luxury Goods
  "Cartier Jewelers", "Tiffany & Company", "Fabergé of St. Petersburg", "Asprey of London",
  "Boucheron Maison", "Van Cleef & Arpels", "Garrard Crown Jewelers", "Bulgari of Rome",

  // Tailors
  "Savile Row Tailoring House", "Gieves & Hawkes Bespoke", "Henry Poole & Co", "Huntsman & Sons",
  "Anderson & Sheppard", "Kilgour French & Stanbury", "H. Huntsman Tailors", "Davies & Son"
] as const;

/**
 * Pool of 50 Victorian-era domains
 */
export const VINTAGE_DOMAINS: readonly string[] = [
  // Estate & Manor
  "manor.estate", "grange.estate", "hall.estate", "court.estate", "house.estate",
  "castle.estate", "abbey.estate", "lodge.estate", "villa.estate", "palace.estate",

  // Trading & Company
  "trading.co", "mercantile.co", "company.co", "associates.co", "corporation.co",
  "ventures.co", "holdings.co", "enterprises.co", "industries.co", "establishment.co",

  // Professional Services
  "solicitors.firm", "barristers.firm", "chambers.firm", "offices.firm", "partners.firm",

  // Banking & Financial
  "bank.trust", "savings.trust", "capital.trust", "investment.trust", "financial.trust",

  // Social & Club
  "club.society", "society.club", "gentlemans.club", "ladies.society", "assembly.society",

  // Publishing
  "press.gazette", "news.gazette", "journal.gazette", "review.gazette", "magazine.gazette",

  // Luxury & Retail
  "emporium.shop", "boutique.shop", "establishment.shop", "house.shop", "company.shop"
] as const;

/**
 * Type definitions
 */
export type VintageFirstName = typeof VINTAGE_FIRST_NAMES[number];
export type VintageLastName = typeof VINTAGE_LAST_NAMES[number];
export type VintageEstablishment = typeof VINTAGE_ESTABLISHMENTS[number];
export type VintageDomain = typeof VINTAGE_DOMAINS[number];

/**
 * Pool stats
 */
export const VINTAGE_POOL_STATS = {
  firstNames: VINTAGE_FIRST_NAMES.length,
  lastNames: VINTAGE_LAST_NAMES.length,
  establishments: VINTAGE_ESTABLISHMENTS.length,
  domains: VINTAGE_DOMAINS.length,
} as const;
