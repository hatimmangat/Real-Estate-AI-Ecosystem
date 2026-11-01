import ContractorFees from '../models/contractorFees.model.js';

export const getContractorFees = async (req, res) => {
    try {
        const fees = await ContractorFees.find({ isActive: true }).sort({ location: 1 });
        const countNumber = fees.length > 0 ? fees[0].countNumber : 0;
        res.status(200).json({
            message: 'Contractor fees fetched successfully',
            fees,
            countNumber
        });
    } catch (error) {
        console.error('Error fetching contractor fees:', error);
        res.status(500).json({
            message: 'Error fetching contractor fees',
            error: error.message
        });
    }
};

export const addContractorFee = async (req, res) => {
    try {
        const { greyLabourRate, finishLabourRate, greyContractorFee, finishContractorFee } = req.body;

        if (greyLabourRate === undefined || finishLabourRate === undefined ||
            greyContractorFee === undefined || finishContractorFee === undefined) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const currentCount = await ContractorFees.countDocuments({ isActive: true });
        const newCountNumber = currentCount + 1;

        const newFee = new ContractorFees({
            countNumber: newCountNumber,
            greyLabourRate: parseFloat(greyLabourRate),
            finishLabourRate: parseFloat(finishLabourRate),
            greyContractorFee: parseFloat(greyContractorFee),
            finishContractorFee: parseFloat(finishContractorFee)
        });

        await newFee.save();

        res.status(201).json({
            message: 'Contractor fee added successfully',
            fee: newFee,
            countNumber: newCountNumber
        });
    } catch (error) {
        console.error('Error adding contractor fee:', error);
        res.status(500).json({
            message: 'Error adding contractor fee',
            error: error.message
        });
    }
};

export const updateContractorFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { greyLabourRate, finishLabourRate, greyContractorFee, finishContractorFee } = req.body;

        if (greyLabourRate === undefined || finishLabourRate === undefined ||
            greyContractorFee === undefined || finishContractorFee === undefined) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const updatedFee = await ContractorFees.findByIdAndUpdate(
            id,
            {
                greyLabourRate: parseFloat(greyLabourRate),
                finishLabourRate: parseFloat(finishLabourRate),
                greyContractorFee: parseFloat(greyContractorFee),
                finishContractorFee: parseFloat(finishContractorFee)
            },
            { new: true }
        );

        if (!updatedFee) {
            return res.status(404).json({
                message: 'Contractor fee not found'
            });
        }

        res.status(200).json({
            message: 'Contractor fee updated successfully',
            fee: updatedFee
        });
    } catch (error) {
        console.error('Error updating contractor fee:', error);
        res.status(500).json({
            message: 'Error updating contractor fee',
            error: error.message
        });
    }
};

export const deleteContractorFee = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedFee = await ContractorFees.findByIdAndDelete(id);

        if (!deletedFee) {
            return res.status(404).json({
                message: 'Contractor fee not found'
            });
        }

        // Get remaining count of active fees
        const remainingCount = await ContractorFees.countDocuments({ isActive: true });

        res.status(200).json({
            message: 'Contractor fee deleted successfully',
            countNumber: remainingCount
        });
    } catch (error) {
        console.error('Error deleting contractor fee:', error);
        res.status(500).json({
            message: 'Error deleting contractor fee',
            error: error.message
        });
    }
};
