export const serviceStories = [
  {
    slug: "digital-products",
    title: "Digital products",
    short: "A product people choose to use.",
    intro:
      "The best product ideas begin with a change someone wants to make. We help you find the useful part, give it a clear shape and build the software around it.",
    image: "sketch",
    alt: "A designer developing a drawing beside a laptop",
    proof: "kt-couriers",
    items: [
      "Product discovery and definition",
      "Experience and interface design",
      "Web applications and customer portals",
      "Responsive product experiences",
      "APIs and system architecture"
    ],
    challenge: "You have the opportunity. The product still needs a shape.",
    approach:
      "We work through the people, journeys and decisions behind the idea before turning them into screens. Prototypes test the uncertain parts early. Design and engineering then move together, so the finished product follows the same logic as the original ambition.",
    outcome:
      "A shared product direction, a considered interface and working software with clear boundaries. You can see what has been built, understand the decisions and plan what comes next."
  },
  {
    slug: "websites-and-experiences",
    title: "Websites & experiences",
    short: "A first impression with something behind it.",
    intro:
      "A website should sound like the business, feel like the brand and make the next step obvious. We bring writing, art direction and frontend engineering into the same room.",
    image: "architecture",
    alt: "A person moving through a carefully composed architectural space",
    proof: "laugh-and-lodge",
    items: [
      "Creative direction and content structure",
      "Website and interface design",
      "Editorial imagery and typography",
      "Scroll choreography and interaction",
      "Mobile performance and accessibility"
    ],
    challenge: "Your business has moved on. Your website has not.",
    approach:
      "We begin with what a visitor needs to understand, believe and do. The story gives the page its structure. Photography gives it a world. Motion connects the scenes, while navigation, speed and clear language keep the experience useful.",
    outcome:
      "A distinctive public website, designed for a real audience and built for everyday use. The mobile experience gets its own composition, rather than a smaller copy of the desktop."
  },
  {
    slug: "intelligent-systems",
    title: "Intelligent systems",
    short: "Make the information useful.",
    intro:
      "A prediction, a document or a pattern only helps when someone can act on it. We build analytical and AI supported experiences that keep their sources, assumptions and limits in view.",
    image: "detail",
    alt: "People working through information on a laptop",
    proof: "aegis-sentinel",
    items: [
      "Computer vision and review workflows",
      "Document and knowledge tools",
      "Explainable decision support",
      "Analytical dashboards",
      "Simulation and scenario tools"
    ],
    challenge: "There is plenty of information. The next decision is still difficult.",
    approach:
      "We define the task and the evidence first. Then we choose the combination of rules, models and human review that suits it. Evaluation is part of the product, so a polished explanation never has to stand in for a reliable result.",
    outcome:
      "A usable intelligence workflow with inspectable inputs, clear responsibilities and meaningful controls. The people using it can understand what the system is suggesting and where their judgment belongs."
  },
  {
    slug: "connected-operations",
    title: "Connected operations",
    short: "Let the whole business keep up.",
    intro:
      "A beautiful customer journey can unravel behind the scenes. We connect the booking, the payment, the handoff and the record so the experience can follow through on its promise.",
    image: "collaboration",
    alt: "A shared work surface with laptops, notes and people collaborating",
    proof: "kt-couriers",
    items: [
      "Booking and marketplace platforms",
      "Workflow and approval systems",
      "Inventory and dispatch",
      "Payments and financial records",
      "Business tools and integrations"
    ],
    challenge: "The work gets done. Keeping it together takes too much effort.",
    approach:
      "We follow one real journey across the people and systems involved. That reveals where information is repeated, responsibility becomes unclear or an exception gets lost. The software is designed around those handoffs, with a clear record of what happened.",
    outcome:
      "Connected workflows, less repeated handling and a system the team can understand. Customer actions and operational responsibilities are designed as parts of the same product."
  }
] as const;
export function getService(slug: string) {
  return serviceStories.find((service) => service.slug === slug);
}
