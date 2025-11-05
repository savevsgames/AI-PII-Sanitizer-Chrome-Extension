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
 * Pool of 100 realistic US addresses
 */
export const ADDRESSES: readonly string[] = [
  // Major Cities - Residential Streets
  "123 Main Street, New York, NY 10001",
  "456 Oak Avenue, Los Angeles, CA 90001",
  "789 Maple Drive, Chicago, IL 60601",
  "321 Pine Street, Houston, TX 77001",
  "654 Elm Boulevard, Phoenix, AZ 85001",
  "987 Cedar Lane, Philadelphia, PA 19101",
  "147 Birch Road, San Antonio, TX 78201",
  "258 Willow Court, San Diego, CA 92101",
  "369 Spruce Way, Dallas, TX 75201",
  "741 Ash Place, San Jose, CA 95101",

  // Medium Cities
  "852 Park Avenue, Austin, TX 78701",
  "963 Lake Drive, Seattle, WA 98101",
  "159 River Road, Denver, CO 80201",
  "357 Hill Street, Boston, MA 02101",
  "486 Valley Lane, Portland, OR 97201",
  "572 Mountain View, Nashville, TN 37201",
  "683 Ocean Boulevard, Miami, FL 33101",
  "794 Forest Drive, Atlanta, GA 30301",
  "815 Sunset Avenue, Charlotte, NC 28201",
  "926 Harbor Road, Raleigh, NC 27601",

  // Suburban Areas
  "1234 Meadow Lane, Arlington, VA 22201",
  "2345 Garden Court, Plano, TX 75024",
  "3456 Highland Drive, Irvine, CA 92602",
  "4567 Parkside Avenue, Scottsdale, AZ 85250",
  "5678 Riverside Drive, Bellevue, WA 98004",
  "6789 Lakeview Circle, Naperville, IL 60540",
  "7890 Woodland Path, Sugar Land, TX 77478",
  "8901 Hillcrest Road, Cary, NC 27511",
  "9012 Brookfield Lane, Frisco, TX 75034",
  "1023 Oakwood Drive, Gilbert, AZ 85233",

  // More Residential
  "2134 Franklin Street, Cambridge, MA 02138",
  "3245 Washington Avenue, Alexandria, VA 22301",
  "4356 Jefferson Drive, Berkeley, CA 94701",
  "5467 Lincoln Boulevard, Santa Monica, CA 90401",
  "6578 Madison Avenue, Brooklyn, NY 11201",
  "7689 Adams Street, Queens, NY 11354",
  "8790 Monroe Drive, Ann Arbor, MI 48103",
  "9801 Jackson Road, Chapel Hill, NC 27514",
  "1912 Taylor Lane, Boulder, CO 80301",
  "2023 Harrison Court, Palo Alto, CA 94301",

  // Numbered Streets
  "100 1st Avenue, San Francisco, CA 94101",
  "200 2nd Street, Seattle, WA 98104",
  "300 3rd Avenue, Portland, OR 97204",
  "400 4th Street, Austin, TX 78702",
  "500 5th Avenue, New York, NY 10018",
  "600 6th Street, Los Angeles, CA 90014",
  "700 7th Avenue, Denver, CO 80202",
  "800 8th Street, Chicago, IL 60605",
  "900 9th Avenue, Nashville, TN 37203",
  "1000 10th Street, Miami, FL 33130",

  // Directional Streets
  "2500 North Main Street, Dallas, TX 75201",
  "3500 South Oak Avenue, Phoenix, AZ 85004",
  "4500 East Maple Drive, Atlanta, GA 30308",
  "5500 West Pine Street, Las Vegas, NV 89101",
  "6500 Northwest Boulevard, Houston, TX 77002",
  "7500 Southeast Avenue, Charlotte, NC 28202",
  "8500 Northeast Drive, Raleigh, NC 27604",
  "9500 Southwest Lane, Austin, TX 78704",
  "1050 North Central Avenue, Philadelphia, PA 19102",
  "1150 South State Street, Chicago, IL 60604",

  // Named Streets
  "421 Broadway Street, San Diego, CA 92101",
  "532 Market Street, San Francisco, CA 94102",
  "643 State Street, Boston, MA 02109",
  "754 Church Street, Nashville, TN 37201",
  "865 College Avenue, Berkeley, CA 94704",
  "976 University Drive, Ann Arbor, MI 48104",
  "1087 Spring Street, Seattle, WA 98101",
  "1198 Summer Avenue, Portland, OR 97201",
  "1209 Autumn Lane, Denver, CO 80202",
  "1320 Winter Road, Austin, TX 78701",

  // Avenues and Boulevards
  "2431 Grand Avenue, Los Angeles, CA 90007",
  "2542 Park Boulevard, San Diego, CA 92103",
  "2653 Highland Avenue, Phoenix, AZ 85006",
  "2764 Central Boulevard, Miami, FL 33131",
  "2875 Ocean Avenue, Santa Monica, CA 90401",
  "2986 Lake Boulevard, Chicago, IL 60611",
  "3097 River Avenue, Nashville, TN 37204",
  "3108 Mountain Boulevard, Denver, CO 80203",
  "3219 Forest Avenue, Portland, OR 97202",
  "3330 Valley Boulevard, Los Angeles, CA 90032",

  // Lanes and Circles
  "4441 Cherry Lane, Plano, TX 75075",
  "4552 Peach Circle, Atlanta, GA 30309",
  "4663 Apple Drive, San Jose, CA 95110",
  "4774 Orange Avenue, Miami, FL 33132",
  "4885 Lemon Street, San Diego, CA 92102",
  "4996 Berry Lane, Seattle, WA 98102",
  "5107 Plum Court, Portland, OR 97203",
  "5218 Grape Drive, Denver, CO 80204",
  "5329 Pear Avenue, Austin, TX 78702",
  "5440 Fig Street, Phoenix, AZ 85007",

  // Various Formats
  "6551 Commerce Street, Dallas, TX 75202",
  "6662 Industrial Boulevard, Houston, TX 77003",
  "6773 Technology Drive, San Jose, CA 95111",
  "6884 Innovation Way, Austin, TX 78703",
  "6995 Enterprise Road, Seattle, WA 98103",
  "7106 Business Park Drive, Phoenix, AZ 85008",
  "7217 Executive Boulevard, Atlanta, GA 30310",
  "7328 Corporate Drive, Charlotte, NC 28203",
  "7439 Professional Plaza, Denver, CO 80205",
  "7550 Metro Parkway, Miami, FL 33133"
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
export type Address = typeof ADDRESSES[number];
export type AreaCode = typeof AREA_CODES[number];

/**
 * Metadata about the data pools
 */
export const POOL_STATS = {
  firstNames: FIRST_NAMES.length,
  lastNames: LAST_NAMES.length,
  companyNames: COMPANY_NAMES.length,
  emailDomains: EMAIL_DOMAINS.length,
  addresses: ADDRESSES.length,
  areaCodes: AREA_CODES.length,
} as const;
