# generate_master_data.py
import random
import json

# Define the brands and their models with their pricing tier class:
# 'flagship', 'high-end', 'mid-range', 'budget'
brand_models = {
    "Apple": [
        ("iPhone 16 Pro Max", "flagship", "16, 16 Pro"),
        ("iPhone 16 Pro", "flagship", "16, 16 Pro Max"),
        ("iPhone 16", "high-end", "16 Pro"),
        ("iPhone 15 Pro Max", "flagship", "15, 15 Pro"),
        ("iPhone 15 Pro", "flagship", "15, 15 Pro Max"),
        ("iPhone 15", "high-end", "15 Pro"),
        ("iPhone 14 Pro", "flagship", "14 Pro Max"),
        ("iPhone 14", "high-end", "14 Plus"),
        ("iPhone 13", "high-end", "13 Pro, 14"),
        ("iPhone 12", "mid-range", "12 Pro, 12 mini"),
        ("iPhone 11", "mid-range", "11 Pro"),
        ("iPhone XR", "mid-range", "XS, 11"),
        ("iPhone SE (2024)", "mid-range", "SE 2022")
    ],
    "Samsung": [
        ("S25 Ultra", "flagship", "S24 Ultra, S25+"),
        ("S25 Plus", "flagship", "S25, S24+"),
        ("S25", "high-end", "S25+"),
        ("S24 Ultra", "flagship", "S23 Ultra"),
        ("S24 Plus", "flagship", "S24"),
        ("S24", "high-end", "S24+"),
        ("S23 FE", "high-end", "A55, S23"),
        ("S23 Ultra", "flagship", "S22 Ultra"),
        ("S23", "high-end", "S23+"),
        ("S22", "high-end", "S22+"),
        ("A73", "high-end", "A54"),
        ("A55", "mid-range", "A35, A54"),
        ("A54", "mid-range", "A53"),
        ("A35", "mid-range", "A34"),
        ("A15", "budget", "A25"),
        ("A25", "mid-range", "A15"),
        ("M35", "mid-range", "M34, F54"),
        ("M33", "budget", "M34"),
        ("F54", "mid-range", "F34"),
        ("F34", "budget", "M33")
    ],
    "OnePlus": [
        ("OnePlus 12", "flagship", "12R, 11"),
        ("OnePlus 12R", "high-end", "11R, 12"),
        ("OnePlus 11R", "high-end", "10R, 11"),
        ("OnePlus 10R", "high-end", "9R"),
        ("Nord CE4", "mid-range", "Nord 4"),
        ("Nord CE3", "mid-range", "Nord CE4"),
        ("Nord 4", "mid-range", "Nord CE4"),
        ("Nord 2", "mid-range", "Nord CE2"),
        ("OnePlus 9 Pro", "high-end", "9, 10 Pro"),
        ("OnePlus Open", "flagship", "Oppo Find N3")
    ],
    "Xiaomi": [
        ("Xiaomi 14 Ultra", "flagship", "Xiaomi 14"),
        ("Xiaomi 14", "high-end", "13 Pro"),
        ("Xiaomi 13 Pro", "high-end", "12 Pro"),
        ("Redmi Note 13 Pro+", "high-end", "Redmi Note 13 Pro"),
        ("Redmi Note 13 Pro", "mid-range", "Redmi Note 12 Pro"),
        ("Redmi Note 12 Pro", "mid-range", "Redmi Note 11 Pro"),
        ("Xiaomi 11", "mid-range", "Xiaomi 11T"),
        ("Xiaomi 10", "mid-range", "Xiaomi 10T"),
        ("Poco X6 Pro", "mid-range", "Poco F6"),
        ("Poco F6", "high-end", "Poco X6 Pro"),
        ("Poco X4 Pro", "budget", "Poco X5")
    ],
    "Vivo": [
        ("Vivo X100 Pro", "flagship", "X100"),
        ("Vivo X100", "high-end", "X90"),
        ("Vivo X90", "high-end", "X80"),
        ("Vivo V40 Pro", "high-end", "V40, V30 Pro"),
        ("Vivo V40", "mid-range", "V30"),
        ("Vivo V30 Pro", "mid-range", "V30, V29 Pro"),
        ("Vivo V30", "mid-range", "V29"),
        ("Vivo V29", "mid-range", "V27"),
        ("Vivo V27", "mid-range", "V25"),
        ("Vivo V25", "mid-range", "Y100"),
        ("Vivo Y36", "budget", "Y28"),
        ("Vivo Y28", "budget", "Y22"),
        ("Vivo Y22", "budget", "Y16"),
        ("Vivo T3 Pro", "mid-range", "T3, iQOO Z9")
    ],
    "Oppo": [
        ("Oppo Reno 11 Pro", "high-end", "Reno 11, Reno 10 Pro"),
        ("Oppo Reno 11", "mid-range", "Reno 10"),
        ("Oppo Reno 10", "mid-range", "Reno 8"),
        ("Oppo Reno 8", "mid-range", "Reno 7"),
        ("Oppo F25 Pro", "mid-range", "F21 Pro"),
        ("Oppo F21 Pro", "mid-range", "F19 Pro"),
        ("Oppo A79", "budget", "A59"),
        ("Oppo A78", "budget", "A77"),
        ("Oppo A77", "budget", "A76"),
        ("Oppo A59", "budget", "A79")
    ],
    "Realme": [
        ("Realme 12 Pro+", "high-end", "12 Pro, 11 Pro+"),
        ("Realme 12 Pro", "mid-range", "12 Pro+, 11 Pro"),
        ("Realme 11 Pro", "mid-range", "10 Pro"),
        ("Realme 10 Pro", "mid-range", "9 Pro"),
        ("Realme 9 Pro", "budget", "8 Pro"),
        ("Narzo 70 Pro", "mid-range", "Narzo 70"),
        ("Narzo 70", "budget", "Narzo 60"),
        ("Narzo 50", "budget", "Narzo 30"),
        ("Realme C55", "budget", "C35, Narzo 50i"),
        ("Realme GT 6T", "high-end", "GT 6")
    ],
    "Google": [
        ("Pixel 9 Pro XL", "flagship", "9 Pro, 9"),
        ("Pixel 9 Pro", "flagship", "9 Pro XL, 9"),
        ("Pixel 9", "high-end", "9 Pro"),
        ("Pixel 8a", "mid-range", "8, 7a"),
        ("Pixel 8", "high-end", "7"),
        ("Pixel 7a", "mid-range", "7, 6a"),
        ("Pixel 7", "high-end", "6"),
        ("Pixel 6a", "mid-range", "6"),
        ("Pixel 6", "mid-range", "5"),
        ("Pixel 5", "budget", "4a")
    ],
    "Nothing": [
        ("Nothing Phone (3)", "high-end", "Phone (2)"),
        ("Nothing Phone (2)", "high-end", "Phone (1), Phone (2a)"),
        ("Nothing Phone (2a)", "mid-range", "Phone (2), CMF Phone 1"),
        ("Nothing Phone (1)", "mid-range", "Phone (2)"),
        ("CMF Phone 1", "budget", "CMF Phone 2"),
        ("CMF Phone 2", "budget", "CMF Phone 1")
    ],
    "Infinix": [
        ("Infinix Hot 40", "budget", "Hot 30i"),
        ("Infinix Note 40", "budget", "Note 30 5G"),
        ("Infinix Zero 40", "mid-range", "Zero 30"),
        ("Infinix Hot 30i", "budget", "Hot 20i"),
        ("Infinix Note 30 5G", "budget", "Note 12"),
        ("Infinix Zero 30", "mid-range", "Zero 20")
    ],
    "Tecno": [
        ("Tecno Spark 20 Pro", "budget", "Spark 10 Pro"),
        ("Tecno Pova 6 Pro", "budget", "Pova 5 Pro"),
        ("Tecno Camon 30", "budget", "Camon 20"),
        ("Tecno Spark 10 Pro", "budget", "Spark 9 Pro"),
        ("Tecno Pova 5 Pro", "budget", "Pova 4"),
        ("Tecno Camon 20", "budget", "Camon 19")
    ],
    "Motorola": [
        ("Motorola Edge 50", "high-end", "Edge 40"),
        ("Motorola Edge 40", "mid-range", "Edge 30"),
        ("Motorola G85", "mid-range", "G54, G84"),
        ("Motorola G84", "mid-range", "G54"),
        ("Motorola G54", "budget", "G42"),
        ("Motorola G24", "budget", "G22")
    ],
    "Lava": [
        ("Lava Agni 3", "mid-range", "Agni 2"),
        ("Lava Agni 2", "mid-range", "Agni 3"),
        ("Lava Blaze 3", "budget", "Blaze 2"),
        ("Lava Blaze 2", "budget", "Yuva 3"),
        ("Lava Yuva 3", "budget", "Yuva 2")
    ],
    "Micromax": [
        ("In Note 3", "budget", "In Note 2"),
        ("In Note 2", "budget", "In 2b"),
        ("In 2b", "budget", "In Note 1"),
        ("In Note 1", "budget", "In 1b"),
        ("Micromax In 4", "budget", "In Note 3")
    ],
    "Nokia": [
        ("Nokia G42 5G", "budget", "G42"),
        ("Nokia X30 5G", "mid-range", "X30"),
        ("Nokia G22", "budget", "G21"),
        ("Nokia G42", "budget", "G22"),
        ("Nokia X30", "mid-range", "X30 5G"),
        ("Nokia 5.4", "budget", "5.3")
    ],
    "iQOO": [
        ("iQOO 13 Pro", "flagship", "12 Pro"),
        ("iQOO 12 Pro", "flagship", "12"),
        ("iQOO 12", "high-end", "Z9"),
        ("iQOO Z9s Pro", "mid-range", "Z9"),
        ("iQOO Z9", "budget", "Z7")
    ],
    "Poco": [
        ("Poco X6", "mid-range", "X6 Pro"),
        ("Poco F6", "high-end", "F5 Pro")
    ],
    "Honor": [
        ("Honor 200", "high-end", "Honor 90"),
        ("Honor 90", "mid-range", "Honor 70")
    ]
}

