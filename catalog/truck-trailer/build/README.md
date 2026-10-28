# Catalog builder

Builds the 32-page Mexausa truck and trailer catalog (108 parts) from ../catalog-parts.csv.

    cd catalog/truck-trailer/build
    npm install
    node build.js

Part numbers (parts.json) come from the MFG INC app: store list, parts desk (Timken, Stemco, bearings, pads), in-stock inventory (fittings, rotors), and the Bendix lookup the app already uses.

Photos, highest priority first:
1. photos/MFG-0001.jpg (or .png): supplier-supplied photo, one per catalog number. Wins over everything.
2. bendix-photos/: Bendix product photos for Bendix parts.
3. free-photos/: free-license Wikimedia photos, credited on page 31 (credits.json).

Items with no photo print as text with part numbers. Do not add photos copied from other sellers' sites.
