const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ==========================================
// 1. ELECTRICAL MATERIALS (204 items)
// ==========================================
const electricalMaterials = [
  // Page 1: Wires (#1 - 5)
  { name: '1 sq mm wire (Red, Black, Blue, Yellow, Green, Grey)', cat: 'Electrical', brand: 'V-Guard', unit: 'Coil' },
  { name: '1.5 sq mm wire (Red, Black, Blue, Yellow, Green, Grey)', cat: 'Electrical', brand: 'V-Guard', unit: 'Coil' },
  { name: '2.5 sq mm wire (Red, Black, Green)', cat: 'Electrical', brand: 'V-Guard', unit: 'Coil' },
  { name: '4 sq mm wire (Red, Black)', cat: 'Electrical', brand: 'V-Guard', unit: 'Coil' },
  { name: '6 sq mm wire (Red, Black, Blue, Yellow)', cat: 'Electrical', brand: 'V-Guard', unit: 'Meter' },

  // Page 2: Switches, Sockets & Accessories (#6 - 24)
  { name: 'One way Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Two way Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '2 in 1 Socket', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16A Socket', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16A One way Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16A Two way Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '32A mini DP Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Dummy Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Dimmer Switch Type', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Dimmer Socket Type', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'USB Port Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Foot Lamp 3 Module', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Foot Lamp 2 Module', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Mega Bell Push', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Mega Two Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 Module Bell Switch', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Indicator', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Angle Holder', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Ceiling Rose', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 3: Sheets, Modular Plates & MCBs (#25 - 44)
  { name: '4x4 PVC Sheet', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6x4 PVC Sheet', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8x6 PVC Sheet', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8x4 PVC Sheet', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Round Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '2 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '4 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '18 Module Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6A MCB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '10A MCB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20A MCB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16A MCB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25A MCB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '32A MCB', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 4: Protection, DBs & Accessories (#45 - 64)
  { name: 'Isolator 40A 2 Pole', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Isolator 63A 4 Pole', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'RCCB 40A 30mA 2 Pole', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'RCCB 63A 100mA 4 Pole', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'SPD 4 Pole', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'MCB Type Changeover', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '32A Fuse Unit', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '63A Fuse Unit', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '100 mm Cable Tie', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: '300 mm Cable Tie', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: 'Strip Connector', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Insulation Tape', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '4 Way Double Door DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6 Way Double Door DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 Way Double Door DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12 Way Double Door DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '16 Way Double Door DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '4 Way TPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6 Way TPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 Way TPN DB', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 5: DBs, Earthing & Accessories (#65 - 82)
  { name: '12 Way TPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6 Way Phase Selector DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 Way Phase Selector DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12 Way Phase Selector DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '4 Way VTPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6 Way VTPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 Way VTPN DB', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Single Phase Meter Board', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3 Phase Meter Board', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '8 kg Copper Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '10 kg Copper Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '12 kg Copper Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Copper Rod 1.5 Meter', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Copper Plate', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Crimping Socket 5 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Crimping Socket 6 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Copper Lug', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Banana Socket', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 6: UG Cables, Glands & Earthing (#83 - 97)
  { name: 'UG Cable 1.5 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 2.5 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 4 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 6 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 10 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 16 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 25 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'UG Cable 35 mm', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Cable Gland 12 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Cable Gland 25 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Cable Gland 28 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Cable Gland 32 mm', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Copper Earth Shim', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Earth Compound', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: 'Earth Pipe', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 7: Cables, Conduits & Fittings (#98 - 117)
  { name: 'Cat 6 Cable', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Speaker Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '2 Core Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '3 Core Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '4 Core Wire', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '20 mm PVC Pipe ISI M', cat: 'Electrical', brand: '', unit: 'Length' },
  { name: '20 mm PVC Pipe ISI L', cat: 'Electrical', brand: '', unit: 'Length' },
  { name: '20 mm PVC Pipe Ordinary', cat: 'Electrical', brand: '', unit: 'Length' },
  { name: '20 mm Bend ISI M', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm Elbow', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm Tee', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm 1 Way Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm 2 Way Junction Box ISI', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm 3 Way Junction Box ISI', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm 4 Way Junction Box ISI', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm H Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm Y Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm U Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '20 mm Saddles', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm PVC Pipe ISI M', cat: 'Electrical', brand: '', unit: 'Length' },
  { name: '25 mm PVC Pipe Ordinary', cat: 'Electrical', brand: '', unit: 'Length' },

  // Page 8: 25mm Fittings, Flexible Hose, Nails & LEDs (#118 - 139)
  { name: '25 mm Bend ISI', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm 1 Way Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm 2 Way Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm 3 Way Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm 4 Way Junction Box', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm Elbow', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm Tee', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '25 mm Flexible Hose', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '20 mm Flexible Hose', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Concrete Nails 2"', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: 'Concrete Nails 1 1/2"', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: 'LED Bulb 9W (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'LED Bulb 12W (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'LED Tube Set 20W (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'LED Bulb 9W (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'LED Bulb 3W (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'LED Tube Set 20W (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W LED Panel (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED Panel (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED Panel (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '15W LED Panel (Warm)', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 9: LED Panels, Spots & COB Lights (#140 - 159)
  { name: '22W LED Panel (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W LED Panel (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED Panel (White) Round', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED Panel (White) Square', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED Panel (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '15W LED Panel (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '22W LED Panel (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W LED Panel (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED Panel (NW) Round', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED Panel (NW) Square', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED Panel (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '22W LED Panel (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W Junction Box LED (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W Junction Box LED (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3W Junction Box LED (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1W LED Spot (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1W LED Spot (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1W LED Spot Rose Gold', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED COB Light (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED COB Light (NW)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6W LED COB Light (Warm)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED COB Light (Warm)', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 10: COB, Strips, Profile Channels & Drivers (#160 - 180)
  { name: '6W LED COB Light (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '12W LED COB Light (White)', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '120 LED Strip (NW)', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '120 LED Strip (White)', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '240 LED Strip (Warm)', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '240 LED Strip (NW)', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '240 LED Strip (White)', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '12x12 Profile Channel', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '15x6 Profile Channel', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: '7x9 Profile Channel', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Profile End Cap', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 Meter Track LED Spot', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 Meter Track', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '5A LED Driver', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '10A LED Driver', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Flexible Silicone LED Profile Channel', cat: 'Electrical', brand: '', unit: 'Meter' },
  { name: 'Up and Down LED Light', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '4 Side LED Light', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Gate Light', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Wall Fancy Light', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Hanging Light', cat: 'Electrical', brand: '', unit: 'No' },

  // Page 11: Fans, Screws & Accessories (#181 - 203)
  { name: 'Chandelier LED', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Ceiling Fan BLDC', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Ceiling Fan', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Wall Fan', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Table Fan', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Exhaust Fan 6" Pipe Fan', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Exhaust Fan Metal Body', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '3/4" Drywall Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1" Drywall Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 1/2" Drywall Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '2" Drywall Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '2 1/2" Drywall Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1" Steel Screw Star', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 1/4" Steel Screw Star', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '1 1/2" Cycle Screw', cat: 'Electrical', brand: '', unit: 'No' },
  { name: '6mm Screw Plug', cat: 'Electrical', brand: '', unit: 'Pkt' },
  { name: 'Mirror Lamp', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Bell', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Photo Light', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Fan Rod 1 Ft', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Fan Rod 1.5 Ft', cat: 'Electrical', brand: '', unit: 'No' },
  { name: 'Fan Rod 2 Ft', cat: 'Electrical', brand: '', unit: 'No' },
];

// ==========================================
// 2. PLUMBING MATERIALS (320 items)
// ==========================================
const plumbingMaterials = [
  // Page 1: Pipes (#1 - 22)
  { name: '4" PVC Pipe ISI 4kg', cat: 'Plumbing', brand: 'Supreme', unit: 'Meter' },
  { name: '3" PVC Pipe ISI 4kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '2 1/2" PVC Pipe ISI 4kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '2" PVC Pipe ISI 4kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" PVC Pipe ISI 4kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '2" PVC Pipe ISI 6kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" PVC Pipe ISI 6kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" PVC Pipe ISI 10kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" PVC Pipe ISI 15kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '3/4" PVC Pipe ISI 10kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '3/4" PVC Pipe ISI 15kg', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '3/4" CPVC Pipe SDR 11', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" CPVC Pipe SDR 11', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" CPVC Pipe SDR 11', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '3/4" ASTM Pipe (UPVC)', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" ASTM Pipe (UPVC)', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" ASTM Pipe (UPVC)', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '2" ASTM Pipe (UPVC)', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" Flexible Hose', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" Flexible Hose', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" HDPE Pipe', cat: 'Plumbing', brand: '', unit: 'Meter' },

  // Page 2: Pipes, Traps & 4" Fittings (#23 - 42)
  { name: '1 1/2" HDPE Pipe', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1" LDPE Pipe', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '1 1/2" LDPE Pipe', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: 'Garden Hose 1/2"', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: '4"x2" Multi Trap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4"x2 1/2" Multi Trap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4"x2" One Way Trap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Line Trap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Line Trap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" S Trap PVC', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" P Trap PVC', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Short Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Door Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Door Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Y Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 3: 4", 3" & 2" Fittings (#43 - 66)
  { name: '4" Air Cowl', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Door Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Door Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Short Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Y Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Air Cowl', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Door Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Door Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Y Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Air Cowl', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Short Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 4: 1 1/2", 1" & 3/4" Fittings (#66 - 86)
  { name: '1 1/2" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Y Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Short Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Door Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Door Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Air Cowl', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Bend', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 5: 3/4", 2 1/2" Fittings & CPVC 3/4" / 1" (#87 - 110)
  { name: '3/4" Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Y Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Tee Fitting', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Short Bend', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Door Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Door Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Air Cowl', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 6: CPVC FTA, ASTM Fittings & NRV (#111 - 133)
  { name: '1" CPVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM 45° Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM End Cap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" NRV (Non-Return Valve)', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 7: Brass Threaded (BT) PVC & CPVC Fittings (#134 - 158)
  { name: '3/4" NRV', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" NRV', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" PVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" PVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" PVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" PVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" PVC Brass Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" PVC Brass Reducing Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" PVC Brass Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x3/4" PVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x3/4" PVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" PVC Brass Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" PVC Brass Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" PVC Brass Reducing Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" PVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" PVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" CPVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" CPVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" CPVC Brass Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" CPVC Brass Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1/2" CPVC Brass Reducing Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" CPVC Brass Reducing Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" CPVC Brass Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" CPVC Brass Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" CPVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 8: Brass Threaded CPVC/ASTM & Standard Fittings (#159 - 181)
  { name: '3/4"x1/2" CPVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" CPVC Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" CPVC Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" ASTM Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x3/4" ASTM Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" ASTM Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" ASTM Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" ASTM Brass Elbow', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" ASTM Brass Tee', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4"x1/2" ASTM Brass Reducing Coupling', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" ASTM Brass MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x1" ASTM Brass FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" PVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" PVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Overlap Pipe', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 9: Reducer Bushes & Heavy Steel Saddles (#182 - 201)
  { name: '4"x3" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4"x2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4"x2 1/2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3"x2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3"x2 1/2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3"x1 1/2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2"x2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2"x1 1/2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2"x1 1/2" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2"x1 1/4" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2"x1" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x3/4" PVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2"x1" ASTM Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2"x3/4" ASTM Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x3/4" ASTM Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2"x1 1/2" ASTM Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1"x3/4" CPVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2"x1" CPVC Bush', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 10: Heavy Saddles & Ball Valves (#202 - 223)
  { name: '2" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Steel Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" ASTM Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM Saddles Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" CPVC Steel Saddles', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC Steel Saddles', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Steel Saddles', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" PVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" PVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" PVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" PVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" CPVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" CPVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" CPVC Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" ASTM Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" ASTM Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" ASTM Ball Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Brass Valve', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 11: Brass Valves, Large Adapters, Tank Connectors & Hose Fittings (#224 - 243)
  { name: '1 1/2" Brass Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Brass Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Brass Valve', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" PVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" PVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" PVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" PVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" PVC FTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" PVC MTA', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Tank Connector (Union Type)', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Tank Connector', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Hose Holder', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Hose Holder', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Hose Holder', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Hose Holder', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Hose Connector', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Hose Connector', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Hose Connector', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Hose Connector', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1/2" Hose Connector', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 12: Hose Clips, Solvents, Hardware & U-Clamps (#244 - 264)
  { name: '1/2" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3/4" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/4" Hose Clip', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'PVC Solvent', cat: 'Plumbing', brand: '', unit: 'Bottle' },
  { name: 'CPVC Solvent', cat: 'Plumbing', brand: '', unit: 'Bottle' },
  { name: 'ASTM Solvent', cat: 'Plumbing', brand: '', unit: 'Bottle' },
  { name: 'Shellac', cat: 'Plumbing', brand: '', unit: 'Bottle' },
  { name: 'Cotton Waste', cat: 'Plumbing', brand: '', unit: 'Gm' },
  { name: '8 mm Threaded Rod', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: 'C Rail Channel', cat: 'Plumbing', brand: '', unit: 'Meter' },
  { name: 'Anchor Fastener with Nut 8mm', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Washer', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '4" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2 1/2" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '2" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1 1/2" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '1" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 13: Sanitaryware, Showers & Cocks (#267 - 287)
  { name: '3/4" U Clamp', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '300 mm Single Piece Closet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '220 mm Single Piece Closet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '20" Wash Basin Half Pedestal', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '18" Wash Basin Half Pedestal', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Table Top Wash Basin', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Wall Mounting Closet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Concealed Flush Tank Half Frame', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Concealed Flush Tank Full Frame', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Diverter', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Diverter Plate', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Spout', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Hand Shower', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Health Faucet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Shower', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Rain Shower', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Shower Arm', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Long Body Tap', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Angle Cock Heavy', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Angle Cock Medium', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Pillar Cock', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 14: Cocks, Mixers, Bathroom Accessories & Teflon (#288 - 307)
  { name: 'Pillar Cock Tall Body', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Sink Cock Wall Type', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Sink Pillar Cock', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Sink Mixer', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Wall Mixer', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: '3 Way Diverter', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Body Jet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Shower Panel', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Shower Rain Channel', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'PVC Connection Pipe', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Hot Water Connection Pipe', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Rag Bolt Set', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Silicone Sealant', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Soap Dish', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Towel Ring', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Towel Rod', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Towel Rack', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Corner Shelf Set', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Tissue Holder', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Teflon Tape', cat: 'Plumbing', brand: '', unit: 'No' },

  // Page 15: Waste Fittings, Sanitary Closets & Hardware (#308 - 323)
  { name: 'Waste Coupling Half Threaded', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Waste Coupling Full Threaded', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Waste Pipe', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Water Tank', cat: 'Plumbing', brand: '', unit: 'Liter' },
  { name: 'Concealed Shower Cock', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Shower Plate', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Orissa Pan', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'S Trap European Closet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'P Trap European Closet', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Seat Cover', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Flush Tank', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Extension Piece', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Nipple', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'CP Cup Flat', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'CP Cup Dome', cat: 'Plumbing', brand: '', unit: 'No' },
  { name: 'Stop Plug Long 1/2"', cat: 'Plumbing', brand: '', unit: 'No' },
];

const allMaterials = [...electricalMaterials, ...plumbingMaterials];

// 1. Generate Excel (.xlsx)
const wb = XLSX.utils.book_new();

const columnWidths = [
  { wch: 55 }, // name
  { wch: 15 }, // cat
  { wch: 15 }, // brand
  { wch: 12 }, // unit
];

// Sheet 1: All Materials
const wsAll = XLSX.utils.json_to_sheet(allMaterials, {
  header: ['name', 'cat', 'brand', 'unit']
});
wsAll['!cols'] = columnWidths;
XLSX.utils.book_append_sheet(wb, wsAll, 'All Materials');

// Sheet 2: Electrical
const wsElec = XLSX.utils.json_to_sheet(electricalMaterials, {
  header: ['name', 'cat', 'brand', 'unit']
});
wsElec['!cols'] = columnWidths;
XLSX.utils.book_append_sheet(wb, wsElec, 'Electrical');

// Sheet 3: Plumbing
const wsPlumb = XLSX.utils.json_to_sheet(plumbingMaterials, {
  header: ['name', 'cat', 'brand', 'unit']
});
wsPlumb['!cols'] = columnWidths;
XLSX.utils.book_append_sheet(wb, wsPlumb, 'Plumbing');

const xlsxPath = path.resolve('materials.xlsx');
XLSX.writeFile(wb, xlsxPath);
console.log(`Excel file updated at: ${xlsxPath}`);

// 2. Generate SQL (.sql) - Single Unified INSERT Statement for all 524 items
let sqlContent = `-- ====================================================================
-- MATERIALS MASTER DATA INSERT SCRIPT (ALL 524 ITEMS)
-- Includes:
--   - 204 Electrical materials
--   - 320 Plumbing materials
-- Target Table: public.materials (name, cat, brand, unit)
-- Generated: ${new Date().toISOString()}
-- ====================================================================

-- 1. Ensure table and columns exist in Supabase / PostgreSQL:
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cat TEXT,
    brand TEXT,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created with different schema
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS cat TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS unit TEXT;

-- 2. Single Unified INSERT query containing ALL items:
INSERT INTO public.materials (name, cat, brand, unit) VALUES
`;

const valueRows = allMaterials.map((m, idx) => {
  const safeName = m.name.replace(/'/g, "''");
  const safeCat = m.cat.replace(/'/g, "''");
  const safeBrand = m.brand ? `'${m.brand.replace(/'/g, "''")}'` : 'NULL';
  const safeUnit = m.unit ? `'${m.unit.replace(/'/g, "''")}'` : 'NULL';
  const comma = idx === allMaterials.length - 1 ? ';' : ',';
  return `  ('${safeName}', '${safeCat}', ${safeBrand}, ${safeUnit})${comma}`;
});

sqlContent += valueRows.join('\n') + '\n';

const sqlPath = path.resolve('materials.sql');
fs.writeFileSync(sqlPath, sqlContent, 'utf8');
console.log(`SQL file updated at: ${sqlPath} (Total items: ${allMaterials.length})`);
