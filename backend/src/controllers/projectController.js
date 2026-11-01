import Project from '../models/project.model.js';
import Company from '../models/companies.model.js';
import { deleteImagesFromSupabase } from '../config/supabase.js';

export const createProject = async (req, res) => {
    try {
        const userId = req.user.userId;

        let projectData = { ...req.body, userId };

        // For agents, require company profile
        if (req.user.role === 'agent') {
            const company = await Company.findOne({ userId });
            if (!company) {
                return res.status(404).json({
                    success: false,
                    message: 'Company profile not found. Please create a company profile first.'
                });
            }
            projectData.companyId = company._id;
        }

        if (projectData.cost) {
            if (typeof projectData.cost === 'string') {
                const costValue = parseFloat(projectData.cost);
                if (isNaN(costValue) || costValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid project cost. Cost must be a positive number.'
                    });
                }
                projectData.cost = costValue;
            } else if (typeof projectData.cost === 'number') {
                if (isNaN(projectData.cost) || projectData.cost <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid project cost. Cost must be a positive number.'
                    });
                }
            }
        }

        const project = await Project.create(projectData);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.userId;

        const projects = await Project.find({ userId })
            .populate({
                path: 'companyId',
                select: 'companyTitle city',
                optional: true
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get my projects error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getAllProjects = async (req, res) => {
    try {
        const { city, projectType, status, featured, userId } = req.query;
        const filter = {};

        if (city) filter.city = city;
        if (projectType) filter.projectType = projectType;
        if (status) filter.status = status;
        if (featured) filter.featured = featured === 'true';
        if (userId) filter.userId = userId;

        const projects = await Project.find(filter)
            .populate('companyId', 'companyTitle city agencyLogo')
            .populate('userId', 'fullName email phoneNumber')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findById(id)
            .populate('companyId', 'companyTitle city email mobile agencyLogo website')
            .populate('userId', 'fullName email phoneNumber');

        if (!project) {
            return res.status(404).json({
                message: 'Project not found'
            });
        }

        project.views += 1;
        await project.save();

        res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error('Get project by ID error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

export const getProjectsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;

        const projects = await Project.find({ companyId })
            .populate('companyId', 'companyTitle city agencyLogo')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get projects by company error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
export const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const project = await Project.findOne({ _id: id, userId });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have permission to update it'
            });
        }

        const oldImages = project.images || [];
        const newImages = req.body.images || [];

        const imagesToDelete = oldImages.filter(oldImage => !newImages.includes(oldImage));

        if (imagesToDelete.length > 0) {
            console.log(`Deleting ${imagesToDelete.length} old project images`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(imagesToDelete);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        let updateData = { ...req.body };

        if (updateData.cost) {
            if (typeof updateData.cost === 'string') {
                const costValue = parseFloat(updateData.cost);
                if (isNaN(costValue) || costValue <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid project cost. Cost must be a positive number.'
                    });
                }
                updateData.cost = costValue;
            } else if (typeof updateData.cost === 'number') {
                if (isNaN(updateData.cost) || updateData.cost <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid project cost. Cost must be a positive number.'
                    });
                }
            }
        }

        const updatedProject = await Project.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            project: updatedProject
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const project = await Project.findOne({ _id: id, userId });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found or you do not have permission to delete it'
            });
        }

        if (project.images && project.images.length > 0) {
            console.log(`Deleting ${project.images.length} images for project ${id}`);
            const { successCount, failureCount } = await deleteImagesFromSupabase(project.images);
            console.log(`Image deletion result - Success: ${successCount}, Failed: ${failureCount}`);
        }

        await Project.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Project and all associated images deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};
