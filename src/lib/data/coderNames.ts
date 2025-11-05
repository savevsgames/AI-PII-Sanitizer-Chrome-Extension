/**
 * Coder/Tech Name Pools for Alias Generation (PRO Feature)
 *
 * Fun, comedic, and cool coder-themed aliases for developers.
 * Perfect for tech professionals, hackers, and coding enthusiasts.
 *
 * Pools:
 * - 500 tech first names (programming terms, famous devs, jokes)
 * - 500 coding surnames (languages, frameworks, algorithms, memes)
 * - 100 funny company names (tech parodies and developer jokes)
 * - 50 developer email domains
 *
 * Examples: "Debug NullPointer", "Cache StackOverflow", "Ada JavaScript"
 *
 * @module coderNames
 * @tier PRO
 */

/**
 * Pool of 500 coder-themed first names
 * Mix of tech terms, programming languages, and coding culture
 */
export const CODER_FIRST_NAMES: readonly string[] = [
  // Male Names with Coding Twists (200)
  "Ada", "Alan", "Anders", "Andrew", "Anton", "Archie", "Arlo", "Ash",
  "Axel", "Bash", "Bjarne", "Blake", "Brendan", "Brian", "Bruno", "Buffer",
  "Byte", "Cache", "Callum", "Carl", "Chad", "Cipher", "Claude", "Cloud",
  "Code", "Cody", "Connor", "Cooper", "Core", "Crash", "Crypto", "Curry",
  "Daemon", "Dale", "Dan", "Darwin", "Dash", "Data", "Dave", "Debug",
  "Deno", "Dennis", "Dev", "Dexter", "Diff", "Django", "Docker", "Dom",
  "Doug", "Drake", "Dustin", "Dylan", "Echo", "Eli", "Elixir", "Elliott",
  "Elon", "Emit", "Enum", "Enzo", "Eric", "Erlang", "Evan", "Exec",
  "Felix", "Fetch", "Finn", "Flash", "Fletcher", "Flynn", "Forrest", "Fork",
  "Franco", "Frank", "Fred", "Garry", "Gavin", "Gene", "Geo", "Giff",
  "Gino", "Git", "Glenn", "Goroutine", "Gradle", "Graham", "Grant", "Grep",
  "Griff", "Guido", "Hacker", "Hal", "Hamming", "Hank", "Hans", "Hash",
  "Hawk", "Hayden", "Heap", "Hex", "Holden", "Hook", "Hugo", "Hunter",
  "Ian", "Index", "Intel", "Isaac", "Ivan", "Jack", "Jackson", "Jacob",
  "James", "Jarvis", "Jason", "Java", "Jax", "Jay", "Jeff", "Jensen",
  "Jett", "Jim", "Joel", "John", "Jon", "Jordan", "Jose", "Josh",
  "Julian", "Julius", "Justin", "Kafka", "Kai", "Karl", "Kaz", "Keith",
  "Kelvin", "Ken", "Kent", "Kevin", "Kieran", "Klaus", "Knox", "Koa",
  "Kotlin", "Kurt", "Kyle", "Lambda", "Lance", "Lars", "Leet", "Len",
  "Leon", "Lex", "Liam", "Link", "Linus", "Linux", "Logan", "Loop",
  "Louis", "Lucas", "Luke", "Lumen", "Mac", "Magnus", "Malcolm", "Malloc",
  "Marco", "Mark", "Marshal", "Martin", "Mason", "Matt", "Max", "Merge",
  "Merlin", "Mick", "Micro", "Miles", "Milo", "Moby", "Mongo", "Mutex",
  "Nash", "Nate", "Nathan", "Neo", "Nerd", "Nest", "Netty", "Neumann",
  "Nic", "Nigel", "Nikola", "Nix", "Node", "Nolan", "Null", "Nuno",

  // Female Names with Coding Twists (200)
  "Abby", "Ada", "Adele", "Agatha", "Aisha", "Alex", "Alexa", "Alice",
  "Alicia", "Alma", "Amber", "Amelia", "Amy", "Ana", "Andrea", "Angel",
  "Angela", "Anita", "Anna", "Anne", "Annie", "API", "April", "Aria",
  "Ariana", "Array", "Arya", "Asha", "Ashley", "Async", "Athena", "Audrey",
  "Aurora", "Ava", "Azure", "Barb", "Bella", "Beth", "Betty", "Binary",
  "Bianca", "Blair", "Blake", "Bonnie", "Boolean", "Brandi", "Brandy", "Brenda",
  "Brie", "Brooke", "Cache", "Cady", "Cali", "Callie", "Camila", "Cara",
  "Carly", "Carmen", "Carol", "Carrie", "Casey", "Cassie", "Cate", "Celia",
  "Charlie", "Charlotte", "Chelsea", "Chloe", "Christie", "Clara", "Class", "Claudia",
  "Cleo", "Cloud", "Coco", "Codi", "Cody", "Console", "Cora", "Coral",
  "Corey", "Crystal", "Cyber", "Daisy", "Dana", "Dani", "Daria", "Dawn",
  "Deb", "Debbie", "Debug", "Delia", "Delta", "Demi", "Denise", "Dev",
  "Diana", "Diane", "Digit", "Dixie", "Dolly", "Donna", "Dora", "Doris",
  "Dorothy", "Echo", "Eden", "Edie", "Edith", "Eileen", "Elaine", "Eleanor",
  "Elena", "Elise", "Eliza", "Elizabeth", "Ella", "Ellen", "Ellie", "Elsa",
  "Ember", "Emily", "Emma", "Enum", "Erica", "Erin", "Esme", "Estelle",
  "Esther", "Ethel", "Eva", "Eve", "Evelyn", "Faith", "Faye", "Fetch",
  "Fiona", "Flask", "Flora", "Florence", "Frances", "Frankie", "Freya", "Function",
  "Gabby", "Gail", "Gene", "Geneva", "Genie", "Georgia", "Gia", "Gigi",
  "Gina", "Ginger", "Git", "Glenda", "Gloria", "Grace", "Gracie", "Grep",
  "Greta", "Gwen", "Hailey", "Hannah", "Harper", "Hash", "Hazel", "Heather",
  "Heidi", "Helen", "Hera", "Hex", "Hillary", "Holly", "Hope", "Ida",
  "Indie", "Ingrid", "Io", "Iris", "Irma", "Isabel", "Ivy", "Jackie",
  "Jade", "Jamie", "Jan", "Jane", "Janet", "Janice", "Jasmine", "Java",
  "Jay", "Jean", "Jenna", "Jennifer", "Jenny", "Jess", "Jessica", "Jill",

  // Gender-Neutral Tech Names (100)
  "Ajax", "Algo", "Alpha", "Ansible", "Apache", "Apollo", "Arch", "Array",
  "Async", "Atom", "Auth", "Babel", "Backup", "Badge", "Bash", "Batch",
  "Beta", "Binx", "Bit", "Blaze", "Blob", "Block", "Bloom", "Blue",
  "Boot", "Branch", "Brew", "Bridge", "Bud", "Build", "Bundle", "Bus",
  "Buzz", "Byte", "Cache", "Cedar", "Cert", "Chain", "Chaos", "Chip",
  "Chrome", "Chunk", "Cipher", "Circuit", "Cisco", "Clone", "Cluster", "Cobalt",
  "Codec", "Coder", "Commit", "Compile", "Config", "Cookie", "Coral", "Cosmic",
  "Crash", "Cron", "Crypto", "Crystal", "Curl", "Cursor", "Cyber", "Cycle",
  "Daemon", "Darwin", "Dash", "Data", "Debug", "Delta", "Demo", "Deploy",
  "Dev", "Diff", "Digital", "Docker", "Dusk", "Dynamo", "Echo", "Edge",
  "Emit", "Encoder", "Entity", "Epoch", "Error", "Ether", "Event", "Exec",
  "Falcon", "Fetch", "Fiber", "Flag", "Flash", "Flux", "Fork", "Frame",
  "Frost", "Fusion", "Gateway", "Ghost", "Glitch", "Grid", "Hack", "Hash"
] as const;

