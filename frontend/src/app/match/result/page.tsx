"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchResponse, MatchKoot } from "@/types/chart";
import ChartWheel from "@/components/ChartWheel";
import { type Lang, SIGN_NAMES, NAKSHATRA_NAMES, PLANET_NAMES, SIGN_LORDS } from "@/lib/translations";

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

// ─── Score dots ────────────────────────────────────────────────────────────────
function ScoreDots({ score, max }: { score: number; max: number }) {
  const f = Math.round(score);
  return (
    <span className="inline-flex gap-0.5 flex-wrap">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < f ? "bg-indigo-500" : "bg-gray-200"}`} />
      ))}
    </span>
  );
}

// ─── Koot row ──────────────────────────────────────────────────────────────────
function KootRow({ k, lang }: { k: MatchKoot; lang: Lang }) {
  const pct = k.score / k.max_score;
  const scCls = pct >= 1 ? "text-emerald-700 bg-emerald-50 border-emerald-300"
    : pct >= 0.5 ? "text-amber-700 bg-amber-50 border-amber-300"
    : "text-red-700 bg-red-50 border-red-300";
  return (
    <tr className="border-b border-gray-100 hover:bg-indigo-50/20 transition-colors">
      <td className="py-3 px-3">
        <p className="text-gray-800 text-sm font-semibold leading-tight">{KOOT_NAMES[lang][k.name] ?? k.name}</p>
        <p className="text-gray-400 text-xs leading-tight mt-0.5">{KOOT_DESC[lang][k.name] ?? ""}</p>
      </td>
      <td className="py-3 px-3 whitespace-nowrap">
        <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${scCls}`}>
          {k.score}/{k.max_score}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
          {tValue(k.boy_value, lang)}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="inline-block bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
          {tValue(k.girl_value, lang)}
        </span>
      </td>
    </tr>
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
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Navbar ── */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
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
              onClick={() => router.push("/match")}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {t.back}
            </button>
          </div>
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {(["en","hi","gu"] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all ${lang === l ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {l === "en" ? "EN" : l === "hi" ? "\u0939\u093F" : "\u0A97\u0AC1"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Two-column layout ── */}
      <div className="w-full px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">

          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-3">

            {/* ── Hero score card ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* header */}
              <div className="px-4 py-2.5 border-b border-gray-100 bg-rose-50/50 text-center">
                <h1 className="text-rose-700 font-bold text-sm tracking-tight">&#128146; {t.title}</h1>
              </div>

              {/* Boy | Score | Girl */}
              <div className="grid grid-cols-3 divide-x divide-gray-100">
                {/* Boy */}
                <div className="px-3 py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base mx-auto mb-1.5">
                    {boyInit}
                  </div>
                  <p className="text-gray-900 font-bold text-sm leading-tight truncate">{data.boy_name || "Boy"}</p>
                  <p className="text-indigo-500 text-[11px] mt-0.5">{tSign(data.boy_moon_sign, lang)}</p>
                </div>

                {/* Score */}
                <div className="px-3 py-3 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-end gap-0.5">
                    <span className={`text-4xl font-black leading-none ${gradeTxt(data.grade)}`}>{data.total_score}</span>
                    <span className="text-sm text-gray-400 mb-0.5">/36</span>
                  </div>
                  <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${gradePill(data.grade)}`}>{data.grade}</span>
                  <div className="w-full max-w-[100px] bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${gradeBar(pct)}`} style={{ width:`${pct}%` }} />
                  </div>
                  <p className="text-gray-400 text-[10px]">{pct}%</p>
                  <p className="text-gray-500 text-[10px] text-center leading-tight mt-1 italic max-w-[120px]">{data.recommendation}</p>
                </div>

                {/* Girl */}
                <div className="px-3 py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-base mx-auto mb-1.5">
                    {girlInit}
                  </div>
                  <p className="text-gray-900 font-bold text-sm leading-tight truncate">{data.girl_name || "Girl"}</p>
                  <p className="text-rose-500 text-[11px] mt-0.5">{tSign(data.girl_moon_sign, lang)}</p>
                </div>
              </div>

              {/* Details comparison table */}
              <div className="border-t border-gray-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-1.5 px-3 text-left text-gray-400 text-[10px] font-semibold uppercase tracking-wider w-[38%]">{t.detail}</th>
                      <th className="py-1.5 px-2 text-center text-indigo-600 text-[10px] font-bold w-[31%]">{data.boy_name || "Boy"}</th>
                      <th className="py-1.5 px-2 text-center text-rose-600 text-[10px] font-bold w-[31%]">{data.girl_name || "Girl"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { label: t.dob,      bv: formatDate(data.boy_chart.meta.birth_date),  gv: formatDate(data.girl_chart.meta.birth_date) },
                      { label: t.tob,      bv: formatTime(data.boy_chart.meta.birth_time),  gv: formatTime(data.girl_chart.meta.birth_time) },
                      { label: t.place,    bv: data.boy_chart.meta.birth_place,              gv: data.girl_chart.meta.birth_place },
                      { label: t.rasi,     bv: tSign(data.boy_moon_sign, lang),              gv: tSign(data.girl_moon_sign, lang) },
                      { label: t.rasiLord, bv: SIGN_LORDS[lang][data.boy_moon_sign] ?? "\u2014", gv: SIGN_LORDS[lang][data.girl_moon_sign] ?? "\u2014" },
                      { label: t.janmaNak, bv: tNak(data.boy_nakshatra, lang),               gv: tNak(data.girl_nakshatra, lang) },
                      { label: t.nakLord,  bv: tPlanet(data.boy_nakshatra_lord, lang),       gv: tPlanet(data.girl_nakshatra_lord, lang) },
                      { label: t.dosha,    bv: data.boy_mangal_dosha  ? t.mangalYes : t.mangalNo, gv: data.girl_mangal_dosha ? t.mangalYes : t.mangalNo },
                    ].map(({ label, bv, gv }) => (
                      <tr key={label} className="hover:bg-gray-50/60">
                        <td className="py-1.5 px-3 text-gray-500 text-[11px]">{label}</td>
                        <td className="py-1.5 px-2 text-center text-indigo-700 text-[11px] font-medium">{bv || "\u2014"}</td>
                        <td className="py-1.5 px-2 text-center text-rose-700 text-[11px] font-medium">{gv || "\u2014"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Ashtakoot Table ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-indigo-50/40 flex items-center justify-between">
                <h2 className="text-indigo-900 font-bold text-xs uppercase tracking-wide">{t.sub}</h2>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    <span className="text-indigo-600 font-medium">{data.boy_name || "Boy"}</span>
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    <span className="text-rose-600 font-medium">{data.girl_name || "Girl"}</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-2 px-3 text-left text-gray-500 text-xs font-semibold uppercase tracking-wider">{t.koot}</th>
                      <th className="py-2 px-3 text-left text-gray-500 text-xs font-semibold uppercase tracking-wider">{t.score}</th>
                      <th className="py-2 px-3 text-center text-indigo-600 text-xs font-bold">
                        {data.boy_name || "Boy"}
                      </th>
                      <th className="py-2 px-3 text-center text-rose-600 text-xs font-bold">
                        {data.girl_name || "Girl"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.koots.map(k => <KootRow key={k.name} k={k} lang={lang} />)}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-indigo-50/30">
                      <td className="py-3 px-3 font-bold text-gray-900 text-sm">{t.total}</td>
                      <td className="py-3 px-3">
                        <span className={`font-black text-lg ${gradeTxt(data.grade)}`}>{data.total_score}/36</span>
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-right">
                        <span className={`text-sm font-bold border rounded-full px-3 py-1 ${gradePill(data.grade)}`}>{data.grade}{" · "}{pct}%</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ── Mangal Dosha ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
              <p className="text-gray-700 font-bold text-xs mb-2">{t.mangalTitle}</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: data.boy_name || "Boy",  has: data.boy_mangal_dosha },
                  { name: data.girl_name || "Girl", has: data.girl_mangal_dosha },
                ].map(({ name, has }) => (
                  <div key={name} className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-xs ${has ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${has ? "bg-red-500" : "bg-emerald-500"}`} />
                    <div>
                      <p className="font-semibold text-gray-800 leading-tight">{name}</p>
                      <p className={`leading-tight ${has ? "text-red-600" : "text-emerald-600"}`}>{has ? t.mangalYes : t.mangalNo}</p>
                    </div>
                  </div>
                ))}
              </div>
              {data.mangal_dosha_cancelled && (
                <div className="mt-2 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-emerald-700 font-medium">{t.mangalOff}</p>
                </div>
              )}
              {data.mangal_dosha_note && (
                <p className="text-gray-400 text-[10px] mt-1.5">{data.mangal_dosha_note}</p>
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
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
                  <p className="text-gray-700 font-bold text-xs mb-0.5">{t.sadsatkutTitle}</p>
                  <p className="text-gray-400 text-[10px] mb-3">{t.sadsatkutSub}</p>
                  <div className="space-y-3">
                    {pairGroups.map(({ label, items }) => (
                      <div key={label}>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
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
                                  <p className={`font-semibold text-[10px] leading-tight ${nameCls}`}>{t[titleKey] as string}</p>
                                </div>
                                <p className={`text-[9px] leading-tight ${descCls}`}>{t[descKey] as string}</p>
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

          {/* ════ RIGHT COLUMN — sticky, birth charts ════ */}
          <div className="lg:sticky lg:top-14 space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h2 className="text-gray-700 font-bold text-xs mb-3 flex items-center gap-1.5">
                &#127756; {t.charts}
              </h2>
              <div className="space-y-4">
                {[
                  { name: data.boy_name  || "Boy",  chart: data.boy_chart,  accent: "border-indigo-200", dotCls: "bg-indigo-500", nameCls: "text-indigo-700" },
                  { name: data.girl_name || "Girl", chart: data.girl_chart, accent: "border-rose-200",   dotCls: "bg-rose-400",   nameCls: "text-rose-700"  },
                ].map(({ name, chart, accent, dotCls, nameCls }) => (
                  <div key={name}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${dotCls} inline-block`} />
                      <p className={`text-xs font-bold ${nameCls}`}>{name}</p>
                    </div>
                    <div className={`border rounded-xl overflow-hidden ${accent}`} style={{ aspectRatio:"900/640" }}>
                      <ChartWheel chart={chart} lang={lang} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-gray-400 text-[10px] pb-2">{t.footer}</p>
          </div>{/* end RIGHT COLUMN */}

        </div>
      </div>
    </div>
  );
}
