/**
 * Name Pools for Alias Generation
 *
 * Pre-built data pools for generating realistic fake identities.
 * No AI needed - instant generation, works offline.
 *
 * Pools:
 * - 500 first names (200 male, 200 female, 100 neutral)
 * - 500 last names (diverse cultural backgrounds)
 * - 100 company names
 * - 50 email domains
 *
 * @module namePools
 */

/**
 * Pool of 500 diverse first names
 * Distribution: 200 male, 200 female, 100 gender-neutral
 */
export const FIRST_NAMES: readonly string[] = [
  // Traditionally Male Names (200)
  "James", "Michael", "Robert", "John", "David", "William", "Richard", "Joseph",
  "Thomas", "Christopher", "Charles", "Daniel", "Matthew", "Anthony", "Mark", "Donald",
  "Steven", "Andrew", "Paul", "Joshua", "Kenneth", "Kevin", "Brian", "George",
  "Timothy", "Ronald", "Edward", "Jason", "Jeffrey", "Ryan", "Jacob", "Gary",
  "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon",
  "Benjamin", "Samuel", "Raymond", "Gregory", "Frank", "Alexander", "Patrick", "Jack",
  "Dennis", "Jerry", "Tyler", "Aaron", "Jose", "Adam", "Nathan", "Douglas",
  "Henry", "Zachary", "Peter", "Kyle", "Noah", "Walter", "Ethan", "Jeremy",
  "Harold", "Keith", "Christian", "Roger", "Gerald", "Carl", "Terry", "Sean",
  "Arthur", "Austin", "Lawrence", "Jesse", "Dylan", "Albert", "Joe", "Bryan",
  "Billy", "Bruce", "Willie", "Jordan", "Ralph", "Roy", "Eugene", "Randy",
  "Vincent", "Russell", "Louis", "Philip", "Bobby", "Johnny", "Bradley", "Mason",

  // Hispanic/Latin Male Names
  "Carlos", "Juan", "Miguel", "Luis", "Antonio", "Francisco", "Manuel", "Jorge",
  "Pedro", "Alejandro", "Rafael", "Roberto", "Fernando", "Ricardo", "Javier", "Diego",
  "Sergio", "Eduardo", "Andres", "Pablo", "Oscar", "Raul", "Enrique", "Marco",

  // Asian Male Names
  "Wei", "Chen", "Ming", "Jun", "Yuki", "Hiroshi", "Kenji", "Takeshi",
  "Jin", "Raj", "Arjun", "Rohan", "Amit", "Vikram", "Kiran", "Ravi",
  "Thanh", "Minh", "Duc", "Long", "Sung", "Hyun", "Min-jun", "Ji-hoon",

  // African/Middle Eastern Male Names
  "Mohammed", "Hassan", "Omar", "Ibrahim", "Malik", "Khalid", "Jamal", "Marcus",
  "Darius", "Jabari", "Kwame", "Tariq", "Rashid", "Amir", "Zain", "Karim",

  // European Male Names
  "Liam", "Oliver", "Lucas", "Leo", "Felix", "Hugo", "Emil", "Lars",
  "Ivan", "Dmitri", "Andrei", "Nikolai", "Alessandro", "Matteo", "Giovanni", "Luca",

  // Traditionally Female Names (200)
  "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan", "Jessica",
  "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra", "Ashley",
  "Kimberly", "Emily", "Donna", "Michelle", "Carol", "Amanda", "Dorothy", "Melissa",
  "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen", "Amy",
  "Angela", "Shirley", "Anna", "Brenda", "Pamela", "Emma", "Nicole", "Helen",
  "Samantha", "Katherine", "Christine", "Debra", "Rachel", "Carolyn", "Janet", "Catherine",
  "Maria", "Heather", "Diane", "Ruth", "Julie", "Olivia", "Joyce", "Virginia",
  "Victoria", "Kelly", "Lauren", "Christina", "Joan", "Evelyn", "Judith", "Megan",
  "Andrea", "Cheryl", "Hannah", "Jacqueline", "Martha", "Gloria", "Teresa", "Ann",
  "Sara", "Madison", "Frances", "Kathryn", "Janice", "Jean", "Abigail", "Sophia",
  "Alice", "Judy", "Isabella", "Julia", "Grace", "Amber", "Denise", "Danielle",
  "Marilyn", "Beverly", "Charlotte", "Natalie", "Theresa", "Diana", "Brittany", "Doris",
  "Kayla", "Alexis", "Lori", "Marie", "Ella", "Avery", "Claire", "Lillian",

  // Hispanic/Latin Female Names
  "Ana", "Carmen", "Rosa", "Teresa", "Lucia", "Elena", "Sofia", "Isabel",
  "Gabriela", "Adriana", "Daniela", "Valentina", "Camila", "Natalia", "Paula", "Beatriz",
  "Mariana", "Carolina", "Juliana", "Andrea", "Veronica", "Claudia", "Silvia", "Diana",

  // Asian Female Names
  "Li", "Ying", "Mei", "Yuki", "Sakura", "Aiko", "Hana", "Yui",
  "Priya", "Ananya", "Diya", "Kavya", "Aarti", "Neha", "Pooja", "Shreya",
  "Linh", "Mai", "Lan", "Hoa", "Min", "Soo", "Hye", "Ji-woo",

  // African/Middle Eastern Female Names
  "Fatima", "Zainab", "Amina", "Leila", "Ayesha", "Yasmin", "Aaliyah", "Nia",
  "Zuri", "Amara", "Imani", "Khadija", "Noor", "Zahra", "Layla", "Safiya",

  // European Female Names
  "Ava", "Mia", "Luna", "Sophie", "Amelie", "Freya", "Ingrid", "Astrid",
  "Katarina", "Natasha", "Svetlana", "Olga", "Francesca", "Chiara", "Giulia", "Valentina",

  // Gender-Neutral Names (100)
  "Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Avery", "Quinn",
  "Sage", "River", "Phoenix", "Rowan", "Jamie", "Jesse", "Cameron", "Dakota",
  "Skylar", "Charlie", "Parker", "Finley", "Peyton", "Reese", "Blake", "Hayden",
  "Emerson", "Drew", "Dylan", "Kai", "Micah", "Ash", "Elliot", "Bailey",
  "Sawyer", "Kendall", "Devon", "Payton", "Angel", "Armani", "Remy", "Jules",
  "Sidney", "Marlowe", "Shiloh", "Gray", "Oakley", "Justice", "Monroe", "Eden",
  "Darby", "Hollis", "Lennox", "Sutton", "Ellis", "Arden", "Everett", "Harper",
  "Sloane", "Tatum", "Winter", "August", "Brooks", "Collins", "Bellamy", "Chandler",
  "Corey", "Devin", "Frankie", "Harley", "Indigo", "Jaden", "Kennedy", "Lane",
  "London", "Memphis", "Milan", "Navy", "Ocean", "Palmer", "Royal", "Salem",
  "Shay", "Spencer", "Storm", "True", "Valentine", "West", "Zion", "Cypress",
  "Dallas", "Denver", "Harbor", "Journey", "Lyric", "Poet", "Rain",
  "Shadow", "Timber", "Vale", "Wilde"
] as const;