/**
 * Pool of 500 coding surnames
 * Languages, frameworks, algorithms, concepts, and developer jokes
 */
export const CODER_LAST_NAMES: readonly string[] = [
  // Programming Languages
  "JavaScript", "Python", "TypeScript", "Rust", "Java", "Golang", "Swift", "Kotlin",
  "Ruby", "Perl", "Scala", "Haskell", "Clojure", "Erlang", "Elixir", "Dart",
  "Pascal", "Fortran", "Cobol", "Lisp", "Prolog", "Scheme", "Racket", "OCaml",

  // Frameworks/Libraries
  "React", "Angular", "Vue", "Svelte", "Django", "Flask", "Rails", "Laravel",
  "Express", "Fastify", "NestJS", "NextJS", "Gatsby", "Nuxt", "Remix", "Astro",
  "Spring", "Hibernate", "Electron", "Flutter", "ReactNative", "Ionic", "Capacitor", "Cordova",

  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Cassandra", "DynamoDB", "Firebase", "Supabase",
  "Oracle", "MariaDB", "SQLite", "Neo4j", "CouchDB", "RethinkDB", "InfluxDB", "TimescaleDB",

  // Cloud/DevOps
  "Docker", "Kubernetes", "Jenkins", "Terraform", "Ansible", "Puppet", "Chef", "Vagrant",
  "AWS", "Azure", "CloudFlare", "Vercel", "Netlify", "Heroku", "DigitalOcean", "Linode",

  // Algorithms/CS Concepts
  "Algorithm", "Binary", "Boolean", "Fibonacci", "Dijkstra", "Recursion", "Iteration", "QuickSort",
  "MergeSort", "BubbleSort", "HeapSort", "HashMap", "TreeMap", "LinkedList", "ArrayList", "HashSet",
  "BinaryTree", "RedBlack", "AVLTree", "BTree", "Graph", "Stack", "Queue", "Deque",

  // Developer Culture
  "Debugger", "Compiler", "Interpreter", "Parser", "Lexer", "Tokenizer", "Transpiler", "Bundler",
  "Linter", "Formatter", "Validator", "Sanitizer", "Optimizer", "Minifier", "Obfuscator", "Profiler",

  // Open Source Projects
  "Linux", "Ubuntu", "Debian", "Fedora", "CentOS", "ArchLinux", "Manjaro", "Gentoo",
  "Apache", "Nginx", "Tomcat", "Jetty", "Git", "GitHub", "GitLab", "Bitbucket",
  "VSCode", "Vim", "Emacs", "Atom", "Sublime", "WebStorm", "IntelliJ", "Eclipse",

  // Tech Companies
  "Google", "Apple", "Microsoft", "Amazon", "Meta", "Tesla", "Nvidia", "Intel",
  "Chrome", "Firefox", "Safari", "Edge", "Chromium", "Webkit", "Gecko", "Blink",

  // Coding Jokes
  "NullPointer", "SegFault", "StackOverflow", "BufferOverflow", "MemoryLeak", "RaceCondition", "Deadlock", "Mutex",
  "SemiColon", "CamelCase", "SnakeCase", "KebabCase", "PascalCase", "YodaCondition", "MagicNumber", "Spaghetti",
  "TechnicalDebt", "CodeSmell", "AntiPattern", "DesignPattern", "Singleton", "Factory", "Observer", "Strategy",

  // Version Control
  "Commit", "Push", "Pull", "Merge", "Branch", "Fork", "Clone", "Checkout",
  "Rebase", "Cherry", "Stash", "Tag", "Blame", "Bisect", "Diff", "Patch",

  // Testing
  "JUnit", "Jest", "Mocha", "Chai", "Jasmine", "Karma", "Cypress", "Selenium",
  "Playwright", "Puppeteer", "TestNG", "PyTest", "RSpec", "Cucumber", "SpecFlow", "XUnit",

  // Build Tools
  "Webpack", "Vite", "Rollup", "Parcel", "ESBuild", "Turbopack", "Snowpack", "Grunt",
  "Gulp", "Broccoli", "Maven", "Gradle", "Make", "CMake", "Bazel", "Buck",

  // API/Protocol
  "REST", "GraphQL", "gRPC", "WebSocket", "HTTP", "HTTPS", "TCP", "UDP",
  "JSON", "XML", "YAML", "TOML", "Protocol", "Socket", "Endpoint", "Middleware",

  // Design/UI
  "Bootstrap", "Tailwind", "Material", "Chakra", "Bulma", "Foundation", "Semantic", "Ant",
  "Styled", "Emotion", "Sass", "Less", "PostCSS", "Stylus", "CSS", "HTML",

  // Package Managers
  "NPM", "Yarn", "PNPM", "Pip", "Conda", "Cargo", "Gem", "Composer",
  "Maven", "NuGet", "Homebrew", "Apt", "Yum", "Pacman", "Snap", "Flatpak",

  // Security
  "Auth", "OAuth", "JWT", "Token", "Cipher", "Encrypt", "Decrypt", "Hash",
  "Salt", "Pepper", "Firewall", "VPN", "SSL", "TLS", "Certificate", "KeyPair",

  // Performance
  "Cache", "CDN", "Lazy", "Async", "Sync", "Parallel", "Concurrent", "Thread",
  "Process", "Worker", "Pool", "Cluster", "LoadBalancer", "Throttle", "Debounce", "Memoize",

  // Data Structures
  "Array", "Vector", "Matrix", "Tuple", "Set", "Map", "Dictionary", "List",
  "Tree", "Node", "Vertex", "Edge", "Heap", "Trie", "Bloom", "Skip",

  // Functional Programming
  "Lambda", "Closure", "Monad", "Functor", "Curry", "Compose", "Pipe", "Reduce",
  "Filter", "MapReduce", "FlatMap", "Fold", "Zip", "Partial", "Pure", "Immutable",

  // OOP
  "Class", "Object", "Instance", "Inherit", "Polymorphic", "Encapsulate", "Abstract", "Interface",
  "Constructor", "Destructor", "Getter", "Setter", "Method", "Property", "Virtual", "Override",

  // Memory
  "RAM", "ROM", "Buffer", "Pointer", "Reference", "Allocate", "Deallocate", "Garbage",
  "Collector", "Malloc", "Calloc", "Realloc", "Free", "Leak", "Dangling", "Wild",

  // Network
  "Packet", "Bandwidth", "Latency", "Throughput", "Ping", "Traceroute", "DNS", "DHCP",
  "Router", "Switch", "Gateway", "Proxy", "Tunnel", "Broadcast", "Multicast", "Unicast",

  // Command Line
  "Bash", "Shell", "Terminal", "Console", "Prompt", "Sudo", "Chmod", "Chown",
  "Grep", "Awk", "Sed", "Cat", "Echo", "Pipe", "Redirect", "Alias",

  // Agile/Scrum
  "Sprint", "Backlog", "Standup", "Retrospective", "Velocity", "BurnDown", "Kanban", "Scrum",
  "Epic", "Story", "Task", "Bug", "Feature", "Spike", "Tech", "Blocker",

  // DevOps
  "Pipeline", "Deploy", "Release", "Rollback", "Canary", "BlueGreen", "Container", "Orchestration",
  "Monitor", "Alert", "Metric", "Log", "Trace", "Span", "Dashboard", "Incident",

  // Emerging Tech
  "Quantum", "Neural", "Machine", "Learning", "AI", "ML", "Deep", "Network",
  "Blockchain", "Crypto", "Bitcoin", "Ethereum", "Smart", "Contract", "Decentralized", "Web3",
  "Metaverse", "Virtual", "Augmented", "Reality", "Cloud", "Edge", "IoT", "5G"
] as const;

