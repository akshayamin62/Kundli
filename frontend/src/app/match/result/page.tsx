"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchResponse, MatchKoot } from "@/types/chart";
import ChartWheel from "@/components/ChartWheel";
import { type Lang, SIGN_NAMES, NAKSHATRA_NAMES, PLANET_NAMES, SIGN_LORDS } from "@/lib/translations";
import { downloadMatchReport } from "@/lib/reportGenerator";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const M: Record<Lang, Record<string, string>> = {
  en: {
    title: "Kundli Milan", sub: "Ashtakoot Guna Matching",
    back: "New Match", nak: "Nakshatra", nakLord: "Nak. Lord", moonSign: "Moon Sign",
    koot: "Koot", score: "Score", total: "Total",
    mangalTitle: "Mangal Dosha (Kuja Dosha)",
    mangalYes: "Mangal Dosha present", mangalNo: "No Mangal Dosha",
    mangalOff: "Dosha cancelled \u2014 both partners have Mangal Dosha.",
    charts: "Birth Charts",
    footer: "Swiss Ephemeris \u00B7 Lahiri Ayanamsa \u00B7 Ashtakoot Parashari System",
    detail: "Detail",
    dob: "Date of Birth", tob: "Time of Birth", place: "Place",
    rasi: "Janma Rasi", rasiLord: "Rasi Lord", janmaNak: "Janma Nakshatra",
    dosha: "Mangal Dosha",
    sadsatkutTitle: "Sadsatkut Kostkaani",
    sadsatkutSub: "Six-fold sign compatibility groups (based on zodiac house distance)",
    distanceLabel: "Rashi distance",
    priti: "Priti Shadashtak", mrityu: "Mrityu Shadashtak",
    shubhDva: "Shubh Dvadashatak", ashubhDva: "Ashubh Dvadashatak",
    shubhNav: "Shubh Navpancham", nashtanNav: "Nashtan Navpancham",
    pritiDesc: "mutual love & attraction",
    mrityuDesc: "tension & obstacles",
    shubhDvaDesc: "prosperity & support",
    ashubhDvaDesc: "financial stress",
    shubhNavDesc: "fortune & children",
    nashtanNavDesc: "misfortune",
    present: "Present", absent: "Absent",
  },
  hi: {
    title: "\u0915\u0941\u0902\u0921\u0932\u0940 \u092E\u093F\u0932\u093E\u0928",
    sub: "\u0905\u0937\u094D\u0920\u0915\u0942\u0920 \u0917\u0941\u0923 \u092E\u093F\u0932\u093E\u0928",
    back: "\u0928\u092F\u093E \u092E\u093F\u0932\u093E\u0928",
    nak: "\u0928\u0915\u094D\u0937\u0924\u094D\u0930", nakLord: "\u0928\u0915\u094D\u0937\u0924\u094D\u0930\u092A\u0924\u093F",
    moonSign: "\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F",
    koot: "\u0915\u0942\u0920", score: "\u0905\u0902\u0915", total: "\u0915\u0941\u0932",
    mangalTitle: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 (\u0915\u0941\u091C \u0926\u094B\u0937)",
    mangalYes: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 \u0939\u0948",
    mangalNo: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937 \u0928\u0939\u0940\u0902",
    mangalOff: "\u0926\u094B\u0928\u094B\u0902 \u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u2014 \u0926\u094B\u0937 \u0928\u093F\u0930\u0938\u094D\u0924\u0964",
    charts: "\u091C\u0928\u094D\u092E \u0915\u0941\u0902\u0921\u0932\u0940",
    footer: "\u0938\u094D\u0935\u093F\u0938 \u090F\u092B\u0947\u092E\u0947\u0930\u093F\u0938 \u00B7 \u0932\u093E\u0939\u093F\u0930\u0940 \u0905\u092F\u0928\u093E\u0902\u0936 \u00B7 \u0905\u0937\u094D\u0920\u0915\u0942\u0920 \u092A\u093E\u0930\u093E\u0936\u0930\u0940 \u092A\u0926\u094D\u0927\u0924\u093F",
    detail: "\u0935\u093F\u0935\u0930\u0923",
    dob: "\u091C\u0928\u094D\u092E \u0924\u093F\u0925\u093F", tob: "\u091C\u0928\u094D\u092E \u0938\u092E\u092F", place: "\u0938\u094D\u0925\u093E\u0928",
    rasi: "\u091C\u0928\u094D\u092E \u0930\u093E\u0936\u093F", rasiLord: "\u0930\u093E\u0936\u093F \u0938\u094D\u0935\u093E\u092E\u0940", janmaNak: "\u091C\u0928\u094D\u092E \u0928\u0915\u094D\u0937\u0924\u094D\u0930",
    dosha: "\u092E\u093E\u0902\u0917\u0932\u093F\u0915 \u0926\u094B\u0937",
    sadsatkutTitle: "\u0938\u0926\u0938\u0924\u094D\u0915\u0942\u091F\u0915\u094B\u0937\u094D\u0920\u0915\u093E\u0928\u093F",
    sadsatkutSub: "\u0937\u091F\u094D \u0930\u093E\u0936\u093F \u092F\u0941\u0917\u0932 \u0935\u0930\u094D\u0917 (\u0930\u093E\u0936\u093F \u0918\u0930 \u0905\u0902\u0924\u0930 \u0906\u0927\u093E\u0930\u093F\u0924)",
    distanceLabel: "\u0930\u093E\u0936\u093F \u0905\u0902\u0924\u0930",
    priti: "\u092A\u094D\u0930\u0940\u0924\u093F \u0937\u0921\u0937\u094D\u091F\u0915", mrityu: "\u092E\u0943\u0924\u094D\u092F\u0941 \u0937\u0921\u0937\u094D\u091F\u0915",
    shubhDva: "\u0936\u0941\u092D \u0926\u094D\u0935\u093E\u0926\u0936\u0915", ashubhDva: "\u0905\u0936\u0941\u092D \u0926\u094D\u0935\u093E\u0926\u0936\u0915",
    shubhNav: "\u0936\u0941\u092D \u0928\u0935\u092A\u0902\u091A\u092E", nashtanNav: "\u0928\u0937\u094D\u091F \u0928\u0935\u092A\u0902\u091A\u092E",
    pritiDesc: "\u092A\u094D\u0930\u0947\u092E \u0935 \u0906\u0915\u0930\u094D\u0937\u0923",
    mrityuDesc: "\u0924\u0928\u093E\u0935 \u0935 \u0905\u0935\u0930\u094B\u0927",
    shubhDvaDesc: "\u0938\u092E\u0943\u0926\u094D\u0927\u093F",
    ashubhDvaDesc: "\u0906\u0930\u094D\u0925\u093F\u0915 \u0924\u0928\u093E\u0935",
    shubhNavDesc: "\u092D\u093E\u0917\u094D\u092F \u0935 \u0938\u0902\u0924\u093E\u0928",
    nashtanNavDesc: "\u0926\u0941\u0930\u094D\u092D\u093E\u0917\u094D\u092F",
    present: "\u0909\u092A\u0938\u094D\u0925\u093F\u0924", absent: "\u0905\u0928\u0941\u092A\u0938\u094D\u0925\u093F\u0924",
  },
  gu: {
    title: "\u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0 \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    sub: "\u0A85\u0AB7\u0ACD\u0A9F\u0A95\u0AC2\u0A9F \u0A97\u0AC1\u0AA3 \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    back: "\u0AA8\u0AB5\u0ACB \u0AAE\u0ABF\u0AB3\u0ABE\u0AA8",
    nak: "\u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0", nakLord: "\u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0AAA\u0AA4\u0ABF",
    moonSign: "\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF",
    koot: "\u0A95\u0AC2\u0A9F", score: "\u0A97\u0AC1\u0AA3", total: "\u0A95\u0AC1\u0AB2",
    mangalTitle: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 (\u0A95\u0AC1\u0A9C \u0AA6\u0ACB\u0AB7)",
    mangalYes: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 \u0A9B\u0AC7",
    mangalNo: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7 \u0AA8\u0AA5\u0AC0",
    mangalOff: "\u0AAC\u0A82\u0AA8\u0AC7 \u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u2014 \u0AA6\u0ACB\u0AB7 \u0AB0\u0AA6.",
    charts: "\u0A9C\u0AA8\u0ACD\u0AAE \u0A95\u0AC1\u0A82\u0AA1\u0AB3\u0AC0",
    footer: "\u0AB8\u0ACD\u0AB5\u0ABF\u0AB8 \u0A87\u0AAB\u0AC7\u0AAE\u0AC7\u0AB0\u0ABF\u0AB8 \u00B7 \u0AB2\u0ABE\u0AB9\u0ABF\u0AB0\u0AC0 \u0A85\u0AAF\u0AA8\u0ABE\u0A82\u0AB6 \u00B7 \u0A85\u0AB7\u0ACD\u0A9F\u0A95\u0AC2\u0A9F \u0AAA\u0ABE\u0AB0\u0ABE\u0AB6\u0AB0\u0AC0 \u0AAA\u0AA6\u0ACD\u0AA7\u0AA4\u0ABF",
    detail: "\u0AB5\u0ABF\u0A97\u0AA4",
    dob: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AA4\u0ABE\u0AB0\u0ABF\u0A96", tob: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AB8\u0AAE\u0AAF", place: "\u0AB8\u0ACD\u0AA5\u0AB3",
    rasi: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AB0\u0ABE\u0AB6\u0ABF", rasiLord: "\u0AB0\u0ABE\u0AB6\u0ABF \u0AB8\u0ACD\u0AB5\u0ABE\u0AAE\u0AC0", janmaNak: "\u0A9C\u0AA8\u0ACD\u0AAE \u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0",
    dosha: "\u0AAE\u0ABE\u0A82\u0A97\u0AB3\u0ABF\u0A95 \u0AA6\u0ACB\u0AB7",
    sadsatkutTitle: "\u0AB8\u0AA6\u0AB8\u0AA4\u0ACD\u0A95\u0AC2\u0A9F\u0A95\u0ACB\u0AB7\u0ACD\u0AA0\u0A95\u0ABE\u0AA8\u0ABF",
    sadsatkutSub: "\u0AB7\u0A9F\u0ACD \u0AB0\u0ABE\u0AB6\u0ABF \u0AAF\u0AC1\u0A97\u0AB3 \u0AB5\u0AB0\u0ACD\u0A97 (\u0AB0\u0ABE\u0AB6\u0ABF \u0A98\u0AB0 \u0A85\u0A82\u0AA4\u0AB0 \u0A86\u0AA7\u0ABE\u0AB0\u0ABF\u0AA4)",
    distanceLabel: "\u0AB0\u0ABE\u0AB6\u0ABF \u0A85\u0A82\u0AA4\u0AB0",
    priti: "\u0AAA\u0ACD\u0AB0\u0AC0\u0AA4\u0ABF \u0AB7\u0AA1\u0AB7\u0ACD\u0A9F\u0A95", mrityu: "\u0AAE\u0AC3\u0AA4\u0ACD\u0AAF\u0AC1 \u0AB7\u0AA1\u0AB7\u0ACD\u0A9F\u0A95",
    shubhDva: "\u0AB6\u0AC1\u0AAD \u0AA6\u0ACD\u0AB5\u0ABE\u0AA6\u0AB6\u0A95", ashubhDva: "\u0A85\u0AB6\u0AC1\u0AAD \u0AA6\u0ACD\u0AB5\u0ABE\u0AA6\u0AB6\u0A95",
    shubhNav: "\u0AB6\u0AC1\u0AAD \u0AA8\u0AB5\u0AAA\u0A82\u0A9A\u0AAE", nashtanNav: "\u0AA8\u0AB7\u0ACD\u0A9F \u0AA8\u0AB5\u0AAA\u0A82\u0A9A\u0AAE",
    pritiDesc: "\u0AAA\u0ACD\u0AB0\u0AC7\u0AAE \u0A85\u0AA8\u0AC7 \u0A86\u0A95\u0AB0\u0ACD\u0AB7\u0AA3",
    mrityuDesc: "\u0AA4\u0AA3\u0ABE\u0AB5 \u0A85\u0AA8\u0AC7 \u0A85\u0AB5\u0AB0\u0ACB\u0AA7",
    shubhDvaDesc: "\u0AB8\u0AAE\u0AC3\u0AA6\u0ACD\u0AA7\u0ABF \u0A85\u0AA8\u0AC7 \u0AB8\u0AB9\u0ABE\u0AB0\u0ACB",
    ashubhDvaDesc: "\u0A86\u0AB0\u0ACD\u0AA5\u0ABF\u0A95 \u0AA4\u0AA3\u0ABE\u0AB5",
    shubhNavDesc: "\u0AAD\u0ABE\u0A97\u0ACD\u0AAF \u0A85\u0AA8\u0AC7 \u0AB8\u0A82\u0AA4\u0ABE\u0AA8",
    nashtanNavDesc: "\u0AA6\u0AC1\u0AB0\u0ACD\u0AAD\u0ABE\u0A97\u0ACD\u0AAF",
    present: "\u0AB9\u0ABE\u0A9C\u0AB0", absent: "\u0A97\u0AC7\u0AB0\u0AB9\u0ABE\u0A9C\u0AB0",
  },
};

