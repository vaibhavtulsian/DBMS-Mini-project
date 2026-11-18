const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wholesale_db';

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

async function generateSeedData() {
  console.log('================================================================');
  console.log('🌱 Generating Comprehensive Seed Data (PRD Section 14)');
  console.log('================================================================');

  const defaultPasswordHash = await bcrypt.hash('Retailer@12345', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Brands (6 Brands)
  const brands = [
    { name: 'Apple', country: 'United States' },
    { name: 'Samsung', country: 'South Korea' },
    { name: 'Google', country: 'United States' },
    { name: 'OnePlus', country: 'China' },
    { name: 'Xiaomi', country: 'China' },
    { name: 'Motorola', country: 'United States' },
  ];

  // 2. Warehouses (5 Warehouses in 5 Regions)
  const warehouses = [
    { name: 'North Central Hub', city: 'New Delhi', region: 'North', capacity: 25000 },
    { name: 'South Mega Warehouse', city: 'Bengaluru', region: 'South', capacity: 35000 },
    { name: 'West Coastal Hub', city: 'Mumbai', region: 'West', capacity: 30000 },
    { name: 'East Commercial Depot', city: 'Kolkata', region: 'East', capacity: 20000 },
    { name: 'Central Transit Logistics', city: 'Nagpur', region: 'Central', capacity: 18000 },
  ];

  // 3. Retailers (22 Retailers across regions)
  const retailersData = [
    { name: 'Apex Mobile World', person: 'Rajesh Sharma', city: 'New Delhi', region: 'North', gstin: '07AAAAA0000A1Z5', phone: '+91 98110 12345', limit: 2500000 },
    { name: 'Metro Electronics & Gadgets', person: 'Sunil Verma', city: 'Chandigarh', region: 'North', gstin: '04BBBBA1111B1Z6', phone: '+91 98140 23456', limit: 1800000 },
    { name: 'Jaipur Smart Devices', person: 'Amit Meena', city: 'Jaipur', region: 'North', gstin: '08CCCCA2222C1Z7', phone: '+91 94140 34567', limit: 1500000 },
    { name: 'Lucknow Digital Plaza', person: 'Vikas Tiwari', city: 'Lucknow', region: 'North', gstin: '09DDDDA3333D1Z8', phone: '+91 94500 45678', limit: 1200000 },
    { name: 'Bengaluru Phone Mart', person: 'Karthik Rao', city: 'Bengaluru', region: 'South', gstin: '29EEEEE4444E1Z9', phone: '+91 98450 56789', limit: 3000000 },
    { name: 'Chennai Tech Retailers', person: 'Suresh Kumar', city: 'Chennai', region: 'South', gstin: '33FFFFF5555F1Z0', phone: '+91 98400 67890', limit: 2800000 },
    { name: 'Hyderabad Mobile Zone', person: 'Venkat Reddy', city: 'Hyderabad', region: 'South', gstin: '36GGGGG6666G1Z1', phone: '+91 98490 78901', limit: 2600000 },
    { name: 'Cochin Cellular Hub', person: 'Mathew Thomas', city: 'Kochi', region: 'South', gstin: '32HHHHH7777H1Z2', phone: '+91 98470 89012', limit: 1400000 },
    { name: 'Mumbai Telecom Express', person: 'Prashant Patel', city: 'Mumbai', region: 'West', gstin: '27IIIII8888I1Z3', phone: '+91 98200 90123', limit: 3500000 },
    { name: 'Pune Smart Gallery', person: 'Nitin Deshmukh', city: 'Pune', region: 'West', gstin: '27JJJJJ9999J1Z4', phone: '+91 98220 01234', limit: 2000000 },
    { name: 'Ahmedabad Mobile Palace', person: 'Jigar Shah', city: 'Ahmedabad', region: 'West', gstin: '24KKKKK0000K1Z5', phone: '+91 98250 12345', limit: 2200000 },
    { name: 'Surat Gadget Bazaar', person: 'Bhavin Mehta', city: 'Surat', region: 'West', gstin: '24LLLLL1111L1Z6', phone: '+91 98240 23456', limit: 1600000 },
    { name: 'Kolkata Phone Enterprise', person: 'Debashis Roy', city: 'Kolkata', region: 'East', gstin: '19MMMMM2222M1Z7', phone: '+91 98300 34567', limit: 2400000 },
    { name: 'Bhubaneswar Digital Store', person: 'Alok Mohanty', city: 'Bhubaneswar', region: 'East', gstin: '21NNNNN3333N1Z8', phone: '+91 94370 45678', limit: 1300000 },
    { name: 'Patna Mobile Junction', person: 'Ravi Ranjan', city: 'Patna', region: 'East', gstin: '10OOOOO4444O1Z9', phone: '+91 94310 56789', limit: 1500000 },
    { name: 'Guwahati Tech Horizon', person: 'Bikram Das', city: 'Guwahati', region: 'East', gstin: '18PPPPP5555P1Z0', phone: '+91 94350 67890', limit: 1100000 },
    { name: 'Indore Cellular Center', person: 'Gaurav Jain', city: 'Indore', region: 'Central', gstin: '23QQQQQ6666Q1Z1', phone: '+91 98260 78901', limit: 1900000 },
    { name: 'Bhopal Gadget Point', person: 'Mohit Saxena', city: 'Bhopal', region: 'Central', gstin: '23RRRRR7777R1Z2', phone: '+91 94250 89012', limit: 1400000 },
    { name: 'Nagpur Mobile Connect', person: 'Sanjay Joshi', city: 'Nagpur', region: 'Central', gstin: '27SSSSS8888S1Z3', phone: '+91 98230 90123', limit: 1700000 },
    { name: 'Raipur Telecom House', person: 'Anand Agrawal', city: 'Raipur', region: 'Central', gstin: '22TTTTT9999T1Z4', phone: '+91 98270 01234', limit: 1200000 },
    { name: 'Varanasi Smart Point', person: 'Pankaj Gupta', city: 'Varanasi', region: 'North', gstin: '09UUUUU0000U1Z5', phone: '+91 94150 12345', limit: 1000000 },
    { name: 'Coimbatore Mobile Hub', person: 'Dinesh Balan', city: 'Coimbatore', region: 'South', gstin: '33VVVVV1111V1Z6', phone: '+91 98420 23456', limit: 1600000 },
  ];

  // 4. Products (32 Products)
  const productsData = [
    // Apple
    { brand: 'Apple', model: 'iPhone 15 Pro Max', year: 2023, desc: 'Flagship Apple smartphone with Titanium frame, A17 Pro 3nm chip, and periscope 5x zoom lens.' },
    { brand: 'Apple', model: 'iPhone 15 Pro', year: 2023, desc: 'Compact pro flagship with A17 Pro chip, customizable Action button, and 48MP main sensor.' },
    { brand: 'Apple', model: 'iPhone 15', year: 2023, desc: 'Mainstream iPhone featuring Dynamic Island, 48MP main camera, and USB-C port.' },
    { brand: 'Apple', model: 'iPhone 14', year: 2022, desc: 'High-reliability iPhone with A15 Bionic chip, durable Ceramic Shield, and all-day battery.' },
    { brand: 'Apple', model: 'iPhone 13', year: 2021, desc: 'Best-selling value iPhone with Cinematic mode video and efficient battery architecture.' },
    { brand: 'Apple', model: 'iPhone SE (3rd Gen)', year: 2022, desc: 'Compact budget iPhone with A15 Bionic 5G processor and traditional Touch ID ergonomics.' },

    // Samsung
    { brand: 'Samsung', model: 'Galaxy S24 Ultra', year: 2024, desc: 'Premium AI powerhouse with Snapdragon 8 Gen 3, titanium armor, integrated S-Pen, and vapor chamber cooling.' },
    { brand: 'Samsung', model: 'Galaxy S24 Plus', year: 2024, desc: 'QHD+ Dynamic AMOLED 2X display with enhanced thermal management and 4900mAh battery.' },
    { brand: 'Samsung', model: 'Galaxy S24', year: 2024, desc: 'Compact flagship with Galaxy AI capabilities, 120Hz LTPO screen, and versatile triple camera.' },
    { brand: 'Samsung', model: 'Galaxy S23 FE', year: 2023, desc: 'Fan Edition smartphone with pro-grade camera, aluminum frame, and vibrant display.' },
    { brand: 'Samsung', model: 'Galaxy Z Fold 5', year: 2023, desc: 'Foldable tablet-phone hybrid with zero-gap hinge, multitasking multi-window interface, and S-Pen support.' },
    { brand: 'Samsung', model: 'Galaxy Z Flip 5', year: 2023, desc: 'Pocketable folding smartphone with large Flex Window cover screen and dual video sensors.' },
    { brand: 'Samsung', model: 'Galaxy A55 5G', year: 2024, desc: 'Upper mid-range device with metal frame, Gorilla Glass Victus+, and 5000mAh battery.' },
    { brand: 'Samsung', model: 'Galaxy A35 5G', year: 2024, desc: 'Reliable wholesale volume mover with Super AMOLED 120Hz display and IP67 water resistance.' },

    // Google
    { brand: 'Google', model: 'Pixel 8 Pro', year: 2023, desc: 'Computational photography leader with Tensor G3 chip, temperature sensor, and telephoto optical zoom.' },
    { brand: 'Google', model: 'Pixel 8', year: 2023, desc: 'Compact flagship with Google AI magic eraser, Best Take, and bright Actua display.' },
    { brand: 'Google', model: 'Pixel 7a', year: 2023, desc: 'Mid-range photography king with Tensor G2, 64MP camera, and 90Hz smooth display.' },
    { brand: 'Google', model: 'Pixel 8a', year: 2024, desc: 'Accessible Google AI phone with Tensor G3 processor, 7 years of OS updates, and matte finish.' },

    // OnePlus
    { brand: 'OnePlus', model: 'OnePlus 12', year: 2024, desc: 'Extreme performance phone with Snapdragon 8 Gen 3, dual vapor chamber cooling, and 100W SuperVOOC fast charging.' },
    { brand: 'OnePlus', model: 'OnePlus 12R', year: 2024, desc: 'Performance flagship featuring massive 5500mAh battery, 120Hz ProXDR display, and gaming optimization.' },
    { brand: 'OnePlus', model: 'OnePlus Open', year: 2023, desc: 'Lightweight folding phone with Hasselblad camera system and Open Canvas multitasking.' },
    { brand: 'OnePlus', model: 'OnePlus Nord 4', year: 2024, desc: 'All-metal unibody 5G smartphone with Snapdragon 7+ Gen 3 and exceptional thermal efficiency.' },
    { brand: 'OnePlus', model: 'OnePlus Nord CE4', year: 2024, desc: 'High-volume value device with 100W charging, 5500mAh cell, and expandable storage.' },

    // Xiaomi
    { brand: 'Xiaomi', model: 'Xiaomi 14 Ultra', year: 2024, desc: 'Professional imaging device with Leica quad camera system, 1-inch sensor, stepless aperture, and liquid cooling.' },
    { brand: 'Xiaomi', model: 'Xiaomi 14', year: 2024, desc: 'Compact powerhouse with Leica optics, Snapdragon 8 Gen 3, and ultra-narrow display bezels.' },
    { brand: 'Xiaomi', model: 'Redmi Note 13 Pro+ 5G', year: 2024, desc: 'Mid-range champion with 200MP OIS camera, curved AMOLED display, and 120W HyperCharge.' },
    { brand: 'Xiaomi', model: 'Redmi Note 13 Pro 5G', year: 2024, desc: 'Sharp 1.5K AMOLED display, Snapdragon 7s Gen 2, and balanced battery life for mass retail.' },
    { brand: 'Xiaomi', model: 'Redmi 13C 5G', year: 2023, desc: 'Affordable wholesale volume king with 5G connectivity, 90Hz display, and 50MP AI camera.' },

    // Motorola
    { brand: 'Motorola', model: 'Edge 50 Ultra', year: 2024, desc: 'Artisanal flagship with real wood and vegan leather backs, Snapdragon 8s Gen 3, and Pantone validated cameras.' },
    { brand: 'Motorola', model: 'Edge 50 Pro', year: 2024, desc: 'Sleek premium device with 125W TurboPower charging, 144Hz curved pOLED screen, and AI photo enhancement.' },
    { brand: 'Motorola', model: 'Razr 50 Ultra', year: 2024, desc: 'Modern flip smartphone with full-screen 4.0-inch cover display and dual 50MP cameras.' },
    { brand: 'Motorola', model: 'Moto G84 5G', year: 2023, desc: 'Budget retail bestseller with 120Hz pOLED screen, Dolby Atmos stereo speakers, and 256GB storage.' },
  ];

  // 5. Spec sheets generator
  const specDetails = [
    {
      display: '6.7-inch Super Retina XDR OLED, 2796x1290 pixels, 120Hz ProMotion, 2000 nits peak outdoor brightness, Ceramic Shield.',
      camera: 'Triple array: 48MP main with second-gen sensor-shift OIS, 12MP 5x telephoto periscope zoom, 12MP ultra-wide with macro autofocus, 4K60 ProRes LOG video recording.',
      chipset: 'Apple A17 Pro (3nm), 6-core CPU with 2 performance and 4 efficiency cores, 6-core GPU with hardware-accelerated ray tracing, 16-core Neural Engine.',
      battery: '4422mAh lithium-ion battery, 29 hours video playback, 50% charge in 30 minutes with 20W+ adapter, 15W MagSafe wireless.',
      thermal: 'Titanium substructure with internal aluminum diffusion frame engineered for heat dissipation during sustained gaming and video recording.',
      text: 'The iPhone 15 Pro Max represents the pinnacle of Apple hardware engineering for wholesale buyers. Built with an aerospace-grade titanium frame and an internal aluminum thermal dissipation matrix, it prevents thermal throttling during 4K ProRes LOG capture. The 48MP quad-pixel sensor and dedicated 5x telephoto lens deliver class-leading computational photography. Supported by 120Hz ProMotion OLED screen and A17 Pro silicon, this flagship delivers sustained high frame rates and superior battery endurance across enterprise and demanding retail usage.'
    },
    {
      display: '6.1-inch Super Retina XDR OLED, 2556x1179 pixels, 120Hz ProMotion, Always-On display, Dynamic Island, 2000 nits brightness.',
      camera: '48MP main sensor with sensor-shift OIS, 12MP 3x telephoto optical zoom, 12MP ultra-wide, 4K Cinematic video mode at 24fps and 30fps.',
      chipset: 'Apple A17 Pro (3nm), 6-core CPU, 6-core GPU with dedicated ray-tracing hardware, USB 3 controller supporting 10Gbps data transfer.',
      battery: '3274mAh battery providing up to 23 hours video playback, 50% recharge in 30 minutes via USB-C PD, MagSafe wireless.',
      thermal: 'Compact aluminum chassis heat spreader designed to distribute thermal load evenly across the rear glass enclosure.',
      text: 'Apple iPhone 15 Pro offers flagship power in a manageable 6.1-inch form factor. With aerospace titanium construction and advanced heat distribution, the device handles sustained GPU loads with minimal frame drops. The pro camera module features 48MP resolution and 3x optical magnification. Ideal for retail customers seeking compact pro performance without compromising on screen brightness or computational video capabilities.'
    },
    {
      display: '6.1-inch Super Retina XDR OLED, 2556x1179 pixels, 60Hz, Dynamic Island, HDR10, Dolby Vision, 2000 nits peak brightness.',
      camera: 'Dual setup: 48MP main camera with 2x optical quality telephoto crop, 12MP ultra-wide, 4K Dolby Vision HDR video up to 60fps.',
      chipset: 'Apple A16 Bionic (4nm), 6-core CPU with 2 performance cores and 4 efficiency cores, 5-core GPU, 16-core Neural Engine.',
      battery: '3349mAh capacity, all-day 20-hour video battery endurance, USB-C universal charging interface.',
      thermal: 'Passive thermal cooling architecture optimized for cool operation during daily social streaming, GPS navigation, and video calls.',
      text: 'The standard iPhone 15 brings high-end features to the mainstream wholesale market. Featuring the Dynamic Island and an upgraded 48MP camera system, it captures stunning high-resolution photos with 2x lossless zoom. The A16 Bionic delivers smooth operation while maintaining low thermal profiles. High durability and strong retail resale value make this a primary volume driver for distributor sales.'
    },
    {
      display: '6.1-inch Super Retina XDR OLED, 2532x1170 pixels, HDR10, Ceramic Shield front glass, 1200 nits peak brightness.',
      camera: 'Dual 12MP system with sensor-shift optical image stabilization, Photonic Engine, 4K Cinematic video recording.',
      chipset: 'Apple A15 Bionic with 5-core GPU, 6-core CPU, 16-core Neural Engine for fast on-device machine learning.',
      battery: '3279mAh cell, up to 20 hours video playback, fast charging compatible with 20W chargers.',
      thermal: 'Solid internal thermal dissipation layout keeping surface temperatures stable under continuous load.',
      text: 'iPhone 14 offers established reliability and exceptional battery efficiency for enterprise and commercial bulk buyers. Equipped with the proven A15 Bionic processor and dual 12MP Photonic camera array, it delivers crisp low-light imagery and smooth 4K video. Low return rates and consistent market demand make it a cornerstone of wholesale phone inventories.'
    },
    {
      display: '6.1-inch Super Retina XDR OLED, 2532x1170 pixels, True Tone, Wide color P3, 1200 nits peak HDR brightness.',
      camera: 'Dual 12MP wide and ultra-wide cameras, sensor-shift OIS, Night mode, Smart HDR 4, 4K Dolby Vision video recording.',
      chipset: 'Apple A15 Bionic (5nm), 4-core GPU, 6-core CPU delivering exceptional sustained throughput.',
      battery: '3227mAh battery with 19 hours video playback capability, wireless Qi and MagSafe charging.',
      thermal: 'Standard passive aluminum frame heat conduction with dependable thermal regulation.',
      text: 'The iPhone 13 remains a high-volume wholesale champion due to its competitive pricing and modern design. It pairs vibrant OLED visuals with reliable dual cameras and durable Ceramic Shield protection. Retailers benefit from fast stock turns and strong consumer brand loyalty across tier-1 and tier-2 mobile markets.'
    },
    {
      display: '4.7-inch Retina HD IPS LCD, 1334x750 pixels, True Tone, wide color display, physical Home button with Touch ID.',
      camera: '12MP wide camera, f/1.8 aperture, portrait mode with depth control, Smart HDR 4, 4K video up to 60fps.',
      chipset: 'Apple A15 Bionic processor, 5G wireless connectivity, 16-core Neural Engine.',
      battery: '2018mAh compact battery with fast charging support up to 50% in 30 minutes.',
      thermal: 'Efficient low-wattage operation with minimal heat generation across everyday communications.',
      text: 'iPhone SE 3rd Gen blends the pocketable, iconic Touch ID form factor with the blazing speed of Apple A15 Bionic silicon and 5G connectivity. Ideal for corporate fleets and budget-conscious retail consumers wanting genuine iOS security and camera quality in a compact, durable package.'
    },
    {
      display: '6.8-inch Dynamic AMOLED 2X, QHD+ 3120x1440, 1-120Hz LTPO, flat glass, Corning Gorilla Armor anti-reflective coating, 2600 nits.',
      camera: 'Quad system: 200MP main sensor with OIS, 50MP periscope 5x optical zoom, 10MP 3x telephoto, 12MP ultra-wide, 8K30 and 4K120 video capture.',
      chipset: 'Qualcomm Snapdragon 8 Gen 3 for Galaxy, Adreno 750 GPU, NPU designed for on-device Galaxy AI processing.',
      battery: '5000mAh long-lasting cell, 45W wired fast charging, 15W wireless charging, reverse wireless PowerShare.',
      thermal: 'Enlarged 1.9x vapor chamber cooling system with multi-layer graphite sheets ensuring cool gaming and continuous 4K video capture.',
      text: 'Samsung Galaxy S24 Ultra is the premier Android business and gaming flagship. Engineered with a titanium frame and an oversized vapor chamber nearly double the size of its predecessor, it dissipates heat effortlessly during intensive gaming and 8K video sessions. The 200MP camera and 5x optical periscope capture razor-sharp imagery, while Galaxy AI automates transcriptions and image generation. Retail demand is consistently high among high-ticket power users.'
    },
    {
      display: '6.7-inch Dynamic AMOLED 2X, QHD+ 3120x1440 pixels, 1-120Hz adaptive refresh rate, 2600 nits peak brightness.',
      camera: 'Triple rear array: 50MP main with Dual Pixel AF and OIS, 10MP 3x telephoto, 12MP ultra-wide, Super HDR video.',
      chipset: 'Exynos 2400 / Snapdragon 8 Gen 3 with 12GB LPDDR5X RAM and advanced thermal throttling prevention.',
      battery: '4900mAh high-density battery supporting 45W fast wired charging and Fast Wireless Charging 2.0.',
      thermal: 'Substantial copper vapor chamber providing effective heat spread and low peak skin temperatures.',
      text: 'The Galaxy S24 Plus pairs a stunning QHD+ 120Hz AMOLED display with enhanced thermal engineering and a massive 4900mAh battery. Its 12GB base RAM and AI-driven imaging suite provide exceptional performance for demanding retail customers who want a large display without the bulk of the Ultra.'
    },
    {
      display: '6.2-inch Dynamic AMOLED 2X, FHD+ 2340x1080 pixels, 1-120Hz LTPO, 2600 nits peak brightness, Armor Aluminum frame.',
      camera: '50MP wide camera with OIS, 10MP telephoto with 3x optical zoom, 12MP ultra-wide, 8K video recording.',
      chipset: 'Exynos 2400 / Snapdragon 8 Gen 3 with high-efficiency multi-threaded processing.',
      battery: '4000mAh battery with 25W fast wired charging and wireless charging.',
      thermal: 'Integrated vapor chamber cooling designed into a slim, pocketable aluminum chassis.',
      text: 'The Galaxy S24 offers flagship processing, Galaxy AI integration, and bright 2600-nit display in an ergonomic 6.2-inch body. Its reinforced Armor Aluminum frame and vapor chamber cooling ensure sustained productivity and photography performance, making it a reliable wholesale stock item.'
    },
    {
      display: '6.4-inch Dynamic AMOLED 2X, FHD+, 120Hz adaptive refresh rate, HDR10+, Corning Gorilla Glass 5.',
      camera: '50MP main sensor with OIS, 8MP 3x telephoto camera, 12MP ultra-wide, 4K60 video recording.',
      chipset: 'Exynos 2200 / Snapdragon 8 Gen 1 processor with high-speed 8GB RAM.',
      battery: '4500mAh cell with 25W wired charging and 15W wireless charging.',
      thermal: 'Dedicated vapor chamber maintaining stable processor clock speeds during prolonged gaming sessions.',
      text: 'The Galaxy S23 Fan Edition delivers near-flagship camera capabilities, premium glass and aluminum design, and liquid cooling at an aggressive wholesale price point. The 50MP primary sensor and dedicated 3x telephoto make it very popular among business buyers seeking premium value.'
    },
    {
      display: 'Main: 7.6-inch Foldable Dynamic AMOLED 2X, 120Hz; Cover: 6.2-inch Dynamic AMOLED 2X, 120Hz.',
      camera: '50MP main with Dual Pixel AF and OIS, 10MP 3x telephoto, 12MP ultra-wide, under-display selfie camera.',
      chipset: 'Snapdragon 8 Gen 2 for Galaxy, 12GB RAM, optimized for multi-window multitasking.',
      battery: '4400mAh dual-cell battery with 25W fast wired charging.',
      thermal: 'Dual-chassis thermal dispersion system ensuring optimal heat mitigation across both folding halves.',
      text: 'Samsung Galaxy Z Fold 5 dominates the premium foldable enterprise segment. With zero-gap hinge mechanics, dual-display multitasking, and S-Pen compatibility, it turns mobile workflows into seamless productivity. Durable Armor Aluminum and IPX8 waterproofing provide peace of mind for wholesale buyers.'
    },
    {
      display: 'Main: 6.7-inch Foldable Dynamic AMOLED 2X, 120Hz; Flex Window: 3.4-inch Super AMOLED cover screen.',
      camera: 'Dual 12MP wide and ultra-wide cameras with FlexCam hands-free shooting and 4K60 video.',
      chipset: 'Snapdragon 8 Gen 2 for Galaxy with 8GB RAM and high power efficiency.',
      battery: '3700mAh dual battery system with 25W wired fast charge.',
      thermal: 'Slim internal graphite heat shields preventing hot spots during extended cover-screen video calls.',
      text: 'The Galaxy Z Flip 5 brings innovative clamshell portability and a full-size 3.4-inch Flex Window cover screen. Customers can reply to messages, snap selfies using the main 12MP sensors, and control multimedia without unfolding the device. High aesthetic appeal makes it a strong retail seller.'
    },
    {
      display: '6.6-inch Super AMOLED, FHD+ 2340x1080 pixels, 120Hz refresh rate, 1000 nits high brightness mode, Vision Booster.',
      camera: '50MP main with OIS, 12MP ultra-wide, 5MP macro, 4K video recording with VDIS digital stabilization.',
      chipset: 'Exynos 1480 (4nm) with AMD Xclipse 530 GPU, 8GB/12GB RAM.',
      battery: '5000mAh battery with 25W fast wired charging, 2-day battery life profile.',
      thermal: 'Expanded vapor chamber cooling providing superior thermal dissipation over previous generations.',
      text: 'Samsung Galaxy A55 5G bridges mid-range pricing with flagship build quality, boasting metallic side rails, Gorilla Glass Victus+, and an AMD-powered Exynos GPU. The integrated vapor chamber keeps temperatures low during extended gaming and streaming, driving massive wholesale order volume.'
    },
    {
      display: '6.6-inch Super AMOLED, FHD+ 2340x1080, 120Hz, Infinity-O display, 1000 nits peak brightness.',
      camera: '50MP main camera with OIS, 8MP ultra-wide, 5MP macro lens, 4K UHD recording.',
      chipset: 'Exynos 1380 (5nm), octa-core CPU, ARM Mali-G68 GPU, 6GB/8GB RAM.',
      battery: '5000mAh battery with 25W fast charging support and IP67 dust and water resistance.',
      thermal: 'Internal heat spreading sheets maintaining comfortable hand feel under sustained 5G streaming.',
      text: 'The Galaxy A35 5G is a wholesale staple offering premium Super AMOLED 120Hz visuals and reliable 50MP optical image stabilization at a volume-friendly wholesale cost. IP67 water resistance and 4 years of OS upgrades guarantee steady retail turnover.'
    },
    {
      display: '6.7-inch Super Actua LTPO OLED, 2992x1344 pixels, 1-120Hz, 2400 nits peak brightness, Gorilla Glass Victus 2.',
      camera: '50MP Octa PD main with OIS, 48MP Quad PD telephoto with 5x optical zoom and 30x Super Res Zoom, 48MP ultra-wide with Macro Focus.',
      chipset: 'Google Tensor G3 with Titan M2 security coprocessor, 12GB LPDDR5X RAM, machine learning acceleration.',
      battery: '5050mAh battery with 30W wired charging and 23W wireless fast charging.',
      thermal: 'Custom copper heat-pipe assembly designed to regulate Tensor G3 thermal output during multi-frame Night Sight rendering.',
      text: 'Google Pixel 8 Pro delivers world-class computational photography with unmatched photo and video magic features. Tensor G3 silicon handles on-device generative AI, Video Boost, and Audio Magic Eraser. Dedicated copper thermal channeling ensures sustained processing performance during intensive camera workflows.'
    },
    {
      display: '6.2-inch Actua OLED, 2400x1080 pixels, 60-120Hz refresh rate, 2000 nits peak brightness, Corning Gorilla Glass Victus.',
      camera: '50MP Octa PD wide camera with OIS, 12MP ultra-wide with auto-focus and macro mode, 4K60 video.',
      chipset: 'Google Tensor G3, 8GB LPDDR5X RAM, Google AI voice transcription and photo editing.',
      battery: '4575mAh battery with 27W fast charging, 24+ hour battery life, Extreme Battery Saver up to 72 hours.',
      thermal: 'Efficient internal graphite thermal layers keeping surface heat well-regulated.',
      text: 'The Pixel 8 packs Google AI leadership and the Tensor G3 chipset into an ultra-comfortable 6.2-inch form factor. With 7 years of promised software and security upgrades, it delivers tremendous long-term value for commercial clients and retail consumers alike.'
    },
    {
      display: '6.1-inch OLED, FHD+ 2400x1080 pixels, 90Hz Smooth Display, HDR, Corning Gorilla Glass 3.',
      camera: '64MP main camera with OIS and Super Res Zoom up to 8x, 13MP ultra-wide camera with 120-degree FOV.',
      chipset: 'Google Tensor G2 with Titan M2 security coprocessor, 8GB LPDDR5 RAM.',
      battery: '4385mAh battery with 18W wired charging and Qi wireless charging support.',
      thermal: 'Balanced thermal profile engineered for smooth day-to-day operation.',
      text: 'Pixel 7a delivers flagship-tier camera results at a mid-tier price point. Featuring Tensor G2, 64MP high-resolution sensor, and wireless charging, it represents an outstanding return on investment for wholesale inventory turnover.'
    },
    {
      display: '6.1-inch Actua OLED, 2400x1080 pixels, 120Hz refresh rate, 2000 nits peak brightness, matte composite back.',
      camera: '64MP Quad PD main camera with OIS, 13MP ultra-wide, Real Tone, Night Sight, Best Take, Magic Editor.',
      chipset: 'Google Tensor G3 processor, 8GB RAM, 7 years of OS and feature drops.',
      battery: '4492mAh battery, fast wired charging, Qi certified wireless charging.',
      thermal: 'Redesigned internal heat spreading architecture ensuring cool operational temps during prolonged video recording.',
      text: 'Google Pixel 8a democratizes cutting-edge Google AI photo features. With the powerful Tensor G3 engine, 120Hz Actua screen, and seven full years of updates, it provides unrivaled shelf life and strong commercial appeal for wholesale distributors.'
    },
    {
      display: '6.82-inch 2K ProXDR AMOLED, 3168x1440 pixels, 1-120Hz LTPO 3.0, 4500 nits peak brightness, 2160Hz PWM dimming.',
      camera: 'Hasselblad camera system: 50MP Sony LYT-808 main with OIS, 64MP 3x periscope telephoto, 48MP ultra-wide, 4K Dolby Vision video.',
      chipset: 'Qualcomm Snapdragon 8 Gen 3, up to 16GB LPDDR5X RAM, Trinity Engine CPU/GPU scheduling.',
      battery: '5400mAh dual-cell battery, 100W SuperVOOC wired charging (1-100% in 26 minutes), 50W AirVOOC wireless.',
      thermal: 'Dual Cryo-velocity VC cooling system featuring 9140mm² total vapor chamber area for extreme gaming thermal dissipation.',
      text: 'The OnePlus 12 is an absolute beast for mobile gamers and tech enthusiasts. Its massive 9140mm² dual-layer vapor chamber keeps the Snapdragon 8 Gen 3 frosty under 120fps gaming conditions without throttling. Paired with a stunning 4500-nit ProXDR 2K display, 100W fast charging, and 5400mAh battery, it commands fierce demand in retail distribution.'
    },
    {
      display: '6.78-inch 1.5K Oriental AMOLED, 2780x1264 pixels, 1-120Hz LTPO, 4500 nits peak brightness, Aqua Touch tech.',
      camera: '50MP Sony IMX890 with OIS, 8MP ultra-wide, 2MP macro, 4K60 video recording.',
      chipset: 'Snapdragon 8 Gen 2, up to 16GB LPDDR5X RAM, dedicated gaming graphics boost.',
      battery: '5500mAh massive battery, 100W SuperVOOC fast charging (1-100% in 27 minutes).',
      thermal: 'Advanced 9140mm² Cryo-Velocity vapor chamber providing desktop-grade thermal efficiency.',
      text: 'OnePlus 12R is the ultimate value-flagship powerhouse. Featuring the largest battery ever in a OnePlus device (5500mAh) and 100W ultra-fast charging, it pairs with the flagship Cryo-velocity cooling system to deliver marathon high-FPS gaming sessions without thermal slowdowns.'
    },
    {
      display: 'Main: 7.82-inch Flexi-fluid 2K AMOLED, 120Hz; Cover: 6.31-inch Super Fluid AMOLED, 120Hz, 2800 nits.',
      camera: 'Hasselblad 48MP Sony LYT-T808 Pixel Stacked main, 64MP 3x periscope telephoto, 48MP ultra-wide.',
      chipset: 'Snapdragon 8 Gen 2, 16GB LPDDR5X RAM, Open Canvas multi-app multitasking workspace.',
      battery: '4805mAh battery with 67W SuperVOOC flash charging.',
      thermal: 'Multi-directional thermal graphite architecture dissipating heat across both halves of the folding chassis.',
      text: 'OnePlus Open redefines foldable technology with a lightweight titanium-alloy hinge, virtually invisible crease, and Pixel Stacked camera optics. The revolutionary Open Canvas interface allows simultaneous multi-app execution without thermal lag, making it a prestigious wholesale flagship.'
    },
    {
      display: '6.74-inch 1.5K AMOLED, 2772x1240 pixels, 120Hz, 2150 nits peak brightness, Ultra HDR support.',
      camera: '50MP Sony LYT-600 main with OIS, 8MP ultra-wide 112-degree FOV, 4K60 video recording.',
      chipset: 'Qualcomm Snapdragon 7+ Gen 3 (4nm), 8GB/12GB LPDDR5X RAM, AI Eraser and AI Summary.',
      battery: '5500mAh battery with 100W SuperVOOC fast charging.',
      thermal: 'Precision-machined all-metal unibody with internal graphite-heatpipe hybrid thermal dispersion.',
      text: 'OnePlus Nord 4 delivers a rare, striking all-metal unibody housing modern 5G antennas. Driven by the Snapdragon 7+ Gen 3 processor, it offers near-flagship speeds, a massive 5500mAh battery, and 100W charging, quickly becoming a top seller across retail electronics stores.'
    },
    {
      display: '6.7-inch FHD+ AMOLED, 2412x1080 pixels, 120Hz refresh rate, Aqua Touch wet hand control.',
      camera: '50MP Sony LYT-600 with OIS, 8MP ultra-wide, RAW HDR photography algorithms.',
      chipset: 'Snapdragon 7 Gen 3 (4nm), 8GB LPDDR4X RAM, expandable RAM up to 16GB.',
      battery: '5500mAh capacity cell, 100W SuperVOOC charging, charge health preservation up to 4 years.',
      thermal: 'High-density graphite cooling structure keeping charging temperatures remarkably cool.',
      text: 'OnePlus Nord CE4 delivers 100W rapid charging and a 5500mAh battery at an accessible wholesale tier. With expandable storage up to 1TB and smooth 120Hz AMOLED viewing, it is an essential inventory item for high-turnover retailers.'
    },
    {
      display: '6.73-inch WQHD+ LTPO AMOLED, 3200x1440, 1-120Hz, 3000 nits peak brightness, Xiaomi Shield Glass, Dolby Vision.',
      camera: 'Quad 50MP Leica optics: 1-inch Sony LYT-900 main with stepless variable aperture f/1.63-f/4.0, 50MP 3.2x telephoto, 50MP 5x periscope, 50MP ultra-wide, 8K video.',
      chipset: 'Snapdragon 8 Gen 3, up to 16GB LPDDR5X RAM, UFS 4.0 storage, Xiaomi HyperOS.',
      battery: '5000mAh battery with 90W HyperCharge wired and 80W wireless fast charging.',
      thermal: 'Dual-channel IceLoop vapor-liquid separation cooling system keeping the 1-inch sensor and processor cool during continuous 8K filming.',
      text: 'Xiaomi 14 Ultra is the pinnacle of optical mobile imaging. Its mechanical stepless variable aperture and 1-inch Sony sensor combine with Leica color tuning for unmatched low-light and portrait clarity. The dual-channel IceLoop cooling system maintains high processing frame rates during extensive 8K video capture, representing a top-tier wholesale asset.'
    },
    {
      display: '6.36-inch 1.5K CrystalRes AMOLED, 2670x1200, 1-120Hz LTPO, 3000 nits peak brightness, ultra-thin 1.61mm bezels.',
      camera: 'Triple 50MP Leica cameras: 50MP Light Fusion 900 main with OIS, 50MP 3.2x floating telephoto with macro, 50MP ultra-wide.',
      chipset: 'Snapdragon 8 Gen 3, 12GB LPDDR5X RAM, Xiaomi HyperOS.',
      battery: '4610mAh battery with 90W wired HyperCharge (1-100% in 31 minutes) and 50W wireless.',
      thermal: 'Xiaomi IceLoop cooling technology delivering three times the thermal efficiency of traditional vapor chambers.',
      text: 'Xiaomi 14 combines compact dimensions with uncompromising flagship performance. Featuring a 6.36-inch display with razor-thin bezels and high-grade Leica Summilux lenses, it delivers superior photographic quality. The IceLoop cooling loop ensures optimal performance during gaming, driving strong wholesale demand.'
    },
    {
      display: '6.67-inch 1.5K 120Hz 3D curved CrystalRes AMOLED, 2712x1220 pixels, 1800 nits peak, Corning Gorilla Glass Victus.',
      camera: '200MP Samsung ISOCELL HP3 main with OIS and 4x lossless in-sensor zoom, 8MP ultra-wide, 2MP macro, 4K30 video.',
      chipset: 'MediaTek Dimensity 7200-Ultra (4nm), up to 12GB RAM, IP68 water and dust resistance.',
      battery: '5000mAh battery with 120W HyperCharge (100% in 19 minutes).',
      thermal: '4000mm² graphite sheets and heat dissipating silicone preventing heating during 120W charge cycles.',
      text: 'Redmi Note 13 Pro+ 5G represents the apex of the beloved Redmi Note series. It features a curved 1.5K AMOLED display, IP68 flagship waterproofing, 120W lightning-fast charging, and a 200MP camera with OIS. An indispensable volume generator for mobile distributors.'
    },
    {
      display: '6.67-inch 1.5K flat AMOLED, 2712x1220, 120Hz refresh rate, 1800 nits peak brightness, Dolby Vision.',
      camera: '200MP main camera with OIS and Super QPD autofocus, 8MP ultra-wide, 2MP macro.',
      chipset: 'Snapdragon 7s Gen 2 (4nm), 8GB/12GB RAM, dual stereo speakers with Dolby Atmos.',
      battery: '5100mAh battery with 67W turbo charging.',
      thermal: 'Graphene heat dissipation layer providing solid thermal balance during casual gaming and video.',
      text: 'Redmi Note 13 Pro 5G delivers sharp 200MP photography and an immersive 1.5K flat display with minimal bezels. Its dependable Snapdragon processor and 5100mAh battery offer consistent day-long endurance, establishing it as a top wholesale selection.'
    },
    {
      display: '6.74-inch HD+ 90Hz Dot Drop display, 1600x720 pixels, Corning Gorilla Glass protection.',
      camera: '50MP AI dual camera with HDR and Night mode, 1080p video recording.',
      chipset: 'MediaTek Dimensity 6100+ 5G processor (6nm), 4GB/6GB/8GB RAM.',
      battery: '5000mAh battery with 18W charging support.',
      thermal: 'Low-power processor architecture ensuring cool touch temperatures throughout daily tasks.',
      text: 'Redmi 13C 5G brings high-speed 5G connectivity to the entry-level price segment. Its 90Hz display, 50MP main camera, and durable build quality make it a rapid volume mover for bulk retail procurement across regional markets.'
    },
    {
      display: '6.7-inch Super HD 1.5K curved pOLED, 144Hz refresh rate, 2500 nits brightness, Pantone validated color accuracy.',
      camera: '50MP main with OIS, 64MP 3x telephoto periscope with 100x hybrid zoom, 50MP ultra-wide with macro, Pantone validated skin tones.',
      chipset: 'Snapdragon 8s Gen 3, up to 16GB LPDDR5X RAM, 1TB UFS 4.0 storage, Moto AI.',
      battery: '4500mAh battery with 125W TurboPower wired and 50W wireless charging.',
      thermal: 'Thermal management matrix using composite graphite layers to dissipate heat from the fast-charging battery.',
      text: 'Motorola Edge 50 Ultra combines real Nordic wood and vegan leather backs with top-of-the-line specs. Its 144Hz curved pOLED screen, Pantone validated camera optics, and 125W TurboPower charging create a distinguished, luxurious device that attracts discerning retail consumers.'
    },
    {
      display: '6.7-inch 1.5K curved pOLED, 144Hz, HDR10+, 2000 nits peak brightness, 100% DCI-P3 color gamut.',
      camera: '50MP main with f/1.4 aperture and OIS, 10MP 3x telephoto with OIS, 13MP ultra-wide with macro.',
      chipset: 'Snapdragon 7 Gen 3, 8GB/12GB RAM, Hello UI based on Android 14.',
      battery: '4500mAh cell with 125W TurboPower wired charging and 50W wireless charging.',
      thermal: 'Slim-profile heat transfer shield maintaining comfortable handling during fast charging sessions.',
      text: 'Motorola Edge 50 Pro introduces 125W hyper-charging and a flagship-grade 144Hz curved pOLED screen to the mid-premium wholesale market. With IP68 underwater protection and AI photo stabilization, it delivers outstanding value and strong sell-through.'
    },
    {
      display: 'Main: 6.9-inch Foldable LTPO pOLED, 165Hz, FHD+; Cover: 4.0-inch LTPO pOLED, 165Hz, 2400 nits.',
      camera: 'Dual 50MP rear system: 50MP main with OIS, 50MP 2x telephoto camera, Moto AI photo processing.',
      chipset: 'Snapdragon 8s Gen 3, 12GB LPDDR5X RAM, Moto AI personal assistant.',
      battery: '4000mAh battery with 45W TurboPower wired and 15W wireless charging.',
      thermal: 'Dual-part cooling distribution keeping the compact flip chassis cool while running dual 165Hz screens.',
      text: 'Motorola Razr 50 Ultra sets the industry benchmark for flip foldables with its massive 4.0-inch external cover screen and dual 165Hz LTPO pOLED displays. Powered by Snapdragon 8s Gen 3, it offers snappy multitasking and high-fashion aesthetics that drive high margin sales.'
    },
    {
      display: '6.55-inch FHD+ pOLED, 2400x1080 pixels, 120Hz refresh rate, 1300 nits peak, 10-bit billion color display.',
      camera: '50MP Ultra Pixel main with OIS, 8MP ultra-wide with macro, stereo speakers with Dolby Atmos.',
      chipset: 'Snapdragon 695 5G (6nm), 12GB RAM standard, 256GB storage standard.',
      battery: '5000mAh battery with 30W TurboPower charging.',
      thermal: 'Passive cooling layout optimized for everyday multitasking without thermal throttling.',
      text: 'Moto G84 5G is a wholesale bestseller combining 12GB RAM, 256GB storage, and a vibrant 120Hz pOLED screen at an unbeatable wholesale price. Its vegan leather design and Dolby Atmos sound make it an immediate favorite for budget-conscious retail store customers.'
    }
  ];

  // Helper arrays for SKU variations
  const ramOptions = [6, 8, 12, 16];
  const storageOptions = [128, 256, 512, 1024];
  const colors = ['Titanium Black', 'Phantom Silver', 'Alpine Blue', 'Emerald Green', 'Sunset Gold', 'Midnight Violet'];

  // Base prices per product in INR
  const baseWholesalePrices = [
    124000, 112000, 72000, 61000, 49000, 39000, // Apple
    118000, 88000, 74000, 48000, 134000, 84000, 36000, 27000, // Samsung
    94000, 68000, 41000, 46000, // Google
    58000, 38000, 129000, 31000, 22000, // OnePlus
    109000, 64000, 29000, 23000, 11500, // Xiaomi
    82000, 32000, 89000, 18500  // Motorola
  ];

  const client = await pool.connect();
  try {
    console.log('Clearing existing data and resetting sequences...');
    await client.query('TRUNCATE users, retailer, brand, product, sku, spec_sheet, review, warehouse, inventory, low_stock_alert, orders, order_item, payment, ledger_entry CASCADE;');

    // 1. Insert Users & Retailers
    console.log('Inserting Admin / Distributor user...');
    const adminUserRes = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'DISTRIBUTOR', TRUE) RETURNING user_id`,
      ['distributor@wholesale.com', adminPasswordHash]
    );
    const adminUserId = adminUserRes.rows[0].user_id;

    console.log(`Inserting ${retailersData.length} Retailer accounts and profiles...`);
    const retailerIds = [];
    for (let i = 0; i < retailersData.length; i++) {
      const r = retailersData[i];
      const email = `retailer${i + 1}@shop.com`;
      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, role, is_active)
         VALUES ($1, $2, 'RETAILER', TRUE) RETURNING user_id`,
        [email, defaultPasswordHash]
      );
      const uid = userRes.rows[0].user_id;

      const retRes = await client.query(
        `INSERT INTO retailer (user_id, business_name, contact_person, gstin, phone, city, region, credit_limit, outstanding_balance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.00) RETURNING retailer_id`,
        [uid, r.name, r.person, r.gstin, r.phone, r.city, r.region, r.limit]
      );
      retailerIds.push(retRes.rows[0].retailer_id);
    }

    // 2. Insert Brands
    console.log(`Inserting ${brands.length} Brands...`);
    const brandMap = {};
    for (const b of brands) {
      const bRes = await client.query(
        `INSERT INTO brand (brand_name, country_of_origin) VALUES ($1, $2) RETURNING brand_id`,
        [b.name, b.country]
      );
      brandMap[b.name] = bRes.rows[0].brand_id;
    }

    // 3. Insert Warehouses
    console.log(`Inserting ${warehouses.length} Warehouses...`);
    const warehouseIds = [];
    for (const w of warehouses) {
      const wRes = await client.query(
        `INSERT INTO warehouse (warehouse_name, city, region, capacity)
         VALUES ($1, $2, $3, $4) RETURNING warehouse_id`,
        [w.name, w.city, w.region, w.capacity]
      );
      warehouseIds.push(wRes.rows[0].warehouse_id);
    }

    // 4. Insert Products and Spec Sheets
    console.log(`Inserting ${productsData.length} Products and technical Spec Sheets...`);
    const productIds = [];
    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const spec = specDetails[i];
      const pRes = await client.query(
        `INSERT INTO product (brand_id, model_name, release_year, base_description)
         VALUES ($1, $2, $3, $4) RETURNING product_id`,
        [brandMap[p.brand], p.model, p.year, p.desc]
      );
      const pid = pRes.rows[0].product_id;
      productIds.push(pid);

      await client.query(
        `INSERT INTO spec_sheet (product_id, spec_text, display_specs, camera_specs, chipset_specs, battery_specs, thermal_specs)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [pid, spec.text, spec.display, spec.camera, spec.chipset, spec.battery, spec.thermal]
      );
    }

    // 5. Insert SKUs (3-4 variants per product => 100+ SKUs)
    console.log('Generating 100+ SKU variants...');
    const skuList = []; // { sku_id, price, product_id }
    let skuCounter = 1000;
    for (let pIdx = 0; pIdx < productIds.length; pIdx++) {
      const pid = productIds[pIdx];
      const p = productsData[pIdx];
      const basePrice = baseWholesalePrices[pIdx];

      // Define 3 to 4 realistic configurations per model
      const configs = [
        { ram: p.brand === 'Apple' ? 8 : (basePrice > 50000 ? 12 : 8), storage: basePrice > 70000 ? 256 : 128, color: colors[0], mult: 1.0 },
        { ram: p.brand === 'Apple' ? 8 : (basePrice > 50000 ? 12 : 8), storage: basePrice > 70000 ? 512 : 256, color: colors[1], mult: 1.12 },
        { ram: p.brand === 'Apple' ? 8 : (basePrice > 80000 ? 16 : 12), storage: basePrice > 70000 ? 512 : 256, color: colors[2], mult: 1.15 },
        { ram: p.brand === 'Apple' ? 8 : (basePrice > 80000 ? 16 : 12), storage: basePrice > 90000 ? 1024 : 512, color: colors[3], mult: 1.28 },
      ];

      for (const cfg of configs) {
        skuCounter++;
        const skuCode = `${p.brand.substring(0, 3).toUpperCase()}-${p.model.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${cfg.storage}G-${cfg.color.substring(0, 3).toUpperCase()}-${skuCounter}`;
        const wholesalePrice = Math.round(basePrice * cfg.mult);

        const skuRes = await client.query(
          `INSERT INTO sku (product_id, sku_code, ram_gb, storage_gb, color, wholesale_price, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING sku_id`,
          [pid, skuCode, cfg.ram, cfg.storage, cfg.color, wholesalePrice]
        );
        skuList.push({
          sku_id: skuRes.rows[0].sku_id,
          price: wholesalePrice,
          product_id: pid,
        });
      }
    }
    console.log(`✅ Created ${skuList.length} total SKUs across ${productIds.length} products.`);

    // 6. Populate Inventory across all 5 warehouses
    console.log('Populating inventory grid across 5 warehouses...');
    let lowStockCount = 0;
    for (const s of skuList) {
      for (let wIdx = 0; wIdx < warehouseIds.length; wIdx++) {
        const wid = warehouseIds[wIdx];
        const threshold = 15;
        // Intentionally create low stock for some SKUs to trigger alerts (PRD Section 8 & 14)
        const isLow = (s.sku_id + wid) % 11 === 0;
        const qty = isLow ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 80) + 25;
        if (isLow) lowStockCount++;

        await client.query(
          `INSERT INTO inventory (warehouse_id, sku_id, quantity_on_hand, reorder_threshold, last_restocked_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP - INTERVAL '10 days')`,
          [wid, s.sku_id, qty, threshold]
        );

        // If below threshold, create OPEN alert as expected by trigger/initial state
        if (qty <= threshold) {
          await client.query(
            `INSERT INTO low_stock_alert (warehouse_id, sku_id, threshold_value, current_quantity, status, created_at)
             VALUES ($1, $2, $3, $4, 'OPEN', CURRENT_TIMESTAMP - INTERVAL '2 days')`,
            [wid, s.sku_id, threshold, qty]
          );
        }
      }
    }
    console.log(`✅ Inventory populated. Generated ${lowStockCount} initial low-stock conditions.`);

    // 7. Generate 320+ Orders across the past 12 months with consistent payments and ledgers
    console.log('Generating 320+ historic and active orders over 12 months...');
    const orderStatuses = ['DELIVERED', 'DELIVERED', 'DELIVERED', 'SHIPPED', 'CONFIRMED', 'PLACED', 'CANCELLED'];
    const paymentMethods = ['BANK_TRANSFER', 'NEFT_RTGS', 'CHEQUE', 'UPI'];

    // Track running ledger balance per retailer
    const retailerBalances = {};
    retailerIds.forEach(id => { retailerBalances[id] = 0; });

    let orderCount = 0;
    const now = Date.now();

    for (let i = 0; i < 330; i++) {
      const rId = retailerIds[i % retailerIds.length];
      const status = orderStatuses[i % orderStatuses.length];
      const daysAgo = Math.floor(Math.random() * 340) + 1;
      const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const preferredWarehouse = warehouseIds[i % warehouseIds.length];

      // Pick 1 to 3 distinct SKUs
      const numLines = (i % 3) + 1;
      const chosenSkus = [];
      for (let l = 0; l < numLines; l++) {
        const skuCandidate = skuList[(i * 7 + l * 13) % skuList.length];
        if (!chosenSkus.some(cs => cs.sku_id === skuCandidate.sku_id)) {
          chosenSkus.push(skuCandidate);
        }
      }

      // Calculate order total
      let totalAmount = 0;
      const lineDetails = [];
      for (let l = 0; l < chosenSkus.length; l++) {
        const itemSku = chosenSkus[l];
        const qty = ((i + l) % 5 + 1) * 5; // 5, 10, 15, 20, 25 units
        const unitPrice = itemSku.price;
        const lineTotal = qty * unitPrice;
        totalAmount += lineTotal;
        lineDetails.push({
          line_no: l + 1,
          sku_id: itemSku.sku_id,
          warehouse_id: preferredWarehouse,
          quantity: qty,
          unit_price: unitPrice,
        });
      }

      // Payment status determination based on order status
      let paymentStatus = 'UNPAID';
      if (status === 'DELIVERED') {
        paymentStatus = (i % 10 === 0) ? 'PARTIALLY_PAID' : 'PAID';
      } else if (status === 'SHIPPED') {
        paymentStatus = (i % 3 === 0) ? 'PARTIALLY_PAID' : 'UNPAID';
      }

      // Insert Order Header
      const orderRes = await client.query(
        `INSERT INTO orders (retailer_id, order_date, status, total_amount, payment_status, shipping_warehouse_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING order_id`,
        [rId, orderDate, status, totalAmount, paymentStatus, preferredWarehouse, `Bulk order consignment #${i + 1}`]
      );
      const orderId = orderRes.rows[0].order_id;
      orderCount++;

      // Insert Order Lines
      for (const line of lineDetails) {
        await client.query(
          `INSERT INTO order_item (order_id, line_no, sku_id, warehouse_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, line.line_no, line.sku_id, line.warehouse_id, line.quantity, line.unit_price]
        );
      }

      // Append DEBIT ledger entry for placed orders (unless immediately cancelled)
      retailerBalances[rId] += totalAmount;
      await client.query(
        `INSERT INTO ledger_entry (retailer_id, entry_type, amount, balance_after, reference_type, reference_id, notes, entry_date)
         VALUES ($1, 'DEBIT', $2, $3, 'ORDER_PLACED', $4, $5, $6)`,
        [rId, totalAmount, retailerBalances[rId], orderId, `Debit for Order #${orderId}`, orderDate]
      );

      // Handle Cancelled order reversing ledger entry (PRD Section 5.4 & 8.2 Q3)
      if (status === 'CANCELLED') {
        const cancelDate = new Date(orderDate.getTime() + 1000 * 60 * 60 * 4); // 4 hours later
        retailerBalances[rId] = Math.max(0, retailerBalances[rId] - totalAmount);
        await client.query(
          `INSERT INTO ledger_entry (retailer_id, entry_type, amount, balance_after, reference_type, reference_id, notes, entry_date)
           VALUES ($1, 'CREDIT', $2, $3, 'ORDER_CANCELLED', $4, $5, $6)`,
          [rId, totalAmount, retailerBalances[rId], orderId, `Reversing credit for cancelled order #${orderId}`, cancelDate]
        );
      }

      // Handle Payments for Delivered or partially paid orders
      if (paymentStatus === 'PAID' || paymentStatus === 'PARTIALLY_PAID') {
        const paidAmount = paymentStatus === 'PAID' ? totalAmount : Math.round(totalAmount * 0.5);
        const payDate = new Date(orderDate.getTime() + 1000 * 60 * 60 * 24 * (Math.floor(Math.random() * 12) + 2)); // 2 to 14 days later
        const pMethod = paymentMethods[i % paymentMethods.length];
        const refNo = `TXN-${pMethod.substring(0, 3)}-${100000 + i}`;

        const payRes = await client.query(
          `INSERT INTO payment (retailer_id, order_id, amount, payment_method, reference_no, payment_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING payment_id`,
          [rId, orderId, paidAmount, pMethod, refNo, payDate, `Payment for invoice #${orderId}`]
        );
        const paymentId = payRes.rows[0].payment_id;

        retailerBalances[rId] = Math.max(0, retailerBalances[rId] - paidAmount);
        await client.query(
          `INSERT INTO ledger_entry (retailer_id, entry_type, amount, balance_after, reference_type, reference_id, notes, entry_date)
           VALUES ($1, 'CREDIT', $2, $3, 'PAYMENT_RECEIVED', $4, $5, $6)`,
          [rId, paidAmount, retailerBalances[rId], paymentId, `Credit payment for order #${orderId}`, payDate]
        );
      }
    }

    // Update final outstanding balances on retailer records
    for (const rId of retailerIds) {
      await client.query(
        `UPDATE retailer SET outstanding_balance = $1 WHERE retailer_id = $2`,
        [retailerBalances[rId], rId]
      );
    }
    console.log(`✅ Seeded ${orderCount} orders with associated order items, payments, and immutable ledger entries.`);

    // 8. Generate 80+ Realistic Retailer Reviews
    console.log('Generating 80+ realistic retailer product reviews...');
    const reviewTemplates = [
      { rating: 5, text: 'Exceptional thermal performance! Even after continuous high-resolution camera recordings and heavy benchmark testing, the device stays remarkably cool with zero thermal throttling. Retail customers praise its battery endurance.' },
      { rating: 5, text: 'Massive sales velocity in our tech store. Customers love the bright 120Hz display and razor-sharp camera autofocus. Return rate is practically zero.' },
      { rating: 4, text: 'Solid wholesale stock item. The battery easily lasts a full day under demanding usage. Fast charging is reliable, and build quality feels truly premium.' },
      { rating: 4, text: 'Great camera system, especially in low light night portrait mode. The chipset handles heavy background applications without stutter. Highly recommended for commercial buyers.' },
      { rating: 3, text: 'Decent performance and good screen colors, but device gets slightly warm during intense gaming sessions in humid regional climates. Wholesale margin is fair.' },
      { rating: 5, text: 'Superb vapor chamber cooling architecture! Gamers specifically ask for this model because frame rates stay locked at 120fps without drops. Fast stock turnover.' },
      { rating: 4, text: 'Reliable workhorse device. Water resistance and shatter protection have made this very popular among our enterprise logistics clients.' },
      { rating: 5, text: 'Class-leading telephoto zoom and video stabilization. Our retail customers who create social media content love the high-bitrate video capture and color fidelity.' },
      { rating: 2, text: 'Camera quality is acceptable, but battery drain during continuous 5G navigation is higher than expected. Slower inventory turnaround in our regional market.' },
      { rating: 4, text: 'Impressive build materials and clean software. Rapid 100W charging is a huge selling point on the retail counter. Will reorder in larger batch.' }
    ];

    let reviewCount = 0;
    const reviewedPairs = new Set();
    for (let rIdx = 0; rIdx < retailerIds.length; rIdx++) {
      const rId = retailerIds[rIdx];
      // Each retailer reviews 4-5 products they have ordered
      for (let pIdx = 0; pIdx < productIds.length; pIdx++) {
        if ((rIdx + pIdx) % 3 === 0) {
          const pId = productIds[pIdx];
          const key = `${rId}-${pId}`;
          if (!reviewedPairs.has(key)) {
            reviewedPairs.add(key);
            const template = reviewTemplates[(rIdx * 3 + pIdx) % reviewTemplates.length];
            await client.query(
              `INSERT INTO review (retailer_id, product_id, rating, review_text)
               VALUES ($1, $2, $3, $4)`,
              [rId, pId, template.rating, template.text]
            );
            reviewCount++;
          }
        }
      }
    }
    console.log(`✅ Seeded ${reviewCount} retailer product reviews.`);

    console.log('\n================================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Summary:');
    console.log(`- Brands: ${brands.length}`);
    console.log(`- Products: ${productIds.length}`);
    console.log(`- SKUs: ${skuList.length}`);
    console.log(`- Warehouses: ${warehouses.length}`);
    console.log(`- Retailers: ${retailersData.length}`);
    console.log(`- Orders: ${orderCount}`);
    console.log(`- Reviews: ${reviewCount}`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  generateSeedData();
}

module.exports = { generateSeedData };
