export type JournalSource = Readonly<{
  label: string;
  url: string;
}>;

export type JournalSection = Readonly<{
  heading: string;
  paragraphs: ReadonlyArray<string>;
}>;

export type JournalArticle = Readonly<{
  slug: string;
  title: string;
  description: string;
  topic: string;
  serviceSlug: string;
  serviceLabel: string;
  readTime: string;
  coverImage: string;
  coverAlt: string;
  sections: ReadonlyArray<JournalSection>;
  sources: ReadonlyArray<JournalSource>;
}>;

export const journalArticles: ReadonlyArray<JournalArticle> = [
  {
    slug: "before-you-commission-custom-software",
    title: "What should your software actually do?",
    description:
      "A practical guide to finding the right first release by tracing one real request through your business.",
    topic: "Digital products",
    serviceSlug: "digital-products",
    serviceLabel: "Digital products",
    readTime: "3-minute read",
    coverImage:
      "https://res.cloudinary.com/z9nut7zm/image/upload/v1793695419/valtum-studio/editorial/workbench.webp",
    coverAlt: "Hands working at a laptop on a wooden desk",
    sections: [
      {
        heading: "Start with a request, not a feature list.",
        paragraphs: [
          "Take a recent order, booking or customer enquiry. Write down where it arrived, who picked it up, what they checked and what happened next. Include the spreadsheet, the message thread and the person who knows the answer without looking it up. That is the beginning of a software brief.",
          "A feature list says you need a dashboard. Following a request tells you who needs to see it, which information they need and what decision the dashboard should make easier. The second conversation is much more useful when you are paying someone to build."
        ]
      },
      {
        heading: "Look closely at the handoffs.",
        paragraphs: [
          "The most revealing moments are often between tasks. Someone copies an address into another tool. A manager approves a price in a chat. A customer calls because the status on screen does not explain what is happening. These are places to investigate, not automatic reasons to commission a new platform.",
          "For each handoff, note the source of the information, the person responsible and the condition that allows the work to move on. Then follow an exception. What happens when the payment fails, a date changes or the person responsible is away? A useful system gives those situations an explicit place."
        ]
      },
      {
        heading: "Compare changing the process with changing the software.",
        paragraphs: [
          "A new tool is not always the right answer. A clearer responsibility, a better form or a connection between two existing products may remove the problem. Custom software becomes a stronger option when the workflow is distinctive, the existing tools impose meaningful constraints and the business can support the system after launch.",
          "Ask a prospective studio to compare those options. The discovery work should leave you with a recommendation and its reasons, including the option to build less. GOV.UK’s discovery guidance makes a useful distinction: understand the problem before committing to building a service. That principle is useful well beyond government projects."
        ]
      },
      {
        heading: "Define a release that can finish.",
        paragraphs: [
          "Choose one complete journey for the first release. For example, a customer submits a request, an operator reviews it, the customer receives a decision and both can see the record. A smaller journey that works through to the end is easier to assess than five partially implemented modules.",
          "Write the acceptance conditions in plain language. Who can change the record? What does the customer see when a request cannot be fulfilled? What information must survive a failed integration? Agree the conditions before estimating the build, and keep a separate list of later ideas."
        ]
      },
      {
        heading: "Budget for ownership as well as delivery.",
        paragraphs: [
          "The build price is only one part of the decision. Someone will need to own hosting, access, updates, backups, support and the relationship with external services. Ask what is included in the handover and who will have the accounts and source code.",
          "A useful first meeting does not require a polished specification. Bring a real example of the work, the tools it passes through and the point where it becomes difficult. That gives a studio something concrete to challenge, simplify and price."
        ]
      }
    ],
    sources: [
      {
        label: "GOV.UK Service Manual: how the discovery phase works",
        url: "https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works"
      }
    ]
  },
  {
    slug: "motion-that-helps-a-website",
    title: "Motion that knows when to stop.",
    description:
      "How to judge scroll animation, page transitions and interaction design without losing readability, control or speed.",
    topic: "Websites & experiences",
    serviceSlug: "websites-and-experiences",
    serviceLabel: "Websites & experiences",
    readTime: "3-minute read",
    coverImage:
      "https://res.cloudinary.com/z9nut7zm/image/upload/v1793695426/valtum-studio/editorial/engineering.webp",
    coverAlt: "Software code displayed on a laptop beside a window",
    sections: [
      {
        heading: "Motion needs a job.",
        paragraphs: [
          "A project image expands into its case study. A menu opens from the control that triggered it. A diagram traces the relationship between two steps. Each movement explains something about the interface. It gives the visitor a reason to follow the next moment.",
          "The difficulty begins when every element asks for attention at once. Text enters while an image leaves, a pinned gallery competes with the following section, and a page transition plays after the destination has already appeared. The problem is often coordination rather than a shortage of animation."
        ]
      },
      {
        heading: "Give each sequence an owner.",
        paragraphs: [
          "For a scrolling gallery, define where it begins, how long the visitor can inspect each project and when the next section is allowed to enter. The gallery should have enough physical page space to complete that movement. Its position should not also be controlled by a second, unrelated reveal.",
          "The same rule applies at a smaller scale. If one animation handles the position of a card, another can animate the image inside it. Two effects writing to the same transform can create jumps or overwrite each other. A motion plan is partly a choreography document and partly an engineering boundary."
        ]
      },
      {
        heading: "Smooth does not mean slow.",
        paragraphs: [
          "Adding more easing to every layer can make a website feel heavy. The wheel input moves, the page catches up, and then the animation catches up with the page. A visitor has to wait twice. Tune those systems together and test with both small wheel movements and a fast scroll through several sections.",
          "Page transitions need their own order: cover the outgoing page, change the route, prepare the incoming layout, then reveal it. The sequence can feel deliberate without forcing a long pause. The important test is whether the visitor can follow where they went."
        ]
      },
      {
        heading: "Keep a complete experience without the movement.",
        paragraphs: [
          "Some people ask their device to reduce motion. Honour that preference by presenting a stable composition with the same content, links and controls. An animation should not be the only way to discover a service or open a project.",
          "W3C guidance also addresses automatically moving content and the ability to pause, stop or hide it under defined conditions. That makes endless decorative movement a design decision with practical consequences. Scroll controlled scenes, short entrances and explicit controls can give a page character while preserving the reader’s agency."
        ]
      },
      {
        heading: "Judge the journey on a real phone.",
        paragraphs: [
          "Desktop compositions rarely translate by shrinking. A phone has less room for overlapping objects, browser controls change the available height and touch input has a different rhythm. Compose the smaller screen intentionally and retain native touch behaviour where possible.",
          "Finally, inspect performance alongside the visuals. Core Web Vitals cover loading, responsiveness and layout stability. They cannot tell you whether the art direction is good, but they can expose the cost of an experience that looks polished while being difficult to use. A good motion review considers both."
        ]
      }
    ],
    sources: [
      {
        label: "W3C: Animation from Interactions",
        url: "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html"
      },
      {
        label: "W3C: Pause, Stop, Hide",
        url: "https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html"
      },
      {
        label: "Google Search Central: Core Web Vitals",
        url: "https://developers.google.com/search/docs/appearance/core-web-vitals"
      }
    ]
  },
  {
    slug: "automate-the-handoff-not-the-mess",
    title: "Automate the handoff, not the headache.",
    description:
      "What to decide before connecting business tools or adding AI to a workflow, from record ownership to failed requests.",
    topic: "Connected operations",
    serviceSlug: "connected-operations",
    serviceLabel: "Connected operations",
    readTime: "3-minute read",
    coverImage:
      "https://res.cloudinary.com/z9nut7zm/image/upload/v1793695413/valtum-studio/editorial/workspace.webp",
    coverAlt: "A laptop on a wooden desk beside stationery and a plant",
    sections: [
      {
        heading: "Start where information changes hands.",
        paragraphs: [
          "An enquiry arrives in an inbox. Someone enters it in a customer system, sends a confirmation and creates a task for another person. Connecting those steps can be useful. But first decide which step establishes the record and which person is accountable for it.",
          "Without that decision, automation can spread an incorrect value faster than a person could copy it. Map the source, destination, required fields and expected result. Then decide whether the proposed connection removes enough repeated effort to justify operating it."
        ]
      },
      {
        heading: "Choose one record of truth.",
        paragraphs: [
          "A customer’s email address might exist in several tools. Which tool is allowed to change it? How do those changes reach the others? A workflow needs an answer before two systems begin writing over each other’s data.",
          "Use a stable identifier to connect related records. Names and email addresses can change. A shared order or request identifier makes it easier to trace what happened and avoid creating a second record when a task is retried. The exact approach depends on the systems being connected and the guarantees their APIs offer."
        ]
      },
      {
        heading: "Design the failed attempt.",
        paragraphs: [
          "A successful request is only one branch of the workflow. External services can be unavailable, credentials can expire and a response can arrive after the caller has stopped waiting. Decide which failures can be retried, how often and what should happen when the attempts are exhausted.",
          "Stripe’s documentation on idempotent requests is a useful concrete example: an operation can carry a key so a retry does not automatically mean a duplicate action. That behaviour is specific to the API and operation. Do not assume every tool supports it, or that a retry is harmless."
        ]
      },
      {
        heading: "Give the exception a visible destination.",
        paragraphs: [
          "A failed workflow should create something a person can act on: the request, the reason it stopped, the previous attempts and the next safe step. Sending every failure into a busy inbox is often just another way of hiding a queue.",
          "Agree who checks that queue and how they recover the work. Include a way to correct bad information without silently losing the original request. A practical automation project connects the normal path and the recovery path. Both need an owner."
        ]
      },
      {
        heading: "Add AI only where judgment can be checked.",
        paragraphs: [
          "Extracting fields from a document or suggesting a reply may be a useful place to test an AI tool. Define the task, use representative examples and decide what counts as an acceptable result. Keep a review step for actions where an incorrect suggestion would matter.",
          "NIST’s AI Risk Management Framework offers a structured way to think about context, measurement and management. It is a useful reference, not proof that a particular tool is safe or accurate. Begin with a bounded workflow, record what you learn and expand only when the evidence supports it."
        ]
      }
    ],
    sources: [
      {
        label: "Stripe: Idempotent requests",
        url: "https://docs.stripe.com/api/idempotent_requests"
      },
      {
        label: "NIST: AI Risk Management Framework",
        url: "https://www.nist.gov/itl/ai-risk-management-framework"
      }
    ]
  }
];

export function getJournalArticle(slug: string): JournalArticle | undefined {
  return journalArticles.find((article) => article.slug === slug);
}