/**
 * Pool of 100 funny coder companies
 */
export const CODER_COMPANIES: readonly string[] = [
  // Famous Open Source
  "The Linux Foundation", "Apache Software Foundation", "Mozilla Foundation", "Eclipse Foundation", "Free Software Foundation",
  "Open Source Initiative", "Python Software Foundation", "Node.js Foundation", "Cloud Native Computing Foundation", "OpenJS Foundation",

  // Humorous
  "NullPointer Industries", "SegFault Solutions", "Stack Overflow Consulting", "Infinite Loop Corp", "404 Not Found LLC",
  "Syntax Error Systems", "Merge Conflict Management", "Git Gud Technologies", "Ctrl Alt Delete Inc", "Recursive Solutions",
  "Binary Logic Labs", "Boolean Operators Co", "Async Await Consulting", "Callback Hell Survivors", "Promise.all Group",
  "Zero Index Ventures", "Off By One Errors LLC", "Undefined is not a Function", "Cannot Read Property Corp", "Memory Leak Detectives",

  // Startup Parodies
  "Unicorn Chasers Inc", "Disruptive Innovations", "AI Everything Solutions", "Blockchain All Things", "Machine Learning Magic",
  "Cloud Native Ninjas", "Serverless Samurai", "Microservices Masters", "Full Stack Legends", "DevOps Wizards",

  // Language/Framework
  "React Native Studios", "Vue.js Ventures", "Angular Architects", "Django Developers", "Ruby on Rails Riders",
  "Node.js Nomads", "Python Programmers", "Go Gophers Guild", "Rust Revolutionaries", "Swift Coders Collective",

  // Developer Tools
  "Git Masters Guild", "Docker Containers Co", "Kubernetes Orchestrators", "CI/CD Pipeline Pros", "Code Review Experts",
  "Pull Request Partners", "Merge Masters Inc", "Commit Message Consultants", "Branch Strategy Specialists", "Rebase Wizards",

  // Tech Culture
  "The Coffee Driven Development", "Pizza and Pull Requests", "Tabs vs Spaces Debate Society", "Dark Mode Enthusiasts",
  "RGB Keyboard Collectors", "Mechanical Keyboard Club", "Vim Escape Artists", "Emacs Finger Gymnastics", "VS Code Extensions Unlimited",

  // Coding Memes
  "Works On My Machine Corp", "Did You Try Restarting?", "It's Not a Bug It's a Feature", "Code Compiles Ship It",
  "Copy Paste from Stack Overflow", "Senior Googlers Inc", "Junior Developers Anonymous", "Imposter Syndrome Support Group",

  // Cloud/SaaS
  "Cloud Scalers Inc", "API Gateway Solutions", "REST Assured Consulting", "GraphQL Specialists", "gRPC Performance Pros",
  "WebSocket Wizards", "Real-Time Data Systems", "Event Driven Architecture", "Message Queue Masters", "Pub Sub Experts",

  // Data/AI
  "Big Data Analytics Co", "Machine Learning Models Inc", "Neural Network Builders", "Deep Learning Labs", "AI Training Grounds",
  "Data Pipeline Engineers", "ETL Specialists Group", "Database Optimization Pros", "Query Performance Experts", "Index Everything Inc",

  // Security
  "Penetration Testing Pros", "Security Audit Experts", "Encryption Specialists", "Zero Day Hunters", "Bug Bounty Collective",
  "OWASP Advocates", "Security First Solutions", "Auth Token Masters", "JWT Defenders", "OAuth Flow Experts",

  // Misc
  "Regex Pattern Masters", "Algorithm Optimization Lab", "Time Complexity Consultants", "Space Complexity Specialists", "Big O Notation Nerds"
] as const;

