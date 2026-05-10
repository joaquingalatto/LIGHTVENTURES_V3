window.PORTFOLIO_DATA = {
  categories: [
    {
      key: "all",
      label: "All",
      accent: "var(--text)",
      foreground: "var(--bg)",
      companies: [],
    },
    {
      key: "life-science",
      label: "Life Science",
      accent: "#dfe88f",
      foreground: "var(--text)",
      companies: [
        {
          name: "ViroMissile",
          asset: "assets/portfolio/viromissile.svg",
        },
        {
          name: "MEVA",
          asset: "",
        },
      ],
    },
    {
      key: "technology",
      label: "Technology",
      accent: "#aebdb8",
      foreground: "var(--text)",
      companies: [
        {
          name: "Monarch Quantum",
          asset: "assets/portfolio/monarch-quantum.svg",
        },
        {
          name: "Live Data Technologies",
          asset: "assets/portfolio/live-data-technologies.svg",
        },
        {
          name: "Stealth",
          asset: "",
        },
      ],
    },
    {
      key: "healthcare",
      label: "Healthcare",
      accent: "#f05a28",
      foreground: "var(--bg)",
      companies: [
        {
          name: "Rad AI",
          asset: "assets/portfolio/rad-ai.svg",
        },
        {
          name: "Ultrasound AI",
          asset: "assets/portfolio/ultrasound-ai.svg",
        },
        {
          name: "MedWatch Technologies",
          asset: "assets/portfolio/medwatch-technologies.svg",
        },
      ],
    },
    {
      key: "ai-applications",
      label: "AI Applications",
      accent: "#3e3ac3",
      foreground: "var(--bg)",
      companies: [
        {
          name: "Illuno",
          asset: "assets/portfolio/illuno.svg",
        },
        {
          name: "SeedsMatch",
          asset: "assets/portfolio/seedsmatch.svg",
        },
      ],
    },
  ],
  notableExits: [
    {
      name: "Daylight Solutions",
      detail: "Acquired by Leonardo DRS in 2017",
      metric: "51% IRR",
    },
    {
      name: "Elastin Skincare",
      detail: "Acquired by Galderma in 2021 for $700M",
      metric: "7x return",
    },
    {
      name: "Prometheus Biosciences",
      detail: "Acquired by Merck in 2023 for $10.8B",
      metric: "34x return",
    },
    {
      name: "BioIQ, Inc.",
      detail: "Acquired by LetsGetChecked in 2022",
      metric: "40% IRR",
    },
  ],
};
