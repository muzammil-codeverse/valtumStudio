import type { PublicProjectDTO } from "@/modules/public-content/types/dto";

export type ProjectStory = {
  slug: string;
  title: string;
  index: string;
  field: string;
  premise: string;
  headline: string;
  image: string;
  alt: string;
  theme: string;
  intro: string;
  question: string;
  answer: string;
  chapters: ReadonlyArray<{ title: string; body: string }>;
  sequence: ReadonlyArray<string>;
  detail: string;
};

export const stories: ReadonlyArray<ProjectStory> = [
  {
    slug: "aegis-sentinel",
    title: "Aegis Sentinel",
    index: "01",
    field: "Computer vision · Evidence systems",
    premise: "From a fleeting observation to a record worth examining.",
    headline: "Seeing is only\nthe beginning.",
    image: "/products/aegis.webp",
    alt: "Actual aegis website",
    theme: "aegis",
    intro:
      "A camera can capture a moment. Understanding it takes context. Aegis Sentinel brings computer vision, case management and evidence integrity into one considered workflow.",
    question: "What happens after the camera notices something?",
    answer:
      "An observation needs a source, a history and a person who can question it. We shaped the product around that journey, keeping machine inference separate from human judgment.",
    chapters: [
      {
        title: "Keep the original in view.",
        body: "Detection is a starting point. The observation stays connected to its source material as it moves into a case, so a reviewer can return to what was captured rather than rely on a generated description."
      },
      {
        title: "Give evidence a memory.",
        body: "Evidence records and custody events preserve the relationship between an artifact and the actions taken around it. Integrity checks make that history inspectable instead of asking a reviewer to take it on trust."
      },
      {
        title: "Leave room for judgment.",
        body: "Model evaluation and review belong inside the product story. An inference carries uncertainty. The interface gives a person the context to investigate before deciding what the observation means."
      }
    ],
    sequence: ["Observation", "Inference", "Case record", "Human review", "Evidence"],
    detail:
      "The engineering decision: separate the model output from the evidence record. Predictions can be reviewed without rewriting the source material that made the review possible."
  },
  {
    slug: "laugh-and-lodge",
    title: "Laugh & Lodge",
    index: "02",
    field: "Hospitality · Booking platforms",
    premise: "A quiet escape. A carefully coordinated transaction.",
    headline: "The stay begins\nbefore arrival.",
    image: "/products/lodge.webp",
    alt: "Actual lodge website",
    theme: "lodge",
    intro:
      "The guest sees a room, chooses a date and imagines being there. Behind that simple act, availability, payments and property operations have to agree. Laugh & Lodge brings both sides of the reservation together.",
    question: "How do you protect a moment of possibility?",
    answer:
      "The experience should feel unhurried. The system cannot be. A temporary hold protects the selected dates while checkout happens, then payment events determine what comes next.",
    chapters: [
      {
        title: "Make room for the guest.",
        body: "Photography establishes the feeling of a place. Search, dates, guests and pricing give that feeling a practical next step. The interface keeps the property at the centre of the decision."
      },
      {
        title: "Treat availability as a promise.",
        body: "Overlapping requests need an authoritative answer. Temporary reservations create a bounded checkout window, with expiry returning inventory to the pool rather than leaving it stranded."
      },
      {
        title: "Follow the money through.",
        body: "The checkout response is only one part of the story. Payment events, booking confirmation and vendor ledger entries carry the reservation into the operational and financial systems that fulfil it."
      }
    ],
    sequence: [
      "Choose dates",
      "Hold inventory",
      "Checkout",
      "Payment event",
      "Confirmation"
    ],
    detail:
      "The engineering decision: confirmation follows an authoritative payment event. The booking state and the financial trail remain distinct, connected responsibilities."
  },
  {
    slug: "kt-couriers",
    title: "KT Couriers",
    index: "03",
    field: "Logistics · Connected operations",
    premise: "One delivery. Every handoff accounted for.",
    headline: "A parcel moves.\nA system follows.",
    image: "/products/courier.webp",
    alt: "Actual courier website",
    theme: "courier",
    intro:
      "A delivery passes through many hands, but it should never lose its story. KT Couriers connects the customer, merchant, dispatcher and driver around the same order.",
    question: "Who owns the next move?",
    answer:
      "At each handoff, somebody gains responsibility. The software needs to know who can act, what has changed and which conditions must hold before the delivery can progress.",
    chapters: [
      {
        title: "An order is more than an address.",
        body: "Inventory, payment responsibilities and fulfilment requirements begin the journey before a driver is assigned. The order becomes a shared operational reference across different roles."
      },
      {
        title: "Dispatch with context.",
        body: "Driver eligibility and explicit dispatch transitions give allocation a clear structure. Permissions determine who can move the order forward, while custody records preserve what happened along the way."
      },
      {
        title: "Delivery is not the final entry.",
        body: "Proof of delivery closes a physical handoff. Reconciliation closes a different loop, connecting charges, obligations and financial records to the work that was carried out."
      }
    ],
    sequence: ["Order", "Allocation", "Collection", "Custody", "Delivery"],
    detail:
      "The engineering decision: model responsibility as explicit transitions. A delivery status becomes an accountable action with conditions, rather than an editable label."
  },
  {
    slug: "math-intellect",
    title: "Math Intellect",
    index: "04",
    field: "Simulation · Analytical software",
    premise: "Change an assumption. See what follows.",
    headline: "A better question.\nA different possibility.",
    image: "/products/math.webp",
    alt: "Actual math website",
    theme: "math",
    intro:
      "The most interesting part of a calculation is often the assumption that came before it. Math Intellect makes mathematical experiments something you can explore, compare and interrogate.",
    question: "What if one assumption changed?",
    answer:
      "A useful analytical tool lets you follow that change. Inputs, model rules and results remain visible together, so the output can be understood in the context of the experiment that produced it.",
    chapters: [
      {
        title: "Start with a premise.",
        body: "Market dynamics, agent interactions and Monte Carlo experiments ask different questions. Each model family needs its own inputs and explanation, rather than one generic simulation screen."
      },
      {
        title: "Make variation visible.",
        body: "Parameter controls create a direct relationship between a chosen assumption and a calculated result. Repeatable examples help a reader distinguish a model change from a different random draw."
      },
      {
        title: "Keep interpretation close.",
        body: "An output is meaningful within a model and its constraints. The experience keeps those boundaries alongside the result, giving the person using it something to reason with."
      }
    ],
    sequence: ["Question", "Assumption", "Model", "Calculation", "Interpretation"],
    detail:
      "The engineering decision: preserve the identity of each model. A mean reverting public demonstration and a geometric Brownian motion engine answer different questions and are presented accordingly."
  },
  {
    slug: "personality-assessor",
    title: "Personality Assessor",
    index: "05",
    field: "Decision support · Applied intelligence",
    premise: "An answer becomes useful when you can follow its meaning.",
    headline: "A person is more\nthan a result.",
    image: "/products/personality.webp",
    alt: "Actual personality website",
    theme: "personality",
    intro:
      "One answer can reveal more than one kind of evidence. Personality Assessor brings those contributions into a living record, connecting structured scoring with understandable career guidance.",
    question: "Can guidance show its working?",
    answer:
      "A result should lead back to its source. The product keeps a response visible through scoring, confidence and matching, with an optional narrative layer that explains rather than replaces the calculation.",
    chapters: [
      {
        title: "Keep the answer attached.",
        body: "A response can contribute to personality dimensions, interests and work values. The living record preserves those relationships instead of collapsing them into a single opaque label."
      },
      {
        title: "Show the strength of the evidence.",
        body: "Confidence and completeness help put a score in context. Career matching adds reasons and gaps, making comparison more useful than a ranked list without explanation."
      },
      {
        title: "Let explanation remain optional.",
        body: "Deterministic scoring and career matching sit apart from AI generated narrative. An explanation can help someone understand the record without becoming the authority that decides the numbers."
      }
    ],
    sequence: ["Response", "Contributions", "Scoring", "Confidence", "Guidance"],
    detail:
      "The engineering decision: separate calculation from interpretation. This is a tool for reflection and nonclinical career exploration, with the original response retained as the point of reference."
  }
];