/**
 * Pool of 50 developer email domains
 */
export const CODER_DOMAINS: readonly string[] = [
  // Programming Languages
  "javascript.dev", "typescript.dev", "python.dev", "rust.dev", "golang.dev",
  "ruby.dev", "java.dev", "kotlin.dev", "swift.dev", "csharp.dev",

  // Tech Platforms
  "github.io", "gitlab.io", "bitbucket.io", "codepen.io", "replit.dev",
  "stackblitz.com", "codesandbox.io", "vercel.app", "netlify.app", "github.dev",

  // Developer
  "devs.code", "hackers.dev", "coders.dev", "developers.io", "engineers.tech",
  "programmers.dev", "fullstack.dev", "backend.dev", "frontend.dev", "devops.dev",

  // Tech Culture
  "opensource.dev", "opensource.io", "foss.dev", "linux.dev", "unix.dev",

  // Cloud/Serverless
  "cloud.dev", "serverless.dev", "lambda.dev", "edge.dev", "api.dev",

  // Frameworks
  "react.dev", "vue.dev", "angular.dev", "svelte.dev", "next.dev",

  // Tools
  "git.dev", "docker.dev", "k8s.dev", "terminal.dev", "shell.dev"
] as const;

/**
 * Type definitions
 */
export type CoderFirstName = typeof CODER_FIRST_NAMES[number];
export type CoderLastName = typeof CODER_LAST_NAMES[number];
export type CoderCompany = typeof CODER_COMPANIES[number];
export type CoderDomain = typeof CODER_DOMAINS[number];

/**
 * Pool stats
 */
export const CODER_POOL_STATS = {
  firstNames: CODER_FIRST_NAMES.length,
  lastNames: CODER_LAST_NAMES.length,
  companies: CODER_COMPANIES.length,
  domains: CODER_DOMAINS.length,
} as const;
