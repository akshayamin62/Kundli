"""
Pitru Dosha reference data (from Pitru_Dosha_Zodiac_House_Wise_Combinations.xlsx).
Severity: Sign Wise from Dosha Matrix; House Wise from Dosha Matrix or House Severity Matrix.
Regenerate: python backend/scripts/build_pitru_dosha_data.py
"""

from typing import TypedDict


class SignWiseRow(TypedDict):
    sign: str
    combination: str
    stronger_houses: str
    general_impact: str
    nature_theme: str
    severity: str


class HouseWiseRow(TypedDict):
    house: str
    combination: str
    specific_impact: str
    health_focus: str
    severity: str


SIGN_WISE: list[SignWiseRow] = [
    {"sign": 'Aries', "combination": 'Sun + Rahu', "stronger_houses": '1st, 5th, 8th, 9th', "general_impact": 'High BP, migraine, inflammation, eye strain', "nature_theme": 'Fiery ancestral karma, anger, aggression, paternal authority issues', "severity": 'High', },
    {"sign": 'Aries', "combination": 'Sun + Ketu', "stronger_houses": '1st, 8th, 9th', "general_impact": 'Sudden fatigue, head weakness, immunity drop', "nature_theme": 'Fiery ancestral karma, anger, aggression, paternal authority issues', "severity": 'Medium-High', },
    {"sign": 'Aries', "combination": 'Rahu/Ketu affecting 9th', "stronger_houses": '9th', "general_impact": 'Father-line conflict, impulsive decisions, accident tendency', "nature_theme": 'Fiery ancestral karma, anger, aggression, paternal authority issues', "severity": 'High', },
    {"sign": 'Aries', "combination": 'Saturn + Rahu', "stronger_houses": '1st, 8th, 9th', "general_impact": 'Chronic headaches, bone stress, neurological pressure', "nature_theme": 'Fiery ancestral karma, anger, aggression, paternal authority issues', "severity": 'Very High', },
    {"sign": 'Aries', "combination": 'Afflicted Mars linked to 8th/9th', "stronger_houses": '8th, 9th', "general_impact": 'Surgery, blood pressure, injury through haste', "nature_theme": 'Fiery ancestral karma, anger, aggression, paternal authority issues', "severity": 'Very High', },
    {"sign": 'Taurus', "combination": 'Sun + Rahu', "stronger_houses": '2nd, 5th, 8th, 9th', "general_impact": 'Throat, thyroid, food toxicity, sugar issues', "nature_theme": 'Family lineage karma, food habits, wealth disputes, speech patterns', "severity": 'High', },
    {"sign": 'Taurus', "combination": 'Sun + Ketu', "stronger_houses": '2nd, 8th, 12th', "general_impact": 'Weak speech confidence, poor nourishment, neck stiffness', "nature_theme": 'Family lineage karma, food habits, wealth disputes, speech patterns', "severity": 'Medium-High', },
    {"sign": 'Taurus', "combination": 'Rahu/Ketu in Taurus-Scorpio axis', "stronger_houses": '2nd-8th', "general_impact": 'Family-genetic disease, financial stress affecting health', "nature_theme": 'Family lineage karma, food habits, wealth disputes, speech patterns', "severity": 'Very High', },
    {"sign": 'Taurus', "combination": 'Saturn + Ketu', "stronger_houses": '2nd, 8th', "general_impact": 'Dental, jaw, chronic throat or thyroid weakness', "nature_theme": 'Family lineage karma, food habits, wealth disputes, speech patterns', "severity": 'High', },
    {"sign": 'Taurus', "combination": 'Afflicted Venus with Rahu/Ketu', "stronger_houses": '5th, 8th, 12th', "general_impact": 'Hormonal, reproductive, sugar imbalance', "nature_theme": 'Family lineage karma, food habits, wealth disputes, speech patterns', "severity": 'Medium-High', },
    {"sign": 'Gemini', "combination": 'Sun + Rahu', "stronger_houses": '3rd, 5th, 8th, 9th', "general_impact": 'Nervous stress, respiratory issues, anxiety', "nature_theme": 'Communication karma, sibling-line disturbance, nervous-system stress', "severity": 'High', },
    {"sign": 'Gemini', "combination": 'Sun + Ketu', "stronger_houses": '3rd, 8th, 12th', "general_impact": 'Poor focus, scattered energy, nerve weakness', "nature_theme": 'Communication karma, sibling-line disturbance, nervous-system stress', "severity": 'Medium-High', },
    {"sign": 'Gemini', "combination": 'Rahu/Ketu in Gemini-Sagittarius axis', "stronger_houses": '3rd-9th', "general_impact": 'Sibling-father karma, belief conflict, anxiety', "nature_theme": 'Communication karma, sibling-line disturbance, nervous-system stress', "severity": 'High', },
    {"sign": 'Gemini', "combination": 'Mercury afflicted with Rahu/Ketu', "stronger_houses": '1st, 5th, 8th, 9th', "general_impact": 'Speech, nerves, skin, mental overactivity', "nature_theme": 'Communication karma, sibling-line disturbance, nervous-system stress', "severity": 'Medium-High', },
    {"sign": 'Gemini', "combination": 'Saturn + Rahu', "stronger_houses": '3rd, 8th, 9th', "general_impact": 'Chronic anxiety, shoulder/arm strain', "nature_theme": 'Communication karma, sibling-line disturbance, nervous-system stress', "severity": 'Very High', },
    {"sign": 'Cancer', "combination": 'Moon + Rahu', "stronger_houses": '4th, 5th, 8th, 9th, 12th', "general_impact": 'Anxiety, emotional instability, chest pressure', "nature_theme": 'Maternal ancestral karma, emotional inheritance, family-home disturbances', "severity": 'Medium-High', },
    {"sign": 'Cancer', "combination": 'Moon + Ketu', "stronger_houses": '4th, 8th, 12th', "general_impact": 'Depression, emotional detachment, sleep problems', "nature_theme": 'Maternal ancestral karma, emotional inheritance, family-home disturbances', "severity": 'Medium-High', },
    {"sign": 'Cancer', "combination": 'Sun + Rahu', "stronger_houses": '4th, 8th, 9th', "general_impact": 'Heart stress, weak digestion, emotional father issues', "nature_theme": 'Maternal ancestral karma, emotional inheritance, family-home disturbances', "severity": 'High', },
    {"sign": 'Cancer', "combination": 'Rahu/Ketu on Cancer-Capricorn axis', "stronger_houses": '4th-10th', "general_impact": 'Home-career karmic stress', "nature_theme": 'Maternal ancestral karma, emotional inheritance, family-home disturbances', "severity": 'Medium', },
    {"sign": 'Cancer', "combination": 'Saturn influence on Cancer Moon', "stronger_houses": '4th, 8th, 12th', "general_impact": 'Chronic sadness, lung/chest weakness', "nature_theme": 'Maternal ancestral karma, emotional inheritance, family-home disturbances', "severity": 'Medium-High', },
    {"sign": 'Leo', "combination": 'Sun + Rahu', "stronger_houses": '1st, 5th, 8th, 9th', "general_impact": 'Heart, BP, ego stress, eye problems', "nature_theme": 'Strong paternal Pitru Dosha: father, authority, lineage pride, vitality', "severity": 'High', },
    {"sign": 'Leo', "combination": 'Sun + Ketu', "stronger_houses": '1st, 5th, 9th, 12th', "general_impact": 'Weak vitality, low confidence, spiritual fatigue', "nature_theme": 'Strong paternal Pitru Dosha: father, authority, lineage pride, vitality', "severity": 'Medium-High', },
    {"sign": 'Leo', "combination": 'Saturn aspect on Sun', "stronger_houses": '1st, 8th, 9th, 10th', "general_impact": 'Spine, bones, chronic fatigue', "nature_theme": 'Strong paternal Pitru Dosha: father, authority, lineage pride, vitality', "severity": 'High', },
    {"sign": 'Leo', "combination": 'Rahu/Ketu affecting Leo 5th', "stronger_houses": '5th', "general_impact": 'Child-related stress, digestion, heart anxiety', "nature_theme": 'Strong paternal Pitru Dosha: father, authority, lineage pride, vitality', "severity": 'High', },
    {"sign": 'Leo', "combination": 'Sun weak in D-9/D-12 despite Leo placement', "stronger_houses": 'D-9/D-12', "general_impact": 'Hidden ancestral weakness despite strong appearance', "nature_theme": 'Strong paternal Pitru Dosha: father, authority, lineage pride, vitality', "severity": 'Medium-High', },
    {"sign": 'Virgo', "combination": 'Sun + Rahu', "stronger_houses": '6th, 8th, 9th, 12th', "general_impact": 'Gut issues, skin, anxiety, digestive inflammation', "nature_theme": 'Disease-karma, digestive sensitivity, service-related ancestral burden', "severity": 'High', },
    {"sign": 'Virgo', "combination": 'Sun + Ketu', "stronger_houses": '6th, 8th, 12th', "general_impact": 'Weak digestion, nervous fatigue, poor immunity', "nature_theme": 'Disease-karma, digestive sensitivity, service-related ancestral burden', "severity": 'Medium-High', },
    {"sign": 'Virgo', "combination": 'Mercury + Rahu/Ketu', "stronger_houses": '1st, 5th, 6th, 8th', "general_impact": 'Overthinking, gut-brain issues, allergies', "nature_theme": 'Disease-karma, digestive sensitivity, service-related ancestral burden', "severity": 'High', },
    {"sign": 'Virgo', "combination": '9th lord in Virgo dusthana', "stronger_houses": '6th, 8th, 12th', "general_impact": 'Disease karma through service/work stress', "nature_theme": 'Disease-karma, digestive sensitivity, service-related ancestral burden', "severity": 'High', },
    {"sign": 'Virgo', "combination": 'Saturn + Rahu', "stronger_houses": '6th, 8th, 12th', "general_impact": 'Chronic digestive disorder, anxiety, skin problems', "nature_theme": 'Disease-karma, digestive sensitivity, service-related ancestral burden', "severity": 'Very High', },
    {"sign": 'Libra', "combination": 'Debilitated Sun + Rahu', "stronger_houses": '1st, 5th, 8th, 9th', "general_impact": 'Weak immunity, kidney/reproductive imbalance, low vitality', "nature_theme": 'Relationship karma, marital lineage imbalance, reproductive/hormonal disturbance', "severity": 'High', },
    {"sign": 'Libra', "combination": 'Sun + Ketu', "stronger_houses": '1st, 8th, 12th', "general_impact": 'Relationship stress affecting health, fatigue', "nature_theme": 'Relationship karma, marital lineage imbalance, reproductive/hormonal disturbance', "severity": 'Medium-High', },
    {"sign": 'Libra', "combination": 'Rahu/Ketu in Libra-Aries axis', "stronger_houses": '1st-7th or 5th-11th', "general_impact": 'Marriage/fertility stress, BP imbalance', "nature_theme": 'Relationship karma, marital lineage imbalance, reproductive/hormonal disturbance', "severity": 'Medium-High', },
    {"sign": 'Libra', "combination": 'Afflicted Venus', "stronger_houses": '5th, 8th, 12th', "general_impact": 'Hormonal, reproductive, urinary issues', "nature_theme": 'Relationship karma, marital lineage imbalance, reproductive/hormonal disturbance', "severity": 'Medium-High', },
    {"sign": 'Libra', "combination": 'Saturn + Rahu', "stronger_houses": '1st, 8th, 9th', "general_impact": 'Chronic relationship burden, kidney/lower back issues', "nature_theme": 'Relationship karma, marital lineage imbalance, reproductive/hormonal disturbance', "severity": 'Very High', },
    {"sign": 'Scorpio', "combination": 'Sun + Rahu', "stronger_houses": '8th, 9th, 12th', "general_impact": 'Hidden illness, surgery, reproductive issues', "nature_theme": 'Hidden ancestral karma, trauma, genetic disease, chronic health patterns', "severity": 'High', },
    {"sign": 'Scorpio', "combination": 'Sun + Ketu', "stronger_houses": '8th, 12th', "general_impact": 'Sudden vitality loss, secret disease patterns', "nature_theme": 'Hidden ancestral karma, trauma, genetic disease, chronic health patterns', "severity": 'Medium-High', },
    {"sign": 'Scorpio', "combination": 'Rahu/Ketu in Taurus-Scorpio axis', "stronger_houses": '2nd-8th', "general_impact": 'Genetic disease, family trauma, sudden health events', "nature_theme": 'Hidden ancestral karma, trauma, genetic disease, chronic health patterns', "severity": 'Very High', },
    {"sign": 'Scorpio', "combination": 'Afflicted Mars', "stronger_houses": '8th, 9th, 12th', "general_impact": 'Blood disorders, surgery, inflammation', "nature_theme": 'Hidden ancestral karma, trauma, genetic disease, chronic health patterns', "severity": 'Medium-High', },
    {"sign": 'Scorpio', "combination": 'Saturn + Ketu', "stronger_houses": '8th, 12th', "general_impact": 'Chronic pain, psychological heaviness, sexual health weakness', "nature_theme": 'Hidden ancestral karma, trauma, genetic disease, chronic health patterns', "severity": 'High', },
    {"sign": 'Sagittarius', "combination": 'Sun + Rahu', "stronger_houses": '5th, 8th, 9th', "general_impact": 'Liver, hips, father-line karma, belief stress', "nature_theme": 'Dharma, guru, father, ancestral belief system, moral conflict', "severity": 'High', },
    {"sign": 'Sagittarius', "combination": 'Sun + Ketu', "stronger_houses": '5th, 9th, 12th', "general_impact": 'Spiritual detachment, lower back, fatigue', "nature_theme": 'Dharma, guru, father, ancestral belief system, moral conflict', "severity": 'Medium-High', },
    {"sign": 'Sagittarius', "combination": 'Rahu/Ketu in Gemini-Sagittarius axis', "stronger_houses": '3rd-9th', "general_impact": 'Dharma conflict, father-sibling karma', "nature_theme": 'Dharma, guru, father, ancestral belief system, moral conflict', "severity": 'High', },
    {"sign": 'Sagittarius', "combination": 'Afflicted Jupiter', "stronger_houses": '5th, 8th, 9th', "general_impact": 'Liver, obesity, diabetes, fertility', "nature_theme": 'Dharma, guru, father, ancestral belief system, moral conflict', "severity": 'Medium-High', },
    {"sign": 'Sagittarius', "combination": 'Saturn + Rahu', "stronger_houses": '9th, 12th', "general_impact": 'Heavy dharma burden, chronic hip/thigh issues', "nature_theme": 'Dharma, guru, father, ancestral belief system, moral conflict', "severity": 'Very High', },
    {"sign": 'Capricorn', "combination": 'Sun + Rahu', "stronger_houses": '8th, 9th, 10th, 12th', "general_impact": 'Bones, joints, fatigue, career stress', "nature_theme": 'Heavy Saturnian ancestral karma, duty, burden, father/work pressure', "severity": 'High', },
    {"sign": 'Capricorn', "combination": 'Sun + Ketu', "stronger_houses": '8th, 10th, 12th', "general_impact": 'Low vitality, isolation, chronic weakness', "nature_theme": 'Heavy Saturnian ancestral karma, duty, burden, father/work pressure', "severity": 'Medium-High', },
    {"sign": 'Capricorn', "combination": 'Saturn + Rahu', "stronger_houses": '1st, 8th, 9th, 10th', "general_impact": 'Severe karmic burden, chronic disease', "nature_theme": 'Heavy Saturnian ancestral karma, duty, burden, father/work pressure', "severity": 'Very High', },
    {"sign": 'Capricorn', "combination": 'Rahu/Ketu in Cancer-Capricorn axis', "stronger_houses": '4th-10th', "general_impact": 'Home-career ancestral conflict', "nature_theme": 'Heavy Saturnian ancestral karma, duty, burden, father/work pressure', "severity": 'Medium', },
    {"sign": 'Capricorn', "combination": 'Afflicted 9th lord in Capricorn', "stronger_houses": '6th, 8th, 12th', "general_impact": 'Delayed recovery, duty-bound suffering', "nature_theme": 'Heavy Saturnian ancestral karma, duty, burden, father/work pressure', "severity": 'High', },
    {"sign": 'Aquarius', "combination": 'Sun + Rahu', "stronger_houses": '8th, 9th, 11th, 12th', "general_impact": 'Circulation, nerves, anxiety, social alienation', "nature_theme": 'Collective karma, social isolation, unfulfilled ancestral ambitions', "severity": 'High', },
    {"sign": 'Aquarius', "combination": 'Sun + Ketu', "stronger_houses": '8th, 11th, 12th', "general_impact": 'Detachment, weak circulation, fatigue', "nature_theme": 'Collective karma, social isolation, unfulfilled ancestral ambitions', "severity": 'Medium-High', },
    {"sign": 'Aquarius', "combination": 'Saturn + Rahu', "stronger_houses": '1st, 8th, 9th, 12th', "general_impact": 'Chronic neurological or circulatory weakness', "nature_theme": 'Collective karma, social isolation, unfulfilled ancestral ambitions', "severity": 'Very High', },
    {"sign": 'Aquarius', "combination": 'Afflicted Jupiter', "stronger_houses": '5th, 8th, 9th', "general_impact": 'Poor judgment, metabolic imbalance', "nature_theme": 'Collective karma, social isolation, unfulfilled ancestral ambitions', "severity": 'Medium-High', },
    {"sign": 'Pisces', "combination": 'Sun + Rahu', "stronger_houses": '8th, 9th, 12th', "general_impact": 'Sleep disorder, liver, immune weakness, confusion', "nature_theme": 'Moksha-related ancestral karma, sleep, isolation, spiritual confusion', "severity": 'High', },
    {"sign": 'Pisces', "combination": 'Sun + Ketu', "stronger_houses": '8th, 9th, 12th', "general_impact": 'Spiritual exhaustion, fatigue, hidden disease', "nature_theme": 'Moksha-related ancestral karma, sleep, isolation, spiritual confusion', "severity": 'Medium-High', },
    {"sign": 'Pisces', "combination": 'Afflicted Jupiter', "stronger_houses": '5th, 8th, 9th, 12th', "general_impact": 'Liver, diabetes, fertility, obesity', "nature_theme": 'Moksha-related ancestral karma, sleep, isolation, spiritual confusion', "severity": 'Medium-High', },
    {"sign": 'Pisces', "combination": 'Rahu/Ketu in Virgo-Pisces axis', "stronger_houses": '6th-12th', "general_impact": 'Disease-hospitalization karma', "nature_theme": 'Moksha-related ancestral karma, sleep, isolation, spiritual confusion', "severity": 'High', },
    {"sign": 'Pisces', "combination": 'Saturn + Ketu', "stronger_houses": '8th, 12th', "general_impact": 'Depression, isolation, chronic weakness', "nature_theme": 'Moksha-related ancestral karma, sleep, isolation, spiritual confusion', "severity": 'High', },
]