/**
 * Pool of 500 common surnames from diverse backgrounds
 */
export const LAST_NAMES: readonly string[] = [
  // Very Common English Surnames
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
  "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker",
  "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris", "Morales", "Murphy",
  "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper", "Peterson", "Bailey",
  "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza",
  "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers",
  "Long", "Ross", "Foster", "Jimenez", "Powell", "Jenkins", "Perry", "Russell",

  // Additional Common Surnames
  "Sullivan", "Bell", "Coleman", "Butler", "Henderson", "Barnes", "Gonzales", "Fisher",
  "Vasquez", "Simmons", "Romero", "Jordan", "Patterson", "Alexander", "Hamilton", "Graham",
  "Reynolds", "Griffin", "Wallace", "Moreno", "West", "Cole", "Hayes", "Bryant",
  "Herrera", "Gibson", "Ellis", "Tran", "Medina", "Aguilar", "Stevens", "Murray",
  "Ford", "Castro", "Marshall", "Owens", "Harrison", "Fernandez", "McDonald", "Woods",
  "Washington", "Kennedy", "Wells", "Vargas", "Henry", "Chen", "Freeman", "Webb",
  "Tucker", "Guzman", "Burns", "Crawford", "Olson", "Simpson", "Porter", "Hunter",
  "Gordon", "Mendez", "Silva", "Shaw", "Snyder", "Mason", "Dixon", "Munoz",

  // Hispanic/Latin Surnames
  "Delgado", "Rios", "Morales", "Acosta", "Guerrero", "Cortez", "Rojas", "Soto",
  "Contreras", "Luna", "Espinoza", "Maldonado", "Calderon", "Fuentes", "Campos", "Cervantes",
  "Figueroa", "Velasquez", "Salazar", "Ochoa", "Dominguez", "Pacheco", "Vargas", "Valdez",
  "Navarro", "Estrada", "Sandoval", "Mejia", "Ibarra", "Cardenas", "Pena", "Santos",

  // Asian Surnames
  "Wang", "Zhang", "Liu", "Li", "Chen", "Yang", "Huang", "Zhao",
  "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo",
  "Lin", "He", "Gao", "Liang", "Zheng", "Luo", "Song", "Tang",
  "Yamamoto", "Tanaka", "Suzuki", "Watanabe", "Ito", "Nakamura", "Kobayashi", "Sato",
  "Kato", "Yoshida", "Yamada", "Sasaki", "Kumar", "Singh", "Sharma", "Patel",
  "Gupta", "Reddy", "Kapoor", "Mehta", "Shah", "Joshi", "Desai", "Rao",
  "Park", "Choi", "Jung", "Kang", "Cho", "Yoon", "Jang", "Lim",
  "Le", "Tran", "Pham", "Hoang", "Vo", "Dang", "Bui", "Do",

  // African/Middle Eastern Surnames
  "Ahmed", "Ali", "Hassan", "Mohamed", "Ibrahim", "Mahmoud", "Abdullah", "Khalil",
  "Rahman", "Hussain", "Karim", "Khan", "Malik", "Youssef", "Nasser", "Omar",
  "Okafor", "Adeyemi", "Mwangi", "Abdi", "Dlamini", "Mbeki", "Okeke", "Diop",

  // European Surnames
  "Schmidt", "Mueller", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker",
  "Schulz", "Hoffmann", "Koch", "Bauer", "Richter", "Klein", "Schroeder", "Neumann",
  "Dubois", "Bernard", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy",
  "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci",
  "Novak", "Kowalski", "Wojcik", "Lewandowski", "Ivanov", "Petrov", "Sidorov", "Popov",
  "Nielsen", "Hansen", "Jensen", "Andersen", "Olsen", "Larsen", "Johansson", "Andersson",

  // British Surnames
  "Davies", "Evans", "Thomas", "Roberts", "Johnson", "Lewis", "Hughes", "Morgan",
  "Griffiths", "Edwards", "Owen", "Clarke", "Knight", "Palmer", "Holmes", "Hunt",
  "Robertson", "Murray", "Cameron", "Stewart", "Morrison", "MacDonald", "Reid", "Fraser",
  "McKenzie", "Ross", "Henderson", "Ferguson", "Grant", "Burns", "Murphy", "Kelly",

  // Additional Diverse Surnames
  "Brennan", "Dunn", "Holt", "Meyer", "Rhodes", "Stone", "Warner", "Bishop",
  "Cannon", "Carlson", "Daniels", "Duncan", "Elliott", "Garrett", "Hanson", "Hopkins",
  "Jacobs", "Klein", "Lambert", "Manning", "Nash", "Oliver", "Page", "Quinn",
  "Ramsey", "Stanley", "Tyler", "Vaughn", "Waters", "Zimmerman", "Barton", "Brady",
  "Burgess", "Chandler", "Francis", "Gilbert", "Hodges", "Ingram", "Joseph", "Keller",
  "Little", "Maxwell", "Norman", "Osborne", "Pearson", "Randall", "Schultz", "Thornton",
  "Underwood", "Vega", "Webster", "Williamson", "Yates", "Adkins", "Barber"
] as const;

