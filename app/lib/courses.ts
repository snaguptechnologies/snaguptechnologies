export interface CourseItem {
    id: number;
    name: string;
    category: 'Software Development' | 'Backend & Application Development' | 'Data & Artificial Intelligence' | 'Cloud & Web3 Technologies';
    description: string;
    iconName: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    badgeText?: string;
    admissionStatus: 'open' | 'starting_soon';
    duration?: string;
}

export const UPCOMING_LEARNING_CLUSTERS: CourseItem[] = [
    // Software Development
    {
        id: 1,
        name: "Frontend Development",
        category: "Software Development",
        description: "Build high-performance responsive web applications using modern HTML5, CSS3, ES6+ JavaScript, Tailwind, and React.",
        iconName: "Layout",
        skillLevel: "Beginner",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 2,
        name: "Advanced Python Programming",
        category: "Software Development",
        description: "Master object-oriented architecture, metaprogramming, async workflows, functional constructs, and high-level software patterns.",
        iconName: "Terminal",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 3,
        name: "Java Programming",
        category: "Software Development",
        description: "Comprehensive object-oriented programming, design patterns, collections framework, concurrency, and JVM internals.",
        iconName: "FileCode",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 4,
        name: "C Programming",
        category: "Software Development",
        description: "Foundational low-level systems programming, memory management, pointers, dynamic allocation, and core data structures.",
        iconName: "Code",
        skillLevel: "Beginner",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 5,
        name: "C++ Programming",
        category: "Software Development",
        description: "Modern C++17/C++20 features, STL library optimization, template metaprogramming, OOP, and memory safety principles.",
        iconName: "Code2",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },

    // Backend & Application Development
    {
        id: 6,
        name: "Python Backend Development",
        category: "Backend & Application Development",
        description: "Develop enterprise REST & GraphQL microservices with FastAPI, Django, PostgreSQL, Redis caching, and AsyncIO.",
        iconName: "Server",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 7,
        name: "Java Backend Development",
        category: "Backend & Application Development",
        description: "Enterprise backend development with Spring Boot 3, Spring Data JPA, Microservices architecture, Hibernate, and Security.",
        iconName: "Cpu",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "10 Weeks"
    },
    {
        id: 8,
        name: "Generative AI & Prompt Engineering",
        category: "Backend & Application Development",
        description: "LLM prompt optimization, Retrieval-Augmented Generation (RAG), vector databases, LangChain, and AI agent workflows.",
        iconName: "Sparkles",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 9,
        name: "VLSI Design & Development",
        category: "Backend & Application Development",
        description: "Verilog HDL, digital logic architecture, CMOS circuit design, FPGA synthesis, prototyping, and semiconductor engineering.",
        iconName: "Microchip",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "12 Weeks"
    },
    {
        id: 10,
        name: "Embedded Systems Programming",
        category: "Backend & Application Development",
        description: "Bare-metal ARM Cortex programming, FreeRTOS, microcontrollers, sensor protocols (I2C/SPI/UART), and IoT firmware.",
        iconName: "Binary",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "10 Weeks"
    },

    // Data & Artificial Intelligence
    {
        id: 11,
        name: "Database Management Systems",
        category: "Data & Artificial Intelligence",
        description: "Relational SQL architecture, query optimization, indexing strategies, ACID compliance, transactions, and NoSQL databases.",
        iconName: "Database",
        skillLevel: "Beginner",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 12,
        name: "Data Analytics with Power BI",
        category: "Data & Artificial Intelligence",
        description: "Transform business data into interactive dashboards, DAX expressions, ETL pipelines, and executive intelligence reports.",
        iconName: "BarChart3",
        skillLevel: "Beginner",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 13,
        name: "Machine Learning",
        category: "Data & Artificial Intelligence",
        description: "Supervised and unsupervised ML algorithms, Scikit-Learn, regression, classification, random forests, and model evaluation.",
        iconName: "Brain",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 14,
        name: "Data Science",
        category: "Data & Artificial Intelligence",
        description: "Exploratory data analysis, statistical modeling, Pandas, NumPy, visualization, hypothesis testing, and predictive modeling.",
        iconName: "LineChart",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "10 Weeks"
    },

    // Cloud & Web3 Technologies
    {
        id: 15,
        name: "AWS Cloud Computing",
        category: "Cloud & Web3 Technologies",
        description: "Cloud infrastructure architecting, EC2, S3, Lambda serverless, VPC networking, IAM security, and CloudFormation/Terraform.",
        iconName: "Cloud",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 16,
        name: "Web3 Development",
        category: "Cloud & Web3 Technologies",
        description: "Decentralized application (dApp) engineering, Ethers.js/Viem, Web3 modal integration, IPFS, and blockchain client interaction.",
        iconName: "Globe",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 17,
        name: "Smart Contract Development",
        category: "Cloud & Web3 Technologies",
        description: "Ethereum Virtual Machine (EVM) Solidity programming, Hardhat/Foundry testing, ERC-20/721 tokens, and contract security auditing.",
        iconName: "ShieldCheck",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "8 Weeks"
    },

    // New Required Individual Courses
    {
        id: 18,
        name: "Advanced Backend",
        category: "Backend & Application Development",
        description: "Master high-scale REST APIs, microservices architecture, API security, OAuth2, rate limiting, and system design patterns.",
        iconName: "Server",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 19,
        name: "Deep Learning",
        category: "Data & Artificial Intelligence",
        description: "Neural network architectures, PyTorch, TensorFlow, Convolutional Networks (CNNs), Transformers, and computer vision models.",
        iconName: "Brain",
        skillLevel: "Advanced",
        admissionStatus: "open",
        duration: "8 Weeks"
    },
    {
        id: 20,
        name: "Statistics Python",
        category: "Data & Artificial Intelligence",
        description: "Statistical computing with Python, SciPy, Statsmodels, hypothesis testing, probability distributions, and inferential analytics.",
        iconName: "BarChart3",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 21,
        name: "Hardhat",
        category: "Cloud & Web3 Technologies",
        description: "Ethereum development environment, smart contract compilation, automated unit testing with Hardhat, deployment scripts, and debugging.",
        iconName: "Code2",
        skillLevel: "Intermediate",
        admissionStatus: "open",
        duration: "6 Weeks"
    },
    {
        id: 22,
        name: "Blockchain Basics",
        category: "Cloud & Web3 Technologies",
        description: "Foundational decentralized ledgers, cryptographic hashing, consensus mechanisms, transactions, wallet security, and Web3 fundamentals.",
        iconName: "Globe",
        skillLevel: "Beginner",
        admissionStatus: "open",
        duration: "6 Weeks"
    }
];