export function getStory(slug: string): ProjectStory | undefined {
  return stories.find((story) => story.slug === slug);
}

// CMS records may enrich a story, but private/draft media never enters this layer.
export function withPublishedMedia(
  story: ProjectStory,
  projects: ReadonlyArray<PublicProjectDTO>
): ProjectStory {
  const record = projects.find((project) => project.slug === story.slug);
  const media = record?.coverAsset;
  return media?.mimeType.startsWith("image/")
    ? { ...story, image: media.url, alt: media.altText?.trim() || story.alt }
    : story;
}

export const offerings = [
  {
    number: "01",
    title: "Products & platforms",
    line: "Turn the way your business works into software that fits.",
    body: "Customer portals, internal tools, SaaS products and mobile experiences. We connect the interface to the workflows, data and integrations beneath it.",
    items: [
      "Product strategy",
      "UX and interface design",
      "Web and mobile applications",
      "APIs and integrations"
    ],
    proof: "kt-couriers",
    image: "courier"
  },
  {
    number: "02",
    title: "Applied intelligence",
    line: "Give information a useful next step.",
    body: "Computer vision, analytical tools and AI supported workflows. We begin with the task, establish what can be evaluated and keep human judgment where it belongs.",
    items: [
      "Computer vision",
      "Workflow automation",
      "Decision support",
      "Analytics and simulation"
    ],
    proof: "aegis-sentinel",
    image: "aegis"
  },
  {
    number: "03",
    title: "Commerce & operations",
    line: "Make every transaction work beyond the checkout.",
    body: "Booking systems, marketplaces, inventory and logistics. The customer journey and the operational journey are designed together, from the first request to the financial record.",
    items: [
      "Booking and marketplaces",
      "Inventory and dispatch",
      "Payments and ledgers",
      "Role based portals"
    ],
    proof: "laugh-and-lodge",
    image: "lodge"
  },
  {
    number: "04",
    title: "Digital experiences",
    line: "Build something people remember using.",
    body: "Distinctive websites and expressive product interfaces, directed with care and engineered for everyday use. Photography, typography and motion become part of how the story is told.",
    items: [
      "Creative direction",
      "Frontend engineering",
      "Interaction and motion",
      "Responsive experiences"
    ],
    proof: "math-intellect",
    image: "coast"
  }
] as const;

export const approach = [
  {
    title: "Find the real question.",
    name: "Discover",
    text: "We start with the people, decisions and constraints behind the brief. What needs to change? What already works? What would make this worth building?",
    output: "A shared brief, workflow map and clear priorities."
  },
  {
    title: "Make the difficult decisions early.",
    name: "Define",
    text: "We work through product boundaries, technical options and the riskiest assumptions. Prototypes give important ideas something concrete to be tested against.",
    output: "A product direction, system outline and delivery plan."
  },
  {
    title: "Design what people see. Build what they need.",
    name: "Create",
    text: "Experience design and engineering develop together. Interfaces, business rules and integrations are reviewed as one product, with progress visible throughout the work.",
    output: "Working software, considered interfaces and reviewable increments."
  },
  {
    title: "Stay with the details.",
    name: "Refine",
    text: "We examine the journeys that matter, including the moments when things do not go to plan. Testing, accessibility and performance inform the handover and the work that follows.",
    output: "Verified journeys, documentation and a considered next step."
  }
] as const;