# Repair issue types with their code and formulas:
# name, base parts price percentage relative to screen, labor rate percentage
issue_types = [
    ("Screen Replacement", 1.0, 1.0),
    ("Battery Replacement", 0.20, 0.50),
    ("Charging Port Repair", 0.10, 0.40),
    ("Camera Repair", 0.35, 0.80),
    ("Speaker / Mic Repair", 0.08, 0.40),
    ("Motherboard Repair", 0.50, 1.20)
]

# Base screen prices and labor rates by class
class_baselines = {
    "flagship": {"screen": 28000, "labor": 1800},
    "high-end": {"screen": 14500, "labor": 1000},
    "mid-range": {"screen": 7500, "labor": 600},
    "budget": {"screen": 3500, "labor": 400}
}

# Wholesale markets and contacts
wholesale_markets = [
    ("Telipura Market, Sitabuldi, Nagpur", "Nagpur Local Hub"),
    ("Modi No. 3, Sitabuldi, Nagpur", "Nagpur Local Hub"),
    ("Dharampeth Hub, Nagpur", "Dharampeth Hub"),
    ("Itwari Market, Nagpur", "Nagpur Local Hub"),
    ("Gaffar Market, Karol Bagh, Delhi", "Delhi Hub"),
    ("Manish Market, Fort, Mumbai", "Mumbai Hub"),
    ("SP Road, Halasuru, Bengaluru", "Bengaluru Hub"),
    ("Jagdish Market, Abids, Hyderabad", "Hyderabad Hub"),
    ("Ritchie Street, Mount Road, Chennai", "Chennai Hub"),
    ("Budhwar Peth, Pune", "Pune Hub"),
    ("Chandni Chowk, Kolkata", "Kolkata Hub")
]