export interface TrainingDomain {
    id: string;
    name: string;
    description: string;
    iconName: string;
    badge?: string;
    modules: string[];
    courseIds: number[];
}

export const TRAINING_DOMAINS: TrainingDomain[] = [
    {
        id: "fullstack-java",
        name: "Fullstack Java",
        description: "Complete end-to-end enterprise application engineering path using Java, Spring Boot, REST APIs, frontend tools, databases, and AWS deployment.",
        iconName: "FileCode",
        badge: "Enterprise Standard",
        modules: [
            "Front end",
            "Java",
            "Java backend",
            "Database",
            "Advanced Backend – REST API",
            "AWS"
        ],
        courseIds: [1, 3, 7, 11, 18, 15]
    },
    {
        id: "fullstack-python",
        name: "Fullstack Python",
        description: "Modern fullstack development specialization featuring interactive frontends, Python core, FastAPI/Django backends, relational databases, REST APIs, and AWS Cloud.",
        iconName: "Terminal",
        badge: "High Demand",
        modules: [
            "Front end",
            "Python",
            "Python backend",
            "Database",
            "Advanced Backend – REST API",
            "AWS"
        ],
        courseIds: [1, 2, 6, 11, 18, 15]
    },
    {
        id: "aiml-aids",
        name: "AIML, AIDS",
        description: "Advanced Artificial Intelligence, Machine Learning, and Data Science learning path from basic Python data structures to Deep Learning models and Gen AI.",
        iconName: "Brain",
        badge: "AI Track",
        modules: [
            "Python",
            "Front end",
            "Data Science",
            "Machine Learning",
            "Deep Learning",
            "Gen AI"
        ],
        courseIds: [2, 1, 14, 13, 19, 8]
    },
    {
        id: "data-analyst",
        name: "Data Analyst",
        description: "Comprehensive business intelligence and analytics domain path focusing on Excel, relational databases, statistical Python, Power BI dashboards, and real-world projects.",
        iconName: "BarChart3",
        badge: "Analytics Track",
        modules: [
            "Excel",
            "Database",
            "Python",
            "Statistics Python",
            "Power BI",
            "Advanced Project"
        ],
        courseIds: [11, 2, 20, 12, 14]
    },
    {
        id: "web3-developer",
        name: "Web 3 Developer",
        description: "Decentralized application engineering domain path covering modern Web3 frontends, Python scripting, backend services, Web3 protocols, and Solidity smart contracts.",
        iconName: "Globe",
        badge: "Web3 Track",
        modules: [
            "Front end",
            "Python",
            "Backend",
            "Web3",
            "Web3 Frontend",
            "Solidity"
        ],
        courseIds: [1, 2, 6, 16, 17, 18]
    },
    {
        id: "smart-contract-developer",
        name: "Smart Contract Developer",
        description: "Specialized Ethereum and EVM blockchain engineering path covering foundational blockchain concepts, Solidity smart contracts, backend integration, and Hardhat development framework.",
        iconName: "ShieldCheck",
        badge: "Blockchain Track",
        modules: [
            "Front end",
            "Python",
            "Backend",
            "Blockchain Basics",
            "Solidity",
            "Hardhat"
        ],
        courseIds: [1, 2, 6, 22, 17, 21]
    }
];

