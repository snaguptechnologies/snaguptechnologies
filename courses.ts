export interface CourseItem {
    id: number;
    name: string;
    category: string;
    description: string;
    iconName: string;
    badgeText?: string;
    admissionStatus: 'open' | 'starting_soon';
}

export const UPCOMING_LEARNING_CLUSTERS: CourseItem[] = [
    {
        id: 1,
        name: "Introduction to C",
        category: "Programming",
        description: "Master foundational C programming, memory management, pointers, and data structures.",
        iconName: "Code",
        admissionStatus: "open"
    },
    {
        id: 2,
        name: "Java Programming Language",
        category: "Programming",
        description: "Comprehensive object-oriented programming, OOPs principles, collections, and enterprise java applications.",
        iconName: "FileCode",
        admissionStatus: "open"
    },
    {
        id: 3,
        name: "Data Analytics: Power BI",
        category: "Data Science",
        description: "Transform raw business data into interactive dashboards, DAX queries, and executive reports.",
        iconName: "BarChart3",
        admissionStatus: "open"
    },
    {
        id: 4,
        name: "Python Mastery",
        category: "Programming",
        description: "End-to-end Python programming from fundamentals to web scraping, automation, and backend APIs.",
        iconName: "Terminal",
        admissionStatus: "open"
    },
    {
        id: 5,
        name: "Frontend Technologies",
        category: "Web Development",
        description: "Build high-performance responsive web applications with HTML5, CSS3, ES6+ JS, and React framework.",
        iconName: "Layout",
        admissionStatus: "open"
    },
    {
        id: 6,
        name: "Embedded Programming",
        category: "Embedded Systems",
        description: "Comprehensive embedded C systems programming, ARM microcontrollers, sensors, and IoT hardware interop.",
        iconName: "Cpu",
        admissionStatus: "open"
    },
    {
        id: 7,
        name: "Prompt Engineering",
        category: "Artificial Intelligence",
        description: "Master LLM prompt optimization, chain-of-thought techniques, RAG architectures, and AI agent workflows.",
        iconName: "Sparkles",
        admissionStatus: "open"
    },
    {
        id: 8,
        name: "VLSI Design",
        category: "Hardware Engineering",
        description: "Verilog HDL, digital logic design, FPGA prototyping, CMOS VLSI architecture, and chip synthesis.",
        iconName: "Microchip",
        admissionStatus: "open"
    },
    {
        id: 9,
        name: "FullStack Development",
        category: "Web Development",
        description: "Complete full-stack mastery combining modern React/Next.js frontend with Node.js, Express, and databases.",
        iconName: "Layers",
        admissionStatus: "open"
    },
    {
        id: 10,
        name: "Hi-Tech Agriculture",
        category: "AgriTech", description: "Precision farming, IoT soil sensors, automated hydroponic systems, and agricultural technology solutions.",
        iconName: "Sprout",
        admissionStatus: "open"
    },
    {
        id: 11,
        name: "Remote Sensing & GIS Programs",
        category: "Geospatial Tech",
        description: "Geographic Information Systems (GIS), satellite imagery processing, spatial analysis, and mapping software.",
        iconName: "Globe",
        admissionStatus: "open"
    },
    {
        id: 12,
        name: "Generative AI (Gen AI)",
        category: "Artificial Intelligence",
        description: "Deep learning models, diffusion image generators, transformer architectures, and building custom GenAI tools.",
        iconName: "Bot",
        admissionStatus: "open"
    },
    {
        id: 13,
        name: "Machine Learning (ML)",
        category: "Artificial Intelligence",
        description: "Supervised and unsupervised learning, regression, classification algorithms, neural networks, and model deployment.",
        iconName: "Brain",
        admissionStatus: "open"
    }
];