/**
 * Pool of 100 realistic business names
 */
export const COMPANY_NAMES: readonly string[] = [
  // Technology Companies
  "TechCorp", "DataSystems", "CloudWorks", "CyberTech", "InfoTech", "NetSolutions",
  "DigitalWorks", "ByteTech", "CoreSystems", "NextGen Technologies", "InnovateTech", "SmartSystems",
  "TechVentures", "GlobalTech", "FutureTech", "MetaWorks", "QuantumTech", "PrimeTech",
  "ApexTechnologies", "VanguardTech", "HorizonTech", "TitanSystems", "VelocityTech", "ZenithTech",

  // Consulting & Professional Services
  "ConsultPro", "StrategyGroup", "AdvisoryWorks", "GlobalConsulting", "PrimeAdvisors", "SummitConsulting",
  "ApexConsulting", "StrategicPartners", "EliteAdvisors", "ProServices", "VisionConsulting", "CoreAdvisors",
  "PinnacleGroup", "MeridianConsulting", "CatalystGroup", "NavigatePartners", "InsightAdvisors", "BridgeConsulting",

  // Generic Corporate Names
  "Worldwide Industries", "United Holdings", "American Enterprises", "Pacific Group", "Atlantic Corporation",
  "Continental Industries", "National Solutions", "Universal Group", "Global Enterprises", "Premier Holdings",
  "Crown Corporation", "Eagle Industries", "Liberty Group", "Victory Enterprises", "Heritage Holdings",
  "Paramount Industries", "Prestige Group", "Royal Corporation", "Sterling Enterprises", "Summit Holdings",

  // Finance & Business
  "Capital Ventures", "Financial Partners", "Investment Group", "Equity Holdings", "Asset Management Corp",
  "Portfolio Solutions", "Wealth Advisors", "Prime Capital", "Meridian Financial", "Keystone Investments",

  // Marketing & Media
  "MediaWorks", "BrandLab", "Creative Solutions", "Marketing Dynamics", "Digital Agency", "Growth Partners",
  "BrandVentures", "ContentWorks", "MediaGroup", "Insight Marketing", "Vision Media", "ImpactLab",

  // Manufacturing & Industrial
  "Industrial Solutions", "Manufacturing Corp", "Production Systems", "Precision Industries", "Quality Products",
  "Advanced Manufacturing", "Global Supply Co", "Integrated Systems", "Operations Group", "Logistics Solutions",

  // Various LLC/Inc names
  "Riverside LLC", "Brookstone Inc", "Oakmont Group", "Maplewood Solutions", "Clearview Corporation",
  "Lakeside Ventures", "Mountainview LLC", "Bayshore Industries", "Parkside Group", "Woodland Inc"
] as const;

