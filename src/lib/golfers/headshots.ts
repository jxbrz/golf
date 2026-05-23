const espnGolfIdsByName: Record<string, string> = {
  "aaron rai": "10906",
  "adam scott": "388",
  "akshay bhatia": "4419142",
  "ben griffin": "4404992",
  "brian harman": "1225",
  "brooks koepka": "6798",
  "bryson dechambeau": "10046",
  "cameron smith": "9131",
  "cameron young": "4425906",
  "chris gotterup": "4690755",
  "collin morikawa": "10592",
  "corey conners": "9126",
  "daniel berger": "9025",
  "denny mccarthy": "10054",
  "dustin johnson": "3448",
  "gary woodland": "3550",
  "harris english": "5408",
  "hideki matsuyama": "5860",
  "jacob bridgeman": "5054388",
  "jake knapp": "9843",
  "jason day": "1680",
  "joaquin niemann": "11099",
  "jon rahm": "9780",
  "jordan spieth": "5467",
  "justin rose": "569",
  "justin thomas": "4848",
  "ludvig aberg": "4375972",
  "ludvig åberg": "4375972",
  "marco penge": "4585549",
  "matt fitzpatrick": "9037",
  "maverick mcnealy": "9530",
  "max homa": "8973",
  "min woo lee": "4410932",
  "minwoo lee": "4410932",
  "nicolai hojgaard": "11250",
  "nicolai højgaard": "11250",
  "patrick cantlay": "6007",
  "patrick reed": "5579",
  "rickie fowler": "3702",
  "robert macintyre": "11378",
  "rory mcilroy": "3470",
  "russell henley": "5409",
  "ryan fox": "4251",
  "sahith theegala": "10980",
  "sam burns": "9938",
  "scottie scheffler": "9478",
  "sepp straka": "8961",
  "shane lowry": "4587",
  "si woo kim": "7081",
  "sungjae im": "11382",
  "tommy fleetwood": "5539",
  "tony finau": "2230",
  "tyrrell hatton": "5553",
  "viktor hovland": "4364873",
  "will zalatoris": "9877",
  "wyndham clark": "11119",
  "xander schauffele": "10140",
};

export function getGolferHeadshotUrl(name: string) {
  const id = espnGolfIdsByName[normalizeGolferName(name)];
  return id ? `https://a.espncdn.com/i/headshots/golf/players/full/${id}.png` : null;
}

export function golferInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

function normalizeGolferName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}
