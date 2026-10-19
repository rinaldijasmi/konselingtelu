window.PANDU_LABELS = (() => {
  const PD_LABELS = {
    PAR: "Paranoid", SCH: "Schizoid", SCT: "Schizotypal", ANT: "Antisocial", BOR: "Borderline",
    HIS: "Histrionic", NAR: "Narcissistic", AVD: "Avoidant", DEP: "Dependent", OBC: "Obsessive-Compulsive"
  };
  const FACTOR_LABELS = {
    AGRE: "Agreeableness", CONC: "Conscientiousness", EXTR: "Extraversion", NARC: "Narcissism",
    NEUR: "Neuroticism", OPEN: "Openness", SENS: "Sensation-Seeking"
  };
  const VALIDITY_LABELS = { VRIN: "VRIN", CD: "Current Distress" };
  const NORMAL_LABELS = {
    AE: "Aestheticism", AM: "Ambition", AN: "Anxiety", AS: "Assertiveness", CO: "Conventionality",
    DE: "Depression", DU: "Dutifulness", EC: "Excitement", EH: "Exhibitionism", EN: "Energy",
    FL: "Flexibility", HS: "Hostility", IM: "Impulsiveness", IT: "Intellect", IR: "Irritability",
    MD: "Modesty", MO: "Moodiness", OR: "Orderliness", SI: "Self-Indulgence", SN: "Sincerity",
    SO: "Sociability", SR: "Self-Reliance", TO: "Tolerance", TR: "Trustfulness", WR: "Warmth"
  };
  return { PD_LABELS, FACTOR_LABELS, VALIDITY_LABELS, NORMAL_LABELS };
})();
