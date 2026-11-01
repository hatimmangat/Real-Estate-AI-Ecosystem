import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

export const predictHousePrice = async (req, res) => {
    try {
        const {
            city,
            class: houseClass,
            marlas,
            floors,
            bedrooms,
            bathrooms,
            porch,
            servant_quarter,
            corner_property,
            park_facing,
            house_age
        } = req.body;

        if (!city || houseClass === undefined || marlas === undefined ||
            floors === undefined || bedrooms === undefined || bathrooms === undefined ||
            porch === undefined || servant_quarter === undefined || corner_property === undefined ||
            park_facing === undefined || house_age === undefined) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const mlResponse = await axios.post(
            `${ML_SERVICE_URL}/api/house-price/predict`,
            {
                city,
                class: houseClass,
                marlas: parseInt(marlas),
                floors: parseInt(floors),
                bedrooms: parseInt(bedrooms),
                bathrooms: parseInt(bathrooms),
                porch: parseInt(porch),
                servant_quarter: parseInt(servant_quarter),
                corner_property: parseInt(corner_property),
                park_facing: parseInt(park_facing),
                house_age: parseInt(house_age)
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        res.status(200).json({
            success: true,
            data: {
                predicted_price: mlResponse.data.predicted_price,
                formatted_price: mlResponse.data.formatted_price,
                message: mlResponse.data.message
            }
        });

    } catch (error) {
        console.error('Error in predictHousePrice:', error);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data?.detail || 'ML service error',
                error: error.response.data
            });
        }

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'ML service timeout. Please try again.'
            });
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'ML service is not available. Please ensure the Python service is running.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to predict house price',
            error: error.message
        });
    }
};

export const checkMLServiceHealth = async (req, res) => {
    try {
        const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 5000
        });

        res.status(200).json({
            success: true,
            mlService: healthResponse.data
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'ML service is not available',
            error: error.message
        });
    }
};