const KOOT_NAMES: Record<Lang, Record<string, string>> = {
  en:  { Varna:"Varna", Vasya:"Vasya", Tara:"Tara", Yoni:"Yoni", "Graha Maitri":"Graha Maitri", Gana:"Gana", Bhakut:"Bhakut", Nadi:"Nadi" },
  hi:  { Varna:"\u0935\u0930\u094D\u0923", Vasya:"\u0935\u0936\u094D\u092F", Tara:"\u0924\u093E\u0930\u093E", Yoni:"\u092F\u094B\u0928\u093F", "Graha Maitri":"\u0917\u094D\u0930\u0939 \u092E\u0948\u0924\u094D\u0930\u0940", Gana:"\u0917\u0923", Bhakut:"\u092D\u0915\u0942\u0920", Nadi:"\u0928\u093E\u0921\u093C\u0940" },
  gu:  { Varna:"\u0AB5\u0AB0\u0ACD\u0AA3", Vasya:"\u0AB5\u0AB6\u0ACD\u0AAF", Tara:"\u0AA4\u0ABE\u0AB0\u0ABE", Yoni:"\u0AAF\u0ACB\u0AA8\u0AC0", "Graha Maitri":"\u0A97\u0ACD\u0AB0\u0AB9 \u0AAE\u0AC8\u0AA4\u0ACD\u0AB0\u0AC0", Gana:"\u0A97\u0AA3", Bhakut:"\u0AAD\u0A95\u0AC2\u0A9F", Nadi:"\u0AA8\u0ABE\u0AA1\u0AC0" },
};