HOUSE_WISE: list[HouseWiseRow] = [
    {"house": '1st House', "combination": 'Sun + Rahu in 1st', "specific_impact": 'Weak vitality, BP, ego stress, inherited father-line karma', "health_focus": 'Head, immunity, body constitution, mental stability', "severity": 'High', },
    {"house": '1st House', "combination": 'Sun + Ketu in 1st', "specific_impact": 'Fatigue, weak immunity, low confidence', "health_focus": 'Head, immunity, body constitution, mental stability', "severity": 'Medium-High', },
    {"house": '1st House', "combination": 'Saturn + Rahu in 1st', "specific_impact": 'Chronic illness, anxiety, weak constitution', "health_focus": 'Head, immunity, body constitution, mental stability', "severity": 'Very High', },
    {"house": '1st House', "combination": 'Rahu/Ketu on 1st-7th axis', "specific_impact": 'Body and relationship karma', "health_focus": 'Head, immunity, body constitution, mental stability', "severity": 'Medium-High', },
    {"house": '1st House', "combination": 'Afflicted 9th lord in 1st', "specific_impact": 'Ancestor karma directly affects body', "health_focus": 'Head, immunity, body constitution, mental stability', "severity": 'High', },
    {"house": '2nd House', "combination": 'Rahu in 2nd', "specific_impact": 'Food toxicity, addiction, family speech karma', "health_focus": 'Teeth, throat, thyroid, food habits, diabetes tendency', "severity": 'Medium-High', },
    {"house": '2nd House', "combination": 'Ketu in 2nd', "specific_impact": 'Poor nourishment, family detachment', "health_focus": 'Teeth, throat, thyroid, food habits, diabetes tendency', "severity": 'Medium-High', },
    {"house": '2nd House', "combination": 'Saturn in 2nd', "specific_impact": 'Teeth, throat, chronic speech/family stress', "health_focus": 'Teeth, throat, thyroid, food habits, diabetes tendency', "severity": 'Medium-High', },
    {"house": '2nd House', "combination": '2nd lord in 8th afflicted', "specific_impact": 'Genetic disease tendency', "health_focus": 'Teeth, throat, thyroid, food habits, diabetes tendency', "severity": 'Very High', },
    {"house": '2nd House', "combination": 'Sun/Rahu influence on 2nd', "specific_impact": 'Paternal family-line disturbance', "health_focus": 'Teeth, throat, thyroid, food habits, diabetes tendency', "severity": 'Medium to High', },
    {"house": '3rd House', "combination": 'Rahu/Ketu in 3rd-9th axis', "specific_impact": 'Sibling-father karmic conflict', "health_focus": 'Nervous system, shoulders, arms, lungs, courage', "severity": 'High', },
    {"house": '3rd House', "combination": 'Sun + Rahu in 3rd', "specific_impact": 'Nervous aggression, respiratory stress', "health_focus": 'Nervous system, shoulders, arms, lungs, courage', "severity": 'High', },
    {"house": '3rd House', "combination": 'Saturn + Rahu in 3rd', "specific_impact": 'Shoulder, arms, chronic anxiety', "health_focus": 'Nervous system, shoulders, arms, lungs, courage', "severity": 'Very High', },
    {"house": '3rd House', "combination": '9th lord afflicted from 3rd', "specific_impact": 'Dharma conflict, lack of paternal guidance', "health_focus": 'Nervous system, shoulders, arms, lungs, courage', "severity": 'Medium', },
    {"house": '4th House', "combination": 'Moon + Rahu in 4th', "specific_impact": 'Emotional anxiety, chest pressure', "health_focus": 'Heart, chest, lungs, emotional security', "severity": 'Medium-High', },
    {"house": '4th House', "combination": 'Moon + Ketu in 4th', "specific_impact": 'Depression, emotional detachment', "health_focus": 'Heart, chest, lungs, emotional security', "severity": 'Medium-High', },
    {"house": '4th House', "combination": 'Rahu/Ketu in 4th-10th axis', "specific_impact": 'Home-career ancestral disturbance', "health_focus": 'Heart, chest, lungs, emotional security', "severity": 'Medium', },
    {"house": '4th House', "combination": 'Sun afflicted in 4th', "specific_impact": 'Heart and father-home karma', "health_focus": 'Heart, chest, lungs, emotional security', "severity": 'Medium', },
    {"house": '4th House', "combination": 'Saturn in 4th', "specific_impact": 'Emotional heaviness, lung/chest weakness', "health_focus": 'Heart, chest, lungs, emotional security', "severity": 'Medium', },
    {"house": '5th House', "combination": 'Rahu in 5th', "specific_impact": 'Anxiety, hormonal issues, child-related worry', "health_focus": 'Fertility, stomach, liver, digestion, children’s health', "severity": 'High', },
    {"house": '5th House', "combination": 'Ketu in 5th', "specific_impact": 'Fertility delay, emotional detachment from children', "health_focus": 'Fertility, stomach, liver, digestion, children’s health', "severity": 'High', },
    {"house": '5th House', "combination": 'Sun + Rahu in 5th', "specific_impact": 'Paternal purva punya disturbance', "health_focus": 'Fertility, stomach, liver, digestion, children’s health', "severity": 'High', },
    {"house": '5th House', "combination": 'Saturn in 5th', "specific_impact": 'Delayed childbirth, chronic digestion', "health_focus": 'Fertility, stomach, liver, digestion, children’s health', "severity": 'High', },
    {"house": '5th House', "combination": 'Rahu/Ketu in 5th-11th axis', "specific_impact": 'Child-social karma, gains vs lineage conflict', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium-High', },
    {"house": '5th House', "combination": '5th lord in 8th/12th afflicted', "specific_impact": 'Reproductive and karmic health concerns', "health_focus": 'Fertility, stomach, liver, digestion, children’s health', "severity": 'High', },
    {"house": '6th House', "combination": '9th lord in 6th', "specific_impact": 'Ancestral karma manifesting as disease', "health_focus": 'Disease, immunity, infections, litigation-stress health issues', "severity": 'High', },
    {"house": '6th House', "combination": 'Sun afflicted in 6th', "specific_impact": 'Immunity, inflammation, father-line disease', "health_focus": 'Disease, immunity, infections, litigation-stress health issues', "severity": 'High', },
    {"house": '6th House', "combination": 'Rahu in 6th', "specific_impact": 'Strange illness, toxins, infections', "health_focus": 'Disease, immunity, infections, litigation-stress health issues', "severity": 'High', },
    {"house": '6th House', "combination": 'Ketu in 6th', "specific_impact": 'Difficult diagnosis, sudden relapse/recovery', "health_focus": 'Disease, immunity, infections, litigation-stress health issues', "severity": 'High', },
    {"house": '6th House', "combination": 'Saturn + Rahu in 6th', "specific_impact": 'Chronic disease pattern', "health_focus": 'Disease, immunity, infections, litigation-stress health issues', "severity": 'Very High', },
    {"house": '7th House', "combination": 'Rahu/Ketu in 1st-7th axis', "specific_impact": 'Body-marriage karma', "health_focus": 'Reproductive health, sexual health, relationship-induced stress', "severity": 'Medium-High', },
    {"house": '7th House', "combination": 'Sun + Rahu in 7th', "specific_impact": 'Relationship stress affecting vitality', "health_focus": 'Reproductive health, sexual health, relationship-induced stress', "severity": 'High', },
    {"house": '7th House', "combination": 'Saturn + Ketu in 7th', "specific_impact": 'Sexual/reproductive detachment', "health_focus": 'Reproductive health, sexual health, relationship-induced stress', "severity": 'High', },
    {"house": '7th House', "combination": 'Venus afflicted in 7th', "specific_impact": 'Hormonal and reproductive imbalance', "health_focus": 'Reproductive health, sexual health, relationship-induced stress', "severity": 'Medium', },
    {"house": '7th House', "combination": '9th lord afflicted in 7th', "specific_impact": 'Spouse/family karma connected with ancestors', "health_focus": 'Reproductive health, sexual health, relationship-induced stress', "severity": 'Medium', },
    {"house": '8th House', "combination": 'Sun + Rahu in 8th', "specific_impact": 'Strong paternal ancestral dosha', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'High', },
    {"house": '8th House', "combination": 'Sun + Ketu in 8th', "specific_impact": 'Hidden disease, sudden vitality loss', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'High', },
    {"house": '8th House', "combination": 'Rahu in 8th', "specific_impact": 'Chronic mysterious illness', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'Very High', },
    {"house": '8th House', "combination": 'Saturn + Rahu in 8th', "specific_impact": 'Very heavy chronic karmic disease', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'Very High', },
    {"house": '8th House', "combination": '9th lord in 8th afflicted', "specific_impact": 'Genetic or hidden ancestral disease', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'High', },
    {"house": '8th House', "combination": '5th lord in 8th afflicted', "specific_impact": 'Fertility and hereditary complications', "health_focus": 'Chronic illness, genetic disease, surgery, sudden diagnosis', "severity": 'High', },
    {"house": '9th House', "combination": 'Rahu in 9th', "specific_impact": 'Strong Pitru Dosha indication', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'High', },
    {"house": '9th House', "combination": 'Ketu in 9th', "specific_impact": 'Weak ancestral blessings', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'Medium-High', },
    {"house": '9th House', "combination": 'Sun + Rahu in 9th', "specific_impact": 'Father-line disturbance', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'High', },
    {"house": '9th House', "combination": 'Sun + Saturn in 9th', "specific_impact": 'Paternal burden, chronic fatigue', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'High', },
    {"house": '9th House', "combination": '9th lord afflicted', "specific_impact": 'Weak ancestral protection', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'High', },
    {"house": '9th House', "combination": 'Gulika/Mandi in 9th', "specific_impact": 'Heavy karmic ancestral suffering', "health_focus": 'Hips, liver, thighs, father’s health, fortune in recovery', "severity": 'High', },
    {"house": '10th House', "combination": 'Rahu/Ketu in 4th-10th axis', "specific_impact": 'Home-career ancestral karma', "health_focus": 'Spine, knees, career stress, BP, burnout', "severity": 'Medium', },
    {"house": '10th House', "combination": 'Sun + Saturn in 10th', "specific_impact": 'Career burden, father-authority karma', "health_focus": 'Spine, knees, career stress, BP, burnout', "severity": 'High', },
    {"house": '10th House', "combination": 'Sun + Rahu in 10th', "specific_impact": 'Public/career stress affecting heart', "health_focus": 'Spine, knees, career stress, BP, burnout', "severity": 'High', },
    {"house": '10th House', "combination": 'Saturn + Rahu in 10th', "specific_impact": 'Work pressure, chronic fatigue', "health_focus": 'Spine, knees, career stress, BP, burnout', "severity": 'High', },
    {"house": '10th House', "combination": '9th lord afflicted in 10th', "specific_impact": 'Dharma-career conflict affecting health', "health_focus": 'Spine, knees, career stress, BP, burnout', "severity": 'Medium', },
    {"house": '11th House', "combination": 'Rahu/Ketu in 5th-11th axis', "specific_impact": 'Child-social karma, gains vs lineage conflict', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium-High', },
    {"house": '11th House', "combination": 'Rahu in 11th', "specific_impact": 'Obsession with gains, hormonal stress', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium', },
    {"house": '11th House', "combination": 'Ketu in 11th', "specific_impact": 'Detachment from social support', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium', },
    {"house": '11th House', "combination": '5th lord afflicted from 11th', "specific_impact": 'Children and fertility stress', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium', },
    {"house": '11th House', "combination": 'Saturn in 11th with nodal influence', "specific_impact": 'Chronic social/family burden', "health_focus": 'Hormonal balance, circulation, stress from social expectations', "severity": 'Medium', },
    {"house": '12th House', "combination": 'Sun + Rahu in 12th', "specific_impact": 'Sleep disorder, hidden anxiety, hospitalization', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'High', },
    {"house": '12th House', "combination": 'Sun + Ketu in 12th', "specific_impact": 'Isolation, weak vitality', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'Medium-High', },
    {"house": '12th House', "combination": 'Rahu in 12th', "specific_impact": 'Addiction, insomnia, foreign/hospital karma', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'High', },
    {"house": '12th House', "combination": 'Ketu in 12th', "specific_impact": 'Spiritual exhaustion, energy loss', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'High', },
    {"house": '12th House', "combination": '9th lord in 12th afflicted', "specific_impact": 'Ancestral blessing loss, medical expenses', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'High', },
    {"house": '12th House', "combination": 'Saturn + Ketu in 12th', "specific_impact": 'Chronic isolation, depression, hospitalization', "health_focus": 'Sleep, hospitalization, hidden illness, mental exhaustion', "severity": 'High', },
]


def sign_lookup(sign: str, combination: str) -> SignWiseRow | None:
    for row in SIGN_WISE:
        if row['sign'] == sign and row['combination'] == combination:
            return row
    return None


def find_sign_row(
    combination: str, signs: list[str]
) -> tuple[SignWiseRow | None, str | None]:
    for sign in signs:
        row = sign_lookup(sign, combination)
        if row:
            return row, sign
    return None, None


def house_lookup(house_label: str, combination: str) -> HouseWiseRow | None:
    for row in HOUSE_WISE:
        if row['house'] == house_label and row['combination'] == combination:
            return row
    return None


def combinations_for_sign(sign: str) -> list[str]:
    return [r['combination'] for r in SIGN_WISE if r['sign'] == sign]