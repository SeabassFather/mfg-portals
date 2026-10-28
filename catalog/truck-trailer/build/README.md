# Catalog builder

Builds the 32-page Mexausa truck and trailer catalog (108 parts) from ../catalog-parts.csv.

    cd catalog/truck-trailer/build
    npm install
    node build.js

Photos: drop a licensed photo named MFG-0001.jpg (or .png), one per catalog number, into photos/. It replaces any free photo and appears beside that item. Items with no photo print as text only. Do not add photos copied from other sellers' sites.

free-photos/ holds the 10 free-license photographs (Wikimedia Commons) already matched to parts. Credits print on page 31 automatically; credits.json holds the details.
