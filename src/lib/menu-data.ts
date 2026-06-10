export type MenuItem = {
  id: string;
  nameMr: string;
  nameEn?: string;
  category: string;
  half?: number;
  full: number;
};

export const DEFAULT_CATEGORIES: string[] = [
  "थाळी",
  "व्हेज डिशेस",
  "काजू पनीर डिशेस",
  "राईस",
  "चायनीज",
  "रोटी",
  "स्टार्टर",
  "तंदूर",
  "बिर्याणी",
  "मासे",
];

let _id = 0;
const mk = (
  nameMr: string,
  nameEn: string,
  category: string,
  full: number,
  half?: number,
): MenuItem => ({ id: `m${++_id}`, nameMr, nameEn, category, full, half });

export const DEFAULT_MENU: MenuItem[] = [
  mk("शाकाहारी थाळी", "Veg Thali", "थाळी", 180),
  mk("स्पेशल थाळी", "Special Thali", "थाळी", 250),
  mk("मांसाहारी थाळी", "Non-Veg Thali", "थाळी", 320),

  mk("पनीर मसाला", "Paneer Masala", "व्हेज डिशेस", 240, 150),
  mk("पनीर कोल्हापुरी", "Paneer Kolhapuri", "व्हेज डिशेस", 250),
  mk("व्हेज कोल्हापुरी", "Veg Kolhapuri", "व्हेज डिशेस", 220, 140),
  mk("मिक्स व्हेज", "Mix Veg", "व्हेज डिशेस", 210, 130),

  mk("काजू पनीर मसाला", "Kaju Paneer Masala", "काजू पनीर डिशेस", 320, 200),
  mk("काजू करी", "Kaju Curry", "काजू पनीर डिशेस", 300, 190),
  mk("पनीर बटर मसाला", "Paneer Butter Masala", "काजू पनीर डिशेस", 280, 180),

  mk("स्टीम राईस", "Steam Rice", "राईस", 140, 90),
  mk("जिरा राईस", "Jeera Rice", "राईस", 160, 100),
  mk("व्हेज पुलाव", "Veg Pulao", "राईस", 180, 120),

  mk("व्हेज मंचुरियन", "Veg Manchurian", "चायनीज", 180, 110),
  mk("हक्का नूडल्स", "Hakka Noodles", "चायनीज", 170, 100),
  mk("शेझवान राईस", "Schezwan Rice", "चायनीज", 190, 120),
  mk("चिकन चिल्ली", "Chicken Chilli", "चायनीज", 280, 170),

  mk("तंदुरी रोटी", "Tandoori Roti", "रोटी", 25),
  mk("बटर रोटी", "Butter Roti", "रोटी", 30),
  mk("नान", "Naan", "रोटी", 40),
  mk("बटर नान", "Butter Naan", "रोटी", 50),

  mk("पनीर टिक्का", "Paneer Tikka", "स्टार्टर", 260),
  mk("व्हेज क्रिस्पी", "Veg Crispy", "स्टार्टर", 180),
  mk("चिकन लॉलीपॉप", "Chicken Lollipop", "स्टार्टर", 280),

  mk("चिकन तंदुरी", "Chicken Tandoori", "तंदूर", 480),
  mk("तंदुरी पनीर टिक्का", "Tandoori Paneer Tikka", "तंदूर", 280),

  mk("चिकन बिर्याणी", "Chicken Biryani", "बिर्याणी", 280),
  mk("मटन बिर्याणी", "Mutton Biryani", "बिर्याणी", 360),
  mk("व्हेज बिर्याणी", "Veg Biryani", "बिर्याणी", 200),

  mk("चिकन हांडी", "Chicken Handi", "मासे", 550, 350),
  mk("फिश फ्राय", "Fish Fry", "मासे", 320),
  mk("सुरमई फ्राय", "Surmai Fry", "मासे", 420),
];