const KOOT_DESC: Record<Lang, Record<string, string>> = {
  en:  { Varna:"Spiritual dev.", Vasya:"Mutual attraction", Tara:"Birth star / destiny", Yoni:"Biological compat.", "Graha Maitri":"Moon lord friendship", Gana:"Temperament", Bhakut:"Moon sign pair", Nadi:"Physical constitution" },
  hi:  { Varna:"\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0915\u093E\u0938", Vasya:"\u0906\u0915\u0930\u094D\u0937\u0923", Tara:"\u091C\u0928\u094D\u092E \u0928\u0915\u094D\u0937\u0924\u094D\u0930", Yoni:"\u091C\u0948\u0935\u093F\u0915 \u0905\u0928\u0941\u0915\u0942\u0932\u0924\u093E", "Graha Maitri":"\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F\u092A\u0924\u093F", Gana:"\u0938\u094D\u0935\u092D\u093E\u0935", Bhakut:"\u091A\u0902\u0926\u094D\u0930 \u0930\u093E\u0936\u093F \u092F\u0941\u0917\u0932", Nadi:"\u0936\u093E\u0930\u0940\u0930\u093F\u0915 \u0938\u0902\u0930\u091A\u0928\u093E" },
  gu:  { Varna:"\u0A86\u0AA7\u0ACD\u0AAF\u0ABE\u0AA4\u0ACD\u0AAE\u0ABF\u0A95 \u0AB5\u0ABF\u0A95\u0ABE\u0AB8", Vasya:"\u0A86\u0A95\u0AB0\u0ACD\u0AB7\u0AA3", Tara:"\u0A9C\u0AA8\u0ACD\u0AAE \u0AA8\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0", Yoni:"\u0A9C\u0AC8\u0AB5\u0ABF\u0A95 \u0A85\u0AA8\u0AC1\u0A95\u0AC2\u0AB3\u0AA4\u0ABE", "Graha Maitri":"\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF \u0AB8\u0ACD\u0AB5\u0ABE\u0AAE\u0AC0", Gana:"\u0AB8\u0ACD\u0AB5\u0AAD\u0ABE\u0AB5", Bhakut:"\u0A9A\u0A82\u0AA6\u0ACD\u0AB0 \u0AB0\u0ABE\u0AB6\u0ABF \u0AAF\u0AC1\u0A97", Nadi:"\u0AB6\u0ABE\u0AB0\u0AC0\u0AB0\u0ABF\u0A95 \u0AAC\u0A82\u0AA7\u0ABE\u0AB0\u0AA3" },
};