/**
 * Pool of 50 professional email domains
 */
export const EMAIL_DOMAINS: readonly string[] = [
  // Professional Business Domains
  "company.com", "corp.com", "business.com", "enterprise.com", "group.com",
  "solutions.com", "industries.com", "ventures.com", "holdings.com", "partners.com",
  "consulting.com", "advisory.com", "services.com", "tech.com", "systems.com",
  "global.com", "international.com", "worldwide.com", "united.com", "premier.com",

  // Tech-focused Domains
  "corp.io", "tech.io", "dev.io", "digital.io", "cloud.io",
  "data.io", "app.io", "web.io", "net.io", "sys.io",

  // Generic Safe Email Providers
  "mail.com", "email.com", "inbox.com", "post.com", "messages.com",
  "fastmail.com", "proton.me", "protonmail.com", "pm.me", "tutanota.com",

  // Business Network Domains
  "business.net", "corporate.net", "professional.net", "enterprise.net", "office.net",

  // Other Professional Domains
  "workspace.com", "business.org", "professional.org", "work.email", "office.email"
] as const;

/**
 * Common area codes for phone number generation
 */
export const AREA_CODES: readonly string[] = [
  '212', '310', '415', '512', '617', '720', '202', '305', '312', '404',
  '503', '206', '214', '713', '602', '480', '702', '303', '615', '919'
] as const;

/**
 * Type definitions for type safety
 */
export type FirstName = typeof FIRST_NAMES[number];
export type LastName = typeof LAST_NAMES[number];
export type CompanyName = typeof COMPANY_NAMES[number];
export type EmailDomain = typeof EMAIL_DOMAINS[number];
export type AreaCode = typeof AREA_CODES[number];

/**
 * Metadata about the data pools
 */
export const POOL_STATS = {
  firstNames: FIRST_NAMES.length,
  lastNames: LAST_NAMES.length,
  companyNames: COMPANY_NAMES.length,
  emailDomains: EMAIL_DOMAINS.length,
  areaCodes: AREA_CODES.length,
} as const;
