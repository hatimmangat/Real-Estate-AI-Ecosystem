export const geocodeAddress = async (req, res) => {
    try {
        const { address, area, city } = req.body;

        if (!city) {
            return res.status(400).json({
                message: 'City is required'
            });
        }

        const addressVariations = [
            address ? `${address}, ${area}, ${city}, Pakistan` : null,
            area ? `${area}, ${city}, Pakistan` : null,
            `${city}, Punjab, Pakistan`,
            `${city}, Pakistan`
        ].filter(Boolean);

        console.log("Backend geocoding attempts:", addressVariations);

        for (let i = 0; i < addressVariations.length; i++) {
            const searchAddress = addressVariations[i];
            console.log(`Attempt ${i + 1}/${addressVariations.length}: Searching - "${searchAddress}"`);

            try {
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=5`;
                console.log(`Request URL: ${url}`);

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                        "User-Agent": "RealEstateApp/1.0"
                    }
                });

                if (!response.ok) {
                    console.warn(`Nominatim API returned status: ${response.status}`);
                    continue;
                }

                const data = await response.json();
                console.log(`Response (${data.length} results):`, data);

                if (Array.isArray(data) && data.length > 0) {
                    let bestResult = data[0];
                    
                    if (i === 0 && data.length > 1) {
                        const specificResult = data.find(result =>
                            result.class !== 'boundary' &&
                            result.type !== 'administrative' &&
                            result.type !== 'city'
                        );
                        if (specificResult) {
                            bestResult = specificResult;
                            console.log("✓ Found specific result (non-boundary)");
                        }
                    }

                    const lat = parseFloat(bestResult.lat);
                    const lon = parseFloat(bestResult.lon);

                    console.log(`✅ SUCCESS - Found coordinates: ${lat}, ${lon}`);
                    console.log(`   Address: ${bestResult.display_name}`);
                    console.log(`   Class: ${bestResult.class}, Type: ${bestResult.type}`);

                    return res.status(200).json({
                        success: true,
                        coordinates: {
                            lat,
                            lng: lon
                        },
                        displayName: bestResult.display_name,
                        searchedAddress: searchAddress
                    });
                }

                console.log(`✗ Attempt ${i + 1} - No results returned`);
            } catch (error) {
                console.error(`Geocoding error for attempt ${i + 1}:`, error.message);
            }
        }

        console.log("❌ FAILED - Could not find coordinates for any variation");
        return res.status(200).json({
            success: false,
            coordinates: null,
            message: 'Could not locate this address on the map. Please check the address details.',
            searchedAddresses: addressVariations
        });
    } catch (error) {
        console.error('Geocode address error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};