# Generate rows
rows = []
for brand, models in brand_models.items():
    for model_name, cls, compatibles in models:
        base = class_baselines[cls]
        for issue_name, price_mult, labor_mult in issue_types:
            # Base Premium Price
            premium_price = int(base["screen"] * price_mult)
            # Add small random variation to make it look realistic and organic
            premium_price = int(premium_price * random.uniform(0.92, 1.08))
            # Round to nearest 50
            premium_price = (premium_price // 50) * 50
            if premium_price < 400:
                premium_price = 400
                
            premium_labor = int(base["labor"] * labor_mult)
            premium_labor = int(premium_labor * random.uniform(0.95, 1.05))
            premium_labor = (premium_labor // 50) * 50
            if premium_labor < 250:
                premium_labor = 250
                
            # Three tiers: Premium, Standard, Compatible
            tiers = [
                ("Premium", 1.0, "Superb OEM-equivalent component", "180 Days Direct Hub Warranty"),
                ("Standard", 0.58, "High-grade certified third-party component", "90 Days Local Warranty"),
                ("Compatible", 0.32, "Cost-effective functional component", "30 Days Basic Warranty")
            ]
            
            for tier_name, tier_mult, part_desc, warranty in tiers:
                price = int(premium_price * tier_mult)
                price = (price // 50) * 50
                if price < 250:
                    price = 250
                    
                # Standard and Compatible have lower labor rates slightly
                labor = int(premium_labor * (1.0 if tier_name == "Premium" else 0.85 if tier_name == "Standard" else 0.75))
                labor = (labor // 50) * 50
                if labor < 200:
                    labor = 200
                    
                wholesale_price = int(price * random.uniform(0.60, 0.70))
                wholesale_price = (wholesale_price // 50) * 50
                if wholesale_price < 150:
                    wholesale_price = 150
                    
                market, hub = random.choice(wholesale_markets)
                
                # Turnaround based on repair type
                turnaround = "1-2 Hours"
                if "Battery" in issue_name:
                    turnaround = "30-45 Mins"
                elif "Port" in issue_name or "Speaker" in issue_name:
                    turnaround = "30 Mins"
                elif "Motherboard" in issue_name:
                    turnaround = "24-48 Hours"
                
                part_label = f"{part_desc} for {model_name}"
                
                rows.append({
                    "brand": brand,
                    "model": model_name,
                    "issue_type": issue_name,
                    "part_name": f"[{tier_name}] {part_label}",
                    "tier": tier_name,
                    "price": price,
                    "labor": labor,
                    "compatible_models": compatibles,
                    "warranty": warranty,
                    "turnaround": turnaround,
                    "source_hub": hub,
                    "wholesale_price": wholesale_price,
                    "wholesale_source": market
                })

print(f"Generated {len(rows)} master records.")

# Write to insert_parts_pricing_pan_india.sql
sql_file_path = "/insert_parts_pricing_pan_india.sql"
with open(sql_file_path, "w") as f:
    f.write("""-- =========================================================================
--             MASTER PAN-INDIA DATABASE SEED: parts_pricing
-- =========================================================================
-- This script drops, expands, and populates the parts_pricing table
-- with premium, standard, and compatible tier metrics for all device types.
-- =========================================================================

-- Re-create the parts_pricing table with full relational schema
DROP TABLE IF EXISTS public.parts_pricing CASCADE;

CREATE TABLE public.parts_pricing (
    id SERIAL PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    part_name TEXT NOT NULL,
    tier TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    labor DECIMAL(10,2) NOT NULL,
    compatible_models TEXT,
    warranty TEXT,
    turnaround TEXT,
    source_hub TEXT,
    wholesale_price DECIMAL(10,2),
    wholesale_source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup permissive policies
ALTER TABLE public.parts_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select parts_pricing" ON public.parts_pricing;
CREATE POLICY "Allow public select parts_pricing" ON public.parts_pricing FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert parts_pricing" ON public.parts_pricing;
CREATE POLICY "Allow public insert parts_pricing" ON public.parts_pricing FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update parts_pricing" ON public.parts_pricing;
CREATE POLICY "Allow public update parts_pricing" ON public.parts_pricing FOR UPDATE USING (true) WITH CHECK (true);

-- Insert statement sequence
""")

    # Batch inserts to make them run quickly
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        f.write("INSERT INTO public.parts_pricing (brand, model, issue_type, part_name, tier, price, labor, compatible_models, warranty, turnaround, source_hub, wholesale_price, wholesale_source) VALUES\n")
        value_strings = []
        for r in batch:
            # Escape strings
            pname = r["part_name"].replace("'", "''")
            compatible = r["compatible_models"].replace("'", "''")
            warranty = r["warranty"].replace("'", "''")
            turnaround = r["turnaround"].replace("'", "''")
            hub = r["source_hub"].replace("'", "''")
            ws_source = r["wholesale_source"].replace("'", "''")
            
            val = f"('{r['brand']}', '{r['model']}', '{r['issue_type']}', '{pname}', '{r['tier']}', {r['price']:.2f}, {r['labor']:.2f}, '{compatible}', '{warranty}', '{turnaround}', '{hub}', {r['wholesale_price']:.2f}, '{ws_source}')"
            value_strings.append(val)
        
        f.write(",\n".join(value_strings))
        f.write("\nON CONFLICT DO NOTHING;\n\n")

print("SQL script generated successfully!")
