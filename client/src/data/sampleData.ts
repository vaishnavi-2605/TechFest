import { TeamMember, Sponsor, FAQItem, ScheduleItem } from "@/types";


export const teamMembers: TeamMember[] = [
  { id: "1", name: "Arjun Mehta", role: "Fest Convenor", team: "Core Team", avatar: "" },
  { id: "2", name: "Priya Sharma", role: "Vice Convenor", team: "Core Team", avatar: "" },
  { id: "3", name: "Rohan Deshmukh", role: "General Secretary", team: "Core Team", avatar: "" },
  { id: "4", name: "Sneha Kulkarni", role: "Treasurer", team: "Core Team", avatar: "" },
  { id: "5", name: "Aditya Patil", role: "Tech Lead", team: "Technical", avatar: "" },
  { id: "6", name: "Kavya Nair", role: "Web Developer", team: "Technical", avatar: "" },
  { id: "7", name: "Rahul Joshi", role: "App Developer", team: "Technical", avatar: "" },
  { id: "8", name: "Ananya Iyer", role: "Marketing Head", team: "Marketing", avatar: "" },
  { id: "9", name: "Vikram Singh", role: "PR Manager", team: "Marketing", avatar: "" },
  { id: "10", name: "Meera Reddy", role: "Social Media Lead", team: "Marketing", avatar: "" },
  { id: "11", name: "Ishaan Gupta", role: "Design Head", team: "Design", avatar: "" },
  { id: "12", name: "Tanvi Bhatt", role: "UI/UX Designer", team: "Design", avatar: "" },
];

export const sponsors: Sponsor[] = [
  { id: "1", name: "TechCorp", tier: "Title", logo: "", url: "#" },
  { id: "2", name: "InnovateLabs", tier: "Gold", logo: "", url: "#" },
  { id: "3", name: "CodeForge", tier: "Gold", logo: "", url: "#" },
  { id: "4", name: "DataFlow", tier: "Gold", logo: "", url: "#" },
  { id: "5", name: "CloudNine", tier: "Silver", logo: "", url: "#" },
  { id: "6", name: "ByteWise", tier: "Silver", logo: "", url: "#" },
  { id: "7", name: "NeuralNet", tier: "Silver", logo: "", url: "#" },
  { id: "8", name: "PixelPerfect", tier: "Silver", logo: "", url: "#" },
];

export const faqItems: FAQItem[] = [
  { id: "1", question: "How do I register for TechFest 2026?", answer: "You can register through our website by clicking the 'Register Now' button. Fill in your personal details, select your events, and submit the form." },
  { id: "2", question: "Can I participate in multiple events?", answer: "Yes! You can register for as many events as you want, as long as the timings don't overlap. Check the schedule page for timing details." },
  { id: "3", question: "Is there an entry fee?", answer: "Some events have a nominal registration fee while others are free. The fee details are mentioned on each event's page." },
  { id: "4", question: "Is accommodation provided for outstation participants?", answer: "Yes, we provide accommodation for outstation participants at nominal charges. Please mention your requirement during registration." },
  { id: "5", question: "What should I bring to the hackathon?", answer: "Bring your laptop, charger, and any hardware you might need. We'll provide Wi-Fi, power strips, food, and beverages." },
  { id: "6", question: "Are there any prerequisites for workshops?", answer: "Basic prerequisites are mentioned in each workshop description. Generally, a laptop with the required software installed is sufficient." },
  { id: "7", question: "How will prizes be distributed?", answer: "Prizes will be distributed during the closing ceremony on Day 2. Winners will receive certificates and prize money via bank transfer." },
  { id: "8", question: "Can I get a participation certificate?", answer: "Yes, all registered participants will receive digital participation certificates after the fest." },
  { id: "9", question: "Is there parking available?", answer: "Yes, free parking is available on the college campus for two-wheelers and four-wheelers." },
  { id: "10", question: "How can I contact the organizers?", answer: "You can reach us at techfest@mitcoe.edu.in or call us at +91 98765 43210. You can also DM us on Instagram @techfest2026." },
];

export const scheduleItems: ScheduleItem[] = [
  { id: "1", time: "9:00 AM", eventName: "Inauguration Ceremony", venue: "Main Auditorium", category: "Non-Technical", day: 1 },
  { id: "2", time: "10:00 AM", eventName: "CodeStorm Kickoff", venue: "CS Lab 1 & 2", category: "Technical", day: 1 },
  { id: "3", time: "10:30 AM", eventName: "Paper Presentation", venue: "Seminar Hall A", category: "Technical", day: 1 },
  { id: "4", time: "11:00 AM", eventName: "Quiz Prelims", venue: "Room 201", category: "Non-Technical", day: 1 },
  { id: "5", time: "2:00 PM", eventName: "AI Ideathon", venue: "Innovation Lab", category: "Technical", day: 1 },
  { id: "6", time: "2:00 PM", eventName: "WebDev Sprint", venue: "CS Lab 3", category: "Workshops", day: 1 },
  { id: "7", time: "3:00 PM", eventName: "Gaming Tournament", venue: "Gaming Arena", category: "Non-Technical", day: 1 },
  { id: "8", time: "5:00 PM", eventName: "Cultural Night", venue: "Open Air Theatre", category: "Non-Technical", day: 1 },
  { id: "9", time: "9:00 AM", eventName: "RoboWar Begins", venue: "Robotics Arena", category: "Technical", day: 2 },
  { id: "10", time: "10:00 AM", eventName: "UI Battle", venue: "Design Lab", category: "Technical", day: 2 },
  { id: "11", time: "10:00 AM", eventName: "Data Science Challenge", venue: "CS Lab 1", category: "Workshops", day: 2 },
  { id: "12", time: "11:00 AM", eventName: "Circuit Design", venue: "Electronics Lab", category: "Technical", day: 2 },
  { id: "13", time: "2:00 PM", eventName: "Quiz Finals", venue: "Main Auditorium", category: "Non-Technical", day: 2 },
  { id: "14", time: "4:00 PM", eventName: "CodeStorm Demo", venue: "CS Lab 1 & 2", category: "Technical", day: 2 },
  { id: "15", time: "6:00 PM", eventName: "Closing Ceremony & Prizes", venue: "Main Auditorium", category: "Non-Technical", day: 2 },
];