// ─── Date / time formatters ───────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function formatDate(d: string) {
  if (!d) return "\u2014";
  const parts = d.split("-");
  if (parts.length < 3) return d;
  const [y, m, dd] = parts;
  return `${y} ${MONTHS[parseInt(m) - 1] ?? m} ${dd}`;
}
function formatTime(t: string) {
  if (!t) return "\u2014";
  const [hStr, mStr = "00"] = t.split(":");
  const h = parseInt(hStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")} : ${mStr} ${ampm}`;
}

// ─── Translation helpers ───────────────────────────────────────────────────────
function tSign(n: string, l: Lang) { const i = SIGN_NAMES.en.indexOf(n); return i >= 0 ? SIGN_NAMES[l][i] : n; }
function tNak(n: string, l: Lang)  { const i = NAKSHATRA_NAMES.en.indexOf(n); return i >= 0 ? NAKSHATRA_NAMES[l][i] : n; }
function tPlanet(n: string, l: Lang) { return PLANET_NAMES[l][n] ?? n; }
function tValue(val: string, l: Lang) {
  if (!val) return val;
  const s = tSign(val, l);   if (s !== val) return s;
  const n = tNak(val, l);    if (n !== val) return n;
  const p = tPlanet(val, l); if (p !== val) return p;
  const GANA: Record<Lang, Record<string,string>> = {
    en: {Deva:"Deva",Manav:"Manav",Rakshasa:"Rakshasa"},
    hi: {Deva:"\u0926\u0947\u0935",Manav:"\u092E\u093E\u0928\u0935",Rakshasa:"\u0930\u093E\u0915\u094D\u0937\u0938"},
    gu: {Deva:"\u0AA6\u0AC7\u0AB5",Manav:"\u0AAE\u0ABE\u0AA8\u0AB5",Rakshasa:"\u0AB0\u0ABE\u0A95\u0ACD\u0AB7\u0AB8"},
  };
  const NADI: Record<Lang, Record<string,string>> = {
    en: {Adi:"Adi",Madhya:"Madhya",Antya:"Antya"},
    hi: {Adi:"\u0906\u0926\u093F",Madhya:"\u092E\u0927\u094D\u092F",Antya:"\u0905\u0902\u0924\u094D\u092F"},
    gu: {Adi:"\u0A86\u0AA6\u0ABF",Madhya:"\u0AAE\u0AA7\u0ACD\u0AAF",Antya:"\u0A85\u0A82\u0AA4\u0ACD\u0AAF"},
  };
  const VASYA: Record<Lang, Record<string,string>> = {
    en: {Chatushpada:"Chatushpada",Manava:"Manava",Jalchar:"Jalchar",Keeta:"Keeta",Vanachara:"Vanachara"},
    hi: {Chatushpada:"\u091A\u0924\u0941\u0937\u094D\u092A\u093E\u0926",Manava:"\u092E\u093E\u0928\u0935",Jalchar:"\u091C\u0932\u091A\u0930",Keeta:"\u0915\u0940\u091F",Vanachara:"\u0935\u0928\u091A\u0930"},
    gu: {Chatushpada:"\u0A9A\u0AA4\u0AC1\u0AB7\u0ACD\u0AAA\u0ABE\u0AA6",Manava:"\u0AAE\u0ABE\u0AA8\u0AB5",Jalchar:"\u0A9C\u0AB3\u0A9A\u0AB0",Keeta:"\u0A95\u0AC0\u0A9F",Vanachara:"\u0AB5\u0AA8\u0A9A\u0AB0"},
  };
  const VARNA: Record<Lang, Record<string,string>> = {
    en: {Brahmin:"Brahmin",Kshatriya:"Kshatriya",Vaishya:"Vaishya",Shudra:"Shudra"},
    hi: {Brahmin:"\u092C\u094D\u0930\u093E\u0939\u094D\u092E\u0923",Kshatriya:"\u0915\u094D\u0937\u0924\u094D\u0930\u093F\u092F",Vaishya:"\u0935\u0948\u0936\u094D\u092F",Shudra:"\u0936\u0942\u0926\u094D\u0930"},
    gu: {Brahmin:"\u0AAC\u0ACD\u0AB0\u0ABE\u0AB9\u0ACD\u0AAE\u0AA3",Kshatriya:"\u0A95\u0ACD\u0AB7\u0AA4\u0ACD\u0AB0\u0ABF\u0AAF",Vaishya:"\u0AB5\u0AC8\u0AB6\u0ACD\u0AAF",Shudra:"\u0AB6\u0AC2\u0AA6\u0ACD\u0AB0"},
  };
  const YONI: Record<Lang, Record<string,string>> = {
    en: {Horse:"Horse",Elephant:"Elephant",Goat:"Goat",Serpent:"Serpent",Dog:"Dog",Cat:"Cat",Rat:"Rat",Cow:"Cow",Buffalo:"Buffalo",Tiger:"Tiger",Hare:"Hare",Monkey:"Monkey",Mongoose:"Mongoose",Lion:"Lion"},
    hi: {Horse:"\u0905\u0936\u094D\u0935",Elephant:"\u0917\u091C",Goat:"\u092E\u0947\u0937",Serpent:"\u0938\u0930\u094D\u092A",Dog:"\u0936\u094D\u0935\u093E\u0928",Cat:"\u092E\u093E\u0930\u094D\u091C\u093E\u0930",Rat:"\u092E\u0942\u0937\u0915",Cow:"\u0917\u094C",Buffalo:"\u092E\u0939\u093F\u0937",Tiger:"\u0935\u094D\u092F\u093E\u0918\u094D\u0930",Hare:"\u092E\u0943\u0917",Monkey:"\u0935\u093E\u0928\u0930",Mongoose:"\u0928\u0915\u0941\u0932",Lion:"\u0938\u093F\u0902\u0939"},
    gu: {Horse:"\u0A05\u0AB6\u0ACD\u0AB5",Elephant:"\u0A17\u0A9C",Goat:"\u0AAE\u0AC7\u0AB7",Serpent:"\u0AB8\u0AB0\u0ACD\u0AAA",Dog:"\u0AB6\u0ACD\u0AB5\u0ABE\u0AA8",Cat:"\u0AAE\u0ABE\u0AB0\u0ACD\u0A9C\u0ABE\u0AB0",Rat:"\u0AAE\u0AC2\u0AB7\u0A95",Cow:"\u0A17\u0ACB",Buffalo:"\u0AAE\u0AB9\u0ABF\u0AB7",Tiger:"\u0AB5\u0ACD\u0AAF\u0ABE\u0A98\u0ACD\u0AB0",Hare:"\u0AAE\u0AC3\u0A97",Monkey:"\u0AB5\u0ABE\u0AA8\u0AB0",Mongoose:"\u0AA8\u0A95\u0AC1\u0AB2",Lion:"\u0AB8\u0ABF\u0A82\u0AB9"},
  };
  return GANA[l][val] ?? NADI[l][val] ?? VASYA[l][val] ?? VARNA[l][val] ?? YONI[l][val] ?? val;
}

// ─── Grade helpers ─────────────────────────────────────────────────────────────
function gradeTxt(g: string) {
  const m: Record<string,string> = {Excellent:"text-emerald-600","Very Good":"text-green-600",Good:"text-lime-600",Average:"text-amber-600","Below Average":"text-orange-600"};
  return m[g] ?? "text-red-600";
}
function gradePill(g: string) {
  const m: Record<string,string> = {Excellent:"bg-emerald-50 border-emerald-200 text-emerald-700","Very Good":"bg-green-50 border-green-200 text-green-700",Good:"bg-lime-50 border-lime-200 text-lime-700",Average:"bg-amber-50 border-amber-200 text-amber-700","Below Average":"bg-orange-50 border-orange-200 text-orange-700"};
  return m[g] ?? "bg-red-50 border-red-200 text-red-700";
}
function gradeBar(pct: number) {
  if (pct >= 83) return "bg-emerald-500";
  if (pct >= 67) return "bg-green-500";
  if (pct >= 58) return "bg-lime-500";
  if (pct >= 50) return "bg-amber-500";
  if (pct >= 33) return "bg-orange-500";
  return "bg-red-500";
}

// ─── Score Circle (SVG gauge) ─────────────────────────────────────────────────
function ScoreCircle({ score, max, pct }: { score: number; max: number; pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / max);
  const color = pct >= 83 ? "#10b981" : pct >= 67 ? "#22c55e" : pct >= 50 ? "#f59e0b" : pct >= 33 ? "#f97316" : "#ef4444";
  const stars = Math.round((score / max) * 5);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="136" height="136" viewBox="0 0 136 136">
        {/* glow ring */}
        <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
        {/* progress ring */}
        <circle
          cx="68" cy="68" r={r} fill="none"
          stroke={color} strokeWidth="11"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 68 68)"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        <text x="68" y="63" textAnchor="middle" fill="white" fontSize="30" fontWeight="900" fontFamily="system-ui">{score}</text>
        <text x="68" y="80" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="system-ui">/ {max}</text>
      </svg>
      {/* Stars */}
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(i => (
          <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= stars ? "#fbbf24" : "rgba(255,255,255,0.18)"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  );
}

// ─── Legend Button ────────────────────────────────────────────────────────────
function LegendButton() {
  return (
    <div className="relative group shrink-0">
      <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-700 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Legend
      </button>
      <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72 hidden group-hover:block pointer-events-none">
        {/* <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Chart Legend</p> */}

        {/* Dignity */}
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Graha Dignity</p>
        <div className="space-y-1.5 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-600 w-5">++</span>
            <span className="text-sm text-gray-700">Swakshetra – own sign</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-blue-600 w-5">+</span>
            <span className="text-sm text-gray-700">Uchcha – exalted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-500 w-5">↓</span>
            <span className="text-sm text-gray-700">Neecha – debilitated</span>
          </div>
          <div className="flex items-center gap-2">
            {/* <span className="text-xs font-bold text-red-600 w-5">-</span> */}
            <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="3" y1="5" x2="11" y2="5" stroke={"red"} strokeWidth="1" strokeDasharray="2 0"/>
              </svg>
            <span className="text-sm text-gray-700">Retrograde motion</span>
          </div>
        </div>

        {/* Aspects */}
        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Vedic Drishti (hover planet)</p>
        <div className="space-y-1.5">
          {([
            { color: "#111827", label: "Ek Paad" },
            { color: "#2563eb", label: "Dwi Paad" },
            { color: "#16a34a", label: "Tri Paad" },
            { color: "#dc2626", label: "Sampurna" },
          ] as { color: string; label: string }[]).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <svg width="28" height="10" viewBox="0 0 28 10">
                <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2" strokeDasharray="5 3"/>
              </svg>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>

        {/* Special aspects note */}
        {/* <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Special Aspects (Sampurna)</p>
          <p className="text-[10px] text-gray-500 leading-relaxed">Mars: 4th &amp; 8th · Jupiter: 5th &amp; 9th · Saturn: 3rd &amp; 10th</p>
        </div> */}
      </div>
    </div>
  );
}

// ─── Koot card (visual progress bar) ─────────────────────────────────────────
function KootCard({ k, lang }: { k: MatchKoot; lang: Lang }) {
  const pct = k.score / k.max_score;
  const barGrad = pct >= 1 ? "from-emerald-400 to-emerald-500"
    : pct >= 0.5 ? "from-amber-400 to-amber-500"
    : "from-red-400 to-red-500";
  const scoreCls = pct >= 1 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : pct >= 0.5 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-500 bg-red-50 border-red-200";
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <p className="text-gray-900 text-sm font-bold leading-tight">{KOOT_NAMES[lang][k.name] ?? k.name}</p>
          <p className="text-gray-400 text-xs mt-0.5 leading-tight">{KOOT_DESC[lang][k.name] ?? ""}</p>
        </div>
        <span className={`text-base font-black px-2 py-0.5 rounded-lg border flex-shrink-0 ${scoreCls}`}>
          {k.score}/{k.max_score}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${barGrad}`} style={{ width: `${pct * 100}%` }} />
      </div>
      {/* Boy vs Girl */}
      <div className="flex items-center justify-between">
          <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full border border-indigo-100 font-semibold">
          {tValue(k.boy_value, lang)}
        </span>
        <span className="text-gray-300 text-[10px]">vs</span>
        <span className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full border border-rose-100 font-semibold">
          {tValue(k.girl_value, lang)}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MatchResultPage() {
  const router = useRouter();
  const [data, setData] = useState<MatchResponse | null>(null);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const sl = localStorage.getItem("jk_lang") as Lang | null;
    if (sl) setLang(sl);
    const raw = sessionStorage.getItem("matchResult");
    if (!raw) { router.replace("/match"); return; }
    try { setData(JSON.parse(raw)); } catch { router.replace("/match"); }
  }, [router]);

  const switchLang = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem("jk_lang", l); } catch { /* ignore */ }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">Loading\u2026</p>
      </div>
    );
  }

  const t = M[lang];
  const pct = data.percentage;
  const boyInit = (data.boy_name || "B")[0].toUpperCase();
  const girlInit = (data.girl_name || "G")[0].toUpperCase();

  return (
    <div className="bg-gray-50 lg:h-screen lg:flex lg:flex-col lg:overflow-hidden">

      {/* ── Sticky Navbar ── */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="w-full px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push("/")}
              className="font-bold text-indigo-700 text-sm tracking-tight hover:text-indigo-500 transition-colors"
            >
              Jyotish
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t.back}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <LegendButton />
            {/* Download Report */}
            <button
              onClick={() => downloadMatchReport(data)}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 4v11"/>
              </svg>
              Download Report
            </button>
            {/* Language */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(["en","hi","gu"] as Lang[]).map(l => (
                <button
                  key={l}
                  onClick={() => switchLang(l)}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${lang === l ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {l === "en" ? "EN" : l === "hi" ? "हि" : "ગુ"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div
        className="relative overflow-hidden text-white lg:shrink-0"
        style={{ background: "linear-gradient(140deg, #1e0d42 0%, #3c1262 28%, #7b1b75 55%, #c0286a 80%, #d84060 100%)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-8 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-300/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 px-6 py-8 max-w-3xl mx-auto">
          {/* Subtitle */}
          <p className="text-center text-white/60 text-[10px] font-bold uppercase tracking-[4px] mb-5">
            Ashtakoot Kundli Milan
          </p>

          {/* Three columns: Boy | Score | Girl */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">

            {/* Boy */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-400/30 border-2 border-indigo-300/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-900/40">
                <span className="text-3xl font-black text-white">{boyInit}</span>
              </div>
              <p className="font-extrabold text-white text-base leading-tight truncate">{data.boy_name || "Var"}</p>
              <p className="text-indigo-200 text-xs mt-1">{tSign(data.boy_moon_sign, lang)}</p>
              <p className="text-indigo-200/70 text-[10px] mt-0.5">{tNak(data.boy_nakshatra, lang)}</p>
              <p className="text-white/50 text-[9px] mt-1.5 tracking-widest uppercase">♂ Groom</p>
            </div>

            {/* Score Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <ScoreCircle score={data.total_score} max={36} pct={pct} />
              <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${gradePill(data.grade)}`}>
                {data.grade}
              </span>
              <p className="text-white/60 text-[11px] text-center italic max-w-[130px] leading-tight mt-0.5">
                {data.recommendation}
              </p>
            </div>

            {/* Girl */}
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-400/30 border-2 border-rose-300/60 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-rose-900/40">
                <span className="text-3xl font-black text-white">{girlInit}</span>
              </div>
              <p className="font-extrabold text-white text-base leading-tight truncate">{data.girl_name || "Vadhu"}</p>
              <p className="text-pink-200 text-xs mt-1">{tSign(data.girl_moon_sign, lang)}</p>
              <p className="text-pink-200/70 text-[10px] mt-0.5">{tNak(data.girl_nakshatra, lang)}</p>
              <p className="text-white/50 text-[9px] mt-1.5 tracking-widest uppercase">♀ Bride</p>
            </div>
          </div>

          {/* Compatibility bar */}
          <div className="max-w-xs mx-auto mt-6">
            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${gradeBar(pct)}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-center text-white/55 text-[11px] mt-2 font-medium">{pct}% Compatibility</p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] lg:h-full">

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-4 px-4 sm:px-6 py-5 lg:overflow-y-auto lg:h-full">

            {/* ── Birth Details comparison ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-rose-50 flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Birth Details</h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-indigo-600 font-semibold">{data.boy_name || "Groom"}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-rose-600 font-semibold">{data.girl_name || "Bride"}</span>
                  </span>
                </div>
              </div>
              <table className="w-full">
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: t.dob,      bv: formatDate(data.boy_chart.meta.birth_date),  gv: formatDate(data.girl_chart.meta.birth_date) },
                    { label: t.tob,      bv: formatTime(data.boy_chart.meta.birth_time),  gv: formatTime(data.girl_chart.meta.birth_time) },
                    { label: t.place,    bv: data.boy_chart.meta.birth_place,              gv: data.girl_chart.meta.birth_place },
                    { label: t.rasi,     bv: tSign(data.boy_moon_sign, lang),              gv: tSign(data.girl_moon_sign, lang) },
                    { label: t.rasiLord, bv: SIGN_LORDS[lang][data.boy_moon_sign] ?? "—", gv: SIGN_LORDS[lang][data.girl_moon_sign] ?? "—" },
                    { label: t.janmaNak, bv: tNak(data.boy_nakshatra, lang),               gv: tNak(data.girl_nakshatra, lang) },
                    { label: t.nakLord,  bv: tPlanet(data.boy_nakshatra_lord, lang),       gv: tPlanet(data.girl_nakshatra_lord, lang) },
                    { label: t.dosha,
                      bv: data.boy_mangal_dosha  ? <span className="text-red-600 font-semibold">⚠ {t.mangalYes}</span>  : <span className="text-emerald-600 font-semibold">✓ {t.mangalNo}</span>,
                      gv: data.girl_mangal_dosha ? <span className="text-red-600 font-semibold">⚠ {t.mangalYes}</span> : <span className="text-emerald-600 font-semibold">✓ {t.mangalNo}</span>,
                    },
                  ].map(({ label, bv, gv }, i) => (
                    <tr key={i} className="hover:bg-gray-50/60">
                      <td className="py-2 px-4 text-gray-500 text-sm w-[35%]">{label}</td>
                      <td className="py-2 px-3 text-indigo-700 text-sm font-medium w-[32.5%]">{bv || "—"}</td>
                      <td className="py-2 px-3 text-rose-700 text-sm font-medium w-[32.5%]">{gv || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Ashtakoot Visual Koots ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-indigo-50/60 flex items-center justify-between">
                <h2 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">{t.sub}</h2>
                <div className={`text-sm font-black px-3 py-0.5 rounded-full border ${gradePill(data.grade)}`}>
                  {data.total_score}/36 · {pct}%
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-2 gap-2">
                {data.koots.map(k => <KootCard key={k.name} k={k} lang={lang} />)}
              </div>
              {/* Totals bar */}
              <div className="mx-3 mb-3 bg-gradient-to-r from-indigo-50 to-rose-50 rounded-xl px-4 py-3 border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t.total}</p>
                  <p className={`text-3xl font-black ${gradeTxt(data.grade)}`}>{data.total_score}<span className="text-gray-400 text-base font-normal">/36</span></p>
                </div>
                <div className="text-right">
                  <span className={`text-base font-bold border rounded-full px-3 py-1 ${gradePill(data.grade)}`}>{data.grade}</span>
                  <p className="text-gray-400 text-xs mt-1 italic">{data.recommendation}</p>
                </div>
              </div>
            </div>

            {/* ── Mangal Dosha ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
              <p className="text-gray-700 font-bold text-sm mb-3 uppercase tracking-wider">{t.mangalTitle}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { name: data.boy_name || "Groom", has: data.boy_mangal_dosha },
                  { name: data.girl_name || "Bride", has: data.girl_mangal_dosha },
                ].map(({ name, has }) => (
                  <div key={name} className={`flex items-center gap-2.5 rounded-xl px-4 py-3 border ${has ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className={`text-xl ${has ? "text-red-400" : "text-emerald-400"}`}>{has ? "⚠" : "✓"}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm leading-tight">{name}</p>
                      <p className={`text-sm leading-tight mt-0.5 font-medium ${has ? "text-red-600" : "text-emerald-600"}`}>{has ? t.mangalYes : t.mangalNo}</p>
                    </div>
                  </div>
                ))}
              </div>
              {data.mangal_dosha_cancelled && (
                <div className="mt-2.5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-emerald-700 font-semibold">{t.mangalOff}</p>
                </div>
              )}
              {data.mangal_dosha_note && (
                <p className="text-gray-400 text-xs mt-1.5">{data.mangal_dosha_note}</p>
              )}
            </div>

            {/* ── Sadsatkut Kostkaani ── */}
            {(() => {
              const sk = data.sadsatkut;
              type SkKey = "priti_shadashtak"|"mrityu_shadashtak"|"shubh_dvadashatak"|"ashubh_dvadashatak"|"shubh_navpancham"|"nashtan_navpancham";
              type TKey = keyof typeof t;
              const pairGroups: { label: string; items: { key: SkKey; titleKey: TKey; descKey: TKey; auspicious: boolean }[] }[] = [
                {
                  label: "Shadashtak · 6/8",
                  items: [
                    { key: "priti_shadashtak",  titleKey: "priti",  descKey: "pritiDesc",  auspicious: true  },
                    { key: "mrityu_shadashtak", titleKey: "mrityu", descKey: "mrityuDesc", auspicious: false },
                  ],
                },
                {
                  label: "Dvadashatak · 2/12",
                  items: [
                    { key: "shubh_dvadashatak",  titleKey: "shubhDva",  descKey: "shubhDvaDesc",  auspicious: true  },
                    { key: "ashubh_dvadashatak", titleKey: "ashubhDva", descKey: "ashubhDvaDesc", auspicious: false },
                  ],
                },
                {
                  label: "Navpancham · 5/9",
                  items: [
                    { key: "shubh_navpancham",   titleKey: "shubhNav",   descKey: "shubhNavDesc",   auspicious: true  },
                    { key: "nashtan_navpancham", titleKey: "nashtanNav", descKey: "nashtanNavDesc", auspicious: false },
                  ],
                },
              ];
              return (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
                  <p className="text-gray-700 font-bold text-sm mb-0.5 uppercase tracking-wider">{t.sadsatkutTitle}</p>
                  <p className="text-gray-400 text-xs mb-3">{t.sadsatkutSub}</p>
                  <div className="space-y-3">
                    {pairGroups.map(({ label, items }) => (
                      <div key={label}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {items.map(({ key, titleKey, descKey, auspicious }) => {
                            const present = sk ? (sk[key] as boolean) : false;
                            const bg = present
                              ? auspicious ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-100";
                            const iconCls = present
                              ? auspicious ? "text-emerald-500" : "text-red-400"
                              : "text-gray-300";
                            const nameCls = present
                              ? auspicious ? "text-emerald-800" : "text-red-700"
                              : "text-gray-400";
                            const descCls = present
                              ? auspicious ? "text-emerald-600" : "text-red-400"
                              : "text-gray-300";
                            return (
                              <div key={key} className={`rounded-xl px-2.5 py-2 border ${bg}`}>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <span className={`text-sm font-bold leading-none ${iconCls}`}>{present ? "✓" : "–"}</span>
                                  <p className={`font-semibold text-xs leading-tight ${nameCls}`}>{t[titleKey] as string}</p>
                                </div>
                                <p className={`text-[10px] leading-tight ${descCls}`}>{t[descKey] as string}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>{/* end LEFT COLUMN */}

          {/* ════ RIGHT COLUMN ════ */}
          <div className="space-y-4 px-4 sm:px-6 py-5 lg:overflow-y-auto lg:h-full lg:border-l border-gray-100">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h2 className="text-gray-700 font-bold text-sm mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                🪐 {t.charts}
              </h2>
              <div className="space-y-4">
                {[
                  { name: data.boy_name  || "Groom", chart: data.boy_chart,  accentBorder: "border-indigo-200", dotCls: "bg-indigo-500", nameCls: "text-indigo-700", bg: "bg-indigo-50" },
                  { name: data.girl_name || "Bride", chart: data.girl_chart, accentBorder: "border-rose-200",   dotCls: "bg-rose-400",   nameCls: "text-rose-700",  bg: "bg-rose-50"  },
                ].map(({ name, chart, accentBorder, dotCls, nameCls, bg }) => (
                  <div key={name}>
                    <div className={`flex items-center gap-2 mb-1.5 ${bg} rounded-lg px-2.5 py-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${dotCls} flex-shrink-0`} />
                      <p className={`text-sm font-bold ${nameCls}`}>{name}</p>
                    </div>
                    <div className={`border-2 rounded-xl overflow-hidden ${accentBorder} shadow-sm`} style={{ aspectRatio: "900/640" }}>
                      <ChartWheel chart={chart} lang={lang} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-gray-400 text-xs pb-2">{t.footer}</p>
          </div>{/* end RIGHT COLUMN */}

        </div>
      </div>
    </div>
  );
}
