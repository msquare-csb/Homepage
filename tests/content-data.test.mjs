import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import * as memberDisplay from "../lib/memberDisplay.mjs";

const { formatMemberCardAffiliation } = memberDisplay;

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

function readJson(relativePath) {
  const filePath = join(rootDir, relativePath);
  assert.ok(existsSync(filePath), `${relativePath} should exist`);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function listFiles(relativePath, extensions) {
  const absolutePath = join(rootDir, relativePath);
  if (!existsSync(absolutePath)) {
    return [];
  }
  return readdirSync(absolutePath).flatMap((entry) => {
    const childRelativePath = join(relativePath, entry);
    const childAbsolutePath = join(rootDir, childRelativePath);
    if (statSync(childAbsolutePath).isDirectory()) {
      return listFiles(childRelativePath, extensions);
    }
    return extensions.some((extension) => childRelativePath.endsWith(extension))
      ? [childRelativePath]
      : [];
  });
}

test("editable content data files exist", () => {
  [
    "data/home.json",
    "data/news.json",
    "data/research-sessions.json",
    "data/member-sections.json",
    "data/outcomes.json",
    "data/navigation.json",
    "data/site.json"
  ].forEach((relativePath) => {
    assert.ok(existsSync(join(rootDir, relativePath)), `${relativePath} should exist`);
  });
});

test("news items use stable ids and sortable dates", () => {
  const news = readJson("data/news.json");

  assert.ok(Array.isArray(news));
  assert.ok(news.length >= 1);

  news.forEach((item) => {
    assert.match(item.id, /^[a-z0-9-]+$/);
    assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(typeof item.title, "string");
    assert.equal(typeof item.text, "string");
  });
});

test("Sungkyunkwan new chapter news is dated July 1", () => {
  const news = readJson("data/news.json");
  const item = news.find((entry) => entry.id === "2026-09-sungkyunkwan");

  assert.ok(item, "Sungkyunkwan new chapter news should exist");
  assert.equal(item.date, "2026-07-01");
});

test("AI Co-Scientist award news includes its image and winning project", () => {
  const news = readJson("data/news.json");
  const newsPage = readFileSync(join(rootDir, "app/news/page.js"), "utf8");
  const item = news.find((entry) => entry.id === "2026-ai-co-scientist-excellence-award");

  assert.ok(item, "AI Co-Scientist award news should exist");
  assert.equal(item.date, "2026-04-24");
  assert.equal(item.image, "/images/News/2026.04.24.jpg");
  assert.ok(existsSync(join(rootDir, "public/images/News/2026.04.24.jpg")));
  assert.match(item.title, /Track 1 Top Excellence Award/);
  assert.match(item.text, /An AI-Guided Framework for Mobility–Stability-Aware Recipe Generation/);
  assert.match(newsPage, /item\.image \? \(\s*<details/);
  assert.match(newsPage, /className="newsPhotoSummary"/);
  assert.match(newsPage, /className="newsCardToggle"/);
  assert.match(newsPage, /<\/summary>\s*<div className="newsImagePanel">/);
  assert.match(newsPage, /className="newsImagePanel"/);
  assert.doesNotMatch(newsPage, /View photo/);
  assert.doesNotMatch(newsPage, /newsImageModal/);
});

test("Activities and News display dates in month/day/year order", async () => {
  const formatterPath = join(rootDir, "lib/dateDisplay.mjs");
  const activitiesPage = readFileSync(join(rootDir, "app/activities/page.js"), "utf8");
  const newsPage = readFileSync(join(rootDir, "app/news/page.js"), "utf8");
  const activities = readJson("data/activities.json");
  const rohanVisit = activities.find((entry) => entry.title === "Prof. Rohan Mishra Visit");

  assert.ok(existsSync(formatterPath), "shared date formatter should exist");
  const { formatMonthDayYear } = await import(pathToFileURL(formatterPath).href);

  assert.equal(formatMonthDayYear("2026-03-18"), "03/18/2026");
  assert.equal(formatMonthDayYear("2026-07-01"), "07/01/2026");
  assert.match(activitiesPage, /displayDate \|\| formatMonthDayYear\(e\.date\)/);
  assert.match(newsPage, /formatMonthDayYear\(item\.date\)/);
  assert.deepEqual(rohanVisit, {
    date: "2025-11-14",
    displayDate: "11/03-14/2025",
    title: "Prof. Rohan Mishra Visit",
    description: "Academic visit and collaboration period with Prof. Rohan Mishra.",
    images: [
      "/images/Activities/2025.11.3-2025.11.14_1.jpg",
      "/images/Activities/2025.11.3-2025.11.14_2.jpg"
    ]
  });
});

test("Activities dates use the same accent color as News dates", () => {
  const activitiesPage = readFileSync(join(rootDir, "app/activities/page.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.equal((activitiesPage.match(/className="activityDate"/g) || []).length, 2);
  assert.match(
    css,
    /\.newsSimpleDate,\s*\.activityDate\{[^}]*color:#087aa0;/
  );
});

test("Hyeon Woo Kim farewell activity uses natural English phrasing", () => {
  const activities = readJson("data/activities.json");
  const activity = activities.find((entry) => entry.date === "2025-09-17");

  assert.ok(activity, "Hyeon Woo Kim farewell activity should exist");
  assert.equal(activity.title, "Farewell Gathering for Dr. Hyeon Woo Kim");
  assert.equal(activity.description, "A farewell gathering for Dr. Hyeon Woo Kim.");
  assert.notEqual(activity.title, "Dr. Hyeon Woo Kim Farewell");
});

test("Activities do not publish birthday celebrations", () => {
  const activities = readJson("data/activities.json");

  activities.forEach((activity) => {
    assert.doesNotMatch(activity.title, /birthday/i);
    assert.doesNotMatch(activity.description, /birthday/i);
  });
});

test("home data references existing members and research topics", () => {
  const home = readJson("data/home.json");
  const members = readJson("data/members.json");
  const research = readJson("data/research.json");
  const memberNames = new Set(members.map((member) => member.name));
  const researchSlugs = new Set(research.map((topic) => topic.slug));

  assert.ok(Array.isArray(home.slides));
  assert.ok(home.slides.length >= 1);
  assert.ok(Array.isArray(home.researchPreview));
  assert.ok(Array.isArray(home.focusGroups));

  home.slides.forEach((slide) => {
    assert.equal(typeof slide.title, "string");
    assert.ok(slide.image.startsWith("/"));
  });

  home.researchPreview.forEach((item) => {
    assert.ok(researchSlugs.has(item.slug), `unknown research slug: ${item.slug}`);
  });

  home.focusGroups.forEach((group) => {
    assert.ok(Array.isArray(group.memberNames));
    group.memberNames.forEach((name) => {
      assert.ok(memberNames.has(name), `unknown member in focus group: ${name}`);
    });
  });
});

test("home research groups follow the Members page process and in-process order", () => {
  assert.equal(typeof memberDisplay.sortMembersBySectionOrder, "function");

  const home = readJson("data/home.json");
  const members = readJson("data/members.json");
  const memberSections = readJson("data/member-sections.json");
  const memberMap = new Map(members.map((member) => [member.name, member]));
  const expectedNames = {
    AI: ["Han Uk Lee", "Dong Won Jeon", "Ji Hoon Hong", "Juhyeon Ha", "Jindong Hwang"],
    "Multi-scale": ["Min Sung Kang", "Ji Hoon Hong", "Jeu Shin", "Jonghun Seo"],
    Nucleation: [
      "Han Uk Lee",
      "Min Sung Kang",
      "Jimin Kim",
      "Sungjun Kim",
      "Seojun Moon",
      "Jaeseon Yoo"
    ]
  };

  home.focusGroups.forEach((group) => {
    const people = group.memberNames.map((name) => memberMap.get(name)).filter(Boolean);
    const sortedPeople = memberDisplay.sortMembersBySectionOrder(
      people,
      memberSections.currentSections,
      members
    );

    assert.deepEqual(
      sortedPeople.map((member) => member.name),
      expectedNames[group.label]
    );
  });

  const page = readFileSync(join(rootDir, "app/page.js"), "utf8");
  assert.match(page, /sortMembersBySectionOrder\(/);
});

test("home carousel uses the eight current research images without duplicates", () => {
  const home = readJson("data/home.json");
  const imagePaths = home.slides.map((slide) => slide.image);

  assert.equal(home.slides.length, 8);
  assert.equal(new Set(imagePaths).size, 8);
  imagePaths.forEach((imagePath) => {
    assert.match(imagePath, /^\/images\/Research\/.+\.png$/);
    assert.ok(existsSync(join(rootDir, "public", imagePath.replace(/^\//, ""))));
  });
});

test("home carousel captions briefly summarize each research focus", () => {
  const home = readJson("data/home.json");
  const expectedDescriptions = {
    "AI-Assisted Synthesis Recipe Design":
      "Uses literature, simulations, and experiments to prioritize testable synthesis conditions.",
    "Multiscale & Multiphysics Modeling":
      "Links atomic-scale interactions to coupled material, process, and device behavior.",
    "Nucleation Theory":
      "Maps reaction pathways and nucleation barriers to guide phase-selective synthesis.",
    "Oxide Semiconductors":
      "Builds predictive design rules for stable, high-performance oxide TFTs.",
    "Battery Materials & Processing":
      "Connects electrode processing and interface chemistry to stable battery performance.",
    "Power Semiconductors":
      "Links growth chemistry and reactor conditions to scalable power-semiconductor manufacturing.",
    "Topological Semimetals":
      "Screens topological semimetals and evaluates their nanoscale transport properties.",
    "Ferroelectrics & Dielectrics":
      "Guides phase stability, polarization control, and reliable dielectric device operation."
  };

  home.slides.forEach((slide) => {
    assert.equal(slide.description, expectedDescriptions[slide.title]);
    assert.ok(
      slide.description.split(/\s+/).length <= 12,
      `${slide.title} caption should stay brief`
    );
  });
});

test("home carousel keeps captions outside the image stage", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(
    css,
    /\.homeHero \.sliderView\{\s*aspect-ratio:1\.28 \/ 1;\s*display:grid;\s*grid-template-rows:minmax\(0, 1fr\) auto;/
  );
  assert.match(
    css,
    /\.homeSlideCaption\{\s*position:relative;\s*grid-row:2;\s*left:auto;\s*right:auto;\s*bottom:auto;/
  );
});

test("home carousel restarts autoplay after every slide change", () => {
  const page = readFileSync(join(rootDir, "app/page.js"), "utf8");

  assert.doesNotMatch(page, /setInterval\(/);
  assert.match(page, /const timeout = setTimeout\(/);
  assert.match(page, /\}, 5000\);\s*return \(\) => clearTimeout\(timeout\);\s*\}, \[isPaused, currentIndex\]\);/);
});

test("home intro copy is broad and welcome popup is disabled", () => {
  const home = readJson("data/home.json");

  assert.equal(home.welcome.enabled, false);
  assert.ok(!home.intro.title.startsWith("AI-guided"));
  assert.ok(home.intro.body.startsWith("M-Square Lab"));
  assert.match(home.intro.title, /materials/i);
  assert.match(home.intro.body, /first-principles|molecular dynamics|multiscale|data-driven/i);
});

test("home Latest News shows the three newest entries", () => {
  const home = readJson("data/home.json");
  const news = readJson("data/news.json");

  assert.equal(home.updates.news.limit, 3);
  assert.ok(news.length >= home.updates.news.limit);
});

test("home Latest News cards show only date and title at the activity card height", () => {
  const page = readFileSync(join(rootDir, "app/page.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.doesNotMatch(page, /<em>\{item\.text\}<\/em>/);
  assert.match(css, /\.homePublication,\s*\.homeActivity\{\s*min-height:86px;/);
});

test("home Latest Activities shows the date above the title", () => {
  const page = readFileSync(join(rootDir, "app/page.js"), "utf8");

  assert.match(
    page,
    /<span>\s*<em>\{formatActivityDate\(item\.date\)\}<\/em>\s*<strong>\{item\.title\}<\/strong>\s*<\/span>/
  );
});

test("Activities image navigation uses the home carousel's filled SVG triangles", () => {
  const page = readFileSync(join(rootDir, "app/activities/page.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.doesNotMatch(page, /\{"[<>]"\}/);
  assert.equal((page.match(/className="activityNavIcon"/g) || []).length, 4);
  assert.equal((page.match(/d="M15 6l-6 6 6 6"/g) || []).length, 2);
  assert.equal((page.match(/d="M9 6l6 6-6 6"/g) || []).length, 2);
  assert.match(
    css,
    /\.sliderOverlayButton svg,\s*\.activityNavIcon\{\s*width:24px;\s*height:24px;\s*fill:#fff;/
  );
  assert.doesNotMatch(css, /\.activityNavIcon\{[^}]*fill:none;/);
});

test("Activities photo navigation centers the triangle inside its circular button", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");
  const activityNavBlock = css.match(/\.activityNav\{([^}]*)\}/)?.[1] || "";

  assert.match(activityNavBlock, /appearance:none;/);
  assert.match(activityNavBlock, /display:flex;/);
  assert.match(activityNavBlock, /align-items:center;/);
  assert.match(activityNavBlock, /justify-content:center;/);
  assert.match(activityNavBlock, /padding:0;/);
});

test("home research card image areas use a plain white background", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");
  const rules = [...css.matchAll(/\.homeResearchImage\{([^}]*)\}/g)];
  const finalRule = rules.at(-1)?.[1] || "";

  assert.ok(rules.length > 0, "home research image styling should exist");
  assert.match(finalRule, /background\s*:\s*#fff\s*;/);
  assert.doesNotMatch(finalRule, /linear-gradient|radial-gradient/);
});

test("public-facing copy uses M-Square branding instead of MSQ", () => {
  const publicFacingFiles = [
    "README.md",
    ...listFiles("app", [".js", ".css"]),
    ...listFiles("components", [".js"]),
    ...listFiles("data", [".json"])
  ];

  publicFacingFiles.forEach((relativePath) => {
    const content = readFileSync(join(rootDir, relativePath), "utf8");
    assert.doesNotMatch(content, /\bMSQ\b/, `${relativePath} should not expose MSQ branding`);
    assert.doesNotMatch(content, /\bM-square\b/, `${relativePath} should use M-Square capitalization`);
  });
});

test("PI office uses official Engineering Building 2 room notation", () => {
  const pi = readJson("data/pi.json");

  assert.equal(pi.office, "Room 25139, Engineering Building 2");
});

test("PI profile uses the approved portrait and wider image column", () => {
  const pi = readJson("data/pi.json");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.equal(pi.photo, "/images/members/Sung_Beom_Cho-2026.png");
  assert.match(css, /\.piPhoto\{width:280px;max-width:100%;\}/);
  assert.match(css, /\.piHeader\{\s*display:grid;\s*grid-template-columns:280px 1fr;/);
  assert.ok(
    existsSync(join(rootDir, "public/images/members/Sung_Beom_Cho-2026.png")),
    "approved PI portrait should exist",
  );
});

test("site footer address matches the SKKU Engineering Building 2 location", () => {
  const site = readJson("data/site.json");
  const footer = readFileSync(join(rootDir, "components/Footer.js"), "utf8");

  assert.equal(
    site.footerAddress,
    "Room 25139, Engineering Building 2, Sungkyunkwan University, 2066 Seobu-ro, Jangan-gu, Suwon, Gyeonggi-do 16419, Korea"
  );
  assert.equal(site.footerEmail, "sungcho@skku.edu");
  assert.equal(site.footerCopyrightName, "M-Square Lab.");
  assert.match(footer, /mailto:\$\{site\.footerEmail\}/);
});

test("footer layout keeps the contact email on one desktop line", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /\.footerTop\{\s*display:block;/);
  assert.match(css, /\.footerGrid\{\s*display:grid;\s*grid-template-columns:minmax\(0, 1fr\) max-content;/);
  assert.match(css, /\.footerContactBlock \.footerValue\{white-space:nowrap;\}/);
});

test("navigation and footer temporarily omit the image logo", () => {
  const nav = readFileSync(join(rootDir, "components/Nav.js"), "utf8");
  const footer = readFileSync(join(rootDir, "components/Footer.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.doesNotMatch(nav, /LAB_logo\.png|className="navLogo/);
  assert.match(nav, /<span className="navBrandText">Materials Modeling Laboratory<\/span>/);
  assert.doesNotMatch(footer, /LAB_logo\.png|className="footerLogo/);
  assert.match(
    css,
    /@media \(max-width: 860px\)\{\s*\.navBrand\{[^}]+\}\s*\.navLinks\{\s*justify-content:flex-start;/,
  );
});

test("research session data references existing topic slugs", () => {
  const sessions = readJson("data/research-sessions.json");
  const research = readJson("data/research.json");
  const researchSlugs = new Set(research.map((topic) => topic.slug));

  assert.ok(Array.isArray(sessions));
  assert.ok(sessions.length >= 1);

  sessions.forEach((session) => {
    assert.equal(typeof session.key, "string");
    assert.equal(typeof session.title, "string");
    assert.ok(Array.isArray(session.topics));
    session.topics.forEach((topic) => {
      if (topic.slug) {
        assert.ok(researchSlugs.has(topic.slug), `unknown research slug: ${topic.slug}`);
      } else {
        assert.equal(typeof topic.title, "string");
        assert.ok(topic.image.startsWith("/"));
      }
    });
  });
});

test("research image references use PNG filenames", () => {
  const sessions = readJson("data/research-sessions.json");
  const research = readJson("data/research.json");
  const imagePaths = [
    ...research.map((topic) => topic.image),
    ...sessions.flatMap((session) => session.topics.map((topic) => topic.image).filter(Boolean))
  ];

  imagePaths.forEach((imagePath) => {
    assert.match(imagePath, /\.png$/i, `${imagePath} should use PNG`);
  });
});

test("AI synthesis detail uses the approved research copy", () => {
  const research = readJson("data/research.json");
  const topic = research.find((entry) => entry.slug === "ai-assisted-synthesis-recipes");

  assert.ok(topic, "AI-assisted synthesis topic should exist");
  assert.equal(topic.title, "AI-Assisted Synthesis Recipe Design");
  assert.equal(
    topic.focus,
    "We develop AI-assisted workflows that integrate synthesis knowledge extracted from the literature, physics- and simulation-informed descriptors, and experimental data to identify promising process conditions for experimental validation. Our research focuses on transforming heterogeneous knowledge from publications, simulations, and experiments into structured synthesis datasets; developing predictive models for synthesis outcomes and material properties; and prioritizing experimentally testable process conditions."
  );
  assert.deepEqual(topic.methods, [
    "Synthesis Knowledge Structuring: Extract and standardize materials, processing conditions, characterization results, and synthesis outcomes from publications and experimental records.",
    "Synthesis and Property Modeling: Develop and validate data-driven models that relate processing variables to synthesis feasibility and target properties.",
    "Candidate Prioritization: Combine predictive search, domain knowledge, and optimization methods to rank candidate process conditions for experimental validation."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Prioritized Candidates: Ranked process-condition candidates for targeted materials systems.",
    "Interpretable Design Insights: Quantitative relationships between synthesis variables, predicted outcomes, and material-performance trends.",
    "Iterative Experiment-Model Learning: Workflows that incorporate experimental feedback to refine models and guide subsequent experiments."
  ]);
});

test("multiscale and multiphysics detail uses the approved research copy", () => {
  const research = readJson("data/research.json");
  const topic = research.find((entry) => entry.slug === "multiscale-multiphysics");

  assert.ok(topic, "multiscale and multiphysics topic should exist");
  assert.equal(
    topic.focus,
    "This topic investigates phenomena across multiple spatial and temporal scales, from atomic interactions and microstructural evolution to macroscopic responses and device-level performance. It also examines how coupled mechanical, thermal, chemical, electrical, electrochemical, and interfacial phenomena influence materials and devices. By integrating simulations with experimental observations, we seek to establish practical design principles for energy, electronic, and functional materials systems."
  );
  assert.deepEqual(topic.methods, [
    "Multiscale Modeling: Use first-principles calculations, molecular dynamics simulations, and continuum-level modeling to obtain scale-specific information and transfer relevant parameters between models. Examples include relating atomic energetics to transport, particle interactions during processing to microstructure formation, and local structural features to macroscopic or device-level responses.",
    "Multiphysics Modeling: Couple governing equations and boundary conditions to represent interacting physical fields within a simulation. Examples include stress-assisted transport, reaction-induced deformation, heat generation, and electromechanical coupling.",
    "Computational Design Exploration: Systematically explore combinations of material parameters, processing conditions, and device configurations through simulation to identify promising design regions, evaluate trade-offs, and prioritize candidates for further investigation."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Mechanistic Insights: Clear identification of the dominant mechanisms and interactions responsible for observed phenomena and performance trends.",
    "Quantitative Predictions: Simulation-based estimates of properties and responses under conditions that are difficult to isolate or measure experimentally.",
    "Design Guidelines: Practical criteria for selecting compositions, structures, processing conditions, and device configurations to achieve target performance."
  ]);
});

test("nucleation detail uses the approved methods and deliverables", () => {
  const research = readJson("data/research.json");
  const topic = research.find((entry) => entry.slug === "nucleation-theory");

  assert.ok(topic, "nucleation theory topic should exist");
  assert.deepEqual(topic.methods, [
    "Phase-Formation Pathway Analysis: Map target, intermediate, metastable, and competing phase pathways using reaction energetics and chemical-potential constraints.",
    "First-Principles Parameterization: Calculate reaction energies, defect energetics, surface/interface energies, and strain contributions using DFT-based simulations.",
    "Atomistic Free-Energy Sampling: Use MD and PLUMED-based enhanced sampling to evaluate transition coordinates, intermediate-state stability, and nucleation barriers.",
    "Nucleation and Growth Modeling: Integrate thermodynamic driving forces, kinetic barriers, and mass-transport effects to predict polymorph selection and phase evolution."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Phase-Formation Roadmaps: Ranked formation pathways that reveal how target, intermediate, metastable, and competing phases evolve during synthesis.",
    "Phase-Selectivity Maps: Condition-dependent maps of stability, metastability, and nucleation-favored regimes for rational phase control.",
    "Simulation-Derived Parameters: DFT/MD/PLUMED-based parameters describing reaction energetics, interfacial effects, free-energy barriers, and nucleation kinetics.",
    "Synthesis Design Rules: Actionable process-window guidelines for selective target-phase formation, impurity-phase suppression, and reproducible growth."
  ]);
});

test("research details omit descriptions that duplicate the focus", () => {
  const research = readJson("data/research.json");
  const detailPage = readFileSync(join(rootDir, "app/research/[slug]/page.js"), "utf8");

  research.forEach((topic) => {
    assert.equal("description" in topic, false, `${topic.slug} should not define description`);
  });
  assert.doesNotMatch(detailPage, /topic\.description/);
  assert.match(detailPage, /<h1>\{topic\.title\}<\/h1>/);
});

test("research detail stacks methods and deliverables as full-width sections", () => {
  const detailPage = readFileSync(join(rootDir, "app/research/[slug]/page.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");
  const focusIndex = detailPage.indexOf(">Focus<");
  const methodsIndex = detailPage.indexOf(">Methods<");
  const deliverablesIndex = detailPage.indexOf(">What we deliver<");
  const papersIndex = detailPage.indexOf(">Related Papers<");

  assert.ok(focusIndex < methodsIndex);
  assert.ok(methodsIndex < deliverablesIndex);
  assert.ok(deliverablesIndex < papersIndex);
  assert.doesNotMatch(detailPage, /researchDetailTwoCol/);
  assert.doesNotMatch(css, /\.researchDetailTwoCol/);
});

test("battery application links to a populated research detail", () => {
  const research = readJson("data/research.json");
  const sessions = readJson("data/research-sessions.json");
  const topic = research.find((entry) => entry.slug === "battery-materials-processing");
  const application = sessions.find((session) => session.key === "application");
  const applicationTopic = application?.topics.find(
    (entry) => entry.slug === "battery-materials-processing"
  );

  assert.ok(topic, "battery research topic should exist");
  assert.ok(applicationTopic, "battery application should link to its research detail");
  assert.equal(applicationTopic.title, "Battery Materials and Processing");
  assert.equal(
    topic.focus,
    "This topic examines how materials chemistry, electrode architecture, and processing conditions jointly influence battery performance. We study particle and binder behavior during electrode fabrication, chemical and electrochemical stability at electrode-electrolyte interfaces, and structural strategies for uniform ion transport, reversible lithium storage, and stable cycling."
  );
  assert.deepEqual(topic.methods, [
    "Electrode Process Modeling: Analyze stress transfer, particle rearrangement, binder fibrillation, and microstructure formation during electrode fabrication to connect processing conditions with electrode integrity and transport pathways.",
    "Interface and Transport Analysis: Evaluate reaction energetics, chemical and electrochemical stability, ionic conductivity, lithiophilicity, and mechanical properties to assess coatings, electrolytes, and interfacial materials.",
    "Electrochemical and Structural Analysis: Examine how electrode and current-collector structures affect ion distribution, lithium plating and stripping, dendrite formation, and cycling reversibility."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Manufacturing Guidelines: Processing windows and microstructure targets for uniform, mechanically robust, and high-loading electrodes.",
    "Interface Design Criteria: Material-selection criteria for coatings, electrolytes, and interfacial layers with favorable stability, ion transport, and dendrite-suppression characteristics.",
    "Stability and Reversibility Strategies: Material and structural design directions for homogeneous lithium deposition, reduced side reactions, and improved cycling stability."
  ]);
});

test("power semiconductor application links to the approved research detail", () => {
  const research = readJson("data/research.json");
  const sessions = readJson("data/research-sessions.json");
  const topic = research.find((entry) => entry.slug === "power-semiconductors");
  const application = sessions.find((session) => session.key === "application");
  const applicationTopic = application?.topics.find(
    (entry) => entry.slug === "power-semiconductors"
  );

  assert.ok(topic, "power semiconductor research topic should exist");
  assert.ok(applicationTopic, "power semiconductor application should link to its research detail");
  assert.equal(topic.title, "Power Semiconductors");
  assert.equal(applicationTopic.title, "Power Semiconductors");
  assert.equal(
    topic.focus,
    "This Application Session investigates the materials and manufacturing foundations of next-generation power semiconductors. We connect wide- and ultra-wide-bandgap material design with scalable epitaxial processing and physics-informed process engineering, examining how reaction chemistry, transport, thermal environments, and microstructural evolution determine material quality, reproducibility, and device readiness. Gallium oxide serves as a representative research platform, while the resulting methods are transferable to broader power-semiconductor materials and vapor-phase manufacturing technologies."
  );
  assert.deepEqual(topic.methods, [
    "Materials & Growth Mechanisms: Use first-principles calculations, thermodynamic analysis, and nucleation theory to reveal reaction pathways, parasitic growth, and defect-forming mechanisms in wide-bandgap semiconductor synthesis.",
    "Multiphysics Process Modeling: Couple fluid dynamics, heat transfer, and precursor transport from reactor to substrate scales to connect operating conditions with local growth environments, film formation, and spatial uniformity.",
    "Machine Learning Process Optimization: Combine predictive simulation, targeted epitaxial growth, advanced materials characterization, and surrogate modeling to validate mechanisms and identify robust process windows with reduced trial and error."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Mechanism-Based Design Rules: Generalizable principles for coordinating reaction chemistry, mass transport, and thermal management to stabilize epitaxy and control power-semiconductor material quality.",
    "Uniform & Reproducible Materials: Transferable strategies for suppressing parasitic reactions and improving film uniformity, morphology, crystallinity, defect control, and process-to-process consistency.",
    "Scale-Up & Manufacturing Frameworks: Predictive process maps and optimization workflows for larger-area deposition, reactor redesign, and extension to related wide-bandgap materials and vapor-phase manufacturing platforms."
  ]);
});

test("topological semimetal application links to the approved research detail", () => {
  const research = readJson("data/research.json");
  const sessions = readJson("data/research-sessions.json");
  const detailPage = readFileSync(join(rootDir, "app/research/[slug]/page.js"), "utf8");
  const topic = research.find((entry) => entry.slug === "topological-semimetals");
  const application = sessions.find((session) => session.key === "application");
  const applicationTopic = application?.topics.find(
    (entry) => entry.slug === "topological-semimetals"
  );

  assert.ok(topic, "topological semimetal research topic should exist");
  assert.ok(applicationTopic, "topological semimetal application should link to its research detail");
  assert.equal(topic.title, "Topological Semimetals");
  assert.equal(applicationTopic.title, "Topological Semimetals");
  assert.equal(
    topic.focus,
    "This topic develops an end-to-end workflow for discovering and validating topological semimetals: screening broad materials spaces, resolving bulk and surface topology, evaluating nanoscale transport and resistivity, and demonstrating the characteristics of an amorphous topological semimetal."
  );
  assert.deepEqual(topic.methods, [
    "High-Throughput Candidate Screening: Screen materials databases using thermodynamic stability, electronic structure, spin–orbit-sensitive descriptors, and automated topology indicators to prioritize promising Dirac and Weyl semimetals.",
    "Topological and Electrical Properties via DFT–Tight-Binding: Combine first-principles DFT with Wannier-based tight-binding models to locate Dirac and Weyl crossings, determine Weyl-node chirality, and calculate band structures, Fermi arcs, Fermi surfaces, and surface spectral functions. Evaluate thickness-dependent transmission and resistivity.",
    "Verification of Amorphous Topology and Robustness: Use real-space Bott-index calculations and surface-resolved electronic-state analysis to verify the topological nature of amorphous structures and assess their robustness."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Ranked Candidate Portfolio for Post-Cu Interconnects: A prioritized list of topological semimetals screened for post-Cu interconnect applications.",
    "Validated Topological Characteristics & Transport Performance: DFT–tight-binding agreement, crossing positions and chiralities, Fermi-arc and Fermi-surface maps, surface spectral functions, and nanoscale transport trends, culminating in post-Cu screening based on figures of merit and cohesive energy.",
    "Amorphous Topology & Disorder Robustness: Definitive evidence and structural guidance showing whether nontrivial topology persists after amorphization."
  ]);
  assert.match(detailPage, /separatorIndex > 80/);
});

test("oxide semiconductor application links to the approved research detail", () => {
  const research = readJson("data/research.json");
  const sessions = readJson("data/research-sessions.json");
  const topic = research.find((entry) => entry.slug === "semiconductor-materials-processing");
  const application = sessions.find((session) => session.key === "application");
  const applicationTopic = application?.topics.find(
    (entry) => entry.slug === "semiconductor-materials-processing"
  );

  assert.ok(topic, "oxide semiconductor research topic should exist");
  assert.ok(applicationTopic, "oxide semiconductor application should link to its research detail");
  assert.equal(topic.title, "Oxide Semiconductors");
  assert.equal(applicationTopic.title, "Oxide Semiconductors");
  assert.equal(
    topic.focus,
    "This topic centers on three tasks: extracting actionable insights from large-scale experimental data and computational screening, building predictive models for the structural and thermodynamic stability of oxide semiconductors, and converting these findings into practical, high-performance thin-film transistor (TFT) fabrication strategies."
  );
  assert.deepEqual(topic.methods, [
    "Knowledge Structuring: Organize comprehensive experimental datasets using Large Language Model (LLM)-powered extraction to identify strategies to achieve high performance.",
    "Modeling for Synthesizability: Evaluate thermodynamic phase diagrams and the effects of epitaxial strain to predict the feasibility of synthesizing heterostructural alloys.",
    "Design-Space Prioritization: Prioritize optimal fabrication parameters and architectures—such as Plasma-Enhanced Atomic Layer Deposition (PEALD), in situ capping layers, and precise cation doping—to overcome the inherent mobility-stability trade-off."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Recipe Candidates: Ranked synthesis conditions, including specific sub-cycle ratios for Atomically-Ordered IGZO, optimal post-deposition annealing windows, and strategic doping compositions (e.g., Ytterbium-doped IZO) for targeted high-mobility and extreme reliability.",
    "Decision Support: Interpretable thermodynamic indicators and quantitative visualizations linking input variables (such as atomic structure, strain, and gate insulator selection) to expected device stability, subgap defect suppression, and carrier transport.",
    "Faster Iteration: A streamlined framework connecting AI-driven literature reviews and ab initio computational design directly to experimental validation, enabling the rapid development of next-generation semiconductor devices."
  ]);
});

test("semiconductor papers stay assigned to the correct application topics", () => {
  const research = readJson("data/research.json");
  const detailPage = readFileSync(join(rootDir, "app/research/[slug]/page.js"), "utf8");
  const oxide = research.find((entry) => entry.slug === "semiconductor-materials-processing");
  const power = research.find((entry) => entry.slug === "power-semiconductors");
  const topological = research.find((entry) => entry.slug === "topological-semimetals");

  assert.deepEqual(
    oxide.relatedPapers.map((paper) => paper.title),
    [
      "AI-driven quantitative review of mobility-stability trade-off in oxide semiconductors",
      "Ultra-High Mobility Atomically-Ordered InGaZnO Transistors Through Atomic Layer Deposition"
    ]
  );
  assert.deepEqual(
    power.relatedPapers.map((paper) => paper.title),
    [
      "Design of optimized halide vapor phase epitaxy (HVPE) conditions for uniform α-Ga2O3 growth based on CFD analysis",
      "A pre-reaction suppressing strategy for α-Ga2O3 halide vapor pressure epitaxy using asymmetric precursor gas flow"
    ]
  );
  assert.equal(
    topological.relatedPapersNote,
    "Related publications will be added as they become available."
  );
  assert.match(detailPage, /topic\.relatedPapersNote/);
});

test("ferroelectrics and dielectrics application links to the approved research detail", () => {
  const research = readJson("data/research.json");
  const sessions = readJson("data/research-sessions.json");
  const topic = research.find((entry) => entry.slug === "ferroelectrics-dielectrics");
  const application = sessions.find((session) => session.key === "application");
  const applicationTopic = application?.topics.find(
    (entry) => entry.slug === "ferroelectrics-dielectrics"
  );

  assert.ok(topic, "ferroelectrics and dielectrics research topic should exist");
  assert.ok(
    applicationTopic,
    "ferroelectrics and dielectrics application should link to its research detail"
  );
  assert.equal(topic.title, "Ferroelectrics & Dielectrics");
  assert.equal(applicationTopic.title, "Ferroelectrics & Dielectrics");
  assert.equal(
    topic.focus,
    "This research focuses on the discovery, synthesis, and multiscale modeling of ferroelectric and dielectric materials. By connecting data-driven synthesis planning with nucleation kinetics and continuum-scale simulations, we aim to establish practical design rules for phase stabilization, polarization control, and reliable device operation."
  );
  assert.deepEqual(topic.methods, [
    "ML/LLM-Based Synthesis Planning: Extract literature-grounded knowledge and generate candidate materials, process conditions, and synthesis routes using machine-learning and multi-agent LLM frameworks.",
    "Nucleation Theory: Quantify the thermodynamic driving forces and kinetic barriers governing crystallization, polymorph selection, and metastable phase formation.",
    "FEM Modeling: Simulate coupled electrical, thermal, mechanical, and transport phenomena in thin films, multilayers, and device structures."
  ]);
  assert.deepEqual(topic.deliverables, [
    "Synthesis Pathway Recommendations: Evidence-grounded recommendations of candidate materials, synthesis routes, and process conditions for targeted ferroelectric and dielectric properties.",
    "Phase-Selection Maps: Condition-dependent maps linking composition, temperature, pressure, interfaces, and electric fields to stable and metastable phase formation.",
    "Device and Process Design Rules: Actionable guidelines for optimizing polarization, coercive field, dielectric response, reliability, and device scalability."
  ]);
  assert.deepEqual(topic.relatedPapers, []);
  assert.equal(
    topic.relatedPapersNote,
    "Related publications will be added as they become available."
  );
  assert.equal("description" in topic, false);
});

test("research page wrapper does not paint the full page background", () => {
  const layout = readFileSync(join(rootDir, "app/research/layout.js"), "utf8");
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");
  const surfaceRule = css.match(/\.researchPageSurface\{([^}]*)\}/)?.[1] || "";

  assert.match(layout, /className="researchPageSurface"/);
  assert.doesNotMatch(surfaceRule, /background\s*:\s*#fff/);
  assert.doesNotMatch(surfaceRule, /width\s*:\s*100vw/);
  assert.doesNotMatch(surfaceRule, /margin\s*:\s*-28px/);
  assert.doesNotMatch(css, /\.researchPageSurface \.researchFlowPage::before,\s*\.researchPageSurface \.researchFlowPage::after\{\s*display:none;/);
});

test("research diagram frames use plain white media backgrounds", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /\.researchPageSurface \.researchFlowLeadFrame,\s*\.researchPageSurface \.researchFlowLeadMedia,\s*\.researchPageSurface \.researchFlowSelectorThumb,\s*\.researchPageSurface \.researchTopicImage\{\s*background:#fff;/);
  assert.match(css, /\.researchPageSurface \.researchFlowLeadMedia::before,\s*\.researchPageSurface \.researchFlowSelectorThumb::before\{\s*display:none;/);
});

test("research white media areas avoid shadows and drop shadows", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /\.researchPageSurface \.researchFlowLead,\s*\.researchPageSurface \.researchFlowLeadFrame,\s*\.researchPageSurface \.researchFlowLeadMedia,\s*\.researchPageSurface \.researchFlowSelector,\s*\.researchPageSurface \.researchFlowSelectorThumb,\s*\.researchPageSurface \.researchTopicImage\{\s*box-shadow:none;/);
  assert.match(css, /\.researchPageSurface \.researchFlowLeadMedia img,\s*\.researchPageSurface \.researchFlowSelectorThumb img,\s*\.researchPageSurface \.researchTopicImage img\{\s*filter:none;/);
  assert.match(css, /\.researchPageSurface \.researchFlowSelector:hover,\s*\.researchPageSurface \.researchFlowSelector:focus-visible,\s*\.researchPageSurface \.researchFlowSelector--active\{\s*box-shadow:none;/);
});

test("research white cards do not use gradient shading", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /\.researchPageSurface \.researchFlowLead,\s*\.researchPageSurface \.researchFlowSelector\{\s*background:#fff;/);
  assert.match(css, /\.researchPageSurface \.researchFlowLead::before\{\s*display:none;/);
});

test("research application selector icons stay on a single row", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /\.researchFlowSelectorGrid--application\{\s*grid-template-columns:repeat\(5, minmax\(150px, 1fr\)\);\s*overflow-x:auto;/);
  assert.match(css, /\.researchFlowSelectorGrid--application \.researchFlowSelector\{\s*grid-template-columns:1fr;\s*grid-template-rows:82px auto;\s*justify-items:center;\s*text-align:center;/);
  assert.match(css, /\.researchFlowSelectorGrid--application \.researchFlowSelectorLabel\{\s*display:block;\s*-webkit-line-clamp:unset;\s*overflow:visible;\s*white-space:normal;\s*font-size:0\.98rem;/);
});

test("research application mobile selectors keep the row scrollable without shrinking text", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(css, /@media \(max-width: 720px\)\{[\s\S]*?\.researchFlowSelectorGrid--application\{\s*grid-template-columns:repeat\(5, minmax\(150px, 1fr\)\);/);
  assert.match(css, /@media \(max-width: 560px\)\{[\s\S]*?\.researchFlowSelectorGrid--application \.researchFlowSelectorLabel\{\s*font-size:0\.98rem;/);
});

test("research detail routes await Next dynamic params", () => {
  const page = readFileSync(join(rootDir, "app/research/[slug]/page.js"), "utf8");

  assert.match(page, /export async function generateMetadata\(\{ params \}\)/);
  assert.match(page, /export default async function ResearchDetailPage\(\{ params \}\)/);
  assert.ok((page.match(/const \{ slug \} = await params;/g) || []).length >= 2);
  assert.doesNotMatch(page, /params\.slug/);
});

test("member section data covers current members and alumni settings", () => {
  const config = readJson("data/member-sections.json");

  assert.ok(Array.isArray(config.currentSections));
  assert.ok(Array.isArray(config.alumniSections));
  assert.ok(Array.isArray(config.alumniCareerTrackOrder));
  assert.equal(typeof config.alumniCareerTrackConfig, "object");
  assert.equal(typeof config.alumniCareerTrackManualByName, "object");

  config.alumniCareerTrackOrder.forEach((key) => {
    assert.ok(config.alumniCareerTrackConfig[key], `missing career track config: ${key}`);
  });
});

test("current member emails use the approved SKKU addresses", () => {
  const members = readJson("data/members.json");
  const emailByName = new Map(members.map((member) => [member.name, member.email]));
  const approvedEmails = {
    "Han Uk Lee": "lhu3326@skku.edu",
    "Min Sung Kang": "kkkb2573@skku.edu",
    "Dong Won Jeon": "jdwjyl2007@skku.edu",
    "Ji Hoon Hong": "blueper2000@skku.edu",
    "Juhyeon Ha": "hajujuha@skku.edu",
    "Jeu Shin": "jshin01@skku.edu",
    "Jonghun Seo": "jhs99@skku.edu",
    "Jimin Kim": "kjmkjm7230@skku.edu",
    "Sungjun Kim": "kimsj1017@skku.edu"
  };

  Object.entries(approvedEmails).forEach(([name, email]) => {
    assert.equal(emailByName.get(name), email, `${name} should use the approved SKKU email`);
  });
});

test("current members include Hee Soo Kim in the staff section", () => {
  const members = readJson("data/members.json");
  const config = readJson("data/member-sections.json");
  const member = members.find((entry) => entry.name === "Hee Soo Kim");
  const staffSection = config.currentSections.find((section) => section.id === "staff");

  assert.deepEqual(member, {
    name: "Hee Soo Kim",
    category: "Staff",
    email: "khs1224@skku.edu",
    photo: "/images/members/hee_soo_kim-placeholder.png"
  });
  assert.ok(staffSection, "current members should include a staff section");
  assert.deepEqual(staffSection.keys, ["Staff"]);
  assert.equal(staffSection.label, "Administration Staff");
  assert.equal(config.currentSections.at(-1).id, "staff");
});

test("Hyeon Woo Kim is listed as an alumnus at Washington University in St. Louis", () => {
  const members = readJson("data/members.json");
  const config = readJson("data/member-sections.json");
  const member = members.find((entry) => entry.name === "Hyeon Woo Kim");

  assert.ok(member, "Hyeon Woo Kim should exist in member data");
  assert.equal(member.category, "Alumni");
  assert.equal(member.currentAffiliation, "Washington University in St. Louis");
  assert.equal(member.careerTrack, "academia");
  assert.equal(member.alumniSince, "2026-08");
  const datedAlumni = members
    .filter((entry) => entry.category === "Alumni" && entry.alumniSince)
    .sort((a, b) => b.alumniSince.localeCompare(a.alumniSince));
  assert.equal(datedAlumni[0].name, "Hyeon Woo Kim");
  assert.equal(
    config.currentSections.some((section) => section.id === "postdoc"),
    false,
    "the empty postdoctoral researcher section should stay hidden"
  );
});

test("undergraduate-intern departures are omitted and unused career tracks are disabled", () => {
  const members = readJson("data/members.json");
  const config = readJson("data/member-sections.json");
  const omittedNames = ["Jaeseok Hwang", "Suyeon Jang", "Gihwan Kim"];

  omittedNames.forEach((name) => {
    assert.equal(
      members.some((member) => member.name === name),
      false,
      `${name} should not appear in member data`
    );
  });
  assert.equal(config.alumniCareerTrackOrder.includes("graduate"), false);
  assert.equal(Object.hasOwn(config.alumniCareerTrackConfig, "graduate"), false);
  assert.equal(config.alumniCareerTrackOrder.includes("exploring"), false);
  assert.equal(Object.hasOwn(config.alumniCareerTrackConfig, "exploring"), false);
});

test("Alumni career cards use a compact centered three-column layout", () => {
  const css = readFileSync(join(rootDir, "app/globals.css"), "utf8");

  assert.match(
    css,
    /\.alumniCareerStats\{[\s\S]*?grid-template-columns:repeat\(3, minmax\(0, 220px\)\);\s*justify-content:center;/
  );
  assert.match(
    css,
    /@media \(max-width: 560px\)\{\s*\.alumniCareerStats\{grid-template-columns:1fr;\}/
  );
  assert.match(
    css,
    /\.alumniCareerStat\{\s*display:flex;\s*flex-direction:column;\s*align-items:center;\s*text-align:center;/
  );
  assert.match(
    css,
    /\.alumniCareerStatMeta\{\s*display:inline-flex;\s*align-items:center;\s*justify-content:center;[\s\S]*?margin-left:0;/
  );
});

test("undergraduate members include Chaeeun Song followed by Chanhwi Yun", () => {
  const members = readJson("data/members.json");
  const undergraduates = members.filter((member) => member.category === "Undergrad");
  const chaeeunIndex = undergraduates.findIndex((member) => member.name === "Chaeeun Song");
  const chanhwiIndex = undergraduates.findIndex((member) => member.name === "Chanhwi Yun");

  assert.ok(chaeeunIndex >= 0, "Chaeeun Song should be listed as an undergraduate");
  assert.equal(
    chanhwiIndex,
    chaeeunIndex + 1,
    "Chanhwi Yun should immediately follow Chaeeun Song"
  );
  assert.deepEqual(undergraduates[chaeeunIndex], {
    name: "Chaeeun Song",
    category: "Undergrad",
    role: "Undergraduate Research Intern",
    affiliation: "Materials Science and Engineering, Ajou University",
    email: "codms1006@ajou.ac.kr",
    photo: "/images/members/chaeeun_song.png",
    education: [
      "2024.03 - Present: B.S. student, Materials Science and Engineering, Ajou University"
    ],
    application: "TBD",
    applicationDetails: ["TBD"],
    applicationLabel: "Research Interests",
    summaryTags: ["TBD"],
    methodology: ["TBD"]
  });
  assert.deepEqual(undergraduates[chanhwiIndex], {
    name: "Chanhwi Yun",
    category: "Undergrad",
    role: "Undergraduate Research Intern",
    affiliation: "Materials Science and Engineering, Ajou University",
    email: "dbscksgnl1@ajou.ac.kr",
    photo: "/images/members/chanhwi_yun.png",
    education: [
      "2022.03 - Present: B.S. student, Materials Science and Engineering, Ajou University"
    ],
    application: "TBD",
    applicationDetails: ["TBD"],
    applicationLabel: "Research Interests",
    summaryTags: ["TBD"],
    methodology: ["TBD"]
  });
  assert.ok(
    existsSync(join(rootDir, "public/images/members/chaeeun_song.png")),
    "Chaeeun Song photo should exist"
  );
  assert.ok(
    existsSync(join(rootDir, "public/images/members/chanhwi_yun.png")),
    "Chanhwi Yun photo should exist"
  );
});

test("Ji Hoon Hong appears before Juhyeon Ha in the Ph.D. member section", () => {
  const members = readJson("data/members.json");
  const config = readJson("data/member-sections.json");
  const phdSection = config.currentSections.find((section) => section.id === "phd");
  const phdMembers = members.filter((member) => phdSection.keys.includes(member.category));
  const jiHoonIndex = phdMembers.findIndex((member) => member.name === "Ji Hoon Hong");
  const juhyeonIndex = phdMembers.findIndex((member) => member.name === "Juhyeon Ha");

  assert.ok(jiHoonIndex >= 0, "Ji Hoon Hong should be in the Ph.D. member section");
  assert.ok(juhyeonIndex >= 0, "Juhyeon Ha should be in the Ph.D. member section");
  assert.ok(jiHoonIndex < juhyeonIndex, "Ji Hoon Hong should appear before Juhyeon Ha");
});

test("member cards leave the photo frame empty when no photo is provided", () => {
  const component = readFileSync(join(rootDir, "components/MembersSectionPage.js"), "utf8");

  assert.match(component, /\{m\.photo \? \(\s*<img/);
  assert.doesNotMatch(component, /<img src=\{withBasePath\(m\.photo\)\}/);
});

test("member cards shorten SKKU affiliation while keeping source data detailed", () => {
  const members = readJson("data/members.json");
  const member = members.find(
    (entry) =>
      entry.affiliation ===
      "School of Advanced Materials Science and Engineering, Sungkyunkwan University"
  );

  assert.ok(member, "at least one SKKU member should keep the detailed source affiliation");
  assert.equal(
    formatMemberCardAffiliation(member.affiliation),
    "Advanced Materials Science and Engineering, Sungkyunkwan University"
  );
  assert.equal(
    member.affiliation,
    "School of Advanced Materials Science and Engineering, Sungkyunkwan University"
  );
});

test("member card rendering uses the shortened affiliation helper", () => {
  const component = readFileSync(join(rootDir, "components/MembersSectionPage.js"), "utf8");

  assert.match(component, /formatMemberCardAffiliation\(m\.affiliation\)/);
});

test("outcomes data keeps publication grouping editable", () => {
  const outcomes = readJson("data/outcomes.json");

  assert.ok(Array.isArray(outcomes.tools));
  assert.ok(Array.isArray(outcomes.publicationYearGroups));
  assert.ok(outcomes.publicationYearGroups.some((group) => group.minYear >= 2026));
  assert.ok(outcomes.publicationYearGroups.some((group) => group.maxYear <= 2021));
});

test("navigation data has stable labels and paths", () => {
  const navigation = readJson("data/navigation.json");

  assert.ok(Array.isArray(navigation.links));
  assert.ok(navigation.links.length >= 1);
  navigation.links.forEach((link) => {
    assert.ok(link.href.startsWith("/"));
    assert.equal(typeof link.label, "string");
  });
});

test("Members navigation points directly to current members", () => {
  const navigation = readJson("data/navigation.json");
  const membersLink = navigation.links.find((link) => link.label === "Members");

  assert.ok(membersLink, "Members navigation link should exist");
  assert.equal(membersLink.href, "/members/current");
});

test("Counterpart page is not exposed", () => {
  const navigation = readJson("data/navigation.json");

  assert.ok(!navigation.links.some((link) => link.href === "/counterpart"));
  assert.ok(!existsSync(join(rootDir, "app/counterpart/page.js")));
});

test("Next dev and build commands use separate dist directories", () => {
  const packageJson = readJson("package.json");
  const nextConfig = readFileSync(join(rootDir, "next.config.js"), "utf8");
  const gitignore = readFileSync(join(rootDir, ".gitignore"), "utf8");

  assert.match(packageJson.scripts.dev, /scripts\/run-next\.mjs dev/);
  assert.match(packageJson.scripts.build, /scripts\/run-next\.mjs build/);
  assert.ok(existsSync(join(rootDir, "scripts/run-next.mjs")));
  const runNext = readFileSync(join(rootDir, "scripts/run-next.mjs"), "utf8");
  assert.match(runNext, /process\.execPath/);
  assert.match(runNext, /next\/dist\/bin\/next/);
  assert.match(nextConfig, /NEXT_DIST_DIR/);
  assert.match(nextConfig, /distDir/);
  assert.match(gitignore, /\.next-\*/);
});
