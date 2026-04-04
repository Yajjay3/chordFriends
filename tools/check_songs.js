const fs = require("fs");
eval(fs.readFileSync("extension/chords.js", "utf8"));
for (const [inst, chords] of Object.entries(CHORD_DATA)) {
  const missing = chords.filter(c => !c.songLink || c.songLink === "");
  if (missing.length) {
    console.log(inst + " missing songLink (" + missing.length + "/" + chords.length + "):");
    missing.forEach(c => console.log("  " + c.symbol + " " + c.name));
  } else {
    console.log(inst + ": all " + chords.length + " chords have songLinks");
  }
}
