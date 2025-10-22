import { Product } from '@/types';
import productsData from './products-data.json';

const itemImageMap: Record<string, string> = {
  'Tesla': 'https://img.logo.dev/tesla.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'SpaceX': 'https://img.logo.dev/spacex.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'xAI': 'https://img.logo.dev/x.ai?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Neuralink': 'https://img.logo.dev/neuralink.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'The Boring Company': 'https://img.logo.dev/boringcompany.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'X': 'https://img.logo.dev/x.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Panasonic': 'https://img.logo.dev/panasonic.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Nvidia': 'https://img.logo.dev/nvidia.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'TSMC': 'https://img.logo.dev/tsmc.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'CATL': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
  'BYD': 'https://img.logo.dev/byd.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Ford': 'https://img.logo.dev/ford.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'General Motors': 'https://img.logo.dev/gm.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Volkswagen': 'https://img.logo.dev/volkswagen.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Blue Origin': 'https://img.logo.dev/blueorigin.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Boeing': 'https://img.logo.dev/boeing.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'OpenAI': 'https://img.logo.dev/openai.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Google': 'https://img.logo.dev/google.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Meta': 'https://img.logo.dev/meta.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Apple': 'https://img.logo.dev/apple.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Nike': 'https://img.logo.dev/nike.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'SpringHill Company': 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
  'Liverpool FC': 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400',
  'Blaze Pizza': 'https://img.logo.dev/blazepizza.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Beats by Dre': 'https://img.logo.dev/beatsbydre.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Coca-Cola': 'https://img.logo.dev/coca-cola.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Kia': 'https://img.logo.dev/kia.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Samsung': 'https://img.logo.dev/samsung.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Ladder': 'https://img.logo.dev/ladder.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Adidas': 'https://img.logo.dev/adidas.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Under Armour': 'https://img.logo.dev/underarmour.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Puma': 'https://img.logo.dev/puma.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Domino\'s': 'https://img.logo.dev/dominos.com?token=pk_X-zfRGHgT0uGJP8L9h6jyQ',
  'Netflix': 'https://img.logo.dev/netflix.com',
  'Disney': 'https://img.logo.dev/disney.com',
  'Papa John\'s': 'https://img.logo.dev/papajohns.com',
  'Amazon': 'https://img.logo.dev/amazon.com',
  'New Balance': 'https://img.logo.dev/newbalance.com',
  'Manchester United': 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?w=400',
  'Universal Music Group': 'https://img.logo.dev/universalmusic.com',
  'Live Nation': 'https://img.logo.dev/livenation.com',
  'Ticketmaster': 'https://img.logo.dev/ticketmaster.com',
  'AT&T': 'https://img.logo.dev/att.com',
  'Capital One': 'https://img.logo.dev/capitalone.com',
  'Target': 'https://img.logo.dev/target.com',
  'CoverGirl': 'https://img.logo.dev/covergirl.com',
  'Keds': 'https://img.logo.dev/keds.com',
  'Spotify': 'https://img.logo.dev/spotify.com',
  'HYBE': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'Sony Music': 'https://img.logo.dev/sonymusic.com',
  'Warner Music Group': 'https://img.logo.dev/wmg.com',
  'PepsiCo': 'https://img.logo.dev/pepsico.com',
  'Verizon': 'https://img.logo.dev/verizon.com',
  'JPMorgan Chase': 'https://img.logo.dev/jpmorganchase.com',
  'AEG Presents': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'Onnit': 'https://img.logo.dev/onnit.com',
  'Athletic Greens': 'https://img.logo.dev/athleticgreens.com',
  'Black Rifle Coffee Company': 'https://img.logo.dev/blackriflecoffee.com',
  'Manscaped': 'https://img.logo.dev/manscaped.com',
  'SimpliSafe': 'https://img.logo.dev/simplisafe.com',
  'Squarespace': 'https://img.logo.dev/squarespace.com',
  'ExpressVPN': 'https://img.logo.dev/expressvpn.com',
  'UFC': 'https://img.logo.dev/ufc.com',
  'Happy Dad Seltzer': 'https://images.unsplash.com/photo-1558642891-54c5e67c1b5a?w=400',
  'iHeartMedia': 'https://img.logo.dev/iheartmedia.com',
  'SiriusXM': 'https://img.logo.dev/siriusxm.com',
  'New York Times': 'https://img.logo.dev/nytimes.com',
  'Crooked Media': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'audiochuck': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
  'Trump Organization': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
  'Trump Media & Technology Group': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'Fox Corporation': 'https://img.logo.dev/fox.com',
  'Newsmax': 'https://img.logo.dev/newsmax.com',
  'ExxonMobil': 'https://img.logo.dev/exxonmobil.com',
  'Lockheed Martin': 'https://img.logo.dev/lockheedmartin.com',
  'Uber': 'https://img.logo.dev/uber.com',
  'Pfizer': 'https://img.logo.dev/pfizer.com',
  'MP Materials': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
  'Alphabet': 'https://img.logo.dev/abc.xyz',
  'Warner Bros. Discovery': 'https://img.logo.dev/wbd.com',
  'The New York Times Company': 'https://img.logo.dev/nytimes.com',
  'The Walt Disney Company': 'https://img.logo.dev/disney.com',
  'Starbucks': 'https://img.logo.dev/starbucks.com',
  'Huawei': 'https://img.logo.dev/huawei.com',
  'Costco Wholesale': 'https://img.logo.dev/costco.com',
  'Kaiser Permanente': 'https://img.logo.dev/kp.org',
  'Microsoft': 'https://img.logo.dev/microsoft.com',
  'Intel': 'https://img.logo.dev/intel.com',
  'CeraVe': 'https://img.logo.dev/cerave.com',
  'Patagonia': 'https://img.logo.dev/patagonia.com',
  'Ben & Jerry\'s': 'https://img.logo.dev/benjerry.com',
  'REI': 'https://img.logo.dev/rei.com',
  'Goya Foods': 'https://img.logo.dev/goya.com',
  'Robinhood': 'https://img.logo.dev/robinhood.com',
  'Palantir Technologies': 'https://img.logo.dev/palantir.com',
  'Meta Platforms': 'https://img.logo.dev/meta.com',
  'Wells Fargo': 'https://img.logo.dev/wellsfargo.com',
  'GEO Group': 'https://img.logo.dev/geogroup.com',
  'Airbnb': 'https://img.logo.dev/airbnb.com',
  'Coinbase': 'https://img.logo.dev/coinbase.com',
  'Whole Foods': 'https://img.logo.dev/wholefoodsmarket.com',
  'L.L. Bean': 'https://img.logo.dev/llbean.com',
  'Virgin Group': 'https://img.logo.dev/virgin.com',
  'Proton': 'https://img.logo.dev/proton.me',
  'BlackRock': 'https://img.logo.dev/blackrock.com',
  'Vanguard': 'https://img.logo.dev/vanguard.com',
  'Comcast': 'https://img.logo.dev/comcast.com',
  'General Electric': 'https://img.logo.dev/ge.com',
  'Walmart': 'https://img.logo.dev/walmart.com',
  'Hobby Lobby': 'https://img.logo.dev/hobbylobby.com',
  'Chick-fil-A': 'https://img.logo.dev/chick-fil-a.com',
  'MyPillow': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400',
  'Levi Strauss & Co.': 'https://img.logo.dev/levistrauss.com',
  'Anheuser-Busch': 'https://img.logo.dev/anheuser-busch.com',
  'Procter & Gamble': 'https://img.logo.dev/pg.com',
  'Lowe\'s': 'https://img.logo.dev/lowes.com',
  'Smith & Wesson': 'https://img.logo.dev/smith-wesson.com',
  'Sturm, Ruger & Co.': 'https://img.logo.dev/ruger.com',
  'Bass Pro Shops': 'https://img.logo.dev/basspro.com',
  'Cabela\'s': 'https://img.logo.dev/cabelas.com',
  'Daniel Defense': 'https://img.logo.dev/danieldefense.com',
  'Colt': 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=400',
  'Vista Outdoor': 'https://img.logo.dev/vistaoutdoor.com',
  'Brownells': 'https://img.logo.dev/brownells.com',
  'Academy Sports + Outdoors': 'https://img.logo.dev/academy.com',
  'Dick\'s Sporting Goods': 'https://img.logo.dev/dickssportinggoods.com',
  'Kroger': 'https://img.logo.dev/kroger.com',
  'CVS Health': 'https://img.logo.dev/cvs.com',
  'Citigroup': 'https://img.logo.dev/citigroup.com',
  'Delta Air Lines': 'https://img.logo.dev/delta.com',
  'Bank of America': 'https://img.logo.dev/bankofamerica.com',
  'TOMS Shoes': 'https://img.logo.dev/toms.com',
  'NextEra Energy': 'https://img.logo.dev/nexteraenergy.com',
  'Ørsted': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'Vestas Wind Systems': 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400',
  'First Solar': 'https://img.logo.dev/firstsolar.com',
  'Enphase Energy': 'https://img.logo.dev/enphase.com',
  'Iberdrola': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'GE Vernova': 'https://img.logo.dev/ge.com',
  'Brookfield Renewable': 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
  'Siemens Energy': 'https://img.logo.dev/siemens.com',
  'JinkoSolar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
  'Chevron': 'https://img.logo.dev/chevron.com',
  'Shell': 'https://img.logo.dev/shell.com',
  'Saudi Aramco': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'BP': 'https://img.logo.dev/bp.com',
  'TotalEnergies': 'https://img.logo.dev/totalenergies.com',
  'Gazprom': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Coal India': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Pemex': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Peabody Energy': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'RTX': 'https://img.logo.dev/rtx.com',
  'Northrop Grumman': 'https://img.logo.dev/northropgrumman.com',
  'General Dynamics': 'https://img.logo.dev/gd.com',
  'Archer Daniels Midland': 'https://img.logo.dev/adm.com',
  'Caterpillar': 'https://img.logo.dev/caterpillar.com',
  'UPS': 'https://img.logo.dev/ups.com',
  'FedEx': 'https://img.logo.dev/fedex.com',
  'Equal Exchange': 'https://img.logo.dev/equalexchange.coop',
  'Ocean Spray': 'https://img.logo.dev/oceanspray.com',
  'Land O\'Lakes': 'https://img.logo.dev/landolakes.com',
  'New Belgium Brewing': 'https://img.logo.dev/newbelgium.com',
  'King Arthur Baking Company': 'https://img.logo.dev/kingarthurbaking.com',
  'Seventh Generation': 'https://img.logo.dev/seventhgeneration.com',
  'In-N-Out Burger': 'https://img.logo.dev/in-n-out.com',
  'Tyson Foods': 'https://img.logo.dev/tysonfoods.com',
  'Forever 21': 'https://img.logo.dev/forever21.com',
  'Wendy\'s': 'https://img.logo.dev/wendys.com',
  'George Foreman Grills': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
  'Interstate Batteries': 'https://img.logo.dev/interstatebatteries.com',
  'Pure Flix': 'https://img.logo.dev/pureflix.com',
  'Dayspring': 'https://img.logo.dev/dayspring.com',
  'McDonald\'s': 'https://img.logo.dev/mcdonalds.com',
  'Huda Beauty': 'https://img.logo.dev/hudabeauty.com',
  'Wardah Cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'INIKA Organic': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'PHB Ethical Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'FARSÃLI': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'PaliRoots': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
  'Zaytoun': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  'Al\'Ard': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400',
  'NestlÃ©': 'https://img.logo.dev/nestle.com',
  'Unilever': 'https://img.logo.dev/unilever.com',
  'Mars': 'https://img.logo.dev/mars.com',
  'Mondelez': 'https://img.logo.dev/mondelezinternational.com',
  'KFC': 'https://img.logo.dev/kfc.com',
  'EstÃ©e Lauder': 'https://img.logo.dev/esteelauder.com',
  'Veolia': 'https://img.logo.dev/veolia.com',
  'Supreme': 'https://img.logo.dev/supremenewyork.com',
  'G4S': 'https://img.logo.dev/g4s.com',
  'Orange S.A.': 'https://img.logo.dev/orange.com',
  'Ford Motor Company': 'https://img.logo.dev/ford.com',
  'Booking.com': 'https://img.logo.dev/booking.com',
  'Headspace': 'https://img.logo.dev/headspace.com',
  'PrAna': 'https://img.logo.dev/prana.com',
  'DharmaCrafts': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Buddha Groove': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Phat Buddha': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Bosatsu Brand': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Eileen Fisher': 'https://img.logo.dev/eileenfisher.com',
  'Toad&Co': 'https://img.logo.dev/toadandco.com',
  'Lotus Sky': 'https://images.unsplash.com/photo-1604514628550-37477afdf4e3?w=400',
  'Arc\'teryx': 'https://img.logo.dev/arcteryx.com',
  'USAA': 'https://img.logo.dev/usaa.com',
  'The Home Depot': 'https://img.logo.dev/homedepot.com',
  'Purdue Pharma': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  'Johnson & Johnson': 'https://img.logo.dev/jnj.com',
  'Philip Morris International': 'https://img.logo.dev/pmi.com',
  'Monsanto': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
  'Dow Chemical': 'https://img.logo.dev/dow.com',
  'Halliburton': 'https://img.logo.dev/halliburton.com',
  'KBR': 'https://img.logo.dev/kbr.com',
  'Constellis (Academi)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'UnitedHealth Group': 'https://img.logo.dev/unitedhealthgroup.com',
  'Humana': 'https://img.logo.dev/humana.com',
  'BAE Systems': 'https://img.logo.dev/baesystems.com',
  'L3Harris': 'https://img.logo.dev/l3harris.com',
  'Huntington Ingalls Industries': 'https://img.logo.dev/huntingtoningalls.com',
  'Honeywell': 'https://img.logo.dev/honeywell.com',
  'Leidos': 'https://img.logo.dev/leidos.com',
  'Lush Cosmetics': 'https://img.logo.dev/lush.com',
  'Uniqlo': 'https://img.logo.dev/uniqlo.com',
  'The Body Shop': 'https://img.logo.dev/thebodyshop.com',
  'Everlane': 'https://img.logo.dev/everlane.com',
  'Peloton': 'https://img.logo.dev/onepeloton.com',
  'MasterClass': 'https://img.logo.dev/masterclass.com',
  'Duolingo': 'https://img.logo.dev/duolingo.com',
  'Etsy': 'https://img.logo.dev/etsy.com',
  'Betterment': 'https://img.logo.dev/betterment.com',
  'Upwork': 'https://img.logo.dev/upwork.com',
  'DoorDash': 'https://img.logo.dev/doordash.com',
  'DraftKings': 'https://img.logo.dev/draftkings.com',
  'PayPal (high-fee services)': 'https://img.logo.dev/paypal.com',
  'Juul Labs': 'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=400',
  'Shein': 'https://img.logo.dev/shein.com',
  'Mondragon Corporation': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
  'Lululemon': 'https://img.logo.dev/lululemon.com',
  'Planet Fitness': 'https://img.logo.dev/planetfitness.com',
  'Fitbit': 'https://img.logo.dev/fitbit.com',
  'MyFitnessPal': 'https://img.logo.dev/myfitnesspal.com',
  'Gatorade': 'https://img.logo.dev/gatorade.com',
  'CrossFit': 'https://img.logo.dev/crossfit.com',
  'Hershey': 'https://img.logo.dev/hersheys.com',
  'Activision Blizzard': 'https://img.logo.dev/activisionblizzard.com',
  'Whole Foods Market': 'https://img.logo.dev/wholefoodsmarket.com',
  'Lululemon Athletica': 'https://img.logo.dev/lululemon.com',
  'Apple (mental health features)': 'https://img.logo.dev/apple.com',
  'Calm': 'https://img.logo.dev/calm.com',
  'Talkspace': 'https://img.logo.dev/talkspace.com',
  'BetterHelp': 'https://img.logo.dev/betterhelp.com',
  'ByteDance (TikTok)': 'https://img.logo.dev/tiktok.com',
  'Snapchat': 'https://img.logo.dev/snap.com',
  'Instagram': 'https://img.logo.dev/instagram.com',
  'Harley-Davidson': 'https://img.logo.dev/harley-davidson.com',
  'Mastercard': 'https://img.logo.dev/mastercard.com',
  'Rumble': 'https://img.logo.dev/rumble.com',
  'Substack': 'https://img.logo.dev/substack.com',
  'Telegram': 'https://img.logo.dev/telegram.org',
  'Signal': 'https://img.logo.dev/signal.org',
  'Brave': 'https://img.logo.dev/brave.com',
  'Gab': 'https://img.logo.dev/gab.com',
  'Odysee': 'https://img.logo.dev/odysee.com',
  'Truth Social': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
  'TikTok': 'https://img.logo.dev/tiktok.com',
  'Paramount Global': 'https://img.logo.dev/paramount.com',
  'DuckDuckGo': 'https://img.logo.dev/duckduckgo.com',
  'Mullvad': 'https://img.logo.dev/mullvad.net',
  'NordVPN': 'https://img.logo.dev/nordvpn.com',
  'Purism': 'https://img.logo.dev/puri.sm',
  'Tutanota': 'https://img.logo.dev/tutanota.com',
  'Oracle': 'https://img.logo.dev/oracle.com',
  'Equifax': 'https://img.logo.dev/equifax.com',
  'Experian': 'https://img.logo.dev/experian.com',
  'Acxiom': 'https://img.logo.dev/acxiom.com',
  'Alibaba': 'https://img.logo.dev/alibaba.com',
  'Lenovo': 'https://img.logo.dev/lenovo.com',
  'DJI': 'https://img.logo.dev/dji.com',
  'Micron': 'https://img.logo.dev/micron.com',
  'Applied Materials': 'https://img.logo.dev/appliedmaterials.com',
  'Lam Research': 'https://img.logo.dev/lamresearch.com',
  'KLA': 'https://img.logo.dev/kla.com',
  'ASML': 'https://img.logo.dev/asml.com',
  'Rosneft': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Lukoil': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Sberbank': 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400',
  'Novatek': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Nornickel': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'Polyus': 'https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=400',
  'Tatneft': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400',
  'IKEA': 'https://img.logo.dev/ikea.com',
  'H&M': 'https://img.logo.dev/hm.com',
  'Elbit Systems': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Rafael Advanced Defense Systems': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Israel Aerospace Industries (IAI)': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
  'Raytheon Technologies': 'https://img.logo.dev/rtx.com',
  'Teva Pharmaceutical Industries': 'https://img.logo.dev/tevapharm.com',
  'Expedia Group': 'https://img.logo.dev/expedia.com',
  'Orange': 'https://img.logo.dev/orange.com',
  'Tripadvisor': 'https://img.logo.dev/tripadvisor.com',
  'SodaStream': 'https://img.logo.dev/sodastream.com',
  'LVMH': 'https://img.logo.dev/lvmh.com',
  'Airbus': 'https://img.logo.dev/airbus.com',
  'L\'OrÃ©al': 'https://img.logo.dev/loreal.com',
  'Renault': 'https://img.logo.dev/renault.com',
  'BNP Paribas': 'https://img.logo.dev/bnpparibas.com',
  'Sanofi': 'https://img.logo.dev/sanofi.com',
  'Pernod Ricard': 'https://img.logo.dev/pernod-ricard.com',
  'Ryanair': 'https://img.logo.dev/ryanair.com',
  'Eni': 'https://img.logo.dev/eni.com',
  'Ferrari': 'https://img.logo.dev/ferrari.com',
  'Stellantis': 'https://img.logo.dev/stellantis.com',
  'EssilorLuxottica': 'https://img.logo.dev/essilorluxottica.com',
  'Enel': 'https://img.logo.dev/enel.com',
  'Intesa Sanpaolo': 'https://img.logo.dev/intesasanpaolo.com',
  'UniCredit': 'https://img.logo.dev/unicredit.it',
  'Barilla': 'https://img.logo.dev/barilla.com',
  'Pirelli': 'https://img.logo.dev/pirelli.com',
  'Leonardo': 'https://img.logo.dev/leonardocompany.com',
  'Toyota': 'https://img.logo.dev/toyota.com',
  'Sony': 'https://img.logo.dev/sony.com',
  'Honda': 'https://img.logo.dev/honda.com',
  'Nintendo': 'https://img.logo.dev/nintendo.com',
  'Canon': 'https://img.logo.dev/canon.com',
  'Hitachi': 'https://img.logo.dev/hitachi.com',
  'Fast Retailing (Uniqlo)': 'https://img.logo.dev/uniqlo.com',
  'Mitsubishi': 'https://img.logo.dev/mitsubishi.com',
  'SoftBank': 'https://img.logo.dev/softbank.jp',
  'NBCUniversal': 'https://img.logo.dev/nbcuniversal.com',
  'State Farm': 'https://img.logo.dev/statefarm.com',
  'American Express': 'https://img.logo.dev/americanexpress.com',
  'FanDuel': 'https://img.logo.dev/fanduel.com',
  'ByteDance': 'https://img.logo.dev/tiktok.com',
  'Anta Sports': 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400',
  'Li-Ning': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
  'Monster Beverage': 'https://img.logo.dev/monsterenergy.com',
  'Molson Coors': 'https://img.logo.dev/molsoncoors.com',
  'Rogers Communications': 'https://img.logo.dev/rogers.com',
  'Fanatics': 'https://img.logo.dev/fanatics.com',
  'Hyundai': 'https://img.logo.dev/hyundai.com',
  'Betway': 'https://img.logo.dev/betway.com',
  'Fidelity Investments': 'https://img.logo.dev/fidelity.com',
  'RTX (Raytheon Technologies)': 'https://img.logo.dev/rtx.com',
  'Biogen': 'https://img.logo.dev/biogen.com',
  'Vertex Pharmaceuticals': 'https://img.logo.dev/vrtx.com',
  'Dunkin\' Brands': 'https://img.logo.dev/dunkinbrands.com',
  'Wayfair': 'https://img.logo.dev/wayfair.com',
  'HubSpot': 'https://img.logo.dev/hubspot.com',
  'TJX Companies': 'https://img.logo.dev/tjx.com',
  'Liberty Mutual': 'https://img.logo.dev/libertymutual.com',
  '3M': 'https://img.logo.dev/3m.com',
  'National Grid': 'https://img.logo.dev/nationalgrid.com',
  'Eversource': 'https://img.logo.dev/eversource.com',
  'H-E-B': 'https://img.logo.dev/heb.com',
  'Dell Technologies': 'https://img.logo.dev/dell.com',
  'Southwest Airlines': 'https://img.logo.dev/southwest.com',
  'Valero Energy': 'https://img.logo.dev/valero.com',
  'Occidental Petroleum': 'https://img.logo.dev/oxy.com',
  'Sysco': 'https://img.logo.dev/sysco.com',
  'Publix Super Markets': 'https://img.logo.dev/publix.com',
  'Royal Caribbean International': 'https://img.logo.dev/royalcaribbean.com',
  'Carnival Corporation': 'https://img.logo.dev/carnivalcorp.com',
  'Darden Restaurants': 'https://img.logo.dev/darden.com',
  'AutoNation': 'https://img.logo.dev/autonation.com',
  'Lennar Corporation': 'https://img.logo.dev/lennar.com',
  'Florida Crystals': 'https://images.unsplash.com/photo-1560800452-f2d475982b96?w=400',
  'Duke Energy': 'https://img.logo.dev/duke-energy.com',
  'The Mosaic Company': 'https://img.logo.dev/mosaicco.com',
  'Invitation Homes': 'https://img.logo.dev/invitationhomes.com',
  'Goldman Sachs': 'https://img.logo.dev/goldmansachs.com',
  'IBM': 'https://img.logo.dev/ibm.com',
  'Colgate-Palmolive': 'https://img.logo.dev/colgatepalmolive.com',
  'Bristol-Myers Squibb': 'https://img.logo.dev/bms.com',
  'Con Edison': 'https://img.logo.dev/conedison.com',
  'Blackstone': 'https://img.logo.dev/blackstone.com',
  'Zillow': 'https://img.logo.dev/zillow.com',
  'NVIDIA': 'https://img.logo.dev/nvidia.com',
  'Salesforce': 'https://img.logo.dev/salesforce.com',
  'Cisco Systems': 'https://img.logo.dev/cisco.com',
  'Intuit': 'https://img.logo.dev/intuit.com',
  'PG&E': 'https://img.logo.dev/pge.com',
  'Southern California Edison': 'https://img.logo.dev/sce.com',
  'Monsanto (Bayer)': 'https://img.logo.dev/bayer.com',
  'Abbott Laboratories': 'https://img.logo.dev/abbott.com',
  'Walgreens Boots Alliance': 'https://img.logo.dev/walgreens.com',
  'Deere & Company': 'https://img.logo.dev/deere.com',
  'Motorola Solutions': 'https://img.logo.dev/motorolasolutions.com',
  'United Airlines': 'https://img.logo.dev/united.com',
  'The Kraft Heinz Company': 'https://img.logo.dev/kraftheinzcompany.com',
  'Altria Group': 'https://img.logo.dev/altria.com',
  'Nationwide': 'https://img.logo.dev/nationwide.com',
  'Goodyear': 'https://img.logo.dev/goodyear.com',
  'Marathon Petroleum': 'https://img.logo.dev/marathonpetroleum.com',
  'FirstEnergy': 'https://img.logo.dev/firstenergycorp.com',
  'Cardinal Health': 'https://img.logo.dev/cardinalhealth.com',
  'Progressive': 'https://img.logo.dev/progressive.com',
  'KeyCorp': 'https://img.logo.dev/key.com',
  'Huntington Bancshares': 'https://img.logo.dev/huntington.com',
  'Hershey Company': 'https://img.logo.dev/thehersheycompany.com',
  'UPMC': 'https://img.logo.dev/upmc.com',
  'PNC Financial Services': 'https://img.logo.dev/pnc.com',
  'PPG Industries': 'https://img.logo.dev/ppg.com',
  'Giant Eagle': 'https://img.logo.dev/gianteagle.com',
  'Wawa': 'https://img.logo.dev/wawa.com',
  'Rite Aid': 'https://img.logo.dev/riteaid.com',
  'BNY Mellon': 'https://img.logo.dev/bnymellon.com',
  'PECO': 'https://img.logo.dev/peco.com',
  'Micron Technology': 'https://img.logo.dev/micron.com',
  'Eli Lilly': 'https://img.logo.dev/lilly.com',
  'Blackstone Group': 'https://img.logo.dev/blackstone.com',
  'Apollo Global Management': 'https://img.logo.dev/apollo.com',
  'MetLife': 'https://img.logo.dev/metlife.com',
  'Tucker Carlson Network': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'The Daily Wire': 'https://img.logo.dev/dailywire.com',
  'PublicSquare': 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400',
  'YouTube': 'https://img.logo.dev/youtube.com',
  'Burger King': 'https://img.logo.dev/burgerking.com',
  'HelloFresh': 'https://img.logo.dev/hellofresh.com',
  'ASOS': 'https://img.logo.dev/asos.com',
  'Sticker Mule': 'https://img.logo.dev/stickermule.com',
  'Channel 4': 'https://img.logo.dev/channel4.com',
  'BBC': 'https://img.logo.dev/bbc.com',
  'Vivobarefoot': 'https://img.logo.dev/vivobarefoot.com',
  'Turning Point USA': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400',
  'Turning Point Brands': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
  'Hewlett-Packard': 'https://img.logo.dev/hp.com',
  'Allstate': 'https://img.logo.dev/allstate.com',
  'Sinclair Broadcast Group': 'https://img.logo.dev/sbgi.net',
  'News Corporation': 'https://img.logo.dev/newscorp.com',
  'The Wall Street Journal': 'https://img.logo.dev/wsj.com',
  'Sky Group': 'https://img.logo.dev/sky.com',
  'New York Post': 'https://img.logo.dev/nypost.com',
  'HarperCollins': 'https://img.logo.dev/harpercollins.com',
  'JD.com': 'https://img.logo.dev/jd.com',
  'Splunk': 'https://img.logo.dev/splunk.com',
  'Smurfit WestRock': 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400',
  'GFL Environmental': 'https://img.logo.dev/gfl.com',
  'Liberty Broadband': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400',
  'AstraZeneca': 'https://img.logo.dev/astrazeneca.com',
  'Novo Nordisk': 'https://img.logo.dev/novonordisk.com',
  'AerCap Holdings': 'https://img.logo.dev/aercap.com',
  'Barclays': 'https://img.logo.dev/barclays.com',
  'UBS': 'https://img.logo.dev/ubs.com',
  'Morgan Stanley': 'https://img.logo.dev/morganstanley.com',
  'Broadcom': 'https://img.logo.dev/broadcom.com',
  'Visa': 'https://img.logo.dev/visa.com',
  'Palo Alto Networks': 'https://img.logo.dev/paloaltonetworks.com',
  'United Parcel Service': 'https://img.logo.dev/ups.com',
  'Vistra Corp': 'https://img.logo.dev/vistracorp.com',
  'Tempus AI': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
  'PureTalk': 'https://img.logo.dev/puretalkusa.com',
  'Overstock': 'https://img.logo.dev/overstock.com',
  'Home Depot': 'https://img.logo.dev/homedepot.com',
  'Cigna': 'https://img.logo.dev/cigna.com',
  'Exelon': 'https://img.logo.dev/exeloncorp.com'
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
    
    products.push({
      id: itemId,
      name: itemName,
      brand: itemName,
      category: getCategoryForItem(itemName),
      imageUrl: getDefaultImageForItem(itemName),
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
