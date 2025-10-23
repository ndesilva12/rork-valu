import { Product } from '@/types';
import productsData from './products-data.json';

const productImageMap: Record<string, { image: string, description: string }> = {
  'Tesla': { image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800', description: 'Model 3 - Premium electric sedan with autopilot features' },
  'Apple': { image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800', description: 'iPhone 15 Pro - Latest smartphone with A17 Pro chip' },
  'Nike': { image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', description: 'Air Max 270 - Premium running shoes with superior comfort' },
  'Patagonia': { image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', description: 'Nano Puff Jacket - Lightweight insulated jacket made from recycled materials' },
  'Microsoft': { image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800', description: 'Surface Laptop 5 - Sleek and powerful laptop for professionals' },
  'Starbucks': { image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', description: 'Pike Place Roast - Smooth, balanced medium roast coffee' },
  'Adidas': { image: 'https://images.unsplash.com/photo-1542219550-37153d387c27?w=800', description: 'Ultraboost 22 - Running shoes with responsive cushioning' },
  'Coca-Cola': { image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800', description: 'Coca-Cola Classic - Original cola soft drink' },
  'Disney': { image: 'https://images.unsplash.com/photo-1576200499908-0d14c94e62c2?w=800', description: 'Disney+ Streaming - Access to exclusive shows and movies' },
  'Amazon': { image: 'https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800', description: 'Echo Dot - Smart speaker with Alexa voice assistant' },
  'Netflix': { image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800', description: 'Premium Subscription - 4K streaming on multiple devices' },
  'Target': { image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800', description: 'Home Essentials - Quality products for everyday living' },
  'Walmart': { image: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800', description: 'Grocery Essentials - Fresh produce and household items' },
  'Whole Foods': { image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', description: 'Organic Produce - Fresh, locally sourced fruits and vegetables' },
  'Ben & Jerry\'s': { image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=800', description: 'Half Baked Ice Cream - Cookie dough and brownie chunks in vanilla and chocolate' },
  'REI': { image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', description: 'Trail Running Backpack - Durable pack for outdoor adventures' },
  'Lululemon': { image: 'https://images.unsplash.com/photo-1522198648249-0657d7ff242a?w=800', description: 'Align Leggings - Buttery-soft yoga pants for maximum comfort' },
};

const itemImageMap: Record<string, string> = {
  'Tesla': 'https://logo.clearbit.com/tesla.com',
  'SpaceX': 'https://img.logo.dev/spacex.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'xAI': 'https://logo.clearbit.com/x.ai',
  'Neuralink': 'https://logo.clearbit.com/neuralink.com',
  'The Boring Company': 'https://logo.clearbit.com/boringcompany.com',
  'X': 'https://logo.clearbit.com/x.com',
  'Panasonic': 'https://logo.clearbit.com/panasonic.com',
  'Nvidia': 'https://logo.clearbit.com/nvidia.com',
  'TSMC': 'https://logo.clearbit.com/tsmc.com',
  'CATL': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
  'BYD': 'https://logo.clearbit.com/byd.com',
  'Ford': 'https://logo.clearbit.com/ford.com',
  'General Motors': 'https://logo.clearbit.com/gm.com',
  'Volkswagen': 'https://logo.clearbit.com/volkswagen.com',
  'Blue Origin': 'https://logo.clearbit.com/blueorigin.com',
  'Boeing': 'https://logo.clearbit.com/boeing.com',
  'OpenAI': 'https://logo.clearbit.com/openai.com',
  'Google': 'https://logo.clearbit.com/google.com',
  'Meta': 'https://logo.clearbit.com/meta.com',
  'Apple': 'https://logo.clearbit.com/apple.com',
  'Nike': 'https://logo.clearbit.com/nike.com',
  'SpringHill Company': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
  'Liverpool FC': 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400',
  'Blaze Pizza': 'https://logo.clearbit.com/blazepizza.com',
  'Beats by Dre': 'https://logo.clearbit.com/beatsbydre.com',
  'Coca-Cola': 'https://logo.clearbit.com/coca-cola.com',
  'Kia': 'https://logo.clearbit.com/kia.com',
  'Samsung': 'https://logo.clearbit.com/samsung.com',
  'Ladder': 'https://logo.clearbit.com/ladder.com',
  'Adidas': 'https://logo.clearbit.com/adidas.com',
  'Under Armour': 'https://logo.clearbit.com/underarmour.com',
  'Puma': 'https://logo.clearbit.com/puma.com',
  'Domino\'s': 'https://logo.clearbit.com/dominos.com',
  'Netflix': 'https://logo.clearbit.com/netflix.com',
  'Disney': 'https://logo.clearbit.com/disney.com',
  'Papa John\'s': 'https://logo.clearbit.com/papajohns.com',
  'Amazon': 'https://logo.clearbit.com/amazon.com',
  'New Balance': 'https://logo.clearbit.com/newbalance.com',
  'Manchester United': 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400',
  'Universal Music Group': 'https://logo.clearbit.com/universalmusic.com',
  'Live Nation': 'https://logo.clearbit.com/livenation.com',
  'Ticketmaster': 'https://logo.clearbit.com/ticketmaster.com',
  'AT&T': 'https://logo.clearbit.com/att.com',
  'Capital One': 'https://logo.clearbit.com/capitalone.com',
  'Target': 'https://logo.clearbit.com/target.com',
  'CoverGirl': 'https://logo.clearbit.com/covergirl.com',
  'Keds': 'https://logo.clearbit.com/keds.com',
  'Spotify': 'https://logo.clearbit.com/spotify.com',
  'HYBE': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'Sony Music': 'https://logo.clearbit.com/sonymusic.com',
  'Warner Music Group': 'https://logo.clearbit.com/wmg.com',
  'PepsiCo': 'https://logo.clearbit.com/pepsico.com',
  'Verizon': 'https://logo.clearbit.com/verizon.com',
  'JPMorgan Chase': 'https://logo.clearbit.com/jpmorganchase.com',
  'AEG Presents': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'Onnit': 'https://logo.clearbit.com/onnit.com',
  'Athletic Greens': 'https://logo.clearbit.com/athleticgreens.com',
  'Black Rifle Coffee Company': 'https://logo.clearbit.com/blackriflecoffee.com',
  'Manscaped': 'https://logo.clearbit.com/manscaped.com',
  'SimpliSafe': 'https://logo.clearbit.com/simplisafe.com',
  'Squarespace': 'https://logo.clearbit.com/squarespace.com',
  'ExpressVPN': 'https://logo.clearbit.com/expressvpn.com',
  'UFC': 'https://logo.clearbit.com/ufc.com',
  'Happy Dad Seltzer': 'https://images.unsplash.com/photo-1558642891-54c5e67c1b5a?w=400',
  'iHeartMedia': 'https://logo.clearbit.com/iheartmedia.com',
  'SiriusXM': 'https://logo.clearbit.com/siriusxm.com',
  'New York Times': 'https://logo.clearbit.com/nytimes.com',
  'Crooked Media': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'audiochuck': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
  'Trump Organization': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
  'Trump Media & Technology Group': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'Fox Corporation': 'https://logo.clearbit.com/fox.com',
  'Newsmax': 'https://logo.clearbit.com/newsmax.com',
  'ExxonMobil': 'https://logo.clearbit.com/exxonmobil.com',
  'Lockheed Martin': 'https://logo.clearbit.com/lockheedmartin.com',
  'Uber': 'https://logo.clearbit.com/uber.com',
  'Pfizer': 'https://logo.clearbit.com/pfizer.com',
  'MP Materials': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
  'Alphabet': 'https://logo.clearbit.com/abc.xyz',
  'Warner Bros. Discovery': 'https://logo.clearbit.com/wbd.com',
  'The New York Times Company': 'https://logo.clearbit.com/nytimes.com',
  'The Walt Disney Company': 'https://logo.clearbit.com/disney.com',
  'Starbucks': 'https://logo.clearbit.com/starbucks.com',
  'Huawei': 'https://logo.clearbit.com/huawei.com',
  'Costco Wholesale': 'https://logo.clearbit.com/costco.com',
  'Kaiser Permanente': 'https://logo.clearbit.com/kp.org',
  'Microsoft': 'https://logo.clearbit.com/microsoft.com',
  'Intel': 'https://logo.clearbit.com/intel.com',
  'CeraVe': 'https://logo.clearbit.com/cerave.com',
  'Patagonia': 'https://logo.clearbit.com/patagonia.com',
  'Ben & Jerry\'s': 'https://logo.clearbit.com/benjerry.com',
  'REI': 'https://logo.clearbit.com/rei.com',
  'Goya Foods': 'https://logo.clearbit.com/goya.com',
  'Robinhood': 'https://logo.clearbit.com/robinhood.com',
  'Palantir Technologies': 'https://logo.clearbit.com/palantir.com',
  'Meta Platforms': 'https://logo.clearbit.com/meta.com',
  'Wells Fargo': 'https://logo.clearbit.com/wellsfargo.com',
  'GEO Group': 'https://logo.clearbit.com/geogroup.com',
  'Airbnb': 'https://logo.clearbit.com/airbnb.com',
  'Coinbase': 'https://logo.clearbit.com/coinbase.com',
  'Whole Foods': 'https://logo.clearbit.com/wholefoodsmarket.com',
  'L.L. Bean': 'https://logo.clearbit.com/llbean.com',
  'Virgin Group': 'https://logo.clearbit.com/virgin.com',
  'Proton': 'https://logo.clearbit.com/proton.me',
  'BlackRock': 'https://logo.clearbit.com/blackrock.com',
  'Vanguard': 'https://logo.clearbit.com/vanguard.com',
  'Comcast': 'https://logo.clearbit.com/comcast.com',
  'General Electric': 'https://logo.clearbit.com/ge.com',
  'Walmart': 'https://logo.clearbit.com/walmart.com',
  'Hobby Lobby': 'https://logo.clearbit.com/hobbylobby.com',
  'Chick-fil-A': 'https://logo.clearbit.com/chick-fil-a.com',
  'MyPillow': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
  'Levi Strauss & Co.': 'https://logo.clearbit.com/levistrauss.com',
  'Anheuser-Busch': 'https://logo.clearbit.com/anheuser-busch.com',
  'Procter & Gamble': 'https://logo.clearbit.com/pg.com',
  'Lowe\'s': 'https://logo.clearbit.com/lowes.com',
  'Smith & Wesson': 'https://logo.clearbit.com/smith-wesson.com',
  'Sturm, Ruger & Co.': 'https://logo.clearbit.com/ruger.com',
  'Bass Pro Shops': 'https://logo.clearbit.com/basspro.com',
  'Cabela\'s': 'https://logo.clearbit.com/cabelas.com',
  'Daniel Defense': 'https://logo.clearbit.com/danieldefense.com',
  'Colt': 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400',
  'Vista Outdoor': 'https://logo.clearbit.com/vistaoutdoor.com',
  'Brownells': 'https://logo.clearbit.com/brownells.com',
  'Academy Sports + Outdoors': 'https://logo.clearbit.com/academy.com',
  'Dick\'s Sporting Goods': 'https://logo.clearbit.com/dickssportinggoods.com',
  'Kroger': 'https://logo.clearbit.com/kroger.com',
  'CVS Health': 'https://logo.clearbit.com/cvs.com',
  'Citigroup': 'https://logo.clearbit.com/citigroup.com',
  'Delta Air Lines': 'https://logo.clearbit.com/delta.com',
  'Bank of America': 'https://logo.clearbit.com/bankofamerica.com',
  'TOMS Shoes': 'https://logo.clearbit.com/toms.com',
  'NextEra Energy': 'https://logo.clearbit.com/nexteraenergy.com',
  'Ørsted': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'Vestas Wind Systems': 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400',
  'First Solar': 'https://logo.clearbit.com/firstsolar.com',
  'Enphase Energy': 'https://logo.clearbit.com/enphase.com',
  'Iberdrola': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'GE Vernova': 'https://logo.clearbit.com/ge.com',
  'Brookfield Renewable': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'Siemens Energy': 'https://logo.clearbit.com/siemens.com',
  'JinkoSolar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
  'Chevron': 'https://logo.clearbit.com/chevron.com',
  'Shell': 'https://logo.clearbit.com/shell.com',
  'Saudi Aramco': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'BP': 'https://logo.clearbit.com/bp.com',
  'TotalEnergies': 'https://logo.clearbit.com/totalenergies.com',
  'Gazprom': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Coal India': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Pemex': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Peabody Energy': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'RTX': 'https://logo.clearbit.com/rtx.com',
  'Northrop Grumman': 'https://logo.clearbit.com/northropgrumman.com',
  'General Dynamics': 'https://logo.clearbit.com/gd.com',
  'Archer Daniels Midland': 'https://logo.clearbit.com/adm.com',
  'Caterpillar': 'https://logo.clearbit.com/caterpillar.com',
  'UPS': 'https://logo.clearbit.com/ups.com',
  'FedEx': 'https://logo.clearbit.com/fedex.com',
  'Equal Exchange': 'https://logo.clearbit.com/equalexchange.coop',
  'Ocean Spray': 'https://logo.clearbit.com/oceanspray.com',
  'Land O\'Lakes': 'https://logo.clearbit.com/landolakes.com',
  'New Belgium Brewing': 'https://logo.clearbit.com/newbelgium.com',
  'King Arthur Baking Company': 'https://logo.clearbit.com/kingarthurbaking.com',
  'Seventh Generation': 'https://logo.clearbit.com/seventhgeneration.com',
  'In-N-Out Burger': 'https://logo.clearbit.com/in-n-out.com',
  'Tyson Foods': 'https://logo.clearbit.com/tysonfoods.com',
  'Forever 21': 'https://logo.clearbit.com/forever21.com',
  'Wendy\'s': 'https://logo.clearbit.com/wendys.com',
  'George Foreman Grills': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'Interstate Batteries': 'https://logo.clearbit.com/interstatebatteries.com',
  'Pure Flix': 'https://logo.clearbit.com/pureflix.com',
  'Dayspring': 'https://logo.clearbit.com/dayspring.com',
  'McDonald\'s': 'https://logo.clearbit.com/mcdonalds.com',
  'Huda Beauty': 'https://logo.clearbit.com/hudabeauty.com',
  'Wardah Cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'INIKA Organic': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'PHB Ethical Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'FARSÃLI': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'PaliRoots': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
  'Zaytoun': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  'Al\'Ard': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  'NestlÃ©': 'https://logo.clearbit.com/nestle.com',
  'Unilever': 'https://logo.clearbit.com/unilever.com',
  'Mars': 'https://logo.clearbit.com/mars.com',
  'Mondelez': 'https://logo.clearbit.com/mondelezinternational.com',
  'KFC': 'https://logo.clearbit.com/kfc.com',
  'EstÃ©e Lauder': 'https://logo.clearbit.com/esteelauder.com',
  'Veolia': 'https://logo.clearbit.com/veolia.com',
  'Supreme': 'https://logo.clearbit.com/supremenewyork.com',
  'G4S': 'https://logo.clearbit.com/g4s.com',
  'Orange S.A.': 'https://logo.clearbit.com/orange.com',
  'Ford Motor Company': 'https://logo.clearbit.com/ford.com',
  'Booking.com': 'https://logo.clearbit.com/booking.com',
  'Headspace': 'https://logo.clearbit.com/headspace.com',
  'PrAna': 'https://logo.clearbit.com/prana.com',
  'DharmaCrafts': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Buddha Groove': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Phat Buddha': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Bosatsu Brand': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Eileen Fisher': 'https://logo.clearbit.com/eileenfisher.com',
  'Toad&Co': 'https://logo.clearbit.com/toadandco.com',
  'Lotus Sky': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Arc\'teryx': 'https://logo.clearbit.com/arcteryx.com',
  'USAA': 'https://logo.clearbit.com/usaa.com',
  'The Home Depot': 'https://logo.clearbit.com/homedepot.com',
  'Purdue Pharma': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  'Johnson & Johnson': 'https://logo.clearbit.com/jnj.com',
  'Philip Morris International': 'https://logo.clearbit.com/pmi.com',
  'Monsanto': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
  'Dow Chemical': 'https://logo.clearbit.com/dow.com',
  'Halliburton': 'https://logo.clearbit.com/halliburton.com',
  'KBR': 'https://logo.clearbit.com/kbr.com',
  'Constellis (Academi)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'UnitedHealth Group': 'https://logo.clearbit.com/unitedhealthgroup.com',
  'Humana': 'https://logo.clearbit.com/humana.com',
  'BAE Systems': 'https://logo.clearbit.com/baesystems.com',
  'L3Harris': 'https://logo.clearbit.com/l3harris.com',
  'Huntington Ingalls Industries': 'https://logo.clearbit.com/huntingtoningalls.com',
  'Honeywell': 'https://logo.clearbit.com/honeywell.com',
  'Leidos': 'https://logo.clearbit.com/leidos.com',
  'Lush Cosmetics': 'https://logo.clearbit.com/lush.com',
  'Uniqlo': 'https://logo.clearbit.com/uniqlo.com',
  'The Body Shop': 'https://logo.clearbit.com/thebodyshop.com',
  'Everlane': 'https://logo.clearbit.com/everlane.com',
  'Peloton': 'https://logo.clearbit.com/onepeloton.com',
  'MasterClass': 'https://logo.clearbit.com/masterclass.com',
  'Duolingo': 'https://logo.clearbit.com/duolingo.com',
  'Etsy': 'https://logo.clearbit.com/etsy.com',
  'Betterment': 'https://logo.clearbit.com/betterment.com',
  'Upwork': 'https://logo.clearbit.com/upwork.com',
  'DoorDash': 'https://logo.clearbit.com/doordash.com',
  'DraftKings': 'https://logo.clearbit.com/draftkings.com',
  'PayPal (high-fee services)': 'https://logo.clearbit.com/paypal.com',
  'Juul Labs': 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=400',
  'Shein': 'https://logo.clearbit.com/shein.com',
  'Mondragon Corporation': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
  'Lululemon': 'https://logo.clearbit.com/lululemon.com',
  'Planet Fitness': 'https://logo.clearbit.com/planetfitness.com',
  'Fitbit': 'https://logo.clearbit.com/fitbit.com',
  'MyFitnessPal': 'https://logo.clearbit.com/myfitnesspal.com',
  'Gatorade': 'https://logo.clearbit.com/gatorade.com',
  'CrossFit': 'https://logo.clearbit.com/crossfit.com',
  'Hershey': 'https://logo.clearbit.com/hersheys.com',
  'Activision Blizzard': 'https://logo.clearbit.com/activisionblizzard.com',
  'Whole Foods Market': 'https://logo.clearbit.com/wholefoodsmarket.com',
  'Lululemon Athletica': 'https://logo.clearbit.com/lululemon.com',
  'Apple (mental health features)': 'https://logo.clearbit.com/apple.com',
  'Calm': 'https://logo.clearbit.com/calm.com',
  'Talkspace': 'https://logo.clearbit.com/talkspace.com',
  'BetterHelp': 'https://logo.clearbit.com/betterhelp.com',
  'ByteDance (TikTok)': 'https://logo.clearbit.com/tiktok.com',
  'Snapchat': 'https://logo.clearbit.com/snap.com',
  'Instagram': 'https://logo.clearbit.com/instagram.com',
  'Harley-Davidson': 'https://logo.clearbit.com/harley-davidson.com',
  'Mastercard': 'https://logo.clearbit.com/mastercard.com',
  'Rumble': 'https://logo.clearbit.com/rumble.com',
  'Substack': 'https://logo.clearbit.com/substack.com',
  'Telegram': 'https://logo.clearbit.com/telegram.org',
  'Signal': 'https://logo.clearbit.com/signal.org',
  'Brave': 'https://logo.clearbit.com/brave.com',
  'Gab': 'https://logo.clearbit.com/gab.com',
  'Odysee': 'https://logo.clearbit.com/odysee.com',
  'Truth Social': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
  'TikTok': 'https://logo.clearbit.com/tiktok.com',
  'Paramount Global': 'https://logo.clearbit.com/paramount.com',
  'DuckDuckGo': 'https://logo.clearbit.com/duckduckgo.com',
  'Mullvad': 'https://logo.clearbit.com/mullvad.net',
  'NordVPN': 'https://logo.clearbit.com/nordvpn.com',
  'Purism': 'https://logo.clearbit.com/puri.sm',
  'Tutanota': 'https://logo.clearbit.com/tutanota.com',
  'Oracle': 'https://logo.clearbit.com/oracle.com',
  'Equifax': 'https://logo.clearbit.com/equifax.com',
  'Experian': 'https://logo.clearbit.com/experian.com',
  'Acxiom': 'https://logo.clearbit.com/acxiom.com',
  'Alibaba': 'https://logo.clearbit.com/alibaba.com',
  'Lenovo': 'https://logo.clearbit.com/lenovo.com',
  'DJI': 'https://logo.clearbit.com/dji.com',
  'Micron': 'https://logo.clearbit.com/micron.com',
  'Applied Materials': 'https://logo.clearbit.com/appliedmaterials.com',
  'Lam Research': 'https://logo.clearbit.com/lamresearch.com',
  'KLA': 'https://logo.clearbit.com/kla.com',
  'ASML': 'https://logo.clearbit.com/asml.com',
  'Rosneft': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Lukoil': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Sberbank': 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400',
  'Novatek': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Nornickel': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Polyus': 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400',
  'Tatneft': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'IKEA': 'https://logo.clearbit.com/ikea.com',
  'H&M': 'https://logo.clearbit.com/hm.com',
  'Elbit Systems': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Rafael Advanced Defense Systems': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Israel Aerospace Industries (IAI)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Raytheon Technologies': 'https://logo.clearbit.com/rtx.com',
  'Teva Pharmaceutical Industries': 'https://logo.clearbit.com/tevapharm.com',
  'Expedia Group': 'https://logo.clearbit.com/expedia.com',
  'Orange': 'https://logo.clearbit.com/orange.com',
  'Tripadvisor': 'https://logo.clearbit.com/tripadvisor.com',
  'SodaStream': 'https://logo.clearbit.com/sodastream.com',
  'LVMH': 'https://logo.clearbit.com/lvmh.com',
  'Airbus': 'https://logo.clearbit.com/airbus.com',
  'L\'OrÃ©al': 'https://logo.clearbit.com/loreal.com',
  'Renault': 'https://logo.clearbit.com/renault.com',
  'BNP Paribas': 'https://logo.clearbit.com/bnpparibas.com',
  'Sanofi': 'https://logo.clearbit.com/sanofi.com',
  'Pernod Ricard': 'https://logo.clearbit.com/pernod-ricard.com',
  'Ryanair': 'https://logo.clearbit.com/ryanair.com',
  'Eni': 'https://logo.clearbit.com/eni.com',
  'Ferrari': 'https://logo.clearbit.com/ferrari.com',
  'Stellantis': 'https://logo.clearbit.com/stellantis.com',
  'EssilorLuxottica': 'https://logo.clearbit.com/essilorluxottica.com',
  'Enel': 'https://logo.clearbit.com/enel.com',
  'Intesa Sanpaolo': 'https://logo.clearbit.com/intesasanpaolo.com',
  'UniCredit': 'https://logo.clearbit.com/unicredit.it',
  'Barilla': 'https://logo.clearbit.com/barilla.com',
  'Pirelli': 'https://logo.clearbit.com/pirelli.com',
  'Leonardo': 'https://logo.clearbit.com/leonardocompany.com',
  'Toyota': 'https://logo.clearbit.com/toyota.com',
  'Sony': 'https://logo.clearbit.com/sony.com',
  'Honda': 'https://logo.clearbit.com/honda.com',
  'Nintendo': 'https://logo.clearbit.com/nintendo.com',
  'Canon': 'https://logo.clearbit.com/canon.com',
  'Hitachi': 'https://logo.clearbit.com/hitachi.com',
  'Fast Retailing (Uniqlo)': 'https://logo.clearbit.com/uniqlo.com',
  'Mitsubishi': 'https://logo.clearbit.com/mitsubishi.com',
  'SoftBank': 'https://logo.clearbit.com/softbank.jp',
  'NBCUniversal': 'https://logo.clearbit.com/nbcuniversal.com',
  'State Farm': 'https://logo.clearbit.com/statefarm.com',
  'American Express': 'https://logo.clearbit.com/americanexpress.com',
  'FanDuel': 'https://logo.clearbit.com/fanduel.com',
  'ByteDance': 'https://logo.clearbit.com/tiktok.com',
  'Anta Sports': 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400',
  'Li-Ning': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  'Monster Beverage': 'https://logo.clearbit.com/monsterenergy.com',
  'Molson Coors': 'https://logo.clearbit.com/molsoncoors.com',
  'Rogers Communications': 'https://logo.clearbit.com/rogers.com',
  'Fanatics': 'https://logo.clearbit.com/fanatics.com',
  'Hyundai': 'https://logo.clearbit.com/hyundai.com',
  'Betway': 'https://logo.clearbit.com/betway.com',
  'Fidelity Investments': 'https://logo.clearbit.com/fidelity.com',
  'RTX (Raytheon Technologies)': 'https://logo.clearbit.com/rtx.com',
  'Biogen': 'https://logo.clearbit.com/biogen.com',
  'Vertex Pharmaceuticals': 'https://logo.clearbit.com/vrtx.com',
  'Dunkin\' Brands': 'https://logo.clearbit.com/dunkinbrands.com',
  'Wayfair': 'https://logo.clearbit.com/wayfair.com',
  'HubSpot': 'https://logo.clearbit.com/hubspot.com',
  'TJX Companies': 'https://logo.clearbit.com/tjx.com',
  'Liberty Mutual': 'https://logo.clearbit.com/libertymutual.com',
  '3M': 'https://logo.clearbit.com/3m.com',
  'National Grid': 'https://logo.clearbit.com/nationalgrid.com',
  'Eversource': 'https://logo.clearbit.com/eversource.com',
  'H-E-B': 'https://logo.clearbit.com/heb.com',
  'Dell Technologies': 'https://logo.clearbit.com/dell.com',
  'Southwest Airlines': 'https://logo.clearbit.com/southwest.com',
  'Valero Energy': 'https://logo.clearbit.com/valero.com',
  'Occidental Petroleum': 'https://logo.clearbit.com/oxy.com',
  'Sysco': 'https://logo.clearbit.com/sysco.com',
  'Publix Super Markets': 'https://logo.clearbit.com/publix.com',
  'Royal Caribbean International': 'https://logo.clearbit.com/royalcaribbean.com',
  'Carnival Corporation': 'https://logo.clearbit.com/carnivalcorp.com',
  'Darden Restaurants': 'https://logo.clearbit.com/darden.com',
  'AutoNation': 'https://logo.clearbit.com/autonation.com',
  'Lennar Corporation': 'https://logo.clearbit.com/lennar.com',
  'Florida Crystals': 'https://images.unsplash.com/photo-1560800452-f2d475982b96?w=400',
  'Duke Energy': 'https://logo.clearbit.com/duke-energy.com',
  'The Mosaic Company': 'https://logo.clearbit.com/mosaicco.com',
  'Invitation Homes': 'https://logo.clearbit.com/invitationhomes.com',
  'Goldman Sachs': 'https://logo.clearbit.com/goldmansachs.com',
  'IBM': 'https://logo.clearbit.com/ibm.com',
  'Colgate-Palmolive': 'https://logo.clearbit.com/colgatepalmolive.com',
  'Bristol-Myers Squibb': 'https://logo.clearbit.com/bms.com',
  'Con Edison': 'https://logo.clearbit.com/conedison.com',
  'Blackstone': 'https://logo.clearbit.com/blackstone.com',
  'Zillow': 'https://logo.clearbit.com/zillow.com',
  'NVIDIA': 'https://logo.clearbit.com/nvidia.com',
  'Salesforce': 'https://logo.clearbit.com/salesforce.com',
  'Cisco Systems': 'https://logo.clearbit.com/cisco.com',
  'Intuit': 'https://logo.clearbit.com/intuit.com',
  'PG&E': 'https://logo.clearbit.com/pge.com',
  'Southern California Edison': 'https://logo.clearbit.com/sce.com',
  'Monsanto (Bayer)': 'https://logo.clearbit.com/bayer.com',
  'Abbott Laboratories': 'https://logo.clearbit.com/abbott.com',
  'Walgreens Boots Alliance': 'https://logo.clearbit.com/walgreens.com',
  'Deere & Company': 'https://logo.clearbit.com/deere.com',
  'Motorola Solutions': 'https://logo.clearbit.com/motorolasolutions.com',
  'United Airlines': 'https://logo.clearbit.com/united.com',
  'The Kraft Heinz Company': 'https://logo.clearbit.com/kraftheinzcompany.com',
  'Altria Group': 'https://logo.clearbit.com/altria.com',
  'Nationwide': 'https://logo.clearbit.com/nationwide.com',
  'Goodyear': 'https://logo.clearbit.com/goodyear.com',
  'Marathon Petroleum': 'https://logo.clearbit.com/marathonpetroleum.com',
  'FirstEnergy': 'https://logo.clearbit.com/firstenergycorp.com',
  'Cardinal Health': 'https://logo.clearbit.com/cardinalhealth.com',
  'Progressive': 'https://logo.clearbit.com/progressive.com',
  'KeyCorp': 'https://logo.clearbit.com/key.com',
  'Huntington Bancshares': 'https://logo.clearbit.com/huntington.com',
  'Hershey Company': 'https://logo.clearbit.com/thehersheycompany.com',
  'UPMC': 'https://logo.clearbit.com/upmc.com',
  'PNC Financial Services': 'https://logo.clearbit.com/pnc.com',
  'PPG Industries': 'https://logo.clearbit.com/ppg.com',
  'Giant Eagle': 'https://logo.clearbit.com/gianteagle.com',
  'Wawa': 'https://logo.clearbit.com/wawa.com',
  'Rite Aid': 'https://logo.clearbit.com/riteaid.com',
  'BNY Mellon': 'https://logo.clearbit.com/bnymellon.com',
  'PECO': 'https://logo.clearbit.com/peco.com',
  'Micron Technology': 'https://logo.clearbit.com/micron.com',
  'Eli Lilly': 'https://logo.clearbit.com/lilly.com',
  'Blackstone Group': 'https://logo.clearbit.com/blackstone.com',
  'Apollo Global Management': 'https://logo.clearbit.com/apollo.com',
  'MetLife': 'https://logo.clearbit.com/metlife.com',
  'Tucker Carlson Network': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'The Daily Wire': 'https://logo.clearbit.com/dailywire.com',
  'PublicSquare': 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400',
  'YouTube': 'https://logo.clearbit.com/youtube.com',
  'Burger King': 'https://logo.clearbit.com/burgerking.com',
  'HelloFresh': 'https://logo.clearbit.com/hellofresh.com',
  'ASOS': 'https://logo.clearbit.com/asos.com',
  'Sticker Mule': 'https://logo.clearbit.com/stickermule.com',
  'Channel 4': 'https://logo.clearbit.com/channel4.com',
  'BBC': 'https://logo.clearbit.com/bbc.com',
  'Vivobarefoot': 'https://logo.clearbit.com/vivobarefoot.com',
  'Turning Point USA': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
  'Turning Point Brands': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
  'Hewlett-Packard': 'https://logo.clearbit.com/hp.com',
  'Allstate': 'https://logo.clearbit.com/allstate.com',
  'Sinclair Broadcast Group': 'https://logo.clearbit.com/sbgi.net',
  'News Corporation': 'https://logo.clearbit.com/newscorp.com',
  'The Wall Street Journal': 'https://logo.clearbit.com/wsj.com',
  'Sky Group': 'https://logo.clearbit.com/sky.com',
  'New York Post': 'https://logo.clearbit.com/nypost.com',
  'HarperCollins': 'https://logo.clearbit.com/harpercollins.com',
  'JD.com': 'https://logo.clearbit.com/jd.com',
  'Splunk': 'https://logo.clearbit.com/splunk.com',
  'Smurfit WestRock': 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400',
  'GFL Environmental': 'https://logo.clearbit.com/gfl.com',
  'Liberty Broadband': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'AstraZeneca': 'https://logo.clearbit.com/astrazeneca.com',
  'Novo Nordisk': 'https://logo.clearbit.com/novonordisk.com',
  'AerCap Holdings': 'https://logo.clearbit.com/aercap.com',
  'Barclays': 'https://logo.clearbit.com/barclays.com',
  'UBS': 'https://logo.clearbit.com/ubs.com',
  'Morgan Stanley': 'https://logo.clearbit.com/morganstanley.com',
  'Broadcom': 'https://logo.clearbit.com/broadcom.com',
  'Visa': 'https://logo.clearbit.com/visa.com',
  'Palo Alto Networks': 'https://logo.clearbit.com/paloaltonetworks.com',
  'United Parcel Service': 'https://logo.clearbit.com/ups.com',
  'Vistra Corp': 'https://logo.clearbit.com/vistracorp.com',
  'Tempus AI': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
  'PureTalk': 'https://logo.clearbit.com/puretalkusa.com',
  'Overstock': 'https://logo.clearbit.com/overstock.com',
  'Home Depot': 'https://logo.clearbit.com/homedepot.com',
  'Cigna': 'https://logo.clearbit.com/cigna.com',
  'Exelon': 'https://logo.clearbit.com/exeloncorp.com'
};

function getDefaultImageForItem(itemName: string): string {
  if (itemImageMap[itemName]) {
    return itemImageMap[itemName];
  }
  
  const name = itemName.toLowerCase();
  const hash = itemName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageVariant = hash % 30;
  
  const businessImages = [
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556155092-8707de31f9c4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1542744094-24638eff58bb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553484771-371a605b060b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=400&fit=crop'
  ];
  
  if (name.includes('records') || name.includes('music')) {
    return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop';
  }
  if (name.includes('studio') || name.includes('production') || name.includes('film')) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=400&fit=crop';
  }
  if (name.includes('capital') || name.includes('fund') || name.includes('investment') || name.includes('bank')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop';
  }
  if (name.includes('foundation') || name.includes('charity')) {
    return 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=400&fit=crop';
  }
  if (name.includes('defense') || name.includes('aerospace') || name.includes('systems')) {
    return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop';
  }
  if (name.includes('media') || name.includes('news') || name.includes('network') || name.includes('broadcasting')) {
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop';
  }
  if (name.includes('tech') || name.includes('software') || name.includes('cloud') || name.includes('digital')) {
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop';
  }
  if (name.includes('restaurant') || name.includes('food') || name.includes('pizza') || name.includes('burger') || name.includes('cafe')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop';
  }
  if (name.includes('clothing') || name.includes('fashion') || name.includes('apparel')) {
    return 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop';
  }
  if (name.includes('energy') || name.includes('petroleum') || name.includes('oil') || name.includes('gas')) {
    return 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=400&fit=crop';
  }
  if (name.includes('pharma') || name.includes('health') || name.includes('medical')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop';
  }
  if (name.includes('retail') || name.includes('store') || name.includes('market')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop';
  }
  if (name.includes('auto') || name.includes('car') || name.includes('motor')) {
    return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop';
  }
  if (name.includes('cosmetic') || name.includes('beauty')) {
    return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop';
  }
  
  return businessImages[imageVariant];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getWebsiteForItem(itemName: string): string {
  const name = itemName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = name.split(/\s+/);
  const firstWord = words[0] || 'company';
  
  const specialCases: Record<string, string> = {
    'tesla': 'https://www.tesla.com',
    'spacex': 'https://www.spacex.com',
    'xai': 'https://x.ai',
    'neuralink': 'https://neuralink.com',
    'x': 'https://x.com',
    'meta': 'https://www.meta.com',
    'apple': 'https://www.apple.com',
    'google': 'https://www.google.com',
    'microsoft': 'https://www.microsoft.com',
    'amazon': 'https://www.amazon.com',
    'nike': 'https://www.nike.com',
    'adidas': 'https://www.adidas.com',
    'walmart': 'https://www.walmart.com',
    'target': 'https://www.target.com',
    'starbucks': 'https://www.starbucks.com',
    'mcdonalds': 'https://www.mcdonalds.com',
    'ford': 'https://www.ford.com',
    'toyota': 'https://www.toyota.com',
    'netflix': 'https://www.netflix.com',
    'disney': 'https://www.disney.com',
    'coca cola': 'https://www.coca-cola.com',
    'cocacola': 'https://www.coca-cola.com',
    'pepsico': 'https://www.pepsico.com',
    'pepsi': 'https://www.pepsi.com',
  };
  
  if (specialCases[name]) {
    return specialCases[name];
  }
  
  return `https://www.${firstWord}.com`;
}

function getCategoryForItem(itemName: string): string {
  const name = itemName.toLowerCase();
  
  if (name.includes('records') || name.includes('music')) return 'Music';
  if (name.includes('studio') || name.includes('production') || name.includes('film')) return 'Entertainment';
  if (name.includes('capital') || name.includes('fund') || name.includes('investment')) return 'Financial Services';
  if (name.includes('foundation') || name.includes('charity')) return 'Philanthropy';
  if (name.includes('media') || name.includes('news') || name.includes('network')) return 'Media';
  if (name.includes('tech') || name.includes('software') || name.includes('cloud')) return 'Technology';
  if (name.includes('restaurant') || name.includes('food') || name.includes('pizza')) return 'Food & Beverage';
  if (name.includes('clothing') || name.includes('fashion') || name.includes('apparel')) return 'Fashion';
  if (name.includes('sports') || name.includes('team') || name.includes('athletic')) return 'Sports';
  if (name.includes('publishing') || name.includes('books')) return 'Publishing';
  
  return 'Products & Services';
}

interface ItemAlignment {
  valueId: string;
  position: number;
  isSupport: boolean;
}

function calculateAverageAlignmentScore(alignments: ItemAlignment[]): number {
  if (alignments.length === 0) return 0;
  
  const scores = alignments.map(a => {
    if (a.isSupport) {
      return 100 - (a.position * 5);
    } else {
      return -100 + (a.position * 5);
    }
  });
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function generateProducts(): Product[] {
  const products: Product[] = [];
  const itemAlignments = new Map<string, ItemAlignment[]>();
  
  Object.entries(productsData).forEach(([valueId, data]) => {
    const { support, oppose } = data as { support: string[]; oppose: string[] };
    
    support.forEach((itemName, index) => {
      const itemId = slugify(itemName);
      if (!itemAlignments.has(itemId)) {
        itemAlignments.set(itemId, []);
      }
      itemAlignments.get(itemId)!.push({
        valueId,
        position: index + 1,
        isSupport: true,
      });
    });
    
    oppose.forEach((itemName, index) => {
      const itemId = slugify(itemName);
      if (!itemAlignments.has(itemId)) {
        itemAlignments.set(itemId, []);
      }
      itemAlignments.get(itemId)!.push({
        valueId,
        position: index + 1,
        isSupport: false,
      });
    });
  });
  
  itemAlignments.forEach((alignments, itemId) => {
    const firstAlignment = alignments[0];
    const itemName = firstAlignment.isSupport 
      ? (productsData[firstAlignment.valueId as keyof typeof productsData] as { support: string[] }).support[firstAlignment.position - 1]
      : (productsData[firstAlignment.valueId as keyof typeof productsData] as { oppose: string[] }).oppose[firstAlignment.position - 1];
    
    const relatedValues = alignments.map(a => a.valueId);
    const alignmentScore = calculateAverageAlignmentScore(alignments);
    const isPrimarySupport = alignmentScore > 0;
    
    const productData = productImageMap[itemName] || {
      image: getDefaultImageForItem(itemName),
      description: `Premium product from ${itemName}`
    };

    products.push({
      id: itemId,
      name: itemName,
      brand: itemName,
      category: getCategoryForItem(itemName),
      imageUrl: getDefaultImageForItem(itemName),
      productImageUrl: productData.image,
      productDescription: productData.description,
      alignmentScore,
      moneyFlow: {
        company: itemName,
        shareholders: [
          {
            name: isPrimarySupport ? 'Supports value' : 'Opposes value',
            percentage: 100,
            alignment: isPrimarySupport ? 'aligned' : 'opposed',
            causes: relatedValues,
          },
        ],
        overallAlignment: alignmentScore,
      },
      keyReasons: [
        `Related to ${relatedValues.length} values`,
        isPrimarySupport ? 'Aligned with value' : 'Against value',
        'Based on documented relationships',
        `Average alignment score: ${alignmentScore}`,
      ],
      relatedValues,
      valueAlignments: alignments,
      website: getWebsiteForItem(itemName),
    });
  });
  
  return products;
}
