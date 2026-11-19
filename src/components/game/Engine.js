import { BLOCK_SIZE, WORLD_WIDTH, BLOCK_CONTENT } from "../../data/gameContent";

export function buildWorld(G) {
  const platforms = [], blocks = [], coins = [], signs = [], imageFrames = [], particles = [];
  const B = BLOCK_SIZE;
  const cr = (x, y, n, g = 32) => { for (let i = 0; i < n; i++) coins.push({ x: x + i * g, y, collected: false }) };
  const pl = (x, y, w) => platforms.push({ x, y, w, h: 18 });
  const qb = (x, y, k) => {
    const c = BLOCK_CONTENT[k];
    blocks.push({ x, y, w: B, h: B, contentKey: k, type: c?.type || "block", hit: false, bounceY: 0, bounceV: 0, triggerActive: false, hoverProgress: 0 });
  };
  const sg = (x, y, t) => signs.push({ x, y, text: t });
  const im = (x, y, w, h, s, l) => imageFrames.push({ x, y, w, h, src: s, label: l, imgObj: null, hoverOffset: Math.random() * 100 });
  const pt = (x, y, k) => {
    // Portals are wider
    const c = BLOCK_CONTENT[k];
    blocks.push({ x, y: G - 80, w: 80, h: 80, contentKey: k, type: "portal", hit: false, bounceY: 0, bounceV: 0, triggerActive: false });
  };
  const ph = (x, y, k) => {
    const c = BLOCK_CONTENT[k];
    blocks.push({ x, y, w: 100, h: 120, contentKey: k, type: "photo", hit: false, bounceY: 0, bounceV: 0, triggerActive: false, imgObj: null });
  };
  const hv = (x, y, k) => {
    const c = BLOCK_CONTENT[k];
    blocks.push({ x, y, w: 80, h: 60, contentKey: k, type: "hover", hit: false, bounceY: 0, bounceV: 0, triggerActive: false, hoverProgress: 0 });
  };

  // 1. START (0 to 1200)
  sg(60, G - 60, "WELCOME! Use ← → SPACE. Hit ? blocks!");
  sg(450, G - 60, "→ Explore portals, memory walls, and hover certs!");
  cr(150, G - 50, 6, 40); pl(350, G - 80, 180); cr(360, G - 110, 4, 38); pl(700, G - 80, 140); cr(710, G - 110, 3, 38); cr(950, G - 50, 2, 35);
  pt(1050, G, "arcade_hub"); sg(1000, G - 100, "🕹️ ARCADE HUB");

  // 2. EDUCATION (1200 to 3200)
  sg(1240, G - 60, "── EDUCATION ZONE ──");
  pl(1400, G - 80, 200); qb(1470, G - 80 - B, "edu1"); cr(1410, G - 110, 4, 40); im(1550, G - 250, 100, 100, "/preview.webp", "ESHAN H");
  pl(1800, G - 80, 200); qb(1870, G - 80 - B, "edu2"); cr(1810, G - 110, 4, 40);
  pl(2200, G - 80, 180); qb(2260, G - 80 - B, "edu3"); cr(2210, G - 110, 3, 40); im(2450, G - 200, 100, 80, "/preview-9.webp", "RESEARCH");
  pl(2550, G - 80, 240); qb(2650, G - 80 - B, "research_presentation"); cr(2560, G - 110, 5, 40);
  pl(2900, G - 80, 160); cr(2910, G - 110, 4, 35);

  // 3. MEMORIES I (3200 to 4400)
  sg(3240, G - 60, "── THE EARLY DAYS ──");
  ph(3500, G - 120, "mem1_1");
  ph(3800, G - 150, "mem1_2");
  cr(3400, G - 50, 10, 60);

  // 4. SKILLS (4400 to 6400)
  sg(4440, G - 60, "── SKILL TREE ──");
  sg(5400, G - 60, "Dynamic Skill Tree active above...");
  cr(4600, G - 50, 20, 80);

  // 5. PROJECTS (6400 to 9600)
  sg(6440, G - 60, "── PROJECT ZONE ──");
  pt(6470, G, "arcade_hub");
  pt(6600, G, "saathi"); cr(6610, G - 120, 5, 38); 
  pt(7000, G, "axiom"); cr(7010, G - 120, 5, 35);
  pt(7400, G, "argus"); cr(7410, G - 120, 5, 38);
  pl(7800, G - 80, 200); qb(7870, G - 80 - B, "avangard"); cr(7810, G - 110, 4, 40);
  pl(8200, G - 80, 180); qb(8260, G - 80 - B, "kavach"); cr(8210, G - 110, 4, 35);
  pl(8550, G - 80, 200); qb(8620, G - 80 - B, "prashasan"); cr(8560, G - 110, 5, 32);
  pl(8900, G - 80, 180); qb(8960, G - 80 - B, "personaforge"); cr(8910, G - 110, 4, 35);
  pl(9240, G - 80, 180); qb(9300, G - 80 - B, "usb-tcp-bridge"); cr(9250, G - 110, 4, 35);

  // 6. AGRICULTURE BIOME (9600 to 12000)
  sg(9640, G - 60, "── VERIFARM (AGRI-BIOME) ──");
  pl(10020, G - 80, 180); qb(10080, G - 80 - B, "soil-and-toil"); cr(10030, G - 110, 4, 35);
  pt(10500, G, "verifarm"); cr(10400, G - 120, 8, 40);
  pl(10950, G - 80, 180); qb(11010, G - 80 - B, "pro-rover"); cr(10960, G - 110, 4, 35);
  cr(11250, G - 50, 6, 40);

  // 7. MEMORIES II (12000 to 13200)
  sg(12040, G - 60, "── THE GRIND ──");
  ph(12300, G - 130, "mem2_1");
  ph(12700, G - 110, "mem2_2");
  cr(12200, G - 50, 8, 60);

  // 8. HACKATHONS (13200 to 15400)
  sg(13240, G - 60, "── HALL OF FAME ──");
  pt(13400, G, "hack_advaya"); cr(13410, G - 120, 5, 35);
  pl(13800, G - 80, 180); qb(13860, G - 80 - B, "hack_beam"); cr(13810, G - 110, 4, 35);
  pt(14150, G, "hack_aisthetica"); cr(14160, G - 120, 4, 38);
  pl(14500, G - 80, 180); qb(14560, G - 80 - B, "hack_impulse"); cr(14510, G - 110, 4, 35);
  pt(14800, G, "hack_algo"); cr(14810, G - 120, 4, 38); im(15000, G - 260, 110, 85, "/preview-8.webp", "SENTINEL");
  pl(15100, G - 80, 160); qb(15150, G - 80 - B, "hack_sentinel"); cr(15110, G - 110, 3, 35);
  pl(15320, G - 80, 60); qb(15325, G - 80 - B, "hack_innovatex");

  // 9. MEMORIES III (15400 to 16600)
  sg(15440, G - 60, "── THE VICTORY LAP ──");
  ph(15600, G - 120, "mem3_1");
  ph(15900, G - 150, "mem3_2");
  ph(16200, G - 110, "mem3_3");
  cr(15500, G - 50, 10, 60);

  // 10. CERTS (16600 to 18400)
  sg(16640, G - 60, "── CERTIFICATIONS ──");
  pt(17500, G, "cert_holo"); cr(17410, G - 120, 10, 40);

  // 11. CONTACT (18400 to 20000)
  sg(18440, G - 60, "── CONNECT WITH ME ──");
  pl(18600, G - 80, 180); qb(18660, G - 80 - B, "contact_linkedin"); cr(18610, G - 110, 3, 40);
  pl(18900, G - 80, 180); qb(18960, G - 80 - B, "contact_github"); cr(18910, G - 110, 3, 40);
  pl(19200, G - 80, 180); qb(19260, G - 80 - B, "contact_email"); cr(19210, G - 110, 3, 40);
  pl(19500, G - 80, 180); qb(19560, G - 80 - B, "contact_phone"); cr(19510, G - 110, 3, 40);
  sg(19600, G - 60, "★ FINISH LINE AHEAD! ★"); cr(19600, G - 50, 8, 30);
  
  return { platforms, blocks, coins, signs, imageFrames, particles };
}
