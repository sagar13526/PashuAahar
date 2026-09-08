import Dexie from "dexie";

export const db = new Dexie("PashuAaharDB");

db.version(1).stores({
  tests: "id, farmer_name, farmer_id, sample_type, feed_subtype, quality_status, created_at, synced"
});

export async function saveTestLocally(record) {
  const item = {
    ...record,
    synced: record.synced ?? false,
    created_at: record.created_at || new Date().toISOString()
  };
  await db.tests.put(item);
  return item;
}

export async function getAllLocalTests() {
  return await db.tests.orderBy("created_at").reverse().toArray();
}

export async function getLocalTestById(id) {
  return await db.tests.get(id);
}

export async function getUnsyncedTests() {
  return await db.tests.filter(t => !t.synced).toArray();
}

export async function markAsSynced(ids) {
  return await db.transaction("rw", db.tests, async () => {
    for (const id of ids) {
      await db.tests.update(id, { synced: true });
    }
  });
}

export async function seedLocalDataIfEmpty() {
  const count = await db.tests.count();
  if (count === 0) {
    const seeds = [
      {
        id: "F001",
        farmer_name: "Ramesh Kumar (Demo)",
        farmer_id: "COOP-01",
        location: "Meerut, UP",
        sample_type: "feed",
        feed_subtype: "pellet",
        input_mode: "demo_sample",
        demo_sample_id: "F001",
        moisture_pct: 10.0,
        protein_pct: 21.0,
        fiber_pct: 14.0,
        aflatoxin_ppb: 5.0,
        ph: null,
        energy_value: 2.91,
        estimated_energy_value: "High",
        adulteration_detected: "None",
        quality_status: "Good",
        confidence_score: 0.94,
        advisory_text_en: "Feed quality is good. Balanced protein (21.0%) and moisture (10.0%). Safe for regular use. Re-test in 30 days.",
        advisory_text_hi: "चारे की गुणवत्ता अच्छी है। संतुलित प्रोटीन (21.0%) और नमी (10.0%)। नियमित उपयोग के लिए सुरक्षित। 30 दिनों में दोबारा जांच करें।",
        why_this_result: [
          "Aflatoxin level (5.0 ppb) is well below the 15 ppb safety ceiling.",
          "Moisture content (10.0%) complies with safe dry storage standards (<12%).",
          "Balanced crude protein (21.0%) and crude fiber (14.0%) match optimal BIS Type-I pellet feed."
        ],
        qr_payload: "PASHUAAHAR|ID:F001|Sample:feed|Quality:Good|Adulteration:None|Protein:21.0%|Moisture:10.0%",
        created_at: "2026-09-01T10:00:00Z",
        synced: true
      },
      {
        id: "F002",
        farmer_name: "Suresh Patel (Demo)",
        farmer_id: "COOP-01",
        location: "Anand, Gujarat",
        sample_type: "silage",
        feed_subtype: null,
        input_mode: "demo_sample",
        demo_sample_id: "F002",
        moisture_pct: 68.0,
        protein_pct: 9.0,
        fiber_pct: 24.0,
        aflatoxin_ppb: 12.0,
        ph: 4.1,
        energy_value: 2.12,
        estimated_energy_value: "Medium",
        adulteration_detected: "Mould Presence",
        quality_status: "Moderate",
        confidence_score: 0.88,
        advisory_text_en: "Mould presence detected (aflatoxin 12.0 ppb, moisture 68.0%). Use with caution — mix with fresh dry feed, add mycotoxin binder, and monitor animal appetite closely.",
        advisory_text_hi: "फफूंद की उपस्थिति का पता चला (एफ्लाटॉक्सिन 12.0 ppb, नमी 68.0%)। सावधानी के साथ उपयोग करें — ताजे सूखे चारे के साथ मिलाएं और पशु के स्वास्थ्य पर नजर रखें।",
        why_this_result: [
          "Aflatoxin (12.0 ppb) is elevated in the 8–15 ppb caution band, indicating early fungal activity.",
          "Silage pH (4.1) indicates good anaerobic lactic fermentation, preventing total bacterial putrefaction.",
          "Moisture (68.0%) is within normal silage range (65–70%)."
        ],
        qr_payload: "PASHUAAHAR|ID:F002|Sample:silage|Quality:Moderate|Adulteration:Mould Presence|Protein:9.0%|Moisture:68.0%",
        created_at: "2026-09-02T10:00:00Z",
        synced: true
      },
      {
        id: "F003",
        farmer_name: "Kisan Dairy Farm (Demo)",
        farmer_id: "COOP-02",
        location: "Karnal, Haryana",
        sample_type: "feed",
        feed_subtype: "mineral_mixture",
        input_mode: "demo_sample",
        demo_sample_id: "F003",
        moisture_pct: 3.0,
        protein_pct: null,
        fiber_pct: null,
        aflatoxin_ppb: 0.0,
        ph: null,
        energy_value: null,
        estimated_energy_value: "N/A (Mineral Mix)",
        adulteration_detected: "Excess Salt",
        quality_status: "Poor",
        confidence_score: 0.89,
        advisory_text_en: "Excess salt detected in mineral mixture (moisture 3.0%). High sodium risks severe dehydration, electrolyte imbalance, and kidney strain in cattle. Limit or dilute immediately.",
        advisory_text_hi: "खनिज मिश्रण में अत्यधिक नमक पाया गया (नमी 3.0%)। अधिक नमक से पशुओं में निर्जलीकरण और गुर्दे की समस्या हो सकती है। तुरंत मात्रा सीमित करें।",
        why_this_result: [
          "Mineral mixture profile shows sodium chloride / ash ratio exceeding allowable BIS mineral specification.",
          "Zero protein and ultra-low moisture (3.0%) identify sample as concentrated mineral salt blend.",
          "Excess salt poses cattle dehydration and kidney toxicity hazards if unadjusted."
        ],
        qr_payload: "PASHUAAHAR|ID:F003|Sample:feed|Quality:Poor|Adulteration:Excess Salt|Protein:N/A|Moisture:3.0%",
        created_at: "2026-09-03T10:00:00Z",
        synced: true
      },
      {
        id: "F004",
        farmer_name: "Balwinder Singh (Demo)",
        farmer_id: "COOP-02",
        location: "Ludhiana, Punjab",
        sample_type: "feed",
        feed_subtype: "mash",
        input_mode: "demo_sample",
        demo_sample_id: "F004",
        moisture_pct: 12.0,
        protein_pct: 18.0,
        fiber_pct: 16.0,
        aflatoxin_ppb: 20.0,
        ph: null,
        energy_value: 2.72,
        estimated_energy_value: "High",
        adulteration_detected: "Sand Contamination",
        quality_status: "Unsafe",
        confidence_score: 0.95,
        advisory_text_en: "Dangerous sand/silica contamination and high aflatoxin (20.0 ppb) detected! High risk of rumen impaction and liver damage. Discard batch immediately.",
        advisory_text_hi: "खतरनाक रेत/सिलिका और अत्यधिक एफ्लाटॉक्सिन (20.0 ppb) पाया गया! मवेशियों में पेट खराब और विषाक्तता का खतरा। यह बैच तुरंत नष्ट करें।",
        why_this_result: [
          "Critical aflatoxin level (20.0 ppb) violates FSSAI animal feed safety limit (>15 ppb).",
          "Acid-insoluble ash / inorganic granular silica signature indicates physical sand adulteration.",
          "Severe risk of intestinal impaction and aflatoxicosis in ruminants."
        ],
        qr_payload: "PASHUAAHAR|ID:F004|Sample:feed|Quality:Unsafe|Adulteration:Sand Contamination|Protein:18.0%|Moisture:12.0%",
        created_at: "2026-09-04T10:00:00Z",
        synced: true
      },
      {
        id: "F005",
        farmer_name: "Mahesh Yadav (Demo)",
        farmer_id: "COOP-03",
        location: "Mathura, UP",
        sample_type: "silage",
        feed_subtype: null,
        input_mode: "demo_sample",
        demo_sample_id: "F005",
        moisture_pct: 72.0,
        protein_pct: 8.0,
        fiber_pct: 28.0,
        aflatoxin_ppb: 8.0,
        ph: 5.8,
        energy_value: 1.74,
        estimated_energy_value: "Low",
        adulteration_detected: "Spoilage Detected",
        quality_status: "Poor",
        confidence_score: 0.91,
        advisory_text_en: "Silage spoilage detected — pH 5.8 is too high for safe lactic fermentation (moisture 72.0%). Discard top spoiled layer; improve silo compaction and sealing.",
        advisory_text_hi: "साइलेज खराब होने का पता चला — सुरक्षित किण्वन के लिए पीएच 5.8 बहुत अधिक है (नमी 72.0%)। ऊपर की खराब परत हटा दें; साइलो की सीलिंग सुधारें।",
        why_this_result: [
          "Silage pH (5.8) is critically high (>5.0 threshold), indicating failure of anaerobic lactic fermentation.",
          "High moisture (72.0%) combined with pH > 5.0 creates aerobic secondary fermentation and clostridial spoilage.",
          "Crude protein is degraded (8.0%) due to volatile fatty acid and ammonia loss."
        ],
        qr_payload: "PASHUAAHAR|ID:F005|Sample:silage|Quality:Poor|Adulteration:Spoilage Detected|Protein:8.0%|Moisture:72.0%",
        created_at: "2026-09-05T10:00:00Z",
        synced: true
      }
    ];
    await db.tests.bulkPut(seeds);
  }
}