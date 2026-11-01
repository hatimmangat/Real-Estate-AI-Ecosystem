import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

export const getInvestmentOpportunities = async (req, res) => {
    try {
        const { city, location_name, recommendation } = req.query;

        console.log('Fetching investment opportunities from ML service...');
        console.log('ML Service URL:', ML_SERVICE_URL);

        const params = {};
        if (city) params.city = city;
        if (location_name) params.location_name = location_name;
        if (recommendation) params.recommendation = recommendation;

        const response = await axios.get(`${ML_SERVICE_URL}/api/investments`, {
            params,
            timeout: 30000
        });

        console.log(`Fetched ${response.data.length} investment opportunities`);

        res.status(200).json({
            success: true,
            data: response.data,
            count: response.data.length
        });
    } catch (error) {
        console.error('Get investment opportunities error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'ML service is not available. Please start the Python ML service at port 8001.',
                error: 'Service unavailable',
                hint: 'Run: cd ml-service && python run.py'
            });
        }

        if (error.code === 'ENOTFOUND') {
            return res.status(503).json({
                success: false,
                message: 'Cannot connect to ML service. Check ML_SERVICE_URL configuration.',
                error: 'Service unavailable'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to fetch investment opportunities',
            error: error.response?.data?.detail || error.message
        });
    }
};

export const predictProperty = async (req, res) => {
    try {
        const {
            city,
            class: propertyClass,
            price_pkr,
            marlas,
            bedrooms,
            bathrooms,
            floors,
            house_age,
            corner_property,
            park_facing,
            servant_quarter,
            porch
        } = req.body;

        // Validation
        if (!price_pkr || !marlas || !bedrooms || !bathrooms) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing: price_pkr, marlas, bedrooms, bathrooms'
            });
        }

        const payload = {
            city: city || 'Islamabad',
            class: propertyClass || 'A',
            price_pkr: parseFloat(price_pkr),
            marlas: parseFloat(marlas),
            bedrooms: parseInt(bedrooms),
            bathrooms: parseInt(bathrooms),
            floors: parseInt(floors) || 1,
            house_age: parseInt(house_age) || 0,
            corner_property: parseInt(corner_property) || 0,
            park_facing: parseInt(park_facing) || 0,
            servant_quarter: parseInt(servant_quarter) || 0,
            porch: parseInt(porch) || 0
        };

        console.log('Sending property prediction request to ML service:', payload);

        const response = await axios.post(
            `${ML_SERVICE_URL}/api/investments/predict-property`,
            payload,
            { timeout: 30000 }
        );

        console.log('ML service response:', response.data);

        res.status(200).json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Predict property error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                success: false,
                message: 'ML service is not available. Please ensure the Python service is running.',
                error: 'Service unavailable'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to generate property prediction',
            error: error.response?.data?.detail || error.message
        });
    }
};

export const getMLServiceHealth = async (req, res) => {
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/`, {
            timeout: 5000
        });

        res.status(200).json({
            success: true,
            service: 'ml_service',
            status: 'healthy',
            details: response.data
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            service: 'ml_service',
            status: 'unhealthy',
            error: error.message
        });
    }
};
